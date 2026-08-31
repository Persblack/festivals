/**
 * Loads the festival dataset at **build time** and hands it to the validator.
 *
 * Imported from `.astro` frontmatter only — never from a React island, which
 * would ship the whole JSON dataset to the browser.
 *
 * Adding a season is a file drop: any `src/data/festivals*.json` is picked up,
 * merged and de-duplicated by id. No code change for 2027, 2028, ...
 */

import type { DataHealth, Festival } from '@/types/festival';
import { isRecord } from '@/lib/guards';
import { type NormalizeResult, normalizeFestivals } from '@/lib/festival-normalize';
import { formatYearRange } from '@/lib/dates';

function loadFromDataDirectory(): NormalizeResult {
  const modules = import.meta.glob<unknown>('../data/festivals*.json', {
    eager: true,
    import: 'default',
  });

  const files = Object.keys(modules)
    .filter((path) => !/depreciated|deprecated|backup/i.test(path))
    .sort();

  if (files.length === 0) {
    throw new Error(
      'Festival data: no src/data/festivals*.json found. The dataset is gitignored — ' +
        'run the scraper (or restore a snapshot) before building.',
    );
  }

  const rows: unknown[] = [];
  for (const file of files) {
    const contents = modules[file];
    if (Array.isArray(contents)) {
      rows.push(...contents);
    } else if (isRecord(contents) && Array.isArray(contents.festivals)) {
      rows.push(...contents.festivals);
    } else {
      throw new Error(`Festival data: ${file} has no festivals array.`);
    }
  }

  return normalizeFestivals(rows, { sourceFiles: files });
}

const loaded = loadFromDataDirectory();

export const festivals: Festival[] = loaded.festivals;
export const dataHealth: DataHealth = loaded.health;

/** Ascending list of every year present in the data. */
export const dataYears: number[] = Object.keys(dataHealth.festivalsPerYear)
  .map(Number)
  .sort((a, b) => a - b);

export const yearRangeLabel: string = formatYearRange(dataYears);

/** Newest `last_updated` across the dataset — the site's data freshness. */
export const dataUpdatedAt: string | null = festivals.reduce<string | null>(
  (newest, festival) =>
    festival.last_updated && (!newest || festival.last_updated > newest)
      ? festival.last_updated
      : newest,
  null,
);

// One build-time report. Silence means the dataset needed no repair.
if (dataHealth.dropped.length > 0 || Object.keys(dataHealth.repairs).length > 0) {
  const perYear = dataYears.map((year) => `${year}: ${dataHealth.festivalsPerYear[year]}`);
  const lines = [
    `[festival-data] kept ${dataHealth.kept}/${dataHealth.total} rows from ` +
      `${dataHealth.sourceFiles.join(', ')} (${perYear.join(', ')})`,
  ];
  if (dataHealth.dropped.length > 0) {
    lines.push(`  dropped ${dataHealth.dropped.length}:`);
    for (const drop of dataHealth.dropped.slice(0, 10)) {
      lines.push(`    - ${drop.id}: ${drop.reason}`);
    }
    if (dataHealth.dropped.length > 10) {
      lines.push(`    - … and ${dataHealth.dropped.length - 10} more`);
    }
  }
  for (const [reason, entry] of Object.entries(dataHealth.repairs)) {
    lines.push(`  repaired ${entry.count}x ${reason} (e.g. ${entry.samples.join(', ')})`);
  }
  console.warn(lines.join('\n'));
}
