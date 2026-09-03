#!/usr/bin/env node
/* ============================================================
   CalcYa — generador estático.

   Lee src/data (contenido) y src/templates (layout), y escribe
   HTML estático listo para GitHub Pages: la home, una carpeta por
   calculadora, una por categoría y las páginas informativas —
   en español (raíz) y en inglés (/en/).

   Sin dependencias externas: solo Node (fs, path).
   Ejecutar con: node build.js  (o  npm run build)

   Escalabilidad: añadir una calculadora nueva es añadir su spec de
   cálculo en assets/js/calc-engine.js y su contenido (incl. bloque
   `en`) en src/data/calculators.js. Este script se encarga solo de
   generar sus páginas en los dos idiomas, meterla en su categoría,
   en el sitemap y en el índice de búsqueda.

   Idiomas: cada tipo de página se genera una vez por locale
   ('es' en la raíz, 'en' bajo /en/). `getCalcs(locale)` y
   `localeData(locale)` (src/data/calculators.js, src/data/site.js)
   son el único punto de resolución de contenido por idioma; este
   fichero solo decide RUTAS (dónde se escribe cada página) y arma
   el `hreflang` que enlaza cada página con su par en el otro idioma.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const { CALCS, getCalcs, getCalcById } = require('./src/data/calculators');
const { SITE, CATEGORIES, INFO_PAGES, localeData } = require('./src/data/site');
const { pageShell, prefixFor, assetPrefixFor } = require('./src/templates/layout');
const { renderHomeBody, buildHomeStructuredData } = require('./src/templates/home');
const { renderCalculatorBody, buildStructuredData } = require('./src/templates/calculatorPage');
const { renderCategoryBody, buildCategoryStructuredData } = require('./src/templates/categoryPage');
const { renderAboutBody, renderContactBody, renderPrivacyBody } = require('./src/templates/infoPage');
const { t } = require('./src/data/i18n');

const ROOT = __dirname;
const written = [];
const LOCALES = ['es', 'en'];
const otherLocale = l => (l === 'es' ? 'en' : 'es');
// Prefijo de carpeta física en disco (no confundir con prefixFor(depth),
// que es el prefijo relativo '../' usado dentro del HTML).
const dirPrefix = l => (l === 'en' ? 'en/' : '');

/* ---- validación de contenido -----------------------------------------
   Falla pronto y con un mensaje claro si una calculadora nueva tiene un
   campo obligatorio mal puesto, en vez de romperse a mitad de un
   template con un error críptico. Pensado para cuando el catálogo
   crezca y ya no lo revise a mano quien lo añade. ------------------- */
function validateCalcs() {
  const catSlugs = new Set(CATEGORIES.map(c => c.slug));
  const ids = new Set();
  const enSlugs = new Set();
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

    // Bloque en inglés: obligatorio y completo, para no publicar una
    // página /en/ a medio traducir.
    if (!c.en) throw new Error(`${where} no tiene bloque "en".`);
    ['enSlug', 'name', 'h1', 'short', 'intro', 'formula', 'example', 'faq'].forEach(k => {
      if (!c.en[k]) throw new Error(`${where}: falta "en.${k}".`);
    });
    if (c.faq && c.en.faq && c.faq.length !== c.en.faq.length) {
      throw new Error(`${where}: "faq" y "en.faq" tienen distinto número de preguntas.`);
    }
    if (c.tip && !c.en.tip) throw new Error(`${where}: tiene "tip" pero no "en.tip".`);
    if (c.trustNote && !c.en.trustNote) throw new Error(`${where}: tiene "trustNote" pero no "en.trustNote".`);
    if (enSlugs.has(c.en.enSlug)) throw new Error(`${where}: "en.enSlug" duplicado: "${c.en.enSlug}".`);
    enSlugs.add(c.en.enSlug);
  });
}

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  written.push(relPath);
  console.log('  ✓ ' + relPath);
}

function buildHome(locale) {
  const { SITE: S } = localeData(locale);
  const s = t(locale);
  const depth = 0; // home siempre en la raíz DEL IDIOMA (index.html o en/index.html)
  const hreflang = { es: localeData('es').SITE.baseUrl, en: localeData('en').SITE.baseUrl };
  const html = pageShell(
    {
      title: s.homeTitle + ` | ${S.name}`,
      description: S.description,
      canonicalPath: '',
      depth,
      activePage: 'home',
      structuredData: buildHomeStructuredData(locale),
      locale,
      hreflang,
    },
    renderHomeBody('', locale)
  );
  write(`${dirPrefix(locale)}index.html`, html);
}

function buildCalculatorPage(c, locale) {
  const { SITE: S, CATEGORY_BY_ID } = localeData(locale);
  const s = t(locale);
  const cat = CATEGORY_BY_ID[c.cat];
  if (!cat) throw new Error(`La calculadora "${c.id}" tiene una categoría desconocida: ${c.cat}`);
  const canonicalUrl = `${S.baseUrl}${c.slug}/`;

  const other = otherLocale(locale);
  const otherC = getCalcById(other, c.id);
  const otherUrl = `${localeData(other).SITE.baseUrl}${otherC.slug}/`;
  const hreflang = locale === 'es' ? { es: canonicalUrl, en: otherUrl } : { es: otherUrl, en: canonicalUrl };

  // El año vigente sale solo de SITE.year: cambiar ese único valor basta
  // para actualizar title/H1/meta de todas las calculadoras marcadas
  // como yearSensitive el año que viene.
  const yearTag = c.yearSensitive ? ` ${S.year}` : '';
  const depth = 1; // /[en/]<slug>/ — distancia a la raíz DEL IDIOMA, igual en los dos
  const prefix = prefixFor(depth);
  const assetPrefix = assetPrefixFor(depth, locale);
  const html = pageShell(
    {
      title: `${c.name}${yearTag}${s.titleFreeNoSignup} | ${S.name}`,
      description: `${c.short} ${s.calcDescFree}${c.yearSensitive ? `${s.calcDescUpdatedFor}${S.year}` : ''}${s.calcDescNoSignupInstant}`,
      canonicalPath: `${c.slug}/`,
      depth,
      structuredData: buildStructuredData(c, canonicalUrl, cat, locale),
      locale,
      hreflang,
    },
    renderCalculatorBody(c, prefix, locale),
    `<script src="${assetPrefix}assets/js/calc-engine.js"></script>\n<script src="${assetPrefix}assets/js/calc-ui.js"></script>`
  );
  write(`${dirPrefix(locale)}${c.slug}/index.html`, html);
}

function buildCategoryPage(cat, locale) {
  const { SITE: S } = localeData(locale);
  const depth = 2; // /[en/]categoria/<slug>/ — distancia a la raíz del idioma
  const canonicalUrl = `${S.baseUrl}categoria/${cat.slug}/`;

  const other = otherLocale(locale);
  const otherCat = localeData(other).CATEGORIES.find(c => c.id === cat.id);
  const otherUrl = `${localeData(other).SITE.baseUrl}categoria/${otherCat.slug}/`;
  const hreflang = locale === 'es' ? { es: canonicalUrl, en: otherUrl } : { es: otherUrl, en: canonicalUrl };

  const html = pageShell(
    {
      title: `${cat.title} | ${S.name}`,
      description: cat.description,
      canonicalPath: `categoria/${cat.slug}/`,
      depth,
      structuredData: buildCategoryStructuredData(cat, canonicalUrl, S.baseUrl, locale),
      locale,
      hreflang,
    },
    renderCategoryBody(cat, prefixFor(depth), locale)
  );
  write(`${dirPrefix(locale)}categoria/${cat.slug}/index.html`, html);
}

const INFO_RENDERERS = {
  about: renderAboutBody,
  contact: renderContactBody,
  privacy: renderPrivacyBody,
};

function buildInfoPage(pg, locale) {
  const { SITE: S } = localeData(locale);
  const renderer = INFO_RENDERERS[pg.id];
  if (!renderer) throw new Error(`Falta el renderer de contenido para la página informativa "${pg.id}"`);
  const depth = 1; // /[en/]<slug>/ — distancia a la raíz del idioma
  const canonicalUrl = `${S.baseUrl}${pg.slug}/`;

  const other = otherLocale(locale);
  const otherPg = localeData(other).INFO_PAGES.find(p => p.id === pg.id);
  const otherUrl = `${localeData(other).SITE.baseUrl}${otherPg.slug}/`;
  const hreflang = locale === 'es' ? { es: canonicalUrl, en: otherUrl } : { es: otherUrl, en: canonicalUrl };

  const html = pageShell(
    {
      title: `${pg.title} | ${S.name}`,
      description: `${pg.title} — ${S.name}.`,
      canonicalPath: `${pg.slug}/`,
      depth,
      locale,
      hreflang,
    },
    renderer(prefixFor(depth), locale)
  );
  write(`${dirPrefix(locale)}${pg.slug}/index.html`, html);
}

function buildSitemap() {
  const urls = [];
  LOCALES.forEach(locale => {
    const { SITE: S, CATEGORIES: CATS, INFO_PAGES: PAGES } = localeData(locale);
    const other = otherLocale(locale);
    const altBase = localeData(other).SITE.baseUrl;

    urls.push({ loc: S.baseUrl, priority: '1.0', hreflang: { [locale]: S.baseUrl, [other]: altBase } });

    CATS.forEach(cat => {
      const otherCat = localeData(other).CATEGORIES.find(c => c.id === cat.id);
      urls.push({
        loc: `${S.baseUrl}categoria/${cat.slug}/`,
        priority: '0.8',
        hreflang: { [locale]: `${S.baseUrl}categoria/${cat.slug}/`, [other]: `${altBase}categoria/${otherCat.slug}/` },
      });
    });

    getCalcs(locale).forEach(c => {
      const otherC = getCalcById(other, c.id);
      urls.push({
        loc: `${S.baseUrl}${c.slug}/`,
        priority: '0.9',
        hreflang: { [locale]: `${S.baseUrl}${c.slug}/`, [other]: `${altBase}${otherC.slug}/` },
      });
    });

    PAGES.forEach(pg => {
      const otherPg = localeData(other).INFO_PAGES.find(p => p.id === pg.id);
      urls.push({
        loc: `${S.baseUrl}${pg.slug}/`,
        priority: '0.3',
        hreflang: { [locale]: `${S.baseUrl}${pg.slug}/`, [other]: `${altBase}${otherPg.slug}/` },
      });
    });
  });

  // lastmod: usamos SITE.reviewedOn (única fecha de revisión de contenido
  // que existe realmente en el proyecto) para todas las URLs por igual.
  // No hay seguimiento de fecha de modificación por página individual,
  // así que aplicar la misma fecha a todas es la representación honesta
  // de lo que sabemos — inventar una fecha distinta por URL sí sería falso.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map(u => {
    const alt = Object.keys(u.hreflang).sort().map(l =>
      `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${u.hreflang[l]}"/>`
    ).join('');
    return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${SITE.reviewedOn}</lastmod>\n    <priority>${u.priority}</priority>${alt}\n  </url>`;
  }).join('\n')}\n</urlset>\n`;
  write('sitemap.xml', xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}sitemap.xml\n`;
  write('robots.txt', txt);
}

/* ---- limpieza: elimina carpetas de páginas que ya no existen -------
   (por ejemplo si se renombra o retira una calculadora) para que el
   repositorio nunca acumule HTML huérfano y sin enlazar. Conservador
   a propósito: a nivel de raíz (y de raíz de en/) solo avisa; borra
   automáticamente solo dentro de categoria/ (y en/categoria/), donde
   el riesgo de eliminar algo añadido a mano es mucho menor. --------- */
function cleanOrphans() {
  const enData = localeData('en');

  const known = new Set(['index.html', 'sitemap.xml', 'robots.txt', 'ads.txt', 'CNAME', 'README.md', 'package.json', 'package-lock.json', 'build.js', 'src', 'assets', 'test', 'node_modules', '.git', '.github', 'en']);
  CALCS.forEach(c => known.add(c.slug));
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

  const enRoot = path.join(ROOT, 'en');
  if (fs.existsSync(enRoot)) {
    const enKnown = new Set(['categoria', 'index.html']);
    getCalcs('en').forEach(c => enKnown.add(c.slug));
    enData.INFO_PAGES.forEach(pg => enKnown.add(pg.slug));

    fs.readdirSync(enRoot, { withFileTypes: true }).forEach(entry => {
      if (entry.name.startsWith('.')) return;
      if (!enKnown.has(entry.name)) {
        console.log('  ⚠ no reconocido en en/ (revisar a mano): ' + entry.name);
      }
    });

    const enCatDir = path.join(enRoot, 'categoria');
    if (fs.existsSync(enCatDir)) {
      const knownEnCats = new Set(enData.CATEGORIES.map(c => c.slug));
      fs.readdirSync(enCatDir, { withFileTypes: true }).forEach(entry => {
        if (entry.isDirectory() && !knownEnCats.has(entry.name)) {
          fs.rmSync(path.join(enCatDir, entry.name), { recursive: true });
          console.log('  ✗ eliminada categoría huérfana: en/categoria/' + entry.name);
        }
      });
    }
  }
}

console.log(`Generando ${SITE.name}...`);
validateCalcs();
LOCALES.forEach(locale => {
  buildHome(locale);
  getCalcs(locale).forEach(c => buildCalculatorPage(c, locale));
  localeData(locale).CATEGORIES.forEach(cat => buildCategoryPage(cat, locale));
  localeData(locale).INFO_PAGES.forEach(pg => buildInfoPage(pg, locale));
});
buildSitemap();
buildRobots();
cleanOrphans();
console.log(`Listo: ${LOCALES.length} idiomas × (1 home + ${CALCS.length} calculadoras + ${CATEGORIES.length} categorías + ${INFO_PAGES.length} páginas informativas) = ${written.length} ficheros.`);
