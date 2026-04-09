import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";

declare global {
  interface Window {
    L: any;
  }
}

export type RouteStopMapPoint = {
  lat: number;
  lng: number;
  sequence?: number;
  title?: string;
};

interface RouteStopsPreviewMapProps {
  points: RouteStopMapPoint[];
  height?: string | number;
  /** Line color (e.g. theme primary) */
  lineColor?: string;
}

/**
 * Leaflet map: straight-line path through stop coordinates (no encoded polyline from API).
 */
const RouteStopsPreviewMap: React.FC<RouteStopsPreviewMapProps> = ({
  points,
  height = 320,
  lineColor = "#1976d2",
}) => {
  const theme = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const isDark = theme.palette.mode === "dark";

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  useEffect(() => {
    let disposed = false;

    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement("link");
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      leafletCSS.crossOrigin = "";
      document.head.appendChild(leafletCSS);
    }

    const loadLeaflet = () =>
      new Promise<void>((resolve) => {
        if (window.L) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.crossOrigin = "";
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });

    const run = async () => {
      await loadLeaflet();
      if (disposed || !mapRef.current || !window.L) return;

      const L = window.L;
      const map = L.map(mapRef.current, {
        attributionControl: false,
        zoomControl: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      const tiles = L.tileLayer(tileUrl, {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: "",
      });
      tiles.addTo(map);
      mapInstanceRef.current = map;
      layerRef.current = tiles;
      setReady(true);
    };

    run();

    return () => {
      disposed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      layerRef.current = null;
      setReady(false);
    };
  }, [tileUrl]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !ready) return;

    const L = window.L;
    const base = layerRef.current;
    map.eachLayer((layer: any) => {
      if (layer === base) return;
      try {
        map.removeLayer(layer);
      } catch {
        /* ignore */
      }
    });

    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (valid.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    const latlngs = valid.map((p) => [p.lat, p.lng] as [number, number]);
    const primary = theme.palette.primary.main;
    const accent = theme.palette.warning.main;

    if (latlngs.length >= 2) {
      L.polyline(latlngs, {
        color: lineColor,
        weight: 5,
        opacity: 0.92,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
    }

    const startHtml = `<div class="route-preview-marker route-preview-marker--terminal" style="--m:${primary}">S</div>`;
    const endHtml = `<div class="route-preview-marker route-preview-marker--terminal" style="--m:${primary}">E</div>`;
    const midHtml = (n: number) =>
      `<div class="route-preview-marker route-preview-marker--stop" style="--m:${accent}">${n}</div>`;

    const startIcon = L.divIcon({
      className: "route-preview-marker-wrap",
      html: startHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const endIcon = L.divIcon({
      className: "route-preview-marker-wrap",
      html: endHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const stopIcon = (seq: number) =>
      L.divIcon({
        className: "route-preview-marker-wrap",
        html: midHtml(seq),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

    latlngs.forEach((ll, i) => {
      const title = valid[i]?.title ?? `Stop ${i + 1}`;
      if (latlngs.length === 1) {
        L.marker(ll, { icon: startIcon }).addTo(map).bindPopup(`<strong>${title}</strong>`);
        return;
      }
      if (i === 0) {
        L.marker(ll, { icon: startIcon }).addTo(map).bindPopup(`<strong>Start</strong><br/>${title}`);
        return;
      }
      if (i === latlngs.length - 1) {
        L.marker(ll, { icon: endIcon }).addTo(map).bindPopup(`<strong>End</strong><br/>${title}`);
        return;
      }
      const seq = valid[i]?.sequence ?? i + 1;
      L.marker(ll, { icon: stopIcon(seq) })
        .addTo(map)
        .bindPopup(`<strong>Stop ${seq}</strong><br/>${title}`);
    });

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, ready, lineColor, theme.palette.primary.main, theme.palette.warning.main]);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <Box sx={{ position: "relative", width: "100%", height: h, borderRadius: 2, overflow: "hidden" }}>
      <Box
        ref={mapRef}
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: isDark ? "grey.900" : "grey.100",
          "& .leaflet-container": {
            fontFamily: theme.typography.fontFamily,
            background: isDark ? "#1a1a1a" : "#e8eef3",
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 8,
          bottom: 8,
          zIndex: 1000,
          px: 0.85,
          py: 0.65,
          maxWidth: 140,
          borderRadius: 1,
          bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(30,30,30,0.92)" : "rgba(255,255,255,0.95)"),
          border: 1,
          borderColor: "divider",
          boxShadow: 1,
          pointerEvents: "none",
        }}
      >
        <Typography sx={{ display: "block", fontWeight: 500, fontSize: "0.65rem", mb: 0.35, color: "text.primary" }}>
          Legend
        </Typography>
        <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: "0.6rem", fontWeight: 400 }}>
          <Box
            component="span"
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "primary.main",
              border: "2px solid",
              borderColor: "background.paper",
            }}
          />
          Start / end
        </Typography>
        <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: "0.6rem", fontWeight: 400 }}>
          <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "warning.main" }} />
          Stops
        </Typography>
        <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: "0.6rem", fontWeight: 400 }}>
          <Box component="span" sx={{ width: 16, height: 3, bgcolor: lineColor, borderRadius: 1 }} />
          Path (straight segments)
        </Typography>
      </Box>
      <style>
        {`
          .route-preview-marker-wrap { background: transparent !important; border: none !important; }
          .route-preview-marker {
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            font-size: 10px; font-weight: 500;
            color: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 2px solid rgba(255,255,255,0.95);
          }
          .route-preview-marker--terminal {
            width: 32px; height: 32px;
            background: var(--m, #00897b);
          }
          .route-preview-marker--stop {
            width: 24px; height: 24px;
            font-size: 10px;
            background: var(--m, #fb8c00);
          }
        `}
      </style>
    </Box>
  );
};

export default RouteStopsPreviewMap;
