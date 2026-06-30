import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let optionsConfigured = false;

export function ensureGoogleMapsConfigured() {
  if (optionsConfigured || typeof window === "undefined") return;
  optionsConfigured = true;
  setOptions({
    key: apiKey,
    v: "weekly",
    libraries: ["places", "marker"],
  });
}

export async function loadMapLibraries() {
  ensureGoogleMapsConfigured();
  const { Map } = await importLibrary("maps");
  const { AdvancedMarkerElement } = await importLibrary("marker");
  return { Map, AdvancedMarkerElement };
}

export type MapLibrary = Awaited<ReturnType<typeof loadMapLibraries>>;
