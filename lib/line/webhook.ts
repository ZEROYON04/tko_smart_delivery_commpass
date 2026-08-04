import { createHmac, timingSafeEqual } from "node:crypto";

export type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: { type?: string; userId?: string };
  message?: { type?: string; text?: string };
  postback?: { data?: string };
};

export type LineWebhookBody = { events?: LineWebhookEvent[] };

export type LineMenuCommand =
  "delivery_status" | "change_date" | "redelivery" | "help";

export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret: string,
) {
  if (!signature) return false;

  const expected = createHmac("sha256", channelSecret).update(rawBody).digest();

  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export function extractCustomerCode(text: string | undefined) {
  const match = text?.trim().match(/^初回連携\s+([A-Z0-9-]+)$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function extractMenuCommand(
  text: string | undefined,
): LineMenuCommand | null {
  switch (text?.trim()) {
    case "荷物の確認":
    case "配達状況":
      return "delivery_status";
    case "日時変更":
    case "受取予定変更":
    case "受取予定を変更":
      return "change_date";
    case "再配達":
      return "redelivery";
    case "使い方":
      return "help";
    default:
      return null;
  }
}
