import type { APIRoute } from 'astro';
import { festivalDataHash, festivalDataJson } from '@/lib/festival-data-file';

export function getStaticPaths() {
  return [{ params: { hash: festivalDataHash } }];
}

export const GET: APIRoute = () =>
  new Response(festivalDataJson, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
