import { describe, expect, it } from 'vitest';
import { normalizeFestivals } from './festival-normalize';

/** A row shaped like real scraper output. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wacken-2026',
    name: 'Wacken Open Air',
    description: 'Metal',
    start_date: '2026-07-30',
    end_date: '2026-08-01',
    year: 2026,
    city: 'Wacken',
    country_code: 'de',
    country_name: 'Germany',
    venue: 'Field',
    latitude: 54.03,
    longitude: 9.37,
    genres: ['Metal'],
    size: 'massive',
    featured: true,
    website: 'https://wacken.com',
    ticket_link: null,
    instagram: null,
    lineup: ['Iron Maiden', 'Iron Maiden', ' '],
    ticket_price_min: 300,
    ticket_price_max: 500,
    currency: 'eur',
    sources: ['scraper'],
    last_updated: '2026-03-09 18:11:52',
    data_quality_score: 0.9,
    ...overrides,
  };
}

describe('normalizeFestivals — shape', () => {
  it('rejects a file that is not an array of rows', () => {
    expect(() => normalizeFestivals(null)).toThrow(/expected an array/i);
    expect(() => normalizeFestivals({ festivals: [] })).toThrow(/expected an array/i);
  });

  it('refuses to build a site with zero usable festivals', () => {
    expect(() => normalizeFestivals([{ name: 'no id' }])).toThrow(/every row was rejected/i);
  });

  it('normalizes the fields a view depends on', () => {
    const { festivals } = normalizeFestivals([row()]);
    expect(festivals).toHaveLength(1);
    const [festival] = festivals;
    expect(festival.country_code).toBe('DE');
    expect(festival.currency).toBe('EUR');
    expect(festival.year).toBe(2026);
    // Deduped and stripped of blanks.
    expect(festival.lineup).toEqual(['Iron Maiden']);
    expect(festival.latitude).toBe(54.03);
  });

  it('sorts output chronologically so every view starts from the same order', () => {
    const { festivals } = normalizeFestivals([
      row({ id: 'late', start_date: '2027-01-05', end_date: '2027-01-06' }),
      row({ id: 'early', start_date: '2026-04-05', end_date: '2026-04-06' }),
    ]);
    expect(festivals.map((f) => f.id)).toEqual(['early', 'late']);
  });
});

describe('normalizeFestivals — drops', () => {
  it('drops rows that cannot be identified or placed in time', () => {
    const { festivals, health } = normalizeFestivals(
      [
        row(),
        row({ id: '   ' }),
        row({ id: 'x', name: '' }),
        row({ id: 'y', start_date: 'summer 2027' }),
        row({ id: 'z', start_date: '2027-02-30' }),
        'not an object',
      ],
      { maxDropRatio: 1 },
    );
    expect(festivals.map((f) => f.id)).toEqual(['wacken-2026']);
    expect(health.dropped).toHaveLength(5);
    expect(health.dropped.map((d) => d.reason)).toEqual([
      'missing id',
      'missing name',
      expect.stringContaining('unparseable start_date'),
      expect.stringContaining('unparseable start_date'),
      'not an object',
    ]);
  });

  it('fails the build when a scrape regression guts the dataset', () => {
    const rows = [row(), row({ id: 'a', start_date: 'x' }), row({ id: 'b', start_date: 'x' })];
    expect(() => normalizeFestivals(rows)).toThrow(/rejected 2\/3 rows/);
  });

  it('tolerates a small share of bad rows', () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      row({ id: `f-${i}`, start_date: '2026-07-01', end_date: '2026-07-02' }),
    );
    rows.push(row({ id: 'broken', start_date: 'nope' }));
    const { festivals, health } = normalizeFestivals(rows);
    expect(festivals).toHaveLength(40);
    expect(health.dropped).toHaveLength(1);
  });

  it('keeps one row per id, deterministically preferring the newest scrape', () => {
    const older = row({ name: 'Old name', last_updated: '2026-01-01 00:00:00' });
    const newer = row({ name: 'New name', last_updated: '2026-06-01 00:00:00' });
    expect(normalizeFestivals([older, newer], { maxDropRatio: 1 }).festivals[0].name).toBe(
      'New name',
    );
    // Same input in the other order must produce the same winner.
    expect(normalizeFestivals([newer, older], { maxDropRatio: 1 }).festivals[0].name).toBe(
      'New name',
    );
  });
});

describe('normalizeFestivals — repairs', () => {
  it('clamps an end date that precedes the start', () => {
    const { festivals, health } = normalizeFestivals([
      row({ start_date: '2026-07-30', end_date: '2026-07-01' }),
    ]);
    expect(festivals[0].end_date).toBe('2026-07-30');
    expect(Object.keys(health.repairs)).toContain('end_date before start_date (clamped to start)');
  });

  it('falls back to the start date when the end date is unusable', () => {
    const { festivals } = normalizeFestivals([row({ end_date: null })]);
    expect(festivals[0].end_date).toBe('2026-07-30');
  });

  it('nulls both coordinates when either is missing, out of range, or Null Island', () => {
    for (const coords of [
      { latitude: null, longitude: 9.37 },
      { latitude: 54.03, longitude: null },
      { latitude: 991, longitude: 9.37 },
      { latitude: 0, longitude: 0 },
      { latitude: 'n/a', longitude: 'n/a' },
    ]) {
      const { festivals } = normalizeFestivals([row(coords)]);
      expect(festivals[0].latitude).toBeNull();
      expect(festivals[0].longitude).toBeNull();
    }
  });

  it('keeps a coordinate pair supplied as numeric strings', () => {
    const { festivals } = normalizeFestivals([row({ latitude: '54.03', longitude: '9.37' })]);
    expect(festivals[0].latitude).toBeCloseTo(54.03);
  });

  it('drops unknown genres and reports each one, even when another genre survives', () => {
    const { festivals, health } = normalizeFestivals([row({ genres: ['Shoegaze', 'Metal'] })]);
    expect(festivals[0].genres).toEqual(['Metal']);
    // A genre the site does not know cannot be filtered or coloured, so it has
    // to surface in the build log rather than pass silently.
    expect(Object.keys(health.repairs)).toContain(
      'unrecognized genre "Shoegaze" (add it to GENRE_CATEGORY_MAP)',
    );
  });

  it('falls back to Else when no genre survives', () => {
    const { festivals, health } = normalizeFestivals([row({ genres: ['Shoegaze'] })]);
    expect(festivals[0].genres).toEqual(['Else']);
    expect(Object.keys(health.repairs)).toContain('no recognized genre (fell back to Else)');
  });

  it('never accepts a prototype key as a genre', () => {
    const { festivals } = normalizeFestivals([row({ genres: ['constructor', 'toString'] })]);
    expect(festivals[0].genres).toEqual(['Else']);
  });

  it('coerces an unknown size to medium so size filters stay usable', () => {
    expect(normalizeFestivals([row({ size: 'gigantic' })]).festivals[0].size).toBe('medium');
    expect(normalizeFestivals([row({ size: 'MASSIVE' })]).festivals[0].size).toBe('massive');
  });

  it('nulls a website that is not an absolute http(s) URL', () => {
    for (const website of [null, '', 'tba', 'javascript:alert(1)', 'wacken.com']) {
      expect(normalizeFestivals([row({ website })]).festivals[0].website).toBeNull();
    }
    expect(normalizeFestivals([row()]).festivals[0].website).toBe('https://wacken.com/');
  });

  it('swaps an inverted price range and discards negative prices', () => {
    const { festivals } = normalizeFestivals([row({ ticket_price_min: 500, ticket_price_max: 300 })]);
    expect([festivals[0].ticket_price_min, festivals[0].ticket_price_max]).toEqual([300, 500]);
    expect(normalizeFestivals([row({ ticket_price_min: -5 })]).festivals[0].ticket_price_min).toBeNull();
  });

  it('derives the year from start_date and ignores a stale year field', () => {
    const { festivals, health } = normalizeFestivals([row({ year: 2026, start_date: '2027-07-30', end_date: '2027-08-01' })]);
    expect(festivals[0].year).toBe(2027);
    expect(Object.keys(health.repairs)).toContain(
      'year field disagreed with start_date (derived from start_date)',
    );
  });

  it('reports per-year counts for the build log', () => {
    const { health } = normalizeFestivals([
      row(),
      row({ id: 'b', start_date: '2027-07-30', end_date: '2027-08-01' }),
      row({ id: 'c', start_date: '2027-08-30', end_date: '2027-08-31' }),
    ]);
    expect(health.festivalsPerYear).toEqual({ 2026: 1, 2027: 2 });
    expect(health.kept).toBe(3);
    expect(health.total).toBe(3);
  });

  it('caps repair samples so a systemic problem cannot flood the build log', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ id: `f-${i}`, website: null }));
    const { health } = normalizeFestivals(rows);
    const entry = health.repairs['no usable website URL'];
    expect(entry.count).toBe(12);
    expect(entry.samples).toHaveLength(5);
  });
});
