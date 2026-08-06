import { NextResponse } from "next/server";
import { optimizeDeliveryRun } from "@/lib/routing/optimize-run";
import {
  getTimeSlot,
  resolveRequestedDeliveryWindow,
} from "@/lib/scheduling/time-slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deliveryWindowRequestSchema } from "@/lib/validation/delivery";
import { isRecipientRequestAuthorized } from "@/lib/security/recipient-link";
import type { Carrier } from "@/types/delivery";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { deliveryId } = await context.params;
  if (!isRecipientRequestAuthorized(request, deliveryId)) {
    return NextResponse.json(
      { message: "リンクが無効か、期限切れです。" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "JSON形式が不正です。" },
      { status: 400 },
    );
  }

  const parsed = deliveryWindowRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "日付と時間帯を確認してください。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const deliveryResult = await supabase
      .from("deliveries")
      .select("run_id,carrier")
      .eq("id", deliveryId)
      .maybeSingle();
    if (deliveryResult.error) throw deliveryResult.error;
    if (!deliveryResult.data) {
      return NextResponse.json(
        { message: "荷物が見つかりません。" },
        { status: 404 },
      );
    }

    const carrier = deliveryResult.data.carrier as Carrier;
    if (!getTimeSlot(carrier, parsed.data.windowCode)) {
      return NextResponse.json(
        { message: "この配送会社では選択できない時間帯です。" },
        { status: 400 },
      );
    }

    let window;
    try {
      window = resolveRequestedDeliveryWindow({
        deliveryDate: parsed.data.deliveryDate,
        carrier,
        windowCode: parsed.data.windowCode,
      });
    } catch (windowError) {
      if (
        windowError instanceof Error &&
        windowError.message === "PAST_DELIVERY_WINDOW"
      ) {
        return NextResponse.json(
          { message: "過去の日時は指定できません。" },
          { status: 400 },
        );
      }
      throw windowError;
    }
    const updateResult = await supabase.rpc("change_delivery_window", {
      p_delivery_id: deliveryId,
      p_expected_version: parsed.data.version,
      p_window_code: window.code,
      p_window_start: window.start.toISOString(),
      p_window_end: window.end.toISOString(),
    });
    if (updateResult.error) {
      if (updateResult.error.message.includes("VERSION_CONFLICT")) {
        return NextResponse.json(
          {
            message: "別の操作で更新されました。画面を再読み込みしてください。",
          },
          { status: 409 },
        );
      }
      throw updateResult.error;
    }

    const optimization = await optimizeDeliveryRun(
      deliveryResult.data.run_id,
      `window-change:${deliveryId}:${window.deliveryDate}:${window.code}`,
    );
    return NextResponse.json({
      window: {
        code: window.code,
        label: window.label,
        start: window.start.toISOString(),
        end: window.end.toISOString(),
        availableFrom: window.availableFrom.toISOString(),
        deliveryDate: window.deliveryDate,
      },
      optimization,
    });
  } catch (error) {
    console.error("Failed to change delivery window", { deliveryId, error });
    return NextResponse.json(
      { message: "配達時間帯を変更できませんでした。" },
      { status: 500 },
    );
  }
}
