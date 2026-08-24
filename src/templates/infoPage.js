const { SITE } = require('../data/site');

function shell(title, breadcrumbLabel, bodyHtml, prefix) {
  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Migas de pan">
    <a href="${prefix}index.html">Inicio</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">${breadcrumbLabel}</span>
  </nav>
</div>

<div class="wrap narrow legal-page">
  <h1>${title}</h1>
  ${bodyHtml}
  <a class="back-link" href="${prefix}index.html">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Volver al inicio
  </a>
</div>

</main>`;
}

function renderAboutBody(prefix) {
  const body = `
  <p class="legal-updated">Actualizado en ${SITE.reviewedLabel}.</p>
  <p>${SITE.name} nació de una idea sencilla: las calculadoras que se necesitan en el día a día en España —IVA, nómina, hipoteca— suelen estar repartidas entre webs cargadas de anuncios agresivos, con fórmulas que no se explican y sin indicar de dónde salen los números.</p>
  <p>Este sitio reúne esas calculadoras en un solo lugar, sin registro, mostrando siempre la fórmula que hay detrás del resultado y con un ejemplo resuelto para poder comprobarlo.</p>
  <h2>Cómo se construyen las calculadoras</h2>
  <p>Cada calculadora sigue fórmulas y criterios públicos y de uso habitual en España (escala general del IRPF, sistema de amortización francés para préstamos e hipotecas, rangos de la OMS para el IMC, etc.). El código de cálculo tiene pruebas automáticas que comprueban que los resultados son correctos en casos conocidos y que no falla con datos extremos.</p>
  <h2>Lo que no hacemos</h2>
  <p>No pedimos registro ni datos personales para usar las calculadoras. No enviamos a ningún servidor lo que escribes: los cálculos se hacen en tu propio navegador. Puedes consultar el detalle en la <a href="${prefix}privacidad/">política de privacidad</a>.</p>
  <h2>¿Falta algo o has visto un error?</h2>
  <p>Si detectas un fallo en una fórmula o echas en falta una calculadora, dínoslo a través de la página de <a href="${prefix}contacto/">contacto</a>.</p>`;
  return shell(`Sobre ${SITE.name}`, `Sobre ${SITE.name}`, body, prefix);
}

function renderContactBody(prefix) {
  const body = `
  <p>${SITE.name} es un proyecto pequeño y sin equipo de soporte, así que la vía de contacto es directa: el repositorio público del proyecto en GitHub.</p>
  <ul class="legal-list">
    <li><strong>Errores en una calculadora o en una fórmula:</strong> <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">abre un issue en GitHub</a> indicando la calculadora y los valores que has usado.</li>
    <li><strong>Sugerencias de nuevas calculadoras:</strong> también por <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">GitHub</a>.</li>
    <li><strong>Privacidad y cookies:</strong> consulta la <a href="${prefix}privacidad/">política de privacidad</a>, que incluye el mismo canal de contacto.</li>
  </ul>
  <p>No ofrecemos asesoramiento fiscal, laboral, financiero ni médico personalizado: las calculadoras dan resultados orientativos y generales, no sustituyen a un profesional.</p>`;
  return shell('Contacto', 'Contacto', body, prefix);
}

function renderPrivacyBody(prefix) {
  const body = `
  <p class="legal-updated">Última actualización: ${SITE.reviewedLabel}.</p>

  <h2>1. ¿Quién es el responsable de este sitio?</h2>
  <p>${SITE.name} (${SITE.baseUrl}) es un proyecto independiente. El titular es el operador del dominio y del repositorio indicados en esta página. Para cualquier consulta sobre esta política, escribe en <a href="${SITE.repoUrl}/issues" target="_blank" rel="noopener">el repositorio público del proyecto en GitHub</a>.</p>

  <h2>2. ¿Qué datos recogemos?</h2>
  <p>${SITE.name} no requiere registro ni cuenta. Los datos que introduces en las calculadoras (salario, precio, peso, fechas...) se procesan únicamente en tu navegador: no se envían a ningún servidor ni se almacenan. No recopilamos nombre, correo ni ningún otro dato personal por el uso normal de las calculadoras.</p>

  <h2>3. Cookies, Google Analytics y Google AdSense</h2>
  <p>Al entrar te mostramos un aviso de cookies. <strong>Ningún script de medición o publicidad se carga hasta que aceptas.</strong> Si rechazas, el sitio sigue funcionando con normalidad y solo se guarda tu elección (en tu propio navegador, mediante <code>localStorage</code>).</p>
  <p>Si aceptas, se activan:</p>
  <ul class="legal-list">
    <li><strong>Google Analytics</strong>, para saber qué calculadoras se usan más y mejorar el sitio. Usa direcciones IP anonimizadas.</li>
    <li><strong>Google AdSense</strong>, que muestra anuncios y puede personalizarlos según tu actividad de navegación.</li>
  </ul>
  <p>Ambos son servicios de Google LLC y pueden instalar cookies propias. Puedes cambiar tu decisión cuando quieras desde «Preferencias de cookies» en el pie de página, y gestionar la publicidad personalizada de Google directamente en <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>. Más información en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>

  <h2>4. Otros servicios de terceros</h2>
  <p>Para la tipografía cargamos las fuentes «DM Sans» y «DM Mono» desde los servidores de Google Fonts (<code>fonts.googleapis.com</code> y <code>fonts.gstatic.com</code>). Esto implica que tu navegador contacta con servidores de Google, que puede registrar tu dirección IP según sus propias políticas. Esta carga no depende del aviso de cookies porque no instala cookies de seguimiento.</p>

  <h2>5. Tus derechos</h2>
  <p>Si tratamos datos personales tuyos —por ejemplo, a través de la publicidad de Google una vez aceptada—, tienes derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Puedes ejercerlos a través del canal de contacto del punto 1.</p>

  <h2>6. Cambios en esta política</h2>
  <p>Podemos actualizar esta política si cambia algo relevante en el sitio. La fecha de arriba indica la última revisión.</p>

  <h2>7. Contacto</h2>
  <p>Para cualquier duda sobre privacidad o cookies, visita la página de <a href="${prefix}contacto/">contacto</a>.</p>`;
  return shell('Política de privacidad', 'Política de privacidad', body, prefix);
}

module.exports = { renderAboutBody, renderContactBody, renderPrivacyBody };
