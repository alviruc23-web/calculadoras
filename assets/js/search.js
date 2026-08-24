/* ============================================================
   CalcYa — buscador de calculadoras.

   Usa el índice `window.CALCYA_INDEX` (embebido en cada página por
   layout.js) para dar sugerencias en el buscador de cabecera desde
   cualquier página, y para filtrar la rejilla de la home en directo.
   Tolera pequeños errores tipográficos con una distancia de edición
   ligera, sin ninguna librería externa.
   ============================================================ */
(function () {
  'use strict';

  var INDEX = window.CALCYA_INDEX || [];
  var ROOT = window.CALCYA_ROOT || '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function normalize(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
      .trim();
  }

  // Distancia de edición acotada: suficiente para tolerar 1-2 erratas
  // sin el coste de una distancia completa en cadenas largas.
  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [];
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var cur = [i];
      for (var j2 = 1; j2 <= b.length; j2++) {
        cur[j2] = a[i - 1] === b[j2 - 1]
          ? prev[j2 - 1]
          : 1 + Math.min(prev[j2 - 1], prev[j2], cur[j2 - 1]);
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function score(entry, qNorm, qWords) {
    var name = normalize(entry.name);
    if (name === qNorm) return 100;
    if (name.indexOf(qNorm) === 0) return 90;
    if (name.indexOf(qNorm) !== -1) return 75;
    if (entry.kw.indexOf(qNorm) !== -1) return 60;

    // coincidencia por palabra suelta, tolerando erratas cortas
    var kwWords = entry.kw.split(/\s+/);
    var hits = 0;
    qWords.forEach(function (w) {
      if (w.length < 3) return;
      for (var i = 0; i < kwWords.length; i++) {
        if (kwWords[i].indexOf(w) !== -1) { hits++; return; }
        var tol = w.length <= 4 ? 1 : 2;
        if (editDistance(w, kwWords[i], tol) <= tol) { hits++; return; }
      }
    });
    if (hits) return 30 + hits * 10;
    return 0;
  }

  function search(query, limit) {
    var qNorm = normalize(query);
    if (!qNorm) return [];
    var qWords = qNorm.split(/\s+/).filter(Boolean);
    return INDEX
      .map(function (e) { return { e: e, s: score(e, qNorm, qWords) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, limit || 8)
      .map(function (r) { return r.e; });
  }

  /* ---- buscador de cabecera (sugerencias, presente en toda la web) --- */

  function initHeaderSearch() {
    var form = document.querySelector('[data-site-search]');
    if (!form) return;
    var input = form.querySelector('input[type=search]');
    var box = form.querySelector('.hdr-search-results');
    var active = -1;
    var items = [];

    // Si venimos de otra página con ?q=, precarga el término.
    var params = new URLSearchParams(location.search);
    if (params.get('q') && !document.getElementById('search-page')) input.value = params.get('q');

    function render(list) {
      items = list;
      active = -1;
      if (!list.length) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
      box.innerHTML = list.map(function (e, i) {
        return '<a href="' + esc(ROOT + e.url) + '" class="hdr-result" role="option" id="hdr-result-' + i + '">' +
          '<span class="hdr-result-name">' + esc(e.name) + '</span>' +
          '<span class="hdr-result-short">' + esc(e.short) + '</span></a>';
      }).join('');
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    input.addEventListener('input', function () { render(search(input.value, 6)); });
    input.addEventListener('focus', function () { if (input.value) render(search(input.value, 6)); });
    input.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      var links = box.querySelectorAll('.hdr-result');
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, links.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, -1); }
      else if (e.key === 'Escape') { box.hidden = true; return; }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); links[active].click(); return; }
      else return;
      links.forEach(function (l, i) { l.classList.toggle('is-active', i === active); });
      if (active >= 0) input.setAttribute('aria-activedescendant', 'hdr-result-' + active);
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) box.hidden = true; });

    form.addEventListener('submit', function (e) {
      // Si hay una coincidencia exacta o muy clara, ir directo a ella;
      // si no, dejar que el formulario navegue a la home con ?q=.
      var results = search(input.value, 1);
      if (results.length) { e.preventDefault(); location.href = ROOT + results[0].url; }
    });
  }

  /* ---- filtro en directo de la rejilla de la home --------------------- */

  function initGridFilter() {
    var page = document.getElementById('search-page');
    if (!page) return;
    var input = document.getElementById('hdr-search-input');
    var cards = page.querySelectorAll('[data-calc-card]');
    var chips = page.querySelectorAll('.chip');
    var noResults = document.getElementById('no-results');
    var currentCat = 'todas';

    function apply() {
      var q = normalize(input ? input.value : '');
      var matchIds = q ? search(q, 999).map(function (e) { return e.id; }) : null;
      var shown = 0;
      cards.forEach(function (card) {
        var id = card.getAttribute('data-calc-card');
        var cat = card.getAttribute('data-cat');
        var catOk = currentCat === 'todas' || cat === currentCat;
        var qOk = !matchIds || matchIds.indexOf(id) !== -1;
        var show = catOk && qOk;
        card.style.display = show ? '' : 'none';
        if (show) shown++;
      });
      if (noResults) noResults.style.display = shown ? 'none' : '';
    }

    if (input) input.addEventListener('input', apply);
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('on');
        chip.setAttribute('aria-pressed', 'true');
        currentCat = chip.getAttribute('data-cat');
        apply();
      });
    });
    apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderSearch();
    initGridFilter();
  });
})();
