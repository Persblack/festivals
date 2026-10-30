/**
 * Questions people type into a search box about a hub ("when is metal festival
 * season in Germany?"), answered from the hub's own festivals. A question only
 * appears when the data gives it a real answer; nothing here is written by hand.
 */

import type { Festival } from '@/types/festival';
import type { Hub } from '@/lib/seo';
import { byProminence, festivalPath, seriesSlug, topValues } from '@/lib/seo';
import { MONTH_NAMES, formatDateRange, parseLocalDate, startOfToday, toDateString } from '@/lib/dates';
import { formatPriceRange } from '@/lib/utils';

export interface FaqLink {
  name: string;
  path: string;
}

export interface FaqItem {
  q: string;
  /** Plain text; every `links[].name` occurs in it, in order. */
  a: string;
  links?: FaqLink[];
}

/** `EDM` stays as it is, `Metal` reads as `metal` mid-sentence. */
function genreWord(genre: string): string {
  return /^[A-Z]+$/.test(genre) ? genre : genre.toLowerCase();
}

/** `in the Netherlands`, `in the Czech Republic`, `in Germany`. */
export function countryInSentence(country: string): string {
  return /^(Netherlands|Czech Republic|United Kingdom|United States)$/.test(country) ? `the ${country}` : country;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** `A`, `A and B`, `A, B and C`. */
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** One festival per series: a hub can hold two editions of the same festival. */
function distinctSeries(festivals: Festival[]): Festival[] {
  const seen = new Set<string>();
  return festivals.filter((f) => {
    const slug = seriesSlug(f.id);
    if (seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

function link(f: Festival): FaqLink {
  return { name: f.name, path: festivalPath(f.id) };
}

export function hubFaq(hub: Hub, todayIso: string = toDateString(startOfToday())): FaqItem[] {
  const festivals = [...hub.festivals].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const count = festivals.length;
  if (count === 0) return [];

  const kind = hub.genre ? `${genreWord(hub.genre)} festival` : 'music festival';
  const kinds = `${kind}s`;
  const where = hub.country ? `in ${countryInSentence(hub.country)}` : 'in Europe';
  /** `Wacken, Germany` on a Europe-wide hub, `Wacken` on a country hub. */
  const place = (f: Festival) => (hub.country ? f.city : `${f.city}, ${f.country_name}`);
  const items: FaqItem[] = [];

  // Season: the busiest months and the first and last dates of the leading year.
  const yearCounts = topValues(festivals.map((f) => String(f.year)), 1);
  const seasonYear = Number(yearCounts[0]);
  const season = festivals.filter((f) => f.year === seasonYear);
  if (season.length >= 2) {
    const monthCounts = new Array(12).fill(0);
    for (const f of season) {
      const d = parseLocalDate(f.start_date);
      if (d) monthCounts[d.getMonth()]++;
    }
    const busiest = monthCounts
      .map((n, m) => ({ n, m }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.n - a.n || a.m - b.m)
      .slice(0, 2)
      .sort((a, b) => a.m - b.m);
    const first = season[0];
    const last = [...season].sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
    const sentences: string[] = [];
    if (busiest.length > 0) {
      const months = joinAnd(busiest.map((x) => MONTH_NAMES[x.m]));
      sentences.push(
        `${months} ${busiest.length === 1 ? 'is the busiest month' : 'are the busiest months'}: ` +
          `of the ${season.length} ${kinds} ${where} listed for ${seasonYear}, ` +
          `${joinAnd(busiest.map((x) => `${x.n} start in ${MONTH_NAMES[x.m]}`))}.`,
      );
    }
    // A season already under way has no opening date left to show.
    const underway = seasonYear <= Number(todayIso.slice(0, 4));
    const links = underway ? [] : [link(first)];
    let range = underway
      ? `The rest of the ${seasonYear} season`
      : `The ${seasonYear} season opens with ${first.name} on ${formatDateRange(first.start_date, first.end_date)}`;
    if (underway) {
      links.push(link(last));
      range += ` runs until ${formatDateRange(last.end_date, last.end_date)}, when ${last.name} ends`;
    } else if (last !== first) {
      links.push(link(last));
      range += ` and closes with ${last.name}, which ends on ${formatDateRange(last.end_date, last.end_date)}`;
    }
    sentences.push(`${range}.`);
    items.push({ q: `When is ${kind} season ${where}?`, a: sentences.join(' '), links });
  }

  // Biggest: size class first, then lineup length.
  const biggest = distinctSeries([...festivals].sort(byProminence)).slice(0, 3);
  if (biggest.length >= 2) {
    items.push({
      q: `What are the biggest ${kinds} ${where}?`,
      a: `By size and lineup length, the biggest are ${joinAnd(biggest.map((f) => `${f.name} (${place(f)})`))}.`,
      links: biggest.map(link),
    });
  }

  // Cheapest: lowest listed ticket, compared only within one currency.
  const priced = festivals.filter((f) => f.ticket_price_min !== null && f.ticket_price_min >= 0);
  if (priced.length >= 2) {
    const currency = topValues(priced.map((f) => f.currency), 1)[0];
    const comparable = priced.filter((f) => f.currency === currency);
    const cheapest = [...comparable].sort(
      (a, b) => a.ticket_price_min! - b.ticket_price_min! || a.start_date.localeCompare(b.start_date),
    )[0];
    if (comparable.length >= 2) {
      const price = cheapest.ticket_price_min!;
      const mixed = comparable.length < priced.length ? ` among festivals priced in ${currency}` : '';
      const ticket =
        price === 0
          ? 'lists free entry'
          : `has the cheapest listed ticket${mixed}, at ${formatPriceRange(price, price, currency)}`;
      items.push({
        q: `Which ${kind} ${where} has the cheapest tickets?`,
        a:
          `${cheapest.name} ${cheapest.year} in ${place(cheapest)} ${ticket}. ` +
          `${plural(priced.length, 'festival')} on this page list ticket prices so far.`,
        links: [link(cheapest)],
      });
    }
  }

  // Lineups: how many have published acts, and the longest lineups.
  const withLineup = festivals.filter((f) => f.lineup.length > 0);
  if (withLineup.length > 0) {
    const longest = distinctSeries([...withLineup].sort((a, b) => b.lineup.length - a.lineup.length)).slice(0, 3);
    const share =
      count === 1
        ? ''
        : withLineup.length === count
          ? `All ${plural(count, kind)} ${where} have published acts. `
          : `${withLineup.length} of the ${plural(count, kind)} ${where} have published acts so far. `;
    const top =
      longest.length === 1
        ? `${longest[0].name} has ${plural(longest[0].lineup.length, 'act')} announced.`
        : `The longest lineups: ${joinAnd(longest.map((f) => `${f.name} (${plural(f.lineup.length, 'act')})`))}.`;
    items.push({
      q: `Which ${kinds} ${where} have announced their lineup?`,
      a: `${share}${top}`,
      links: longest.map(link),
    });
  }

  // Next: the first one that has not started yet.
  const next = festivals.find((f) => f.start_date >= todayIso);
  if (next) {
    items.push({
      q: `What is the next ${kind} ${where}?`,
      a: `${next.name} in ${place(next)} is next, on ${formatDateRange(next.start_date, next.end_date)}.`,
      links: [link(next)],
    });
  }

  // Count: festivals, cities, and countries on a Europe-wide hub.
  const cityCount = new Set(festivals.map((f) => `${f.city}|${f.country_code}`)).size;
  const countryCount = new Set(festivals.map((f) => f.country_code)).size;
  const spread = hub.country
    ? `in ${plural(cityCount, 'city', 'cities')}`
    : `in ${plural(cityCount, 'city', 'cities')} across ${plural(countryCount, 'country', 'countries')}`;
  // Name the leading cities only when they truly lead: a shared count of at
  // least 2, held by at most three cities.
  const perCity = new Map<string, number>();
  for (const f of festivals) perCity.set(f.city, (perCity.get(f.city) ?? 0) + 1);
  const most = Math.max(...perCity.values());
  const leaders = [...perCity].filter(([, n]) => n === most).map(([c]) => c).sort((a, b) => a.localeCompare(b));
  const cityLine =
    cityCount > 1 && most >= 2 && leaders.length <= 3
      ? leaders.length === 1
        ? ` ${leaders[0]} has the most, with ${most}.`
        : ` ${joinAnd(leaders)} have the most, with ${most} each.`
      : '';
  items.push({
    q: `How many ${kinds} are there ${where}?`,
    a: `Synners lists ${plural(count, `upcoming ${kind}`)} ${where}, ${spread}.${cityLine}`,
  });

  return items;
}

/** Splits an answer into text and link pieces, for rendering links inline. */
export function faqSegments(item: FaqItem): { text: string; path?: string }[] {
  const segments: { text: string; path?: string }[] = [];
  let rest = item.a;
  for (const l of item.links ?? []) {
    const at = rest.indexOf(l.name);
    if (at < 0) continue;
    if (at > 0) segments.push({ text: rest.slice(0, at) });
    segments.push({ text: l.name, path: l.path });
    rest = rest.slice(at + l.name.length);
  }
  if (rest) segments.push({ text: rest });
  return segments;
}

export function faqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
