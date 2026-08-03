import type { DeliveryTimeSlot } from "@/lib/constants/time-slots";

export type DeliveryMethod = "handoff" | "dropoff";

export type DropoffLocation =
  | "front_door"
  | "delivery_box"
  | "gas_meter_box"
  | "bicycle_basket"
  | "building_reception"
  | "other";

export type Carrier = "yamato" | "sagawa" | "japan_post";

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
  dropoffLocation: DropoffLocation | null;
  carrier: Carrier;
  requestedWindowCode: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  availableFrom: string | null;
  isReattempt: boolean;
  reattemptCount: number;
  lastAbsentAt: string | null;
  serviceSeconds: number;
  status: DeliveryStatus;
  lineLinked: boolean;
  unavailableUntil: string | null;
  deliveryTimeSlot: DeliveryTimeSlot;
  morningNotificationSentAt: string | null;
  approachingNotificationSentAt: string | null;
  rescheduleRequestedAt: string | null;
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
  geometry: Array<{ latitude: number; longitude: number }>;
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
  depotName: string;
  depotAddress: string;
  startedAt: string | null;
  completedAt: string | null;
  routeRevision: number;
  routeProvider: string;
  optimizedAt: string | null;
  optimizationNote: string | null;
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

export type RouteOptimizationResponse = {
  runId: string;
  provider: string;
  usedFallback: boolean;
  stopCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  reason: string;
  orderedDeliveryIds: string[];
};
