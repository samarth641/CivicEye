"use client";

import { motion } from "framer-motion";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { color: "#dc2626", label: "Pothole", shape: "diamond" as const },
  { color: "#f59e0b", label: "Speed breaker", shape: "diamond" as const },
  { color: "#8b5cf6", label: "Road damage", shape: "diamond" as const },
  { color: "#6b7280", label: "Other road", shape: "diamond" as const },
  { color: "#2563eb", label: "News", shape: "circle" as const },
  { color: "#7c3aed", label: "Missing person", shape: "circle" as const },
] as const;

const ROAD_LEGEND = [
  { color: "#dc2626", label: "Road with issues" },
  { color: "#f59e0b", label: "Accident-prone road", dash: true },
  { color: "#fbbf24", label: "Selected road" },
  { color: "#a855f7", label: "Missing persons heat", heat: true },
] as const;

export function Legend() {
  const mapPickActive = useMapStore(
    (s) =>
      s.isReportDialogOpen &&
      s.reportLocationMode === "PINPOINT" &&
      !s.reportLocationPinned
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "map-panel pointer-events-auto absolute bottom-16 left-1/2 z-20 -translate-x-1/2 px-4 py-3 sm:bottom-20 sm:left-[22rem] sm:translate-x-0",
        mapPickActive && "pointer-events-none opacity-40"
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Map legend
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
        {ITEMS.map(({ color, label, shape }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-3 w-3 border-2 border-white/90 shadow-sm ${
                shape === "diamond" ? "rotate-45 rounded-sm" : "rounded-full"
              }`}
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-border/60 pt-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Roads
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ROAD_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-1 w-6 rounded-full"
                style={{
                  backgroundColor: item.color,
                  opacity: "dash" in item && item.dash ? 0.8 : "heat" in item && item.heat ? 0.65 : 1,
                  backgroundImage:
                    "dash" in item && item.dash
                      ? `repeating-linear-gradient(90deg, ${item.color} 0 6px, transparent 6px 10px)`
                      : "heat" in item && item.heat
                        ? `radial-gradient(circle, ${item.color} 0%, transparent 70%)`
                        : undefined,
                }}
              />
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
