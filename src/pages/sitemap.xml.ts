import type { APIRoute } from 'astro';
import { dataUpdatedAt } from '@/lib/festival-data';
import { hubs, series } from '@/lib/hubs';
import { SITE_URL, lastmodOf, seriesSlug } from '@/lib/seo';
import { isThinSeries } from '@/lib/festival-facts';

/** Every indexable URL. The planner and thin festival series are noindex and stay out. */
export const GET: APIRoute = () => {
  const siteLastmod = dataUpdatedAt?.slice(0, 10) ?? null;
  const urls: { path: string; lastmod: string | null }[] = [
    ...['/', '/map/', '/calendar/', '/list/', '/artists/', '/timeline/', '/festivals/', '/countries/', '/genres/', '/months/'].map(
      (path) => ({ path, lastmod: siteLastmod }),
    ),
    ...[...hubs.countries, ...hubs.genres, ...hubs.combos, ...hubs.months].map((hub) => ({
      path: hub.path,
      lastmod: lastmodOf(hub.festivals),
    })),
    // Thin series pages are noindex; listing them here would contradict that.
    ...[...series.values()].filter((editions) => !isThinSeries(editions)).map((editions) => ({
      path: `/festivals/${seriesSlug(editions[0].id)}/`,
      lastmod: lastmodOf(editions),
    })),
  ];

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(({ path, lastmod }) => `<url><loc>${SITE_URL}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
