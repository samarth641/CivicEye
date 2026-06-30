"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Car, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import {
  getRoadById,
  getReportsOnRoad,
} from "@/lib/nagpur-roads";

export function RoadDetailPanel() {
  const {
    selectedRoadId,
    setSelectedRoadId,
    reports,
    setSelectedReportId,
    flyToLocation,
    setDetailsModalOpen,
    isReportDialogOpen,
    reportLocationMode,
    reportLocationPinned,
  } = useMapStore();

  const mapPickActive =
    isReportDialogOpen &&
    reportLocationMode === "PINPOINT" &&
    !reportLocationPinned;

  const road = selectedRoadId ? getRoadById(selectedRoadId) : null;
  if (!road || mapPickActive) return null;

  const onRoad = getReportsOnRoad(road, reports);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="map-panel pointer-events-auto absolute bottom-36 left-1/2 z-25 w-[min(100%,24rem)] -translate-x-1/2 p-4 sm:bottom-40"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Road corridor selected
            </p>
            <h3 className="text-base font-bold text-foreground">{road.name}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {road.accidentProne && (
                <span className="map-chip border-amber-500/40 bg-amber-500/15 text-amber-300">
                  <Car className="mr-1 inline h-3 w-3" />
                  Accident-prone
                </span>
              )}
              <span className="map-chip">
                {onRoad.length} active issue{onRoad.length !== 1 ? "s" : ""}
              </span>
            </div>
            {road.accidentRiskLabel && (
              <p className="mt-2 text-xs text-muted-foreground">{road.accidentRiskLabel}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSelectedRoadId(null)}
            aria-label="Close road panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {onRoad.length > 0 ? (
          <ul className="mt-3 max-h-32 space-y-1.5 overflow-y-auto border-t border-border/60 pt-3">
            {onRoad.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2 text-left text-xs hover:bg-secondary/70"
                  onClick={() => {
                    setSelectedReportId(r.id);
                    flyToLocation({
                      lat: r.latitude,
                      lng: r.longitude,
                      zoom: 17,
                    });
                    setDetailsModalOpen(true);
                  }}
                >
                  <span className="font-medium text-foreground">
                    {r.type.replace("_", " ")}
                  </span>
                  <span className="flex items-center gap-1 text-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    {r.aiMetadata?.severity ?? "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <MapPin className="mr-1 inline h-3 w-3" />
            No open incidents on this corridor. Road highlighted as accident-prone or
            monitoring zone.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
