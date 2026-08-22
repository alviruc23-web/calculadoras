/* ============================================================
   CalcYa — consentimiento de cookies.
   No instala ninguna cookie de análisis ni publicidad por sí
   mismo: solo guarda la elección del usuario en localStorage y
   expone `window.CalcYaConsent` para que, cuando en el futuro se
   active Google AdSense, ese código pueda comprobar el consentimiento
   antes de cargar nada. Sin librerías externas.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'calcya-cookie-consent'; // 'accepted' | 'rejected'
  var banner = null;

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p>Usamos cookies propias necesarias para el funcionamiento del sitio. Si aceptas, también podremos mostrar en el futuro anuncios de Google AdSense usando cookies de terceros. Puedes cambiar tu decisión cuando quieras desde "Preferencias de cookies" en el pie de página. <a href="' + rootPrefix() + 'privacidad/">Más información</a>.</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn-cookie btn-cookie-reject">Rechazar</button>' +
          '<button type="button" class="btn-cookie btn-cookie-accept">Aceptar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('.btn-cookie-accept').onclick = function () { decide('accepted'); };
    el.querySelector('.btn-cookie-reject').onclick = function () { decide('rejected'); };
    return el;
  }

  function rootPrefix() {
    // La ruta hasta la raíz del sitio: '' en la home, '../' en /calculadora/ o /privacidad/
    return document.body.getAttribute('data-root') || '';
  }

  function decide(value) {
    setConsent(value);
    if (banner) { banner.remove(); banner = null; }
  }

  function showBanner() {
    if (banner) return;
    banner = buildBanner();
    var acceptBtn = banner.querySelector('.btn-cookie-accept');
    if (acceptBtn) acceptBtn.focus();
  }

  function openPreferences() {
    showBanner();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!getConsent()) showBanner();

    var prefLinks = document.querySelectorAll('[data-cookie-preferences]');
    prefLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openPreferences();
      });
    });
  });

  window.CalcYaConsent = {
    get: getConsent,
    hasAcceptedAds: function () { return getConsent() === 'accepted'; },
    openPreferences: openPreferences,
  };
})();
