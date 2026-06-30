"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MAP_LAYER_ITEMS } from "@/components/overlays/MobileMapNav";

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
        "map-panel pointer-events-auto absolute left-1/2 top-3 z-20 hidden max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center gap-2 px-3 py-2 md:flex sm:top-4",
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

      {MAP_LAYER_ITEMS.map(({ key, label, icon: Icon, description }) => {
        const active = mapLayers[key];
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMapLayer(key, !active)}
            className="h-8 gap-1.5 px-2.5 text-xs"
            title={description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        );
      })}
    </motion.div>
  );
}
