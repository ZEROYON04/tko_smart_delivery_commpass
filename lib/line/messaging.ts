import "server-only";

import { DELIVERY_TIME_SLOT_LABELS } from "@/lib/constants/time-slots";
import type { DeliveryTimeSlot } from "@/lib/constants/time-slots";

const LINE_MESSAGE_ENDPOINT = "https://api.line.me/v2/bot/message";

export type LineMessage =
  | { type: "text"; text: string; quickReply?: LineQuickReply }
  | { type: "text"; text: string };

type LineQuickReply = {
  items: Array<{
    type: "action";
    action:
      | {
          type: "postback";
          label: string;
          data: string;
          displayText: string;
        }
      | {
          type: "uri";
          label: string;
          uri: string;
        };
  }>;
};

function getChannelAccessToken() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured.");
  }

  return token;
}

async function requestLine(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${LINE_MESSAGE_ENDPOINT}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getChannelAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LINE API request failed (${response.status}): ${details}`);
  }
}

export async function pushLineMessages(to: string, messages: LineMessage[]) {
  await requestLine("push", { to, messages });
}

export async function replyLineMessages(
  replyToken: string,
  messages: LineMessage[],
) {
  await requestLine("reply", { replyToken, messages });
}

export function createDeliveryNoticeMessage({
  deliveryId,
  trackingNumber,
  remainingStops,
  estimatedMinutes,
}: {
  deliveryId: string;
  trackingNumber: string;
  remainingStops: number;
  estimatedMinutes: number;
}): LineMessage {
  return {
    type: "text",
    text: [
      "🚚 スマ配｜まもなくお届け",
      "━━━━━━━━━━━━",
      `📦 荷物番号　${trackingNumber}`,
      "",
      `📍 あと ${remainingStops}件`,
      `⏱️ 到着まで 約${estimatedMinutes}分`,
      "",
      "現在の状況を下のボタンからお知らせください。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "在宅しています",
            data: new URLSearchParams({
              action: "available",
              deliveryId,
            }).toString(),
            displayText: "在宅しています",
          },
        },
        ...[10, 30].map((minutes) => ({
          type: "action" as const,
          action: {
            type: "postback" as const,
            label: `${minutes}分不在`,
            data: new URLSearchParams({
              action: "temporarily_unavailable",
              deliveryId,
              minutes: String(minutes),
            }).toString(),
            displayText: `${minutes}分ほど不在です`,
          },
        })),
      ],
    },
  };
}

export function createMorningDeliveryNoticeMessage({
  deliveryId,
  trackingNumber,
  deliveryDate,
  timeSlot,
  recipientUrl,
}: {
  deliveryId: string;
  trackingNumber: string;
  deliveryDate: string;
  timeSlot: DeliveryTimeSlot;
  recipientUrl: string;
}): LineMessage {
  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${deliveryDate}T00:00:00+09:00`));

  return {
    type: "text",
    text: [
      "📦 スマ配｜本日のお届け",
      "━━━━━━━━━━━━",
      `📅 お届け日　${formattedDate}`,
      `🕐 時間帯　　${DELIVERY_TIME_SLOT_LABELS[timeSlot]}`,
      `🔢 荷物番号　${trackingNumber}`,
      "",
      "配達状況の確認や予定変更は、下のボタンから行えます。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "uri",
            label: "配達状況を確認",
            uri: recipientUrl,
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "今日は受け取れない",
            data: new URLSearchParams({
              action: "unavailable_today",
              deliveryId,
            }).toString(),
            displayText: "今日は受け取れません",
          },
        },
      ],
    },
  };
}

export function createDeliveryStatusMenuMessage({
  trackingNumber,
  recipientUrl,
}: {
  trackingNumber: string;
  recipientUrl: string;
}): LineMessage {
  return {
    type: "text",
    text: [
      "🚚 スマ配｜配達状況",
      "━━━━━━━━━━━━",
      `📦 荷物番号　${trackingNumber}`,
      "",
      "到着目安・配送順・受取方法を確認できます。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "uri",
            label: "配達状況を開く",
            uri: recipientUrl,
          },
        },
      ],
    },
  };
}

export function createDeliveryDateChangeMenuMessage({
  trackingNumber,
  recipientUrl,
}: {
  trackingNumber: string;
  recipientUrl: string;
}): LineMessage {
  return {
    type: "text",
    text: [
      "📅 スマ配｜日時変更",
      "━━━━━━━━━━━━",
      `📦 荷物番号　${trackingNumber}`,
      "",
      "初回配達前のお届け時間帯を変更できます。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "uri",
            label: "日時を変更する",
            uri: recipientUrl,
          },
        },
      ],
    },
  };
}

export function createRedeliveryMenuMessage({
  trackingNumber,
  recipientUrl,
}: {
  trackingNumber: string;
  recipientUrl: string;
}): LineMessage {
  return {
    type: "text",
    text: [
      "🔁 スマ配｜再配達",
      "━━━━━━━━━━━━",
      `📦 荷物番号　${trackingNumber}`,
      "",
      "不在となった荷物の再配達予定を設定できます。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "uri",
            label: "再配達を申し込む",
            uri: recipientUrl,
          },
        },
      ],
    },
  };
}

export function createAbsentRedeliveryGuideMessage({
  trackingNumber,
  recipientUrl,
}: {
  trackingNumber: string;
  recipientUrl: string;
}): LineMessage {
  return {
    type: "text",
    text: [
      "📭 スマ配｜ご不在のお知らせ",
      "━━━━━━━━━━━━",
      `📦 荷物番号　${trackingNumber}`,
      "",
      "お伺いしましたが、ご不在のため荷物を持ち戻りました。",
      "下のボタンから、ご都合のよい再配達日時を指定してください。",
    ].join("\n"),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "uri",
            label: "再配達日時を選ぶ",
            uri: recipientUrl,
          },
        },
      ],
    },
  };
}
