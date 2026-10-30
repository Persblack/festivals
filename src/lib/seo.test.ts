import { describe, expect, it } from 'vitest';
import type { Festival } from '@/types/festival';
import { buildHubs, groupSeries, jsonLd, leadEdition, seriesSlug } from './seo';

function festival(id: string, start: string, extra: Partial<Festival> = {}): Festival {
  return {
    id, name: id, description: null, start_date: start, end_date: start, year: Number(start.slice(0, 4)),
    city: 'Berlin', country_code: 'DE', country_name: 'Germany', venue: '', latitude: null, longitude: null,
    genres: ['Metal'], size: 'medium', featured: false, website: null, ticket_link: null, instagram: null,
    lineup: [], ticket_price_min: null, ticket_price_max: null, currency: 'EUR', sources: [],
    last_updated: null, data_quality_score: 0, ...extra,
  };
}

describe('seo', () => {
  it('groups editions of one festival under a year-free slug', () => {
    expect(seriesSlug('wacken-open-air-2027')).toBe('wacken-open-air');
    expect(seriesSlug('festival-2000-trance-2026')).toBe('festival-2000-trance');
    const series = groupSeries([festival('w-2027', '2027-07-29'), festival('w-2026', '2026-07-30')]);
    expect(series.get('w')!.map((f) => f.id)).toEqual(['w-2026', 'w-2027']);
    expect(leadEdition(series.get('w')!, '2026-10-30').id).toBe('w-2027');
    expect(leadEdition(series.get('w')!, '2028-01-01').id).toBe('w-2027');
  });

  it('never lets data close the ld+json script tag', () => {
    expect(jsonLd({ name: '</script><b>' })).not.toContain('<');
  });

  it('builds a country x genre hub only when it is not thin', () => {
    const four = [1, 2, 3, 4].map((n) => festival(`m${n}-2027`, '2027-07-01'));
    expect(buildHubs(four).combos).toEqual([]);
    const five = [...four, festival('m5-2027', '2027-07-02', { genres: ['Techno'] }), festival('m6-2027', '2027-07-03')];
    const { combos, genres } = buildHubs(five);
    expect(combos.map((h) => h.path)).toEqual(['/countries/germany/metal/']);
    // A category hub includes its sub-genres: Techno counts as EDM.
    expect(genres.find((h) => h.genre === 'EDM')!.festivals).toHaveLength(1);
  });
});
