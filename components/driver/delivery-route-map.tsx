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

type GoogleMapsMarkerInstance = {
  addListener(eventName: string, handler: () => void): void;
};

type GoogleMapsInfoWindowInstance = {
  setContent(content: string): void;
  open(options: {
    map: GoogleMapsMapInstance;
    anchor: GoogleMapsMarkerInstance;
  }): void;
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
  }) => unknown;
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
    script.onerror = () =>
      reject(new Error("Google Maps API の読み込みに失敗しました。"));
    document.head.appendChild(script);
  });

  return googleWindow.__googleMapsScriptPromise;
}

export function DeliveryRouteMap({
  depot,
  stops,
  latestLocation,
}: DeliveryRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapsMapInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function renderMap() {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error("Google Maps API キーが未設定です。 ");
        }

        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const googleMaps = (window as GoogleMapsWindow).google?.maps;
        if (!googleMaps) {
          throw new Error("Google Maps API が利用できません。 ");
        }

        const map = new googleMaps.Map(containerRef.current, {
          center: { lat: depot.latitude, lng: depot.longitude },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const routeCoordinates = stops
          .flatMap((stop, index) =>
            stop.geometry.map(({ longitude, latitude }, pointIndex) =>
              index > 0 && pointIndex === 0
                ? null
                : ([longitude, latitude] as [number, number]),
            ),
          )
          .filter((point): point is [number, number] => point !== null);

        if (routeCoordinates.length >= 2) {
          const routePath = routeCoordinates.map(([longitude, latitude]) => ({
            lat: latitude,
            lng: longitude,
          }));
          new googleMaps.Polyline({
            path: routePath,
            geodesic: false,
            strokeColor: "#2563eb",
            strokeOpacity: 0.92,
            strokeWeight: 5,
            map,
          });
        }

        new googleMaps.Marker({
          position: { lat: depot.latitude, lng: depot.longitude },
          map,
          title: depot.name,
          label: { text: "拠", color: "#ffffff", fontWeight: "700" },
        });

        const infoWindow = new googleMaps.InfoWindow();
        for (const stop of stops) {
          const marker = new googleMaps.Marker({
            position: {
              lat: stop.delivery.latitude,
              lng: stop.delivery.longitude,
            },
            map,
            title: `${stop.stopOrder}. ${stop.delivery.address}`,
            label: {
              text: String(stop.stopOrder),
              color: "#ffffff",
              fontWeight: "700",
            },
          });

          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div style="max-width: 220px; line-height: 1.4;">
                <strong>${stop.stopOrder}. ${stop.delivery.recipientName}</strong>
                <div style="margin-top: 4px;">${stop.delivery.address}</div>
              </div>`,
            );
            infoWindow.open({ map, anchor: marker });
          });
        }

        if (latestLocation) {
          new googleMaps.Marker({
            position: {
              lat: latestLocation.latitude,
              lng: latestLocation.longitude,
            },
            map,
            title: "ドライバーの最新位置",
            label: { text: "🚚", fontSize: "18px" },
          });
        }

        const bounds = new googleMaps.LatLngBounds();
        bounds.extend({ lat: depot.latitude, lng: depot.longitude });
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
      } catch (mapError) {
        console.error("Failed to render delivery map", mapError);
        if (!cancelled) {
          setError(
            "地図を読み込めませんでした。配送一覧は引き続き利用できます。",
          );
        }
      }
    }

    void renderMap();
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [depot.latitude, depot.longitude, depot.name, latestLocation, stops]);

  if (error) {
    return (
      <div className="flex h-[420px] items-center justify-center bg-slate-100 px-6 text-center text-sm text-slate-500">
        {error}
      </div>
    );
  }

  return <div className="h-[420px] w-full" ref={containerRef} />;
}
