const { CALCS, CALC_BY_ID } = require('../data/calculators');
const { SITE, CATEGORY_BY_SLUG } = require('../data/site');

const APP_CATEGORY = {
  fiscal: 'FinanceApplication',
  laboral: 'FinanceApplication',
  financiera: 'FinanceApplication',
  matematica: 'UtilitiesApplication',
  salud: 'HealthApplication',
  viaje: 'UtilitiesApplication',
};

function buildStructuredData(c, canonicalUrl, cat) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.baseUrl },
      { '@type': 'ListItem', position: 2, name: cat.label, item: `${SITE.baseUrl}categoria/${cat.slug}/` },
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
      mainEntity: c.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return schemas;
}

function relatedCard(r, prefix) {
  return `
      <a class="related-card" href="${prefix}${r.id}/">
        <span class="card-icon card-icon-sm cat-${r.cat}">${r.icon}</span>
        <span>${r.name}</span>
      </a>`;
}

function renderCalculatorBody(c, prefix) {
  const cat = CATEGORY_BY_SLUG[c.cat];
  const related = (c.related || []).map(id => CALC_BY_ID[id]).filter(Boolean);

  const formulaHtml = c.formula ? `
  <section class="content-block formula-block" aria-labelledby="formula-heading">
    <h2 id="formula-heading">${c.formula.title}</h2>
    <div class="formula-lines">
      ${c.formula.lines.map(l => `<div class="formula-line"><span class="formula-label">${l.label}</span><code>${l.expr}</code></div>`).join('')}
    </div>
    ${c.formula.note ? `<p class="formula-note">${c.formula.note}</p>` : ''}
    ${c.formula.source ? `<p class="formula-source">Fuente: ${c.formula.source}</p>` : ''}
  </section>` : '';

  const exampleHtml = c.example ? `
  <section class="content-block example-block" aria-labelledby="example-heading">
    <h2 id="example-heading">${c.example.title}</h2>
    <p>${c.example.text}</p>
  </section>` : '';

  const tipHtml = c.tip ? `
      <div class="tip-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>
        <p>${c.tip}</p>
      </div>` : '';

  const trustNoteHtml = c.trustNote ? `
      <p class="trust-note">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        ${c.trustNote}
      </p>` : '';

  const faqHtml = (c.faq || []).map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');

  const relatedHtml = related.length ? `
  <section class="related" aria-labelledby="related-heading">
    <h2 id="related-heading">Calculadoras relacionadas</h2>
    <div class="related-grid">${related.map(r => relatedCard(r, prefix)).join('')}
    </div>
  </section>` : '';

  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Migas de pan">
    <a href="${prefix}index.html">Inicio</a>
    <span aria-hidden="true">/</span>
    <a href="${prefix}categoria/${cat.slug}/">${cat.label}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${c.name}</span>
  </nav>
</div>

<section class="calc-hero">
  <div class="wrap">
    <span class="card-icon card-icon-lg cat-${c.cat}">${c.icon}</span>
    <div>
      <h1>${c.h1 || c.name}${c.yearSensitive ? ' ' + SITE.year : ''}</h1>
      <p>${c.intro || c.short}</p>
    </div>
  </div>
</section>

<div class="wrap calc-page-grid">
  <div class="calc-main">
    <div class="calc-panel">
      ${trustNoteHtml}
      <div id="calc-${c.id}" class="calc-mount">
        <noscript><p class="noscript-note">Esta calculadora necesita JavaScript activado para funcionar.</p></noscript>
      </div>
    </div>

    ${formulaHtml}
    ${exampleHtml}

    <section class="content-block faq-block" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Preguntas frecuentes</h2>
      <div class="faq">${faqHtml}</div>
    </section>

    ${relatedHtml}

    <a class="back-link" href="${prefix}categoria/${cat.slug}/">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Más calculadoras de ${cat.label.toLowerCase()}
    </a>
  </div>

  <aside class="calc-side">
    ${tipHtml}
    <div class="side-updated">Contenido y fórmulas revisados en ${SITE.reviewedLabel}.</div>
  </aside>
</div>

</main>
<script>document.addEventListener('DOMContentLoaded',function(){if(window.CalcUI)window.CalcUI.init('${c.id}');});</script>`;
}

module.exports = { renderCalculatorBody, buildStructuredData };
