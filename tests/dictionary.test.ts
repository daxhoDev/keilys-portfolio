/**
 * The dictionaries. Two things are being protected here.
 *
 * 1. Key parity between Spanish and English. TypeScript already enforces this at
 *    build time, but a runtime check catches a key that exists yet holds an empty
 *    string — which the type system is perfectly happy with.
 *
 * 2. Keily's own words. Her copy is quoted verbatim in specs/12-copy-from-keily.md
 *    and marked KEILY in es.ts. A well-meaning tidy-up of her phrasing is the kind
 *    of change nobody notices in review, so it is pinned here instead.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';
import { LANGS } from '../src/i18n/routes.ts';

type Node = Record<string, unknown>;

/** Every leaf path in the dictionary, e.g. "about.page.facts.0.label". */
function leaves(value: unknown, trail: string[] = []): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => leaves(item, [...trail, String(i)]));
  if (value && typeof value === 'object') {
    return Object.entries(value as Node).flatMap(([key, child]) => leaves(child, [...trail, key]));
  }
  return [trail.join('.')];
}

function at(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Node)?.[key], dict);
}

describe('key parity', () => {
  test('English has exactly the keys Spanish has', () => {
    const esKeys = leaves(es).sort();
    const enKeys = leaves(en).sort();
    assert.deepEqual(
      enKeys.filter((k) => !esKeys.includes(k)),
      [],
      'English has keys Spanish does not',
    );
    assert.deepEqual(
      esKeys.filter((k) => !enKeys.includes(k)),
      [],
      'English is missing keys',
    );
  });

  test('no string is empty or whitespace in either language', () => {
    for (const [lang, dict] of [
      ['es', es],
      ['en', en],
    ] as const) {
      for (const path of leaves(dict)) {
        const value = at(dict, path);
        if (typeof value !== 'string') continue;
        assert.ok(value.trim().length > 0, `${lang}.${path} is empty`);
      }
    }
  });

  test('every leaf is a string or a function, never undefined', () => {
    for (const [lang, dict] of [
      ['es', es],
      ['en', en],
    ] as const) {
      for (const path of leaves(dict)) {
        const value = at(dict, path);
        assert.ok(
          typeof value === 'string' || typeof value === 'function',
          `${lang}.${path} is ${typeof value}`,
        );
      }
    }
  });

  test('the facts list has the same number of rows in both languages', () => {
    assert.equal(en.about.page.facts.length, es.about.page.facts.length);
  });

  test('the long biography has the same number of paragraphs in both languages', () => {
    assert.equal(en.about.page.body.length, es.about.page.body.length);
    assert.equal(es.about.page.body.length, 8, 'her long text is 8 paragraphs');
  });
});

describe("Keily's copy is verbatim", () => {
  test('the hero headline is her approved sentence, in three segments', () => {
    assert.deepEqual(es.hero.headline, ['Hola, soy Keily,', 'y soy', 'fotógrafa.']);
    assert.equal(es.hero.headline.length, 3, 'the third segment is the accented one');
  });

  test('the hero subline is hers, with only Explora -> Exploro changed', () => {
    assert.equal(
      es.hero.subline,
      'Artista autodidacta. Exploro el medio cotidiano en busca de sentido artístico, especialmente mediante las bondades del blanco y negro.',
    );
    assert.ok(!es.hero.subline.includes('Explora '), 'third person was corrected');
  });

  test('the footer tagline keeps her words, with the colon correction', () => {
    assert.equal(es.footer.tagline, 'Las fotografías: epitafios de lo que vivo.');
    assert.ok(!es.footer.tagline.includes(';'), 'the semicolon was corrected');
  });

  test('the About lead and closing line are untouched', () => {
    assert.ok(es.about.lead.startsWith('Soy Keily Mar, fotógrafa autodidacta'));
    assert.ok(es.about.body.at(-1)?.endsWith('Bienvenido a mi mundo.'));
    assert.ok(es.about.page.body.at(-1)?.endsWith('es lo que deseo compartir contigo.'));
  });

  test('the section lines she wrote are untouched', () => {
    assert.equal(
      es.work.lead,
      'Instantáneas de encuentros honestos, entre lo que veo y lo que siento.',
    );
    assert.equal(
      es.contact.lead,
      '¿Deseas contar una historia junto a mí? Estoy a un mensaje de distancia.',
    );
  });

  test('the facts list holds the values she was given to confirm', () => {
    assert.deepEqual(
      es.about.page.facts.map((f) => f.value),
      [
        'Holguín',
        '2020',
        'Calle, mar, animales, eventos culturales, personas',
        'Español e Inglés',
        'Canon PowerShot SX400 IS',
      ],
    );
  });

  test('no invisible characters survive from the pasted source', () => {
    for (const [lang, dict] of [
      ['es', es],
      ['en', en],
    ] as const) {
      for (const path of leaves(dict)) {
        const value = at(dict, path);
        if (typeof value !== 'string') continue;
        // U+00AD soft hyphen, U+200B zero-width space, U+FEFF BOM
        assert.ok(!/[­​﻿]/.test(value), `${lang}.${path} holds an invisible character`);
      }
    }
  });
});

describe('metadata', () => {
  test('descriptions are 140-160 characters in both languages', () => {
    for (const [lang, dict] of [
      ['es', es],
      ['en', en],
    ] as const) {
      for (const page of ['home', 'about', 'work'] as const) {
        const n = dict.meta[page].description.length;
        assert.ok(n >= 140 && n <= 160, `${lang}.meta.${page}.description is ${n} characters`);
      }
    }
  });

  test('descriptions are unique within a language', () => {
    for (const dict of [es, en]) {
      const all = (['home', 'about', 'work'] as const).map((p) => dict.meta[p].description);
      assert.equal(new Set(all).size, all.length, 'a description is duplicated');
    }
  });

  test('the home title is a full sentence, not the "· site name" pattern', () => {
    assert.ok(es.meta.home.title.includes('—'));
    assert.ok(en.meta.home.title.includes('—'));
    assert.ok(!es.meta.home.title.includes('·'));
  });

  test('the site name is the full name in both languages', () => {
    for (const dict of [es, en]) assert.equal(dict.meta.siteName, 'Keily Mar Couselo');
  });
});

describe('interpolated strings', () => {
  test('photoCount agrees with itself in singular and plural', () => {
    for (const dict of [es, en]) {
      assert.ok(dict.work.photoCount(1).includes('1'));
      assert.ok(dict.work.photoCount(12).includes('12'));
      assert.notEqual(dict.work.photoCount(1), dict.work.photoCount(2));
    }
  });

  test('the lightbox counter names both numbers', () => {
    for (const dict of [es, en]) {
      const counter = dict.lightbox.counter(3, 20);
      assert.ok(counter.includes('3') && counter.includes('20'));
    }
  });

  test('the error summary is singular for one and plural for many', () => {
    for (const dict of [es, en]) {
      assert.notEqual(dict.contact.form.errorSummary(1), dict.contact.form.errorSummary(4));
      assert.ok(dict.contact.form.errorSummary(4).includes('4'));
    }
  });
});

describe('the two Instagram accounts', () => {
  test('carry distinct labels, or a screen reader announces the same link twice', () => {
    for (const dict of [es, en]) {
      assert.notEqual(
        dict.contact.socials.instagramGallery,
        dict.contact.socials.instagramPersonal,
      );
    }
  });
});

describe('language coverage', () => {
  test('a dictionary exists for every declared language', async () => {
    const { useTranslations } = await import('../src/i18n/utils.ts');
    for (const lang of LANGS) assert.ok(useTranslations(lang).meta.siteName);
  });
});

describe('typography of the copy itself', () => {
  test('apostrophes are typographic, not straight, in display copy', () => {
    // A straight quote beside a curly one in a Playfair headline reads as a typo.
    // This shipped once: "Hello, I'm Keily," next to "and I’m a".
    for (const [lang, dict] of [
      ['es', es],
      ['en', en],
    ] as const) {
      for (const segment of dict.hero.headline) {
        assert.ok(
          !segment.includes("'"),
          `${lang} headline uses a straight apostrophe: ${segment}`,
        );
      }
      for (const path of leaves(dict)) {
        const value = at(dict, path);
        if (typeof value !== 'string') continue;
        assert.ok(!/\w'\w/.test(value), `${lang}.${path} uses a straight apostrophe`);
      }
    }
  });
});
