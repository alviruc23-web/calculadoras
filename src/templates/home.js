const { CALCS } = require('../data/calculators');
const { CATEGORIES, SITE } = require('../data/site');

const POPULAR_IDS = ['iva', 'nomina', 'hipoteca', 'imc'];

function calcCard(c, prefix, opts) {
  const popular = opts && opts.popular;
  return `
    <a class="calc-card" href="${prefix}${c.id}/" data-calc-card="${c.id}" data-cat="${c.cat}">
      <span class="card-icon cat-${c.cat}">${c.icon}</span>
      <span class="card-cat">${popular ? 'Popular' : ''}</span>
      <h3>${c.name}</h3>
      <p>${c.short}</p>
      <span class="card-cta">Usar calculadora
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </span>
    </a>`;
}

function categoryCard(cat, prefix, count) {
  return `
    <a class="cat-card" href="${prefix}categoria/${cat.slug}/">
      <span class="cat-card-icon cat-${cat.slug}" aria-hidden="true">${cat.icon}</span>
      <h3>${cat.label}</h3>
      <p>${count} ${count === 1 ? 'calculadora' : 'calculadoras'}</p>
    </a>`;
}

function renderHomeBody(prefix) {
  const byId = Object.fromEntries(CALCS.map(c => [c.id, c]));
  const popular = POPULAR_IDS.map(id => byId[id]).filter(Boolean);
  const countByCat = {};
  CALCS.forEach(c => { countByCat[c.cat] = (countByCat[c.cat] || 0) + 1; });

  const popularCards = popular.map(c => calcCard(c, prefix, { popular: true })).join('');
  const categoryCards = CATEGORIES.map(cat => categoryCard(cat, prefix, countByCat[cat.slug] || 0)).join('');
  const allCards = CALCS.map(c => calcCard(c, prefix)).join('');
  const chips = CATEGORIES.map(cat => `<button type="button" class="chip" data-cat="${cat.slug}" aria-pressed="false">${cat.icon} ${cat.short}</button>`).join('\n    ');

  return `
<main id="main">

<section class="hero">
  <div class="wrap">
    <p class="eyebrow">${CALCS.length} calculadoras · gratis · sin registro</p>
    <h1>¿Qué quieres calcular?</h1>
    <p class="lead">Impuestos, nómina, hipoteca, salud y más — con la fórmula y un ejemplo siempre a la vista. Sin publicidad invasiva ni letra pequeña.</p>
    <form class="hero-search" role="search" action="${prefix}index.html" method="get" data-site-search data-hero-search>
      <label class="sr-only" for="hero-search-input">Buscar una calculadora</label>
      <svg class="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
      <input type="search" id="hero-search-input" name="q" placeholder="Busca por nombre: IVA, hipoteca, IMC…" autocomplete="off" aria-expanded="false" aria-controls="hero-search-results" role="combobox" aria-autocomplete="list">
      <button type="submit" class="hero-search-btn">Buscar</button>
      <div class="hdr-search-results hero-search-results" id="hero-search-results" role="listbox" hidden></div>
    </form>
  </div>
</section>

<div class="wrap" id="search-page">
  <div class="trust-strip" aria-hidden="true">
    <span>✓ Sin registro</span><span>✓ Cálculo instantáneo</span><span>✓ Fórmula explicada</span><span>✓ Funciona en el móvil</span>
  </div>

  <section class="popular-section" id="recientes-section" aria-labelledby="recientes-heading" hidden>
    <h2 id="recientes-heading">Continuar donde lo dejaste</h2>
    <div class="grid grid-popular" id="recientes-grid"></div>
  </section>

  <section class="popular-section" aria-labelledby="popular-heading">
    <h2 id="popular-heading">Calculadoras más usadas</h2>
    <div class="grid grid-popular">${popularCards}
    </div>
  </section>

  <section class="cat-section" id="categorias" aria-labelledby="cat-heading">
    <h2 id="cat-heading">Explora por categoría</h2>
    <div class="cat-grid">${categoryCards}
    </div>
  </section>

  <section class="grid-section" id="calculadoras" aria-labelledby="all-heading">
    <h2 id="all-heading">Todas las calculadoras</h2>
    <div class="filters" role="group" aria-label="Filtrar por categoría">
      <button type="button" class="chip on" data-cat="todas" aria-pressed="true">Todas</button>
      ${chips}
    </div>
    <div class="grid" style="margin-top:20px;">${allCards}
    </div>
    <div id="no-results" class="no-results" style="display:none;">
      <strong>Sin resultados para esa búsqueda</strong>
      Prueba con otra palabra: «IVA», «hipoteca», «IMC»…
    </div>
  </section>
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
      description: SITE.description,
      inLanguage: 'es-ES',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.baseUrl,
      sameAs: [SITE.repoUrl],
    },
  ];
}

module.exports = { renderHomeBody, buildHomeStructuredData };
