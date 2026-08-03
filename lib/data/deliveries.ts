import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Delivery,
  DeliveryMethod,
  DeliveryRun,
  DeliveryStatus,
  RecipientDeliveryResponse,
  RouteStop,
  RunResponse,
  RunStatus,
} from "@/types/delivery";

type RunRow = {
  id: string;
  driver_name: string;
  delivery_date: string;
  status: RunStatus;
  current_stop_order: number;
  depot_latitude: number;
  depot_longitude: number;
  depot_name: string;
  depot_address: string;
  started_at: string | null;
  completed_at: string | null;
  route_revision: number;
  route_provider: string;
  optimized_at: string | null;
  optimization_note: string | null;
};

type DeliveryRow = {
  id: string;
  run_id: string;
  tracking_number: string;
  recipient_name: string;
  address: string;
  latitude: number;
  longitude: number;
  delivery_method: DeliveryMethod;
  carrier: Delivery["carrier"];
  requested_window_code: string | null;
  window_start: string | null;
  window_end: string | null;
  available_from: string | null;
  is_reattempt: boolean;
  reattempt_count: number;
  last_absent_at: string | null;
  service_seconds: number;
  status: DeliveryStatus;
  version: number;
};

type StopRow = {
  id: string;
  run_id: string;
  delivery_id: string;
  stop_order: number;
  estimated_arrival: string | null;
  locked: boolean;
};

type LegRow = {
  leg_order: number;
  distance_meters: number;
  duration_seconds: number;
  provider: string;
  route_geometry: unknown;
};

type LocationRow = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

function mapRun(row: RunRow): DeliveryRun {
  return {
    id: row.id,
    driverName: row.driver_name,
    deliveryDate: row.delivery_date,
    status: row.status,
    currentStopOrder: row.current_stop_order,
    depotLatitude: row.depot_latitude,
    depotLongitude: row.depot_longitude,
    depotName: row.depot_name,
    depotAddress: row.depot_address,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    routeRevision: row.route_revision,
    routeProvider: row.route_provider,
    optimizedAt: row.optimized_at,
    optimizationNote: row.optimization_note,
  };
}

function mapDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    runId: row.run_id,
    trackingNumber: row.tracking_number,
    recipientName: row.recipient_name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    deliveryMethod: row.delivery_method,
    carrier: row.carrier,
    requestedWindowCode: row.requested_window_code,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    availableFrom: row.available_from,
    isReattempt: row.is_reattempt,
    reattemptCount: row.reattempt_count,
    lastAbsentAt: row.last_absent_at,
    serviceSeconds: row.service_seconds,
    status: row.status,
    version: row.version,
  };
}

export async function getRunResponse(
  runId: string,
): Promise<RunResponse | null> {
  const supabase = createSupabaseAdminClient();
  const [runResult, deliveriesResult, stopsResult, legsResult, locationResult] =
    await Promise.all([
      supabase.from("delivery_runs").select("*").eq("id", runId).maybeSingle(),
      supabase.from("deliveries").select("*").eq("run_id", runId),
      supabase
        .from("route_stops")
        .select("*")
        .eq("run_id", runId)
        .order("stop_order"),
      supabase
        .from("route_legs")
        .select(
          "leg_order,distance_meters,duration_seconds,provider,route_geometry",
        )
        .eq("run_id", runId)
        .order("leg_order"),
      supabase
        .from("driver_locations")
        .select("latitude,longitude,recorded_at")
        .eq("run_id", runId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const firstError = [
    runResult.error,
    deliveriesResult.error,
    stopsResult.error,
    legsResult.error,
    locationResult.error,
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  if (!runResult.data) {
    return null;
  }

  const deliveryRows = (deliveriesResult.data ?? []) as DeliveryRow[];
  const stopRows = (stopsResult.data ?? []) as StopRow[];
  const legRows = (legsResult.data ?? []) as LegRow[];
  const deliveriesById = new Map(
    deliveryRows.map((delivery) => [delivery.id, mapDelivery(delivery)]),
  );
  const legsByOrder = new Map(legRows.map((leg) => [leg.leg_order, leg]));

  const stops = stopRows.flatMap<RouteStop>((stop) => {
    const delivery = deliveriesById.get(stop.delivery_id);
    const leg = legsByOrder.get(stop.stop_order);

    if (!delivery || !leg) {
      return [];
    }

    return [
      {
        stopId: stop.id,
        stopOrder: stop.stop_order,
        estimatedArrival: stop.estimated_arrival,
        locked: stop.locked,
        distanceMeters: leg.distance_meters,
        durationSeconds: leg.duration_seconds,
        provider: leg.provider,
        geometry: Array.isArray(leg.route_geometry)
          ? (leg.route_geometry as Array<{
              latitude: number;
              longitude: number;
            }>)
          : [],
        delivery,
      },
    ];
  });

  const location = locationResult.data as LocationRow | null;

  return {
    run: mapRun(runResult.data as RunRow),
    stops,
    latestLocation: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          recordedAt: location.recorded_at,
        }
      : null,
  };
}

export async function getRecipientDelivery(
  deliveryId: string,
): Promise<RecipientDeliveryResponse | null> {
  const supabase = createSupabaseAdminClient();
  const deliveryResult = await supabase
    .from("deliveries")
    .select("*")
    .eq("id", deliveryId)
    .maybeSingle();

  if (deliveryResult.error) {
    throw deliveryResult.error;
  }

  if (!deliveryResult.data) {
    return null;
  }

  const deliveryRow = deliveryResult.data as DeliveryRow;
  const [stopResult, runResult] = await Promise.all([
    supabase
      .from("route_stops")
      .select("*")
      .eq("delivery_id", deliveryId)
      .maybeSingle(),
    supabase
      .from("delivery_runs")
      .select("driver_name")
      .eq("id", deliveryRow.run_id)
      .maybeSingle(),
  ]);

  if (stopResult.error || runResult.error) {
    throw stopResult.error ?? runResult.error;
  }

  if (!stopResult.data || !runResult.data) {
    return null;
  }

  const stop = stopResult.data as StopRow;

  return {
    delivery: mapDelivery(deliveryRow),
    stop: {
      stopId: stop.id,
      stopOrder: stop.stop_order,
      estimatedArrival: stop.estimated_arrival,
      locked: stop.locked,
    },
    driverName: (runResult.data as { driver_name: string }).driver_name,
  };
}
