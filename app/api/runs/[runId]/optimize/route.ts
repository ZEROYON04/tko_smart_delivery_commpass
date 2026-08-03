import { NextResponse } from "next/server";
import { optimizeDeliveryRun } from "@/lib/routing/optimize-run";
import { optimizeRunRequestSchema } from "@/lib/validation/delivery";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  let body: unknown = {};

  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { message: "JSON形式が不正です。" },
      { status: 400 },
    );
  }

  const parsed = optimizeRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "入力内容を確認してください。" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await optimizeDeliveryRun(
        runId,
        parsed.data.reason ?? "manual-route-optimization",
      ),
    );
  } catch (error) {
    console.error("Failed to optimize delivery route", { runId, error });
    const message = error instanceof Error ? error.message : "";
    if (message.includes("RUN_NOT_FOUND")) {
      return NextResponse.json(
        { message: "配送コースが見つかりません。" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "配送ルートを最適化できませんでした。" },
      { status: 500 },
    );
  }
}
