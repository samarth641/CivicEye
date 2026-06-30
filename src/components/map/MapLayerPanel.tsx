"use client";

import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MapLayers } from "@/types";

const LAYERS: {
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

export function MapLayerPanel() {
  const { mapLayers, setMapLayer, cityHealthIndex } = useMapStore();
  const mapPickActive = useMapStore(
    (s) =>
      s.isReportDialogOpen &&
      s.reportLocationMode === "PINPOINT" &&
      !s.reportLocationPinned
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "map-panel pointer-events-auto absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center gap-2 px-3 py-2 sm:top-4",
        mapPickActive && "pointer-events-none opacity-40"
      )}
    >
      <div className="mr-1 flex items-center gap-2 border-r border-border/60 pr-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            City health
          </p>
          <p className="text-sm font-bold text-foreground">{cityHealthIndex}/100</p>
        </div>
      </div>

      {LAYERS.map(({ key, label, icon: Icon }) => {
        const active = mapLayers[key];
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMapLayer(key, !active)}
            className="h-8 gap-1.5 px-2.5 text-xs"
            title={LAYERS.find((l) => l.key === key)?.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        );
      })}
    </motion.div>
  );
}
