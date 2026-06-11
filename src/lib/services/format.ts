export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours} ч`;
  }

  return `${hours} ч ${remainingMinutes} мин`;
}

export function formatPrice(priceCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("bg-BG", {
      style: "currency",
      currency,
      maximumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}
