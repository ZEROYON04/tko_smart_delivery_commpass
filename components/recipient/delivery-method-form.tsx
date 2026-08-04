"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { DROPOFF_LOCATION_LABELS } from "@/lib/constants/delivery";
import {
  formatDeliveryDate,
  formatEta,
  formatRelativeArrival,
  formatServiceTime,
} from "@/lib/format/delivery";
import {
  CARRIER_LABELS,
  formatWindowLabel,
  getCarrierTimeSlots,
} from "@/lib/scheduling/time-slots";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  DeliveryMethod,
  RecipientDeliveryResponse,
} from "@/types/delivery";

function getTodayInJst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function DeliveryMethodForm({
  deliveryId,
  initialData,
  accessQuery,
  initialView,
}: {
  deliveryId: string;
  initialData: RecipientDeliveryResponse;
  accessQuery: string;
  initialView: "overview" | "schedule" | "redelivery";
}) {
  const [data, setData] = useState<RecipientDeliveryResponse | null>(
    initialData,
  );
  const [updating, setUpdating] = useState<DeliveryMethod | null>(null);
  const [windowUpdating, setWindowUpdating] = useState(false);
  const [reattemptUpdating, setReattemptUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    initialData.deliveryDate < getTodayInJst()
      ? getTodayInJst()
      : initialData.deliveryDate,
  );
  const [selectedWindow, setSelectedWindow] = useState(
    initialData.delivery.requestedWindowCode ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDelivery = useCallback(async () => {
    try {
      const querySuffix = accessQuery ? `?${accessQuery}` : "";
      const response = await fetch(
        `/api/deliveries/${deliveryId}${querySuffix}`,
        {
          cache: "no-store",
        },
      );
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "荷物情報を取得できませんでした。",
        );
      }

      const nextData = body as RecipientDeliveryResponse;
      setData(nextData);
      setSelectedDate(
        nextData.deliveryDate < getTodayInJst()
          ? getTodayInJst()
          : nextData.deliveryDate,
      );
      setSelectedWindow(nextData.delivery.requestedWindowCode ?? "");
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "読み込みに失敗しました。",
      );
    }
  }, [accessQuery, deliveryId]);

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
      const querySuffix = accessQuery ? `?${accessQuery}` : "";
      const response = await fetch(
        `/api/deliveries/${deliveryId}/method${querySuffix}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, version: data.delivery.version }),
        },
      );
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

  async function changeWindow() {
    if (!data || !selectedDate || !selectedWindow) return;
    if (
      selectedDate === data.deliveryDate &&
      selectedWindow === data.delivery.requestedWindowCode
    ) {
      return;
    }

    setWindowUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const querySuffix = accessQuery ? `?${accessQuery}` : "";
      const response = await fetch(
        `/api/deliveries/${deliveryId}/window${querySuffix}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryDate: selectedDate,
            windowCode: selectedWindow,
            version: data.delivery.version,
          }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "配達時間帯を変更できませんでした。",
        );
      }
      await loadDelivery();
      setSuccess(
        "お届け日時を変更し、ドライバーの配送順と到着予定を再計算しました。",
      );
    } catch (windowError) {
      setError(
        windowError instanceof Error
          ? windowError.message
          : "お届け日時を変更できませんでした。",
      );
    } finally {
      setWindowUpdating(false);
    }
  }

  async function requestRedelivery() {
    if (!data || !selectedDate || !selectedWindow) return;

    setReattemptUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const querySuffix = accessQuery ? `?${accessQuery}` : "";
      const response = await fetch(
        `/api/deliveries/${deliveryId}/reattempt${querySuffix}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryDate: selectedDate,
            windowCode: selectedWindow,
            version: data.delivery.version,
          }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "再配達を申し込めませんでした。",
        );
      }
      await loadDelivery();
      setSuccess(
        "指定した日時で再配達を受け付けました。ドライバーの配送順と到着予定を再計算しました。",
      );
    } catch (reattemptError) {
      setError(
        reattemptError instanceof Error
          ? reattemptError.message
          : "再配達を申し込めませんでした。",
      );
    } finally {
      setReattemptUpdating(false);
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
                スマ配（スマート配送）
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
            {formatDeliveryDate(data.deliveryDate)} お届け予定
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
                  : data.delivery.dropoffLocation
                    ? `${DROPOFF_LOCATION_LABELS[data.delivery.dropoffLocation]}へ置き配`
                    : "置き配（場所はドライバーが確認）"}
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

          {initialView === "redelivery" && (
            <div
              className="mt-4 scroll-mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"
              id="redelivery"
            >
              <p className="text-xs font-semibold text-orange-700">
                再配達のお申し込み
              </p>
              {data.delivery.isReattempt ? (
                <p className="mt-2 text-sm font-bold text-orange-900">
                  この荷物は再配達ルートに設定済みです。下の欄から日付と時間帯を変更できます。
                </p>
              ) : data.delivery.status === "absent" ? (
                <p className="mt-2 text-sm font-bold text-orange-900">
                  下の「再配達日時」から、受け取り可能な日付と時間帯を指定してください。
                </p>
              ) : (
                <p className="mt-2 text-sm text-orange-900">
                  この荷物は現在、再配達の対象ではありません。
                </p>
              )}
            </div>
          )}

          <div
            className="mt-4 scroll-mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            id="schedule"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">
                  {data.delivery.status === "absent" ||
                  data.delivery.isReattempt
                    ? "再配達日時"
                    : "お届け日時"}
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {CARRIER_LABELS[data.delivery.carrier]}
                </p>
              </div>
              {data.delivery.isReattempt && (
                <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
                  再配達ルートに設定済み
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              現在：{formatDeliveryDate(data.deliveryDate)}・
              {formatWindowLabel(
                data.delivery.carrier,
                data.delivery.requestedWindowCode,
              )}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                希望日
                <input
                  aria-label="希望する配達日"
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                  disabled={windowUpdating || reattemptUpdating || isFinished}
                  min={getTodayInJst()}
                  onInput={(event) =>
                    setSelectedDate(event.currentTarget.value)
                  }
                  type="date"
                  value={selectedDate}
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                希望時間帯
                <select
                  aria-label="希望する配達時間帯"
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                  disabled={windowUpdating || reattemptUpdating || isFinished}
                  onChange={(event) => setSelectedWindow(event.target.value)}
                  value={selectedWindow}
                >
                  {getCarrierTimeSlots(data.delivery.carrier).map((slot) => (
                    <option key={slot.code} value={slot.code}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3">
              <button
                className="min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                disabled={
                  windowUpdating ||
                  reattemptUpdating ||
                  isFinished ||
                  !selectedDate ||
                  !selectedWindow ||
                  (data.delivery.status !== "absent" &&
                    selectedDate === data.deliveryDate &&
                    selectedWindow === data.delivery.requestedWindowCode)
                }
                onClick={() =>
                  void (data.delivery.status === "absent" &&
                  !data.delivery.isReattempt
                    ? requestRedelivery()
                    : changeWindow())
                }
                type="button"
              >
                {windowUpdating || reattemptUpdating
                  ? "再計算中…"
                  : data.delivery.status === "absent" &&
                      !data.delivery.isReattempt
                    ? "この日時で再配達を申し込む"
                    : "お届け日時を変更"}
              </button>
            </div>
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
                windowUpdating ||
                reattemptUpdating ||
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
                windowUpdating ||
                reattemptUpdating ||
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
            受取方法だけの変更では配送順は変わりません。
            <br />
            日付または時間帯を変更した場合は残りの配送順とETAを再計算します。
          </p>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          担当：{data.driverName} · LINE 1タップ操作のモック画面
        </p>
      </main>
    </div>
  );
}
