const { getCalcs } = require('../data/calculators');
const { localeData, SERVICES, SITE: ROOT_SITE } = require('../data/site');
const { t } = require('../data/i18n');

// depth = número de carpetas desde la RAÍZ DEL IDIOMA (0 = index.html en
// la raíz del idioma, 1 = /calculadora/, 2 = /categoria/<slug>/, etc.).
// Es el mismo número tanto en español (raíz del idioma = raíz del sitio)
// como en inglés (raíz del idioma = /en/) — sirve para enlazar páginas
// entre sí dentro del mismo idioma.
function prefixFor(depth) {
  return '../'.repeat(depth);
}

// assets/ vive una sola vez en la raíz REAL del sitio, no se duplica
// bajo /en/. Para inglés hace falta un nivel extra de "../" respecto a
// prefixFor(depth) para escapar de /en/ y llegar a la raíz real.
function assetPrefixFor(depth, locale) {
  return locale === 'en' ? '../' + prefixFor(depth) : prefixFor(depth);
}

/* ---- buscador --------------------------------------------------------
   Índice ligero (id, nombre, descripción corta, palabras clave y URL)
   embebido en cada página como JSON. Lo consume assets/js/search.js
   para las sugerencias del buscador y el filtrado de la home. Al ser
   datos, no HTML, es seguro de serializar sin escapes especiales.

   `id` sigue siendo la clave española estable (para "recientes"), pero
   `url` usa `c.slug`, que en inglés es el slug SEO (enSlug), no `id`.
   ------------------------------------------------------------------- */
function buildSearchIndex(locale) {
  const { CATEGORY_BY_ID } = localeData(locale);
  return getCalcs(locale).map(c => ({
    id: c.id,
    name: c.name,
    short: c.short,
    cat: c.cat,
    catIcon: (CATEGORY_BY_ID[c.cat] || {}).icon || '',
    kw: (c.name + ' ' + c.short + ' ' + (c.keywords || '')).toLowerCase(),
    url: c.slug + '/',
  }));
}

function renderHeader(depth, active, locale, altUrl) {
  const p = prefixFor(depth);
  const { SITE } = localeData(locale);
  const s = t(locale);
  // Enlace directo a la MISMA página en el otro idioma (la URL exacta que
  // ya lleva su propio hreflang alternate) — nunca a la home del otro
  // idioma, así se conserva la calculadora/categoría que se está viendo.
  const langSwitch = altUrl ? `
    <a href="${altUrl}" class="lang-switch" hreflang="${locale === 'es' ? 'en' : 'es'}" aria-label="${s.langSwitchLabel}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/></svg>
      ${s.langSwitchTo}
    </a>` : '';
  return `
<a class="skip-link" href="#main">${s.skipLink}</a>
<header class="site-header">
  <div class="wrap hdr-in">
    <a href="${p}index.html" class="logo">
      <span class="logo-mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1.2" fill="white"/>
          <rect x="9" y="2" width="5" height="5" rx="1.2" fill="white" opacity=".65"/>
          <rect x="2" y="9" width="5" height="5" rx="1.2" fill="white" opacity=".65"/>
          <rect x="9" y="9" width="5" height="5" rx="1.2" fill="white"/>
        </svg>
      </span>
      ${SITE.name}
    </a>
    <nav class="main-nav" aria-label="${s.navAriaLabel}">
      <a href="${p}index.html" class="nav-link${active === 'home' ? ' on' : ''}"${active === 'home' ? ' aria-current="page"' : ''}>${s.navHome}</a>
      <a href="${p}index.html#categorias" class="nav-link">${s.navCategories}</a>
    </nav>
    <div class="spacer"></div>
    <form class="hdr-search" role="search" action="${p}index.html" method="get" data-site-search>
      <label class="sr-only" for="hdr-search-input">${s.searchLabel}</label>
      <svg class="hdr-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
      <input type="search" id="hdr-search-input" name="q" placeholder="${s.searchPlaceholderHeader}" autocomplete="off" aria-expanded="false" aria-controls="hdr-search-results" role="combobox" aria-autocomplete="list">
      <div class="hdr-search-results" id="hdr-search-results" role="listbox" hidden></div>
    </form>${langSwitch}
  </div>
</header>`;
}

function renderFooter(depth, locale) {
  const p = prefixFor(depth);
  const { SITE, CATEGORIES, INFO_PAGES } = localeData(locale);
  const s = t(locale);
  const CALCS = getCalcs(locale);
  const byCat = {};
  CALCS.forEach(c => { (byCat[c.cat] = byCat[c.cat] || []).push(c); });

  const cols = CATEGORIES.map(cat => {
    const items = byCat[cat.id] || [];
    if (!items.length) return '';
    return `
      <div class="foot-col">
        <h2><a href="${p}categoria/${cat.slug}/">${cat.label}</a></h2>
        ${items.map(c => `<a href="${p}${c.slug}/">${c.name}</a>`).join('\n        ')}
      </div>`;
  }).join('');

  const infoLinks = INFO_PAGES.map(pg => `<a href="${p}${pg.slug}/">${pg.navLabel}</a>`).join('\n        ');

  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a href="${p}index.html" class="foot-logo">${SITE.name}</a>
        <p>${SITE.tagline}</p>
      </div>${cols}
      <div class="foot-col">
        <h2>${SITE.name}</h2>
        ${infoLinks}
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${SITE.year} ${SITE.name}. ${s.footerDisclaimer}</span>
      <button type="button" class="foot-legal-link" data-cookie-preferences>${s.cookiePrefs}</button>
    </div>
  </div>
</footer>`;
}

function renderJsonLd(schemas) {
  if (!schemas || !schemas.length) return '';
  return schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}

function renderHreflang(hreflang) {
  if (!hreflang) return '';
  return `<link rel="alternate" hreflang="es" href="${hreflang.es}">
<link rel="alternate" hreflang="en" href="${hreflang.en}">
<link rel="alternate" hreflang="x-default" href="${hreflang.es}">`;
}

/* meta: { title, description, canonicalPath, depth, activePage,
          structuredData, noindex, locale, hreflang:{es,en} } */
function pageShell(meta, bodyHtml, extraScripts) {
  const locale = meta.locale === 'en' ? 'en' : 'es';
  const p = prefixFor(meta.depth);
  const ap = assetPrefixFor(meta.depth, locale);
  const { SITE, INFO_PAGES } = localeData(locale);
  const canonical = SITE.baseUrl + (meta.canonicalPath || '');
  const searchIndex = buildSearchIndex(locale);
  const lang = SITE.locale.split('-')[0];
  const ogLocale = SITE.locale.replace('-', '_');
  const privacyPage = INFO_PAGES.find(pg => pg.id === 'privacy');
  const privacyPath = p + privacyPage.slug + '/';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta name="google-site-verification" content="OYHROaMHKcjjCctPkQ6btAdgsKgja80-pOEaiZodUyI">
<meta name="google-site-verification" content="6f7gKLNnr5KbQwiL-w_ZLKu_xhI1lSNeMac078bkdYE">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${canonical}">
${renderHreflang(meta.hreflang)}
${meta.noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='4' fill='%232563EB'/%3E%3Crect x='2' y='2' width='5' height='5' rx='1' fill='white'/%3E%3Crect x='9' y='2' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='2' y='9' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='9' y='9' width='5' height='5' rx='1' fill='white'/%3E%3C/svg%3E">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:image" content="${ROOT_SITE.baseUrl}assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${ROOT_SITE.baseUrl}assets/img/og-image.png">
<link rel="stylesheet" href="${ap}assets/css/main.css">
${renderJsonLd(meta.structuredData)}
<script>window.CALCYA_INDEX=${JSON.stringify(searchIndex)};window.CALCYA_ROOT=${JSON.stringify(p)};window.CALCYA_SERVICES=${JSON.stringify(SERVICES)};window.CALCYA_LOCALE=${JSON.stringify(locale)};window.CALCYA_PRIVACY_PATH=${JSON.stringify(privacyPath)};</script>
</head>
<body data-root="${p}" data-locale="${locale}">
${renderHeader(meta.depth, meta.activePage, locale, meta.hreflang && meta.hreflang[locale === 'es' ? 'en' : 'es'])}
${bodyHtml}
${renderFooter(meta.depth, locale)}
<script src="${ap}assets/js/consent.js"></script>
<script src="${ap}assets/js/search.js"></script>
${extraScripts || ''}
</body>
</html>
`;
}

module.exports = { pageShell, prefixFor, assetPrefixFor, buildSearchIndex };
