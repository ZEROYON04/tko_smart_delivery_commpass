"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDeliveryDate } from "@/lib/format/delivery";
import { useDeliveryRealtime } from "@/hooks/use-delivery-realtime";
import type { DeliveryStatus, RunResponse } from "@/types/delivery";
import { CurrentDeliveryCard } from "./current-delivery-card";
import { DeliveryList } from "./delivery-list";
import { RouteOverview } from "./route-overview";

type Notice = { title: string; body: string };

export function DriverDashboard({ runId }: { runId: string }) {
  const [data, setData] = useState<RunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const dataRef = useRef<RunResponse | null>(null);

  const loadData = useCallback(
    async (fromRealtime = false) => {
      try {
        const response = await fetch(`/api/runs/${runId}`, {
          cache: "no-store",
        });
        const body: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof body === "object" && body && "message" in body
              ? String(body.message)
              : "配送情報を取得できませんでした。";
          throw new Error(message);
        }

        const nextData = body as RunResponse;
        const previousData = dataRef.current;

        if (fromRealtime && previousData) {
          const changedStop = nextData.stops.find((nextStop) => {
            const previousStop = previousData.stops.find(
              (candidate) => candidate.stopId === nextStop.stopId,
            );
            return (
              previousStop &&
              previousStop.delivery.deliveryMethod !==
                nextStop.delivery.deliveryMethod
            );
          });

          if (changedStop) {
            const method =
              changedStop.delivery.deliveryMethod === "dropoff"
                ? "置き配"
                : "対面受取";
            setNotice({
              title: `${changedStop.stopOrder}番目の荷物が${method}へ変更されました。`,
              body: "後続の到着予定時刻を更新しました。配送順は変更されていません。",
            });
          }
        }

        dataRef.current = nextData;
        setData(nextData);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "読み込みに失敗しました。",
        );
      } finally {
        setLoading(false);
      }
    },
    [runId],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRealtimeChange = useCallback(() => {
    void loadData(true);
  }, [loadData]);

  useDeliveryRealtime(runId, handleRealtimeChange);

  async function updateStatus(
    status: Extract<DeliveryStatus, "delivered" | "absent">,
  ) {
    const currentStop = data?.stops.find(
      (stop) => stop.stopOrder === data.run.currentStopOrder,
    );
    if (!currentStop) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `/api/deliveries/${currentStop.delivery.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            version: currentStop.delivery.version,
          }),
        },
      );
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof body === "object" && body && "message" in body
            ? String(body.message)
            : "配達状態を更新できませんでした。",
        );
      }

      setNotice({
        title:
          status === "delivered"
            ? "配達を完了しました。"
            : "ご不在として記録しました。",
        body: "次の配送先へ進みます。配送順は維持されています。",
      });
      await loadData();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "更新に失敗しました。",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function startRun() {
    setUpdating(true);
    try {
      const response = await fetch(`/api/runs/${runId}/start`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("配送を開始できませんでした。");
      await loadData();
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "開始に失敗しました。",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function simulateMorningNotifications() {
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/notifications/morning`, {
        method: "POST",
      });
      const body = (await response.json()) as {
        sent?: number;
        skipped?: number;
        failed?: number;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message ?? "朝の通知を実行できませんでした。");
      }
      setNotice({
        title: `朝の自動通知を${body.sent ?? 0}件送信しました。`,
        body: `送信済み・未連携など${body.skipped ?? 0}件、失敗${body.failed ?? 0}件です。二重送信は防止されます。`,
      });
      await loadData();
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "朝の通知を実行できませんでした。",
      );
    } finally {
      setUpdating(false);
    }
  }

  function updateLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("この端末では位置情報を利用できません。");
      return;
    }

    setLocationMessage("現在地を取得しています…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`/api/runs/${runId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          });
          if (!response.ok) throw new Error();
          setLocationMessage("現在地を更新しました。");
          await loadData();
        } catch {
          setLocationMessage("現在地を更新できませんでした。");
        }
      },
      () => setLocationMessage("位置情報の利用が許可されませんでした。"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (loading) return <LoadingState label="配送コースを読み込んでいます" />;

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <p className="font-bold text-slate-900">配送情報を表示できません</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          onClick={() => void loadData()}
          type="button"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!data) return null;

  const completedCount = data.stops.filter(
    (stop) => stop.delivery.status === "delivered",
  ).length;
  const currentStop = data.stops.find(
    (stop) =>
      stop.stopOrder === data.run.currentStopOrder &&
      !["delivered", "cancelled"].includes(stop.delivery.status),
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-sm">
              S
            </span>
            <div>
              <p className="font-bold leading-tight text-slate-900">
                スマート配送コンパス
              </p>
              <p className="text-[11px] text-slate-400">
                Driver console · Hiroshima
              </p>
            </div>
          </Link>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={updateLocation}
            type="button"
          >
            ◎ 現在地を更新
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="run" value={data.run.status} />
              <span className="text-xs text-slate-400">
                {formatDeliveryDate(data.run.deliveryDate)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              おはようございます、{data.run.driverName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              焦らず、安全に。変更は自動で反映されます。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Progress
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                {completedCount} / {data.stops.length} 件完了
              </p>
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${(completedCount / data.stops.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <button
          className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          disabled={updating}
          onClick={() => void simulateMorningNotifications()}
          type="button"
        >
          朝8時の自動通知をデモ実行
        </button>

        {notice && (
          <div
            className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 text-teal-950 shadow-sm"
            role="status"
          >
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                ✓
              </span>
              <div>
                <p className="text-sm font-bold">{notice.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-teal-700">
                  {notice.body}
                </p>
              </div>
            </div>
            <button
              className="text-lg leading-none text-teal-600"
              onClick={() => setNotice(null)}
              type="button"
              aria-label="通知を閉じる"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {locationMessage && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {locationMessage}
          </div>
        )}

        {data.run.status === "planned" ? (
          <button
            className="mb-6 w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-900/10 disabled:opacity-60"
            disabled={updating}
            onClick={() => void startRun()}
            type="button"
          >
            本日の配送を開始する
          </button>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <CurrentDeliveryCard
            stop={currentStop}
            updating={updating}
            onStatusChange={(status) => void updateStatus(status)}
          />
          <RouteOverview stops={data.stops} />
        </div>

        <div className="mt-8">
          <DeliveryList stops={data.stops} />
        </div>
      </main>
    </div>
  );
}
