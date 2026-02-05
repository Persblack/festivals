import { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatDateRange, getCountryFlag, getGenreColorHex, getSizeLabel } from "@/lib/utils";
import type { Festival, Genre } from "@/types/festival";
import { Flame, MapPin } from "lucide-react";
import {
  getMapConfig,
  generateMarkerHTML,
  getMarkerIconOptions,
  generateControlCSS,
  tileLayers,
  type MapConfig,
} from "@/lib/map-config";

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
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Filter out festivals with null coordinates
  const validFestivals = useMemo(
    () => festivals.filter((f) => f.latitude != null && f.longitude != null),
    [festivals]
  );

  useEffect(() => {
    setIsClient(true);

    // Load saved map configuration
    setMapConfig(getMapConfig());

    // Dynamically import Leaflet and react-leaflet on client side only
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leaflet, reactLeaflet]) => {
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

      setL(leaflet.default);
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
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
      import("leaflet.heat").then(() => {
        const points = validFestivals.map(
          (f) =>
            [f.latitude, f.longitude, 0.8] as [
              number,
              number,
              number
            ]
        );

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

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  const createCustomIcon = (genre: Genre) => {
    const color = getGenreColorHex(genre);
    const iconOptions = getMarkerIconOptions(mapConfig.markerOptions);
    return L.divIcon({
      className: "custom-marker",
      html: generateMarkerHTML(color, mapConfig.markerOptions),
      ...iconOptions,
    });
  };

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
        ref={mapRef}
      >
        <TileLayer
          attribution={tileLayer.attribution}
          url={tileLayer.url}
        />

        {!showHeatMap &&
          validFestivals.map((festival) => (
            <Marker
              key={festival.id}
              position={[
                festival.latitude,
                festival.longitude,
              ]}
              icon={createCustomIcon(festival.genres[0])}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg text-grey-200 mb-2">
                    {festival.name}
                  </h3>
                  <div className="space-y-1.5 text-sm text-gray-300">
                    <p>
                      {getCountryFlag(festival.country_code)}{" "}
                      {festival.city}, {festival.country_name}
                    </p>
                    <p>
                      {formatDateRange(festival.start_date, festival.end_date)}
                    </p>
                    <p>{getSizeLabel(festival.size)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {festival.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: getGenreColorHex(genre) }}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onFestivalClick(festival)}
                    className="mt-3 w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
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
                  style={{ backgroundColor: getGenreColorHex(genre as Genre) }}
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
