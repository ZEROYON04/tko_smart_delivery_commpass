"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { formatEta, formatServiceTime } from "@/lib/format/delivery";
import {
  CARRIER_LABELS,
  formatWindowLabel,
  getCarrierTimeSlots,
} from "@/lib/scheduling/time-slots";
import type { RouteStop } from "@/types/delivery";

type CurrentDeliveryCardProps = {
  stop: RouteStop | undefined;
  updating: boolean;
  onStatusChange: (status: "delivered") => void;
  onReattempt: (input: {
    returnInMinutes: number;
    preferredWindowCode: string | null;
  }) => void;
};

export function CurrentDeliveryCard({
  stop,
  updating,
  onStatusChange,
  onReattempt,
}: CurrentDeliveryCardProps) {
  const [showReattempt, setShowReattempt] = useState(false);
  const [returnInMinutes, setReturnInMinutes] = useState(30);
  const [preferredWindowCode, setPreferredWindowCode] = useState("auto");

  if (!stop) {
    return (
      <section className="rounded-3xl bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-900/10">
        <p className="text-sm font-semibold text-emerald-100">本日の配送</p>
        <h2 className="mt-2 text-2xl font-bold">すべて完了しました</h2>
        <p className="mt-2 text-sm text-emerald-50">
          安全運転おつかれさまでした。
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-6 text-white shadow-xl shadow-blue-900/15 sm:p-7">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              現在の配送・{stop.stopOrder}件目
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {stop.delivery.address}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {stop.delivery.recipientName} · {stop.delivery.trackingNumber}
            </p>
          </div>
          <StatusBadge kind="method" value={stop.delivery.deliveryMethod} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-xs text-blue-100">到着予定</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatEta(stop.estimatedArrival)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-xs text-blue-100">滞在予定</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatServiceTime(stop.delivery.serviceSeconds)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl bg-white/12 p-4 backdrop-blur-sm sm:col-span-1">
            <p className="text-xs text-blue-100">受取方法</p>
            <p className="mt-1 text-lg font-bold">
              {stop.delivery.deliveryMethod === "dropoff"
                ? "指定場所へ置き配"
                : "対面でお渡し"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="min-h-12 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updating}
            onClick={() => onStatusChange("delivered")}
            type="button"
          >
            {updating ? "更新中…" : "✓ 配達完了"}
          </button>
          <button
            className="min-h-12 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updating}
            onClick={() => setShowReattempt((current) => !current)}
            type="button"
          >
            ご不在・再配達
          </button>
        </div>

        {showReattempt && (
          <div className="mt-4 rounded-2xl border border-white/20 bg-slate-950/25 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">再配達ルートを再計算</p>
                <p className="mt-0.5 text-xs text-blue-100">
                  {CARRIER_LABELS[stop.delivery.carrier]} · 現在の枠：
                  {formatWindowLabel(
                    stop.delivery.carrier,
                    stop.delivery.requestedWindowCode,
                  )}
                </p>
              </div>
              <span className="rounded-full bg-orange-400/20 px-2.5 py-1 text-[11px] font-bold text-orange-100">
                不在情報を反映
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-blue-100">
                あと何分で戻る予定か
                <select
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-white/20 bg-white px-3 text-sm font-bold text-slate-900"
                  disabled={updating}
                  onChange={(event) =>
                    setReturnInMinutes(Number(event.target.value))
                  }
                  value={returnInMinutes}
                >
                  {[15, 30, 60, 90, 120, 180].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes}分後
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-blue-100">
                希望する再配達枠
                <select
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-white/20 bg-white px-3 text-sm font-bold text-slate-900"
                  disabled={updating}
                  onChange={(event) =>
                    setPreferredWindowCode(event.target.value)
                  }
                  value={preferredWindowCode}
                >
                  <option value="auto">現在枠／次枠を自動判定</option>
                  {getCarrierTimeSlots(stop.delivery.carrier).map((slot) => (
                    <option key={slot.code} value={slot.code}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="mt-3 min-h-11 w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-300 disabled:opacity-60"
              disabled={updating}
              onClick={() => {
                setShowReattempt(false);
                onReattempt({
                  returnInMinutes,
                  preferredWindowCode:
                    preferredWindowCode === "auto" ? null : preferredWindowCode,
                });
              }}
              type="button"
            >
              {updating ? "最適ルートを計算中…" : "不在を記録してルートを更新"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
