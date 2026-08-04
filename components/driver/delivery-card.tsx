"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { DROPOFF_LOCATION_LABELS } from "@/lib/constants/delivery";
import { DELIVERY_TIME_SLOT_LABELS } from "@/lib/constants/time-slots";
import {
  formatDistance,
  formatEta,
  formatServiceTime,
} from "@/lib/format/delivery";
import { CARRIER_LABELS, formatWindowLabel } from "@/lib/scheduling/time-slots";
import type { RouteStop } from "@/types/delivery";

export function DeliveryCard({ stop }: { stop: RouteStop }) {
  const isDropoff = stop.delivery.deliveryMethod === "dropoff";
  const [notifying, setNotifying] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );

  async function notifyRecipient() {
    setNotifying(true);
    setNotificationMessage(null);

    try {
      const response = await fetch(
        `/api/deliveries/${stop.delivery.id}/notify`,
        { method: "POST" },
      );
      const body = (await response.json()) as { message?: string };
      setNotificationMessage(
        body.message ??
          (response.ok ? "通知を送信しました。" : "通知に失敗しました。"),
      );
    } catch {
      setNotificationMessage("通知に失敗しました。");
    } finally {
      setNotifying(false);
    }
  }

  return (
    <article
      className={`relative rounded-2xl border bg-white p-4 transition sm:p-5 ${
        isDropoff
          ? "border-teal-200 shadow-[0_8px_30px_rgba(13,148,136,0.08)]"
          : "border-slate-200"
      }`}
    >
      {isDropoff && (
        <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-teal-500" />
      )}
      <div className="flex gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
            stop.delivery.status === "delivered"
              ? "bg-emerald-100 text-emerald-700"
              : stop.delivery.status === "absent"
                ? "bg-amber-100 text-amber-800"
                : isDropoff
                  ? "bg-teal-100 text-teal-800"
                  : "bg-slate-100 text-slate-700"
          }`}
        >
          {stop.delivery.status === "delivered"
            ? "✓"
            : stop.delivery.status === "absent"
              ? "不在"
              : stop.stopOrder}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                {stop.delivery.trackingNumber}
              </p>
              <h3 className="mt-0.5 font-bold text-slate-900">
                {stop.delivery.address}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {stop.delivery.recipientName}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {CARRIER_LABELS[stop.delivery.carrier]} ·
                {formatWindowLabel(
                  stop.delivery.carrier,
                  stop.delivery.requestedWindowCode,
                )}
              </p>
              {isDropoff && (
                <p className="mt-1 text-xs font-bold text-teal-700">
                  置き配場所：
                  {stop.delivery.dropoffLocation
                    ? DROPOFF_LOCATION_LABELS[stop.delivery.dropoffLocation]
                    : "未指定"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  stop.delivery.lineLinked
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {stop.delivery.lineLinked ? "LINE連携済み" : "LINE未連携"}
              </span>
              <StatusBadge kind="method" value={stop.delivery.deliveryMethod} />
              <StatusBadge kind="delivery" value={stop.delivery.status} />
              {stop.delivery.isReattempt && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                  再配達 {stop.delivery.reattemptCount}回目
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[11px] text-slate-400">到着予定</p>
              <p className="mt-0.5 font-bold tabular-nums text-slate-800">
                {formatEta(stop.estimatedArrival)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">滞在予定</p>
              <p
                className={`mt-0.5 font-bold ${isDropoff ? "text-teal-700" : "text-slate-800"}`}
              >
                {formatServiceTime(stop.delivery.serviceSeconds)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">区間距離</p>
              <p className="mt-0.5 font-bold text-slate-800">
                {formatDistance(stop.distanceMeters)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            指定時間帯：
            <span className="font-semibold text-slate-700">
              {DELIVERY_TIME_SLOT_LABELS[stop.delivery.deliveryTimeSlot]}
            </span>
          </p>

          {stop.delivery.rescheduleRequestedAt && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              受取人から「本日は受取不可」の連絡あり・日時変更待ち
            </p>
          )}

          {stop.delivery.unavailableUntil && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              受取人から短時間不在の連絡あり（
              {new Intl.DateTimeFormat("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tokyo",
              }).format(new Date(stop.delivery.unavailableUntil))}
              まで）
            </p>
          )}

          {notificationMessage && (
            <p className="mt-3 text-xs text-slate-600" role="status">
              {notificationMessage}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
            <button
              className="rounded-lg bg-[#06c755] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#05b64d] disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!stop.delivery.lineLinked || notifying}
              onClick={() => void notifyRecipient()}
              type="button"
            >
              {notifying ? "送信中…" : "LINEで到着通知"}
            </button>
            <Link
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              href={`/recipient/${stop.delivery.id}`}
            >
              受取人画面を開く →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
