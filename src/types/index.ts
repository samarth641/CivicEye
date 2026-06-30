import type { AiMetadata } from "@/lib/civic-intelligence";

export type ReportType = "POTHOLE" | "SPEED_BREAKER" | "ROAD_DAMAGE" | "OTHER";
export type ReportStatus = "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
export type ReportCategory = "ROAD" | "MISSING_PERSON";
export type ReportLocationMode = "ROAD" | "PINPOINT";

export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  category?: ReportCategory;
  latitude: number;
  longitude: number;
  description: string | null;
  imageUrl: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  locationMode?: ReportLocationMode;
  userId: string | null;
  roadId?: string | null;
  roadName?: string | null;
  wardId?: string | null;
  wardName?: string | null;
  createdAt: string;
  updatedAt: string;
  aiMetadata?: AiMetadata;
}

export interface MapLayers {
  heatmap: boolean;
  missingPersonsHeatmap: boolean;
  riskZones: boolean;
  wardBoundaries: boolean;
  crewTracking: boolean;
  infrastructure: boolean;
  pulseMarkers: boolean;
  roadHighlights: boolean;
}

export interface MapFlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

export interface LocationNews {
  id: string;
  title: string;
  body: string;
  latitude: number;
  longitude: number;
  sourceUrl: string | null;
  imageUrl: string | null;
  publishedAt: string;
}

export type MissingPersonStatus = "ACTIVE" | "LOCATED" | "CLOSED";

export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastSeenAt: string;
  latitude: number;
  longitude: number;
  area: string;
  wardId?: string;
  status: MissingPersonStatus;
  description: string;
  contactNumber: string;
  clothing?: string;
  photoUrl?: string | null;
  reportedBy?: string | null;
}

export interface MapFilters {
  potholes: boolean;
  speedBreakers: boolean;
  roadDamage: boolean;
  other: boolean;
  news: boolean;
  traffic: boolean;
}

export const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 } as const;
