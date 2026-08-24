const { CALCS } = require('../data/calculators');

function calcCard(c, prefix) {
  return `
    <a class="calc-card" href="${prefix}${c.id}/">
      <span class="card-icon cat-${c.cat}">${c.icon}</span>
      <h3>${c.name}</h3>
      <p>${c.short}</p>
      <span class="card-cta">Usar calculadora
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </span>
    </a>`;
}

function renderCategoryBody(cat, prefix) {
  const items = CALCS.filter(c => c.cat === cat.slug);
  const cards = items.map(c => calcCard(c, prefix)).join('');

  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Migas de pan">
    <a href="${prefix}index.html">Inicio</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${cat.label}</span>
  </nav>
</div>

<section class="cat-hero">
  <div class="wrap">
    <span class="cat-hero-icon cat-${cat.slug}" aria-hidden="true">${cat.icon}</span>
    <h1>${cat.title}</h1>
    <p>${cat.description}</p>
  </div>
</section>

<div class="wrap grid-section">
  <div class="grid">${cards}
  </div>

  <a class="back-link" href="${prefix}index.html#categorias">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Ver todas las categorías
  </a>
</div>

</main>`;
}

function buildCategoryStructuredData(cat, canonicalUrl, siteBaseUrl) {
  const items = CALCS.filter(c => c.cat === cat.slug);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteBaseUrl },
        { '@type': 'ListItem', position: 2, name: cat.label, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: cat.title,
      description: cat.description,
      url: canonicalUrl,
      hasPart: items.map(c => ({ '@type': 'WebApplication', name: c.name, url: `${siteBaseUrl}${c.id}/` })),
    },
  ];
}

module.exports = { renderCategoryBody, buildCategoryStructuredData };
