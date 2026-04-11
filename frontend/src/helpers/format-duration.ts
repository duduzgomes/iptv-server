/**
 * Formats a duration value into "{h}h {m}min".
 *
 * Accepts:
 *  - number  → total minutes (e.g. 90 → "1h 30min")
 *  - string  → "01:30:00" / "1:30:00"  (HH:MM:SS)
 *             "90 min" / "90"           (plain minutes)
 *
 * Returns "—" when the value is null, undefined, 0 or unparseable.
 */
export function formatDuration(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";

  let totalMinutes: number;

  if (typeof value === "number") {
    totalMinutes = value;
  } else {
    const trimmed = value.trim();

    // HH:MM:SS or H:MM:SS
    const hhmmss = trimmed.match(/^(\d+):(\d{2}):\d{2}$/);
    if (hhmmss) {
      totalMinutes = Number(hhmmss[1]) * 60 + Number(hhmmss[2]);
    } else {
      // "90 min", "90min", "90"
      const plain = trimmed.match(/^(\d+)/);
      totalMinutes = plain ? Number(plain[1]) : NaN;
    }
  }

  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return "—";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}
