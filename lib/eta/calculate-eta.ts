import type { DeliveryStatus } from "@/types/delivery";

export type EtaStopInput = {
  stopOrder: number;
  durationSeconds: number;
  serviceSeconds: number;
  status?: DeliveryStatus;
  estimatedArrival?: string | null;
};

export type EtaStopResult = EtaStopInput & {
  estimatedArrival: string;
};

export function calculateEtas(
  baseTime: Date,
  stops: EtaStopInput[],
): EtaStopResult[] {
  let cursorMilliseconds = baseTime.getTime();

  return [...stops]
    .sort((left, right) => left.stopOrder - right.stopOrder)
    .map((stop) => {
      cursorMilliseconds += stop.durationSeconds * 1_000;
      const calculatedArrival = new Date(cursorMilliseconds).toISOString();
      const estimatedArrival =
        stop.status === "delivered" && stop.estimatedArrival
          ? stop.estimatedArrival
          : calculatedArrival;

      cursorMilliseconds += stop.serviceSeconds * 1_000;

      return { ...stop, estimatedArrival };
    });
}
