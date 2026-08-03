import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { replyLineMessages } from "@/lib/line/messaging";
import {
  extractCustomerCode,
  type LineWebhookBody,
  type LineWebhookEvent,
  verifyLineSignature,
} from "@/lib/line/webhook";

export const runtime = "nodejs";

async function reply(replyToken: string | undefined, text: string) {
  if (!replyToken) return;
  await replyLineMessages(replyToken, [{ type: "text", text }]);
}

async function handleLink(event: LineWebhookEvent, customerCode: string) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  const supabase = createSupabaseAdminClient();
  const { data: recipient, error: findError } = await supabase
    .from("recipient_accounts")
    .select("id,customer_code,line_user_id")
    .eq("customer_code", customerCode)
    .maybeSingle();

  if (findError) throw findError;
  if (!recipient) {
    await reply(
      event.replyToken,
      `「${customerCode}」に該当する受取人アカウントが見つかりませんでした。コードをご確認ください。`,
    );
    return;
  }

  if (recipient.line_user_id && recipient.line_user_id !== lineUserId) {
    await reply(
      event.replyToken,
      "この受取人アカウントはすでに別のLINEアカウントと連携されています。",
    );
    return;
  }

  const { error: updateError } = await supabase
    .from("recipient_accounts")
    .update({
      line_user_id: lineUserId,
      line_linked_at: new Date().toISOString(),
    })
    .eq("id", recipient.id);

  if (updateError) throw updateError;

  await reply(
    event.replyToken,
    [
      "初回連携が完了しました。",
      `お客様コード：${customerCode}`,
      "今後、このアカウントに登録された荷物を自動でLINEへお知らせします。",
    ].join("\n"),
  );
}

async function handleAvailability(event: LineWebhookEvent) {
  const lineUserId = event.source?.userId;
  const params = new URLSearchParams(event.postback?.data ?? "");
  const action = params.get("action");
  const deliveryId = params.get("deliveryId");

  if (!lineUserId || !deliveryId) return;
  if (
    !["available", "temporarily_unavailable", "unavailable_today"].includes(
      action ?? "",
    )
  )
    return;

  const supabase = createSupabaseAdminClient();
  const { data: delivery, error: findError } = await supabase
    .from("deliveries")
    .select("id,recipient_id")
    .eq("id", deliveryId)
    .maybeSingle();

  if (findError) throw findError;
  if (!delivery) {
    await reply(event.replyToken, "対象の荷物が見つかりません。");
    return;
  }

  const { data: recipient, error: recipientError } = await supabase
    .from("recipient_accounts")
    .select("line_user_id")
    .eq("id", delivery.recipient_id)
    .maybeSingle();

  if (recipientError) throw recipientError;
  if (!recipient || recipient.line_user_id !== lineUserId) {
    await reply(event.replyToken, "この荷物を変更する権限がありません。");
    return;
  }

  if (action === "unavailable_today") {
    const requestedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("deliveries")
      .update({ reschedule_requested_at: requestedAt })
      .eq("id", deliveryId);

    if (updateError) throw updateError;

    await supabase.from("delivery_events").insert({
      delivery_id: deliveryId,
      event_type: "delivery_date_change_requested",
      new_value: { requestedAt },
    });

    await reply(
      event.replyToken,
      "本日受け取れない旨をドライバーへ共有しました。次に、別のお届け日時を指定できます。",
    );
    return;
  }

  const requestedMinutes = Number(params.get("minutes"));
  const minutes = [10, 30].includes(requestedMinutes) ? requestedMinutes : 10;
  const unavailableUntil =
    action === "temporarily_unavailable"
      ? new Date(Date.now() + minutes * 60_000).toISOString()
      : null;

  const { error: updateError } = await supabase
    .from("deliveries")
    .update({ unavailable_until: unavailableUntil })
    .eq("id", deliveryId);

  if (updateError) throw updateError;

  await supabase.from("delivery_events").insert({
    delivery_id: deliveryId,
    event_type:
      action === "temporarily_unavailable"
        ? "temporary_absence_reported"
        : "availability_reported",
    new_value: { unavailableUntil, minutes: unavailableUntil ? minutes : null },
  });

  await reply(
    event.replyToken,
    unavailableUntil
      ? `${minutes}分間の不在予定を受け付けました。ドライバーへ共有します。`
      : "在宅のご連絡を受け付けました。ドライバーへ共有します。",
  );
}

async function handleEvent(event: LineWebhookEvent) {
  if (event.type === "follow") {
    await reply(
      event.replyToken,
      [
        "友だち追加ありがとうございます。",
        "初回連携をするには、次の形式で送信してください。",
        "例：初回連携 USER-A",
      ].join("\n"),
    );
    return;
  }

  if (event.type === "message" && event.message?.type === "text") {
    const customerCode = extractCustomerCode(event.message.text);
    if (customerCode) {
      await handleLink(event, customerCode);
      return;
    }

    await reply(
      event.replyToken,
      "初回連携をする場合は「初回連携 お客様コード」と送信してください。",
    );
    return;
  }

  if (event.type === "postback") {
    await handleAvailability(event);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "LINE webhook" });
}

export async function POST(request: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    return NextResponse.json(
      { message: "LINE_CHANNEL_SECRETが設定されていません。" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    return NextResponse.json({ message: "署名が不正です。" }, { status: 401 });
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json(
      { message: "JSON形式が不正です。" },
      { status: 400 },
    );
  }

  try {
    await Promise.all((body.events ?? []).map(handleEvent));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to handle LINE webhook", error);
    return NextResponse.json(
      { message: "Webhookの処理に失敗しました。" },
      { status: 500 },
    );
  }
}
