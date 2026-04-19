import { MAX_OFFSET_METERS } from '../constants/map';

function hash01(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

export function offsetFor(
  userId: string,
  lat: number,
  lng: number,
): { lat: number; lng: number } {
  const bearing = hash01(userId, 0x9e3779b1) * 2 * Math.PI;
  const distance = hash01(userId, 0x85ebca77) * MAX_OFFSET_METERS;

  const dLat = (distance * Math.cos(bearing)) / 111_320;
  const dLng =
    (distance * Math.sin(bearing)) /
    (111_320 * Math.cos((lat * Math.PI) / 180));

  return { lat: lat + dLat, lng: lng + dLng };
}
