import { NextResponse } from "next/server";
import { getRunResponse } from "@/lib/data/deliveries";

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { runId } = await context.params;

  try {
    const response = await getRunResponse(runId);

    if (!response) {
      return NextResponse.json(
        { message: "配送コースが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch delivery run", { runId, error });
    return NextResponse.json(
      { message: "配送コースを取得できませんでした。" },
      { status: 500 },
    );
  }
}
