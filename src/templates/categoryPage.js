const { getCalcs } = require('../data/calculators');
const { localeData } = require('../data/site');
const { t } = require('../data/i18n');

function calcCard(c, prefix, s) {
  return `
    <a class="calc-card" href="${prefix}${c.slug}/">
      <span class="card-icon cat-${c.cat}">${c.icon}</span>
      <h3>${c.name}</h3>
      <p>${c.short}</p>
      <span class="card-cta">${s.useCalculator}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </span>
    </a>`;
}

function siblingCard(sib, prefix) {
  return `
      <a class="related-card" href="${prefix}categoria/${sib.slug}/">
        <span class="card-icon card-icon-sm cat-${sib.id}">${sib.icon}</span>
        <span>${sib.label}</span>
      </a>`;
}

function renderCategoryBody(cat, prefix, locale) {
  const { CATEGORIES } = localeData(locale);
  const CALCS = getCalcs(locale);
  const s = t(locale);
  const items = CALCS.filter(c => c.cat === cat.id);
  const cards = items.map(c => calcCard(c, prefix, s)).join('');
  const siblings = CATEGORIES.filter(c => c.id !== cat.id);
  // Con pocas calculadoras, el grid de 3 columnas deja demasiado hueco
  // vacío en escritorio: se acota el ancho para que no se vea incompleto.
  const gridClass = items.length <= 2 ? 'grid grid-few' : 'grid';

  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="${s.breadcrumbAriaLabel}">
    <a href="${prefix}index.html">${s.breadcrumbHome}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${cat.label}</span>
  </nav>
</div>

<section class="cat-hero">
  <div class="wrap">
    <span class="cat-hero-icon cat-${cat.id}" aria-hidden="true">${cat.icon}</span>
    <h1>${cat.title}</h1>
    <p>${cat.intro || cat.description}</p>
  </div>
</section>

<div class="wrap grid-section">
  <div class="${gridClass}">${cards}
  </div>

  <section class="related" aria-labelledby="other-cats-heading">
    <h2 id="other-cats-heading">${s.otherCategoriesHeading}</h2>
    <div class="related-grid">${siblings.map(sib => siblingCard(sib, prefix)).join('')}
    </div>
  </section>

  <a class="back-link" href="${prefix}index.html#categorias">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    ${s.viewAllCategoriesLink}
  </a>
</div>

</main>`;
}

function buildCategoryStructuredData(cat, canonicalUrl, siteBaseUrl, locale) {
  const s = t(locale);
  const items = getCalcs(locale).filter(c => c.cat === cat.id);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: s.breadcrumbHome, item: siteBaseUrl },
        { '@type': 'ListItem', position: 2, name: cat.label, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: cat.title,
      description: cat.description,
      url: canonicalUrl,
      hasPart: items.map(c => ({ '@type': 'WebApplication', name: c.name, url: `${siteBaseUrl}${c.slug}/` })),
    },
  ];
}

module.exports = { renderCategoryBody, buildCategoryStructuredData };
