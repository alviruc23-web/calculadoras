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

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }
  function root() {
    return document.body.getAttribute('data-root') || '';
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
    var elDiv = document.createElement('div');
    elDiv.className = 'cookie-banner';
    elDiv.setAttribute('role', 'region');
    elDiv.setAttribute('aria-label', 'Aviso de cookies');
    elDiv.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p>Usamos cookies propias necesarias para el sitio. Si aceptas, también activamos Google Analytics y Google AdSense, que instalan cookies de medición y publicidad. Puedes cambiar tu decisión cuando quieras desde "Preferencias de cookies" en el pie de página. <a href="' + root() + 'privacidad/">Más información</a>.</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn-cookie btn-cookie-reject">Rechazar</button>' +
          '<button type="button" class="btn-cookie btn-cookie-accept">Aceptar</button>' +
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

  document.addEventListener('DOMContentLoaded', function () {
    var consent = getConsent();
    if (consent === 'accepted') loadServices();
    else if (!consent) showBanner();

    document.querySelectorAll('[data-cookie-preferences]').forEach(function (link) {
      link.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });
    });
  });

  /* ---- analítica de producto ------------------------------------------
     Eventos de uso (calculadora abierta, cálculo realizado, error de
     validación, búsqueda, copiar resultado, clic en relacionada). Solo
     se envían si hay consentimiento Y Analytics está cargado — si no,
     no hacen nada. No sustituyen ni amplían lo que ya declara la
     política de privacidad: usan el mismo Google Analytics ya descrito
     ahí, no un servicio nuevo. -------------------------------------- */
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
