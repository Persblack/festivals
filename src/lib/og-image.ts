/**
 * Per-festival Open Graph images (1200x630 PNG), rendered at build time with
 * satori (layout -> SVG) and resvg (SVG -> PNG). Build-time only: reads fonts
 * from node_modules.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Festival } from '@/types/festival';
import { formatDateRange } from '@/lib/dates';
import { formatPriceRange } from '@/lib/utils';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const PAD_X = 72;
const TITLE_WIDTH = OG_WIDTH - 2 * PAD_X;
/** Vertical room the title gets between the wordmark row and the facts block. */
const TITLE_MAX_HEIGHT = 244;
const TITLE_LINE_HEIGHT = 0.94;
/** Accents on capitals (Ö, Ű, Š) would reach into the line above at 0.94. */
const TITLE_LINE_HEIGHT_ACCENTED = 1.1;
const TITLE_MAX_LINES = 3;
const TITLE_SIZES = [132, 120, 108, 96, 88, 80, 72, 64, 56];

const BLACK = '#000000';
const RED = '#D91A1A';
const BONE = '#F5F5F5';
const MUTED = '#A3A3A3';
const DISPLAY = 'Anton, Anton Ext';
const SANS = 'Inter, Inter Ext';

let fontCache: Font[] | null = null;

function loadFonts(): Font[] {
  if (fontCache) return fontCache;
  // ponytail: satori reads woff but not woff2. fontsource's `exports` map only
  // exposes CSS, so the files are read by path. latin-ext gets its own family
  // name: under a shared name satori uses the first file and draws tofu for Ž.
  const file = (pkg: string, name: string) => readFileSync(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', name));
  const fonts: Font[] = [];
  for (const [subset, suffix] of [['latin', ''], ['latin-ext', ' Ext']]) {
    fonts.push({ name: `Anton${suffix}`, data: file('anton', `anton-${subset}-400-normal.woff`), weight: 400, style: 'normal' });
    for (const weight of [400, 600] as const) {
      fonts.push({ name: `Inter${suffix}`, data: file('inter', `inter-${subset}-${weight}-normal.woff`), weight, style: 'normal' });
    }
  }
  fontCache = fonts;
  return fonts;
}

// Minimal element factory: satori takes React-shaped objects, no JSX needed.
type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } } | string;
function h(type: string, style: Record<string, unknown>, ...children: Node[]): Node {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } };
}

export interface OgContent {
  name: string;
  year: string;
  dates: string;
  place: string;
  genres: string[];
  price: string | null;
}

export function ogContent(f: Festival): OgContent {
  const hasPrice = f.ticket_price_min !== null || f.ticket_price_max !== null;
  return {
    name: f.name,
    // Some names already carry the year ("Festival 2026"); don't print it twice.
    year: f.name.includes(String(f.year)) ? '' : String(f.year),
    dates: formatDateRange(f.start_date, f.end_date),
    place: [f.city, f.country_name].filter(Boolean).join(', '),
    // "Else" is the catch-all bucket, not a genre anyone would read as one.
    genres: f.genres.filter((g) => g !== 'Else').slice(0, 4),
    price: hasPrice ? formatPriceRange(f.ticket_price_min, f.ticket_price_max, f.currency) : null,
  };
}

function titleLineHeight(content: OgContent): number {
  return /\p{M}/u.test(content.name.toUpperCase().normalize('NFD')) ? TITLE_LINE_HEIGHT_ACCENTED : TITLE_LINE_HEIGHT;
}

function titleNode(content: OgContent, size: number, wordBreak: 'normal' | 'break-word'): Node {
  const style = {
    display: 'block',
    width: TITLE_WIDTH,
    fontFamily: DISPLAY,
    fontSize: size,
    lineHeight: titleLineHeight(content),
    color: BONE,
    wordBreak,
  };
  // Uppercased here, not via textTransform, so the fit probe measures the same glyphs (ß -> SS).
  const name = content.name.toUpperCase();
  // No-break space: the year never sits alone on the last line.
  return content.year ? h('div', style, `${name}\u00a0`, h('span', { color: RED }, content.year)) : h('div', style, name);
}

/**
 * Largest title size that fits in TITLE_MAX_LINES lines without a word wider
 * than the box. Measured with satori itself: with `embedFont: false` it emits
 * one `<text x y width>` per word, so lines are the distinct `y` values.
 */
export async function fitTitle(content: OgContent): Promise<{ size: number; lines: number }> {
  const fonts = loadFonts();
  let last = { size: TITLE_SIZES[TITLE_SIZES.length - 1], lines: Infinity };
  for (const size of TITLE_SIZES) {
    const svg = await satori(titleNode(content, size, 'normal') as never, {
      width: TITLE_WIDTH,
      height: 2000,
      fonts,
      embedFont: false,
    });
    const ys = new Set<string>();
    let overflow = false;
    for (const m of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"[^>]*>([^<]*)<\/text>/g)) {
      if (!m[4].trim()) continue;
      ys.add(m[2]);
      if (Number(m[1]) + Number(m[3]) > TITLE_WIDTH + 0.5) overflow = true;
    }
    last = { size, lines: ys.size };
    if (!overflow && ys.size <= TITLE_MAX_LINES && ys.size * size * titleLineHeight(content) <= TITLE_MAX_HEIGHT) return last;
  }
  return last;
}

function pill(text: string, filled: boolean): Node {
  return h(
    'div',
    {
      display: 'flex',
      padding: '7px 18px',
      borderRadius: 9999,
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: 20,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: filled ? '#FFFFFF' : BONE,
      backgroundColor: filled ? RED : '#1A1A1A',
      border: `2px solid ${filled ? RED : '#3D3D3D'}`,
      marginRight: 12,
    },
    text,
  );
}

export async function renderOgSvg(content: OgContent): Promise<string> {
  const fonts = loadFonts();
  const { size } = await fitTitle(content);

  const pills = [
    ...content.genres.map((g, i) => pill(g, i === 0)),
    ...(content.price ? [pill(content.price, false)] : []),
  ];

  // Flat fills only: a gradient doubled the PNG size.
  const body = h(
    'div',
    { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: `52px ${PAD_X}px 48px` },
    h(
      'div',
      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      h('div', { display: 'flex', fontFamily: DISPLAY, fontSize: 48, color: BONE }, 'SYNNERS', h('span', { color: RED }, '.')),
      h('div', { display: 'flex', fontFamily: SANS, fontWeight: 600, fontSize: 20, letterSpacing: 3, color: MUTED }, 'SYNNERS.SI'),
    ),
    // Top padding: capital accents (Ű, Š) rise above Anton's tight line box.
    h('div', { display: 'flex', flexGrow: 1, alignItems: 'center', paddingTop: 24 }, titleNode(content, size, 'break-word')),
    h(
      'div',
      { display: 'flex', flexDirection: 'column' },
      h('div', { display: 'flex', alignItems: 'center' },
        h('div', { display: 'flex', width: 12, height: 12, borderRadius: 9999, backgroundColor: RED, marginRight: 14 }),
        h('div', { display: 'flex', fontFamily: SANS, fontWeight: 600, fontSize: 32, color: BONE }, content.dates),
      ),
      h('div', { display: 'flex', fontFamily: SANS, fontWeight: 400, fontSize: 28, color: MUTED, marginTop: 4, marginLeft: 26 }, content.place),
      ...(pills.length ? [h('div', { display: 'flex', marginTop: 22 }, ...pills)] : []),
    ),
  );
  const root = h(
    'div',
    { display: 'flex', flexDirection: 'column', width: OG_WIDTH, height: OG_HEIGHT, backgroundColor: BLACK },
    body,
    h('div', { display: 'flex', height: 12, backgroundColor: RED }),
  );

  return satori(root as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
}

export async function renderOgImage(content: OgContent): Promise<Buffer> {
  // ponytail: satori already turned all text into paths. Without this, resvg
  // scans every system font on each construction (~100 ms per image).
  const image = new Resvg(await renderOgSvg(content), { font: { loadSystemFonts: false } }).render();
  return encodeRgbPng(image.pixels, image.width, image.height);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

/**
 * ponytail: resvg's own PNG is RGBA with a fixed Sub filter (~60 KB for a long
 * title). The image is opaque, so dropping alpha and using the Up filter
 * (rows repeat almost exactly on flat fills) brings it to ~40 KB.
 */
export function encodeRgbPng(rgba: Uint8Array, width: number, height: number): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 2; // filter type Up
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) raw[row + 1 + x * 3 + c] = rgba[i + c] - (y ? rgba[i - width * 4 + c] : 0);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
