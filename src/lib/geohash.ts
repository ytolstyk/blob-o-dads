import ngeohash from 'ngeohash';
import { GEOHASH_PRECISION } from '../constants/map';

export function encode(lat: number, lng: number, precision = GEOHASH_PRECISION): string {
  return ngeohash.encode(lat, lng, precision);
}

// Returns the 9-cell prefix set (self + 8 neighbors) that covers a 10-mile
// radius around `lat,lng` at precision 4. Use as an `or` filter on the
// User.geohashPrefix secondary index.
export function nearbyPrefixes(lat: number, lng: number): string[] {
  const self = encode(lat, lng);
  return [self, ...ngeohash.neighbors(self)];
}
