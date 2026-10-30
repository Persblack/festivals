/**
 * The site's indexable page set, computed once per build. Build-time only (it
 * imports the dataset): `.astro` frontmatter and endpoints, never an island.
 */

import { festivals } from '@/lib/festival-data';
import { upcomingFestivals } from '@/lib/filters';
import { toDateString, startOfToday } from '@/lib/dates';
import { buildHubs, groupSeries } from '@/lib/seo';

export const todayIso = toDateString(startOfToday());
export const upcoming = upcomingFestivals(festivals);
export const series = groupSeries(festivals);
export const hubs = buildHubs(upcoming, todayIso);

export const footerHubs = {
  countries: hubs.countries.slice(0, 8),
  genres: hubs.genres.slice(0, 8),
  months: hubs.months,
};
