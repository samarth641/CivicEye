export function hasValidGoogleMapsKey(): boolean {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!key || key.length < 10) return false;
  return !/your-key|YOUR|paste|example|xxx/i.test(key);
}

/** Force OpenStreetMap (Leaflet) — use when Google quota/billing is exceeded */
export function shouldPreferLeafletMap(): boolean {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER?.toLowerCase();
  if (provider === "leaflet") return true;
  if (provider === "google") return false;
  return process.env.NEXT_PUBLIC_PREFER_LEAFLET_MAP === "true";
}

export function shouldSkipGoogleMaps(): boolean {
  return shouldPreferLeafletMap() || !hasValidGoogleMapsKey();
}

/** Map ID must not be empty, a placeholder, or mistakenly set to the API key */
export function getValidGoogleMapId(): string | undefined {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!mapId || mapId === "DEMO_MAP_ID") return undefined;
  if (apiKey && mapId === apiKey) return undefined;
  if (/^AIza[\w-]+$/.test(mapId)) return undefined;
  return mapId;
}
