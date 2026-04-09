/** API / Redux may use number or string keys for driver id — compare and lookup with one form. */
export function normalizeDriverId(id: string | number): string {
  return String(id);
}

/** Read split from Redux assignment (number or numeric string from inputs). */
export function readStoredSplit(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Same driver roster (ids, order-insensitive) — if true, keep splits from Redux unless invalid.
 */
export function sameDriverIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const as = [...a].map(normalizeDriverId).sort();
  const bs = [...b].map(normalizeDriverId).sort();
  return as.every((id, i) => id === bs[i]);
}

/** Normalize assignment record keys to string driver ids (avoids 10 vs "10" mismatches). */
export function indexAssignmentsByDriverId<T extends { split?: number }>(
  assignments: Record<string, T>
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of Object.keys(assignments)) {
    out[normalizeDriverId(k)] = assignments[k];
  }
  return out;
}

/**
 * Default order counts per driver (user can change in Route Optimization).
 * Examples: 10 orders / 2 drivers → [5,5]; 11/2 → [5,6]; 11/3 → [4,4,3]; 12/3 → [4,4,4].
 * Remainder: 2 drivers → extra goes to the last driver; 3+ drivers → extra goes to the first drivers.
 */
export function computeDefaultOrderSplits(totalOrders: number, numDrivers: number): number[] {
  if (numDrivers <= 0) return [];
  const T = Math.max(0, Math.floor(totalOrders));
  const n = numDrivers;
  const base = Math.floor(T / n);
  const rem = T % n;
  const out = new Array(n).fill(base);
  if (rem === 0) return out;
  if (n === 2) {
    out[1] += rem;
  } else {
    for (let i = 0; i < rem; i++) out[i] += 1;
  }
  return out;
}
