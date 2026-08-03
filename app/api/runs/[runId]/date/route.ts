import { NextResponse } from "next/server";
import { optimizeDeliveryRun } from "@/lib/routing/optimize-run";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deliveryDateRequestSchema } from "@/lib/validation/delivery";

type RouteContext = { params: Promise<{ runId: string }> };

function todayInJapan() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function PATCH(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "JSON形式が不正です。" },
      { status: 400 },
    );
  }

  const parsed = deliveryDateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "配送日はYYYY-MM-DD形式で指定してください。" },
      { status: 400 },
    );
  }

  if (parsed.data.deliveryDate < todayInJapan()) {
    return NextResponse.json(
      { message: "過去の日付には変更できません。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const result = await supabase.rpc("change_run_delivery_date", {
      p_run_id: runId,
      p_delivery_date: parsed.data.deliveryDate,
    });

    if (result.error) {
      if (result.error.message.includes("RUN_NOT_FOUND")) {
        return NextResponse.json(
          { message: "配送便が見つかりません。" },
          { status: 404 },
        );
      }
      if (result.error.message.includes("RUN_COMPLETED")) {
        return NextResponse.json(
          { message: "完了した配送便の日付は変更できません。" },
          { status: 409 },
        );
      }
      throw result.error;
    }

    const optimization = await optimizeDeliveryRun(
      runId,
      "delivery-date-changed",
    );

    return NextResponse.json({
      runId,
      deliveryDate: parsed.data.deliveryDate,
      optimization,
    });
  } catch (error) {
    console.error("Failed to change delivery date", { runId, error });
    return NextResponse.json(
      { message: "配送日を変更できませんでした。" },
      { status: 500 },
    );
  }
}
