export const BASEL_BOUNDS: [[number, number], [number, number]] = [[7.48, 47.50], [7.72, 47.63]];
// Kept for the places map, which still offers a Switzerland-wide capture view.
export const SWISS_BOUNDS: [[number, number], [number, number]] = [[5.9, 45.75], [10.65, 47.9]];
export const BASEMAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
export const REGULATIONS_SOURCE_ID = "magnetrail-regulations";

// Keep map overlays aligned with the Magnetrail brand tokens in globals.css.
export const MAP_COLORS = {
  prohibited: "#E58978",
  restricted: "#FFB62F",
  accent: "#FFB62F",
} as const;

