import { notFound } from "next/navigation";
import { DeliveryMethodForm } from "@/components/recipient/delivery-method-form";
import { getRecipientDelivery } from "@/lib/data/deliveries";

type RecipientPageProps = {
  params: Promise<{ deliveryId: string }>;
};

export default async function RecipientPage({ params }: RecipientPageProps) {
  const { deliveryId } = await params;
  const initialData = await getRecipientDelivery(deliveryId);

  if (!initialData) {
    notFound();
  }

  return (
    <DeliveryMethodForm deliveryId={deliveryId} initialData={initialData} />
  );
}

export const dynamic = "force-dynamic";
