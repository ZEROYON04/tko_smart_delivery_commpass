import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";
import {
  formatDistance,
  formatEta,
  formatServiceTime,
} from "@/lib/format/delivery";
import { CARRIER_LABELS, formatWindowLabel } from "@/lib/scheduling/time-slots";
import type { RouteStop } from "@/types/delivery";

export function DeliveryCard({ stop }: { stop: RouteStop }) {
  const isDropoff = stop.delivery.deliveryMethod === "dropoff";

  return (
    <article
      className={`relative rounded-2xl border bg-white p-4 transition sm:p-5 ${
        isDropoff
          ? "border-teal-200 shadow-[0_8px_30px_rgba(13,148,136,0.08)]"
          : "border-slate-200"
      }`}
    >
      {isDropoff && (
        <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-teal-500" />
      )}
      <div className="flex gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
            stop.delivery.status === "delivered"
              ? "bg-emerald-100 text-emerald-700"
              : isDropoff
                ? "bg-teal-100 text-teal-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {stop.delivery.status === "delivered" ? "✓" : stop.stopOrder}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                {stop.delivery.trackingNumber}
              </p>
              <h3 className="mt-0.5 font-bold text-slate-900">
                {stop.delivery.address}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {stop.delivery.recipientName}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {CARRIER_LABELS[stop.delivery.carrier]} ·
                {formatWindowLabel(
                  stop.delivery.carrier,
                  stop.delivery.requestedWindowCode,
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge kind="method" value={stop.delivery.deliveryMethod} />
              <StatusBadge kind="delivery" value={stop.delivery.status} />
              {stop.delivery.isReattempt && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                  再配達 {stop.delivery.reattemptCount}回目
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[11px] text-slate-400">到着予定</p>
              <p className="mt-0.5 font-bold tabular-nums text-slate-800">
                {formatEta(stop.estimatedArrival)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">滞在予定</p>
              <p
                className={`mt-0.5 font-bold ${isDropoff ? "text-teal-700" : "text-slate-800"}`}
              >
                {formatServiceTime(stop.delivery.serviceSeconds)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">区間距離</p>
              <p className="mt-0.5 font-bold text-slate-800">
                {formatDistance(stop.distanceMeters)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Link
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              href={`/recipient/${stop.delivery.id}`}
            >
              受取人画面を開く →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
