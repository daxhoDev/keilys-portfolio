/**
 * Measures the hero's text contrast against the real photograph.
 *
 * The hero is the one place on the site where text sits on an image, so its contrast
 * depends on which file Keily sends. This composites the hero-veil layers over
 * src/assets/hero.jpg exactly as the browser does — black over black is a plain
 * multiply — and reports the ratio in each region where text actually sits.
 *
 * The veil constants below mirror `@utility hero-veil` in src/styles/global.css.
 * If you change one, change the other; the test that runs this will tell you.
 *
 *   npm run check:hero
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HERO = join(root, 'src/assets/hero.jpg');

const BONE = [0xf2, 0xf1, 0xef];
const MIST = [0xa3, 0xa1, 0x9e];

/** Mirrors @utility hero-veil. Stops are [position, alpha]. */
export const VEIL = {
  flatDim: 0.32,
  vignette: [
    [0.26, 0],
    [0.66, 0.32],
    [1.0, 0.66],
  ],
  top: [
    [0, 0.7],
    [0.14, 0.34],
    [0.34, 0.05],
    [1, 0],
  ],
  bottom: [
    [0, 1],
    [0.06, 1],
    [0.42, 0.58],
    [1, 0],
  ],
};

/**
 * Where text sits in the hero, as fractions of the viewport, with the foreground
 * colour and the AA threshold that applies. The headline is display-size, so 3:1 is
 * the standard — it is held to 4.5:1 anyway, because it is the first thing anyone sees.
 */
export const REGIONS = [
  { name: 'headline', box: [0.05, 0.33, 0.55, 0.7], fg: BONE, min: 4.5 },
  { name: 'subline', box: [0.05, 0.7, 0.5, 0.8], fg: MIST, min: 4.5 },
  { name: 'nav links', box: [0.6, 0.0, 1.0, 0.12], fg: MIST, min: 4.5 },
  { name: 'scroll hint', box: [0.42, 0.85, 0.58, 0.98], fg: MIST, min: 4.5 },
];

const linearise = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]) =>
  0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);

export const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const alphaAt = (stops, t) => {
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, a0] = stops[i];
    const [p1, a1] = stops[i + 1];
    if (t >= p0 && t <= p1) return a0 + ((a1 - a0) * (t - p0)) / (p1 - p0 || 1);
  }
  return t < stops[0][0] ? stops[0][1] : stops.at(-1)[1];
};

export async function measureHero(imagePath = HERO) {
  const W = 320;
  const H = 180; // a 16:9 viewport
  const { data } = await sharp(imagePath)
    .resize(W, H, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const veiled = (x, y) => {
    const i = (y * W + x) * 3;
    let px = [data[i], data[i + 1], data[i + 2]];
    const u = x / W;
    const v = y / H;

    const dx = (u - 0.5) / 0.575;
    const dy = (v - 0.42) / 0.45;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const alphas = [
      VEIL.flatDim,
      alphaAt(VEIL.vignette, distance),
      alphaAt(VEIL.top, v),
      alphaAt(VEIL.bottom, 1 - v),
    ];

    // Every layer is pure black, so compositing is a multiply. Order does not matter.
    for (const alpha of alphas) px = px.map((c) => c * (1 - alpha));
    return px;
  };

  return REGIONS.map(({ name, box: [x0, y0, x1, y1], fg, min }) => {
    let sum = [0, 0, 0];
    let count = 0;
    let brightest = [0, 0, 0];

    for (let y = Math.round(y0 * H); y < Math.round(y1 * H); y++) {
      for (let x = Math.round(x0 * W); x < Math.round(x1 * W); x++) {
        const px = veiled(x, y);
        sum = sum.map((c, i) => c + px[i]);
        count += 1;
        if (luminance(px) > luminance(brightest)) brightest = px;
      }
    }

    const mean = sum.map((c) => c / count);
    return {
      name,
      min,
      mean: contrast(mean, fg),
      worst: contrast(brightest, fg),
      passes: contrast(brightest, fg) >= min,
    };
  });
}

// Run directly: print a report and fail the process if any region is short.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = await measureHero();
  console.log('\nHero contrast, veil composited over src/assets/hero.jpg\n');
  for (const r of results) {
    console.log(
      `  ${r.passes ? 'ok  ' : 'FAIL'} ${r.name.padEnd(13)} ` +
        `mean ${r.mean.toFixed(2)}:1   brightest pixel ${r.worst.toFixed(2)}:1   (needs ${r.min}:1)`,
    );
  }
  const failed = results.filter((r) => !r.passes);
  console.log(
    failed.length
      ? `\n${failed.length} region(s) below AA. Darken the veil in src/styles/global.css, or pick a hero with a calmer top-left.\n`
      : '\nEvery text region clears AA against this photograph.\n',
  );
  process.exit(failed.length ? 1 : 0);
}
