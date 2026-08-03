export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteLegResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinate[];
};

export type RouteMatrixResult = {
  durations: Array<Array<number | null>>;
  distances: Array<Array<number | null>>;
};

export interface RoutingProvider {
  readonly name: string;

  calculateLeg(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<RouteLegResult>;

  calculateRoute(coordinates: Coordinate[]): Promise<RouteLegResult[]>;

  calculateMatrix(coordinates: Coordinate[]): Promise<RouteMatrixResult>;
}
