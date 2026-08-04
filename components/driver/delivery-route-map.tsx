"use client";

import { useEffect, useRef, useState } from "react";
import type { DriverLocation, RouteStop } from "@/types/delivery";

type DeliveryRouteMapProps = {
  depot: { name: string; latitude: number; longitude: number };
  stops: RouteStop[];
  latestLocation: DriverLocation | null;
};

type GoogleMapsLatLng = {
  lat: number;
  lng: number;
};

type GoogleMapsMapInstance = {
  fitBounds(bounds: GoogleMapsBoundsInstance, padding: number): void;
};

type GoogleMapsBoundsInstance = {
  extend(point: GoogleMapsLatLng): void;
};

type GoogleMapsEventListenerInstance = {
  remove(): void;
};

type GoogleMapsOverlayInstance = {
  setMap(map: GoogleMapsMapInstance | null): void;
};

type GoogleMapsMarkerInstance = GoogleMapsOverlayInstance & {
  addListener(
    eventName: string,
    handler: () => void,
  ): GoogleMapsEventListenerInstance;
  setLabel(label: {
    text: string;
    color?: string;
    fontWeight?: string;
    fontSize?: string;
  }): void;
  setPosition(position: GoogleMapsLatLng): void;
  setTitle(title: string): void;
};

type GoogleMapsInfoWindowInstance = {
  close(): void;
  setContent(content: Element): void;
  open(options: {
    map: GoogleMapsMapInstance;
    anchor: GoogleMapsMarkerInstance;
  }): void;
};

type GoogleMapsPolylineInstance = GoogleMapsOverlayInstance & {
  setPath(path: GoogleMapsLatLng[]): void;
};

type GoogleMapsMapsApi = {
  Map: new (
    container: Element,
    options: {
      center: GoogleMapsLatLng;
      zoom: number;
      mapTypeControl: boolean;
      streetViewControl: boolean;
      fullscreenControl: boolean;
    },
  ) => GoogleMapsMapInstance;
  Marker: new (options: {
    position: GoogleMapsLatLng;
    map: GoogleMapsMapInstance;
    title?: string;
    label?: {
      text: string;
      color?: string;
      fontWeight?: string;
      fontSize?: string;
    };
  }) => GoogleMapsMarkerInstance;
  Polyline: new (options: {
    path: GoogleMapsLatLng[];
    geodesic: boolean;
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
    map: GoogleMapsMapInstance;
  }) => GoogleMapsPolylineInstance;
  InfoWindow: new () => GoogleMapsInfoWindowInstance;
  LatLngBounds: new () => GoogleMapsBoundsInstance;
};

type GoogleMapsWindow = Window &
  typeof globalThis & {
    google?: {
      maps: GoogleMapsMapsApi;
    };
    __googleMapsScriptPromise?: Promise<void>;
  };

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type RenderedMapState = {
  depotMarker: GoogleMapsMarkerInstance | null;
  driverMarker: GoogleMapsMarkerInstance | null;
  infoWindow: GoogleMapsInfoWindowInstance;
  route: GoogleMapsPolylineInstance | null;
  stopMarkers: Map<
    string,
    {
      listener: GoogleMapsEventListenerInstance;
      marker: GoogleMapsMarkerInstance;
    }
  >;
};

function loadGoogleMaps(): Promise<void> {
  const googleWindow = window as GoogleMapsWindow;

  if (googleWindow.google?.maps) {
    return Promise.resolve();
  }

  if (googleWindow.__googleMapsScriptPromise) {
    return googleWindow.__googleMapsScriptPromise;
  }

  googleWindow.__googleMapsScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY ?? ""}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleWindow.__googleMapsScriptPromise = undefined;
      script.remove();
      reject(new Error("Google Maps API の読み込みに失敗しました。"));
    };
    document.head.appendChild(script);
  });

  return googleWindow.__googleMapsScriptPromise;
}

function createStopInfoContent(stop: RouteStop) {
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

function clearRenderedMap(state: RenderedMapState | null) {
  if (!state) return;

  state.infoWindow.close();
  state.route?.setMap(null);
  state.depotMarker?.setMap(null);
  state.driverMarker?.setMap(null);
  for (const { listener, marker } of state.stopMarkers.values()) {
    listener.remove();
    marker.setMap(null);
  }
  state.stopMarkers.clear();
}

export function DeliveryRouteMap({
  depot,
  stops,
  latestLocation,
}: DeliveryRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const googleMapsRef = useRef<GoogleMapsMapsApi | null>(null);
  const initialDepotRef = useRef(depot);
  const mapRef = useRef<GoogleMapsMapInstance | null>(null);
  const renderedMapRef = useRef<RenderedMapState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapGeneration, setMapGeneration] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let initializedMap: GoogleMapsMapInstance | null = null;

    async function initializeMap() {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error("Google Maps API キーが未設定です。");
        }

        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const googleMaps = (window as GoogleMapsWindow).google?.maps;
        if (!googleMaps) {
          throw new Error("Google Maps API が利用できません。");
        }

        const initialDepot = initialDepotRef.current;
        const map = new googleMaps.Map(containerRef.current, {
          center: {
            lat: initialDepot.latitude,
            lng: initialDepot.longitude,
          },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        initializedMap = map;
        mapRef.current = map;
        googleMapsRef.current = googleMaps;
        renderedMapRef.current = {
          depotMarker: null,
          driverMarker: null,
          infoWindow: new googleMaps.InfoWindow(),
          route: null,
          stopMarkers: new Map(),
        };
        setMapGeneration((generation) => generation + 1);
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
        googleMapsRef.current = null;
        mapRef.current = null;
      }
    };
  }, [retryAttempt]);

  useEffect(() => {
    const googleMaps = googleMapsRef.current;
    const map = mapRef.current;
    const rendered = renderedMapRef.current;
    if (!googleMaps || !map || !rendered) return;

    const routePath = stops
      .flatMap((stop, index) =>
        stop.geometry.map(({ longitude, latitude }, pointIndex) =>
          index > 0 && pointIndex === 0
            ? null
            : { lat: latitude, lng: longitude },
        ),
      )
      .filter((point): point is GoogleMapsLatLng => point !== null);

    if (routePath.length >= 2) {
      if (rendered.route) {
        rendered.route.setPath(routePath);
        rendered.route.setMap(map);
      } else {
        rendered.route = new googleMaps.Polyline({
          path: routePath,
          geodesic: false,
          strokeColor: "#2563eb",
          strokeOpacity: 0.92,
          strokeWeight: 5,
          map,
        });
      }
    } else if (rendered.route) {
      rendered.route.setMap(null);
      rendered.route = null;
    }

    const depotPosition = { lat: depot.latitude, lng: depot.longitude };
    if (rendered.depotMarker) {
      rendered.depotMarker.setPosition(depotPosition);
      rendered.depotMarker.setTitle(depot.name);
      rendered.depotMarker.setMap(map);
    } else {
      rendered.depotMarker = new googleMaps.Marker({
        position: depotPosition,
        map,
        title: depot.name,
        label: { text: "拠", color: "#ffffff", fontWeight: "700" },
      });
    }

    const activeStopIds = new Set<string>();
    for (const stop of stops) {
      activeStopIds.add(stop.stopId);
      const position = {
        lat: stop.delivery.latitude,
        lng: stop.delivery.longitude,
      };
      const title = `${stop.stopOrder}. ${stop.delivery.address}`;
      const label = {
        text: String(stop.stopOrder),
        color: "#ffffff",
        fontWeight: "700",
      };
      const existing = rendered.stopMarkers.get(stop.stopId);

      if (existing) {
        existing.listener.remove();
        existing.marker.setPosition(position);
        existing.marker.setTitle(title);
        existing.marker.setLabel(label);
        existing.marker.setMap(map);
        existing.listener = existing.marker.addListener("click", () => {
          rendered.infoWindow.setContent(createStopInfoContent(stop));
          rendered.infoWindow.open({ map, anchor: existing.marker });
        });
      } else {
        const marker = new googleMaps.Marker({
          position,
          map,
          title,
          label,
        });
        const listener = marker.addListener("click", () => {
          rendered.infoWindow.setContent(createStopInfoContent(stop));
          rendered.infoWindow.open({ map, anchor: marker });
        });
        rendered.stopMarkers.set(stop.stopId, { listener, marker });
      }
    }

    for (const [stopId, entry] of rendered.stopMarkers) {
      if (activeStopIds.has(stopId)) continue;
      entry.listener.remove();
      entry.marker.setMap(null);
      rendered.stopMarkers.delete(stopId);
    }

    if (latestLocation) {
      const position = {
        lat: latestLocation.latitude,
        lng: latestLocation.longitude,
      };
      if (rendered.driverMarker) {
        rendered.driverMarker.setPosition(position);
        rendered.driverMarker.setMap(map);
      } else {
        rendered.driverMarker = new googleMaps.Marker({
          position,
          map,
          title: "ドライバーの最新位置",
          label: { text: "🚚", fontSize: "18px" },
        });
      }
    } else if (rendered.driverMarker) {
      rendered.driverMarker.setMap(null);
      rendered.driverMarker = null;
    }

    const bounds = new googleMaps.LatLngBounds();
    bounds.extend(depotPosition);
    for (const stop of stops) {
      bounds.extend({
        lat: stop.delivery.latitude,
        lng: stop.delivery.longitude,
      });
    }
    if (latestLocation) {
      bounds.extend({
        lat: latestLocation.latitude,
        lng: latestLocation.longitude,
      });
    }
    map.fitBounds(bounds, 54);
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
        {GOOGLE_MAPS_API_KEY && (
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
        )}
      </div>
    );
  }

  return <div className="h-[420px] w-full" ref={containerRef} />;
}
