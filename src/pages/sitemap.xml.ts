import type { APIRoute } from 'astro';
import { dataUpdatedAt } from '@/lib/festival-data';
import { hubs, series } from '@/lib/hubs';
import { SITE_URL, lastmodOf, seriesSlug } from '@/lib/seo';

/** Every indexable URL. The planner is per-visitor and stays out (it is noindex). */
export const GET: APIRoute = () => {
  const siteLastmod = dataUpdatedAt?.slice(0, 10) ?? null;
  const urls: { path: string; lastmod: string | null }[] = [
    ...['/', '/map/', '/calendar/', '/list/', '/artists/', '/timeline/', '/festivals/', '/countries/', '/genres/'].map(
      (path) => ({ path, lastmod: siteLastmod }),
    ),
    ...[...hubs.countries, ...hubs.genres, ...hubs.combos].map((hub) => ({
      path: hub.path,
      lastmod: lastmodOf(hub.festivals),
    })),
    ...[...series.values()].map((editions) => ({
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
