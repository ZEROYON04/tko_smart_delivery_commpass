import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createDeliveryPlanMenuMessage,
  createDeliveryStatusMenuMessage,
  type LineMessage,
  replyLineMessages,
} from "@/lib/line/messaging";
import {
  extractCustomerCode,
  extractMenuCommand,
  type LineMenuCommand,
  type LineWebhookBody,
  type LineWebhookEvent,
  verifyLineSignature,
} from "@/lib/line/webhook";
import { createRecipientAccessQuery } from "@/lib/security/recipient-link";

export const runtime = "nodejs";

async function reply(replyToken: string | undefined, text: string) {
  if (!replyToken) return;
  await replyLineMessages(replyToken, [{ type: "text", text }]);
}

async function replyMessages(
  replyToken: string | undefined,
  messages: LineMessage[],
) {
  if (!replyToken) return;
  await replyLineMessages(replyToken, messages);
}

async function findNextDelivery(lineUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: recipients, error: recipientError } = await supabase
    .from("recipient_accounts")
    .select("id")
    .eq("line_user_id", lineUserId);

  if (recipientError) throw recipientError;
  const recipientIds = (recipients ?? []).map((recipient) => recipient.id);
  if (recipientIds.length === 0) return null;

  const { data: deliveries, error: deliveryError } = await supabase
    .from("deliveries")
    .select("id,tracking_number")
    .in("recipient_id", recipientIds)
    .in("status", ["pending", "out_for_delivery"])
    .is("reschedule_requested_at", null);

  if (deliveryError) throw deliveryError;
  if (!deliveries?.length) return null;

  const deliveriesById = new Map(
    deliveries.map((delivery) => [delivery.id, delivery]),
  );
  const { data: stops, error: stopError } = await supabase
    .from("route_stops")
    .select("delivery_id,stop_order")
    .in("delivery_id", [...deliveriesById.keys()])
    .order("stop_order", { ascending: true });

  if (stopError) throw stopError;
  const nextStop = (stops ?? []).find((stop) =>
    deliveriesById.has(stop.delivery_id),
  );
  return nextStop ? (deliveriesById.get(nextStop.delivery_id) ?? null) : null;
}

async function handleMenuCommand(
  event: LineWebhookEvent,
  command: LineMenuCommand,
) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  if (command === "help") {
    await reply(
      event.replyToken,
      [
        "💡 スマ配｜使い方",
        "━━━━━━━━━━━━",
        "",
        "🚚 配達状況",
        "　到着目安や配送順を確認できます。",
        "",
        "🔄 受取予定変更",
        "　在宅・短時間不在・本日受取不可を連絡できます。",
        "",
        "🔗 初回連携",
        "　「初回連携 お客様コード」と送信してください。",
        "　例：初回連携 USER-A",
      ].join("\n"),
    );
    return;
  }

  const delivery = await findNextDelivery(lineUserId);
  if (!delivery) {
    await reply(
      event.replyToken,
      [
        "ℹ️ スマ配｜配達予定",
        "━━━━━━━━━━━━",
        "現在、確認できる配達予定はありません。",
        "",
        "未連携の場合は、",
        "「初回連携 お客様コード」",
        "と送信してください。",
      ].join("\n"),
    );
    return;
  }

  if (command === "change_plan") {
    await replyMessages(event.replyToken, [
      createDeliveryPlanMenuMessage({
        deliveryId: delivery.id,
        trackingNumber: delivery.tracking_number,
      }),
    ]);
    return;
  }

  const publicSiteUrl = (
    process.env.LINE_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  )?.replace(/\/$/, "");
  if (!publicSiteUrl)
    throw new Error("LINE_PUBLIC_SITE_URL is not configured.");
  const accessQuery = createRecipientAccessQuery(delivery.id);

  await replyMessages(event.replyToken, [
    createDeliveryStatusMenuMessage({
      trackingNumber: delivery.tracking_number,
      recipientUrl: `${publicSiteUrl}/recipient/${delivery.id}?${accessQuery}`,
    }),
  ]);
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
      [
        "⚠️ 連携できませんでした",
        "━━━━━━━━━━━━",
        `お客様コード「${customerCode}」が見つかりません。`,
        "コードをご確認ください。",
      ].join("\n"),
    );
    return;
  }

  if (recipient.line_user_id && recipient.line_user_id !== lineUserId) {
    await reply(
      event.replyToken,
      [
        "⚠️ 連携済みです",
        "━━━━━━━━━━━━",
        "この受取人アカウントは、別のLINEアカウントと連携されています。",
      ].join("\n"),
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
      "✅ スマ配｜初回連携完了",
      "━━━━━━━━━━━━",
      `🔗 お客様コード　${customerCode}`,
      "",
      "今後、お届け予定や到着目安をこのLINEへお知らせします。",
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
      [
        "✅ 予定変更を受け付けました",
        "━━━━━━━━━━━━",
        "本日受け取れない旨をドライバーへ共有しました。",
        "日時変更待ちとして登録しました。",
      ].join("\n"),
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
      ? [
          "✅ 短時間不在を受け付けました",
          "━━━━━━━━━━━━",
          `⏱️ 不在予定　${minutes}分間`,
          "ドライバーへ共有しました。",
        ].join("\n")
      : [
          "✅ 在宅連絡を受け付けました",
          "━━━━━━━━━━━━",
          "🏠 在宅予定としてドライバーへ共有しました。",
        ].join("\n"),
  );
}

async function handleEvent(event: LineWebhookEvent) {
  if (event.type === "follow") {
    await reply(
      event.replyToken,
      [
        "📦 スマ配（スマート配送）へようこそ",
        "━━━━━━━━━━━━",
        "",
        "このLINEでできること",
        "🚚 お届け予定・到着目安の確認",
        "🔄 急な予定変更の共有",
        "⏱️ 10分・30分の短時間不在連絡",
        "",
        "はじめに、お客様コードを使って初回連携を行ってください。",
        "",
        "入力例：初回連携 USER-A",
        "",
        "※連携は初回の1回だけです。",
      ].join("\n"),
    );
    return;
  }

  if (event.type === "message" && event.message?.type === "text") {
    const menuCommand = extractMenuCommand(event.message.text);
    if (menuCommand) {
      await handleMenuCommand(event, menuCommand);
      return;
    }

    const customerCode = extractCustomerCode(event.message.text);
    if (customerCode) {
      await handleLink(event, customerCode);
      return;
    }

    await reply(
      event.replyToken,
      [
        "💡 メニューから操作してください",
        "━━━━━━━━━━━━",
        "初回連携の場合は、",
        "「初回連携 お客様コード」",
        "と送信してください。",
      ].join("\n"),
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
