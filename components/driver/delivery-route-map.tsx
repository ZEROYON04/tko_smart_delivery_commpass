"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { DriverLocation, RouteStop } from "@/types/delivery";

type DeliveryRouteMapProps = {
  depot: { name: string; latitude: number; longitude: number };
  stops: RouteStop[];
  latestLocation: DriverLocation | null;
};

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function DeliveryRouteMap({
  depot,
  stops,
  latestLocation,
}: DeliveryRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function renderMap() {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const style: StyleSpecification = {
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
        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [depot.longitude, depot.latitude],
          zoom: 11,
          attributionControl: { compact: false },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        const routeCoordinates = stops
          .flatMap((stop, index) =>
            stop.geometry.map(({ longitude, latitude }, pointIndex) =>
              index > 0 && pointIndex === 0
                ? null
                : ([longitude, latitude] as [number, number]),
            ),
          )
          .filter((point): point is [number, number] => point !== null);

        map.on("load", () => {
          if (routeCoordinates.length >= 2) {
            map.addSource("delivery-route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: routeCoordinates,
                },
              },
            });
            map.addLayer({
              id: "delivery-route-shadow",
              type: "line",
              source: "delivery-route",
              paint: {
                "line-color": "#ffffff",
                "line-width": 8,
                "line-opacity": 0.85,
              },
            });
            map.addLayer({
              id: "delivery-route-line",
              type: "line",
              source: "delivery-route",
              paint: {
                "line-color": "#2563eb",
                "line-width": 5,
                "line-opacity": 0.92,
              },
            });
          }

          const depotElement = document.createElement("div");
          depotElement.className = "route-map-marker route-map-marker-depot";
          depotElement.textContent = "拠";
          depotElement.title = depot.name;
          new maplibregl.Marker({ element: depotElement })
            .setLngLat([depot.longitude, depot.latitude])
            .addTo(map);

          for (const stop of stops) {
            const marker = document.createElement("div");
            marker.className = `route-map-marker ${
              stop.delivery.isReattempt
                ? "route-map-marker-reattempt"
                : stop.delivery.status === "delivered"
                  ? "route-map-marker-delivered"
                  : ""
            }`;
            marker.textContent = String(stop.stopOrder);
            marker.title = `${stop.stopOrder}. ${stop.delivery.address}`;
            const popupContent = document.createElement("div");
            const popupTitle = document.createElement("strong");
            popupTitle.textContent = `${stop.stopOrder}. ${stop.delivery.recipientName}`;
            const popupAddress = document.createElement("p");
            popupAddress.textContent = stop.delivery.address;
            popupAddress.style.marginTop = "4px";
            popupContent.append(popupTitle, popupAddress);
            new maplibregl.Marker({ element: marker })
              .setLngLat([stop.delivery.longitude, stop.delivery.latitude])
              .setPopup(
                new maplibregl.Popup({ offset: 24 }).setDOMContent(
                  popupContent,
                ),
              )
              .addTo(map);
          }

          if (latestLocation) {
            const driver = document.createElement("div");
            driver.className = "route-map-driver";
            driver.textContent = "🚚";
            driver.title = "ドライバーの最新位置";
            new maplibregl.Marker({ element: driver })
              .setLngLat([latestLocation.longitude, latestLocation.latitude])
              .addTo(map);
          }

          const bounds = new maplibregl.LngLatBounds(
            [depot.longitude, depot.latitude],
            [depot.longitude, depot.latitude],
          );
          for (const stop of stops) {
            bounds.extend([stop.delivery.longitude, stop.delivery.latitude]);
          }
          map.fitBounds(bounds, { padding: 54, maxZoom: 14, duration: 0 });
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

    void renderMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
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
