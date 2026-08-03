import "server-only";

import { getRunResponse } from "@/lib/data/deliveries";
import { resolveReattemptWindow } from "@/lib/scheduling/time-slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RouteOptimizationResponse, RouteStop } from "@/types/delivery";
import { getRoutingProvider, MockRoutingProvider } from "./index";
import { optimizeRoute } from "./optimize-route";
import type { Coordinate, RoutingProvider } from "./types";

function activeStops(stops: RouteStop[]) {
  return stops.filter(
    (stop) => !["delivered", "cancelled"].includes(stop.delivery.status),
  );
}

function coordinateForStop(stop: RouteStop): Coordinate {
  return {
    latitude: stop.delivery.latitude,
    longitude: stop.delivery.longitude,
  };
}

function planningStart(startedAt: string | null) {
  const now = Date.now();
  const started = startedAt ? new Date(startedAt).getTime() : now;
  return new Date(Math.max(now, started));
}

async function rollExpiredDeliveryWindows(
  stops: RouteStop[],
  deliveryDate: string,
  startTime: Date,
) {
  const expired = stops.filter(
    (stop) =>
      stop.delivery.windowEnd &&
      new Date(stop.delivery.windowEnd).getTime() < startTime.getTime(),
  );
  if (expired.length === 0) return;

  const supabase = createSupabaseAdminClient();
  for (const stop of expired) {
    const window = resolveReattemptWindow({
      deliveryDate,
      carrier: stop.delivery.carrier,
      currentWindowCode: stop.delivery.requestedWindowCode,
      returnAt: startTime,
    });
    const result = await supabase.rpc("change_delivery_window", {
      p_delivery_id: stop.delivery.id,
      p_expected_version: stop.delivery.version,
      p_window_code: window.code,
      p_window_start: window.start.toISOString(),
      p_window_end: window.end.toISOString(),
    });
    if (result.error) throw result.error;

    stop.delivery.requestedWindowCode = window.code;
    stop.delivery.windowStart = window.start.toISOString();
    stop.delivery.windowEnd = window.end.toISOString();
    stop.delivery.version += 1;
  }
}

async function withRoutingFallback<T>(
  preferred: RoutingProvider,
  operation: (provider: RoutingProvider) => Promise<T>,
) {
  try {
    return {
      value: await operation(preferred),
      provider: preferred,
      usedFallback: false,
    };
  } catch (error) {
    if (preferred.name === "mock") throw error;
    console.error("Real road routing failed; using mock fallback", error);
    const fallback = new MockRoutingProvider();
    return {
      value: await operation(fallback),
      provider: fallback,
      usedFallback: true,
    };
  }
}

export async function optimizeDeliveryRun(
  runId: string,
  reason = "manual-route-optimization",
): Promise<RouteOptimizationResponse> {
  const data = await getRunResponse(runId);
  if (!data) throw new Error("RUN_NOT_FOUND");

  const stops = activeStops(data.stops);
  if (stops.length === 0) throw new Error("NO_ACTIVE_DELIVERIES");

  const startTime = planningStart(data.run.startedAt);
  await rollExpiredDeliveryWindows(stops, data.run.deliveryDate, startTime);

  const origin: Coordinate = data.latestLocation
    ? {
        latitude: data.latestLocation.latitude,
        longitude: data.latestLocation.longitude,
      }
    : {
        latitude: data.run.depotLatitude,
        longitude: data.run.depotLongitude,
      };
  const inputCoordinates = [origin, ...stops.map(coordinateForStop)];
  const preferred = getRoutingProvider();
  const matrixResult = await withRoutingFallback(preferred, (provider) =>
    provider.calculateMatrix(inputCoordinates),
  );

  const optimized = optimizeRoute({
    startTime,
    stops: stops.map((stop) => ({
      id: stop.delivery.id,
      serviceSeconds: stop.delivery.serviceSeconds,
      availableFrom: stop.delivery.availableFrom,
      windowStart: stop.delivery.windowStart,
      windowEnd: stop.delivery.windowEnd,
    })),
    durations: matrixResult.value.durations,
    distances: matrixResult.value.distances,
  });

  const orderedStops = optimized.orderedIndexes.map((index) => stops[index]);
  const orderedCoordinates = [origin, ...orderedStops.map(coordinateForStop)];
  const routeResult = await withRoutingFallback(
    matrixResult.provider,
    (provider) => provider.calculateRoute(orderedCoordinates),
  );

  if (routeResult.value.length !== orderedStops.length) {
    throw new Error("INCOMPLETE_ROUTE_PLAN");
  }

  const plan = orderedStops.map((stop, index) => {
    const leg = routeResult.value[index];
    const from = orderedCoordinates[index];
    const to = orderedCoordinates[index + 1];
    return {
      deliveryId: stop.delivery.id,
      fromLatitude: from.latitude,
      fromLongitude: from.longitude,
      distanceMeters: leg.distanceMeters,
      durationSeconds: leg.durationSeconds,
      geometry: leg.geometry.length >= 2 ? leg.geometry : [from, to],
    };
  });

  const providerName = routeResult.provider.name;
  const usedFallback = matrixResult.usedFallback || routeResult.usedFallback;
  const note = `${reason}${optimized.feasible ? "" : ":time-window-fallback"}${usedFallback ? ":mock-fallback" : ""}`;
  const supabase = createSupabaseAdminClient();
  const applyResult = await supabase.rpc("apply_active_route_plan", {
    p_run_id: runId,
    p_plan: plan,
    p_provider: providerName,
    p_reason: note,
  });

  if (applyResult.error) throw applyResult.error;

  return {
    runId,
    provider: providerName,
    usedFallback,
    stopCount: orderedStops.length,
    totalDistanceMeters: plan.reduce(
      (total, leg) => total + leg.distanceMeters,
      0,
    ),
    totalDurationSeconds: plan.reduce(
      (total, leg) => total + leg.durationSeconds,
      0,
    ),
    reason: note,
    orderedDeliveryIds: orderedStops.map((stop) => stop.delivery.id),
  };
}
