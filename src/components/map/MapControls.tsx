"use client";

import { motion } from "framer-motion";
import { Plus, Minus, Map, Satellite, Layers, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { useMapContext } from "./MapProvider";

function zoomMap(map: NonNullable<ReturnType<typeof useMapContext>["mapRef"]["current"]>, delta: number) {
  if ("zoomIn" in map && typeof map.zoomIn === "function") {
    if (delta > 0) map.zoomIn();
    else map.zoomOut();
    return;
  }

  const zoom = map.getZoom?.() ?? 12;
  const next = Math.min(20, Math.max(3, zoom + delta));
  if ("setZoom" in map && typeof map.setZoom === "function") {
    map.setZoom(next);
  }
}

export function MapControls() {
  const { mapType, setMapType, trafficLayerVisible, setTrafficLayerVisible, mapAuthError } =
    useMapStore();
  const { mapRef } = useMapContext();

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    zoomMap(map, 1);
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    zoomMap(map, -1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 pointer-events-auto md:right-[26rem]"
    >
      <div className="map-control-stack">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          className="h-10 w-10 text-foreground hover:bg-accent"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          className="h-10 w-10 text-foreground hover:bg-accent"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <div className="map-control-stack">
        <Button
          variant={mapType === "roadmap" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setMapType("roadmap")}
          className="h-10 w-10"
          aria-label="Road map"
        >
          <Map className="h-4 w-4" />
        </Button>
        <Button
          variant={mapType === "satellite" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setMapType("satellite")}
          className="h-10 w-10"
          aria-label="Satellite"
        >
          <Satellite className="h-4 w-4" />
        </Button>
        <Button
          variant={mapType === "hybrid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setMapType("hybrid")}
          className="h-10 w-10"
          aria-label="Hybrid"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
      {!mapAuthError && (
        <Button
          variant={trafficLayerVisible ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setTrafficLayerVisible(!trafficLayerVisible)}
          className="map-control-stack h-10 w-10 p-0"
          aria-label="Toggle traffic"
        >
          <Car className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}
