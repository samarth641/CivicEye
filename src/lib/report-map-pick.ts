import { useMapStore } from "@/lib/store";
import { findNearestRoad } from "@/lib/nagpur-roads";

/** Returns true if the click was consumed for report pinpoint picking */
export function handleReportMapPick(lat: number, lng: number): boolean {
  const state = useMapStore.getState();
  if (!state.isReportDialogOpen) return false;
  if (state.reportLocationMode !== "PINPOINT") return false;

  state.setReportPickLocation({ lat, lng });
  state.setReportLocationPinned(true);

  if (state.reportFormCategory === "ROAD") {
    const road = findNearestRoad(lat, lng);
    if (road) {
      state.setSelectedRoadId(road.id);
    }
  }

  return true;
}

export function isMapPickActive(): boolean {
  const state = useMapStore.getState();
  return (
    state.isReportDialogOpen &&
    state.reportLocationMode === "PINPOINT" &&
    !state.reportLocationPinned
  );
}
