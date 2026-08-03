import { DeliveryCard } from "./delivery-card";
import type { RouteStop } from "@/types/delivery";

export function DeliveryList({ stops }: { stops: RouteStop[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Delivery list
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">配送一覧</h2>
        </div>
        <p className="text-xs text-slate-500">配送順は自動変更されません</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {stops.map((stop) => (
          <DeliveryCard key={stop.stopId} stop={stop} />
        ))}
      </div>
    </section>
  );
}
