import "server-only";

import {
  createMorningDeliveryNoticeMessage,
  pushLineMessages,
} from "@/lib/line/messaging";
import { createRecipientUrl } from "@/lib/line/recipient-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DeliveryTimeSlot } from "@/lib/constants/time-slots";

type MorningDeliveryRow = {
  id: string;
  recipient_id: string;
  tracking_number: string;
  delivery_time_slot: DeliveryTimeSlot;
  morning_notification_sent_at: string | null;
};

export async function sendMorningNotifications(runId: string) {
  const supabase = createSupabaseAdminClient();
  const [runResult, deliveriesResult, recipientsResult] = await Promise.all([
    supabase
      .from("delivery_runs")
      .select("delivery_date")
      .eq("id", runId)
      .maybeSingle(),
    supabase
      .from("deliveries")
      .select(
        "id,recipient_id,tracking_number,delivery_time_slot,morning_notification_sent_at",
      )
      .eq("run_id", runId)
      .in("status", ["pending", "out_for_delivery"]),
    supabase.from("recipient_accounts").select("id,line_user_id"),
  ]);

  const firstError =
    runResult.error ?? deliveriesResult.error ?? recipientsResult.error;
  if (firstError) throw firstError;
  if (!runResult.data) throw new Error("RUN_NOT_FOUND");

  const lineUsers = new Map(
    (
      (recipientsResult.data ?? []) as Array<{
        id: string;
        line_user_id: string | null;
      }>
    ).map((recipient) => [recipient.id, recipient.line_user_id]),
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const delivery of (deliveriesResult.data ??
    []) as MorningDeliveryRow[]) {
    const lineUserId = lineUsers.get(delivery.recipient_id);
    if (!lineUserId || delivery.morning_notification_sent_at) {
      skipped += 1;
      continue;
    }

    const claimedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await supabase
      .from("deliveries")
      .update({ morning_notification_sent_at: claimedAt })
      .eq("id", delivery.id)
      .is("morning_notification_sent_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claimed) {
      skipped += 1;
      continue;
    }

    try {
      await pushLineMessages(lineUserId, [
        createMorningDeliveryNoticeMessage({
          deliveryId: delivery.id,
          trackingNumber: delivery.tracking_number,
          deliveryDate: runResult.data.delivery_date,
          timeSlot: delivery.delivery_time_slot,
          recipientUrl: createRecipientUrl(delivery.id),
        }),
      ]);
      sent += 1;
    } catch (error) {
      failed += 1;
      await supabase
        .from("deliveries")
        .update({ morning_notification_sent_at: null })
        .eq("id", delivery.id)
        .eq("morning_notification_sent_at", claimedAt);
      console.error("Failed to send morning LINE notification", {
        deliveryId: delivery.id,
        error,
      });
    }
  }

  return { sent, skipped, failed };
}
