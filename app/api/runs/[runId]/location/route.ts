import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { locationRequestSchema } from "@/lib/validation/delivery";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = locationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "位置情報が不正です。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("driver_locations").insert({
      run_id: runId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { message: "配送コースが見つかりません。" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "現在地を更新しました。" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to update driver location", { runId, error });
    return NextResponse.json(
      { message: "現在地を更新できませんでした。" },
      { status: 500 },
    );
  }
}
