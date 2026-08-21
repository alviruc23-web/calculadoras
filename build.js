#!/usr/bin/env node
/* ============================================================
   CalcYa — generador estático.
   Lee src/data (contenido) y src/templates (layout), y escribe
   index.html + una carpeta por calculadora (11) en la raíz del
   repo, listas para servirse tal cual en GitHub Pages.
   No usa dependencias externas: solo Node (fs, path).
   Ejecutar con: node build.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const { CALCS } = require('./src/data/calculators');
const { SITE } = require('./src/data/site');
const { pageShell } = require('./src/templates/layout');
const { renderHomeBody, buildHomeStructuredData } = require('./src/templates/home');
const { renderCalculatorBody, buildStructuredData } = require('./src/templates/calculatorPage');

const ROOT = __dirname;

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('  ✓ ' + relPath);
}

function buildHome() {
  const body = renderHomeBody('');
  const html = pageShell(
    {
      title: 'Calculadoras Gratis — IVA, Finiquito, Hipoteca, Nómina y más | CalcYa',
      description: '11 calculadoras gratis para España: IVA, finiquito, nómina, hipoteca, préstamo, ahorro, IMC y más. Sin registro, resultado inmediato.',
      canonicalPath: '',
      depth: 0,
      activePage: 'home',
      structuredData: buildHomeStructuredData(),
    },
    body,
    '<script src="assets/js/home.js"></script>'
  );
  write('index.html', html);
}

function buildCalculatorPage(c) {
  const canonicalUrl = `${SITE.baseUrl}${c.id}/`;
  const body = renderCalculatorBody(c, '../');
  const html = pageShell(
    {
      title: `${c.name} — Gratis y sin registro | CalcYa`,
      description: `${c.short} Calculadora gratuita, sin registro, resultado inmediato.`,
      canonicalPath: `${c.id}/`,
      depth: 1,
      activePage: null,
      structuredData: buildStructuredData(c, canonicalUrl),
    },
    body,
    `<script src="../assets/js/calculators.js"></script>\n<script>CalcYa.initCalculator('${c.id}');</script>`
  );
  write(`${c.id}/index.html`, html);
}

function buildSitemap() {
  const { SITE } = require('./src/data/site');
  const urls = [SITE.baseUrl, ...CALCS.map(c => `${SITE.baseUrl}${c.id}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n')}\n</urlset>\n`;
  write('sitemap.xml', xml);
}

console.log('Generando CalcYa...');
buildHome();
CALCS.forEach(buildCalculatorPage);
buildSitemap();
console.log(`Listo: 1 home + ${CALCS.length} calculadoras.`);
