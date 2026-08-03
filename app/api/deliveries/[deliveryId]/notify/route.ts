import { NextResponse } from "next/server";
import {
  createDeliveryNoticeMessage,
  pushLineMessages,
} from "@/lib/line/messaging";
import { getRunResponse } from "@/lib/data/deliveries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { deliveryId } = await context.params;

  try {
    const supabase = createSupabaseAdminClient();
    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select("id,run_id,recipient_id,tracking_number")
      .eq("id", deliveryId)
      .maybeSingle();

    if (error) throw error;
    if (!delivery) {
      return NextResponse.json(
        { message: "荷物が見つかりません。" },
        { status: 404 },
      );
    }
    const { data: recipient, error: recipientError } = await supabase
      .from("recipient_accounts")
      .select("line_user_id")
      .eq("id", delivery.recipient_id)
      .maybeSingle();

    if (recipientError) throw recipientError;
    if (!recipient?.line_user_id) {
      return NextResponse.json(
        { message: "この荷物はLINEと連携されていません。" },
        { status: 409 },
      );
    }

    const run = await getRunResponse(delivery.run_id);
    const target = run?.stops.find((stop) => stop.delivery.id === deliveryId);
    if (!run || !target) {
      return NextResponse.json(
        { message: "配送コースが見つかりません。" },
        { status: 404 },
      );
    }

    const pendingThroughTarget = run.stops.filter(
      (stop) =>
        stop.stopOrder <= target.stopOrder &&
        !["delivered", "cancelled"].includes(stop.delivery.status),
    );
    const remainingStops = Math.max(0, pendingThroughTarget.length - 1);
    const estimatedSeconds = pendingThroughTarget.reduce(
      (total, stop, index) =>
        total +
        stop.durationSeconds +
        (index < pendingThroughTarget.length - 1
          ? stop.delivery.serviceSeconds
          : 0),
      0,
    );
    const estimatedMinutes = Math.max(1, Math.round(estimatedSeconds / 60));

    await pushLineMessages(recipient.line_user_id, [
      createDeliveryNoticeMessage({
        deliveryId,
        trackingNumber: delivery.tracking_number,
        remainingStops,
        estimatedMinutes,
      }),
    ]);

    await supabase.from("delivery_events").insert({
      delivery_id: deliveryId,
      event_type: "line_delivery_notice_sent",
      new_value: { remainingStops, estimatedMinutes },
    });

    return NextResponse.json({
      message: "LINEへ配送通知を送信しました。",
      remainingStops,
      estimatedMinutes,
    });
  } catch (error) {
    console.error("Failed to send LINE delivery notice", {
      deliveryId,
      error,
    });
    return NextResponse.json(
      { message: "LINE通知を送信できませんでした。" },
      { status: 500 },
    );
  }
}
