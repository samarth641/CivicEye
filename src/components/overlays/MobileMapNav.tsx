"use client";

import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { List, Brain, Layers, X } from "lucide-react";
import type { MapLayers } from "@/types";
import {
  Flame,
  MapPinned,
  Users,
  Building2,
  Activity,
  Radio,
  Route,
  UserSearch,
} from "lucide-react";

export const MAP_LAYER_ITEMS: {
  key: keyof MapLayers;
  label: string;
  icon: typeof Flame;
  description: string;
}[] = [
  { key: "roadHighlights", label: "Road corridors", icon: Route, description: "Issue & accident-prone roads" },
  { key: "heatmap", label: "Risk heatmap", icon: Flame, description: "Incident density & severity" },
  { key: "missingPersonsHeatmap", label: "Missing persons", icon: UserSearch, description: "Last-seen location heatmap" },
  { key: "wardBoundaries", label: "Ward zones", icon: MapPinned, description: "Municipal ward boundaries" },
  { key: "crewTracking", label: "Live crews", icon: Users, description: "Repair crew positions" },
  { key: "infrastructure", label: "Critical infra", icon: Building2, description: "Schools, hospitals, lakes" },
  { key: "riskZones", label: "Ward health", icon: Activity, description: "AI ward health overlay" },
  { key: "pulseMarkers", label: "Pulse alerts", icon: Radio, description: "Animate high-priority incidents" },
];

export function MapLayersList({ compact = false }: { compact?: boolean }) {
  const { mapLayers, setMapLayer } = useMapStore();

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "flex-col")}>
      {MAP_LAYER_ITEMS.map(({ key, label, icon: Icon, description }) => {
        const active = mapLayers[key];
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "secondary" : "outline"}
            size="sm"
            onClick={() => setMapLayer(key, !active)}
            className={cn(
              "h-9 justify-start gap-2 text-xs",
              compact && "w-full"
            )}
            title={description}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

type SheetId = "incidents" | "copilot" | "layers";

export function MobileMapNav() {
  const { mobileSheet, setMobileSheet, isReportDialogOpen, cityHealthIndex } = useMapStore();

  if (isReportDialogOpen) return null;

  const toggle = (id: SheetId) => {
    setMobileSheet(mobileSheet === id ? null : id);
  };

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-9 z-40 flex items-center justify-around border-t border-border bg-card/95 px-1 py-1 backdrop-blur-md md:hidden"
      aria-label="Map tools"
    >
      {(
        [
          { id: "incidents" as const, label: "Incidents", icon: List },
          { id: "copilot" as const, label: "Copilot", icon: Brain },
          { id: "layers" as const, label: "Layers", icon: Layers },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => toggle(id)}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
            mobileSheet === id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ))}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] text-muted-foreground">
        <Activity className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-semibold text-foreground">{cityHealthIndex}</span>
      </div>
    </nav>
  );
}

export function MobileSheetBackdrop() {
  const { mobileSheet, setMobileSheet } = useMapStore();
  if (!mobileSheet) return null;

  return (
    <button
      type="button"
      aria-label="Close panel"
      className="fixed inset-x-0 bottom-9 top-14 z-30 bg-black/45 md:hidden"
      onClick={() => setMobileSheet(null)}
    />
  );
}

export function MobileSheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="map-panel-header flex shrink-0 items-center justify-between md:hidden">
      <h3 className="map-panel-title">{title}</h3>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClose}
        aria-label="Close panel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
