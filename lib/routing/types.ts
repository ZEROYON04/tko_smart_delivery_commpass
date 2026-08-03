export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteLegResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinate[];
};

export interface RoutingProvider {
  calculateLeg(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<RouteLegResult>;
}
