import "server-only";

import { createRecipientAccessQuery } from "@/lib/security/recipient-link";

export type RecipientView = "overview" | "schedule" | "redelivery";

export function createRecipientUrl(
  deliveryId: string,
  view: RecipientView = "overview",
) {
  const publicSiteUrl = (
    process.env.LINE_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  )?.replace(/\/$/, "");

  if (!publicSiteUrl) {
    throw new Error("LINE_PUBLIC_SITE_URL is not configured.");
  }

  const accessQuery = createRecipientAccessQuery(deliveryId);
  accessQuery.set("view", view);
  const anchor = view === "overview" ? "" : `#${view}`;
  return `${publicSiteUrl}/recipient/${deliveryId}?${accessQuery}${anchor}`;
}
