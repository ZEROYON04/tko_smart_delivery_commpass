import { NextResponse } from "next/server";
import { getRecipientDelivery } from "@/lib/data/deliveries";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { deliveryId } = await context.params;

  try {
    const response = await getRecipientDelivery(deliveryId);

    if (!response) {
      return NextResponse.json(
        { message: "荷物が見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch recipient delivery", { deliveryId, error });
    return NextResponse.json(
      { message: "荷物情報を取得できませんでした。" },
      { status: 500 },
    );
  }
}
