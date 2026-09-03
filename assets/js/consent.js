/* ============================================================
   CalcYa — consentimiento de cookies + carga condicional de
   Google Analytics y Google AdSense.

   Ningún script de medición o publicidad se inserta en el DOM
   hasta que el usuario acepta. Si ya aceptó en una visita anterior
   (localStorage), se cargan de inmediato en las siguientes.
   Sin librerías externas.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'calcya-cookie-consent'; // 'accepted' | 'rejected'
  var banner = null;
  var loaded = false;

  // Textos del banner por idioma. El resto del sitio (CalcEngine,
  // CalcUI) sigue el mismo patrón: una tabla ES/EN pequeña en el
  // propio fichero, elegida por `data-locale` en <body>.
  var BANNER_T = {
    es: {
      ariaLabel: 'Aviso de cookies',
      body: 'Usamos cookies propias necesarias para el sitio. Si aceptas, también activamos Google Analytics y Google AdSense, que instalan cookies de medición y publicidad. Puedes cambiar tu decisión cuando quieras desde "Preferencias de cookies" en el pie de página. <a href="{privacyHref}">Más información</a>.',
      reject: 'Rechazar',
      accept: 'Aceptar',
    },
    en: {
      ariaLabel: 'Cookie notice',
      body: 'We use our own cookies required for the site to work. If you accept, we also enable Google Analytics and Google AdSense, which set measurement and advertising cookies. You can change your choice anytime from "Cookie preferences" in the footer. <a href="{privacyHref}">Learn more</a>.',
      reject: 'Reject',
      accept: 'Accept',
    },
  };

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }
  function root() {
    return document.body.getAttribute('data-root') || '';
  }
  function bannerText() {
    var locale = document.body.getAttribute('data-locale') === 'en' ? 'en' : 'es';
    return BANNER_T[locale];
  }
  function privacyHref() {
    return window.CALCYA_PRIVACY_PATH || (root() + 'privacidad/');
  }

  /* ---- carga de Analytics / AdSense, solo si hay consentimiento ---- */

  function loadServices() {
    if (loaded) return;
    var svc = window.CALCYA_SERVICES || {};
    loaded = true;

    if (svc.analyticsId) {
      var gtagSrc = document.createElement('script');
      gtagSrc.async = true;
      gtagSrc.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(svc.analyticsId);
      document.head.appendChild(gtagSrc);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', svc.analyticsId, { anonymize_ip: true });
    }

    if (svc.adsenseClient) {
      var ads = document.createElement('script');
      ads.async = true;
      ads.crossOrigin = 'anonymous';
      ads.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(svc.adsenseClient);
      document.head.appendChild(ads);
    }
  }

  /* ---- banner -------------------------------------------------------- */

  function buildBanner() {
    var s = bannerText();
    var elDiv = document.createElement('div');
    elDiv.className = 'cookie-banner';
    elDiv.setAttribute('role', 'region');
    elDiv.setAttribute('aria-label', s.ariaLabel);
    elDiv.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p>' + s.body.replace('{privacyHref}', privacyHref()) + '</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn-cookie btn-cookie-reject">' + s.reject + '</button>' +
          '<button type="button" class="btn-cookie btn-cookie-accept">' + s.accept + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(elDiv);
    elDiv.querySelector('.btn-cookie-accept').onclick = function () { decide('accepted'); };
    elDiv.querySelector('.btn-cookie-reject').onclick = function () { decide('rejected'); };
    return elDiv;
  }

  function decide(value) {
    setConsent(value);
    if (value === 'accepted') loadServices();
    if (banner) { banner.remove(); banner = null; }
  }

  function showBanner() {
    if (banner) return;
    banner = buildBanner();
    var acceptBtn = banner.querySelector('.btn-cookie-accept');
    if (acceptBtn) acceptBtn.focus();
  }

  // Este script se carga al final de <body> (ver layout.js), así que el
  // DOM ya está completo cuando se ejecuta: no hace falta esperar a
  // DOMContentLoaded. Es importante que NO se espere: la calculadora de
  // cada página se inicializa desde un <script> inline que se coloca
  // ANTES que este fichero y que registra su propio listener de
  // DOMContentLoaded para disparar `calculator_view` — si este bloque
  // se retrasara hasta ese mismo evento, se ejecutaría después (los
  // listeners de un evento se disparan en orden de registro) y
  // `window.gtag` todavía no existiría cuando se registra esa primera
  // vista, perdiéndola siempre. Ejecutando esto de inmediato,
  // `window.gtag` ya existe (si hay consentimiento) antes de que
  // DOMContentLoaded llegue a dispararse.
  var consent = getConsent();
  if (consent === 'accepted') loadServices();
  else if (!consent) showBanner();

  document.querySelectorAll('[data-cookie-preferences]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });
  });

  // Selector de idioma del header: presente en todas las páginas
  // (no solo calculadoras), así que se registra aquí en vez de en
  // calc-ui.js. Solo idiomas (hreflang del propio enlace), nunca
  // contenido introducido por el usuario.
  var langLink = document.querySelector('.lang-switch');
  if (langLink) {
    langLink.addEventListener('click', function () {
      track('language_switched', {
        from_locale: document.body.getAttribute('data-locale') === 'en' ? 'en' : 'es',
        to_locale: langLink.getAttribute('hreflang') || '',
      });
    });
  }

  /* ---- analítica de producto ------------------------------------------
     Eventos de uso del producto: calculator_view, calculator_used,
     result_generated, related_calculator_clicked, language_switched
     (más un par de eventos adicionales de menor entidad: calc_error,
     calc_share_copy, search). Solo se envían si hay consentimiento Y
     Analytics está cargado — si no, no hacen nada. Nunca llevan datos
     introducidos por el usuario (importes, resultados, texto de
     formularios): solo qué calculadora, qué acción y en qué idioma.
     No sustituyen ni amplían lo que ya declara la política de
     privacidad: usan el mismo Google Analytics ya descrito ahí, no un
     servicio nuevo. -------------------------------------------------- */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  window.CalcYaConsent = {
    get: getConsent,
    hasAcceptedAds: function () { return getConsent() === 'accepted'; },
    openPreferences: showBanner,
    track: track,
  };
})();
