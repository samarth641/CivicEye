"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export type MapInstance = google.maps.Map | LeafletMap | null;

type MapContextValue = {
  mapRef: React.RefObject<MapInstance>;
  setMapRef: (map: MapInstance) => void;
};

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<MapInstance>(null);

  const setMapRef = useCallback((map: MapInstance) => {
    mapRef.current = map;
  }, []);

  const value = useMemo(
    () => ({ mapRef, setMapRef }),
    [setMapRef]
  );

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("MapProvider missing");
  return ctx;
}
