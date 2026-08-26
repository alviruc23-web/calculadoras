/* ============================================================
   Tests sobre la SALIDA del build (HTML/sitemap ya generados).
   Se ejecutan con el runner nativo de Node: `npm test` (pretest
   ya corre `node build.js`, así que el HTML está actualizado).
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { SITE } = require('../src/data/site');
const { CALCS } = require('../src/data/calculators');

const readCalc = id => fs.readFileSync(path.join(ROOT, id, 'index.html'), 'utf8');

test('sitemap.xml: 21 URLs, cada una con <lastmod> = SITE.reviewedOn', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = xml.match(/<loc>/g) || [];
  const lastmods = xml.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
  assert.equal(locs.length, 21, 'el sitemap debería tener 21 URLs');
  assert.equal(lastmods.length, locs.length, 'cada <url> debe tener su <lastmod>');
  for (const lm of lastmods) {
    assert.equal(lm, `<lastmod>${SITE.reviewedOn}</lastmod>`, 'lastmod debe coincidir con SITE.reviewedOn, no una fecha inventada');
  }
});

test('Calculadoras yearSensitive: el título y el H1 generados incluyen SITE.year', () => {
  const sensitive = CALCS.filter(c => c.yearSensitive);
  assert.ok(sensitive.length > 0, 'debería haber al menos una calculadora yearSensitive');
  for (const c of sensitive) {
    const html = readCalc(c.id);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(title.includes(String(SITE.year)), `${c.id}: título "${title}" no incluye ${SITE.year}`);
    assert.match(html, new RegExp(`<h1>[^<]*${SITE.year}[^<]*</h1>`), `${c.id}: H1 no incluye ${SITE.year}`);
  }
});

test('Calculadoras no yearSensitive: el título no lleva el año', () => {
  const rest = CALCS.filter(c => !c.yearSensitive);
  for (const c of rest) {
    const html = readCalc(c.id);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(!title.includes(String(SITE.year)), `${c.id}: título "${title}" no debería incluir el año`);
  }
});

test('trust-note: aparece solo en las calculadoras con trustNote definido', () => {
  for (const c of CALCS) {
    const html = readCalc(c.id);
    const hasNote = html.includes('class="trust-note"');
    assert.equal(hasNote, Boolean(c.trustNote), `${c.id}: presencia de trust-note no coincide con su campo trustNote`);
  }
});

test('No quedan referencias a Google Fonts como origen externo en el HTML generado', () => {
  for (const c of CALCS) {
    const html = readCalc(c.id);
    assert.ok(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'), `${c.id}: todavía referencia Google Fonts`);
  }
});
