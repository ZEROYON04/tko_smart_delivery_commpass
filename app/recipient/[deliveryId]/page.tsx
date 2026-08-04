import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { DeliveryMethodForm } from "@/components/recipient/delivery-method-form";
import { getRecipientDelivery } from "@/lib/data/deliveries";
import { verifyRecipientAccess } from "@/lib/security/recipient-link";

type RecipientPageProps = {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<{
    expires?: string;
    signature?: string;
    view?: string;
  }>;
};

export default async function RecipientPage({
  params,
  searchParams,
}: RecipientPageProps) {
  const { deliveryId } = await params;
  const query = await searchParams;
  const requestHeaders = await headers();
  const isPublicRequest = requestHeaders.get("x-smart-delivery-public") === "1";

  if (
    isPublicRequest &&
    !verifyRecipientAccess({
      deliveryId,
      expires: query.expires ?? null,
      signature: query.signature ?? null,
    })
  ) {
    notFound();
  }

  const initialData = await getRecipientDelivery(deliveryId);

  if (!initialData) {
    notFound();
  }

  return (
    <DeliveryMethodForm
      accessQuery={
        query.expires && query.signature
          ? new URLSearchParams({
              expires: query.expires,
              signature: query.signature,
            }).toString()
          : ""
      }
      deliveryId={deliveryId}
      initialData={initialData}
      initialView={
        query.view === "schedule" || query.view === "redelivery"
          ? query.view
          : "overview"
      }
    />
  );
}

export const dynamic = "force-dynamic";
