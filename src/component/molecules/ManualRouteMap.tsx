import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";

declare global {
  interface Window {
    L: any;
  }
}

export interface ManualMapStop {
  stopSequence: number;
  orderNumber: number;
  C_Number: number;
  lat: number;
  lng: number;
}

interface ManualRouteMapProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  stops: ManualMapStop[];
  height?: string | number;
}

const ManualRouteMap: React.FC<ManualRouteMapProps> = ({ origin, destination, stops, height = "100%" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        css.crossOrigin = "";
        document.head.appendChild(css);
      }
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
          script.crossOrigin = "";
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.head.appendChild(script);
        });
      }
      if (disposed || !window.L || !mapRef.current) return;

      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      }).setView([22.3, 73.17], 11);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const points: [number, number][] = [];
      if (origin) points.push([origin.lat, origin.lng]);
      stops.forEach((s) => {
        if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) points.push([s.lat, s.lng]);
      });
      if (destination) points.push([destination.lat, destination.lng]);

      if (points.length > 1) {
        window.L.polyline(points, { color: "#1E88E5", weight: 5, opacity: 0.9 }).addTo(map);
      }

      if (origin) {
        const startIcon = window.L.divIcon({
          className: "manual-route-marker-wrap",
          html: '<div class="manual-route-marker manual-route-marker-start">S</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        window.L.marker([origin.lat, origin.lng], { icon: startIcon }).addTo(map).bindPopup("<strong>Start</strong>");
      }
      stops.forEach((s, idx) => {
        const stopIcon = window.L.divIcon({
          className: "manual-route-marker-wrap",
          html: `<div class="manual-route-marker manual-route-marker-stop">${idx + 1}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        window.L
          .marker([s.lat, s.lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<strong>Stop ${s.stopSequence}</strong><br/>Order #${s.orderNumber}<br/>C#${s.C_Number}`);
      });
      if (destination) {
        const endIcon = window.L.divIcon({
          className: "manual-route-marker-wrap",
          html: '<div class="manual-route-marker manual-route-marker-end">E</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        window.L.marker([destination.lat, destination.lng], { icon: endIcon }).addTo(map).bindPopup("<strong>End</strong>");
      }

      if (points.length) {
        map.fitBounds(window.L.latLngBounds(points), { padding: [35, 35] });
      }
      mapInstanceRef.current = map;
    };
    load();

    return () => {
      disposed = true;
      if (mapInstanceRef.current) {
        // Stop any in-flight pan/zoom transitions before detach.
        try {
          mapInstanceRef.current.stop?.();
        } catch {
          // ignore
        }
        try {
          mapInstanceRef.current.off();
        } catch {
          // ignore
        }
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, stops]);

  return (
    <Box sx={{ width: "100%", height }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <style>
        {`
          .manual-route-marker-wrap {
            background: transparent;
            border: 0;
          }
          .manual-route-marker {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            border: 3px solid rgba(255,255,255,0.95);
            box-shadow: 0 8px 14px rgba(17, 35, 53, 0.28);
            font-size: 13px;
          }
          .manual-route-marker-start {
            background: linear-gradient(145deg, #45be73, #1f9e54);
          }
          .manual-route-marker-end {
            background: linear-gradient(145deg, #ff6f77, #e1454d);
          }
          .manual-route-marker-stop {
            width: 36px;
            height: 36px;
            background: linear-gradient(145deg, #1E88E5, #1565c0);
          }
        `}
      </style>
    </Box>
  );
};

export default ManualRouteMap;
