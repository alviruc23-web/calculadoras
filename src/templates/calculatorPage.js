const { CALCS } = require('../data/calculators');
const { SITE } = require('../data/site');

const APP_CATEGORY = {
  fiscal: 'FinanceApplication',
  laboral: 'FinanceApplication',
  financiera: 'FinanceApplication',
  matematica: 'UtilitiesApplication',
  salud: 'HealthApplication',
  viaje: 'UtilitiesApplication',
};

function buildStructuredData(c, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Calculadoras', item: `${SITE.baseUrl}#calculadoras` },
      { '@type': 'ListItem', position: 3, name: c.name, item: canonicalUrl },
    ],
  };

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: c.name,
    description: c.short,
    url: canonicalUrl,
    applicationCategory: APP_CATEGORY[c.cat] || 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };

  const schemas = [breadcrumb, webApp];

  if (c.faq && c.faq.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return schemas;
}

function renderCalculatorBody(c, prefix) {
  const affHtml = c.aff ? `
      <div class="aff-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>${c.aff.text} <a href="${c.aff.link}" target="_blank" rel="noopener sponsored">${c.aff.linkText}</a></p>
      </div>` : '';

  const faqHtml = c.faq.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');

  const byId = Object.fromEntries(CALCS.map(x => [x.id, x]));
  const related = (c.related || []).map(id => byId[id]).filter(Boolean);
  const relatedHtml = related.length ? `
  <section class="related" aria-labelledby="related-heading">
    <h2 id="related-heading">Calculadoras relacionadas</h2>
    <div class="related-grid">
      ${related.map(r => `
      <a class="related-card" href="${prefix}${r.id}/">
        <div class="card-icon" style="background:${r.catColor}; color:${r.catText}; width:32px; height:32px;">${r.icon}</div>
        <span>${r.name}</span>
      </a>`).join('')}
    </div>
  </section>` : '';

  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Migas de pan">
    <a href="${prefix}index.html">Inicio</a>
    <span aria-hidden="true">/</span>
    <a href="${prefix}index.html#calculadoras">Calculadoras</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${c.name}</span>
  </nav>
</div>

<section class="calc-hero">
  <div class="wrap" style="display:flex; align-items:flex-start; gap:14px;">
    <div class="card-icon" style="background:${c.catColor}; color:${c.catText}">${c.icon}</div>
    <div>
      <h1>${c.name}</h1>
      <p>${c.short}</p>
    </div>
  </div>
</section>

<div class="wrap">
  <div class="calc-panel" id="panel-${c.id}">
    <div class="panel-body" id="body-${c.id}" aria-live="polite">
      <noscript><p>Esta calculadora necesita JavaScript activado para funcionar.</p></noscript>
    </div>
    <div class="info-section">
      ${c.method ? `<div class="method-box"><h2>Cómo se calcula</h2><p>${c.method}</p></div>` : ''}
      ${affHtml}
      <div class="faq" style="margin-top:${(c.method || c.aff) ? '14px' : '0'}">
        <h2>Preguntas frecuentes</h2>
        ${faqHtml}
      </div>
    </div>
  </div>

  <div class="ad-slot ad-slot-rect" aria-label="Espacio publicitario">
    <span>Publicidad · 300×250 · AdSense / Red de display</span>
  </div>
  ${relatedHtml}

  <a class="back-link" href="${prefix}index.html#calculadoras">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Volver a todas las calculadoras
  </a>
</div>

</main>`;
}

module.exports = { renderCalculatorBody, buildStructuredData };
