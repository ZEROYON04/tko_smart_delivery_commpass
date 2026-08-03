import { createHmac, timingSafeEqual } from "node:crypto";

const LINK_LIFETIME_SECONDS = 36 * 60 * 60;

function getSigningSecret() {
  const secret =
    process.env.RECIPIENT_LINK_SECRET ?? process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    throw new Error("RECIPIENT_LINK_SECRET is not configured.");
  }

  return secret;
}

function sign(deliveryId: string, expires: string) {
  return createHmac("sha256", getSigningSecret())
    .update(`${deliveryId}.${expires}`)
    .digest("base64url");
}

export function createRecipientAccessQuery(
  deliveryId: string,
  now = Date.now(),
) {
  const expires = String(Math.floor(now / 1000) + LINK_LIFETIME_SECONDS);
  return new URLSearchParams({ expires, signature: sign(deliveryId, expires) });
}

export function verifyRecipientAccess({
  deliveryId,
  expires,
  signature,
  now = Date.now(),
}: {
  deliveryId: string;
  expires: string | null;
  signature: string | null;
  now?: number;
}) {
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < Math.floor(now / 1000)) return false;

  const expected = Buffer.from(sign(deliveryId, expires));
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function isPublicRecipientRequest(request: Request) {
  return request.headers.get("x-smart-delivery-public") === "1";
}

export function isRecipientRequestAuthorized(
  request: Request,
  deliveryId: string,
) {
  if (!isPublicRecipientRequest(request)) return true;

  const url = new URL(request.url);
  return verifyRecipientAccess({
    deliveryId,
    expires: url.searchParams.get("expires"),
    signature: url.searchParams.get("signature"),
  });
}
