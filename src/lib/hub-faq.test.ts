import { describe, expect, it } from 'vitest';
import type { Festival } from '@/types/festival';
import type { Hub } from './seo';
import { faqJsonLd, faqSegments, hubFaq } from './hub-faq';

function festival(id: string, start: string, extra: Partial<Festival> = {}): Festival {
  return {
    id, name: id, description: null, start_date: start, end_date: start, year: Number(start.slice(0, 4)),
    city: 'Berlin', country_code: 'DE', country_name: 'Germany', venue: '', latitude: null, longitude: null,
    genres: ['Metal'], size: 'medium', featured: false, website: null, ticket_link: null, instagram: null,
    lineup: [], ticket_price_min: null, ticket_price_max: null, currency: 'EUR', sources: [],
    last_updated: null, data_quality_score: 0, ...extra,
  };
}

const TODAY = '2026-10-30';

const metal = [
  festival('Wacken-2027', '2027-07-29', { end_date: '2027-07-31', city: 'Wacken', size: 'massive', lineup: ['A', 'B', 'C'] }),
  festival('Breeze-2027', '2027-08-12', { city: 'Dinkelsbühl', size: 'large', lineup: ['A'] }),
  festival('Rockharz-2027', '2027-07-01', { city: 'Ballenstedt', size: 'large' }),
  festival('Winter-2027', '2027-01-15', { size: 'small' }),
  festival('Last-2027', '2027-12-10', { end_date: '2027-12-12', size: 'small' }),
];

const question = (hub: Hub, start: string) => hubFaq(hub, TODAY).find((i) => i.q.startsWith(start));

describe('hubFaq', () => {
  it('leaves out questions the data cannot answer', () => {
    const hub: Hub = { path: '/x/', heading: 'Metal Festivals in Germany', festivals: metal.map((f) => ({ ...f, lineup: [] })), country: 'Germany', genre: 'Metal' };
    const qs = hubFaq(hub, TODAY).map((i) => i.q);
    expect(qs.some((q) => q.includes('cheapest'))).toBe(false);
    expect(qs.some((q) => q.includes('lineup'))).toBe(false);
    // One priced festival is no comparison either.
    hub.festivals[0] = { ...hub.festivals[0], ticket_price_min: 100 };
    expect(hubFaq(hub, TODAY).some((i) => i.q.includes('cheapest'))).toBe(false);
    expect(hubFaq({ ...hub, festivals: [] }, TODAY)).toEqual([]);
  });

  it('picks the cheapest listed ticket across editions and names the edition', () => {
    const festivals = [
      festival('wacken-2027', '2027-07-29', { name: 'Wacken', ticket_price_min: 120 }),
      festival('wacken-2028', '2028-07-27', { name: 'Wacken', ticket_price_min: 99 }),
      festival('breeze-2027', '2027-08-12', { name: 'Breeze', ticket_price_min: 150, ticket_price_max: 60 }),
      festival('swiss-2027', '2027-06-01', { name: 'Swiss', ticket_price_min: 20, currency: 'CHF' }),
    ];
    const hub: Hub = { path: '/x/', heading: 'Metal Festivals in Germany', festivals, country: 'Germany', genre: 'Metal' };
    const item = question(hub, 'Which metal festival in Germany has the cheapest')!;
    expect(item.a).toContain('Wacken 2028 in Berlin has the cheapest listed ticket among festivals priced in EUR, at €99.');
    expect(item.links).toEqual([{ name: 'Wacken', path: '/festivals/wacken/' }]);
    // Two editions of one series count once in the biggest list.
    expect(question(hub, 'What are the biggest')!.links!.filter((l) => l.name === 'Wacken')).toHaveLength(1);
  });

  it('phrases a combo hub by genre and country', () => {
    const hub: Hub = { path: '/x/', heading: 'Metal Festivals in Germany', festivals: metal, country: 'Germany', genre: 'Metal' };
    const qs = hubFaq(hub, TODAY).map((i) => i.q);
    expect(qs).toEqual([
      'When is metal festival season in Germany?',
      'What are the biggest metal festivals in Germany?',
      'Which metal festivals in Germany have announced their lineup?',
      'What is the next metal festival in Germany?',
      'How many metal festivals are there in Germany?',
    ]);
    expect(question(hub, 'When')!.a).toBe(
      'July is the busiest month: of the 5 metal festivals in Germany listed for 2027, 2 start in July. ' +
        'The 2027 season opens with Winter-2027 on Jan 15, 2027 and closes with Last-2027, which ends on Dec 12, 2027.',
    );
    expect(question(hub, 'What are the biggest')!.a).toBe(
      'By size and lineup length, the biggest are Wacken-2027 (Wacken), Breeze-2027 (Dinkelsbühl) and Rockharz-2027 (Ballenstedt).',
    );
    expect(question(hub, 'Which')!.a).toBe(
      '2 of the 5 metal festivals in Germany have published acts so far. The longest lineups: Wacken-2027 (3 acts) and Breeze-2027 (1 act).',
    );
    expect(question(hub, 'How many')!.a).toBe('Synners lists 5 upcoming metal festivals in Germany, in 4 cities. Berlin has the most, with 2.');
  });

  it('phrases a country hub without a genre and a genre hub for Europe', () => {
    const country: Hub = { path: '/c/', heading: 'Music Festivals in Germany', festivals: metal, country: 'Germany' };
    expect(question(country, 'When')!.q).toBe('When is music festival season in Germany?');
    expect(question(country, 'What is the next')!.a).toBe('Winter-2027 in Berlin is next, on Jan 15, 2027.');

    const vienna = festival('Nova-2027', '2027-06-10', { city: 'Vienna', country_code: 'AT', country_name: 'Austria' });
    const genre: Hub = { path: '/g/', heading: 'EDM Festivals in Europe', festivals: [...metal, vienna], genre: 'EDM' };
    expect(question(genre, 'How many')!.a).toBe(
      'Synners lists 6 upcoming EDM festivals in Europe, in 5 cities across 2 countries. Berlin has the most, with 2.',
    );
    expect(question(genre, 'What is the next')!.a).toBe('Winter-2027 in Berlin, Germany is next, on Jan 15, 2027.');
    expect(hubFaq({ ...genre, genre: 'Hip-Hop' }, TODAY)[0].q).toBe('When is hip-hop festival season in Europe?');
    expect(hubFaq({ ...country, country: 'Netherlands' }, TODAY)[0].q).toBe('When is music festival season in the Netherlands?');
  });

  it('names no leading city when every city has one festival', () => {
    const spread = metal.map((f, i) => ({ ...f, city: `City ${i}` }));
    const hub: Hub = { path: '/c/', heading: 'Music Festivals in Germany', festivals: spread, country: 'Germany' };
    expect(question(hub, 'How many')!.a).toBe('Synners lists 5 upcoming music festivals in Germany, in 5 cities.');
  });

  it('describes a season already under way without an opening date', () => {
    const hub: Hub = { path: '/x/', heading: 'Metal Festivals in Germany', festivals: metal, country: 'Germany', genre: 'Metal' };
    expect(hubFaq(hub, '2027-03-01')[0].a).toContain('The rest of the 2027 season runs until Dec 12, 2027, when Last-2027 ends.');
  });

  it('splits answers into inline links and builds FAQPage data', () => {
    const items = hubFaq({ path: '/x/', heading: 'Metal Festivals in Germany', festivals: metal, country: 'Germany', genre: 'Metal' }, TODAY);
    const biggest = items[1];
    const segments = faqSegments(biggest);
    expect(segments.map((s) => s.text).join('')).toBe(biggest.a);
    expect(segments.filter((s) => s.path).map((s) => s.text)).toEqual(['Wacken-2027', 'Breeze-2027', 'Rockharz-2027']);
    const data = faqJsonLd(items) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(data.mainEntity[0].name).toBe(items[0].q);
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(items[0].a);
  });
});
