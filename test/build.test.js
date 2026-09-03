/* ============================================================
   Tests sobre la SALIDA del build (HTML/sitemap ya generados, en
   los dos idiomas). Se ejecutan con el runner nativo de Node:
   `npm test` (pretest ya corre `node build.js`, así que el HTML
   está actualizado).
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { SITE, CATEGORIES, INFO_PAGES, localeData } = require('../src/data/site');
const { CALCS, getCalcs } = require('../src/data/calculators');

const readCalc = id => fs.readFileSync(path.join(ROOT, id, 'index.html'), 'utf8');
const readPath = relPath => fs.readFileSync(path.join(ROOT, relPath, 'index.html'), 'utf8');

const PAGES_PER_LOCALE = 1 + CATEGORIES.length + CALCS.length + INFO_PAGES.length;

test('sitemap.xml: 2 idiomas × páginas, cada URL con <lastmod> = SITE.reviewedOn', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = xml.match(/<loc>/g) || [];
  const lastmods = xml.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
  assert.equal(locs.length, PAGES_PER_LOCALE * 2, `el sitemap debería tener ${PAGES_PER_LOCALE * 2} URLs (es + en)`);
  assert.equal(lastmods.length, locs.length, 'cada <url> debe tener su <lastmod>');
  for (const lm of lastmods) {
    assert.equal(lm, `<lastmod>${SITE.reviewedOn}</lastmod>`, 'lastmod debe coincidir con SITE.reviewedOn, no una fecha inventada');
  }
});

test('sitemap.xml: cada URL tiene sus dos alternates hreflang (es y en)', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  assert.equal(blocks.length, PAGES_PER_LOCALE * 2);
  for (const block of blocks) {
    assert.match(block, /hreflang="es"/, 'falta alternate es en: ' + block.slice(0, 80));
    assert.match(block, /hreflang="en"/, 'falta alternate en en: ' + block.slice(0, 80));
  }
});

test('Calculadoras yearSensitive (ES): el título y el H1 generados incluyen SITE.year', () => {
  const sensitive = CALCS.filter(c => c.yearSensitive);
  assert.ok(sensitive.length > 0, 'debería haber al menos una calculadora yearSensitive');
  for (const c of sensitive) {
    const html = readCalc(c.id);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(title.includes(String(SITE.year)), `${c.id}: título "${title}" no incluye ${SITE.year}`);
    assert.match(html, new RegExp(`<h1>[^<]*${SITE.year}[^<]*</h1>`), `${c.id}: H1 no incluye ${SITE.year}`);
  }
});

test('Calculadoras no yearSensitive (ES): el título no lleva el año', () => {
  const rest = CALCS.filter(c => !c.yearSensitive);
  for (const c of rest) {
    const html = readCalc(c.id);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(!title.includes(String(SITE.year)), `${c.id}: título "${title}" no debería incluir el año`);
  }
});

test('trust-note (ES): aparece solo en las calculadoras con trustNote definido', () => {
  for (const c of CALCS) {
    const html = readCalc(c.id);
    const hasNote = html.includes('class="trust-note"');
    assert.equal(hasNote, Boolean(c.trustNote), `${c.id}: presencia de trust-note no coincide con su campo trustNote`);
  }
});

test('No quedan referencias a Google Fonts como origen externo en el HTML generado (ES)', () => {
  for (const c of CALCS) {
    const html = readCalc(c.id);
    assert.ok(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'), `${c.id}: todavía referencia Google Fonts`);
  }
});

/* ---------------------------------------------------------- i18n --- */

test('Cada calculadora tiene un bloque "en" completo (nombre, slug, fórmula, ejemplo, FAQ)', () => {
  const required = ['enSlug', 'name', 'h1', 'short', 'intro', 'formula', 'example', 'faq'];
  for (const c of CALCS) {
    assert.ok(c.en, `${c.id}: sin bloque "en"`);
    for (const k of required) assert.ok(c.en[k], `${c.id}: falta "en.${k}"`);
    assert.equal(c.faq.length, c.en.faq.length, `${c.id}: "faq" y "en.faq" tienen distinto número de preguntas`);
    if (c.tip) assert.ok(c.en.tip, `${c.id}: tiene "tip" pero no "en.tip"`);
    if (c.trustNote) assert.ok(c.en.trustNote, `${c.id}: tiene "trustNote" pero no "en.trustNote"`);
  }
  const slugs = getCalcs('en').map(c => c.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'hay slugs en inglés duplicados');
});

test('Existe una página /en/<slug>/ para cada calculadora, con título y H1 en inglés', () => {
  for (const c of getCalcs('en')) {
    const html = readPath(path.join('en', c.slug));
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.equal(title.startsWith(c.name), true, `en/${c.slug}: título "${title}" no empieza por "${c.name}"`);
    assert.match(html, /<h1>/, `en/${c.slug}: sin H1`);
    if (c.yearSensitive) {
      assert.ok(title.includes(String(SITE.year)), `en/${c.slug}: título yearSensitive sin ${SITE.year}`);
    }
  }
});

test('Cada página en inglés referencia hreflang="es" hacia una URL que existe realmente', () => {
  const { SITE: SITE_EN } = localeData('en');
  for (const c of getCalcs('en')) {
    const html = readPath(path.join('en', c.slug));
    const m = html.match(/<link rel="alternate" hreflang="es" href="([^"]+)">/);
    assert.ok(m, `en/${c.slug}: sin <link hreflang="es">`);
    assert.ok(m[1].startsWith(SITE.baseUrl), `en/${c.slug}: el alternate es no apunta al dominio esperado`);
    const esSlug = m[1].slice(SITE.baseUrl.length).replace(/\/$/, '');
    assert.ok(fs.existsSync(path.join(ROOT, esSlug, 'index.html')), `en/${c.slug}: la página es alternate "${esSlug}" no existe en disco`);
  }
  for (const c of CALCS) {
    const html = readCalc(c.id);
    const m = html.match(/<link rel="alternate" hreflang="en" href="([^"]+)">/);
    assert.ok(m, `${c.id}: sin <link hreflang="en">`);
    assert.ok(m[1].startsWith(SITE_EN.baseUrl), `${c.id}: el alternate en no apunta al dominio /en/ esperado`);
    const enSlug = m[1].slice(SITE_EN.baseUrl.length).replace(/\/$/, '');
    assert.ok(fs.existsSync(path.join(ROOT, 'en', enSlug, 'index.html')), `${c.id}: la página en alternate "en/${enSlug}" no existe en disco`);
  }
});

test('No quedan referencias a Google Fonts como origen externo en el HTML generado (EN)', () => {
  for (const c of getCalcs('en')) {
    const html = readPath(path.join('en', c.slug));
    assert.ok(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'), `en/${c.slug}: todavía referencia Google Fonts`);
  }
});

test('Formato numérico en inglés: sin coma decimal a la española en la página de IVA', () => {
  // Comprobación de humo del refactor de calc-engine.js: el bootstrap de
  // la página en inglés debe llamar a CalcEngine.configure({locale:'en'})
  // antes de CalcUI.init, para que fmt/eur/pct usen notación inglesa.
  const html = readPath('en/vat-calculator');
  assert.match(html, /CalcEngine\.configure\(\{locale:'en'\}\)/, 'la página en inglés no configura el locale del motor de cálculo antes de iniciar la UI');
});

test('Selector de idioma: cada página enlaza a su propia página equivalente, nunca a la home del otro idioma', () => {
  const { SITE: SITE_EN } = localeData('en');
  for (const c of CALCS) {
    const html = readCalc(c.id);
    const switchHref = html.match(/class="lang-switch"[^>]*href="([^"]+)"|href="([^"]+)" class="lang-switch"/);
    const hreflangEn = html.match(/<link rel="alternate" hreflang="en" href="([^"]+)">/)[1];
    assert.ok(switchHref, `${c.id}: sin selector de idioma en el header`);
    const href = switchHref[1] || switchHref[2];
    assert.equal(href, hreflangEn, `${c.id}: el selector de idioma no coincide con el hreflang alternate`);
    assert.notEqual(href, SITE_EN.baseUrl, `${c.id}: el selector de idioma no debe llevar a la home de /en/, sino a la calculadora equivalente`);
  }
  for (const c of getCalcs('en')) {
    const html = readPath(path.join('en', c.slug));
    const switchHref = html.match(/class="lang-switch"[^>]*href="([^"]+)"|href="([^"]+)" class="lang-switch"/);
    const hreflangEs = html.match(/<link rel="alternate" hreflang="es" href="([^"]+)">/)[1];
    assert.ok(switchHref, `en/${c.slug}: sin selector de idioma en el header`);
    const href = switchHref[1] || switchHref[2];
    assert.equal(href, hreflangEs, `en/${c.slug}: el selector de idioma no coincide con el hreflang alternate`);
    assert.notEqual(href, SITE.baseUrl, `en/${c.slug}: el selector de idioma no debe llevar a la home de español, sino a la calculadora equivalente`);
  }
});
