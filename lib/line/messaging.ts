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
      "【スマート配送コンパス】本日、荷物をお届けします。",
      `お問い合わせ番号：${trackingNumber}`,
      "",
      `現在、あなたの前にあと${remainingStops}件です。`,
      `到着まで約${estimatedMinutes}分の見込みです。`,
      "",
      "急な予定がある場合は、下のボタンでお知らせください。",
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
      "【スマート配送コンパス】本日、荷物をお届けします。",
      `お届け日：${formattedDate}`,
      `お届け時間帯：${DELIVERY_TIME_SLOT_LABELS[timeSlot]}`,
      `お問い合わせ番号：${trackingNumber}`,
      "",
      "本日受け取れない場合は、下のボタンからお知らせください。",
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
