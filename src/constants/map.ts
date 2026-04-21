// Every map-related tunable lives here. Edit freely; everything imports from this file.

// Default center if geolocation is denied/unavailable. (SF Ferry Building.)
export const DEFAULT_CENTER = { lat: 37.7955, lng: -122.3937 };

// Initial zoom when the map mounts.
export const DEFAULT_ZOOM = 14;

// Circle visual tuning.
export const CIRCLE_STROKE_OPACITY = 0.8;

// Fixed radius for venue circles (venues are places, not blobs).
export const VENUE_CIRCLE_RADIUS_M = 80;

// Radius used by the fetch-venues lambda for the Places API search.
export const VENUE_SEARCH_RADIUS_MILES = 10;

// Fill color by venue type.
export const VENUE_COLORS: Record<string, string> = {
  PARK: '#4caf50',
  CAFE: '#ff9800',
  LIBRARY: '#2196f3',
  MALL: '#9c27b0',
};

// Fill opacity driven by current interest count.
export function venueOpacity(count: number, isActive: boolean): number {
  if (isActive) return 0.85;
  if (count >= 2) return 0.6;
  if (count === 1) return 0.4;
  return 0.2;
}

// HSL seed so colors read as bright but not neon.
export const COLOR_HSL_SATURATION = 65;
export const COLOR_HSL_LIGHTNESS = 55;
