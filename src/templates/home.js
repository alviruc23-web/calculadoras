const { getCalcs } = require('../data/calculators');
const { localeData } = require('../data/site');
const { t } = require('../data/i18n');

const POPULAR_IDS = ['iva', 'nomina', 'hipoteca', 'imc'];

function calcCard(c, prefix, s, opts) {
  const popular = opts && opts.popular;
  return `
    <a class="calc-card" href="${prefix}${c.slug}/" data-calc-card="${c.id}" data-cat="${c.cat}">
      <span class="card-icon cat-${c.cat}">${c.icon}</span>
      <span class="card-cat">${popular ? s.popularBadge : ''}</span>
      <h3>${c.name}</h3>
      <p>${c.short}</p>
      <span class="card-cta">${s.useCalculator}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </span>
    </a>`;
}

function categoryCard(cat, prefix, count, s) {
  return `
    <a class="cat-card" href="${prefix}categoria/${cat.slug}/">
      <span class="cat-card-icon cat-${cat.id}" aria-hidden="true">${cat.icon}</span>
      <h3>${cat.label}</h3>
      <p>${count} ${count === 1 ? s.calcCountSingular : s.calcCountPlural}</p>
    </a>`;
}

function renderHomeBody(prefix, locale) {
  const { CATEGORIES } = localeData(locale);
  const CALCS = getCalcs(locale);
  const s = t(locale);
  const byId = Object.fromEntries(CALCS.map(c => [c.id, c]));
  const popular = POPULAR_IDS.map(id => byId[id]).filter(Boolean);
  const countByCat = {};
  CALCS.forEach(c => { countByCat[c.cat] = (countByCat[c.cat] || 0) + 1; });

  const popularCards = popular.map(c => calcCard(c, prefix, s, { popular: true })).join('');
  const categoryCards = CATEGORIES.map(cat => categoryCard(cat, prefix, countByCat[cat.id] || 0, s)).join('');
  const allCards = CALCS.map(c => calcCard(c, prefix, s)).join('');
  const chips = CATEGORIES.map(cat => `<button type="button" class="chip" data-cat="${cat.id}" aria-pressed="false">${cat.icon} ${cat.short}</button>`).join('\n    ');

  return `
<main id="main">

<section class="hero">
  <div class="wrap">
    <p class="eyebrow">${s.heroEyebrow.replace('{n}', CALCS.length)}</p>
    <h1>${s.heroH1}</h1>
    <p class="lead">${s.heroLead}</p>
    <form class="hero-search" role="search" action="${prefix}index.html" method="get" data-site-search data-hero-search>
      <label class="sr-only" for="hero-search-input">${s.searchLabel}</label>
      <svg class="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
      <input type="search" id="hero-search-input" name="q" placeholder="${s.heroSearchPlaceholder}" autocomplete="off" aria-expanded="false" aria-controls="hero-search-results" role="combobox" aria-autocomplete="list">
      <button type="submit" class="hero-search-btn">${s.heroSearchButton}</button>
      <div class="hdr-search-results hero-search-results" id="hero-search-results" role="listbox" hidden></div>
    </form>
  </div>
</section>

<div class="wrap" id="search-page">
  <div class="trust-strip" aria-hidden="true">
    ${s.trustBadges.map(b => `<span>✓ ${b}</span>`).join('')}
  </div>

  <section class="popular-section" id="recientes-section" aria-labelledby="recientes-heading" hidden>
    <h2 id="recientes-heading">${s.recentHeading}</h2>
    <div class="grid grid-popular" id="recientes-grid"></div>
  </section>

  <section class="popular-section" aria-labelledby="popular-heading">
    <h2 id="popular-heading">${s.popularHeading}</h2>
    <div class="grid grid-popular">${popularCards}
    </div>
  </section>

  <section class="cat-section" id="categorias" aria-labelledby="cat-heading">
    <h2 id="cat-heading">${s.categoriesHeading}</h2>
    <div class="cat-grid">${categoryCards}
    </div>
  </section>

  <section class="grid-section" id="calculadoras" aria-labelledby="all-heading">
    <h2 id="all-heading">${s.allCalcsHeading}</h2>
    <div class="filters" role="group" aria-label="${s.filterAriaLabel}">
      <button type="button" class="chip on" data-cat="${s.filterAllValue}" aria-pressed="true">${s.filterAllLabel}</button>
      ${chips}
    </div>
    <div class="grid" style="margin-top:20px;">${allCards}
    </div>
    <div id="no-results" class="no-results" style="display:none;">
      <strong>${s.emptyStateHeading}</strong>
      ${s.emptyStateBody}
    </div>
  </section>
</div>

</main>`;
}

function buildHomeStructuredData(locale) {
  const { SITE } = localeData(locale);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.baseUrl,
      description: SITE.description,
      inLanguage: SITE.locale,
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
