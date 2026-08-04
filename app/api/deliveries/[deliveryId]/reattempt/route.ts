import { NextResponse } from "next/server";
import { optimizeDeliveryRun } from "@/lib/routing/optimize-run";
import {
  getTimeSlot,
  resolveRequestedDeliveryWindow,
} from "@/lib/scheduling/time-slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reattemptRequestSchema } from "@/lib/validation/delivery";
import type { Carrier } from "@/types/delivery";
import { isRecipientRequestAuthorized } from "@/lib/security/recipient-link";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = reattemptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "再配達の日付と時間帯を確認してください。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const deliveryResult = await supabase
      .from("deliveries")
      .select("run_id,carrier,status,is_reattempt")
      .eq("id", deliveryId)
      .maybeSingle();
    if (deliveryResult.error) throw deliveryResult.error;
    if (!deliveryResult.data) {
      return NextResponse.json(
        { message: "荷物が見つかりません。" },
        { status: 404 },
      );
    }

    if (
      deliveryResult.data.status !== "absent" &&
      !deliveryResult.data.is_reattempt
    ) {
      return NextResponse.json(
        { message: "不在登録後に再配達日時を指定できます。" },
        { status: 409 },
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
    const scheduleResult = await supabase.rpc("schedule_delivery_reattempt", {
      p_delivery_id: deliveryId,
      p_expected_version: parsed.data.version,
      p_available_at: window.availableFrom.toISOString(),
      p_window_code: window.code,
      p_window_start: window.start.toISOString(),
      p_window_end: window.end.toISOString(),
    });

    if (scheduleResult.error) {
      if (scheduleResult.error.message.includes("VERSION_CONFLICT")) {
        return NextResponse.json(
          {
            message: "別の操作で更新されました。画面を再読み込みしてください。",
          },
          { status: 409 },
        );
      }
      throw scheduleResult.error;
    }

    const optimization = await optimizeDeliveryRun(
      deliveryResult.data.run_id,
      `reattempt:${deliveryId}:${window.deliveryDate}:${window.code}`,
    );
    return NextResponse.json({
      schedule: scheduleResult.data,
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
    console.error("Failed to schedule delivery reattempt", {
      deliveryId,
      error,
    });
    return NextResponse.json(
      { message: "再配達ルートを計算できませんでした。" },
      { status: 500 },
    );
  }
}
