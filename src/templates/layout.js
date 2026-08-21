const { CALCS } = require('../data/calculators');
const { SITE, FOOTER_COLUMNS } = require('../data/site');

// depth 0 = index.html en la raíz; depth 1 = páginas dentro de /<id>/
function prefixFor(depth) {
  return depth === 0 ? '' : '../';
}

function renderHeader(depth, activePage) {
  const p = prefixFor(depth);
  return `
<a class="skip-link" href="#main">Saltar al contenido</a>
<header>
  <div class="wrap hdr-in">
    <a href="${p}index.html" class="logo">
      <div class="logo-mark">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="5" height="5" rx="1" fill="white"/>
          <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity=".6"/>
          <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity=".6"/>
          <rect x="9" y="9" width="5" height="5" rx="1" fill="white"/>
        </svg>
      </div>
      ${SITE.name}
    </a>
    <nav class="main-nav" aria-label="Navegación principal">
      <a href="${p}index.html" class="nav-link${activePage === 'home' ? ' on' : ''}"${activePage === 'home' ? ' aria-current="page"' : ''}>Inicio</a>
      <a href="${p}index.html#calculadoras" class="nav-link">Calculadoras</a>
    </nav>
    <div class="spacer"></div>
  </div>
</header>`;
}

function renderFooter(depth) {
  const p = prefixFor(depth);
  const byId = Object.fromEntries(CALCS.map(c => [c.id, c]));
  const cols = FOOTER_COLUMNS.map(col => `
      <div class="foot-col">
        <h2>${col.title}</h2>
        ${col.ids.map(id => `<a href="${p}${id}/">${byId[id].name}</a>`).join('\n        ')}
      </div>`).join('');

  return `
<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="foot-logo">${SITE.name}</div>
        <p>${SITE.tagline}</p>
      </div>${cols}
    </div>
    <div class="foot-bottom">
      <span>© ${SITE.year} ${SITE.name}. Los resultados son orientativos. Consulta siempre a un profesional para decisiones importantes.</span>
    </div>
  </div>
</footer>`;
}

// meta: { title, description, canonicalPath, depth, activePage, bodyClass }
function pageShell(meta, bodyHtml, extraScripts) {
  const p = prefixFor(meta.depth);
  const canonical = SITE.baseUrl + (meta.canonicalPath || '');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta name="google-site-verification" content="OYHROaMHKcjjCctPkQ6btAdgsKgja80-pOEaiZodUyI" />
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='4' fill='%232563EB'/%3E%3Crect x='2' y='2' width='5' height='5' rx='1' fill='white'/%3E%3Crect x='9' y='2' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='2' y='9' width='5' height='5' rx='1' fill='white' opacity='.6'/%3E%3Crect x='9' y='9' width='5' height='5' rx='1' fill='white'/%3E%3C/svg%3E">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${p}assets/css/main.css">
</head>
<body>
${renderHeader(meta.depth, meta.activePage)}
${bodyHtml}
${renderFooter(meta.depth)}
${extraScripts || ''}
</body>
</html>
`;
}

module.exports = { pageShell, prefixFor };
