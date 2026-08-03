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
}
