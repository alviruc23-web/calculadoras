/* ============================================================
   CalcYa — interfaz de calculadora.

   Renderiza CUALQUIER calculadora a partir de su especificación
   declarativa en calc-engine.js. No hay código específico por
   calculadora: añadir una nueva no requiere tocar este fichero.

   Se encarga de: formulario accesible, validación, estados
   (vacío / error / resultado), copiar, restablecer y persistencia
   de los valores en la URL para poder compartir un cálculo.
   ============================================================ */
(function () {
  'use strict';

  var E = window.CalcEngine;
  if (!E) return;

  // Las 3 cadenas de interfaz propias de este fichero (el resto del
  // texto de la calculadora viene de CalcEngine.CALC_SPECS, ya
  // localizado por CalcEngine.configure()).
  var UI_T = {
    es: { reset: 'Restablecer', copy: 'Copiar resultado', copied: '✓ Copiado' },
    en: { reset: 'Reset', copy: 'Copy result', copied: '✓ Copied' },
  };
  var uiLocale = 'es';
  function configure(opts) {
    uiLocale = (opts && opts.locale === 'en') ? 'en' : 'es';
  }
  function ui() { return UI_T[uiLocale]; }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pctLabel(p) { return E.pct(p, p < 10 ? 1 : 0); }

  // Analítica de producto: no-op si no hay consentimiento (ver consent.js).
  function track(name, params) {
    if (window.CalcYaConsent) window.CalcYaConsent.track(name, params);
  }

  /* ---- construcción de campos ------------------------------------- */

  function fieldMarkup(id, f, value) {
    var fid = id + '-' + f.id;
    var describedBy = [];
    if (f.help) describedBy.push(fid + '-help');

    var label = '<label class="field-label" for="' + fid + '">' + esc(f.label) +
      (f.unit ? ' <span class="field-unit">(' + esc(f.unit) + ')</span>' : '') + '</label>';

    var control = '';

    if (f.type === 'segment') {
      var current = value !== undefined && value !== '' ? String(value) : String(f.default);
      control = '<div class="seg" role="group" aria-labelledby="' + fid + '-lbl">' +
        f.options.map(function (o) {
          var on = String(o.value) === current;
          return '<button type="button" class="seg-btn' + (on ? ' on' : '') + '" data-field="' + f.id +
            '" data-value="' + esc(o.value) + '" aria-pressed="' + on + '">' + esc(o.label) + '</button>';
        }).join('') + '</div>';
      // El grupo usa un label no asociable a un control único.
      label = '<span class="field-label" id="' + fid + '-lbl">' + esc(f.label) + '</span>';

    } else if (f.type === 'select') {
      control = '<select class="control" id="' + fid + '" name="' + f.id + '"' +
        (describedBy.length ? ' aria-describedby="' + describedBy.join(' ') + '"' : '') + '>' +
        f.options.map(function (o) {
          var sel = String(o.value) === String(value !== undefined && value !== '' ? value : f.default);
          return '<option value="' + esc(o.value) + '"' + (sel ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select>';

    } else if (f.type === 'checkbox') {
      control = '<div class="field-check"><input type="checkbox" id="' + fid + '" name="' + f.id + '"' +
        (value ? ' checked' : '') + '><label for="' + fid + '">' + esc(f.label) + '</label></div>';
      label = '';

    } else if (f.type === 'date') {
      control = '<input class="control" type="date" id="' + fid + '" name="' + f.id + '" value="' + esc(value || '') + '"' +
        (f.autofocus ? ' data-autofocus' : '') + '>';

    } else {
      // number
      control = '<input class="control" type="number" inputmode="decimal" id="' + fid + '" name="' + f.id + '"' +
        (f.min !== undefined ? ' min="' + f.min + '"' : '') +
        (f.max !== undefined ? ' max="' + f.max + '"' : '') +
        (f.step ? ' step="' + f.step + '"' : '') +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
        ' value="' + esc(value === undefined || value === null ? '' : value) + '"' +
        (describedBy.length ? ' aria-describedby="' + describedBy.join(' ') + '"' : '') +
        (f.autofocus ? ' data-autofocus' : '') + '>';
    }

    var help = f.help ? '<p class="field-help" id="' + fid + '-help">' + esc(f.help) + '</p>' : '';
    return '<div class="field" data-field-wrap="' + f.id + '">' + label + control + help + '</div>';
  }

  /* ---- estado desde/hacia la URL ----------------------------------
     Permite compartir un cálculo concreto por enlace y que al recargar
     no se pierdan los datos introducidos.
     ------------------------------------------------------------------ */

  function readState(spec) {
    var params = new URLSearchParams(location.search);
    var state = {};
    spec.fields.forEach(function (f) {
      if (params.has(f.id)) {
        state[f.id] = f.type === 'checkbox' ? params.get(f.id) === '1' : params.get(f.id);
      } else if (f.default !== undefined) {
        state[f.id] = f.default;
      } else if (f.type === 'checkbox') {
        state[f.id] = false;
      } else {
        state[f.id] = '';
      }
    });
    return state;
  }

  function writeState(spec, state, hasResult) {
    if (!window.history || !history.replaceState) return;
    var params = new URLSearchParams();
    if (hasResult) {
      spec.fields.forEach(function (f) {
        var v = state[f.id];
        if (f.type === 'checkbox') { if (v) params.set(f.id, '1'); }
        else if (v !== '' && v !== undefined && v !== null && String(v) !== String(f.default || '')) {
          params.set(f.id, v);
        }
      });
    }
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  /* ---- "continuar donde lo dejaste" en la home ----------------------
     Guarda qué calculadoras se han visitado, solo en este navegador
     (localStorage, sin enviarse a ningún servidor), para poder
     mostrarlas de nuevo en la home. No es medición: no depende del
     consentimiento de cookies, igual que recordar la preferencia de
     cookies en sí. ------------------------------------------------- */
  var RECENT_KEY = 'calcya-recent';
  var RECENT_MAX = 6;
  function recordRecent(id) {
    try {
      var list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(function (x) { return x !== id; });
      list.unshift(id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
    } catch (e) {}
  }

  /* ---- render ------------------------------------------------------ */

  function init(id) {
    var spec = E.CALC_SPECS[id];
    var root = document.getElementById('calc-' + id);
    if (!spec || !root) return;
    recordRecent(id);
    track('calc_view', { calc_id: id });

    var state = readState(spec);
    var announced = false;

    function labelsFor() {
      return spec.labelsFor ? spec.labelsFor(state.modo) : null;
    }

    function renderForm() {
      var dyn = labelsFor();
      var html = spec.fields.map(function (f) {
        var f2 = f;
        if (dyn && dyn[f.id]) { f2 = Object.assign({}, f, { label: dyn[f.id] }); }
        return fieldMarkup(id, f2, state[f.id]);
      }).join('');

      form.innerHTML = html +
        '<div class="calc-actions">' +
        '<button type="submit" class="btn btn-primary">' + esc(spec.submitLabel) + '</button>' +
        '<button type="button" class="btn btn-ghost" data-reset>' + esc(ui().reset) + '</button>' +
        '</div>';
    }

    function collect() {
      spec.fields.forEach(function (f) {
        var node = form.querySelector('#' + id + '-' + f.id);
        if (f.type === 'segment') return; // se mantiene en `state` al pulsar
        if (!node) return;
        state[f.id] = f.type === 'checkbox' ? node.checked : node.value;
      });
    }

    function renderResult(res) {
      if (res.empty) {
        out.className = 'result result-empty';
        out.innerHTML = '<p class="result-hint">' + esc(res.hint) + '</p>';
        return;
      }
      if (res.error) {
        out.className = 'result result-error';
        out.innerHTML =
          '<div class="result-error-inner">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12.01" y2="16.5"/></svg>' +
          '<p>' + esc(res.error) + '</p></div>';
        return;
      }

      out.className = 'result result-ok';
      var rows = (res.rows || []).map(function (r) {
        return '<div class="result-row' + (r.strong ? ' is-strong' : '') + '">' +
          '<span class="rk">' + esc(r.k) + '</span><span class="rv">' + esc(r.v) + '</span></div>';
      }).join('');

      var bar = '';
      if (res.bar && res.bar.length) {
        bar = '<div class="result-bar">' +
          res.bar.map(function (s) { return '<span class="result-bar-seg result-bar-' + s.cls + '" style="width:' + s.pct.toFixed(2) + '%"></span>'; }).join('') +
          '</div><div class="result-bar-legend">' +
          res.bar.map(function (s) { return '<span class="result-bar-item"><i class="result-bar-dot result-bar-' + s.cls + '"></i>' + esc(s.label) + ' · ' + pctLabel(s.pct) + '</span>'; }).join('') +
          '</div>';
      }

      out.innerHTML =
        '<div class="result-headline">' +
        '<p class="result-label">' + esc(res.main.label) + '</p>' +
        '<p class="result-value">' + esc(res.main.value) + '</p>' +
        bar +
        '</div>' +
        (rows ? '<div class="result-rows">' + rows + '</div>' : '') +
        (res.note ? '<p class="result-note">' + esc(res.note) + '</p>' : '') +
        (res.copy ? '<div class="result-actions"><button type="button" class="btn-copy" data-copy>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
          esc(ui().copy) + '</button></div>' : '');

      var btn = out.querySelector('[data-copy]');
      if (btn) btn.addEventListener('click', function () { copy(res.copy, btn); track('calc_share_copy', { calc_id: id }); });
    }

    function copy(text, btn) {
      var done = function () {
        var old = btn.innerHTML;
        btn.innerHTML = ui().copied;
        btn.classList.add('is-done');
        setTimeout(function () { btn.innerHTML = old; btn.classList.remove('is-done'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        ta.remove(); done();
      }
    }

    function run(userInitiated) {
      collect();
      var res = spec.compute(state);
      renderResult(res);
      writeState(spec, state, !res.empty && !res.error);
      if (userInitiated) {
        if (res.error) track('calc_error', { calc_id: id });
        else if (!res.empty) track('calc_compute', { calc_id: id });
        // En móvil, el formulario y el resultado quedan uno encima del
        // otro (breakpoint de .calc-grid a 640px): tras enviar, el
        // resultado puede quedar fuera de la pantalla. Lo llevamos a la
        // vista solo si hace falta y solo en pantallas estrechas — en
        // escritorio están lado a lado y no hay nada que desplazar.
        if (!res.empty && window.innerWidth < 640) {
          var rect = out.getBoundingClientRect();
          if (rect.top < 0 || rect.top > window.innerHeight * 0.6) {
            out.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
      if (userInitiated && !announced) announced = true;
    }

    // Estructura
    root.innerHTML = '';
    var form = el('form', { class: 'calc-form', novalidate: 'novalidate' });
    var out = el('div', { class: 'result result-empty', role: 'status', 'aria-live': 'polite' });
    var grid = el('div', { class: 'calc-grid' });
    grid.appendChild(form);
    grid.appendChild(out);
    root.appendChild(grid);

    renderForm();

    form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });

    // Segmentos: cambian el estado y recalculan (también reetiquetan campos
    // en las calculadoras cuyo significado depende del modo).
    form.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-btn');
      if (b) {
        collect();
        state[b.dataset.field] = b.dataset.value;
        renderForm();
        run(true);
        var again = form.querySelector('.seg-btn[data-field="' + b.dataset.field + '"][data-value="' + CSS.escape(b.dataset.value) + '"]');
        if (again) again.focus();
        return;
      }
      if (e.target.closest('[data-reset]')) {
        spec.fields.forEach(function (f) {
          state[f.id] = f.default !== undefined ? f.default : (f.type === 'checkbox' ? false : '');
        });
        renderForm();
        run(false);
        var first = form.querySelector('[data-autofocus]') || form.querySelector('.control');
        if (first) first.focus();
      }
    });

    // Recalcular al cambiar selects, fechas y checkboxes (sin esperar al botón).
    form.addEventListener('change', function (e) {
      if (e.target.matches('select, input[type=date], input[type=checkbox]')) run(true);
    });

    // Seleccionar el contenido al enfocar un número: escribir encima sin borrar.
    form.addEventListener('focusin', function (e) {
      if (e.target.matches('input[type=number]')) { try { e.target.select(); } catch (err) {} }
    });

    run(false);
  }

  window.CalcUI = { init: init, configure: configure };
})();
