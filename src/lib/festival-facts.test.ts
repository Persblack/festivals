import { describe, expect, it } from 'vitest';
import type { Festival } from '@/types/festival';
import {
  AIRPORTS,
  artistKey,
  datesOverlap,
  durationDays,
  factualIntro,
  haversineKm,
  isThinSeries,
  nearestAirports,
  nearbyFestivals,
  sameDates,
  sameLineupElsewhere,
  sharedArtists,
} from './festival-facts';

function festival(id: string, start: string, extra: Partial<Festival> = {}): Festival {
  return {
    id, name: id, description: null, start_date: start, end_date: start, year: Number(start.slice(0, 4)),
    city: 'Berlin', country_code: 'DE', country_name: 'Germany', venue: '', latitude: null, longitude: null,
    genres: ['Metal'], size: 'medium', featured: false, website: null, ticket_link: null, instagram: null,
    lineup: [], ticket_price_min: null, ticket_price_max: null, currency: 'EUR', sources: [],
    last_updated: null, data_quality_score: 0, ...extra,
  };
}

describe('haversineKm', () => {
  it('measures known city distances', () => {
    // Berlin -> Munich is about 504 km in a straight line.
    expect(haversineKm(52.52, 13.405, 48.1351, 11.582)).toBeGreaterThan(500);
    expect(haversineKm(52.52, 13.405, 48.1351, 11.582)).toBeLessThan(510);
    expect(haversineKm(46, 14, 46, 14)).toBe(0);
  });
});

describe('nearestAirports', () => {
  const airports = [
    { name: 'Far', city: 'X', iata: 'FAR', lat: 47.2, lon: 14.5 },
    { name: 'Near', city: 'Y', iata: 'NEA', lat: 46.25, lon: 14.45 },
    { name: 'Too far', city: 'Z', iata: 'TOO', lat: 50, lon: 14.5 },
  ];

  it('returns the closest within range, nearest first, rounded', () => {
    const result = nearestAirports(46.05, 14.5, airports);
    expect(result.map((r) => r.airport.iata)).toEqual(['NEA', 'FAR']);
    expect(Number.isInteger(result[0].km)).toBe(true);
    expect(result[0].km).toBeGreaterThan(20);
    expect(result[0].km).toBeLessThan(25);
  });

  it('drops airports beyond maxKm and honours the limit', () => {
    expect(nearestAirports(46.05, 14.5, airports, { maxKm: 50 }).map((r) => r.airport.iata)).toEqual(['NEA']);
    expect(nearestAirports(46.05, 14.5, airports, { limit: 1 })).toHaveLength(1);
  });

  it('finds Ljubljana airport for a festival in Ljubljana with the bundled data', () => {
    const [first] = nearestAirports(46.0569, 14.5058, AIRPORTS);
    expect(first.airport.iata).toBe('LJU');
    expect(first.km).toBeGreaterThan(15);
    expect(first.km).toBeLessThan(30);
  });
});

describe('dates', () => {
  it('counts days inclusively', () => {
    expect(durationDays({ start_date: '2026-07-03', end_date: '2026-07-05' })).toBe(3);
    expect(durationDays({ start_date: '2026-07-03', end_date: '2026-07-03' })).toBe(1);
    expect(durationDays({ start_date: '2026-07-31', end_date: '2026-08-02' })).toBe(3);
  });

  it('treats shared edge days as overlap and adjacent days as none', () => {
    const a = { start_date: '2026-07-03', end_date: '2026-07-05' };
    expect(datesOverlap(a, { start_date: '2026-07-05', end_date: '2026-07-07' })).toBe(true);
    expect(datesOverlap(a, { start_date: '2026-07-01', end_date: '2026-07-03' })).toBe(true);
    expect(datesOverlap(a, { start_date: '2026-07-04', end_date: '2026-07-04' })).toBe(true);
    expect(datesOverlap(a, { start_date: '2026-06-01', end_date: '2026-08-01' })).toBe(true);
    expect(datesOverlap(a, { start_date: '2026-07-06', end_date: '2026-07-08' })).toBe(false);
    expect(datesOverlap(a, { start_date: '2026-07-01', end_date: '2026-07-02' })).toBe(false);
  });
});

describe('shared artists', () => {
  it('matches case- and whitespace-insensitively, keeps the page spelling', () => {
    expect(artistKey('  Oomph!  ')).toBe(artistKey('OOMPH!'));
    expect(artistKey('Florence  +\tthe Machine')).toBe('florence + the machine');
    expect(sharedArtists(['OOMPH!', 'Tom Odell', 'Lorde'], ['oomph!', ' TOM  ODELL '])).toEqual(['OOMPH!', 'Tom Odell']);
  });

  it('never lists one artist twice', () => {
    expect(sharedArtists(['Lorde', 'LORDE'], ['lorde'])).toEqual(['Lorde']);
  });

  it('finds other series that book the same artists, most shared first, never its own series', () => {
    const me = festival('a-2026', '2026-07-01', { lineup: ['Sabaton', 'Arch Enemy', 'Trivium'] });
    const myNextYear = festival('a-2027', '2027-07-01', { lineup: ['sabaton'] });
    const one = festival('b-2026', '2026-08-01', { lineup: ['SABATON'] });
    const two = festival('c-2026', '2026-06-01', { lineup: ['arch enemy', 'Trivium '] });
    const twoAgain = festival('c-2027', '2027-06-01', { lineup: ['Arch Enemy'] });
    const none = festival('d-2026', '2026-06-01', { lineup: ['Lorde'] });
    const matches = sameLineupElsewhere(me, [me, myNextYear, one, two, twoAgain, none]);
    expect(matches.map((m) => m.festival.id)).toEqual(['c-2026', 'b-2026']);
    expect(matches[0].artists).toEqual(['Arch Enemy', 'Trivium']);
    expect(matches[1].artists).toEqual(['Sabaton']);
  });

  it('returns nothing for a festival without a lineup', () => {
    expect(sameLineupElsewhere(festival('a-2026', '2026-07-01'), [festival('b-2026', '2026-07-01', { lineup: ['X'] })])).toEqual([]);
  });
});

describe('sameDates', () => {
  it('lists overlapping festivals of other series, biggest first, one edition per series', () => {
    const me = festival('a-2026', '2026-07-03', { end_date: '2026-07-05' });
    const small = festival('s-2026', '2026-07-05', { size: 'small' });
    const big = festival('b-2026', '2026-07-01', { end_date: '2026-07-03', size: 'massive' });
    const later = festival('l-2026', '2026-07-06');
    const mine = festival('a-2027', '2026-07-04');
    expect(sameDates(me, [me, small, big, later, mine]).map((f) => f.id)).toEqual(['b-2026', 's-2026']);
  });
});

describe('nearbyFestivals', () => {
  it('lists other series within range, nearest first', () => {
    const me = festival('a-2026', '2026-07-01', { latitude: 46.05, longitude: 14.5 });
    const near = festival('n-2026', '2026-08-01', { latitude: 46.1, longitude: 14.5 });
    const far = festival('f-2026', '2026-08-01', { latitude: 48, longitude: 14.5 });
    const unplaced = festival('u-2026', '2026-08-01');
    expect(nearbyFestivals(me, [me, near, far, unplaced]).map((n) => n.festival.id)).toEqual(['n-2026']);
    expect(nearbyFestivals(festival('x-2026', '2026-07-01'), [near])).toEqual([]);
  });
});

describe('isThinSeries', () => {
  it('is thin only when no edition has a description or a lineup', () => {
    expect(isThinSeries([festival('a-2026', '2026-07-01'), festival('a-2027', '2027-07-01')])).toBe(true);
    expect(isThinSeries([festival('a-2026', '2026-07-01', { description: '   ' })])).toBe(true);
    expect(isThinSeries([festival('a-2026', '2026-07-01'), festival('a-2027', '2027-07-01', { lineup: ['X'] })])).toBe(false);
    expect(isThinSeries([festival('a-2026', '2026-07-01', { description: 'Open air.' })])).toBe(false);
  });
});

describe('factualIntro', () => {
  it('states only fields the festival has and skips Else', () => {
    const f = festival('a-2026', '2026-07-03', {
      name: 'Alpha', end_date: '2026-07-05', genres: ['Metal', 'Else'], venue: 'Field', city: 'Wacken',
      ticket_price_min: 100, ticket_price_max: 100,
    });
    const text = factualIntro(f, [f], false);
    expect(text).toContain('Alpha is a 3-day Metal festival in Wacken, Germany.');
    expect(text).toContain('runs Jul 3-5, 2026 at Field.');
    expect(text).toContain('€100');
    expect(text).not.toContain('Else');
    expect(text).not.toContain('announced');
    expect(text).not.toMatch(/—/);
  });
});
