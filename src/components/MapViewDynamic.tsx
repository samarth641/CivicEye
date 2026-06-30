"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Loading map…</p>
      </div>
    ),
  }
);

export function MapViewDynamic() {
  return <MapView />;
}
