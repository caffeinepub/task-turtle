/** Convert paise (bigint) to INR string like ₹249.00 */
export function formatINR(paise: bigint | undefined | null): string {
  if (paise == null) return "₹0";
  const inr = Number(paise) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(inr);
}

/** INR to paise (multiply by 100) */
export function inrToPaise(inr: number): bigint {
  return BigInt(Math.round(inr * 100));
}

/** Format nanosecond timestamp to readable date */
export function formatTimestamp(nanos: bigint | undefined): string {
  if (!nanos) return "—";
  const ms = Number(nanos) / 1_000_000;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}
