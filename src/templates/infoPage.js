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

function renderLegalBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p class="legal-updated">Last updated: ${SITE.reviewedLabel}.</p>

  <h2>1. Site owner</h2>
  <p>${SITE.name} (${SITE.baseUrl}) is an independent, personal project. Full identification of the owner (legal or trade name, tax ID, registered address) is <strong>[pending — to be completed by the site owner]</strong>. Until it is published here, the owner can be reached through <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">the project's public GitHub repository</a>.</p>

  <h2>2. Purpose of this site</h2>
  <p>${SITE.name} offers free, browser-based calculators for everyday use (taxes, payroll, mortgages, health, and more). No account or sign-up is required. Use of the site is also governed by the <a href="${infoPath(prefix, locale, 'terms')}">terms of use</a> and the <a href="${infoPath(prefix, locale, 'privacy')}">privacy policy</a>.</p>

  <h2>3. Hosting</h2>
  <p>The site is static and served through GitHub Pages. There is no application server and no database: every calculation runs in your own browser, as explained in the privacy policy.</p>

  <h2>4. Intellectual property</h2>
  <p>The site's code, design, and editorial content belong to its owner unless stated otherwise. Trademarks, names, or logos of third parties mentioned on the site (for example, government agencies whose public rules a calculator follows) belong to their respective owners and are used solely for informational reference.</p>

  <h2>5. Liability</h2>
  <p>The calculators apply public, standard formulas and rules. Their results are estimates for guidance only and do not replace professional tax, legal, financial, or medical advice. The owner is not liable for decisions made based on these results; see each calculator's own notes for its specific scope and limitations.</p>

  <h2>6. Applicable law</h2>
  <p>This notice is governed by Spanish law. Since the domicile needed to determine jurisdiction is one of the pending items in section 1, the competent courts will be those provided for under applicable law once that information is complete.</p>

  <h2>7. Contact</h2>
  <p>For any question about this notice, visit the <a href="${infoPath(prefix, locale, 'contact')}">contact</a> page.</p>`;
    return shell('Legal Notice', 'Legal Notice', body, prefix, locale);
  }
  const body = `
  <p class="legal-updated">Última actualización: ${SITE.reviewedLabel}.</p>

  <h2>1. Titular del sitio</h2>
  <p>${SITE.name} (${SITE.baseUrl}) es un proyecto independiente y personal. La identificación completa del titular (nombre o razón social, NIF, domicilio) está <strong>[pendiente de completar por el titular]</strong>. Mientras no se publique aquí, puedes contactar con el titular a través de <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">el repositorio público del proyecto en GitHub</a>.</p>

  <h2>2. Objeto del sitio</h2>
  <p>${SITE.name} ofrece calculadoras gratuitas que funcionan en el navegador para el día a día (impuestos, nómina, hipoteca, salud y más). No requiere cuenta ni registro. El uso del sitio se rige también por los <a href="${infoPath(prefix, locale, 'terms')}">términos de uso</a> y la <a href="${infoPath(prefix, locale, 'privacy')}">política de privacidad</a>.</p>

  <h2>3. Alojamiento</h2>
  <p>El sitio es estático y se sirve mediante GitHub Pages. No hay servidor de aplicación ni base de datos: cada cálculo se ejecuta en tu propio navegador, tal como se explica en la política de privacidad.</p>

  <h2>4. Propiedad intelectual</h2>
  <p>El código, el diseño y el contenido editorial de este sitio pertenecen a su titular, salvo que se indique lo contrario. Las marcas, nombres o logotipos de terceros mencionados en el sitio (por ejemplo, organismos públicos cuya normativa sigue alguna calculadora) pertenecen a sus respectivos titulares y se usan únicamente con fines informativos.</p>

  <h2>5. Responsabilidad</h2>
  <p>Las calculadoras aplican fórmulas y criterios públicos y de uso habitual. Sus resultados son orientativos y no sustituyen el asesoramiento fiscal, legal, financiero o médico de un profesional. El titular no se responsabiliza de las decisiones tomadas a partir de estos resultados; consulta las notas propias de cada calculadora para conocer su alcance y limitaciones concretas.</p>

  <h2>6. Legislación aplicable</h2>
  <p>Este aviso se rige por la legislación española. Dado que el domicilio necesario para determinar el fuero es uno de los datos pendientes del punto 1, los juzgados y tribunales competentes serán los que correspondan conforme a la normativa aplicable una vez completado ese dato.</p>

  <h2>7. Contacto</h2>
  <p>Para cualquier duda sobre este aviso, visita la página de <a href="${infoPath(prefix, locale, 'contact')}">contacto</a>.</p>`;
  return shell('Aviso legal', 'Aviso legal', body, prefix, locale);
}

function renderCookiesBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p class="legal-updated">Last updated: ${SITE.reviewedLabel}.</p>

  <h2>1. What this page covers</h2>
  <p>This page lists, in technical detail, what this site stores in your browser. For the legal basis and your rights, see the <a href="${infoPath(prefix, locale, 'privacy')}">privacy policy</a>; this page is a companion reference, not a replacement.</p>

  <h2>2. What we store ourselves</h2>
  <ul class="legal-list">
    <li><strong>Your cookie choice</strong> (<code>calcya-cookie-consent</code>): technically not a cookie but a <code>localStorage</code> entry in your browser, so it's never sent over the network. Remembers whether you accepted or rejected. No expiry date; cleared when you clear this site's browsing data.</li>
    <li><strong>Recently used calculators</strong> (<code>localStorage</code>): powers the "Continue where you left off" shortcut on the home page. Also never leaves your browser.</li>
  </ul>
  <p>Neither of these is a cookie in the strict sense, and both are set regardless of your cookie choice, because they're required for the site to remember your preference and are not used for tracking or advertising.</p>

  <h2>3. Cookies set only if you accept</h2>
  <p>If you accept the cookie notice, two Google services load and may set the cookies below. We don't control their exact names or lifetimes — they belong to Google and can change; this is our best current description.</p>
  <ul class="legal-list">
    <li><strong>Google Analytics</strong> (<code>_ga</code>, <code>_ga_&lt;container-id&gt;</code> and similar): distinguishes visitors and sessions so we can see which calculators are used. Typically expire between 24 hours and 2 years.</li>
    <li><strong>Google AdSense</strong> (<code>__gads</code>, <code>__gpi</code>, and related domains such as <code>doubleclick.net</code>): used to show and measure ads, and to limit how often you see the same one. Google states these can last up to 13 months.</li>
  </ul>

  <h2>4. How to change your choice</h2>
  <p>Use "Cookie preferences" in the footer of any page to reopen the notice and change your decision anytime. You can also manage Google's personalized advertising at <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>, or block cookies entirely from your browser's settings — the calculators keep working either way, since they run locally.</p>

  <h2>5. Contact</h2>
  <p>For any question about cookies, visit the <a href="${infoPath(prefix, locale, 'contact')}">contact</a> page.</p>`;
    return shell('Cookie Policy', 'Cookie Policy', body, prefix, locale);
  }
  const body = `
  <p class="legal-updated">Última actualización: ${SITE.reviewedLabel}.</p>

  <h2>1. Qué cubre esta página</h2>
  <p>Esta página detalla, a nivel técnico, qué guarda este sitio en tu navegador. Para la base legal y tus derechos, consulta la <a href="${infoPath(prefix, locale, 'privacy')}">política de privacidad</a>; esta página es una referencia complementaria, no la sustituye.</p>

  <h2>2. Lo que guardamos nosotros</h2>
  <ul class="legal-list">
    <li><strong>Tu elección sobre cookies</strong> (<code>calcya-cookie-consent</code>): técnicamente no es una cookie sino una entrada de <code>localStorage</code> en tu navegador, así que nunca se envía por red. Recuerda si aceptaste o rechazaste. Sin fecha de caducidad; se borra al eliminar los datos de navegación de este sitio.</li>
    <li><strong>Calculadoras usadas recientemente</strong> (<code>localStorage</code>): alimenta el acceso directo «Continuar donde lo dejaste» de la home. Tampoco sale nunca de tu navegador.</li>
  </ul>
  <p>Ninguna de las dos es una cookie en sentido estricto, y ambas se guardan independientemente de tu elección de cookies, porque son necesarias para que el sitio recuerde tu preferencia y no se usan para seguimiento ni publicidad.</p>

  <h2>3. Cookies que solo se instalan si aceptas</h2>
  <p>Si aceptas el aviso de cookies, se cargan dos servicios de Google que pueden instalar las cookies siguientes. No controlamos sus nombres ni duraciones exactas —son de Google y pueden cambiar—; esta es nuestra mejor descripción actual.</p>
  <ul class="legal-list">
    <li><strong>Google Analytics</strong> (<code>_ga</code>, <code>_ga_&lt;id-contenedor&gt;</code> y similares): distingue visitantes y sesiones para saber qué calculadoras se usan más. Suelen caducar entre 24 horas y 2 años.</li>
    <li><strong>Google AdSense</strong> (<code>__gads</code>, <code>__gpi</code>, y dominios relacionados como <code>doubleclick.net</code>): sirve para mostrar y medir anuncios, y limitar cuántas veces ves el mismo. Google indica que pueden durar hasta 13 meses.</li>
  </ul>

  <h2>4. Cómo cambiar tu elección</h2>
  <p>Usa «Preferencias de cookies» en el pie de cualquier página para reabrir el aviso y cambiar tu decisión cuando quieras. También puedes gestionar la publicidad personalizada de Google en <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>, o bloquear las cookies directamente desde los ajustes de tu navegador —las calculadoras siguen funcionando en cualquier caso, porque se ejecutan en local.</p>

  <h2>5. Contacto</h2>
  <p>Para cualquier duda sobre cookies, visita la página de <a href="${infoPath(prefix, locale, 'contact')}">contacto</a>.</p>`;
  return shell('Política de cookies', 'Política de cookies', body, prefix, locale);
}

function renderTermsBody(prefix, locale) {
  const { SITE } = localeData(locale);
  if (locale === 'en') {
    const body = `
  <p class="legal-updated">Last updated: ${SITE.reviewedLabel}.</p>

  <h2>1. Acceptance</h2>
  <p>Using ${SITE.name} (${SITE.baseUrl}) means you accept these terms. If you disagree with any part, please don't use the site.</p>

  <h2>2. What the service is</h2>
  <p>${SITE.name} is a free set of calculators that run in your browser, with no sign-up and no account. See the <a href="${infoPath(prefix, locale, 'about')}">about</a> page for how they're built and the <a href="${infoPath(prefix, locale, 'privacy')}">privacy policy</a> for what data, if any, is processed.</p>

  <h2>3. Permitted use</h2>
  <p>The site is meant for personal, individual use. Automated bulk scraping, attempts to disrupt the service, or reuse of its content in ways that infringe the intellectual property described in the <a href="${infoPath(prefix, locale, 'legal')}">legal notice</a> are not permitted.</p>

  <h2>4. Nature of the results</h2>
  <p>Every calculator applies public, standard formulas — you can check the exact formula and a worked example on each calculator's page. Results are estimates for general guidance and do not replace professional tax, legal, financial, or medical advice. Some calculators (for example those on Spanish payroll or income tax withholding) note additional specific limitations where relevant.</p>

  <h2>5. Availability and changes</h2>
  <p>${SITE.name} is a personal project maintained without a dedicated support team. Calculators, content, or the service itself may change, be corrected, or be discontinued at any time without prior notice, though we try to keep everything working reliably.</p>

  <h2>6. Intellectual property</h2>
  <p>See the <a href="${infoPath(prefix, locale, 'legal')}">legal notice</a> for ownership of the site's code, design, and content.</p>

  <h2>7. Applicable law</h2>
  <p>These terms are governed by Spanish law, on the same basis described in the <a href="${infoPath(prefix, locale, 'legal')}">legal notice</a>.</p>

  <h2>8. Contact</h2>
  <p>For any question about these terms, visit the <a href="${infoPath(prefix, locale, 'contact')}">contact</a> page.</p>`;
    return shell('Terms of Use', 'Terms of Use', body, prefix, locale);
  }
  const body = `
  <p class="legal-updated">Última actualización: ${SITE.reviewedLabel}.</p>

  <h2>1. Aceptación</h2>
  <p>Usar ${SITE.name} (${SITE.baseUrl}) implica aceptar estos términos. Si no estás de acuerdo con alguna parte, por favor no uses el sitio.</p>

  <h2>2. Qué es el servicio</h2>
  <p>${SITE.name} es un conjunto gratuito de calculadoras que funcionan en tu navegador, sin registro ni cuenta. Consulta la página <a href="${infoPath(prefix, locale, 'about')}">sobre nosotros</a> para saber cómo se construyen y la <a href="${infoPath(prefix, locale, 'privacy')}">política de privacidad</a> para saber qué datos, si acaso, se procesan.</p>

  <h2>3. Uso permitido</h2>
  <p>El sitio está pensado para uso personal e individual. No está permitido el scraping automatizado masivo, los intentos de perjudicar el funcionamiento del servicio, ni la reutilización de su contenido de forma que vulnere la propiedad intelectual descrita en el <a href="${infoPath(prefix, locale, 'legal')}">aviso legal</a>.</p>

  <h2>4. Naturaleza de los resultados</h2>
  <p>Cada calculadora aplica fórmulas y criterios públicos y de uso habitual —puedes consultar la fórmula exacta y un ejemplo resuelto en la página de cada una—. Los resultados son orientativos y no sustituyen el asesoramiento fiscal, legal, financiero o médico de un profesional. Algunas calculadoras (por ejemplo las de nómina o retención de IRPF) indican limitaciones adicionales concretas cuando corresponde.</p>

  <h2>5. Disponibilidad y cambios</h2>
  <p>${SITE.name} es un proyecto personal mantenido sin un equipo de soporte dedicado. Las calculadoras, el contenido o el propio servicio pueden cambiar, corregirse o dejar de estar disponibles en cualquier momento sin aviso previo, aunque procuramos mantenerlo todo funcionando de forma fiable.</p>

  <h2>6. Propiedad intelectual</h2>
  <p>Consulta el <a href="${infoPath(prefix, locale, 'legal')}">aviso legal</a> para conocer la titularidad del código, el diseño y el contenido del sitio.</p>

  <h2>7. Legislación aplicable</h2>
  <p>Estos términos se rigen por la legislación española, en los mismos términos descritos en el <a href="${infoPath(prefix, locale, 'legal')}">aviso legal</a>.</p>

  <h2>8. Contacto</h2>
  <p>Para cualquier duda sobre estos términos, visita la página de <a href="${infoPath(prefix, locale, 'contact')}">contacto</a>.</p>`;
  return shell('Términos de uso', 'Términos de uso', body, prefix, locale);
}

module.exports = { renderAboutBody, renderContactBody, renderPrivacyBody, renderLegalBody, renderCookiesBody, renderTermsBody };
