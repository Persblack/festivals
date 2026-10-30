/**
 * The whole dataset as one static JSON file with a content hash in its name.
 * Islands fetch it once and the browser keeps it, instead of every page
 * carrying megabytes of serialized props. Build-time only.
 */

import { createHash } from 'node:crypto';
import { festivals } from '@/lib/festival-data';

export const festivalDataJson = JSON.stringify(festivals);
export const festivalDataHash = createHash('sha256').update(festivalDataJson).digest('hex').slice(0, 12);
export const festivalDataUrl = `/data/festivals.${festivalDataHash}.json`;
