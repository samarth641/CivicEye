import { create } from "zustand";
import type {
  MapFilters,
  MapLayers,
  MapFlyTarget,
  Report,
  LocationNews,
  MissingPerson,
  ReportCategory,
  ReportLocationMode,
} from "@/types";
import { NAGPUR_CENTER } from "@/types";
import { shouldSkipGoogleMaps } from "@/lib/map-config";
import { computeCityHealthIndex } from "@/lib/civic-intelligence";

interface MapState {
  filters: MapFilters;
  setFilter: <K extends keyof MapFilters>(key: K, value: MapFilters[K]) => void;
  reports: Report[];
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  news: LocationNews[];
  setNews: (news: LocationNews[]) => void;
  missingPersons: MissingPerson[];
  setMissingPersons: (persons: MissingPerson[]) => void;
  addMissingPerson: (person: MissingPerson) => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  selectedNewsId: string | null;
  setSelectedNewsId: (id: string | null) => void;
  mapType: "roadmap" | "satellite" | "hybrid";
  setMapType: (type: "roadmap" | "satellite" | "hybrid") => void;
  trafficLayerVisible: boolean;
  setTrafficLayerVisible: (visible: boolean) => void;
  mapLayers: MapLayers;
  setMapLayer: <K extends keyof MapLayers>(key: K, value: MapLayers[K]) => void;
  mapFlyTarget: MapFlyTarget | null;
  flyToLocation: (target: MapFlyTarget) => void;
  clearFlyTarget: () => void;
  cityHealthIndex: number;
  isReportDialogOpen: boolean;
  setReportDialogOpen: (open: boolean) => void;
  mapCenter: { lat: number; lng: number };
  setMapCenter: (center: { lat: number; lng: number }) => void;
  mapAuthError: boolean;
  setMapAuthError: (error: boolean) => void;
  mapFallbackReason: "quota" | "key" | "billing" | "api" | "config" | null;
  setMapFallbackReason: (reason: MapState["mapFallbackReason"]) => void;
  detailsModalOpen: boolean;
  setDetailsModalOpen: (open: boolean) => void;
  selectedRoadId: string | null;
  setSelectedRoadId: (id: string | null) => void;
  reportPickLocation: { lat: number; lng: number } | null;
  setReportPickLocation: (loc: { lat: number; lng: number } | null) => void;
  reportFormCategory: import("@/types").ReportCategory;
  setReportFormCategory: (category: import("@/types").ReportCategory) => void;
  reportLocationPinned: boolean;
  setReportLocationPinned: (pinned: boolean) => void;
  reportLocationMode: ReportLocationMode;
  setReportLocationMode: (mode: ReportLocationMode) => void;
}

const defaultFilters: MapFilters = {
  potholes: true,
  speedBreakers: true,
  roadDamage: true,
  other: true,
  news: true,
  traffic: true,
};

const defaultMapLayers: MapLayers = {
  heatmap: true,
  missingPersonsHeatmap: false,
  riskZones: false,
  wardBoundaries: true,
  crewTracking: true,
  infrastructure: false,
  pulseMarkers: true,
  roadHighlights: true,
};

export const useMapStore = create<MapState>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  reports: [],
  setReports: (reports) =>
    set({
      reports,
      cityHealthIndex: computeCityHealthIndex(reports),
    }),
  addReport: (report) =>
    set((state) => {
      const reports = [...state.reports, report];
      return { reports, cityHealthIndex: computeCityHealthIndex(reports) };
    }),
  updateReport: (id, updates) =>
    set((state) => {
      const reports = state.reports.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      return { reports, cityHealthIndex: computeCityHealthIndex(reports) };
    }),
  news: [],
  setNews: (news) => set({ news }),
  missingPersons: [],
  setMissingPersons: (missingPersons) => set({ missingPersons }),
  addMissingPerson: (person) =>
    set((state) => ({ missingPersons: [person, ...state.missingPersons] })),
  selectedReportId: null,
  setSelectedReportId: (id) => set({ selectedReportId: id, selectedNewsId: null }),
  selectedNewsId: null,
  setSelectedNewsId: (id) => set({ selectedNewsId: id, selectedReportId: null }),
  mapType: "roadmap",
  setMapType: (mapType) => set({ mapType }),
  trafficLayerVisible: false,
  setTrafficLayerVisible: (trafficLayerVisible) => set({ trafficLayerVisible }),
  mapLayers: defaultMapLayers,
  setMapLayer: (key, value) =>
    set((state) => ({
      mapLayers: { ...state.mapLayers, [key]: value },
    })),
  mapFlyTarget: null,
  flyToLocation: (mapFlyTarget) => set({ mapFlyTarget, mapCenter: mapFlyTarget }),
  clearFlyTarget: () => set({ mapFlyTarget: null }),
  cityHealthIndex: 88,
  isReportDialogOpen: false,
  setReportDialogOpen: (isReportDialogOpen) => set({ isReportDialogOpen }),
  mapCenter: NAGPUR_CENTER,
  setMapCenter: (mapCenter) => set({ mapCenter }),
  mapAuthError: shouldSkipGoogleMaps(),
  setMapAuthError: (mapAuthError) => set({ mapAuthError }),
  mapFallbackReason: shouldSkipGoogleMaps() ? "config" : null,
  setMapFallbackReason: (mapFallbackReason) => set({ mapFallbackReason }),
  detailsModalOpen: false,
  setDetailsModalOpen: (detailsModalOpen) => set({ detailsModalOpen }),
  selectedRoadId: null,
  setSelectedRoadId: (selectedRoadId) => set({ selectedRoadId }),
  reportPickLocation: null,
  setReportPickLocation: (reportPickLocation) => set({ reportPickLocation }),
  reportFormCategory: "ROAD" as ReportCategory,
  setReportFormCategory: (reportFormCategory) => set({ reportFormCategory }),
  reportLocationPinned: false,
  setReportLocationPinned: (reportLocationPinned) => set({ reportLocationPinned }),
  reportLocationMode: "ROAD",
  setReportLocationMode: (reportLocationMode) => set({ reportLocationMode }),
}));
