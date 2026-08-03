import { createHmac, timingSafeEqual } from "node:crypto";

export type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: { type?: string; userId?: string };
  message?: { type?: string; text?: string };
  postback?: { data?: string };
};

export type LineWebhookBody = { events?: LineWebhookEvent[] };

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
