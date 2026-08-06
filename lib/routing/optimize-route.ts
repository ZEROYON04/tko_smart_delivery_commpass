export type OptimizableStop = {
  id: string;
  serviceSeconds: number;
  availableFrom?: string | null;
  allowWaiting?: boolean;
  preferredFirst?: boolean;
  windowStart?: string | null;
  windowEnd?: string | null;
};

export type RouteOptimizationInput = {
  startTime: Date;
  stops: OptimizableStop[];
  durations: Array<Array<number | null>>;
  distances: Array<Array<number | null>>;
};

export type OptimizedRoute = {
  orderedStopIds: string[];
  orderedIndexes: number[];
  totalTravelSeconds: number;
  totalDistanceMeters: number;
  totalWaitingSeconds: number;
  finishedAt: string;
  feasible: boolean;
};

type SearchState = {
  path: number[];
  visited: boolean[];
  matrixIndex: number;
  cursorMs: number;
  travelSeconds: number;
  distanceMeters: number;
  waitingSeconds: number;
};

const EXACT_SEARCH_STOP_LIMIT = 9;

function earliestServiceTime(stop: OptimizableStop, arrivalMs: number) {
  const availableMs = stop.availableFrom
    ? new Date(stop.availableFrom).getTime()
    : Number.NEGATIVE_INFINITY;
  const windowStartMs = stop.windowStart
    ? new Date(stop.windowStart).getTime()
    : Number.NEGATIVE_INFINITY;
  return Math.max(arrivalMs, availableMs, windowStartMs);
}

function isInsideWindow(stop: OptimizableStop, serviceEndMs: number) {
  return !stop.windowEnd || serviceEndMs <= new Date(stop.windowEnd).getTime();
}

function canServeAfterArrival(
  stop: OptimizableStop,
  arrivalMs: number,
  serviceStartMs: number,
) {
  return stop.allowWaiting !== false || serviceStartMs <= arrivalMs;
}

function toResult(
  input: RouteOptimizationInput,
  state: SearchState,
  feasible: boolean,
): OptimizedRoute {
  return {
    orderedStopIds: state.path.map((index) => input.stops[index].id),
    orderedIndexes: state.path,
    totalTravelSeconds: state.travelSeconds,
    totalDistanceMeters: state.distanceMeters,
    totalWaitingSeconds: state.waitingSeconds,
    finishedAt: new Date(state.cursorMs).toISOString(),
    feasible,
  };
}

function greedyRoute(input: RouteOptimizationInput, knownInfeasible = false) {
  const remaining = input.stops.map((_, index) => index);
  let feasible = !knownInfeasible;
  const state: SearchState = {
    path: [],
    visited: input.stops.map(() => false),
    matrixIndex: 0,
    cursorMs: input.startTime.getTime(),
    travelSeconds: 0,
    distanceMeters: 0,
    waitingSeconds: 0,
  };

  while (remaining.length > 0) {
    const immediatelyReachable = remaining.filter((index) => {
      const duration = input.durations[state.matrixIndex][index + 1] ?? 0;
      const arrivalMs = state.cursorMs + duration * 1_000;
      const serviceStartMs = earliestServiceTime(input.stops[index], arrivalMs);
      return canServeAfterArrival(
        input.stops[index],
        arrivalMs,
        serviceStartMs,
      );
    });
    const candidates =
      immediatelyReachable.length > 0 ? immediatelyReachable : remaining;
    if (immediatelyReachable.length === 0) feasible = false;

    candidates.sort((left, right) => {
      if (state.path.length === 0) {
        const canStartImmediately = (index: number) => {
          const duration = input.durations[state.matrixIndex][index + 1] ?? 0;
          const arrivalMs = state.cursorMs + duration * 1_000;
          return (
            earliestServiceTime(input.stops[index], arrivalMs) <= arrivalMs
          );
        };
        const priorityDifference =
          Number(
            Boolean(input.stops[right].preferredFirst) &&
              canStartImmediately(right),
          ) -
          Number(
            Boolean(input.stops[left].preferredFirst) &&
              canStartImmediately(left),
          );
        if (priorityDifference !== 0) return priorityDifference;
      }
      const leftEnd = input.stops[left].windowEnd
        ? new Date(input.stops[left].windowEnd!).getTime()
        : Number.POSITIVE_INFINITY;
      const rightEnd = input.stops[right].windowEnd
        ? new Date(input.stops[right].windowEnd!).getTime()
        : Number.POSITIVE_INFINITY;
      if (leftEnd !== rightEnd) return leftEnd - rightEnd;
      return (
        (input.durations[state.matrixIndex][left + 1] ??
          Number.MAX_SAFE_INTEGER) -
        (input.durations[state.matrixIndex][right + 1] ??
          Number.MAX_SAFE_INTEGER)
      );
    });

    const next = candidates[0];
    remaining.splice(remaining.indexOf(next), 1);
    const duration = input.durations[state.matrixIndex][next + 1] ?? 0;
    const distance = input.distances[state.matrixIndex][next + 1] ?? 0;
    const arrivalMs = state.cursorMs + duration * 1_000;
    const serviceStartMs = earliestServiceTime(input.stops[next], arrivalMs);
    const serviceEndMs =
      serviceStartMs + input.stops[next].serviceSeconds * 1_000;
    if (!isInsideWindow(input.stops[next], serviceEndMs)) feasible = false;

    state.path.push(next);
    state.travelSeconds += duration;
    state.distanceMeters += distance;
    state.waitingSeconds += Math.max(0, (serviceStartMs - arrivalMs) / 1_000);
    state.cursorMs = serviceEndMs;
    state.matrixIndex = next + 1;
  }

  return toResult(input, state, feasible);
}

export function optimizeRoute(input: RouteOptimizationInput): OptimizedRoute {
  if (input.stops.length === 0) {
    return {
      orderedStopIds: [],
      orderedIndexes: [],
      totalTravelSeconds: 0,
      totalDistanceMeters: 0,
      totalWaitingSeconds: 0,
      finishedAt: input.startTime.toISOString(),
      feasible: true,
    };
  }

  if (input.stops.length > EXACT_SEARCH_STOP_LIMIT) {
    return greedyRoute(input);
  }

  let bestState: SearchState | null = null;
  const initialState: SearchState = {
    path: [],
    visited: input.stops.map(() => false),
    matrixIndex: 0,
    cursorMs: input.startTime.getTime(),
    travelSeconds: 0,
    distanceMeters: 0,
    waitingSeconds: 0,
  };

  function visit(state: SearchState) {
    if (state.path.length === input.stops.length) {
      if (
        !bestState ||
        state.cursorMs < bestState.cursorMs ||
        (state.cursorMs === bestState.cursorMs &&
          state.distanceMeters < bestState.distanceMeters)
      ) {
        bestState = state;
      }
      return;
    }

    if (bestState && state.cursorMs >= bestState.cursorMs) return;

    for (let index = 0; index < input.stops.length; index += 1) {
      if (state.visited[index]) continue;

      const duration = input.durations[state.matrixIndex]?.[index + 1];
      const distance = input.distances[state.matrixIndex]?.[index + 1];
      if (duration == null || distance == null) continue;

      const arrivalMs = state.cursorMs + duration * 1_000;
      const serviceStartMs = earliestServiceTime(input.stops[index], arrivalMs);
      if (
        !canServeAfterArrival(input.stops[index], arrivalMs, serviceStartMs)
      ) {
        continue;
      }
      const serviceEndMs =
        serviceStartMs + input.stops[index].serviceSeconds * 1_000;
      if (!isInsideWindow(input.stops[index], serviceEndMs)) continue;

      const nextVisited = [...state.visited];
      nextVisited[index] = true;
      visit({
        path: [...state.path, index],
        visited: nextVisited,
        matrixIndex: index + 1,
        cursorMs: serviceEndMs,
        travelSeconds: state.travelSeconds + duration,
        distanceMeters: state.distanceMeters + distance,
        waitingSeconds:
          state.waitingSeconds +
          Math.max(0, (serviceStartMs - arrivalMs) / 1_000),
      });
    }
  }

  visit(initialState);
  return bestState
    ? toResult(input, bestState, true)
    : greedyRoute(input, true);
}
