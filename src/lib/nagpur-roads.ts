import type { Report } from "@/types";
import { NAGPUR_WARDS, getWardForPoint } from "@/lib/civic-intelligence";
import roadsData from "@/data/nagpur-roads.json";

export interface NagpurRoad {
  id: string;
  name: string;
  wardId: string;
  /** [lat, lng][] along the road corridor (from OpenStreetMap) */
  path: [number, number][];
  accidentProne: boolean;
  accidentRiskLabel?: string;
}

/** Real Nagpur corridor centerlines from OpenStreetMap */
export const NAGPUR_ROADS: NagpurRoad[] = roadsData as NagpurRoad[];

const SNAP_THRESHOLD_M = 120;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distPointToSegment(
  pLat: number,
  pLng: number,
  a: [number, number],
  b: [number, number]
): number {
  const midLat = (a[0] + b[0]) / 2;
  const midLng = (a[1] + b[1]) / 2;
  return Math.min(
    haversineM(pLat, pLng, a[0], a[1]),
    haversineM(pLat, pLng, b[0], b[1]),
    haversineM(pLat, pLng, midLat, midLng)
  );
}

export function distanceToRoadM(lat: number, lng: number, road: NagpurRoad): number {
  let min = Infinity;
  for (let i = 0; i < road.path.length - 1; i++) {
    min = Math.min(min, distPointToSegment(lat, lng, road.path[i], road.path[i + 1]));
  }
  return min;
}

export function findNearestRoad(
  lat: number,
  lng: number,
  maxM = SNAP_THRESHOLD_M
): NagpurRoad | null {
  let best: NagpurRoad | null = null;
  let bestD = Infinity;
  for (const road of NAGPUR_ROADS) {
    const d = distanceToRoadM(lat, lng, road);
    if (d < bestD) {
      bestD = d;
      best = road;
    }
  }
  return bestD <= maxM ? best : null;
}

export function getRoadById(id: string): NagpurRoad | undefined {
  return NAGPUR_ROADS.find((r) => r.id === id);
}

export function getRoadsForWard(wardId: string): NagpurRoad[] {
  return NAGPUR_ROADS.filter((r) => r.wardId === wardId);
}

export function getRoadCentroid(road: NagpurRoad): { lat: number; lng: number } {
  const lat = road.path.reduce((s, p) => s + p[0], 0) / road.path.length;
  const lng = road.path.reduce((s, p) => s + p[1], 0) / road.path.length;
  return { lat, lng };
}

/** Point on a road path for snapping demo incidents / markers */
export function getRoadSamplePoint(roadId: string, t = 0.5): { lat: number; lng: number } | null {
  const road = getRoadById(roadId);
  if (!road?.path.length) return null;
  const idx = Math.min(
    road.path.length - 1,
    Math.max(0, Math.round(t * (road.path.length - 1)))
  );
  const [lat, lng] = road.path[idx];
  return { lat, lng };
}

export function getReportsOnRoad(road: NagpurRoad, reports: Report[]): Report[] {
  return reports.filter(
    (r) =>
      r.status !== "RESOLVED" &&
      distanceToRoadM(r.latitude, r.longitude, road) <= SNAP_THRESHOLD_M
  );
}

export interface RoadHighlightState {
  road: NagpurRoad;
  issueCount: number;
  maxSeverity: number;
  accidentProne: boolean;
  isSelected: boolean;
}

export function buildRoadHighlightStates(
  reports: Report[],
  selectedRoadId: string | null
): RoadHighlightState[] {
  return NAGPUR_ROADS.map((road) => {
    const onRoad = getReportsOnRoad(road, reports);
    const maxSeverity = onRoad.reduce(
      (m, r) => Math.max(m, r.aiMetadata?.severity ?? 5),
      0
    );
    return {
      road,
      issueCount: onRoad.length,
      maxSeverity,
      accidentProne: road.accidentProne,
      isSelected: road.id === selectedRoadId,
    };
  });
}

export function roadStrokeForState(state: RoadHighlightState): {
  color: string;
  weight: number;
  opacity: number;
  dashArray?: string;
} {
  if (state.isSelected) {
    return { color: "#fbbf24", weight: 10, opacity: 1 };
  }
  if (state.issueCount > 0) {
    const severity = state.maxSeverity;
    if (severity >= 8) return { color: "#dc2626", weight: 9, opacity: 0.95 };
    if (severity >= 6) return { color: "#ef4444", weight: 8, opacity: 0.9 };
    return { color: "#f97316", weight: 7, opacity: 0.88 };
  }
  if (state.accidentProne) {
    return { color: "#f59e0b", weight: 6, opacity: 0.75, dashArray: "10 6" };
  }
  return { color: "#38bdf8", weight: 5, opacity: 0.5 };
}

export function wardIdFromName(name: string): string {
  const w = NAGPUR_WARDS.find((x) => x.name === name || x.id === name);
  return w?.id ?? getWardForPoint(21.1458, 79.0882).id;
}

export function wardNameFromId(id: string): string {
  return NAGPUR_WARDS.find((w) => w.id === id)?.name ?? id;
}
