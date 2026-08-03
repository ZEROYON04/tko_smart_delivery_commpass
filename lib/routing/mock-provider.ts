import type { Coordinate, RouteLegResult, RoutingProvider } from "./types";

const EARTH_RADIUS_METERS = 6_371_000;
const ROAD_DISTANCE_FACTOR = 1.3;
const MOCK_SPEED_KMH = 25;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function calculateHaversineDistance(
  origin: Coordinate,
  destination: Coordinate,
) {
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export class MockRoutingProvider implements RoutingProvider {
  async calculateLeg(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<RouteLegResult> {
    const directDistance = calculateHaversineDistance(origin, destination);
    const distanceMeters = Math.round(directDistance * ROAD_DISTANCE_FACTOR);
    const metersPerSecond = (MOCK_SPEED_KMH * 1_000) / 3_600;

    return {
      distanceMeters,
      durationSeconds: Math.max(
        1,
        Math.round(distanceMeters / metersPerSecond),
      ),
      geometry: [origin, destination],
    };
  }
}
