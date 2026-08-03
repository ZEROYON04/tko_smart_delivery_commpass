export const DELIVERY_TIME_SLOT_LABELS = {
  morning: "午前中（8:00〜12:00）",
  "12_14": "12:00〜14:00",
  "14_16": "14:00〜16:00",
  "16_18": "16:00〜18:00",
  "18_20": "18:00〜20:00",
  "19_21": "19:00〜21:00",
} as const;

export type DeliveryTimeSlot = keyof typeof DELIVERY_TIME_SLOT_LABELS;
