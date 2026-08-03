import type { Carrier } from "@/types/delivery";

export type DeliveryTimeSlot = {
  code: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
};

export const CARRIER_LABELS: Record<Carrier, string> = {
  yamato: "ヤマト運輸",
  sagawa: "佐川急便",
  japan_post: "日本郵便・ゆうパック",
};

export const CARRIER_TIME_SLOTS: Record<Carrier, DeliveryTimeSlot[]> = {
  yamato: [
    {
      code: "morning",
      label: "午前中",
      startMinutes: 8 * 60,
      endMinutes: 12 * 60,
    },
    {
      code: "14-16",
      label: "14～16時",
      startMinutes: 14 * 60,
      endMinutes: 16 * 60,
    },
    {
      code: "16-18",
      label: "16～18時",
      startMinutes: 16 * 60,
      endMinutes: 18 * 60,
    },
    {
      code: "18-20",
      label: "18～20時",
      startMinutes: 18 * 60,
      endMinutes: 20 * 60,
    },
    {
      code: "19-21",
      label: "19～21時",
      startMinutes: 19 * 60,
      endMinutes: 21 * 60,
    },
  ],
  sagawa: [
    {
      code: "morning",
      label: "午前中（8～12時）",
      startMinutes: 8 * 60,
      endMinutes: 12 * 60,
    },
    {
      code: "12-14",
      label: "12～14時",
      startMinutes: 12 * 60,
      endMinutes: 14 * 60,
    },
    {
      code: "14-16",
      label: "14～16時",
      startMinutes: 14 * 60,
      endMinutes: 16 * 60,
    },
    {
      code: "16-18",
      label: "16～18時",
      startMinutes: 16 * 60,
      endMinutes: 18 * 60,
    },
    {
      code: "18-20",
      label: "18～20時",
      startMinutes: 18 * 60,
      endMinutes: 20 * 60,
    },
    {
      code: "18-21",
      label: "18～21時",
      startMinutes: 18 * 60,
      endMinutes: 21 * 60,
    },
    {
      code: "19-21",
      label: "19～21時",
      startMinutes: 19 * 60,
      endMinutes: 21 * 60,
    },
  ],
  japan_post: [
    {
      code: "morning",
      label: "午前中",
      startMinutes: 8 * 60,
      endMinutes: 12 * 60,
    },
    {
      code: "12-14",
      label: "12～14時頃",
      startMinutes: 12 * 60,
      endMinutes: 14 * 60,
    },
    {
      code: "14-16",
      label: "14～16時頃",
      startMinutes: 14 * 60,
      endMinutes: 16 * 60,
    },
    {
      code: "16-18",
      label: "16～18時頃",
      startMinutes: 16 * 60,
      endMinutes: 18 * 60,
    },
    {
      code: "18-20",
      label: "18～20時頃",
      startMinutes: 18 * 60,
      endMinutes: 20 * 60,
    },
    {
      code: "19-21",
      label: "19～21時頃",
      startMinutes: 19 * 60,
      endMinutes: 21 * 60,
    },
  ],
};

export function getCarrierTimeSlots(carrier: Carrier) {
  return CARRIER_TIME_SLOTS[carrier];
}

export function getTimeSlot(carrier: Carrier, code: string | null) {
  if (!code) return null;
  return CARRIER_TIME_SLOTS[carrier].find((slot) => slot.code === code) ?? null;
}

function dateAtJstMinutes(date: string, minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return new Date(`${date}T${hours}:${minute}:00+09:00`);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00+09:00`);
  next.setUTCDate(next.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(next);
}

export function buildDeliveryWindow(
  deliveryDate: string,
  carrier: Carrier,
  windowCode: string,
) {
  const slot = getTimeSlot(carrier, windowCode);
  if (!slot) throw new Error("INVALID_DELIVERY_WINDOW");

  return {
    code: slot.code,
    label: slot.label,
    start: dateAtJstMinutes(deliveryDate, slot.startMinutes),
    end: dateAtJstMinutes(deliveryDate, slot.endMinutes),
  };
}

type ResolveReattemptWindowInput = {
  deliveryDate: string;
  carrier: Carrier;
  currentWindowCode: string | null;
  preferredWindowCode?: string | null;
  returnAt: Date;
};

export function resolveReattemptWindow({
  deliveryDate,
  carrier,
  currentWindowCode,
  preferredWindowCode,
  returnAt,
}: ResolveReattemptWindowInput) {
  const candidates = [currentWindowCode, preferredWindowCode].filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
  );

  for (const code of candidates) {
    const window = buildDeliveryWindow(deliveryDate, carrier, code);
    if (returnAt <= window.end) {
      return {
        ...window,
        availableFrom: new Date(
          Math.max(returnAt.getTime(), window.start.getTime()),
        ),
        movedToNextDay: false,
      };
    }
  }

  for (const slot of getCarrierTimeSlots(carrier)) {
    const window = buildDeliveryWindow(deliveryDate, carrier, slot.code);
    if (returnAt <= window.end) {
      return {
        ...window,
        availableFrom: new Date(
          Math.max(returnAt.getTime(), window.start.getTime()),
        ),
        movedToNextDay: false,
      };
    }
  }

  const nextDate = addDays(deliveryDate, 1);
  const firstSlot = getCarrierTimeSlots(carrier)[0];
  const window = buildDeliveryWindow(nextDate, carrier, firstSlot.code);
  return {
    ...window,
    availableFrom: window.start,
    movedToNextDay: true,
  };
}

export function formatWindowLabel(carrier: Carrier, code: string | null) {
  return getTimeSlot(carrier, code)?.label ?? "時間帯指定なし";
}
