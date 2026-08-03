import { StatusBadge } from "@/components/common/status-badge";
import { formatEta, formatServiceTime } from "@/lib/format/delivery";
import type { RouteStop } from "@/types/delivery";

type CurrentDeliveryCardProps = {
  stop: RouteStop | undefined;
  updating: boolean;
  onStatusChange: (status: "delivered" | "absent") => void;
};

export function CurrentDeliveryCard({
  stop,
  updating,
  onStatusChange,
}: CurrentDeliveryCardProps) {
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
            onClick={() => onStatusChange("absent")}
            type="button"
          >
            ご不在
          </button>
        </div>
      </div>
    </section>
  );
}
