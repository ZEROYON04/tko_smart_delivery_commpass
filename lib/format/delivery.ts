export function formatEta(value: string | null) {
  if (!value) {
    return "計算中";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function formatDeliveryDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export function formatServiceTime(seconds: number) {
  if (seconds < 60) {
    return `${seconds}秒`;
  }

  return `${Math.round(seconds / 60)}分`;
}

export function formatDistance(meters: number) {
  return meters >= 1_000 ? `${(meters / 1_000).toFixed(1)} km` : `${meters} m`;
}

export function formatRelativeArrival(value: string | null) {
  if (!value) {
    return "到着時刻を計算しています";
  }

  const differenceMinutes = Math.max(
    0,
    Math.round((new Date(value).getTime() - Date.now()) / 60_000),
  );

  if (differenceMinutes < 1) {
    return "まもなく到着予定です";
  }
  if (differenceMinutes < 60) {
    return `あと約${differenceMinutes}分で到着予定です`;
  }

  const hours = Math.floor(differenceMinutes / 60);
  const minutes = differenceMinutes % 60;
  return minutes === 0
    ? `あと約${hours}時間で到着予定です`
    : `あと約${hours}時間${minutes}分で到着予定です`;
}
