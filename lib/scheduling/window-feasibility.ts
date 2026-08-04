export type WindowFeasibilityInput = {
  estimatedArrival: string | null;
  serviceSeconds: number;
  windowEnd: string | null;
  unavailableUntil?: string | null;
};

export type WindowFeasibility = {
  canCompleteWithinWindow: boolean;
  serviceStart: string | null;
  serviceEnd: string | null;
};

function validTime(value: string | null | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function assessWindowFeasibility({
  estimatedArrival,
  serviceSeconds,
  windowEnd,
  unavailableUntil,
}: WindowFeasibilityInput): WindowFeasibility {
  const arrivalMs = validTime(estimatedArrival);
  const windowEndMs = validTime(windowEnd);
  const unavailableUntilMs = validTime(unavailableUntil);

  if (arrivalMs == null || windowEndMs == null) {
    return {
      canCompleteWithinWindow: false,
      serviceStart: null,
      serviceEnd: null,
    };
  }

  const serviceStartMs = Math.max(arrivalMs, unavailableUntilMs ?? arrivalMs);
  const serviceEndMs = serviceStartMs + Math.max(0, serviceSeconds) * 1_000;

  return {
    canCompleteWithinWindow: serviceEndMs <= windowEndMs,
    serviceStart: new Date(serviceStartMs).toISOString(),
    serviceEnd: new Date(serviceEndMs).toISOString(),
  };
}
