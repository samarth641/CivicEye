"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Map as LeafletMap, TileLayer, Marker } from "leaflet";
import { useMapStore } from "@/lib/store";
import { useMapContext } from "./MapProvider";
import { shouldSkipGoogleMaps, getValidGoogleMapId } from "@/lib/map-config";
import { loadMapLibraries } from "@/lib/google-maps";
import {
  installGoogleMapsErrorWatcher,
  registerGoogleMapsFallback,
  parseGoogleMapsErrorReason,
  resetGoogleMapsFallbackState,
} from "@/lib/google-maps-fallback";
import { NAGPUR_CENTER } from "@/types";
import { handleReportMapPick } from "@/lib/report-map-pick";
import type { Report } from "@/types";
import {
  buildHeatmapPoints,
  buildDemoCrews,
  NAGPUR_WARDS,
  wardHealthScore,
} from "@/lib/civic-intelligence";
import { buildMissingPersonHeatmapPoints } from "@/lib/missing-persons";
import {
  buildRoadHighlightStates,
  roadStrokeForState,
  findNearestRoad,
  getRoadCentroid,
  getRoadById,
} from "@/lib/nagpur-roads";

const REPORT_TYPE_COLORS: Record<string, string> = {
  POTHOLE: "#dc2626",
  SPEED_BREAKER: "#f59e0b",
  ROAD_DAMAGE: "#8b5cf6",
  OTHER: "#6b7280",
};

const REPORT_TYPE_ICONS: Record<string, string> = {
  POTHOLE: "🕳",
  SPEED_BREAKER: "〰",
  ROAD_DAMAGE: "⚠",
  OTHER: "✦",
};

const NEWS_MARKER_COLOR = "#2563eb";

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#18181b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#09090b" }] },
];

function leafletTileConfig(mapType: string) {
  if (mapType === "satellite" || mapType === "hybrid") {
    return {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      subdomains: "abc",
    };
  }
  return {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    subdomains: "abcd",
  };
}

function createLeafletTileLayer(
  L: typeof import("leaflet"),
  mapType: string
): import("leaflet").TileLayer {
  const { url, attribution, subdomains } = leafletTileConfig(mapType);
  return L.tileLayer(url, {
    attribution,
    maxZoom: 19,
    subdomains,
    updateWhenIdle: true,
    updateWhenZooming: true,
    keepBuffer: 4,
  });
}

function clearLeafletRoadLayerRef(
  layersRef: React.MutableRefObject<import("leaflet").Layer[]>
) {
  for (const layer of layersRef.current) {
    try {
      layer.remove();
    } catch {
      // renderer may already be torn down during map destroy
    }
  }
  layersRef.current = [];
}

export function NagpurMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setMapRef } = useMapContext();
  const engineRef = useRef<"google" | "leaflet" | null>(null);
  const initGenRef = useRef(0);
  const moveEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [engine, setEngine] = useState<"google" | "leaflet" | null>(null);

  const googleMapRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const googleMarkersRef = useRef<
    Map<string, google.maps.Marker | google.maps.marker.AdvancedMarkerElement>
  >(new Map());

  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletTileRef = useRef<TileLayer | null>(null);
  const leafletMarkersRef = useRef<Map<string, Marker>>(new Map());
  const leafletNewsMarkersRef = useRef<Map<string, Marker>>(new Map());
  const leafletOverlayRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRoadLayersRef = useRef<import("leaflet").Layer[]>([]);
  const leafletPickMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const googleRoadsRef = useRef<google.maps.Polyline[]>([]);
  const crewAnimRef = useRef<number | null>(null);
  const tileMapTypeRef = useRef<string | null>(null);

  const {
    reports,
    news,
    missingPersons,
    filters,
    mapType,
    trafficLayerVisible,
    mapLayers,
    mapFlyTarget,
    clearFlyTarget,
    flyToLocation,
    selectedReportId,
    selectedRoadId,
    setSelectedRoadId,
    isReportDialogOpen,
    reportLocationMode,
    reportPickLocation,
    reportLocationPinned,
    setSelectedReportId,
    setSelectedNewsId,
    setMapCenter,
    mapAuthError,
    setMapAuthError,
    setMapFallbackReason,
  } = useMapStore();

  const typeFilter = useCallback(
    (r: Report) => {
      if (r.type === "POTHOLE" && !filters.potholes) return false;
      if (r.type === "SPEED_BREAKER" && !filters.speedBreakers) return false;
      if (r.type === "ROAD_DAMAGE" && !filters.roadDamage) return false;
      if (r.type === "OTHER" && !filters.other) return false;
      return true;
    },
    [filters]
  );

  const clearSelection = useCallback(() => {
    setSelectedReportId(null);
    setSelectedNewsId(null);
    setSelectedRoadId(null);
  }, [setSelectedReportId, setSelectedNewsId, setSelectedRoadId]);

  const onMapPointClickRef = useRef<(lat: number, lng: number) => void>(() => {});

  useEffect(() => {
    onMapPointClickRef.current = (lat: number, lng: number) => {
      if (handleReportMapPick(lat, lng)) return;
      if (useMapStore.getState().isReportDialogOpen) return;

      const road = findNearestRoad(lat, lng, 120);
      if (road) {
        setSelectedRoadId(road.id);
        setSelectedReportId(null);
        setSelectedNewsId(null);
      } else {
        clearSelection();
      }
    };
  }, [clearSelection, setSelectedRoadId, setSelectedReportId, setSelectedNewsId]);

  const destroyGoogleMap = useCallback(() => {
    clustererRef.current?.clearMarkers();
    clustererRef.current = null;
    googleMarkersRef.current.forEach((m) => {
      if ("map" in m && m.map !== undefined) {
        m.map = null;
      } else if ("setMap" in m) {
        m.setMap(null);
      }
    });
    googleMarkersRef.current.clear();
    trafficLayerRef.current?.setMap(null);
    trafficLayerRef.current = null;
    googleMapRef.current = null;
    googleRoadsRef.current.forEach((p) => p.setMap(null));
    googleRoadsRef.current = [];
  }, []);

  const destroyLeafletMap = useCallback(() => {
    if (crewAnimRef.current) {
      cancelAnimationFrame(crewAnimRef.current);
      crewAnimRef.current = null;
    }
    leafletMarkersRef.current.forEach((m) => m.remove());
    leafletMarkersRef.current.clear();
    leafletNewsMarkersRef.current.forEach((m) => m.remove());
    leafletNewsMarkersRef.current.clear();
    leafletOverlayRef.current?.clearLayers();
    leafletOverlayRef.current = null;
    clearLeafletRoadLayerRef(leafletRoadLayersRef);
    leafletPickMarkerRef.current?.remove();
    leafletPickMarkerRef.current = null;
    leafletTileRef.current = null;
    tileMapTypeRef.current = null;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  }, []);

  const forceLeafletRef = useRef(shouldSkipGoogleMaps());
  const fallbackActivatedRef = useRef(forceLeafletRef.current);

  const [forceLeaflet, setForceLeaflet] = useState(
    () => shouldSkipGoogleMaps() || mapAuthError
  );

  const activateLeafletFallback = useCallback(
    (reasonText: string) => {
      if (fallbackActivatedRef.current) return;
      fallbackActivatedRef.current = true;
      forceLeafletRef.current = true;
      const reason = parseGoogleMapsErrorReason(reasonText);
      setMapFallbackReason(reason);
      setMapAuthError(true);
      setForceLeaflet(true);
    },
    [setMapAuthError, setMapFallbackReason]
  );

  // Google API failures (quota, expired key, billing) → Leaflet
  useEffect(() => {
    if (shouldSkipGoogleMaps()) {
      fallbackActivatedRef.current = true;
      forceLeafletRef.current = true;
      setMapAuthError(true);
      setMapFallbackReason("config");
      setForceLeaflet(true);
    }

    registerGoogleMapsFallback(activateLeafletFallback);
    const uninstallWatcher = installGoogleMapsErrorWatcher();

    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      activateLeafletFallback("ExpiredKeyMapError");
    };

    return () => {
      uninstallWatcher();
      registerGoogleMapsFallback(() => {});
      resetGoogleMapsFallbackState();
      delete (window as Window & { gm_authFailure?: () => void }).gm_authFailure;
    };
  }, [activateLeafletFallback, setMapAuthError, setMapFallbackReason]);

  // Sync one-way fallback from store (never revert to Google)
  useEffect(() => {
    if (mapAuthError && !forceLeaflet) {
      forceLeafletRef.current = true;
      setForceLeaflet(true);
    }
  }, [mapAuthError, forceLeaflet]);

  // Initialize map once per engine choice — avoid deps that change on every pan/zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const generation = ++initGenRef.current;
    const useLeaflet = forceLeaflet;

    const teardown = () => {
      if (moveEndTimerRef.current) {
        clearTimeout(moveEndTimerRef.current);
        moveEndTimerRef.current = null;
      }
      destroyGoogleMap();
      destroyLeafletMap();
      setMapRef(null);
      engineRef.current = null;
      container.replaceChildren();
    };

    const init = async () => {
      teardown();

      if (generation !== initGenRef.current) return;

      if (useLeaflet) {
        const L = await import("leaflet");
        if (generation !== initGenRef.current || !containerRef.current) return;

        const map = L.map(container, {
          zoomControl: false,
          scrollWheelZoom: true,
          wheelDebounceTime: 40,
          wheelPxPerZoomLevel: 60,
          zoomAnimation: true,
          fadeAnimation: false,
          markerZoomAnimation: true,
        }).setView([NAGPUR_CENTER.lat, NAGPUR_CENTER.lng], 12);

        if (!map.getPane("roadsPane")) {
          map.createPane("roadsPane");
          const roadsPane = map.getPane("roadsPane");
          if (roadsPane) roadsPane.style.zIndex = "450";
        }

        const tile = createLeafletTileLayer(L, mapType);
        tile.addTo(map);
        leafletTileRef.current = tile;
        tileMapTypeRef.current = mapType;

        map.on("moveend", () => {
          if (moveEndTimerRef.current) clearTimeout(moveEndTimerRef.current);
          moveEndTimerRef.current = setTimeout(() => {
            const c = map.getCenter();
            setMapCenter({ lat: c.lat, lng: c.lng });
          }, 400);
        });

        map.on("click", (e) => {
          onMapPointClickRef.current(e.latlng.lat, e.latlng.lng);
        });

        leafletMapRef.current = map;
        engineRef.current = "leaflet";
        setEngine("leaflet");
        setMapRef(map);
        requestAnimationFrame(() => {
          if (leafletMapRef.current !== map || !containerRef.current?.isConnected) return;
          try {
            map.invalidateSize();
          } catch {
            // map pane may not be ready during hot reload
          }
        });
        return;
      }

      try {
        const validMapId = getValidGoogleMapId();
        const { Map } = await loadMapLibraries();
        if (generation !== initGenRef.current || !containerRef.current) return;

        const mapOptions: google.maps.MapOptions = {
          center: NAGPUR_CENTER,
          zoom: 12,
          disableDefaultUI: true,
          gestureHandling: "greedy",
        };

        if (validMapId) {
          mapOptions.mapId = validMapId;
        } else {
          mapOptions.styles = darkMapStyles;
        }

        const map = new Map(container, mapOptions);

        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayerRef.current = trafficLayer;

        map.addListener("idle", () => {
          if (moveEndTimerRef.current) clearTimeout(moveEndTimerRef.current);
          moveEndTimerRef.current = setTimeout(() => {
            const c = map.getCenter();
            if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
          }, 400);
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          onMapPointClickRef.current(e.latLng.lat(), e.latLng.lng());
        });

        googleMapRef.current = map;
        engineRef.current = "google";
        setEngine("google");
        setMapRef(map);
      } catch (err) {
        if (generation === initGenRef.current) {
          activateLeafletFallback(String(err));
        }
      }
    };

    void init();

    return () => {
      initGenRef.current++;
      teardown();
      setEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per engine; callbacks via refs
  }, [forceLeaflet]);

  // Google: map type + traffic
  useEffect(() => {
    if (engine !== "google") return;
    const map = googleMapRef.current;
    if (!map) return;
    map.setMapTypeId(mapType);
    const traffic = trafficLayerRef.current;
    if (traffic) {
      traffic.setMap(trafficLayerVisible ? map : null);
    }
  }, [mapType, trafficLayerVisible, engine]);

  // Leaflet: update tile URL on map type change (never remove/re-add — that blanks tiles)
  useEffect(() => {
    if (engine !== "leaflet") return;
    const map = leafletMapRef.current;
    const tile = leafletTileRef.current;
    if (!map || !tile) return;
    if (tileMapTypeRef.current === mapType) return;

    const { url } = leafletTileConfig(mapType);
    tile.setUrl(url);
    tileMapTypeRef.current = mapType;
  }, [mapType, engine]);

  // Fly map to incident when selected from sidebar
  useEffect(() => {
    if (!mapFlyTarget) return;
    const zoom = mapFlyTarget.zoom ?? 15;

    if (engine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.flyTo([mapFlyTarget.lat, mapFlyTarget.lng], zoom, { duration: 0.8 });
      clearFlyTarget();
      return;
    }

    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: mapFlyTarget.lat, lng: mapFlyTarget.lng });
      googleMapRef.current.setZoom(zoom);
      clearFlyTarget();
    }
  }, [mapFlyTarget, engine, clearFlyTarget]);

  // Highlight road when an incident is selected
  useEffect(() => {
    if (!selectedReportId) return;
    const report = reports.find((r) => r.id === selectedReportId);
    if (!report) return;
    const road =
      (report.roadId && getRoadById(report.roadId)) ||
      findNearestRoad(report.latitude, report.longitude);
    if (road) setSelectedRoadId(road.id);
  }, [selectedReportId, reports, setSelectedRoadId]);

  // Visual pin while reporting
  useEffect(() => {
    if (engine !== "leaflet" || !leafletMapRef.current) return;

    void (async () => {
      const L = await import("leaflet");
      const map = leafletMapRef.current!;

      if (!isReportDialogOpen || !reportPickLocation) {
        leafletPickMarkerRef.current?.remove();
        leafletPickMarkerRef.current = null;
        return;
      }

      const { lat, lng } = reportPickLocation;
      const icon = L.divIcon({
        html: `<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-sm shadow-xl ring-4 ring-primary/30">📍</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      if (leafletPickMarkerRef.current) {
        leafletPickMarkerRef.current.setLatLng([lat, lng]);
      } else {
        leafletPickMarkerRef.current = L.marker([lat, lng], {
          icon,
          zIndexOffset: 2000,
        }).addTo(map);
      }
    })();
  }, [engine, isReportDialogOpen, reportPickLocation]);

  // Road corridor overlays
  useEffect(() => {
    let cancelled = false;

    if (!mapLayers.roadHighlights) {
      clearLeafletRoadLayerRef(leafletRoadLayersRef);
      googleRoadsRef.current.forEach((p) => p.setMap(null));
      googleRoadsRef.current = [];
      return () => {
        cancelled = true;
      };
    }

    const states = buildRoadHighlightStates(reports, selectedRoadId);

    if (engine === "leaflet" && leafletMapRef.current) {
      void (async () => {
        const L = await import("leaflet");
        const map = leafletMapRef.current;
        if (cancelled || !map) return;

        if (!map.getPane("roadsPane")) {
          map.createPane("roadsPane");
          const roadsPane = map.getPane("roadsPane");
          if (roadsPane) roadsPane.style.zIndex = "450";
        }

        clearLeafletRoadLayerRef(leafletRoadLayersRef);

        for (const state of states) {
          if (cancelled) return;

          const stroke = roadStrokeForState(state);
          const latlngs = state.road.path.map(([lat, lng]) => L.latLng(lat, lng));

          const glow = L.polyline(latlngs, {
            color: stroke.color,
            weight: stroke.weight + 6,
            opacity: stroke.opacity * 0.3,
            lineCap: "round",
            lineJoin: "round",
            interactive: false,
            pane: "roadsPane",
          }).addTo(map);

          const line = L.polyline(latlngs, {
            color: stroke.color,
            weight: stroke.weight,
            opacity: stroke.opacity,
            dashArray: stroke.dashArray,
            lineCap: "round",
            lineJoin: "round",
            pane: "roadsPane",
          }).addTo(map);

          const label = [
            state.road.name,
            state.issueCount > 0 ? `${state.issueCount} issue(s)` : null,
            state.accidentProne ? "Accident-prone" : null,
          ]
            .filter(Boolean)
            .join(" · ");

          line.bindTooltip(label, { sticky: true, className: "road-tooltip" });
          line.on("click", (ev) => {
            const { lat, lng } = ev.latlng;
            if (handleReportMapPick(lat, lng)) {
              L.DomEvent.stopPropagation(ev);
              return;
            }
            L.DomEvent.stopPropagation(ev);
            setSelectedRoadId(state.road.id);
            setSelectedReportId(null);
            const c = getRoadCentroid(state.road);
            leafletMapRef.current?.flyTo([c.lat, c.lng], 15, { duration: 0.6 });
          });

          leafletRoadLayersRef.current.push(glow, line);
        }
      })();
    }

    if (engine === "google" && googleMapRef.current) {
      googleRoadsRef.current.forEach((p) => p.setMap(null));
      googleRoadsRef.current = [];

      const map = googleMapRef.current;
      states.forEach((state) => {
        const stroke = roadStrokeForState(state);
        const path = state.road.path.map(([lat, lng]) => ({ lat, lng }));

        const glow = new google.maps.Polyline({
          path,
          strokeColor: stroke.color,
          strokeWeight: stroke.weight + 8,
          strokeOpacity: stroke.opacity * 0.25,
          map,
          clickable: false,
        });

        const line = new google.maps.Polyline({
          path,
          strokeColor: stroke.color,
          strokeWeight: stroke.weight,
          strokeOpacity: stroke.opacity,
          map,
          clickable: true,
        });

        line.addListener("click", () => {
          setSelectedRoadId(state.road.id);
          setSelectedReportId(null);
          const c = getRoadCentroid(state.road);
          map.panTo(c);
          map.setZoom(15);
        });

        googleRoadsRef.current.push(glow, line);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [
    engine,
    mapLayers.roadHighlights,
    reports,
    selectedRoadId,
    setSelectedRoadId,
    setSelectedReportId,
  ]);

  // Leaflet intelligence overlays: heatmap, wards, crews, infrastructure
  useEffect(() => {
    if (engine !== "leaflet") return;
    const map = leafletMapRef.current;
    if (!map) return;

    void (async () => {
      const L = await import("leaflet");
      if (!leafletOverlayRef.current) {
        leafletOverlayRef.current = L.layerGroup().addTo(map);
      }
      const group = leafletOverlayRef.current;
      group.clearLayers();

      if (mapLayers.wardBoundaries || mapLayers.riskZones) {
        NAGPUR_WARDS.forEach((ward) => {
          const [[s, w], [n, e]] = ward.bounds;
          const health = wardHealthScore(ward.id, reports);
          const fill =
            mapLayers.riskZones
              ? health >= 70
                ? "#22c55e"
                : health >= 50
                  ? "#f59e0b"
                  : "#ef4444"
              : ward.color;
          L.rectangle(
            [
              [s, w],
              [n, e],
            ],
            {
              color: ward.color,
              weight: mapLayers.wardBoundaries ? 2 : 0,
              fillColor: fill,
              fillOpacity: mapLayers.riskZones ? 0.18 : 0.06,
              interactive: false,
            }
          )
            .bindTooltip(`${ward.name} · Health ${health}/100`, { sticky: true })
            .addTo(group);
        });
      }

      if (mapLayers.heatmap) {
        buildHeatmapPoints(reports).forEach((pt) => {
          L.circle([pt.lat, pt.lng], {
            radius: 120 + pt.intensity * 180,
            color: "#ef4444",
            fillColor: "#f97316",
            fillOpacity: 0.15 + pt.intensity * 0.25,
            weight: 0,
            interactive: false,
          }).addTo(group);
        });
      }

      if (mapLayers.missingPersonsHeatmap) {
        buildMissingPersonHeatmapPoints(missingPersons).forEach((pt) => {
          L.circle([pt.lat, pt.lng], {
            radius: 160 + pt.intensity * 240,
            color: "#7c3aed",
            fillColor: "#a855f7",
            fillOpacity: 0.18 + pt.intensity * 0.32,
            weight: 0,
            interactive: false,
          }).addTo(group);
        });

        missingPersons
          .filter((p) => p.status === "ACTIVE")
          .forEach((person) => {
            const photo = person.photoUrl;
            if (photo) {
              L.marker([person.latitude, person.longitude], {
                icon: L.divIcon({
                  html: `<div class="h-9 w-9 overflow-hidden rounded-full border-2 border-violet-300 shadow-lg ring-2 ring-violet-500/40"><img src="${photo}" class="h-full w-full object-cover" alt="" /></div>`,
                  className: "",
                  iconSize: [36, 36],
                  iconAnchor: [18, 18],
                }),
                zIndexOffset: 500,
              })
                .bindTooltip(
                  `<strong>${person.name}</strong> (${person.age}y)<br/>${person.area}<br/>Last seen: ${new Date(person.lastSeenAt).toLocaleString()}`,
                  { sticky: true, className: "road-tooltip" }
                )
                .on("click", (ev) => {
                  L.DomEvent.stopPropagation(ev);
                  flyToLocation({
                    lat: person.latitude,
                    lng: person.longitude,
                    zoom: 16,
                  });
                })
                .addTo(group);
            } else {
              L.circleMarker([person.latitude, person.longitude], {
                radius: 7,
                color: "#ddd6fe",
                fillColor: "#7c3aed",
                fillOpacity: 0.95,
                weight: 2,
              })
                .bindTooltip(
                  `<strong>${person.name}</strong> (${person.age}y)<br/>${person.area}`,
                  { sticky: true, className: "road-tooltip" }
                )
                .on("click", (ev) => {
                  L.DomEvent.stopPropagation(ev);
                  flyToLocation({
                    lat: person.latitude,
                    lng: person.longitude,
                    zoom: 16,
                  });
                })
                .addTo(group);
            }
          });
      }

      if (mapLayers.infrastructure) {
        const infra = [
          { name: "Govt Medical College", lat: 21.1498, lng: 79.0889 },
          { name: "Ambazari Lake", lat: 21.128, lng: 79.055 },
          { name: "Railway Station", lat: 21.152, lng: 79.088 },
          { name: "School Zone — Civil Lines", lat: 21.145, lng: 79.09 },
          { name: "Sitabuldi Fort", lat: 21.158, lng: 79.092 },
          { name: "MIHAN SEZ Gate", lat: 21.108, lng: 79.035 },
          { name: "Zero Mile Stone", lat: 21.1498, lng: 79.0882 },
          { name: "Seminary Hills Park", lat: 21.145, lng: 79.125 },
          { name: "Ajni Square", lat: 21.138, lng: 79.078 },
          { name: "Variety Square", lat: 21.156, lng: 79.094 },
        ];
        infra.forEach((i) => {
          L.circleMarker([i.lat, i.lng], {
            radius: 6,
            color: "#38bdf8",
            fillColor: "#0ea5e9",
            fillOpacity: 0.9,
            weight: 2,
          })
            .bindTooltip(i.name)
            .addTo(group);
        });
      }

      if (mapLayers.crewTracking) {
        const crews = buildDemoCrews(reports);
        crews.forEach((crew) => {
          const color =
            crew.status === "ON_SITE"
              ? "#22c55e"
              : crew.status === "EN_ROUTE"
                ? "#f59e0b"
                : "#94a3b8";
          L.marker([crew.lat, crew.lng], {
            icon: L.divIcon({
              html: `<div class="flex items-center gap-1 rounded-full border-2 border-white bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg" style="border-color:${color}">🚧 ${crew.name.split(" ")[0]}</div>`,
              className: "",
              iconSize: [80, 28],
              iconAnchor: [40, 14],
            }),
          })
            .bindTooltip(`${crew.name} — ${crew.status.replace("_", " ")}`)
            .addTo(group);
        });
      }
    })();
  }, [engine, mapLayers, reports, missingPersons, flyToLocation]);

  // Google markers
  useEffect(() => {
    if (engine !== "google") return;
    const map = googleMapRef.current;
    if (!map) return;

    const validMapId = getValidGoogleMapId();
    const useAdvancedMarkers =
      Boolean(validMapId) && Boolean(window.google?.maps?.marker?.AdvancedMarkerElement);

    const filteredReports = reports.filter(typeFilter);
    const filteredNews = filters.news ? news : [];

    googleMarkersRef.current.forEach((m) => {
      if ("map" in m && m.map !== undefined) {
        m.map = null;
      } else if ("setMap" in m) {
        m.setMap(null);
      }
    });
    googleMarkersRef.current.clear();

    const markers: Array<google.maps.Marker | google.maps.marker.AdvancedMarkerElement> = [];

    const makePin = (color: string) => {
      const pin = document.createElement("div");
      pin.className =
        "h-6 w-6 cursor-pointer rounded-full border-2 border-white shadow-md";
      pin.style.backgroundColor = color;
      pin.style.transform = "translate(-50%, -50%)";
      return pin;
    };

    filteredReports.forEach((report) => {
      const color = REPORT_TYPE_COLORS[report.type] ?? "#6b7280";
      const position = { lat: report.latitude, lng: report.longitude };

      const marker = useAdvancedMarkers
        ? new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: makePin(color),
            title: report.type,
          })
        : new google.maps.Marker({
            map,
            position,
            title: report.type,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

      marker.addListener("click", () => setSelectedReportId(report.id));
      googleMarkersRef.current.set(report.id, marker);
      markers.push(marker);
    });

    filteredNews.forEach((item) => {
      const position = { lat: item.latitude, lng: item.longitude };

      const marker = useAdvancedMarkers
        ? new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: makePin(NEWS_MARKER_COLOR),
            title: item.title,
          })
        : new google.maps.Marker({
            map,
            position,
            title: item.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: NEWS_MARKER_COLOR,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

      marker.addListener("click", () => setSelectedNewsId(item.id));
      markers.push(marker);
    });

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markers);
    } else {
      clustererRef.current = new MarkerClusterer({ map, markers });
    }
  }, [
    reports,
    news,
    filters.news,
    typeFilter,
    setSelectedReportId,
    setSelectedNewsId,
    engine,
  ]);

  // Leaflet markers — diff by id to avoid flicker on data refresh
  useEffect(() => {
    if (engine !== "leaflet") return;
    const map = leafletMapRef.current;
    if (!map) return;

    void (async () => {
      const L = await import("leaflet");

      const filteredReports = reports.filter(typeFilter);
      const filteredNews = filters.news ? news : [];

      const reportIds = new Set(filteredReports.map((r) => r.id));
      const newsIds = new Set(filteredNews.map((n) => n.id));

      leafletMarkersRef.current.forEach((marker, id) => {
        if (!reportIds.has(id)) {
          marker.remove();
          leafletMarkersRef.current.delete(id);
        }
      });

      leafletNewsMarkersRef.current.forEach((marker, id) => {
        if (!newsIds.has(id)) {
          marker.remove();
          leafletNewsMarkersRef.current.delete(id);
        }
      });

      const makeIcon = (color: string, severity = 5, pulse = false) => {
        const size = Math.round(18 + (severity / 10) * 14);
        const pulseClass = pulse ? "incident-pulse" : "";
        return L.divIcon({
          html: `<div class="${pulseClass} rounded-full border-2 border-white shadow-lg" style="width:${size}px;height:${size}px;background:${color}"></div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      };

      const makeRoadIcon = (type: string, severity = 5, pulse = false) => {
        const size = Math.round(26 + (severity / 10) * 8);
        const color = REPORT_TYPE_COLORS[type] ?? "#6b7280";
        const sym = REPORT_TYPE_ICONS[type] ?? "•";
        const pulseClass = pulse ? "incident-pulse" : "";
        return L.divIcon({
          html: `<div class="${pulseClass} flex items-center justify-center border-2 border-white font-bold text-white shadow-lg" style="width:${size}px;height:${size}px;background:${color};border-radius:6px;transform:rotate(45deg);font-size:${Math.round(size * 0.45)}px"><span style="transform:rotate(-45deg);line-height:1">${sym}</span></div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      };

      filteredReports.forEach((report) => {
        const existing = leafletMarkersRef.current.get(report.id);
        const severity = report.aiMetadata?.severity ?? 5;
        const isHigh =
          mapLayers.pulseMarkers &&
          (severity >= 7 || report.id === selectedReportId);
        const icon = makeRoadIcon(report.type, severity, isHigh);

        if (existing) {
          existing.setLatLng([report.latitude, report.longitude]);
          existing.setIcon(icon);
          return;
        }

        const marker = L.marker([report.latitude, report.longitude], {
          icon,
        })
          .addTo(map)
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedReportId(report.id);
          });
        leafletMarkersRef.current.set(report.id, marker);
      });

      filteredNews.forEach((item) => {
        if (leafletNewsMarkersRef.current.has(item.id)) return;
        const marker = L.marker([item.latitude, item.longitude], {
          icon: makeIcon(NEWS_MARKER_COLOR),
        })
          .addTo(map)
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedNewsId(item.id);
          });
        leafletNewsMarkersRef.current.set(item.id, marker);
      });
    })();
  }, [
    reports,
    news,
    filters.news,
    typeFilter,
    setSelectedReportId,
    setSelectedNewsId,
    engine,
    mapLayers.pulseMarkers,
    selectedReportId,
  ]);

  const pinPicking =
    isReportDialogOpen && reportLocationMode === "PINPOINT" && !reportLocationPinned;

  // Nudge tile layer after report UI mode changes (never use bringToBack / removeLayer)
  useEffect(() => {
    if (!isReportDialogOpen || engine !== "leaflet") return;
    const map = leafletMapRef.current;
    if (!map) return;

    const refresh = () => {
      const tile = leafletTileRef.current;
      if (!tile || !map.hasLayer(tile)) return;
      tile.redraw();
      map.panBy([1, 0], { animate: false });
      map.panBy([-1, 0], { animate: false });
    };

    const t = window.setTimeout(refresh, 50);
    return () => window.clearTimeout(t);
  }, [isReportDialogOpen, reportLocationMode, reportLocationPinned, engine]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 h-full w-full pointer-events-auto"
      aria-label="CivicEye map"
    />
  );
}
