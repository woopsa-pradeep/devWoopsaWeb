/**
 * Route map — no paid map SDKs and no API keys in this component.
 *
 * - Leaflet (open-source, loaded from unpkg CDN; same library, no Google/Mapbox SDK).
 * - Tiles: public raster endpoints only (CARTO, OSM, Esri, OpenTopoMap — keyless URLs; no paid map SDK).
 * - Route geometry: decoded locally (encoded polyline algorithm); no geocoding or routing calls from the browser here.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Box, FormControl, MenuItem, Select, useMediaQuery, useTheme } from '@mui/material';
import truckSvgUrl from '../../assets/Truck_new.svg';
import {
  stopStatusDisplayLabel,
  stopStatusMapMarkerBackgroundStyle,
} from '../../redux/apis/distrubutor/routeViewApis';
import { haversineKm } from '../../utils/polylineEncode';

export type MapLayerKey = 'map' | 'street' | 'satellite' | 'terrain';

// Declare Leaflet types for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

const KM_TO_MI = 0.621371;

/** Prefer API miles; otherwise convert km → mi. */
function formatMiles(miles: number | undefined, km: number | undefined): string {
  const mi =
    miles != null && Number.isFinite(miles) && miles >= 0
      ? miles
      : km != null && Number.isFinite(km)
        ? km * KM_TO_MI
        : NaN;
  if (!Number.isFinite(mi)) return '—';
  const decimals = mi > 0 && mi < 10 ? 2 : 1;
  return `${mi.toFixed(decimals)} mi`;
}

function escapeHtml(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Safe CSS color for inline styles (live marker / truck tint). */
function cssColorOrFallback(c: string | undefined, fallback: string): string {
  if (!c || typeof c !== 'string') return fallback;
  const t = c.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(t)) return t;
  if (/^rgba?\(\s*[\d.\s%,]+\s*\)$/.test(t)) return t;
  return fallback;
}

/**
 * Decode standard encoded polyline (same format many routing APIs use) without any external SDK.
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

function distMeters(a: [number, number], b: [number, number]): number {
  return haversineKm(a[0], a[1], b[0], b[1]) * 1000;
}

function closestPointOnSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number
): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-20) return [ax, ay];
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return [ax + t * dx, ay + t * dy];
}

/** Initial bearing from point A toward B, degrees clockwise from north (0–360). */
function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

/** Join decoded path chunks; drop duplicate junction vertex when present. */
function mergeRoutePathPoints(paths: [number, number][][]): [number, number][] {
  const EPS = 1e-5;
  const out: [number, number][] = [];
  for (const p of paths) {
    if (p.length === 0) continue;
    if (out.length === 0) {
      out.push(...p);
      continue;
    }
    const last = out[out.length - 1];
    const first = p[0];
    if (Math.abs(last[0] - first[0]) < EPS && Math.abs(last[1] - first[1]) < EPS) {
      for (let i = 1; i < p.length; i++) out.push(p[i]);
    } else {
      out.push(...p);
    }
  }
  return out;
}

/** Bearing along the route segment nearest to (lat, lng). Truck_new.svg faces “up” = north at 0°. */
function bearingOnRouteForPoint(path: [number, number][], lat: number, lng: number): number | null {
  if (path.length < 2) return null;
  let bestI = 0;
  let bestDist = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    const c = closestPointOnSegment(ax, ay, bx, by, lat, lng);
    const d = distMeters(c, [lat, lng]);
    if (d < bestDist) {
      bestDist = d;
      bestI = i;
    }
  }

  const [aLat, aLng] = path[bestI];
  const [bLat, bLng] = path[bestI + 1];
  return bearingDegrees(aLat, aLng, bLat, bLng);
}

export interface OptimizedStop {
  stopSequence: number;
  C_Number: number;
  orderNumbers: number;
  lat: number;
  lng: number;
  distanceKm: number;
  cumulativeDistanceKm: number;
  distanceMiles?: number;
  cumulativeDistanceMiles?: number;
  etaMinutes?: number;
  /** View routes: ISO timestamps from API */
  arrivedAt?: string | null;
  deliveredAt?: string | null;
  /** View routes: stop-level status string (e.g. not_delivered, in_progress) */
  stopStatus?: string;
  /** View routes: dwell time in minutes when both arrived and delivered exist */
  dwellMinutes?: number | null;
  /** View routes (master / multi-route): route id label for popup */
  routeLabel?: string;
  /** View routes: customer display name from API (`C_Name`) */
  customerName?: string;
  /** View routes: API stop id for map ↔ list linking */
  stopId?: number;
}

export interface RouteData {
  polyline: string;
  totalDistanceKm: number;
  lastStopToDestinationKm: number;
  totalDistanceMiles?: number;
  lastStopToDestinationMiles?: number;
  /** Optional fixed destination for end marker (e.g. group destination depot). */
  destinationLat?: number | null;
  destinationLng?: number | null;
}

/** Live position marker (truck); optional driver/vehicle fields for the popup. */
export interface LiveMapMarker {
  lat: number;
  lng: number;
  /** Fallback title when no structured fields */
  label?: string;
  /** Tints truck to match route polyline (defaults to `routeColor`). */
  color?: string;
  routeNumber?: string;
  driverName?: string;
  driverPhone?: string | null;
  vehicleDescription?: string;
  vehicleVin?: string;
}

interface RouteMapProps {
  route: RouteData;
  optimizedStops: OptimizedStop[];
  routeColor?: string;
  extraPolylines?: Array<{ polyline: string; color?: string }>;
  liveMarkers?: LiveMapMarker[];
  height?: string;
  width?: string;
  showInfoPanel?: boolean;
  /** View routes: miles-only popups, no ETA; show arrived/delivered/dwell */
  viewMode?: boolean;
  /** Fires after pan/zoom (Leaflet `moveend`). Use to tune live driver polling when zoomed in. */
  onViewportChange?: (state: { zoom: number }) => void;
  /**
   * Stable id for the route view (e.g. group id + master/child). When live GPS updates change the encoded
   * polyline split, this stays the same so pan/zoom are preserved instead of fitBounds zooming out.
   */
  mapViewIdentityKey?: string;
  /** When set, stop markers use hover tooltip + click callback (e.g. maximize stop drawer); otherwise click opens Leaflet popup. */
  onViewStopMarkerClick?: (stopId: number) => void;
  /** Highlights one stop marker (matches `OptimizedStop.stopId`). */
  highlightedStopId?: number | null;
}

function formatLocalDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(t));
}

function formatDwellMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function buildTruckPopupHtml(m: LiveMapMarker): string {
  const routeNum = m.routeNumber != null && String(m.routeNumber).trim() !== '' ? String(m.routeNumber).trim() : '';
  const driverName = m.driverName != null && String(m.driverName).trim() !== '' ? String(m.driverName).trim() : '';
  const phoneRaw = m.driverPhone;
  const phone =
    phoneRaw != null && String(phoneRaw).trim() !== '' ? String(phoneRaw).trim() : '';
  const vehDesc =
    m.vehicleDescription != null && String(m.vehicleDescription).trim() !== ''
      ? String(m.vehicleDescription).trim()
      : '';
  const vin =
    m.vehicleVin != null && String(m.vehicleVin).trim() !== '' ? String(m.vehicleVin).trim() : '';

  const hasDetail = Boolean(driverName || phone || vehDesc || vin);
  const title = routeNum
    ? `Route ${escapeHtml(routeNum)}`
    : m.label && m.label.trim()
      ? escapeHtml(m.label.trim())
      : 'Live location';

  if (!hasDetail) {
    return `<div class="route-map-popup-card"><div class="route-map-popup-title">${title}</div></div>`;
  }

  const rows: string[] = [];
  if (driverName) {
    rows.push(`<div class="route-map-popup-row"><span>Driver</span><strong>${escapeHtml(driverName)}</strong></div>`);
  }
  if (phone) {
    rows.push(`<div class="route-map-popup-row"><span>Phone</span><strong>${escapeHtml(phone)}</strong></div>`);
  }
  if (vehDesc) {
    rows.push(`<div class="route-map-popup-row"><span>Vehicle</span><strong>${escapeHtml(vehDesc)}</strong></div>`);
  }
  if (vin) {
    rows.push(`<div class="route-map-popup-row"><span>VIN</span><strong>${escapeHtml(vin)}</strong></div>`);
  }

  return `
    <div class="route-map-popup-card">
      <div class="route-map-popup-title">${title}</div>
      ${rows.join('')}
    </div>`;
}

/** Loaded once; reused when live truck positions update without remounting the map. */
let truckSvgTemplateCache: string | null = null;
async function loadTruckSvgTemplate(): Promise<string> {
  if (truckSvgTemplateCache !== null) return truckSvgTemplateCache;
  try {
    const res = await fetch(truckSvgUrl);
    if (res.ok) truckSvgTemplateCache = await res.text();
  } catch {
    /* ignore */
  }
  return truckSvgTemplateCache ?? '';
}

/** Stable empty arrays — avoids creating new `[]` on every render which would retrigger the Leaflet init useEffect. */
const EMPTY_EXTRA_POLYLINES: Array<{ polyline: string; color?: string }> = [];
const EMPTY_LIVE_MARKERS: LiveMapMarker[] = [];

const RouteMap: React.FC<RouteMapProps> = ({
  route,
  optimizedStops,
  routeColor = '#3388ff',
  extraPolylines = EMPTY_EXTRA_POLYLINES,
  liveMarkers = EMPTY_LIVE_MARKERS,
  height = '100%',
  width = '100%',
  showInfoPanel = true,
  viewMode = false,
  mapViewIdentityKey,
  onViewportChange,
  onViewStopMarkerClick,
  highlightedStopId = null,
}) => {
  const theme = useTheme();
  const isCompactLayerUi = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const [uiLayerKey, setUiLayerKey] = useState<MapLayerKey>('map');
  const [mapReady, setMapReady] = useState(false);
  /** Bumped after each successful Leaflet build so truck markers re-sync even if `mapReady` stays true (React no-op). */
  const [mapInitVersion, setMapInitVersion] = useState(0);
  const layerApplyRef = useRef<((key: MapLayerKey) => void) | null>(null);
  /** Keeps latest layer choice for re-init after refresh (deps change) without resetting UI. */
  const uiLayerKeyRef = useRef<MapLayerKey>(uiLayerKey);
  uiLayerKeyRef.current = uiLayerKey;
  /** Last camera + map identity — restore when the same logical view reloads. */
  const mapViewStateRef = useRef<{
    center: { lat: number; lng: number };
    zoom: number;
    identityKey: string;
  } | null>(null);
  const layerDockSyncRef = useRef<((key: MapLayerKey) => void) | null>(null);
  /** Route geometry for truck bearing; updated when the map is (re)built for this polyline. */
  const mergedRoutePathRef = useRef<[number, number][]>([]);
  const truckLayerGroupRef = useRef<any>(null);
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const onViewStopMarkerClickRef = useRef(onViewStopMarkerClick);
  onViewStopMarkerClickRef.current = onViewStopMarkerClick;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);

  const minutesToHourText = (minutes: number | undefined): string => {
    if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h <= 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    let isDisposed = false;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCSS.crossOrigin = '';
      document.head.appendChild(leafletCSS);
    }

    // Load Leaflet JS
    const loadLeafletScript = () => {
      return new Promise<void>((resolve) => {
        if (window.L) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Initialize map after scripts are loaded
    const initializeMap = async () => {
      if (!mapRef.current || scriptsLoadedRef.current) return;

      await Promise.all([loadLeafletScript()]);
      if (isDisposed || !mapRef.current) return;

      if (!window.L) {
        console.error('Failed to load Leaflet');
        return;
      }

      scriptsLoadedRef.current = true;

      try {
        const baseDecoded = decodePolyline(route.polyline);
        const basePath = baseDecoded.map(([lat, lng]: [number, number]) => [lat, lng] as [number, number]);
        const extraPaths = extraPolylines
          .map((x) => {
            const d = decodePolyline(x.polyline);
            const p = d.map(([lat, lng]: [number, number]) => [lat, lng] as [number, number]);
            return { path: p, color: x.color ?? '#3388ff' };
          })
          .filter((x) => x.path.length > 0);

        const allPaths = [basePath, ...extraPaths.map((x) => x.path)].filter((p) => p.length > 0);
        if (allPaths.length === 0) {
          console.error('No path points decoded from polyline');
          return;
        }

        const mergedRoutePath = mergeRoutePathPoints(allPaths as [number, number][][]);
        mergedRoutePathRef.current = mergedRoutePath;

        const start = allPaths[0][0];
        const fallbackEnd = allPaths[allPaths.length - 1][allPaths[allPaths.length - 1].length - 1];
        const hasFixedDestination =
          Number.isFinite(route.destinationLat) && Number.isFinite(route.destinationLng);
        const end: [number, number] = hasFixedDestination
          ? [Number(route.destinationLat), Number(route.destinationLng)]
          : fallbackEnd;
        const nearSame =
          Math.abs(start[0] - end[0]) < 1e-5 && Math.abs(start[1] - end[1]) < 1e-5;
        const endMarkerPos: [number, number] = nearSame ? [end[0] + 0.00025, end[1] + 0.00025] : end;

        // Create map — zoom control added manually bottom-right (not default top-left).
        const map = window.L.map(mapRef.current, {
          attributionControl: false,
          zoomControl: false,
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
        }).setView(start, 12);

        window.L.control.zoom({ position: 'bottomright' }).addTo(map);

        const truckLayerGroup = window.L.layerGroup().addTo(map);
        truckLayerGroupRef.current = truckLayerGroup;

        map.on('moveend', () => {
          try {
            const c = map.getCenter();
            const z = map.getZoom();
            mapViewStateRef.current = {
              center: { lat: c.lat, lng: c.lng },
              zoom: z,
              identityKey: mapViewIdentityKey ?? route.polyline,
            };
            onViewportChangeRef.current?.({ zoom: z });
          } catch {
            /* ignore */
          }
        });

        // Public tile URLs only — no `key=` or token parameters.
        const normalLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '',
        });
        const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '',
        });
        const satelliteLayer = window.L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: '',
          }
        );
        const satelliteLabelsLayer = window.L.tileLayer(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            pane: 'overlayPane',
            attribution: '',
          }
        );
        const satelliteGroup = window.L.layerGroup([satelliteLayer, satelliteLabelsLayer]);
        const terrainLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          subdomains: 'abc',
          maxZoom: 17,
          attribution: '',
        });
        normalLayer.addTo(map);

        const layerByKey: Record<MapLayerKey, any> = {
          map: normalLayer,
          street: streetLayer,
          satellite: satelliteGroup,
          terrain: terrainLayer,
        };

        let activeKey: MapLayerKey = 'map';
        let activeLayer: any = normalLayer;

        const setSatelliteChrome = (isSat: boolean) => {
          map.getContainer().classList.toggle('route-map-satellite', isSat);
        };
        setSatelliteChrome(false);

        const switchBaseLayer = (key: MapLayerKey) => {
          if (key === activeKey) return;
          map.removeLayer(activeLayer);
          activeLayer = layerByKey[key];
          activeLayer.addTo(map);
          activeKey = key;
          setSatelliteChrome(key === 'satellite');
        };

        const applyLayer = (key: MapLayerKey) => {
          switchBaseLayer(key);
          setUiLayerKey(key);
        };
        layerApplyRef.current = applyLayer;

        /** Custom stroke SVGs — neutral tile, no loud fills (icons use stroke only). */
        const layerIconSvg = {
          map: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>',
          street:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M6 5l3 14M15 5l3 14M8 9h8M7 14h10"/></svg>',
          satellite:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M4 12h16M12 4c4 4 4 12 0 16M12 4c-4 4-4 12 0 16"/></svg>',
          terrain:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M4 18h16l-4-9-3 5-3-4-3 8-3-8z"/></svg>',
        } as const;

        const layerDefs: Array<{ key: MapLayerKey; label: string; icon: string }> = [
          { key: 'map', label: 'Map', icon: layerIconSvg.map },
          { key: 'street', label: 'Street', icon: layerIconSvg.street },
          { key: 'satellite', label: 'Satellite', icon: layerIconSvg.satellite },
          { key: 'terrain', label: 'Terrain', icon: layerIconSvg.terrain },
        ];

        const setLayerPreviewContent = (previewEl: HTMLDivElement, d: (typeof layerDefs)[0]) => {
          previewEl.style.background = '';
          previewEl.style.border = '';
          previewEl.innerHTML = `<span class="route-map-layer-preview-icon">${d.icon}</span>`;
        };

        const LayerDock = window.L.Control.extend({
          onAdd: () => {
            const root = window.L.DomUtil.create('div', 'route-map-layer-dock leaflet-bar');
            window.L.DomEvent.disableClickPropagation(root);
            window.L.DomEvent.disableScrollPropagation(root);

            const hoverTarget = window.L.DomUtil.create('div', 'route-map-layer-hover-target', root);

            const panel = window.L.DomUtil.create('div', 'route-map-layer-panel', hoverTarget);
            const optEls = new Map<MapLayerKey, HTMLButtonElement>();

            const pinned = window.L.DomUtil.create('button', 'route-map-layer-pinned', hoverTarget) as HTMLButtonElement;
            pinned.type = 'button';
            pinned.title = 'Map type';
            const pinnedPreview = window.L.DomUtil.create('div', 'route-map-layer-thumb-preview', pinned);
            const pinnedLabel = window.L.DomUtil.create('span', 'route-map-layer-pinned-label', pinned);
            const def0 = layerDefs.find((x) => x.key === activeKey) ?? layerDefs[0];
            setLayerPreviewContent(pinnedPreview as HTMLDivElement, def0);
            pinnedLabel.textContent = def0.label;

            const syncActiveUi = (key: MapLayerKey) => {
              const d = layerDefs.find((x) => x.key === key) ?? layerDefs[0];
              setLayerPreviewContent(pinnedPreview as HTMLDivElement, d);
              pinnedLabel.textContent = d.label;
              optEls.forEach((btn, k) => {
                btn.classList.toggle('route-map-layer-opt--active', k === key);
              });
            };

            layerDefs.forEach((d) => {
              const btn = window.L.DomUtil.create('button', 'route-map-layer-opt', panel) as HTMLButtonElement;
              btn.type = 'button';
              btn.title = d.label;
              if (d.key === activeKey) btn.classList.add('route-map-layer-opt--active');
              const preview = window.L.DomUtil.create('div', 'route-map-layer-thumb-preview', btn);
              setLayerPreviewContent(preview as HTMLDivElement, d);
              const cap = window.L.DomUtil.create('span', 'route-map-layer-opt-label', btn);
              cap.textContent = d.label;
              optEls.set(d.key, btn);
                window.L.DomEvent.on(btn, 'click', (ev: Event) => {
                window.L.DomEvent.stopPropagation(ev);
                applyLayer(d.key);
                syncActiveUi(d.key);
                root.classList.remove('route-map-layer-dock--open');
              });
            });

            window.L.DomEvent.on(pinned, 'click', (ev: Event) => {
              window.L.DomEvent.stopPropagation(ev);
              root.classList.toggle('route-map-layer-dock--open');
            });

            layerDockSyncRef.current = syncActiveUi;
            return root;
          },
        });
        new LayerDock({ position: 'bottomleft' }).addTo(map);
        
        allPaths.forEach((path, i) => {
          const color = i === 0 ? routeColor : (extraPaths[i - 1]?.color ?? routeColor);
          const w = viewMode ? 6 : i === 0 ? 6 : 4;
          const op = viewMode ? 0.92 : i === 0 ? 0.9 : 0.75;
          window.L.polyline(path, {
            color,
            weight: w,
            opacity: op,
            smoothFactor: 1.2,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        });

        // Start marker
        const startIcon = window.L.divIcon({
          className: 'route-map-marker-wrap',
          html: '<div class="route-map-marker route-map-marker-start">S</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        window.L.marker(start, { icon: startIcon })
          .addTo(map)
          .bindPopup('<strong>Start</strong><br>Route begins here');

        // End marker
        const endIcon = window.L.divIcon({
          className: 'route-map-marker-wrap',
          html: '<div class="route-map-marker route-map-marker-end">E</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        window.L.marker(endMarkerPos, { icon: endIcon, zIndexOffset: 400 })
          .addTo(map)
          .bindPopup(
            nearSame
              ? '<strong>End</strong><br>Return / depot (same as start location)'
              : '<strong>End</strong><br>Route ends here'
          );

        // Add stop markers
        const useViewStopHoverClick = Boolean(onViewStopMarkerClickRef.current);
        optimizedStops.forEach((stop) => {
          const latN = Number(stop.lat);
          const lngN = Number(stop.lng);
          if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return;

          const stopBg = stopStatusMapMarkerBackgroundStyle(stop.stopStatus, stop.deliveredAt ?? null);
          const isHi =
            highlightedStopId != null && stop.stopId != null && Number(stop.stopId) === highlightedStopId;
          const hiClass = isHi ? ' route-map-marker-stop--highlight' : '';

          const stopIcon = window.L.divIcon({
            className: 'route-map-marker-wrap',
            html: `<div class="route-map-marker route-map-marker-stop${hiClass}" style="${stopBg}">${stop.stopSequence}</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });

          const legMi = formatMiles(stop.distanceMiles, stop.distanceKm);
          const cumMi = formatMiles(stop.cumulativeDistanceMiles, stop.cumulativeDistanceKm);
          const etaText = minutesToHourText(stop.etaMinutes);
          const statusLabel = stopStatusDisplayLabel(stop.stopStatus);
          const routeRow =
            viewMode && stop.routeLabel != null && stop.routeLabel !== ''
              ? `<div class="route-map-popup-row"><span>Route</span><strong>${escapeHtml(stop.routeLabel)}</strong></div>`
              : '';
          const customerNameRaw =
            stop.customerName != null && String(stop.customerName).trim() !== ''
              ? String(stop.customerName).trim()
              : '';
          const nameRow = customerNameRaw
            ? `<div class="route-map-popup-row"><span>Name</span><strong>${escapeHtml(customerNameRaw)}</strong></div>`
            : '';
          const popupHtml = viewMode
            ? `
            <div class="route-map-popup-card">
              <div class="route-map-popup-title">Stop ${escapeHtml(stop.stopSequence)}</div>
              ${nameRow}
              ${routeRow}
              <div class="route-map-popup-row"><span>Customer #</span><strong>${escapeHtml(stop.C_Number)}</strong></div>
              <div class="route-map-popup-row"><span>Order</span><strong>#${escapeHtml(stop.orderNumbers)}</strong></div>
              <div class="route-map-popup-row"><span>Status</span><strong>${escapeHtml(statusLabel)}</strong></div>
              <div class="route-map-popup-row"><span>Leg distance</span><strong>${escapeHtml(legMi)}</strong></div>
              <div class="route-map-popup-row"><span>Total distance</span><strong>${escapeHtml(cumMi)}</strong></div>
              <div class="route-map-popup-row"><span>Delivered</span><strong>${escapeHtml(formatLocalDateTime(stop.deliveredAt))}</strong></div>
              <div class="route-map-popup-row"><span>Stop time</span><strong>${escapeHtml(formatDwellMinutes(stop.dwellMinutes))}</strong></div>
            </div>`
            : `
            <div class="route-map-popup-card">
              <div class="route-map-popup-title">Stop ${escapeHtml(stop.stopSequence)}</div>
              ${nameRow}
              <div class="route-map-popup-row"><span>Customer #</span><strong>${escapeHtml(stop.C_Number)}</strong></div>
              <div class="route-map-popup-row"><span>Order</span><strong>#${escapeHtml(stop.orderNumbers)}</strong></div>
              <div class="route-map-popup-row"><span>Leg distance</span><strong>${escapeHtml(legMi)}</strong></div>
              <div class="route-map-popup-row"><span>Total distance</span><strong>${escapeHtml(cumMi)}</strong></div>
              <div class="route-map-popup-row"><span>ETA</span><strong>${escapeHtml(etaText)}</strong></div>
            </div>`;

          const m = window.L.marker([latN, lngN], {
            icon: stopIcon,
            zIndexOffset: 600 + (Number.isFinite(stop.stopSequence) ? stop.stopSequence : 0),
          }).addTo(map);

          if (useViewStopHoverClick && stop.stopId != null) {
            m.bindTooltip(popupHtml, {
              sticky: true,
              direction: 'top',
              opacity: 1,
              className: 'route-map-stop-tooltip',
              interactive: true,
            });
            m.on('click', () => {
              const id = stop.stopId;
              if (id != null) onViewStopMarkerClickRef.current?.(id);
            });
          } else {
            m.bindPopup(popupHtml);
          }
        });

        // Live truck markers are applied in a separate effect so GPS polling does not remount the map.

        // Fit bounds to show entire route, or restore pan/zoom after data refresh (same polyline).
        const allPoints = allPaths.flat();
        const bounds = window.L.latLngBounds(allPoints);
        const preserved = mapViewStateRef.current;
        const currentIdentityKey = mapViewIdentityKey ?? route.polyline;
        const preserveView =
          preserved != null &&
          preserved.identityKey === currentIdentityKey &&
          Number.isFinite(preserved.zoom) &&
          Number.isFinite(preserved.center.lat) &&
          Number.isFinite(preserved.center.lng);
        if (preserveView) {
          map.setView([preserved.center.lat, preserved.center.lng], preserved.zoom, { animate: false });
        } else {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
        try {
          onViewportChangeRef.current?.({ zoom: map.getZoom() });
        } catch {
          /* ignore */
        }

        const layerKeyRestore = uiLayerKeyRef.current;
        layerApplyRef.current?.(layerKeyRestore);
        layerDockSyncRef.current?.(layerKeyRestore);

        mapInstanceRef.current = map;
        setMapReady(true);
        setMapInitVersion((v) => v + 1);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isDisposed = true;
      setMapReady(false);
      layerApplyRef.current = null;
      layerDockSyncRef.current = null;
      if (mapInstanceRef.current) {
        try {
          const m = mapInstanceRef.current;
          const c = m.getCenter();
          mapViewStateRef.current = {
            center: { lat: c.lat, lng: c.lng },
            zoom: m.getZoom(),
            identityKey: mapViewIdentityKey ?? route.polyline,
          };
        } catch {
          /* ignore */
        }
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      truckLayerGroupRef.current = null;
      mergedRoutePathRef.current = [];
      scriptsLoadedRef.current = false;
    };
  }, [
    route.polyline,
    optimizedStops,
    extraPolylines,
    routeColor,
    viewMode,
    mapViewIdentityKey,
    highlightedStopId,
    typeof onViewStopMarkerClick === 'function',
  ]);

  /** Update truck markers when live GPS changes — does not tear down the map (preserves zoom/pan). */
  useEffect(() => {
    if (!mapReady) return;
    const group = truckLayerGroupRef.current;
    const path = mergedRoutePathRef.current;
    if (!group || !window.L || path.length < 1) return;

    let cancelled = false;
    void (async () => {
      const truckSvgTemplate = await loadTruckSvgTemplate();
      if (cancelled || !truckLayerGroupRef.current) return;
      const groupNow = truckLayerGroupRef.current;
      groupNow.clearLayers();

      const truckImgSrcForTint = (tint: string) => {
        if (!truckSvgTemplate) return truckSvgUrl;
        const patched = truckSvgTemplate.replace(
          /(\.cls-1\s*\{[\s\S]*?fill:\s*)([^;]+)(;)/,
          `$1${tint}$3`
        );
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(patched)}`;
      };

      const truckMarkerW = 24;
      const truckMarkerH = Math.round((truckMarkerW * 160.71) / 77.39);
      const livePoints: Array<[number, number]> = [];
      liveMarkers.forEach((m) => {
        const latN = Number(m.lat);
        const lngN = Number(m.lng);
        if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return;
        livePoints.push([latN, lngN]);
        const brng = bearingOnRouteForPoint(path, latN, lngN);
        const truckTint = cssColorOrFallback(m.color, routeColor);
        const innerStyle = [
          'width:100%',
          'height:100%',
          'transform-origin:50% 100%',
          'display:flex',
          'align-items:flex-end',
          'justify-content:center',
          brng != null ? `transform:rotate(${brng}deg)` : '',
        ]
          .filter(Boolean)
          .join(';');
        const truckMarkup =
          `<div style="width:${truckMarkerW}px;height:${truckMarkerH}px;display:flex;align-items:flex-end;justify-content:center">` +
          `<div style="${innerStyle}">` +
          `<img src="${truckImgSrcForTint(truckTint)}" width="${truckMarkerW}" height="${truckMarkerH}" alt="" draggable="false" style="display:block;width:100%;height:100%;object-fit:contain" />` +
          `</div></div>`;
        const truckIcon = window.L.divIcon({
          className: 'route-map-marker-wrap',
          html: truckMarkup,
          iconSize: [truckMarkerW, truckMarkerH],
          iconAnchor: [truckMarkerW / 2, truckMarkerH],
        });
        window.L.marker([latN, lngN], { icon: truckIcon, zIndexOffset: 1000 })
          .addTo(groupNow)
          .bindPopup(buildTruckPopupHtml(m));
      });

      // Single-route view: keep camera following the truck while preserving user zoom.
      if (livePoints.length === 1) {
        const map = mapInstanceRef.current;
        if (map) {
          const [lat, lng] = livePoints[0];
          const z = map.getZoom();
          map.setView([lat, lng], z, { animate: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, mapInitVersion, liveMarkers, routeColor, route.polyline]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const el = mapRef.current;
    if (!map || !el) return;
    const ro = new ResizeObserver(() => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore */
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapReady]);

  const totalRouteMi = formatMiles(route.totalDistanceMiles, route.totalDistanceKm);
  const lastLegMi = formatMiles(route.lastStopToDestinationMiles, route.lastStopToDestinationKm);

  return (
    <Box sx={{ position: 'relative', width, height }}>
      <div ref={mapRef} className="route-map-root" style={{ width: '100%', height: '100%' }} />
      {isCompactLayerUi && (
        <FormControl
          size="small"
          disabled={!mapReady}
          sx={{
            position: 'absolute',
            left: 8,
            bottom: 10,
            zIndex: 1200,
            minWidth: 118,
            maxWidth: 'min(42%, 200px)',
            bgcolor: 'rgba(255,255,255,0.98)',
            borderRadius: 1,
            boxShadow: '0 1px 4px rgba(60,64,67,0.25)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.12)' },
          }}
        >
          <Select<MapLayerKey>
            value={uiLayerKey}
            onChange={(e) => layerApplyRef.current?.(e.target.value as MapLayerKey)}
            displayEmpty
            inputProps={{ 'aria-label': 'Map type' }}
            sx={{
              fontSize: 12,
              fontWeight: 600,
              height: 34,
              '& .MuiSelect-select': { py: 0.65, pr: 3, display: 'flex', alignItems: 'center' },
            }}
          >
            <MenuItem value="map">Map</MenuItem>
            <MenuItem value="street">Street</MenuItem>
            <MenuItem value="satellite">Satellite</MenuItem>
            <MenuItem value="terrain">Terrain</MenuItem>
          </Select>
        </FormControl>
      )}
      <style>
        {`
          /* Match RouteOptimization: chips top/left 10/8, fullscreen top/right 10 — Leaflet applies margins on .leaflet-control */
          .route-map-root .leaflet-bottom.leaflet-right .leaflet-control {
            margin-bottom: 10px !important;
            margin-right: 10px !important;
          }
          .route-map-root .leaflet-bottom.leaflet-left .leaflet-control {
            margin-bottom: 10px !important;
            margin-left: 8px !important;
          }
          .route-map-root .leaflet-control-zoom {
            border: 0 !important;
            box-shadow: 0 8px 18px rgba(18, 38, 63, 0.18);
            border-radius: 12px !important;
            overflow: hidden;
          }
          .route-map-root .leaflet-control-zoom a {
            width: 36px;
            height: 36px;
            line-height: 36px;
            color: #1f4e79;
            font-weight: 700;
            background: rgba(255,255,255,0.96);
          }
          .route-map-layer-dock {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          @media (max-width: 899.95px) {
            .route-map-root .route-map-layer-dock.leaflet-control {
              display: none !important;
            }
          }
          .route-map-layer-hover-target {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            max-width: min(100%, 220px);
          }
          .route-map-layer-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            width: 100%;
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            padding: 0;
            margin: 0;
            pointer-events: none;
            transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.2s ease;
          }
          .route-map-layer-dock:hover .route-map-layer-panel,
          .route-map-layer-dock.route-map-layer-dock--open .route-map-layer-panel {
            max-height: 280px;
            opacity: 1;
            padding: 10px;
            pointer-events: auto;
            background: rgba(255,255,255,0.97);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
            border: 1px solid rgba(148, 163, 184, 0.35);
          }
          @media (max-width: 480px) {
            .route-map-layer-panel {
              grid-template-columns: 1fr;
            }
            .route-map-layer-hover-target {
              max-width: min(100%, 160px);
            }
          }
          .route-map-layer-opt {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            margin: 0;
            padding: 6px 4px 8px;
            border: none;
            border-radius: 10px;
            background: transparent;
            cursor: pointer;
            color: #475569;
            min-width: 0;
          }
          .route-map-layer-opt:hover {
            background: rgba(241, 245, 249, 0.9);
          }
          .route-map-layer-opt--active {
            outline: 2px solid #2563eb;
            outline-offset: 0;
            background: rgba(239, 246, 255, 0.95);
          }
          .route-map-layer-pinned {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            width: 100%;
            max-width: 52px;
            align-self: flex-start;
            padding: 6px 4px 8px;
            border: none;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 2px 12px rgba(15, 23, 42, 0.12);
            border: 1px solid rgba(148, 163, 184, 0.4);
            cursor: pointer;
            color: #475569;
          }
          .route-map-layer-pinned .route-map-layer-thumb-preview {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
          }
          .route-map-layer-pinned-label {
            font-size: 9px;
            font-weight: 700;
            color: #334155;
            letter-spacing: 0.02em;
            text-align: center;
            line-height: 1.1;
            max-width: 48px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .route-map-layer-thumb-preview {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            box-sizing: border-box;
          }
          .route-map-layer-preview-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 0;
            color: #475569;
          }
          .route-map-layer-preview-icon svg {
            width: 20px;
            height: 20px;
            display: block;
          }
          .route-map-layer-opt-label {
            font-size: 9px;
            font-weight: 600;
            color: #64748b;
            text-align: center;
            line-height: 1.1;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .route-map-root.route-map-satellite .route-map-layer-pinned,
          .route-map-root.route-map-satellite .route-map-layer-panel {
            background: rgba(30, 41, 59, 0.96) !important;
            border-color: rgba(71, 85, 105, 0.6) !important;
          }
          .route-map-root.route-map-satellite .route-map-layer-pinned-label,
          .route-map-root.route-map-satellite .route-map-layer-opt-label {
            color: #e2e8f0;
          }
          .route-map-root.route-map-satellite .route-map-layer-preview-icon,
          .route-map-root.route-map-satellite .route-map-layer-opt {
            color: #cbd5e1;
          }
          .route-map-root.route-map-satellite .route-map-layer-opt:hover {
            background: rgba(51, 65, 85, 0.55);
          }
          /* Active/hover use light bg in default mode; in satellite that hides light text — use dark surfaces + white glyphs */
          .route-map-root.route-map-satellite .route-map-layer-opt.route-map-layer-opt--active {
            background: rgba(51, 65, 85, 0.72);
            outline: 2px solid #60a5fa;
            outline-offset: 0;
          }
          .route-map-root.route-map-satellite .route-map-layer-opt.route-map-layer-opt--active:hover {
            background: rgba(71, 85, 105, 0.85);
          }
          .route-map-root.route-map-satellite .route-map-layer-opt.route-map-layer-opt--active .route-map-layer-opt-label,
          .route-map-root.route-map-satellite .route-map-layer-opt.route-map-layer-opt--active .route-map-layer-preview-icon {
            color: #f8fafc;
          }
          .route-map-root.route-map-satellite .route-map-layer-opt:hover .route-map-layer-opt-label,
          .route-map-root.route-map-satellite .route-map-layer-opt:hover .route-map-layer-preview-icon {
            color: #f8fafc;
          }
          .route-map-root .leaflet-popup-content-wrapper {
            border-radius: 14px;
            box-shadow: 0 14px 30px rgba(18, 38, 63, 0.22);
            padding: 0;
          }
          .route-map-root .leaflet-popup-content {
            margin: 0;
            min-width: 220px;
          }
          .route-map-root .leaflet-popup-tip {
            box-shadow: 0 8px 18px rgba(18, 38, 63, 0.16);
          }
          .route-map-popup-card {
            padding: 12px 14px;
            background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
            color: #1f2d3d;
            font-size: 12px;
          }
          .route-map-popup-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #17496f;
          }
          .route-map-popup-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin: 4px 0;
          }
          .route-map-popup-row span {
            color: #5b6b7a;
          }
          .route-map-popup-row strong {
            color: #1f2d3d;
            font-weight: 700;
          }
          .route-map-marker-wrap {
            background: transparent;
            border: 0;
          }
          .route-map-marker {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            border: 3px solid rgba(255,255,255,0.95);
            box-shadow: 0 10px 18px rgba(17, 35, 53, 0.28);
          }
          .route-map-marker-start {
            background: linear-gradient(145deg, #45be73, #1f9e54);
          }
          .route-map-marker-end {
            background: linear-gradient(145deg, #ff6f77, #e1454d);
          }
          .route-map-marker-stop {
            width: 38px;
            height: 38px;
          }
          .route-map-marker-stop--highlight {
            outline: 3px solid #facc15;
            outline-offset: 2px;
            box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.45);
          }
          .route-map-root .leaflet-tooltip.route-map-stop-tooltip {
            border-radius: 14px;
            border: none;
            box-shadow: 0 14px 30px rgba(18, 38, 63, 0.22);
            padding: 0;
            background: transparent;
          }
          .route-map-root .leaflet-tooltip.route-map-stop-tooltip::before {
            display: none;
          }
        `}
      </style>
      {showInfoPanel && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'white',
            padding: 2,
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxWidth: 300,
            fontSize: '12px',
          }}
        >
          <Box component="h3" sx={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
            Route summary
          </Box>
          <Box sx={{ margin: '5px 0', color: '#666' }}>
            <strong>Total distance:</strong> {totalRouteMi}
          </Box>
          <Box sx={{ margin: '5px 0', color: '#666' }}>
            <strong>Last stop to destination:</strong> {lastLegMi}
          </Box>
          <Box sx={{ marginTop: '10px' }}>
            <Box component="h4" sx={{ margin: '10px 0 5px 0', fontSize: '13px' }}>
              Stops
            </Box>
            {optimizedStops.map((stop) => (
              <Box
                key={stop.stopSequence}
                sx={{
                  padding: '5px',
                  margin: '5px 0',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  borderLeft: '3px solid #3388ff',
                }}
              >
                <Box component="strong">Stop {stop.stopSequence}</Box>
                <br />
                Customer #{stop.C_Number} · Order #{stop.orderNumbers}
                <br />
                Leg {formatMiles(stop.distanceMiles, stop.distanceKm)} · Cumulative{' '}
                {formatMiles(stop.cumulativeDistanceMiles, stop.cumulativeDistanceKm)}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RouteMap;
