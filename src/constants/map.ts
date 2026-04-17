// Every map-related tunable lives here. Edit freely; everything imports from this file.

// Default center if geolocation is denied/unavailable. (SF Ferry Building.)
export const DEFAULT_CENTER = { lat: 37.7955, lng: -122.3937 };

// Initial zoom when the map mounts.
export const DEFAULT_ZOOM = 14;

// How often we push the user's location to their User row (ms).
export const POLL_INTERVAL_MS = 10_000;

// Max distance (miles) that counts as "nearby" for rendering circles.
export const NEARBY_RADIUS_MILES = 10;

// Google Maps `<Circle>` uses METERS.
// 400 ft ≈ 122 m, 2000 ft ≈ 610 m.
export const MIN_CIRCLE_RADIUS_M = 122;
export const MAX_CIRCLE_RADIUS_M = 610;

// Piecewise-linear zoom→radius mapping. Higher zoom = closer in = smaller radius.
// Anchors are interpolated; values outside the range clamp to the end anchor.
// Tweak freely.
export const ZOOM_RADIUS_ANCHORS: Array<[zoom: number, radiusM: number]> = [
  [18, MIN_CIRCLE_RADIUS_M],
  [15, 200],
  [12, 400],
  [10, MAX_CIRCLE_RADIUS_M],
];

export function radiusForZoom(zoom: number): number {
  const anchors = [...ZOOM_RADIUS_ANCHORS].sort((a, b) => a[0] - b[0]);
  if (zoom <= anchors[0][0]) return anchors[0][1];
  if (zoom >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [z0, r0] = anchors[i];
    const [z1, r1] = anchors[i + 1];
    if (zoom >= z0 && zoom <= z1) {
      const t = (zoom - z0) / (z1 - z0);
      return r0 + (r1 - r0) * t;
    }
  }
  return MIN_CIRCLE_RADIUS_M;
}

// Deterministic offset applied to every user's displayed position so circles
// don't sit on top of their actual location. Magnitude + direction derived
// from the userId, stable per user. Max lateral shift in METERS.
export const MAX_OFFSET_METERS = 180;

// Circle visual tuning.
export const CIRCLE_FILL_OPACITY = 0.35;
export const CIRCLE_STROKE_OPACITY = 0.8;

// Polylines (ping/group lines).
export const LINE_WEIGHT = 3;
export const LINE_OPACITY = 0.9;

// 4-char geohash ≈ 20km cell. Self + 8 neighbors covers a 10-mile radius
// with margin. See src/lib/geohash.ts for the query helper.
export const GEOHASH_PRECISION = 4;

// HSL seed so colors read as bright but not neon.
export const COLOR_HSL_SATURATION = 65;
export const COLOR_HSL_LIGHTNESS = 55;
