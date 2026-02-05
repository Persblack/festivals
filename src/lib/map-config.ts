// Shared map configuration for Festival Atlas
// Provides consistent marker and control styling across all maps

// ============================================================================
// Type Definitions
// ============================================================================

export type MarkerShape = "pin" | "circle" | "square" | "diamond";
export type ControlTheme = "default" | "dark" | "glass" | "minimal";

export interface MarkerOptions {
  size: number;
  borderWidth: number;
  borderColor: string;
  shape: MarkerShape;
  shadow: boolean;
  innerDot: boolean;
  innerDotSize: number;
  pulseAnimation: boolean;
  bounceOnHover: boolean;
}

export interface ControlStyleOptions {
  theme: ControlTheme;
  borderRadius: number;
  opacity: number;
  blur: boolean;
}

export interface MapConfig {
  markerOptions: MarkerOptions;
  controlOptions: ControlStyleOptions;
  tileLayer: TileLayerKey;
}

// ============================================================================
// Tile Layers
// ============================================================================

export const tileLayers = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  cartoLight: {
    name: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  cartoDark: {
    name: "Carto Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  cartoVoyager: {
    name: "Carto Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  watercolor: {
    name: "Watercolor",
    url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  toner: {
    name: "Toner (S/W)",
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  tonerLite: {
    name: "Toner Lite",
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  terrain: {
    name: "Terrain",
    url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  openTopo: {
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  esriWorldImagery: {
    name: "Satellit (ESRI)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
  esriWorldGray: {
    name: "ESRI Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
} as const;

export type TileLayerKey = keyof typeof tileLayers;

// ============================================================================
// Default Options
// ============================================================================

export const defaultMarkerOptions: MarkerOptions = {
  size: 32,
  borderWidth: 3,
  borderColor: "#ffffff",
  shape: "pin",
  shadow: true,
  innerDot: true,
  innerDotSize: 10,
  pulseAnimation: false,
  bounceOnHover: true,
};

export const defaultControlOptions: ControlStyleOptions = {
  theme: "dark",
  borderRadius: 12,
  opacity: 90,
  blur: true,
};

export const defaultTileLayer: TileLayerKey = "cartoDark";

export const defaultMapConfig: MapConfig = {
  markerOptions: defaultMarkerOptions,
  controlOptions: defaultControlOptions,
  tileLayer: defaultTileLayer,
};

// ============================================================================
// LocalStorage Functions
// ============================================================================

const STORAGE_KEY = "festival-atlas-map-config";

export function getMapConfig(): MapConfig {
  if (typeof window === "undefined") {
    return defaultMapConfig;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultMapConfig;
    }

    const parsed = JSON.parse(stored);

    // Validate and merge with defaults to handle missing properties
    return {
      markerOptions: { ...defaultMarkerOptions, ...parsed.markerOptions },
      controlOptions: { ...defaultControlOptions, ...parsed.controlOptions },
      tileLayer: parsed.tileLayer && tileLayers[parsed.tileLayer as TileLayerKey]
        ? parsed.tileLayer
        : defaultTileLayer,
    };
  } catch {
    return defaultMapConfig;
  }
}

export function saveMapConfig(config: MapConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save map config:", error);
  }
}

export function clearMapConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear map config:", error);
  }
}

// ============================================================================
// Marker HTML Generation
// ============================================================================

export function generateMarkerHTML(color: string, options: MarkerOptions): string {
  const {
    size,
    borderWidth,
    borderColor,
    shape,
    shadow,
    innerDot,
    innerDotSize,
    pulseAnimation,
    bounceOnHover,
  } = options;

  const shadowStyle = shadow ? "box-shadow: 0 4px 12px rgba(0,0,0,0.3);" : "";
  const animationClasses = [
    pulseAnimation ? "marker-pulse" : "",
    bounceOnHover ? "marker-bounce" : "",
  ]
    .filter(Boolean)
    .join(" ");

  let shapeStyles = "";
  switch (shape) {
    case "pin":
      shapeStyles = "border-radius: 50% 50% 50% 0; transform: rotate(-45deg);";
      break;
    case "circle":
      shapeStyles = "border-radius: 50%; transform: none;";
      break;
    case "square":
      shapeStyles = `border-radius: ${size * 0.15}px; transform: none;`;
      break;
    case "diamond":
      shapeStyles = `border-radius: ${size * 0.1}px; transform: rotate(45deg);`;
      break;
  }

  const innerDotTransform =
    shape === "pin" ? "rotate(45deg)" : shape === "diamond" ? "rotate(-45deg)" : "none";

  return `
    <div class="${animationClasses}" style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${borderWidth}px solid ${borderColor};
      ${shapeStyles}
      ${shadowStyle}
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    ">
      ${
        innerDot
          ? `
        <div style="
          width: ${innerDotSize}px;
          height: ${innerDotSize}px;
          background: ${borderColor};
          border-radius: 50%;
          transform: ${innerDotTransform};
        "></div>
      `
          : ""
      }
    </div>
  `;
}

export function getMarkerIconOptions(options: MarkerOptions): {
  iconSize: [number, number];
  iconAnchor: [number, number];
  popupAnchor: [number, number];
} {
  const { size, shape } = options;
  return {
    iconSize: [size, size],
    iconAnchor: [size / 2, shape === "pin" ? size : size / 2],
    popupAnchor: [0, shape === "pin" ? -size : -size / 2],
  };
}

// ============================================================================
// Control CSS Generation
// ============================================================================

export function generateControlCSS(options: ControlStyleOptions): string {
  const themes: Record<ControlTheme, { bg: string; text: string; border: string }> = {
    default: { bg: "255, 255, 255", text: "#333", border: "rgba(0,0,0,0.2)" },
    dark: { bg: "30, 30, 30", text: "#fff", border: "rgba(255,255,255,0.1)" },
    glass: { bg: "255, 255, 255", text: "#333", border: "rgba(255,255,255,0.3)" },
    minimal: { bg: "0, 0, 0", text: "#fff", border: "transparent" },
  };

  const theme = themes[options.theme];
  const blur = options.blur ? "backdrop-filter: blur(8px);" : "";
  const opacity = options.opacity / 100;

  return `
    .leaflet-control-zoom,
    .leaflet-control-attribution {
      background: rgba(${theme.bg}, ${opacity}) !important;
      color: ${theme.text} !important;
      border: 1px solid ${theme.border} !important;
      border-radius: ${options.borderRadius}px !important;
      ${blur}
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }

    .leaflet-control-zoom a {
      background: transparent !important;
      color: ${theme.text} !important;
      border: none !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      transition: all 0.2s ease;
    }

    .leaflet-control-zoom a:hover {
      background: rgba(${theme.bg === "30, 30, 30" ? "255, 255, 255" : "0, 0, 0"}, 0.1) !important;
      transform: scale(1.05);
    }

    .leaflet-control-zoom-in {
      border-bottom: 1px solid ${theme.border} !important;
      border-radius: ${options.borderRadius}px ${options.borderRadius}px 0 0 !important;
    }

    .leaflet-control-zoom-out {
      border-radius: 0 0 ${options.borderRadius}px ${options.borderRadius}px !important;
    }

    .leaflet-control-attribution {
      font-size: 10px !important;
      padding: 4px 8px !important;
    }

    .leaflet-control-attribution a {
      color: ${theme.text} !important;
      opacity: 0.7;
    }

    /* Smooth tile transitions */
    .leaflet-tile-container {
      transition: opacity 0.3s ease-in-out;
    }

    .leaflet-fade-anim .leaflet-tile {
      transition: opacity 0.3s ease-in-out;
    }

    .leaflet-zoom-anim .leaflet-zoom-animated {
      transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    /* Marker animations */
    @keyframes marker-pulse {
      0%, 100% { transform: rotate(-45deg) scale(1); opacity: 1; }
      50% { transform: rotate(-45deg) scale(1.1); opacity: 0.9; }
    }

    @keyframes marker-bounce {
      0%, 100% { transform: rotate(-45deg) translateY(0); }
      50% { transform: rotate(-45deg) translateY(-8px); }
    }

    .marker-pulse {
      animation: marker-pulse 2s ease-in-out infinite;
    }

    .marker-bounce:hover {
      animation: marker-bounce 0.5s ease-in-out;
    }
  `;
}
