import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { runId } = await context.params;

  try {
    const supabase = createSupabaseAdminClient();
    const { data: run, error: updateError } = await supabase
      .from("delivery_runs")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
        current_stop_order: 1,
      })
      .eq("id", runId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }
    if (!run) {
      return NextResponse.json(
        { message: "配送コースが見つかりません。" },
        { status: 404 },
      );
    }

    const { error: etaError } = await supabase.rpc("recalculate_run_eta", {
      p_run_id: runId,
    });

    if (etaError) {
      throw etaError;
    }

    return NextResponse.json({ runId, status: "active" });
  } catch (error) {
    console.error("Failed to start delivery run", { runId, error });
    return NextResponse.json(
      { message: "配送を開始できませんでした。" },
      { status: 500 },
    );
  }
}
