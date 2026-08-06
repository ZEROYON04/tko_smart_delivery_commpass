import type {
  Coordinate,
  RouteLegResult,
  RouteMatrixResult,
  RoutingProvider,
} from "./types";

type OsrmGeometry = {
  type: "LineString";
  coordinates: Array<[number, number]>;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{ geometry: OsrmGeometry }>;
    }>;
  }>;
};

type OsrmTableResponse = {
  code: string;
  durations?: Array<Array<number | null>>;
  distances?: Array<Array<number | null>>;
};

const OSRM_MAX_COORDINATES_PER_REQUEST = 100;
const OSRM_MATRIX_BATCH_SIZE = 50;

function coordinatePath(coordinates: Coordinate[]) {
  return coordinates
    .map(({ longitude, latitude }) => `${longitude},${latitude}`)
    .join(";");
}

function mapGeometry(geometry: OsrmGeometry | undefined): Coordinate[] {
  return (geometry?.coordinates ?? []).map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));
}

function mergeStepGeometry(
  steps: Array<{ geometry: OsrmGeometry }>,
): Coordinate[] {
  return steps.flatMap((step, index) => {
    const points = mapGeometry(step.geometry);
    return index === 0 ? points : points.slice(1);
  });
}

export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = "osrm";

  constructor(private readonly baseUrl = "https://router.project-osrm.org") {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "User-Agent": "SmartDeliveryCompassDemo/1.0" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`OSRM_HTTP_${response.status}`);
    }
    return (await response.json()) as T;
  }

  async calculateLeg(origin: Coordinate, destination: Coordinate) {
    const [leg] = await this.calculateRoute([origin, destination]);
    if (!leg) throw new Error("OSRM_ROUTE_NOT_FOUND");
    return leg;
  }

  async calculateRoute(coordinates: Coordinate[]): Promise<RouteLegResult[]> {
    if (coordinates.length < 2) return [];
    if (coordinates.length > OSRM_MAX_COORDINATES_PER_REQUEST) {
      const legs: RouteLegResult[] = [];
      for (
        let start = 0;
        start < coordinates.length - 1;
        start += OSRM_MAX_COORDINATES_PER_REQUEST - 1
      ) {
        const chunk = coordinates.slice(
          start,
          start + OSRM_MAX_COORDINATES_PER_REQUEST,
        );
        legs.push(...(await this.calculateRoute(chunk)));
      }
      return legs;
    }
    const result = await this.request<OsrmRouteResponse>(
      `/route/v1/driving/${coordinatePath(coordinates)}?overview=false&steps=true&geometries=geojson`,
    );
    const route = result.routes?.[0];
    if (result.code !== "Ok" || !route) throw new Error("OSRM_ROUTE_NOT_FOUND");

    return route.legs.map((leg) => ({
      distanceMeters: Math.round(leg.distance),
      durationSeconds: Math.max(1, Math.round(leg.duration)),
      geometry: mergeStepGeometry(leg.steps),
    }));
  }

  async calculateMatrix(coordinates: Coordinate[]): Promise<RouteMatrixResult> {
    if (coordinates.length > OSRM_MAX_COORDINATES_PER_REQUEST) {
      const size = coordinates.length;
      const durations: Array<Array<number | null>> = Array.from(
        { length: size },
        () => Array<number | null>(size).fill(null),
      );
      const distances: Array<Array<number | null>> = Array.from(
        { length: size },
        () => Array<number | null>(size).fill(null),
      );
      const requests: Array<Promise<void>> = [];

      for (
        let sourceStart = 0;
        sourceStart < size;
        sourceStart += OSRM_MATRIX_BATCH_SIZE
      ) {
        for (
          let destinationStart = 0;
          destinationStart < size;
          destinationStart += OSRM_MATRIX_BATCH_SIZE
        ) {
          const sourceIndexes = Array.from(
            { length: Math.min(OSRM_MATRIX_BATCH_SIZE, size - sourceStart) },
            (_, index) => sourceStart + index,
          );
          const destinationIndexes = Array.from(
            {
              length: Math.min(
                OSRM_MATRIX_BATCH_SIZE,
                size - destinationStart,
              ),
            },
            (_, index) => destinationStart + index,
          );
          requests.push(
            this.calculateMatrixBatch(
              coordinates,
              sourceIndexes,
              destinationIndexes,
              durations,
              distances,
            ),
          );
        }
      }

      await Promise.all(requests);
      return { durations, distances };
    }

    const result = await this.request<OsrmTableResponse>(
      `/table/v1/driving/${coordinatePath(coordinates)}?annotations=duration,distance`,
    );
    if (result.code !== "Ok" || !result.durations || !result.distances) {
      throw new Error("OSRM_MATRIX_NOT_FOUND");
    }
    return {
      durations: result.durations.map((row) =>
        row.map((value) => (value == null ? null : Math.round(value))),
      ),
      distances: result.distances.map((row) =>
        row.map((value) => (value == null ? null : Math.round(value))),
      ),
    };
  }

  private async calculateMatrixBatch(
    allCoordinates: Coordinate[],
    sourceIndexes: number[],
    destinationIndexes: number[],
    durations: Array<Array<number | null>>,
    distances: Array<Array<number | null>>,
  ) {
    const batchCoordinates = [
      ...sourceIndexes.map((index) => allCoordinates[index]),
      ...destinationIndexes.map((index) => allCoordinates[index]),
    ];
    const destinationOffset = sourceIndexes.length;
    const sources = sourceIndexes.map((_, index) => index).join(";");
    const destinations = destinationIndexes
      .map((_, index) => destinationOffset + index)
      .join(";");
    const result = await this.request<OsrmTableResponse>(
      `/table/v1/driving/${coordinatePath(batchCoordinates)}?sources=${sources}&destinations=${destinations}&annotations=duration,distance`,
    );
    if (result.code !== "Ok" || !result.durations || !result.distances) {
      throw new Error("OSRM_MATRIX_NOT_FOUND");
    }

    sourceIndexes.forEach((sourceIndex, sourceOffset) => {
      destinationIndexes.forEach((destinationIndex, destinationOffsetIndex) => {
        const duration = result.durations?.[sourceOffset]?.[destinationOffsetIndex];
        const distance = result.distances?.[sourceOffset]?.[destinationOffsetIndex];
        durations[sourceIndex][destinationIndex] =
          duration == null ? null : Math.round(duration);
        distances[sourceIndex][destinationIndex] =
          distance == null ? null : Math.round(distance);
      });
    });
  }
}
