export const SERVICE_SECONDS = {
  handoff: 300,
  dropoff: 10,
} as const;

export const DEMO_RUN_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_DELIVERY_ID = "00000000-0000-4000-8000-000000000103";

export const DELIVERY_METHOD_LABELS = {
  handoff: "対面受取",
  dropoff: "置き配",
} as const;

export const DROPOFF_LOCATION_LABELS = {
  front_door: "玄関前",
  delivery_box: "宅配ボックス",
  gas_meter_box: "ガスメーターボックス",
  bicycle_basket: "自転車のかご",
  building_reception: "建物の受付・管理人",
  other: "その他の指定場所",
} as const;

export const DELIVERY_STATUS_LABELS = {
  pending: "配送待ち",
  out_for_delivery: "配送中",
  delivered: "配達完了",
  absent: "ご不在",
  cancelled: "キャンセル",
} as const;
