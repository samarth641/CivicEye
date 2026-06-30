"use client";

import { motion } from "framer-motion";
import { Crosshair, Route, MapPin, CheckCircle2 } from "lucide-react";
import { useMapStore } from "@/lib/store";
import { getRoadById } from "@/lib/nagpur-roads";

export function ReportMapPinHint() {
  const {
    isReportDialogOpen,
    reportLocationMode,
    reportLocationPinned,
    reportFormCategory,
    reportPickLocation,
    selectedRoadId,
  } = useMapStore();

  if (!isReportDialogOpen) return null;

  const road = selectedRoadId ? getRoadById(selectedRoadId) : null;

  if (reportLocationMode === "PINPOINT") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-none absolute left-1/2 top-[4.25rem] z-[45] w-[min(100%,28rem)] -translate-x-1/2 px-3 sm:top-[5.5rem]"
      >
        <div
          className={`rounded-xl border-2 px-4 py-3 shadow-2xl backdrop-blur-md ${
            reportLocationPinned
              ? "border-emerald-500/50 bg-emerald-950/90"
              : "border-primary/60 bg-primary/15 animate-pulse"
          }`}
        >
          <div className="flex items-start gap-3">
            {reportLocationPinned ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <Crosshair className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="text-sm">
              {reportLocationPinned && reportPickLocation ? (
                <>
                  <p className="font-semibold text-emerald-200">Pin placed on map</p>
                  <p className="mt-0.5 text-xs text-emerald-200/80">
                    {reportPickLocation.lat.toFixed(5)}, {reportPickLocation.lng.toFixed(5)}
                    — adjust by clicking again or continue the form →
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">Step 2: Click the map</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Drag to pan · Scroll to zoom · Click the exact spot on the map
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (reportFormCategory === "ROAD") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-none absolute left-1/2 top-[4.25rem] z-[45] w-[min(100%,28rem)] -translate-x-1/2 px-3 sm:top-[5.5rem]"
      >
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/85 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <Route className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <p className="font-semibold text-amber-100">Step 2: Pick zone & road</p>
              <p className="mt-0.5 text-xs text-amber-200/80">
                Use the <strong>Zone</strong> and <strong>Road corridor</strong> dropdowns in the form.
                {road ? ` Selected: ${road.name}.` : " Map highlights the corridor."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none absolute left-1/2 top-[4.25rem] z-[45] w-[min(100%,28rem)] -translate-x-1/2 px-3 sm:top-[5.5rem]"
    >
      <div className="rounded-xl border border-violet-500/40 bg-violet-950/85 px-4 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <p className="text-sm text-violet-100">
            Choose <strong>Pin on map</strong> in the form, then click where they were last seen.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
