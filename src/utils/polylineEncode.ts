/**
 * Encode coordinates as a Google-encoded polyline (same algorithm RouteMap decodes).
 */
function encodeSigned(n: number): string {
  let v = n < 0 ? ~(n << 1) : n << 1;
  let out = "";
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}

export function encodePolyline(points: [number, number][]): string {
  if (!points.length) return "";
  let prevLat = 0;
  let prevLng = 0;
  let encoded = "";
  for (const [lat, lng] of points) {
    const lat5 = Math.round(lat * 1e5);
    const lng5 = Math.round(lng * 1e5);
    encoded += encodeSigned(lat5 - prevLat);
    encoded += encodeSigned(lng5 - prevLng);
    prevLat = lat5;
    prevLng = lng5;
  }
  return encoded;
}

/**
 * Decode Google-encoded polyline into [lat,lng] points.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/** Approximate path length in km (for RouteMap summary). */
export function pathLengthKm(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    km += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return km;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function distMeters(a: [number, number], b: [number, number]): number {
  return haversineKm(a[0], a[1], b[0], b[1]) * 1000;
}

function closestPointOnSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number
): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-20) return [ax, ay];
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return [ax + t * dx, ay + t * dy];
}

/**
 * Split encoded polyline at the point on the path closest to (lat, lng).
 * Used so "completed" route color ends at a stop location, not a length ratio of vertices.
 */
export function splitPolylineAtNearestPoint(
  polyline: string,
  lat: number,
  lng: number
): { done: string | null; remaining: string | null } {
  const METERS_EPS = 2;
  const points = decodePolyline(polyline);
  if (points.length < 2) return { done: null, remaining: null };

  const dedupe = (pts: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const p of pts) {
      if (out.length === 0 || distMeters(out[out.length - 1], p) > METERS_EPS) out.push(p);
    }
    return out;
  };

  let bestSeg = 0;
  let bestC: [number, number] = points[0];
  let bestDistM = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const c = closestPointOnSegment(ax, ay, bx, by, lat, lng);
    const d = distMeters(c, [lat, lng]);
    if (d < bestDistM) {
      bestDistM = d;
      bestSeg = i;
      bestC = c;
    }
  }

  const C = bestC;
  const donePts: [number, number][] = points.slice(0, bestSeg + 1);
  if (distMeters(C, donePts[donePts.length - 1]) > METERS_EPS) {
    donePts.push(C);
  }
  if (donePts.length < 2 && points.length >= 2) {
    donePts.push(points[1]);
  }

  let remPts: [number, number][] = [C, ...points.slice(bestSeg + 1)];
  remPts = dedupe(remPts);

  if (remPts.length < 2) {
    return { done: polyline, remaining: null };
  }
  if (donePts.length < 2) {
    return { done: null, remaining: polyline };
  }

  return {
    done: encodePolyline(donePts),
    remaining: encodePolyline(remPts),
  };
}

const JOIN_EPS_M = 4;

/** Join two encoded polylines end-to-end, deduping a shared vertex at the join when it overlaps. */
export function concatEncodedPolylines(a: string, b: string): string | null {
  if (!a?.trim()) return b?.trim() ? b : null;
  if (!b?.trim()) return a;
  const pa = decodePolyline(a);
  const pb = decodePolyline(b);
  if (pa.length === 0) return b;
  if (pb.length === 0) return a;
  const lastA = pa[pa.length - 1];
  const firstB = pb[0];
  const merged =
    haversineKm(lastA[0], lastA[1], firstB[0], firstB[1]) * 1000 <= JOIN_EPS_M
      ? [...pa, ...pb.slice(1)]
      : [...pa, ...pb];
  if (merged.length < 2) return null;
  return encodePolyline(merged);
}

/** Minimum distance (meters) from a point to any segment of the encoded polyline. */
export function distancePointToPolylineMeters(polyline: string, lat: number, lng: number): number {
  const points = decodePolyline(polyline);
  if (points.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const c = closestPointOnSegment(ax, ay, bx, by, lat, lng);
    const d = distMeters(c, [lat, lng]);
    if (d < best) best = d;
  }
  return best;
}
