import { NextResponse } from "next/server";
import { optimizeDeliveryRun } from "@/lib/routing/optimize-run";
import {
  getTimeSlot,
  resolveReattemptWindow,
} from "@/lib/scheduling/time-slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deliveryWindowRequestSchema } from "@/lib/validation/delivery";
import type { Carrier } from "@/types/delivery";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { deliveryId } = await context.params;
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
      { message: "時間帯を確認してください。" },
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

    const runResult = await supabase
      .from("delivery_runs")
      .select("delivery_date")
      .eq("id", deliveryResult.data.run_id)
      .single();
    if (runResult.error) throw runResult.error;

    const window = resolveReattemptWindow({
      deliveryDate: runResult.data.delivery_date,
      carrier,
      currentWindowCode: null,
      preferredWindowCode: parsed.data.windowCode,
      returnAt: new Date(),
    });
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
      `window-change:${deliveryId}:${window.code}`,
    );
    return NextResponse.json({ window, optimization });
  } catch (error) {
    console.error("Failed to change delivery window", { deliveryId, error });
    return NextResponse.json(
      { message: "配達時間帯を変更できませんでした。" },
      { status: 500 },
    );
  }
}
