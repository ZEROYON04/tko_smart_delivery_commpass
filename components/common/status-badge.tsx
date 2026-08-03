import {
  DELIVERY_METHOD_LABELS,
  DELIVERY_STATUS_LABELS,
} from "@/lib/constants/delivery";
import type {
  DeliveryMethod,
  DeliveryStatus,
  RunStatus,
} from "@/types/delivery";

type StatusBadgeProps =
  | { kind: "method"; value: DeliveryMethod }
  | { kind: "delivery"; value: DeliveryStatus }
  | { kind: "run"; value: RunStatus };

const runLabels: Record<RunStatus, string> = {
  planned: "開始前",
  active: "配送中",
  completed: "完了",
};

export function StatusBadge(props: StatusBadgeProps) {
  const label =
    props.kind === "method"
      ? DELIVERY_METHOD_LABELS[props.value]
      : props.kind === "delivery"
        ? DELIVERY_STATUS_LABELS[props.value]
        : runLabels[props.value];
  const style =
    props.kind === "method"
      ? props.value === "dropoff"
        ? "border-teal-200 bg-teal-50 text-teal-800"
        : "border-slate-200 bg-slate-50 text-slate-700"
      : props.kind === "run"
        ? props.value === "active"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : props.value === "completed"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-800"
        : props.value === "delivered"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : props.value === "absent"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : props.value === "out_for_delivery"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
