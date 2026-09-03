const { localeData } = require('../data/site');
const { t } = require('../data/i18n');

// Devuelve la ruta (con prefix) a una página informativa por su `id`
// estable, resuelta al slug correcto del idioma activo.
function infoPath(prefix, locale, id) {
  const { INFO_PAGES } = localeData(locale);
  const pg = INFO_PAGES.find(p => p.id === id);
  return prefix + pg.slug + '/';
}

function shell(title, breadcrumbLabel, bodyHtml, prefix, locale) {
  const s = t(locale);
  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="${s.breadcrumbAriaLabel}">
    <a href="${prefix}index.html">${s.breadcrumbHome}</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${breadcrumbLabel}</span>
  </nav>
</div>

<div class="wrap narrow legal-page">
  <h1>${title}</h1>
  ${bodyHtml}
  <a class="back-link" href="${prefix}index.html">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    ${s.backToHome}
  </a>
</div>

</main>`;
}

function renderAboutBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p class="legal-updated">Updated in ${SITE.reviewedLabel}.</p>
  <p>${SITE.name} started from a simple idea: the calculators people need day-to-day — Spanish VAT, payroll, mortgages — tend to be scattered across sites loaded with aggressive ads, with formulas that are never explained and no indication of where the numbers come from.</p>
  <p>This site brings those calculators together in one place, with no sign-up, always showing the formula behind the result along with a worked example so you can check it yourself.</p>
  <h2>How the calculators are built</h2>
  <p>Every calculator follows public, standard rules (Spain's general IRPF income tax scale, the French amortization system for loans and mortgages, WHO ranges for BMI, and so on). The calculation code has automated tests that check the results are correct in known cases and don't break on extreme input.</p>
  <h2>What we don't do</h2>
  <p>We don't require sign-up or personal data to use the calculators. Nothing you type is sent to any server: the calculations run in your own browser. See the <a href="${infoPath(prefix, locale, 'privacy')}">privacy policy</a> for the details.</p>
  <h2>Missing something or found an error?</h2>
  <p>If you spot a mistake in a formula or a calculator you'd like to see added, let us know through the <a href="${infoPath(prefix, locale, 'contact')}">contact</a> page.</p>`;
    return shell(`About ${SITE.name}`, `About ${SITE.name}`, body, prefix, locale);
  }
  const body = `
  <p class="legal-updated">Actualizado en ${SITE.reviewedLabel}.</p>
  <p>${SITE.name} nació de una idea sencilla: las calculadoras que se necesitan en el día a día en España —IVA, nómina, hipoteca— suelen estar repartidas entre webs cargadas de anuncios agresivos, con fórmulas que no se explican y sin indicar de dónde salen los números.</p>
  <p>Este sitio reúne esas calculadoras en un solo lugar, sin registro, mostrando siempre la fórmula que hay detrás del resultado y con un ejemplo resuelto para poder comprobarlo.</p>
  <h2>Cómo se construyen las calculadoras</h2>
  <p>Cada calculadora sigue fórmulas y criterios públicos y de uso habitual en España (escala general del IRPF, sistema de amortización francés para préstamos e hipotecas, rangos de la OMS para el IMC, etc.). El código de cálculo tiene pruebas automáticas que comprueban que los resultados son correctos en casos conocidos y que no falla con datos extremos.</p>
  <h2>Lo que no hacemos</h2>
  <p>No pedimos registro ni datos personales para usar las calculadoras. No enviamos a ningún servidor lo que escribes: los cálculos se hacen en tu propio navegador. Puedes consultar el detalle en la <a href="${infoPath(prefix, locale, 'privacy')}">política de privacidad</a>.</p>
  <h2>¿Falta algo o has visto un error?</h2>
  <p>Si detectas un fallo en una fórmula o echas en falta una calculadora, dínoslo a través de la página de <a href="${infoPath(prefix, locale, 'contact')}">contacto</a>.</p>`;
  return shell(`Sobre ${SITE.name}`, `Sobre ${SITE.name}`, body, prefix, locale);
}

function renderContactBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p>${SITE.name} is a small project with no support team, so the contact channel is direct: the project's public GitHub repository.</p>
  <ul class="legal-list">
    <li><strong>Errors in a calculator or a formula:</strong> <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">open an issue on GitHub</a>, naming the calculator and the values you used.</li>
    <li><strong>Suggestions for new calculators:</strong> also via <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">GitHub</a>.</li>
    <li><strong>Privacy and cookies:</strong> see the <a href="${infoPath(prefix, locale, 'privacy')}">privacy policy</a>, which includes the same contact channel.</li>
  </ul>
  <p>We don't offer personalized tax, employment, financial or medical advice: the calculators give general, indicative results and don't replace a professional.</p>`;
    return shell('Contact', 'Contact', body, prefix, locale);
  }
  const body = `
  <p>${SITE.name} es un proyecto pequeño y sin equipo de soporte, así que la vía de contacto es directa: el repositorio público del proyecto en GitHub.</p>
  <ul class="legal-list">
    <li><strong>Errores en una calculadora o en una fórmula:</strong> <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">abre un issue en GitHub</a> indicando la calculadora y los valores que has usado.</li>
    <li><strong>Sugerencias de nuevas calculadoras:</strong> también por <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">GitHub</a>.</li>
    <li><strong>Privacidad y cookies:</strong> consulta la <a href="${infoPath(prefix, locale, 'privacy')}">política de privacidad</a>, que incluye el mismo canal de contacto.</li>
  </ul>
  <p>No ofrecemos asesoramiento fiscal, laboral, financiero ni médico personalizado: las calculadoras dan resultados orientativos y generales, no sustituyen a un profesional.</p>`;
  return shell('Contacto', 'Contacto', body, prefix, locale);
}

function renderPrivacyBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p class="legal-updated">Last updated: ${SITE.reviewedLabel}.</p>

  <h2>1. Who is responsible for this site?</h2>
  <p>${SITE.name} (${SITE.baseUrl}) is an independent project. The site is operated by the owner of the domain and repository named on this page. For any question about this policy, write to <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">the project's public GitHub repository</a>.</p>

  <h2>2. What data do we collect?</h2>
  <p>${SITE.name} does not require sign-up or an account. The data you enter into the calculators (salary, price, weight, dates...) is processed only in your browser: it is never sent to a server or stored. We don't collect your name, email or any other personal data through normal use of the calculators.</p>
  <p>The home page remembers which calculators you've used recently to show a shortcut under "Continue where you left off." That history is stored only in your browser (<code>localStorage</code>), is never sent to any server, and you can clear it anytime by clearing this site's data from your browser settings.</p>

  <h2>3. Cookies, Google Analytics and Google AdSense</h2>
  <p>When you arrive, we show a cookie notice. <strong>No measurement or advertising script loads until you accept.</strong> If you decline, the site keeps working normally and only your choice is saved (in your own browser, via <code>localStorage</code>).</p>
  <p>If you accept, we enable:</p>
  <ul class="legal-list">
    <li><strong>Google Analytics</strong>, to see which calculators are used most and improve the site. It uses anonymized IP addresses.</li>
    <li><strong>Google AdSense</strong>, which shows ads and may personalize them based on your browsing activity.</li>
  </ul>
  <p>Both are Google LLC services and may set their own cookies. You can change your choice anytime from "Cookie preferences" in the footer, and manage Google's personalized advertising directly at <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>. More information at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>

  <h2>4. Other third-party services</h2>
  <p>The site's fonts ("DM Sans" and "DM Mono") are served directly from this domain, not from Google Fonts or any other external service: no request to a third party is made to load them.</p>

  <h2>5. Your rights</h2>
  <p>If we process personal data of yours — for example, through Google's advertising once accepted — you have the right to access, rectify, delete, object to, restrict the processing of, and request portability of your data, under EU Regulation 2016/679 (GDPR) and, where applicable, Spanish Organic Law 3/2018 (LOPDGDD). You can exercise these rights through the contact channel in section 1.</p>

  <h2>6. Changes to this policy</h2>
  <p>We may update this policy if something relevant about the site changes. The date above shows the last revision.</p>

  <h2>7. Contact</h2>
  <p>For any question about privacy or cookies, visit the <a href="${infoPath(prefix, locale, 'contact')}">contact</a> page.</p>`;
    return shell('Privacy Policy', 'Privacy Policy', body, prefix, locale);
  }
  const body = `
  <p class="legal-updated">Última actualización: ${SITE.reviewedLabel}.</p>

  <h2>1. ¿Quién es el responsable de este sitio?</h2>
  <p>${SITE.name} (${SITE.baseUrl}) es un proyecto independiente. El titular es el operador del dominio y del repositorio indicados en esta página. Para cualquier consulta sobre esta política, escribe en <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">el repositorio público del proyecto en GitHub</a>.</p>

  <h2>2. ¿Qué datos recogemos?</h2>
  <p>${SITE.name} no requiere registro ni cuenta. Los datos que introduces en las calculadoras (salario, precio, peso, fechas...) se procesan únicamente en tu navegador: no se envían a ningún servidor ni se almacenan. No recopilamos nombre, correo ni ningún otro dato personal por el uso normal de las calculadoras.</p>
  <p>La home recuerda qué calculadoras has usado recientemente para mostrarte un acceso directo en «Continuar donde lo dejaste». Ese historial se guarda solo en tu navegador (<code>localStorage</code>), nunca se envía a ningún servidor, y puedes borrarlo en cualquier momento borrando los datos de este sitio desde los ajustes de tu navegador.</p>

  <h2>3. Cookies, Google Analytics y Google AdSense</h2>
  <p>Al entrar te mostramos un aviso de cookies. <strong>Ningún script de medición o publicidad se carga hasta que aceptas.</strong> Si rechazas, el sitio sigue funcionando con normalidad y solo se guarda tu elección (en tu propio navegador, mediante <code>localStorage</code>).</p>
  <p>Si aceptas, se activan:</p>
  <ul class="legal-list">
    <li><strong>Google Analytics</strong>, para saber qué calculadoras se usan más y mejorar el sitio. Usa direcciones IP anonimizadas.</li>
    <li><strong>Google AdSense</strong>, que muestra anuncios y puede personalizarlos según tu actividad de navegación.</li>
  </ul>
  <p>Ambos son servicios de Google LLC y pueden instalar cookies propias. Puedes cambiar tu decisión cuando quieras desde «Preferencias de cookies» en el pie de página, y gestionar la publicidad personalizada de Google directamente en <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>. Más información en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>

  <h2>4. Otros servicios de terceros</h2>
  <p>Las tipografías del sitio («DM Sans» y «DM Mono») se sirven directamente desde este dominio, no desde Google Fonts ni ningún otro servicio externo: no se realiza ninguna petición a terceros para cargar la tipografía.</p>

  <h2>5. Tus derechos</h2>
  <p>Si tratamos datos personales tuyos —por ejemplo, a través de la publicidad de Google una vez aceptada—, tienes derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Puedes ejercerlos a través del canal de contacto del punto 1.</p>

  <h2>6. Cambios en esta política</h2>
  <p>Podemos actualizar esta política si cambia algo relevante en el sitio. La fecha de arriba indica la última revisión.</p>

  <h2>7. Contacto</h2>
  <p>Para cualquier duda sobre privacidad o cookies, visita la página de <a href="${infoPath(prefix, locale, 'contact')}">contacto</a>.</p>`;
  return shell('Política de privacidad', 'Política de privacidad', body, prefix, locale);
}

module.exports = { renderAboutBody, renderContactBody, renderPrivacyBody };
