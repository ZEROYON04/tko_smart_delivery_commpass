import { formatEta } from "@/lib/format/delivery";
import type { RouteStop } from "@/types/delivery";

export function RouteOverview({
  stops,
  provider,
  revision,
}: {
  stops: RouteStop[];
  provider: string;
  revision: number;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              ↗
            </span>
            <h2 className="font-bold text-slate-900">本日の配送コース</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {provider === "osrm"
              ? "OpenStreetMap道路網の走行距離・所要時間を反映"
              : "実道路取得失敗時はモック経路へ自動フォールバック"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {provider.toUpperCase()} · 改訂 {revision}
        </span>
      </div>
      <div className="overflow-x-auto px-5 py-6 sm:px-6">
        <div className="flex min-w-[720px] items-start">
          <div className="flex w-24 shrink-0 flex-col items-center text-center">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
              拠
            </span>
            <span className="mt-2 text-xs font-bold text-slate-800">
              西条拠点
            </span>
            <span className="text-[11px] text-slate-400">出発</span>
          </div>
          {stops.map((stop) => (
            <div className="flex flex-1 items-start" key={stop.stopId}>
              <div className="mt-5 h-px flex-1 border-t-2 border-dashed border-blue-200" />
              <div className="flex w-24 shrink-0 flex-col items-center text-center">
                <span
                  className={`flex size-10 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ${
                    stop.delivery.status === "delivered"
                      ? "bg-emerald-500 text-white"
                      : stop.delivery.deliveryMethod === "dropoff"
                        ? "bg-teal-100 text-teal-800 ring-2 ring-teal-300"
                        : "bg-blue-600 text-white"
                  }`}
                >
                  {stop.delivery.status === "delivered" ? "✓" : stop.stopOrder}
                </span>
                <span className="mt-2 max-w-24 truncate text-xs font-bold text-slate-800">
                  {stop.delivery.address.replace("東広島市 ", "")}
                </span>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {formatEta(stop.estimatedArrival)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
