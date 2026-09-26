/* ============================================================
   Guías de contenido evergreen (ver GUIDES/GUIDES_EN en
   src/data/site.js para la regla de cuándo crear una).

   A diferencia de calculatorPage/categoryPage/infoPage, una guía
   puede no existir en el otro idioma — así que esta plantilla no
   asume ningún par ES/EN ni genera hreflang (pageShell ya lo trata
   como opcional; mismo patrón que 404.html).
   ============================================================ */
const { localeData } = require('../data/site');
const { getCalcById } = require('../data/calculators');
const { t } = require('../data/i18n');

function relatedCalcCard(c, prefix) {
  return `
      <a class="related-card" href="${prefix}${c.slug}/" data-calc-id="${c.id}">
        <span class="card-icon card-icon-sm cat-${c.cat}">${c.icon}</span>
        <span>${c.name}</span>
      </a>`;
}

function renderNonResidentMortgageGuide(prefix, locale) {
  const s = t(locale);
  const related = ['hipoteca', 'prestamo'].map(id => getCalcById(locale, id)).filter(Boolean);

  const body = `
  <p class="legal-updated">Written for buyers who are not tax residents in Spain.</p>

  <p>If you're buying property in Spain without living here, the mortgage math itself is the same as for a resident — but a few things around it usually work differently. This guide explains what to expect before you use the calculator.</p>

  <h2>How the monthly payment is calculated</h2>
  <p>Spanish mortgages almost always use the French amortization system: a constant monthly payment where, early on, most of it covers interest and only a small part reduces the principal — that ratio flips gradually as the loan progresses. Our <a href="${prefix}mortgage-calculator/">mortgage calculator</a> uses this same system, so you can see your exact payment and how much you'd pay in total interest over the life of the loan.</p>

  <h2>TIN vs. TAE — read the offer carefully</h2>
  <p>Spanish lenders quote two rates: the <strong>TIN</strong> (nominal interest rate, what the payment calculation above uses) and the <strong>TAE</strong> (the effective rate including fees, linked products, and how often interest compounds). Two offers with the same TIN can end up costing very differently once fees are added — always compare the TAE, not just the TIN, between lenders.</p>

  <h2>What's typically different for non-residents</h2>
  <p>These are general patterns, not fixed rules — every lender sets its own criteria and they change over time, so confirm current terms directly with the bank:</p>
  <ul class="legal-list">
    <li><strong>Lower maximum loan-to-value.</strong> Non-resident applicants are commonly offered a smaller percentage of the property's value than residents, so a larger down payment is usually expected.</li>
    <li><strong>An NIE is required.</strong> The foreigner's tax ID number (NIE) is needed to buy property and open a Spanish bank account, independent of the mortgage itself.</li>
    <li><strong>Extra documentation.</strong> Foreign income and credit history typically need to be translated and, depending on the country, apostilled — plan for this to take longer than a domestic application.</li>
    <li><strong>Non-resident tax obligations.</strong> Owning property in Spain as a non-resident usually comes with its own annual tax filing (separate from the mortgage), which a local gestor or tax advisor can confirm for your situation.</li>
  </ul>

  <h2>Estimate your payment</h2>
  <p>Once you have a TIN quote from a lender, plug the loan amount, term, and rate into the <a href="${prefix}mortgage-calculator/">mortgage calculator</a> — or the <a href="${prefix}loan-calculator/">personal loan calculator</a> if you're comparing a personal loan instead of a mortgage — to see the monthly payment and total interest before you commit.</p>

  <p class="trust-note">This guide is general information, not legal, tax or financial advice. Mortgage criteria for non-residents vary by lender and change over time — confirm current terms with the bank and, for anything tax-related, a qualified advisor.</p>
`;

  const relatedHtml = related.length ? `
  <section class="related" aria-labelledby="related-heading">
    <h2 id="related-heading">${s.relatedHeading}</h2>
    <div class="related-grid">${related.map(c => relatedCalcCard(c, prefix)).join('')}
    </div>
  </section>` : '';

  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="${s.breadcrumbAriaLabel}">
    <a href="${prefix}">${s.breadcrumbHome}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">Non-resident mortgages</span>
  </nav>
</div>

<div class="wrap narrow legal-page">
  <h1>How Mortgages Work for Non-Residents Buying Property in Spain</h1>
  ${body}
</div>

${relatedHtml}

<div class="wrap narrow">
  <a class="back-link" href="${prefix}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    ${s.backToHome}
  </a>
</div>

</main>`;
}

const GUIDE_RENDERERS = {
  nonResidentMortgage: renderNonResidentMortgageGuide,
};

function renderGuideBody(g, prefix, locale) {
  const renderer = GUIDE_RENDERERS[g.id];
  if (!renderer) throw new Error(`Falta el renderer de contenido para la guía "${g.id}"`);
  return renderer(prefix, locale);
}

function buildGuideStructuredData(g, canonicalUrl, locale) {
  const { SITE } = localeData(locale);
  return [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    url: canonicalUrl,
    inLanguage: locale,
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.baseUrl },
  }];
}

module.exports = { renderGuideBody, buildGuideStructuredData };
