"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  StyleSpecification,
} from "maplibre-gl";
import type { DriverLocation, RouteStop } from "@/types/delivery";

type DeliveryRouteMapProps = {
  depot: { name: string; latitude: number; longitude: number };
  stops: RouteStop[];
  latestLocation: DriverLocation | null;
};

type MapLibreModule = typeof import("maplibre-gl");

type StopMarkerState = {
  element: HTMLDivElement;
  marker: MapLibreMarker;
};

type RenderedMapState = {
  depotMarker: MapLibreMarker | null;
  driverMarker: MapLibreMarker | null;
  stopMarkers: Map<string, StopMarkerState>;
};

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ROUTE_SOURCE_ID = "delivery-route";
const ROUTE_SHADOW_LAYER_ID = "delivery-route-shadow";
const ROUTE_LINE_LAYER_ID = "delivery-route-line";

function createMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [TILE_URL],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}

function createRouteData(coordinates: [number, number][]) {
  return {
    type: "FeatureCollection" as const,
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature" as const,
              properties: {},
              geometry: {
                type: "LineString" as const,
                coordinates,
              },
            },
          ]
        : [],
  };
}

function createStopPopupContent(stop: RouteStop) {
  const content = document.createElement("div");
  content.style.maxWidth = "220px";
  content.style.lineHeight = "1.4";

  const title = document.createElement("strong");
  title.textContent = `${stop.stopOrder}. ${stop.delivery.recipientName}`;

  const address = document.createElement("div");
  address.style.marginTop = "4px";
  address.textContent = stop.delivery.address;

  content.append(title, address);
  return content;
}

function updateStopMarkerElement(element: HTMLDivElement, stop: RouteStop) {
  element.className = `route-map-marker ${
    stop.delivery.isReattempt
      ? "route-map-marker-reattempt"
      : stop.delivery.status === "delivered"
        ? "route-map-marker-delivered"
        : ""
  }`;
  element.textContent = String(stop.stopOrder);
  element.title = `${stop.stopOrder}. ${stop.delivery.address}`;
}

function clearRenderedMap(state: RenderedMapState | null) {
  if (!state) return;

  state.depotMarker?.remove();
  state.driverMarker?.remove();
  for (const { marker } of state.stopMarkers.values()) {
    marker.remove();
  }
  state.stopMarkers.clear();
}

export function DeliveryRouteMap({
  depot,
  stops,
  latestLocation,
}: DeliveryRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDepotRef = useRef(depot);
  const mapLibreRef = useRef<MapLibreModule | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const renderedMapRef = useRef<RenderedMapState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapGeneration, setMapGeneration] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let initializedMap: MapLibreMap | null = null;

    async function initializeMap() {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const initialDepot = initialDepotRef.current;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: createMapStyle(),
          center: [initialDepot.longitude, initialDepot.latitude],
          zoom: 11,
          attributionControl: { compact: false },
        });
        initializedMap = map;
        mapRef.current = map;
        mapLibreRef.current = maplibregl;
        renderedMapRef.current = {
          depotMarker: null,
          driverMarker: null,
          stopMarkers: new Map(),
        };
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        map.once("load", () => {
          if (!cancelled) {
            setMapGeneration((generation) => generation + 1);
          }
        });
        map.on("error", (event) => {
          console.warn("OpenStreetMap tile or MapLibre error", event.error);
        });
      } catch (mapError) {
        console.error("Failed to render delivery map", mapError);
        if (!cancelled) {
          setError(
            "地図を読み込めませんでした。配送一覧は引き続き利用できます。",
          );
        }
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      if (mapRef.current === initializedMap) {
        clearRenderedMap(renderedMapRef.current);
        renderedMapRef.current = null;
        mapLibreRef.current = null;
        mapRef.current = null;
        initializedMap?.remove();
      }
    };
  }, [retryAttempt]);

  useEffect(() => {
    const maplibregl = mapLibreRef.current;
    const map = mapRef.current;
    const rendered = renderedMapRef.current;
    if (!maplibregl || !map || !rendered || !map.isStyleLoaded()) return;

    const routeCoordinates = stops
      .flatMap((stop, index) =>
        stop.geometry.map(({ longitude, latitude }, pointIndex) =>
          index > 0 && pointIndex === 0
            ? null
            : ([longitude, latitude] as [number, number]),
        ),
      )
      .filter((point): point is [number, number] => point !== null);
    const routeData = createRouteData(routeCoordinates);
    const existingRouteSource = map.getSource(ROUTE_SOURCE_ID) as
      GeoJSONSource | undefined;

    if (existingRouteSource) {
      existingRouteSource.setData(routeData);
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: routeData });
      map.addLayer({
        id: ROUTE_SHADOW_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        paint: {
          "line-color": "#2563eb",
          "line-width": 5,
          "line-opacity": 0.92,
        },
      });
    }

    const depotPosition: [number, number] = [depot.longitude, depot.latitude];
    if (rendered.depotMarker) {
      rendered.depotMarker.setLngLat(depotPosition);
      rendered.depotMarker.getElement().title = depot.name;
    } else {
      const element = document.createElement("div");
      element.className = "route-map-marker route-map-marker-depot";
      element.textContent = "拠";
      element.title = depot.name;
      rendered.depotMarker = new maplibregl.Marker({ element })
        .setLngLat(depotPosition)
        .addTo(map);
    }

    const activeStopIds = new Set<string>();
    for (const stop of stops) {
      activeStopIds.add(stop.stopId);
      const position: [number, number] = [
        stop.delivery.longitude,
        stop.delivery.latitude,
      ];
      const existing = rendered.stopMarkers.get(stop.stopId);

      if (existing) {
        updateStopMarkerElement(existing.element, stop);
        existing.marker
          .setLngLat(position)
          .setPopup(
            new maplibregl.Popup({ offset: 24 }).setDOMContent(
              createStopPopupContent(stop),
            ),
          );
      } else {
        const element = document.createElement("div");
        updateStopMarkerElement(element, stop);
        const marker = new maplibregl.Marker({ element })
          .setLngLat(position)
          .setPopup(
            new maplibregl.Popup({ offset: 24 }).setDOMContent(
              createStopPopupContent(stop),
            ),
          )
          .addTo(map);
        rendered.stopMarkers.set(stop.stopId, { element, marker });
      }
    }

    for (const [stopId, entry] of rendered.stopMarkers) {
      if (activeStopIds.has(stopId)) continue;
      entry.marker.remove();
      rendered.stopMarkers.delete(stopId);
    }

    if (latestLocation) {
      const position: [number, number] = [
        latestLocation.longitude,
        latestLocation.latitude,
      ];
      if (rendered.driverMarker) {
        rendered.driverMarker.setLngLat(position);
      } else {
        const element = document.createElement("div");
        element.className = "route-map-driver";
        element.textContent = "🚚";
        element.title = "ドライバーの最新位置";
        rendered.driverMarker = new maplibregl.Marker({ element })
          .setLngLat(position)
          .addTo(map);
      }
    } else if (rendered.driverMarker) {
      rendered.driverMarker.remove();
      rendered.driverMarker = null;
    }

    const bounds = new maplibregl.LngLatBounds(depotPosition, depotPosition);
    for (const stop of stops) {
      bounds.extend([stop.delivery.longitude, stop.delivery.latitude]);
    }
    if (latestLocation) {
      bounds.extend([latestLocation.longitude, latestLocation.latitude]);
    }
    map.resize();
    map.fitBounds(bounds, { padding: 54, maxZoom: 14, duration: 0 });
  }, [
    depot.latitude,
    depot.longitude,
    depot.name,
    latestLocation,
    mapGeneration,
    stops,
  ]);

  if (error) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center text-sm text-slate-500">
        <p>{error}</p>
        <button
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setError(null);
            setRetryAttempt((attempt) => attempt + 1);
          }}
          type="button"
        >
          地図を再読み込み
        </button>
      </div>
    );
  }

  return <div className="h-[420px] w-full" ref={containerRef} />;
}
