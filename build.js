#!/usr/bin/env node
/* ============================================================
   CalcYa — generador estático.

   Lee src/data (contenido) y src/templates (layout), y escribe
   HTML estático listo para GitHub Pages: la home, una carpeta por
   calculadora, una por categoría y las páginas informativas.

   Sin dependencias externas: solo Node (fs, path).
   Ejecutar con: node build.js  (o  npm run build)

   Escalabilidad: añadir una calculadora nueva es añadir su spec de
   cálculo en assets/js/calc-engine.js y su contenido en
   src/data/calculators.js. Este script se encarga solo de generar
   su página, meterla en su categoría, en el sitemap y en el índice
   de búsqueda — no hay que tocar build.js ni copiar HTML.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const { CALCS } = require('./src/data/calculators');
const { SITE, CATEGORIES, INFO_PAGES } = require('./src/data/site');
const { pageShell, prefixFor } = require('./src/templates/layout');
const { renderHomeBody, buildHomeStructuredData } = require('./src/templates/home');
const { renderCalculatorBody, buildStructuredData } = require('./src/templates/calculatorPage');
const { renderCategoryBody, buildCategoryStructuredData } = require('./src/templates/categoryPage');
const { renderAboutBody, renderContactBody, renderPrivacyBody } = require('./src/templates/infoPage');

const ROOT = __dirname;
const written = [];

/* ---- validación de contenido -----------------------------------------
   Falla pronto y con un mensaje claro si una calculadora nueva tiene un
   campo obligatorio mal puesto, en vez de romperse a mitad de un
   template con un error críptico. Pensado para cuando el catálogo
   crezca y ya no lo revise a mano quien lo añade. ------------------- */
function validateCalcs() {
  const catSlugs = new Set(CATEGORIES.map(c => c.slug));
  const ids = new Set();
  CALCS.forEach(c => {
    const where = `La calculadora "${c.id || '(sin id)'}"`;
    if (!c.id) throw new Error('Hay una calculadora sin "id".');
    if (ids.has(c.id)) throw new Error(`${where} está duplicada.`);
    ids.add(c.id);
    if (!c.name) throw new Error(`${where} no tiene "name".`);
    if (!c.short) throw new Error(`${where} no tiene "short".`);
    if (!c.icon) throw new Error(`${where} no tiene "icon".`);
    if (!c.cat || !catSlugs.has(c.cat)) throw new Error(`${where} tiene una categoría desconocida: "${c.cat}".`);
    if (c.faq && !Array.isArray(c.faq)) throw new Error(`${where} tiene "faq" mal formado (debe ser un array).`);
    if (c.related && !Array.isArray(c.related)) throw new Error(`${where} tiene "related" mal formado (debe ser un array).`);
    (c.related || []).forEach(rid => {
      if (!CALCS.some(x => x.id === rid)) throw new Error(`${where} enlaza a una calculadora relacionada inexistente: "${rid}".`);
    });
  });
}

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  written.push(relPath);
  console.log('  ✓ ' + relPath);
}

function buildHome() {
  const html = pageShell(
    {
      title: `Calculadoras online gratis — IVA, nómina, hipoteca, IMC y más | ${SITE.name}`,
      description: SITE.description,
      canonicalPath: '',
      depth: 0,
      activePage: 'home',
      structuredData: buildHomeStructuredData(),
    },
    renderHomeBody('')
  );
  write('index.html', html);
}

function buildCalculatorPage(c) {
  const cat = CATEGORIES.find(x => x.slug === c.cat);
  if (!cat) throw new Error(`La calculadora "${c.id}" tiene una categoría desconocida: ${c.cat}`);
  const canonicalUrl = `${SITE.baseUrl}${c.id}/`;
  // El año vigente sale solo de SITE.year: cambiar ese único valor basta
  // para actualizar title/H1/meta de todas las calculadoras marcadas
  // como yearSensitive el año que viene.
  const yearTag = c.yearSensitive ? ` ${SITE.year}` : '';
  const html = pageShell(
    {
      title: `${c.name}${yearTag} — Gratis y sin registro | ${SITE.name}`,
      description: `${c.short} Calculadora gratuita${c.yearSensitive ? ` y actualizada a ${SITE.year}` : ''}, sin registro, resultado inmediato.`,
      canonicalPath: `${c.id}/`,
      depth: 1,
      structuredData: buildStructuredData(c, canonicalUrl, cat),
    },
    renderCalculatorBody(c, prefixFor(1)),
    `<script src="${prefixFor(1)}assets/js/calc-engine.js"></script>\n<script src="${prefixFor(1)}assets/js/calc-ui.js"></script>`
  );
  write(`${c.id}/index.html`, html);
}

function buildCategoryPage(cat) {
  const depth = 2; // /categoria/<slug>/
  const canonicalUrl = `${SITE.baseUrl}categoria/${cat.slug}/`;
  const html = pageShell(
    {
      title: `${cat.title} | ${SITE.name}`,
      description: cat.description,
      canonicalPath: `categoria/${cat.slug}/`,
      depth,
      structuredData: buildCategoryStructuredData(cat, canonicalUrl, SITE.baseUrl),
    },
    renderCategoryBody(cat, prefixFor(depth))
  );
  write(`categoria/${cat.slug}/index.html`, html);
}

const INFO_RENDERERS = {
  'sobre-calcya': renderAboutBody,
  contacto: renderContactBody,
  privacidad: renderPrivacyBody,
};

function buildInfoPage(pg) {
  const renderer = INFO_RENDERERS[pg.slug];
  if (!renderer) throw new Error(`Falta el renderer de contenido para la página informativa "${pg.slug}"`);
  const html = pageShell(
    {
      title: `${pg.title} | ${SITE.name}`,
      description: `${pg.title} de ${SITE.name}.`,
      canonicalPath: `${pg.slug}/`,
      depth: 1,
    },
    renderer(prefixFor(1))
  );
  write(`${pg.slug}/index.html`, html);
}

function buildSitemap() {
  const urls = [
    { loc: SITE.baseUrl, priority: '1.0' },
    ...CATEGORIES.map(cat => ({ loc: `${SITE.baseUrl}categoria/${cat.slug}/`, priority: '0.8' })),
    ...CALCS.map(c => ({ loc: `${SITE.baseUrl}${c.id}/`, priority: '0.9' })),
    ...INFO_PAGES.map(pg => ({ loc: `${SITE.baseUrl}${pg.slug}/`, priority: '0.3' })),
  ];
  // lastmod: usamos SITE.reviewedOn (única fecha de revisión de contenido
  // que existe realmente en el proyecto) para todas las URLs por igual.
  // No hay seguimiento de fecha de modificación por página individual,
  // así que aplicar la misma fecha a todas es la representación honesta
  // de lo que sabemos — inventar una fecha distinta por URL sí sería falso.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${SITE.reviewedOn}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join('\n')}\n</urlset>\n`;
  write('sitemap.xml', xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}sitemap.xml\n`;
  write('robots.txt', txt);
}

/* ---- limpieza: elimina carpetas de páginas que ya no existen -------
   (por ejemplo si se renombra o retira una calculadora) para que el
   repositorio nunca acumule HTML huérfano y sin enlazar. */
function cleanOrphans() {
  const known = new Set(['index.html', 'sitemap.xml', 'robots.txt', 'ads.txt', 'CNAME', 'README.md', 'package.json', 'package-lock.json', 'build.js', 'src', 'assets', 'test', 'node_modules', '.git', '.github']);
  CALCS.forEach(c => known.add(c.id));
  INFO_PAGES.forEach(pg => known.add(pg.slug));
  known.add('categoria');

  fs.readdirSync(ROOT, { withFileTypes: true }).forEach(entry => {
    if (entry.name.startsWith('.')) return;
    if (!known.has(entry.name)) {
      console.log('  ⚠ no reconocido en el repo (revisar a mano): ' + entry.name);
    }
  });

  const catDir = path.join(ROOT, 'categoria');
  if (fs.existsSync(catDir)) {
    const knownCats = new Set(CATEGORIES.map(c => c.slug));
    fs.readdirSync(catDir, { withFileTypes: true }).forEach(entry => {
      if (entry.isDirectory() && !knownCats.has(entry.name)) {
        fs.rmSync(path.join(catDir, entry.name), { recursive: true });
        console.log('  ✗ eliminada categoría huérfana: categoria/' + entry.name);
      }
    });
  }
}

console.log(`Generando ${SITE.name}...`);
validateCalcs();
buildHome();
CALCS.forEach(buildCalculatorPage);
CATEGORIES.forEach(buildCategoryPage);
INFO_PAGES.forEach(buildInfoPage);
buildSitemap();
buildRobots();
cleanOrphans();
console.log(`Listo: 1 home + ${CALCS.length} calculadoras + ${CATEGORIES.length} categorías + ${INFO_PAGES.length} páginas informativas = ${written.length} ficheros.`);
