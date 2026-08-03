export type DeliveryMethod = "handoff" | "dropoff";

export type DeliveryStatus =
  "pending" | "out_for_delivery" | "delivered" | "absent" | "cancelled";

export type RunStatus = "planned" | "active" | "completed";

export type Delivery = {
  id: string;
  runId: string;
  trackingNumber: string;
  recipientName: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryMethod: DeliveryMethod;
  serviceSeconds: number;
  status: DeliveryStatus;
  version: number;
};

export type RouteStop = {
  stopId: string;
  stopOrder: number;
  estimatedArrival: string | null;
  locked: boolean;
  distanceMeters: number;
  durationSeconds: number;
  provider: string;
  delivery: Delivery;
};

export type DeliveryRun = {
  id: string;
  driverName: string;
  deliveryDate: string;
  status: RunStatus;
  currentStopOrder: number;
  depotLatitude: number;
  depotLongitude: number;
  startedAt: string | null;
  completedAt: string | null;
};

export type DriverLocation = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type RunResponse = {
  run: DeliveryRun;
  stops: RouteStop[];
  latestLocation: DriverLocation | null;
};

export type RecipientDeliveryResponse = {
  delivery: Delivery;
  stop: Pick<RouteStop, "stopId" | "stopOrder" | "estimatedArrival" | "locked">;
  driverName: string;
};
