/**
 * The project's canonical type guards. Import from here — never re-declare a
 * local copy at a call site.
 */

import type { Festival, MappableFestival } from '@/types/festival';

/** Narrows unvalidated JSON to an object whose fields are still `unknown`. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A festival with usable coordinates. Normalization nulls both coordinates
 * together when either is missing or implausible, so this guard is enough to
 * hand a festival to Leaflet or a distance calculation.
 */
export function hasCoordinates(festival: Festival): festival is MappableFestival {
  return festival.latitude !== null && festival.longitude !== null;
}
