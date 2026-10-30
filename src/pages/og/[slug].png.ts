/** One share image per festival series, for the lead edition its page shows. */
import type { APIRoute } from 'astro';
import { series, todayIso } from '@/lib/hubs';
import { leadEdition } from '@/lib/seo';
import { ogContent, renderOgImage } from '@/lib/og-image';
import type { Festival } from '@/types/festival';

export function getStaticPaths() {
  return [...series.entries()].map(([slug, editions]) => ({ params: { slug }, props: { editions } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { editions } = props as { editions: Festival[] };
  const png = await renderOgImage(ogContent(leadEdition(editions, todayIso)));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
