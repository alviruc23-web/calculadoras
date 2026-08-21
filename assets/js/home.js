/* ============================================================
   CalcYa — búsqueda y filtro de categoría en la home.
   Las tarjetas ya están renderizadas de forma estática en el HTML
   (enlaces reales a cada calculadora); este script solo
   muestra/oculta según texto de búsqueda y categoría elegida.
   Funciona en progresivo: sin JS, todas las tarjetas son visibles.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.getElementById('search');
    var chips = document.querySelectorAll('.chip');
    var cards = document.querySelectorAll('.calc-card');
    var noResults = document.getElementById('no-results');

    if (!cards.length) return;

    var currentCat = 'todas';
    var currentQuery = '';

    function applyFilters() {
      var q = currentQuery.trim().toLowerCase();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var catOk = currentCat === 'todas' || card.dataset.cat === currentCat;
        var haystack = card.dataset.keywords || '';
        var searchOk = !q || haystack.indexOf(q) !== -1;
        var show = catOk && searchOk;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      if (noResults) noResults.style.display = visibleCount ? 'none' : 'block';
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentQuery = searchInput.value;
        applyFilters();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('on');
        chip.setAttribute('aria-pressed', 'true');
        currentCat = chip.dataset.cat;
        applyFilters();
      });
    });
  });
})();
