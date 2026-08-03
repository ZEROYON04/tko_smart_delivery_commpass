"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import {
  formatEta,
  formatRelativeArrival,
  formatServiceTime,
} from "@/lib/format/delivery";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  DeliveryMethod,
  RecipientDeliveryResponse,
} from "@/types/delivery";

export function DeliveryMethodForm({
  deliveryId,
  initialData,
}: {
  deliveryId: string;
  initialData: RecipientDeliveryResponse;
}) {
  const [data, setData] = useState<RecipientDeliveryResponse | null>(
    initialData,
  );
  const [updating, setUpdating] = useState<DeliveryMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDelivery = useCallback(async () => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "荷物情報を取得できませんでした。",
        );
      }

      setData(body as RecipientDeliveryResponse);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "読み込みに失敗しました。",
      );
    }
  }, [deliveryId]);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`recipient-delivery-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        () => void loadDelivery(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deliveryId, loadDelivery]);

  async function changeMethod(method: DeliveryMethod) {
    if (!data || method === data.delivery.deliveryMethod) return;

    setUpdating(method);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/method`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, version: data.delivery.version }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "受取方法を変更できませんでした。",
        );
      }

      await loadDelivery();
      setSuccess(
        method === "dropoff"
          ? "置き配へ変更しました。ドライバーの画面にも変更が反映されます。"
          : "対面受取へ変更しました。ドライバーの画面にも変更が反映されます。",
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "更新に失敗しました。",
      );
    } finally {
      setUpdating(null);
    }
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            ?
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            荷物が見つかりません
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ?? "URLをご確認ください。"}
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
            href="/"
          >
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  const isFinished = ["delivered", "cancelled"].includes(data.delivery.status);

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
              S
            </span>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">
                スマート配送コンパス
              </p>
              <p className="text-[10px] text-slate-400">受取方法の変更</p>
            </div>
          </Link>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            DEMO
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6 sm:pt-8">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl shadow-blue-900/15">
          <p className="text-xs font-semibold tracking-wide text-blue-100">
            本日お届け予定
          </p>
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {formatRelativeArrival(data.stop.estimatedArrival)}
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-[11px] text-blue-100">到着予定時刻</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">
                {formatEta(data.stop.estimatedArrival)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-blue-100">配送順</p>
              <p className="mt-0.5 font-bold">{data.stop.stopOrder}番目</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                {data.delivery.trackingNumber}
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">
                配送予定の荷物
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {data.delivery.address}
              </p>
            </div>
            <StatusBadge kind="delivery" value={data.delivery.status} />
          </div>

          <div className="my-5 h-px bg-slate-100" />

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">現在の受取方法</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {data.delivery.deliveryMethod === "handoff"
                  ? "対面で受け取る"
                  : "指定場所へ置き配"}
              </p>
            </div>
            <StatusBadge kind="method" value={data.delivery.deliveryMethod} />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">変更後の滞在予定時間</p>
            <p
              className={`font-bold ${data.delivery.deliveryMethod === "dropoff" ? "text-teal-700" : "text-slate-800"}`}
            >
              {formatServiceTime(data.delivery.serviceSeconds)}
            </p>
          </div>

          {success && (
            <div
              className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
              role="status"
            >
              <p className="font-bold">変更しました</p>
              <p>{success}</p>
            </div>
          )}
          {error && (
            <div
              className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <button
              className={`min-h-14 w-full rounded-2xl px-5 py-4 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${
                data.delivery.deliveryMethod === "dropoff"
                  ? "border-2 border-teal-500 bg-teal-50 text-teal-800"
                  : "bg-teal-600 text-white shadow-lg shadow-teal-900/10 hover:bg-teal-700"
              }`}
              disabled={
                Boolean(updating) ||
                isFinished ||
                data.delivery.deliveryMethod === "dropoff"
              }
              onClick={() => void changeMethod("dropoff")}
              type="button"
            >
              {updating === "dropoff"
                ? "変更しています…"
                : data.delivery.deliveryMethod === "dropoff"
                  ? "✓ 置き配に設定されています"
                  : "置き配へ変更する"}
            </button>
            <button
              className={`min-h-14 w-full rounded-2xl px-5 py-4 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${
                data.delivery.deliveryMethod === "handoff"
                  ? "border-2 border-blue-500 bg-blue-50 text-blue-800"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={
                Boolean(updating) ||
                isFinished ||
                data.delivery.deliveryMethod === "handoff"
              }
              onClick={() => void changeMethod("handoff")}
              type="button"
            >
              {updating === "handoff"
                ? "変更しています…"
                : data.delivery.deliveryMethod === "handoff"
                  ? "✓ 対面受取に設定されています"
                  : "対面受取へ戻す"}
            </button>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            変更しても配送の順番は変わりません。
            <br />
            後続の到着予定時刻だけが自動で更新されます。
          </p>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          担当：{data.driverName} · LINE 1タップ操作のモック画面
        </p>
      </main>
    </div>
  );
}
