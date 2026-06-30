"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useMapStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "./FilterPanel";

export function Header() {
  const { setReportDialogOpen } = useMapStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-4 p-4"
    >
      <div className="flex items-center gap-3 rounded-xl border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
        <MapPin className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">
          CivicEye
        </span>
      </div>
      <div className="flex items-center gap-2">
        <FilterPanel />
        <Button
          onClick={() => setReportDialogOpen(true)}
          className="shadow-lg"
        >
          Report issue
        </Button>
      </div>
    </motion.header>
  );
}
