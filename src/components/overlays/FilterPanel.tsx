"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTER_LABELS = {
  potholes: "Potholes",
  speedBreakers: "Speed breakers",
  roadDamage: "Road damage",
  other: "Other",
  news: "News",
  traffic: "Traffic",
} as const;

export function FilterPanel() {
  const [open, setOpen] = useState(false);
  const { filters, setFilter } = useMapStore();

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border bg-card/95 shadow-lg backdrop-blur"
        aria-label="Filters"
      >
        <Filter className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-card p-4 shadow-xl"
            >
              <p className="mb-3 text-sm font-medium">Show on map</p>
              <div className="space-y-2">
                {(Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).map(
                  (key) => (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 text-sm"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={filters[key]}
                        onChange={(e) => setFilter(key, e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span>{FILTER_LABELS[key]}</span>
                    </label>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
