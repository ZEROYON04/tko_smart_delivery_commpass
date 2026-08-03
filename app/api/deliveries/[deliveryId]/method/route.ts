import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  deliveryMethodRequestSchema,
  methodResultSchema,
} from "@/lib/validation/delivery";
import { isRecipientRequestAuthorized } from "@/lib/security/recipient-link";

type RouteContext = { params: Promise<{ deliveryId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { deliveryId } = await context.params;
  let body: unknown;

  if (!isRecipientRequestAuthorized(request, deliveryId)) {
    return NextResponse.json(
      { message: "リンクが無効か、期限切れです。" },
      { status: 403 },
    );
  }

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "JSON形式が不正です。" },
      { status: 400 },
    );
  }

  const parsed = deliveryMethodRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "入力内容を確認してください。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc(
      "change_delivery_method_details",
      {
        p_delivery_id: deliveryId,
        p_method: parsed.data.method,
        p_dropoff_location: parsed.data.dropoffLocation ?? null,
        p_expected_version: parsed.data.version,
      },
    );

    if (error) {
      if (error.message.includes("VERSION_CONFLICT")) {
        return NextResponse.json(
          {
            message: "別の操作で更新されました。画面を再読み込みしてください。",
          },
          { status: 409 },
        );
      }
      if (error.message.includes("DELIVERY_NOT_FOUND")) {
        return NextResponse.json(
          { message: "荷物が見つかりません。" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json(methodResultSchema.parse(data));
  } catch (error) {
    console.error("Failed to change delivery method", { deliveryId, error });
    return NextResponse.json(
      { message: "受取方法を変更できませんでした。" },
      { status: 500 },
    );
  }
}
