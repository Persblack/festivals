import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatDateRange, getCountryFlag, getGenreColorHex, getSizeLabel } from "@/lib/utils";
import { useSelectedFestivals } from "@/hooks/useSelectedFestivals";
import { hasCoordinates } from "@/lib/guards";
import type { Festival, MappableFestival } from "@/types/festival";
import { Flame, MapPin } from "lucide-react";
import {
  getMapConfig,
  generateMarkerHTML,
  getMarkerIconOptions,
  generateControlCSS,
  tileLayers,
  type MapConfig,
} from "@/lib/map-config";

/**
 * Popup markup is assembled as a string and handed to Leaflet, which injects it
 * via innerHTML — React's escaping never sees it. Scraped festival names really
 * do contain `&`, `<` and `"`, so every interpolated value goes through here.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface FestivalMapProps {
  festivals: Festival[];
  onFestivalClick: (festival: Festival) => void;
}

export function FestivalMap({ festivals, onFestivalClick }: FestivalMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const soloMarkersRef = useRef<any[]>([]);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const { isSelected, toggleSelection } = useSelectedFestivals();

  // Only festivals with real coordinates can reach Leaflet. The guard narrows
  // to MappableFestival so the heat tuple, the neighbour scan and L.marker all
  // see plain numbers instead of `number | null`.
  const validFestivals = useMemo<MappableFestival[]>(
    () => festivals.filter(hasCoordinates),
    [festivals]
  );
  const hiddenCount = festivals.length - validFestivals.length;

  useEffect(() => {
    setIsClient(true);

    // Load saved map configuration
    setMapConfig(getMapConfig());

    // Dynamically import Leaflet, react-leaflet, and clustering on client side only
    // leaflet.markercluster requires global L, so import leaflet first, assign to window, then import plugin
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(async ([leaflet, reactLeaflet]) => {
      // Fix for default marker icons
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Expose L globally for plugins that expect it
      (window as any).L = leaflet.default;

      // Now safe to import markercluster plugin
      await import("leaflet.markercluster");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      setL(leaflet.default);
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
      });
    });
  }, []);

  // Inject control CSS based on saved config
  useEffect(() => {
    if (!mapConfig) return;

    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "festival-map-control-styles";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = generateControlCSS(mapConfig.controlOptions);

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [mapConfig]);

  // Handle heat map toggle
  useEffect(() => {
    if (!mapRef.current || !L) return;

    const map = mapRef.current;

    // Remove existing heat layer if any
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (showHeatMap) {
      (window as any).L = L;
      import("leaflet.heat").then(() => {
        const points: [number, number, number][] = validFestivals.map((f) => [
          f.latitude,
          f.longitude,
          0.8,
        ]);

        const heat = (L as any).heatLayer(points, {
          radius: 40,
          blur: 30,
          maxZoom: 10,
          gradient: {
            0.2: "#3B82F6",
            0.4: "#06B6D4",
            0.6: "#10B981",
            0.8: "#F59E0B",
            1.0: "#EF4444",
          },
        });

        heat.addTo(map);
        heatLayerRef.current = heat;
      });
    }
  }, [showHeatMap, L, validFestivals]);

  // Build popup HTML for a festival
  const buildPopupHTML = useCallback((festival: Festival) => {
    const selected = isSelected(festival.id);
    const id = escapeHtml(festival.id);
    const genres = festival.genres
      .map(
        (g) =>
          `<span style="background-color:${getGenreColorHex(g)}" class="px-2 py-0.5 text-xs rounded-full text-white inline-block">${escapeHtml(g)}</span>`
      )
      .join(" ");

    return `
      <div class="p-2 min-w-[200px] relative">
        <button data-toggle-select="${id}" class="absolute top-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${selected ? "bg-primary text-white" : "bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"}" title="${selected ? "Remove from planner" : "Add to planner"}">
          ${selected
            ? '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
            : '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>'
          }
        </button>
        <h3 class="font-bold text-lg text-grey-200 mb-2 pr-10">${escapeHtml(festival.name)}</h3>
        <div class="space-y-1.5 text-sm text-gray-300">
          <p>${getCountryFlag(festival.country_code)} ${escapeHtml(festival.city)}, ${escapeHtml(festival.country_name)}</p>
          <p>${formatDateRange(festival.start_date, festival.end_date)}</p>
          <p>${getSizeLabel(festival.size)}</p>
          <div class="flex flex-wrap gap-1 mt-2">${genres}</div>
        </div>
        <button data-view-details="${id}" class="mt-3 w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          View Details
        </button>
      </div>
    `;
  }, [isSelected]);

  // Manage clustered markers imperatively
  useEffect(() => {
    if (!mapReady || !mapRef.current || !L || !mapConfig) return;
    const map = mapRef.current;

    // Remove old cluster group and solo markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    soloMarkersRef.current.forEach((m) => map.removeLayer(m));
    soloMarkersRef.current = [];

    if (showHeatMap) return;

    // Pre-compute neighbor counts to implement minimum cluster size of 5
    // Markers with fewer than 4 neighbors within ~0.2 degrees (~20km) go directly on the map
    const MIN_NEIGHBORS = 4;
    const NEIGHBOR_RADIUS = 0.2;
    const denseIds = new Set<string>();

    validFestivals.forEach((f1) => {
      let count = 0;
      for (const f2 of validFestivals) {
        if (f1.id === f2.id) continue;
        const d = Math.hypot(f1.latitude - f2.latitude, f1.longitude - f2.longitude);
        if (d < NEIGHBOR_RADIUS) {
          count++;
          if (count >= MIN_NEIGHBORS) { denseIds.add(f1.id); break; }
        }
      }
    });

    // Also include all neighbors of dense markers so clusters are complete
    validFestivals.forEach((f1) => {
      if (!denseIds.has(f1.id)) return;
      for (const f2 of validFestivals) {
        if (f1.id === f2.id) continue;
        const d = Math.hypot(f1.latitude - f2.latitude, f1.longitude - f2.longitude);
        if (d < NEIGHBOR_RADIUS) denseIds.add(f2.id);
      }
    });

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const baseSize = mapConfig.markerOptions.size;
        const scale = count >= 50 ? 2.2 : count >= 10 ? 1.8 : 1.5;
        const dim = Math.round(baseSize * scale);
        const clusterOpts = { ...mapConfig.markerOptions, size: dim, innerDot: false };
        const markerHTML = generateMarkerHTML("#3B82F6", clusterOpts);
        const iconOpts = getMarkerIconOptions(clusterOpts);

        return L.divIcon({
          html: `<div style="position:relative">${markerHTML}<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${dim * 0.4}px;${mapConfig.markerOptions.shape === 'pin' ? 'transform:rotate(45deg)' : mapConfig.markerOptions.shape === 'diamond' ? 'transform:rotate(-45deg)' : ''}">${count}</span></div>`,
          className: "custom-cluster-marker",
          iconSize: L.point(iconOpts.iconSize[0], iconOpts.iconSize[1]),
          iconAnchor: L.point(iconOpts.iconAnchor[0], iconOpts.iconAnchor[1]),
        });
      },
    });

    const festivalMap = new Map<string, Festival>();
    validFestivals.forEach((festival) => {
      festivalMap.set(festival.id, festival);

      const icon = L.divIcon({
        className: "custom-marker",
        html: generateMarkerHTML(getGenreColorHex(festival.genres[0]), mapConfig.markerOptions),
        ...getMarkerIconOptions(mapConfig.markerOptions),
      });

      const marker = L.marker([festival.latitude, festival.longitude], { icon });
      marker.bindPopup(() => buildPopupHTML(festival), { maxWidth: 300 });

      if (denseIds.has(festival.id)) {
        clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map);
        soloMarkersRef.current.push(marker);
      }
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Handle popup button clicks via event delegation
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const viewBtn = target.closest("[data-view-details]") as HTMLElement | null;
      const selectBtn = target.closest("[data-toggle-select]") as HTMLElement | null;

      if (viewBtn) {
        const id = viewBtn.dataset.viewDetails!;
        const festival = festivalMap.get(id);
        if (festival) onFestivalClick(festival);
      } else if (selectBtn) {
        const id = selectBtn.dataset.toggleSelect!;
        toggleSelection(id);
        const festival = festivalMap.get(id);
        if (festival) {
          const popup = map._popup;
          if (popup) {
            setTimeout(() => popup.setContent(buildPopupHTML(festival)), 0);
          }
        }
      }
    };

    map.getContainer().addEventListener("click", handlePopupClick);

    return () => {
      map.getContainer().removeEventListener("click", handlePopupClick);
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      soloMarkersRef.current.forEach((m) => map.removeLayer(m));
      soloMarkersRef.current = [];
    };
  }, [mapReady, L, mapConfig, validFestivals, showHeatMap, buildPopupHTML, onFestivalClick, toggleSelection]);

  if (!isClient || !MapComponents || !L || !mapConfig) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card rounded-2xl">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-primary animate-pulse mb-3" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer } = MapComponents;

  const tileLayer = tileLayers[mapConfig.tileLayer];

  const center: [number, number] = [50.5, 10.5];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full rounded-2xl"
        style={{ minHeight: "500px" }}
        ref={(instance: any) => {
          mapRef.current = instance;
          if (instance && !mapReady) setMapReady(true);
        }}
      >
        <TileLayer
          attribution={tileLayer.attribution}
          url={tileLayer.url}
        />

      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          onClick={() => setShowHeatMap(!showHeatMap)}
          variant={showHeatMap ? "default" : "outline"}
          size="sm"
          className="bg-card/90 backdrop-blur-sm border-border"
        >
          {showHeatMap ? (
            <MapPin className="w-4 h-4 mr-2" />
          ) : (
            <Flame className="w-4 h-4 mr-2" />
          )}
          {showHeatMap ? "Show Markers" : "Heat Map"}
        </Button>

        {hiddenCount > 0 && (
          <p className="text-xs text-muted-foreground bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2 py-1 text-right">
            {hiddenCount} festival{hiddenCount === 1 ? "" : "s"} without coordinates{" "}
            {hiddenCount === 1 ? "isn't" : "aren't"} shown
          </p>
        )}
      </div>

      {/* Legend */}
      {!showHeatMap && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            Legend
          </h4>
          <div className="space-y-1.5">
            {["EDM", "Techno", "Rock", "Metal", "Else"].map((genre) => (
              <div key={genre} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getGenreColorHex(genre) }}
                />
                <span className="text-xs text-foreground">{genre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
