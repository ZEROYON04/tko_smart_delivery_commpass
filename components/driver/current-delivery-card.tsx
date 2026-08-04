"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { DROPOFF_LOCATION_LABELS } from "@/lib/constants/delivery";
import { formatEta, formatServiceTime } from "@/lib/format/delivery";
import type {
  DeliveryMethod,
  DropoffLocation,
  RouteStop,
} from "@/types/delivery";

type CurrentDeliveryCardProps = {
  stop: RouteStop | undefined;
  updating: boolean;
  onStatusChange: (status: "delivered" | "absent") => void;
  onMethodChange: (input: {
    method: DeliveryMethod;
    dropoffLocation: DropoffLocation | null;
  }) => void;
};

export function CurrentDeliveryCard({
  stop,
  updating,
  onStatusChange,
  onMethodChange,
}: CurrentDeliveryCardProps) {
  const [methodSelection, setMethodSelection] = useState<string | null>(null);

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

  const savedMethodSelection =
    stop.delivery.deliveryMethod === "handoff"
      ? "handoff"
      : `dropoff:${stop.delivery.dropoffLocation ?? "unspecified"}`;
  const selectedMethod = methodSelection ?? savedMethodSelection;

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
                ? stop.delivery.dropoffLocation
                  ? DROPOFF_LOCATION_LABELS[stop.delivery.dropoffLocation]
                  : "置き配場所は未指定"
                : "対面でお渡し"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm font-bold">受取方法・置き配場所</p>
          <p className="mt-0.5 text-xs text-blue-100">
            置き配する場合は、実際に荷物を置く場所を選択してください。
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <select
              aria-label="受取方法と置き配場所"
              className="min-h-11 w-full rounded-xl border border-white/20 bg-white px-3 text-sm font-bold text-slate-900"
              disabled={updating}
              onChange={(event) => setMethodSelection(event.target.value)}
              value={selectedMethod}
            >
              <option value="handoff">対面でお渡し</option>
              <option value="dropoff:unspecified">置き配（場所未指定）</option>
              {Object.entries(DROPOFF_LOCATION_LABELS).map(
                ([location, label]) => (
                  <option key={location} value={`dropoff:${location}`}>
                    置き配・{label}
                  </option>
                ),
              )}
            </select>
            <button
              className="min-h-11 rounded-xl bg-blue-950/70 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={updating || selectedMethod === savedMethodSelection}
              onClick={() => {
                if (selectedMethod === "handoff") {
                  onMethodChange({
                    method: "handoff",
                    dropoffLocation: null,
                  });
                  return;
                }

                const location = selectedMethod.replace("dropoff:", "");
                onMethodChange({
                  method: "dropoff",
                  dropoffLocation:
                    location === "unspecified"
                      ? null
                      : (location as DropoffLocation),
                });
              }}
              type="button"
            >
              {updating ? "更新中…" : "受取方法を更新"}
            </button>
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
            onClick={() => onStatusChange("absent")}
            type="button"
          >
            {updating ? "更新中…" : "ご不在を記録"}
          </button>
        </div>
      </div>
    </section>
  );
}
