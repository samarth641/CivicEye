import type { Report, ReportType } from "@/types";
import { findNearestRoad, getRoadById, wardNameFromId } from "@/lib/nagpur-roads";

/** Nagpur municipal zones — larger non-overlapping grid covering the city */
export const NAGPUR_WARDS = [
  { id: "dharampeth", name: "Dharampeth", color: "#22c55e", bounds: [[21.08, 78.98], [21.13, 79.06]] as [[number, number], [number, number]] },
  { id: "lakshmi", name: "Laxmi Nagar", color: "#8b5cf6", bounds: [[21.08, 79.06], [21.13, 79.12]] as [[number, number], [number, number]] },
  { id: "mankapur", name: "Mankapur / Beltarodi", color: "#14b8a6", bounds: [[21.08, 79.12], [21.13, 79.18]] as [[number, number], [number, number]] },
  { id: "sadar", name: "Sadar / Civil Lines", color: "#3b82f6", bounds: [[21.13, 78.98], [21.16, 79.06]] as [[number, number], [number, number]] },
  { id: "sitabuldi", name: "Sitabuldi / Gandhibagh", color: "#f59e0b", bounds: [[21.13, 79.06], [21.16, 79.12]] as [[number, number], [number, number]] },
  { id: "seminary", name: "Seminary Hills", color: "#ec4899", bounds: [[21.13, 79.12], [21.16, 79.18]] as [[number, number], [number, number]] },
  { id: "hingna", name: "Hingna / MIHAN", color: "#a855f7", bounds: [[21.16, 78.98], [21.20, 79.06]] as [[number, number], [number, number]] },
  { id: "indora", name: "Indora / Kamptee Rd", color: "#ef4444", bounds: [[21.16, 79.06], [21.20, 79.18]] as [[number, number], [number, number]] },
] as const;

export interface AiMetadata {
  severity: number;
  confidence: number;
  cost: number;
  repairHours: number;
  department: string;
  slaTime: string;
  slaBreached: boolean;
  duplicateCount: number;
  duplicateIds: string[];
  verificationCount: number;
  ward: string;
  wardHealthScore: number;
  rootCause: string;
  accidentProbability: number;
  impactedCitizens: number;
  suggestedCrew: string;
  suggestedMaterials: string[];
  nearbyInfrastructure: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiSummary: string;
  explanation: string[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface CrewUnit {
  id: string;
  name: string;
  department: string;
  lat: number;
  lng: number;
  status: "EN_ROUTE" | "ON_SITE" | "AVAILABLE";
  assignedReportId?: string;
}

const DEPARTMENT_MAP: Record<ReportType, string> = {
  POTHOLE: "Public Works Department",
  SPEED_BREAKER: "Traffic Engineering Division",
  ROAD_DAMAGE: "Public Works Department",
  OTHER: "Municipal Operations Cell",
};

const CREW_POOL = [
  "Crew Alpha (PWD-12)",
  "Crew Beta (PWD-07)",
  "Rapid Response Unit-3",
  "Traffic Repair Squad-2",
  "Monsoon Task Force-1",
];

const MATERIALS: Record<ReportType, string[]> = {
  POTHOLE: ["Cold mix asphalt", "Compaction roller", "Safety cones"],
  SPEED_BREAKER: ["Thermoplastic paint", "Rumble strips", "Signage board"],
  ROAD_DAMAGE: ["Hot mix asphalt", "Subgrade fill", "Vibratory compactor"],
  OTHER: ["Inspection kit", "Barricades", "Multi-tool crew"],
};

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

export function getWardForPoint(lat: number, lng: number): (typeof NAGPUR_WARDS)[number] {
  for (const ward of NAGPUR_WARDS) {
    const [[s, w], [n, e]] = ward.bounds;
    if (lat >= s && lat <= n && lng >= w && lng <= e) return ward;
  }
  let best: (typeof NAGPUR_WARDS)[number] = NAGPUR_WARDS[4];
  let bestD = Infinity;
  for (const ward of NAGPUR_WARDS) {
    const [[s, w], [n, e]] = ward.bounds;
    const cLat = (s + n) / 2;
    const cLng = (w + e) / 2;
    const d = haversineM(lat, lng, cLat, cLng);
    if (d < bestD) {
      bestD = d;
      best = ward;
    }
  }
  return best;
}

export function findDuplicateReports(report: Report, all: Report[], radiusM = 180): Report[] {
  return all.filter(
    (r) =>
      r.id !== report.id &&
      r.type === report.type &&
      haversineM(report.latitude, report.longitude, r.latitude, r.longitude) <= radiusM
  );
}

function ageHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
}

function estimateCost(type: ReportType, severity: number, duplicates: number): number {
  const base = { POTHOLE: 12000, SPEED_BREAKER: 8500, ROAD_DAMAGE: 28000, OTHER: 6000 };
  return Math.round(base[type] * (0.7 + severity / 12) * (1 + duplicates * 0.15));
}

function estimateRepairHours(type: ReportType, severity: number): number {
  const base = { POTHOLE: 4, SPEED_BREAKER: 3, ROAD_DAMAGE: 16, OTHER: 6 };
  return Math.round(base[type] * (0.6 + severity / 10));
}

function computeSeverity(report: Report, duplicateCount: number): number {
  const typeWeight: Record<ReportType, number> = {
    POTHOLE: 1.2,
    SPEED_BREAKER: 0.9,
    ROAD_DAMAGE: 1.4,
    OTHER: 1,
  };
  const statusBoost = { PENDING: 1.3, ACKNOWLEDGED: 1.1, IN_PROGRESS: 0.9, RESOLVED: 0.3 };
  const age = ageHours(report.createdAt);
  const ageBoost = Math.min(2, 1 + age / 48);
  const descBoost = /danger|severe|night|school|hospital|traffic|collapse/i.test(report.description ?? "")
    ? 1.25
    : 1;
  const raw =
    4.5 * typeWeight[report.type] * statusBoost[report.status] * ageBoost * descBoost +
    duplicateCount * 0.4;
  return Math.min(10, Math.round(raw * 10) / 10);
}

function computeConfidence(report: Report, duplicateCount: number): number {
  let c = 72;
  if (report.imageUrl) c += 12;
  if (report.beforeImageUrl) c += 8;
  if (report.description && report.description.length > 30) c += 8;
  c += Math.min(8, duplicateCount * 3);
  return Math.min(99, c);
}

function rootCause(report: Report, duplicates: Report[]): string {
  const causes: Record<ReportType, string> = {
    POTHOLE: "Surface fatigue + water infiltration degrading asphalt binder",
    SPEED_BREAKER: "Unmarked or non-standard speed calming installation",
    ROAD_DAMAGE: "Subgrade erosion likely from drainage overflow or heavy axle load",
    OTHER: "Infrastructure anomaly requiring field verification",
  };
  if (duplicates.length >= 2) {
    return `${causes[report.type]}. Cluster of ${duplicates.length + 1} reports indicates systemic failure.`;
  }
  return causes[report.type];
}

function accidentProbability(severity: number, report: Report): number {
  let p = severity * 4;
  if (/night|school|hospital|lane|metro/i.test(report.description ?? "")) p += 15;
  if (report.type === "POTHOLE") p += 8;
  return Math.min(92, Math.round(p));
}

function impactedCitizens(severity: number, duplicates: number): number {
  return Math.round(120 * severity + duplicates * 85);
}

export function wardHealthScore(wardId: string, reports: Report[]): number {
  const wardReports = reports.filter((r) => getWardForPoint(r.latitude, r.longitude).id === wardId);
  const open = wardReports.filter((r) => r.status !== "RESOLVED");
  const avgSeverity =
    open.length === 0
      ? 2
      : open.reduce((s, r) => s + computeSeverity(r, findDuplicateReports(r, reports).length), 0) /
        open.length;
  return Math.max(10, Math.round(100 - open.length * 6 - avgSeverity * 5));
}

function slaRemaining(report: Report, repairHours: number): { label: string; breached: boolean } {
  const elapsed = ageHours(report.createdAt);
  const slaLimit = repairHours * 2.5;
  const left = slaLimit - elapsed;
  if (left <= 0) return { label: "SLA BREACHED", breached: true };
  const h = Math.floor(left);
  const m = Math.round((left - h) * 60);
  return { label: `${h}h ${m}m`, breached: false };
}

function priorityLevel(severity: number, slaBreached: boolean): AiMetadata["priority"] {
  if (slaBreached || severity >= 8.5) return "CRITICAL";
  if (severity >= 7) return "HIGH";
  if (severity >= 5) return "MEDIUM";
  return "LOW";
}

const INFRA_NEAR: { name: string; lat: number; lng: number }[] = [
  { name: "Government Medical College", lat: 21.1498, lng: 79.0889 },
  { name: "Ambazari Lake embankment", lat: 21.128, lng: 79.055 },
  { name: "Nagpur Railway Station", lat: 21.152, lng: 79.088 },
  { name: "VVIP School Zone — Civil Lines", lat: 21.145, lng: 79.09 },
  { name: "Sitabuldi Fort", lat: 21.158, lng: 79.092 },
  { name: "MIHAN SEZ Gate", lat: 21.108, lng: 79.035 },
  { name: "Zero Mile Stone", lat: 21.1498, lng: 79.0882 },
  { name: "Seminary Hills Park", lat: 21.145, lng: 79.125 },
  { name: "Ajni Square", lat: 21.138, lng: 79.078 },
  { name: "Variety Square", lat: 21.156, lng: 79.094 },
];

function nearbyInfrastructure(lat: number, lng: number): string[] {
  return INFRA_NEAR.filter((i) => haversineM(lat, lng, i.lat, i.lng) < 2500).map((i) => i.name);
}

export function enrichReportWithAi(report: Report, allReports: Report[]): AiMetadata {
  const duplicates = findDuplicateReports(report, allReports);
  const severity = computeSeverity(report, duplicates.length);
  const confidence = computeConfidence(report, duplicates.length);
  const cost = estimateCost(report.type, severity, duplicates.length);
  const repairHours = estimateRepairHours(report.type, severity);
  const department = DEPARTMENT_MAP[report.type];
  const ward = getWardForPoint(report.latitude, report.longitude);
  const sla = slaRemaining(report, repairHours);
  const priority = priorityLevel(severity, sla.breached);
  const root = rootCause(report, duplicates);
  const accident = accidentProbability(severity, report);

  return {
    severity,
    confidence,
    cost,
    repairHours,
    department,
    slaTime: sla.label,
    slaBreached: sla.breached,
    duplicateCount: duplicates.length,
    duplicateIds: duplicates.map((d) => d.id),
    verificationCount: Math.round(3 + severity + duplicates.length * 2),
    ward: ward.name,
    wardHealthScore: wardHealthScore(ward.id, allReports),
    rootCause: root,
    accidentProbability: accident,
    impactedCitizens: impactedCitizens(severity, duplicates.length),
    suggestedCrew: CREW_POOL[Math.abs(report.id.charCodeAt(0)) % CREW_POOL.length],
    suggestedMaterials: MATERIALS[report.type],
    nearbyInfrastructure: nearbyInfrastructure(report.latitude, report.longitude),
    priority,
    aiSummary: `${priority} priority ${report.type.replace("_", " ").toLowerCase()} in ${ward.name}. Severity ${severity}/10 with ${confidence}% model confidence. Route to ${department}; est. ₹${cost.toLocaleString("en-IN")}, ${repairHours}h repair window.`,
    explanation: [
      `Severity ${severity}/10 from issue type, age (${Math.round(ageHours(report.createdAt))}h open), and status.`,
      duplicates.length
        ? `${duplicates.length} duplicate report(s) within 180m — cluster escalation applied.`
        : "No duplicates within 180m radius.",
      `Accident risk ${accident}% based on issue class and proximity keywords.`,
      `Ward health index for ${ward.name}: ${wardHealthScore(ward.id, allReports)}/100.`,
    ],
  };
}

export function enrichAllReports(reports: Report[]): (Report & { aiMetadata: AiMetadata })[] {
  const withRoads = reports.map(attachRoadFromCoords);
  return withRoads.map((r) => ({ ...r, aiMetadata: enrichReportWithAi(r, withRoads) }));
}

function attachRoadFromCoords(report: Report): Report {
  const road =
    (report.roadId && getRoadById(report.roadId)) ||
    findNearestRoad(report.latitude, report.longitude);
  if (!road) return report;
  return {
    ...report,
    roadId: report.roadId ?? road.id,
    roadName: report.roadName ?? road.name,
    wardId: report.wardId ?? road.wardId,
    wardName: report.wardName ?? wardNameFromId(road.wardId),
  };
}

export function buildHeatmapPoints(reports: Report[]): HeatmapPoint[] {
  return reports
    .filter((r) => r.status !== "RESOLVED")
    .map((r) => {
      const dupes = findDuplicateReports(r, reports).length;
      const severity = computeSeverity(r, dupes);
      return {
        lat: r.latitude,
        lng: r.longitude,
        intensity: Math.min(1, severity / 10 + dupes * 0.12),
      };
    });
}

export function buildDemoCrews(reports: Report[]): CrewUnit[] {
  const open = reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "ACKNOWLEDGED");
  return [
    {
      id: "crew-1",
      name: "Crew Alpha (PWD-12)",
      department: "Public Works",
      lat: 21.148,
      lng: 79.082,
      status: open[0] ? "EN_ROUTE" : "AVAILABLE",
      assignedReportId: open[0]?.id,
    },
    {
      id: "crew-2",
      name: "Rapid Response Unit-3",
      department: "Emergency Ops",
      lat: 21.136,
      lng: 79.095,
      status: open[1] ? "ON_SITE" : "AVAILABLE",
      assignedReportId: open[1]?.id,
    },
    {
      id: "crew-3",
      name: "Traffic Repair Squad-2",
      department: "Traffic Engineering",
      lat: 21.155,
      lng: 79.105,
      status: "AVAILABLE",
    },
  ];
}

export function computeCityHealthIndex(reports: Report[]): number {
  if (reports.length === 0) return 88;
  const open = reports.filter((r) => r.status !== "RESOLVED");
  const avg =
    open.reduce((s, r) => s + computeSeverity(r, findDuplicateReports(r, reports).length), 0) /
    Math.max(1, open.length);
  return Math.max(12, Math.round(100 - open.length * 4 - avg * 6));
}
