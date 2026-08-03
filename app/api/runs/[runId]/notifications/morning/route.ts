import { NextResponse } from "next/server";
import { sendMorningNotifications } from "@/lib/notifications/morning";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (
      !cronSecret ||
      request.headers.get("authorization") !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        { message: "権限がありません。" },
        { status: 401 },
      );
    }
  }

  const { runId } = await context.params;

  try {
    const result = await sendMorningNotifications(runId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to run morning notifications", { runId, error });
    return NextResponse.json(
      { message: "朝のLINE通知を実行できませんでした。" },
      { status: 500 },
    );
  }
}
