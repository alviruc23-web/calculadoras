const { CALCS } = require('../data/calculators');
const { CATEGORIES, SITE } = require('../data/site');

const POPULAR_IDS = ['iva', 'nomina', 'hipoteca', 'imc'];

function renderCard(c, prefix, opts) {
  const popular = opts && opts.popular;
  return `
    <a class="calc-card" href="${prefix}${c.id}/" data-cat="${c.cat}" data-keywords="${(c.name + ' ' + c.short + ' ' + c.keywords).toLowerCase()}">
      <div class="card-icon" style="background:${c.catColor}; color:${c.catText}">${c.icon}</div>
      <div class="card-cat" style="color:${c.catText}">${c.catLabel}${popular ? ' · Popular' : ''}</div>
      <h3>${c.name}</h3>
      <p>${c.short}</p>
      <span class="card-cta">
        Calcular ahora
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </span>
    </a>`;
}

function renderHomeBody(prefix) {
  const byId = Object.fromEntries(CALCS.map(c => [c.id, c]));
  const popular = POPULAR_IDS.map(id => byId[id]).filter(Boolean);
  const cards = CALCS.map(c => renderCard(c, prefix)).join('');
  const popularCards = popular.map(c => renderCard(c, prefix, { popular: true })).join('');
  const chips = CATEGORIES.map(cg => `<button type="button" class="chip" data-cat="${cg.cat}" aria-pressed="false">${cg.label}</button>`).join('\n    ');

  return `
<main id="main">

<section class="hero">
  <div class="wrap">
    <p class="eyebrow">11 calculadoras · gratis · sin registro</p>
    <h1>Calcula lo que necesitas. <span>Resultado inmediato.</span></h1>
    <p class="lead">IVA, finiquito, nómina, hipoteca, préstamo y más. Sin publicidad invasiva, sin letra pequeña.</p>

    <div class="search-wrap">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
      </svg>
      <input type="search" id="search" placeholder="Busca una calculadora…" aria-label="Buscar calculadora">
    </div>
  </div>
</section>

<div class="wrap">
  <div class="ad-slot ad-slot-banner" aria-label="Espacio publicitario">
    <span>Publicidad · 728×90 · AdSense / Red de display</span>
  </div>
</div>

<div class="wrap popular-section">
  <h2>Calculadoras más usadas</h2>
  <div class="grid grid-popular">${popularCards}
  </div>
</div>

<div class="wrap grid-section" id="calculadoras">
  <h2>Todas las calculadoras</h2>
  <div class="filters" role="group" aria-label="Filtrar por categoría">
    <button type="button" class="chip on" data-cat="todas" aria-pressed="true">Todas</button>
    ${chips}
  </div>

  <div class="grid" style="margin-top:20px;">${cards}
  </div>

  <div id="no-results" class="no-results" style="display:none;">
    <strong>Sin resultados para esa búsqueda</strong>
    Prueba con otra palabra: "IVA", "finiquito", "hipoteca"…
  </div>
</div>

<div class="wrap">
  <div class="ad-slot ad-slot-rect" aria-label="Espacio publicitario">
    <span>Publicidad · 300×250 · AdSense / Red de display</span>
  </div>
</div>

</main>`;
}

function buildHomeStructuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.baseUrl,
      description: SITE.tagline,
      inLanguage: 'es-ES',
    },
  ];
}

module.exports = { renderHomeBody, buildHomeStructuredData };
