const { SITE } = require('../data/site');

function renderPrivacyBody(prefix) {
  return `
<main id="main">

<div class="wrap">
  <nav class="breadcrumb" aria-label="Migas de pan">
    <a href="${prefix}index.html">Inicio</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">Política de privacidad</span>
  </nav>
</div>

<div class="wrap narrow legal-page">
  <h1>Política de privacidad</h1>
  <p class="legal-updated">Última actualización: agosto de 2026.</p>

  <h2>1. ¿Quién es el responsable de este sitio?</h2>
  <p>${SITE.name} (${SITE.baseUrl}) es un proyecto independiente que ofrece calculadoras gratuitas. El titular del sitio es el operador del repositorio y dominio indicados en esta página. Para cualquier consulta relacionada con esta política, puedes escribir un mensaje en <a href="https://github.com/alviruc23-web/calculadoras/issues" target="_blank" rel="noopener">el repositorio público del proyecto en GitHub</a>.</p>

  <h2>2. ¿Qué datos recogemos?</h2>
  <p>${SITE.name} no requiere registro ni cuenta de usuario. Los datos que introduces en las calculadoras (salario, precio, peso, fechas, etc.) se procesan <strong>únicamente en tu navegador</strong>: no se envían a ningún servidor, no se almacenan y desaparecen al cerrar o recargar la página. No recopilamos nombre, correo electrónico, dirección ni ningún otro dato personal a través del uso normal de las calculadoras.</p>

  <h2>3. Cookies y tecnologías similares</h2>
  <p>Al entrar en el sitio te mostramos un aviso para gestionar las cookies. Actualmente ${SITE.name} no instala cookies de análisis ni de publicidad por defecto. Cuando aceptas o rechazas el aviso, guardamos esa preferencia en tu propio navegador (mediante <code>localStorage</code>), no en un servidor, únicamente para no volver a preguntarte en cada página.</p>
  <p>Este sitio está preparado para mostrar en el futuro anuncios de <strong>Google AdSense</strong>. Cuando se activen, Google y sus socios publicitarios podrán instalar cookies para mostrar anuncios personalizados o de medición, pero solo si has dado tu consentimiento a través del aviso de cookies. Puedes cambiar tu decisión en cualquier momento desde el enlace "Preferencias de cookies" del pie de página. Puedes consultar cómo usa Google los datos de los sitios que utilizan sus servicios en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>

  <h2>4. Servicios de terceros</h2>
  <p>Para mostrar la tipografía del sitio cargamos las fuentes "DM Sans" y "DM Mono" desde los servidores de Google Fonts (<code>fonts.googleapis.com</code> y <code>fonts.gstatic.com</code>). Esto implica que tu navegador realiza una petición a los servidores de Google, que puede registrar tu dirección IP según sus propias políticas. No usamos ninguna otra herramienta de terceros mientras Google AdSense no esté activo.</p>

  <h2>5. Tus derechos</h2>
  <p>Si en el futuro llegáramos a tratar datos personales tuyos (por ejemplo, a través de la publicidad de Google AdSense una vez activada), tienes derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Puedes ejercer estos derechos a través del canal de contacto indicado en el punto 1, y también gestionar la publicidad personalizada directamente desde <a href="https://myadcenter.google.com" target="_blank" rel="noopener">myadcenter.google.com</a>.</p>

  <h2>6. Cambios en esta política</h2>
  <p>Podemos actualizar esta política para reflejar cambios en el sitio, por ejemplo al activar Google AdSense. Si el cambio es relevante, lo indicaremos actualizando la fecha de esta página.</p>

  <h2>7. Contacto</h2>
  <p>Para cualquier duda sobre privacidad o cookies, puedes contactar a través de <a href="https://github.com/alviruc23-web/calculadoras/issues" target="_blank" rel="noopener">GitHub</a>.</p>

  <a class="back-link" href="${prefix}index.html">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Volver al inicio
  </a>
</div>

</main>`;
}

module.exports = { renderPrivacyBody };
