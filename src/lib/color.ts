import { COLOR_HSL_LIGHTNESS, COLOR_HSL_SATURATION } from '../constants/map';

// FNV-1a 32-bit hash — deterministic, no crypto needed.
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function colorFromId(userId: string): string {
  const hue = hash(userId) % 360;
  return `hsl(${hue} ${COLOR_HSL_SATURATION}% ${COLOR_HSL_LIGHTNESS}%)`;
}
