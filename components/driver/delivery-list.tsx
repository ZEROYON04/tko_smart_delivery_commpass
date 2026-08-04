import { DeliveryCard } from "./delivery-card";
import { DELIVERY_TIME_SLOT_LABELS } from "@/lib/constants/time-slots";
import { assessWindowFeasibility } from "@/lib/scheduling/window-feasibility";
import type { RouteStop } from "@/types/delivery";

type WindowGroup = {
  key: string;
  dateLabel: string;
  timeLabel: string;
  sortTime: number;
  stops: RouteStop[];
};

function formatJst(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("ja-JP", {
    ...options,
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function groupByDeliveryWindow(stops: RouteStop[]) {
  const groups = new Map<string, WindowGroup>();

  for (const stop of stops) {
    const { windowStart, windowEnd, deliveryTimeSlot } = stop.delivery;
    const key =
      windowStart && windowEnd
        ? `${windowStart}|${windowEnd}`
        : `slot:${deliveryTimeSlot}`;
    const existing = groups.get(key);
    if (existing) {
      existing.stops.push(stop);
      continue;
    }

    groups.set(key, {
      key,
      dateLabel: windowStart
        ? formatJst(windowStart, {
            month: "numeric",
            day: "numeric",
            weekday: "short",
          })
        : "日付未設定",
      timeLabel:
        windowStart && windowEnd
          ? `${formatJst(windowStart, { hour: "2-digit", minute: "2-digit" })}〜${formatJst(windowEnd, { hour: "2-digit", minute: "2-digit" })}`
          : DELIVERY_TIME_SLOT_LABELS[deliveryTimeSlot],
      sortTime: windowStart
        ? new Date(windowStart).getTime()
        : Number.MAX_SAFE_INTEGER,
      stops: [stop],
    });
  }

  return [...groups.values()]
    .sort((left, right) => left.sortTime - right.sortTime)
    .map((group) => ({
      ...group,
      stops: group.stops.sort((left, right) => left.stopOrder - right.stopOrder),
    }));
}

export function DeliveryList({ stops }: { stops: RouteStop[] }) {
  const activeStops = stops.filter((stop) =>
    ["pending", "out_for_delivery"].includes(stop.delivery.status),
  );
  const scheduledStops = stops.filter(
    (stop) => !["absent", "cancelled"].includes(stop.delivery.status),
  );
  const absentStops = stops.filter(
    (stop) => stop.delivery.status === "absent",
  );
  const windowGroups = groupByDeliveryWindow(scheduledStops);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Time-slot delivery board
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              配送枠ごとの荷物
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              同じ時間帯の中で、道路状況と在宅予定に合わせて訪問順を最適化
            </p>
          </div>
          <p className="text-xs text-slate-500">
            全 {scheduledStops.length}件・残り {activeStops.length}件
          </p>
        </div>
        {windowGroups.length > 0 ? (
          <div className="space-y-5">
            {windowGroups.map((group) => {
              const groupActiveStops = group.stops.filter((stop) =>
                ["pending", "out_for_delivery"].includes(
                  stop.delivery.status,
                ),
              );
              const deliveredCount = group.stops.filter(
                (stop) => stop.delivery.status === "delivered",
              ).length;
              const feasibleCount = groupActiveStops.filter(
                (stop) =>
                  assessWindowFeasibility({
                    estimatedArrival: stop.estimatedArrival,
                    unavailableUntil: stop.delivery.unavailableUntil,
                    serviceSeconds: stop.delivery.serviceSeconds,
                    windowEnd: stop.delivery.windowEnd,
                  }).canCompleteWithinWindow,
              ).length;
              const allFeasible = feasibleCount === groupActiveStops.length;

              const hasCurrentDelivery = group.stops.some(
                (stop) => stop.delivery.status === "out_for_delivery",
              );

              return (
                <details
                  className="overflow-hidden rounded-3xl border border-blue-200 bg-blue-50/40"
                  open={hasCurrentDelivery}
                  key={group.key}
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-4 text-white marker:content-none">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15 text-xl">
                        ◷
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-blue-100">
                          {group.dateLabel}の配送枠
                        </p>
                        <h3 className="text-lg font-bold tabular-nums">
                          {group.timeLabel}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-white/15 px-3 py-1.5">
                        {group.stops.length}件
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 ${
                          allFeasible
                            ? "bg-emerald-300 text-emerald-950"
                            : "bg-amber-200 text-amber-950"
                        }`}
                      >
                        {deliveredCount === group.stops.length
                          ? `${deliveredCount}件完了`
                          : allFeasible
                            ? `${groupActiveStops.length}件 枠内予定`
                            : `${feasibleCount}/${groupActiveStops.length}件 枠内予定`}
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1.5">
                        開閉 ▾
                      </span>
                    </div>
                  </summary>
                  <div className="grid gap-3 p-4 lg:grid-cols-2">
                    {group.stops.map((stop) => (
                      <DeliveryCard key={stop.stopId} stop={stop} />
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
            本日の配達対象はすべて処理済みです。
          </div>
        )}
      </section>

      {absentStops.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-amber-950">不在・日時変更待ち</h2>
            <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
              {absentStops.length}件
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {absentStops.map((stop) => (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-sm"
                key={stop.stopId}
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {stop.delivery.recipientName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stop.delivery.trackingNumber}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700">
                  LINEで再配達日時を案内
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
