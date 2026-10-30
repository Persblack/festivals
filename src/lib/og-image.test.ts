import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { encodeRgbPng, fitTitle, renderOgImage, type OgContent } from './og-image';

const longest: OgContent = {
  name: 'Der böhmische Traum - Internationales Blasmusikfestival',
  year: '2027',
  dates: 'Jul 30 - Aug 2, 2027',
  place: 'Žúr, Czechia',
  genres: ['Folk'],
  price: null,
};

describe('encodeRgbPng', () => {
  it('round-trips the pixels through the Up filter', () => {
    const w = 3;
    const h = 2;
    const rgba = Uint8Array.from({ length: w * h * 4 }, (_, i) => (i % 4 === 3 ? 255 : (i * 37) % 256));
    const png = encodeRgbPng(rgba, w, h);
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(w);
    expect(png.readUInt32BE(20)).toBe(h);

    const idatLength = png.readUInt32BE(33);
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    const stride = w * 3;
    const decoded: number[] = [];
    for (let y = 0; y < h; y++) {
      expect(raw[y * (stride + 1)]).toBe(2);
      for (let x = 0; x < stride; x++) {
        const above = y ? decoded[(y - 1) * stride + x] : 0;
        decoded.push((raw[y * (stride + 1) + 1 + x] + above) & 0xff);
      }
    }
    const rgb = [...rgba].filter((_, i) => i % 4 !== 3);
    expect(decoded).toEqual(rgb);
  });
});

describe('fitTitle', () => {
  it('steps the size down until the longest name fits in three lines', async () => {
    const fit = await fitTitle(longest);
    expect(fit.lines).toBeLessThanOrEqual(3);
    expect(fit.size).toBeLessThan(132);
  });

  it('keeps a short name at the largest size on one line', async () => {
    expect(await fitTitle({ ...longest, name: 'Pohoda' })).toEqual({ size: 132, lines: 1 });
  });
});

describe('renderOgImage', () => {
  it('renders a 1200x630 PNG well under 60 KB for the longest name', async () => {
    const png = await renderOgImage(longest);
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(png.length).toBeLessThan(60_000);
  });
});
