const { CALCS } = require('../data/calculators');
const { SITE, SERVICES, CATEGORIES, INFO_PAGES } = require('../data/site');

// depth = número de carpetas desde la raíz (0 = index.html en la raíz,
// 1 = /calculadora/, 2 = /categoria/<slug>/, etc.)
function prefixFor(depth) {
  return '../'.repeat(depth);
}

/* ---- buscador --------------------------------------------------------
   Índice ligero (id, nombre, descripción corta, palabras clave y URL)
   embebido en cada página como JSON. Lo consume assets/js/search.js
   para las sugerencias del buscador y el filtrado de la home. Al ser
   datos, no HTML, es seguro de serializar sin escapes especiales.
   ------------------------------------------------------------------- */
function buildSearchIndex() {
  return CALCS.map(c => ({
    id: c.id,
    name: c.name,
    short: c.short,
    cat: c.cat,
    catIcon: (CATEGORIES.find(x => x.slug === c.cat) || {}).icon || '',
    kw: (c.name + ' ' + c.short + ' ' + c.keywords).toLowerCase(),
    url: c.id + '/',
  }));
}

function renderHeader(depth, active) {
  const p = prefixFor(depth);
  return `
<a class="skip-link" href="#main">Saltar al contenido</a>
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
    <nav class="main-nav" aria-label="Navegación principal">
      <a href="${p}index.html" class="nav-link${active === 'home' ? ' on' : ''}"${active === 'home' ? ' aria-current="page"' : ''}>Inicio</a>
      <a href="${p}index.html#categorias" class="nav-link">Categorías</a>
    </nav>
    <div class="spacer"></div>
    <form class="hdr-search" role="search" action="${p}index.html" method="get" data-site-search>
      <label class="sr-only" for="hdr-search-input">Buscar una calculadora</label>
      <svg class="hdr-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
      <input type="search" id="hdr-search-input" name="q" placeholder="Buscar: IVA, hipoteca, IMC…" autocomplete="off" aria-expanded="false" aria-controls="hdr-search-results" role="combobox" aria-autocomplete="list">
      <div class="hdr-search-results" id="hdr-search-results" role="listbox" hidden></div>
    </form>
  </div>
</header>`;
}

function renderFooter(depth) {
  const p = prefixFor(depth);
  const byCat = {};
  CALCS.forEach(c => { (byCat[c.cat] = byCat[c.cat] || []).push(c); });

  const cols = CATEGORIES.map(cat => {
    const items = byCat[cat.slug] || [];
    if (!items.length) return '';
    return `
      <div class="foot-col">
        <h2><a href="${p}categoria/${cat.slug}/">${cat.label}</a></h2>
        ${items.map(c => `<a href="${p}${c.id}/">${c.name}</a>`).join('\n        ')}
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
      <span>© ${SITE.year} ${SITE.name}. Los resultados son orientativos; consulta siempre a un profesional para decisiones importantes.</span>
      <button type="button" class="foot-legal-link" data-cookie-preferences>Preferencias de cookies</button>
    </div>
  </div>
</footer>`;
}

function renderJsonLd(schemas) {
  if (!schemas || !schemas.length) return '';
  return schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}

/* meta: { title, description, canonicalPath, depth, activePage, structuredData, noindex } */
function pageShell(meta, bodyHtml, extraScripts) {
  const p = prefixFor(meta.depth);
  const canonical = SITE.baseUrl + (meta.canonicalPath || '');
  const searchIndex = buildSearchIndex();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta name="google-site-verification" content="OYHROaMHKcjjCctPkQ6btAdgsKgja80-pOEaiZodUyI">
<meta name="google-site-verification" content="6f7gKLNnr5KbQwiL-w_ZLKu_xhI1lSNeMac078bkdYE">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${canonical}">
${meta.noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='4' fill='%232563EB'/%3E%3Crect x='2' y='2' width='5' height='5' rx='1' fill='white'/%3E%3Crect x='9' y='2' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='2' y='9' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='9' y='9' width='5' height='5' rx='1' fill='white'/%3E%3C/svg%3E">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="es_ES">
<meta property="og:image" content="${SITE.baseUrl}assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${SITE.baseUrl}assets/img/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${p}assets/css/main.css">
${renderJsonLd(meta.structuredData)}
<script>window.CALCYA_INDEX=${JSON.stringify(searchIndex)};window.CALCYA_ROOT=${JSON.stringify(p)};window.CALCYA_SERVICES=${JSON.stringify(SERVICES)};</script>
</head>
<body data-root="${p}">
${renderHeader(meta.depth, meta.activePage)}
${bodyHtml}
${renderFooter(meta.depth)}
<script src="${p}assets/js/consent.js"></script>
<script src="${p}assets/js/search.js"></script>
${extraScripts || ''}
</body>
</html>
`;
}

module.exports = { pageShell, prefixFor, buildSearchIndex };
