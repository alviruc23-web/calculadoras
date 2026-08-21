/* ============================================================
   CalcYa — motor de cálculo compartido por las 11 calculadoras.
   Cada página de calculadora incluye este fichero y llama a
   CalcYa.initCalculator('<id>') una vez cargado el DOM.
   No depende de contenido (nombre, FAQ, afiliados): eso ya está
   renderizado de forma estática en el HTML de cada página.
   ============================================================ */
(function () {
  'use strict';

  function fmt(n, dec) {
    if (dec === undefined) dec = 2;
    return Number(n).toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtE(n) { return fmt(n, 2) + ' €'; }

  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  function attachEvents(id, root) {
    var form = root.querySelector('#body-' + id + ' form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        RENDERERS[id](root);
      };
    }
    root.querySelectorAll('.btn-copy').forEach(function (btn) {
      btn.onclick = function () {
        var txt = btn.dataset.copy;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () {});
        showToast('Resultado copiado');
      };
    });
    root.querySelectorAll('.seg button').forEach(function (btn) {
      btn.onclick = function () {
        this.closest('.seg').querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
        this.classList.add('on');
        RENDERERS[id](root);
      };
    });
    root.querySelectorAll('#body-' + id + ' input[type=number]').forEach(function (el) {
      el.addEventListener('focus', function () { this.select(); });
    });
  }

  // ── IVA ──────────────────────────────────────────────────────
  function renderIVA(root) {
    var body = root.querySelector('#body-iva');
    if (!body) return;

    var precio = parseFloat(body.querySelector('#iva-precio') && body.querySelector('#iva-precio').value) || 0;
    var tipoBtn = body.querySelector('.seg .on');
    var tipo = (tipoBtn && tipoBtn.dataset.val) || '21';
    var modoEl = body.querySelector('#iva-modo');
    var modo = (modoEl && modoEl.value) || 'anadir';

    var tipoN = parseFloat(tipo) / 100;
    var sinIVA, conIVA, ivaImporte;
    if (modo === 'anadir') {
      sinIVA = precio; ivaImporte = precio * tipoN; conIVA = precio + ivaImporte;
    } else {
      conIVA = precio; sinIVA = precio / (1 + tipoN); ivaImporte = conIVA - sinIVA;
    }

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="iva-precio">Precio <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="iva-precio" min="0" step="0.01" placeholder="100,00" value="' + (precio || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" id="iva-tipo-label">Tipo de IVA</label>' +
            '<div class="seg" role="group" aria-labelledby="iva-tipo-label">' +
              '<button type="button" data-val="4" class="' + (tipo === '4' ? 'on' : '') + '" aria-pressed="' + (tipo === '4') + '">4 %</button>' +
              '<button type="button" data-val="10" class="' + (tipo === '10' ? 'on' : '') + '" aria-pressed="' + (tipo === '10') + '">10 %</button>' +
              '<button type="button" data-val="21" class="' + (tipo === '21' ? 'on' : '') + '" aria-pressed="' + (tipo === '21') + '">21 %</button>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="iva-modo">Operación</label>' +
            '<select id="iva-modo">' +
              '<option value="anadir"' + (modo === 'anadir' ? ' selected' : '') + '>Añadir IVA (precio sin IVA → con IVA)</option>' +
              '<option value="quitar"' + (modo === 'quitar' ? ' selected' : '') + '>Quitar IVA (precio con IVA → sin IVA)</option>' +
            '</select>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular IVA</button>' +
        '</form>' +
        '<div>' +
          (precio > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Precio con IVA</div>' +
              '<div class="result-main">' + fmt(conIVA, 2) + ' €</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Precio sin IVA</span><span class="rv">' + fmt(sinIVA, 2) + ' €</span></div>' +
                '<div class="result-row"><span class="rk">IVA (' + tipo + ' %)</span><span class="rv">' + fmt(ivaImporte, 2) + ' €</span></div>' +
                '<div class="result-row"><span class="rk">Precio con IVA</span><span class="rv">' + fmt(conIVA, 2) + ' €</span></div>' +
              '</div>' +
              '<div class="result-actions">' +
                '<button type="button" class="btn-copy" data-copy="Sin IVA: ' + fmt(sinIVA, 2) + ' €\nIVA (' + tipo + ' %): ' + fmt(ivaImporte, 2) + ' €\nCon IVA: ' + fmt(conIVA, 2) + ' €">Copiar resultado</button>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando precio</div><div class="result-main">—</div><p class="result-note">Introduce el precio arriba y pulsa Calcular.</p></div>') +
        '</div>' +
      '</div>';
    attachEvents('iva', root);
  }

  // ── FINIQUITO ────────────────────────────────────────────────
  function renderFiniquito(root) {
    var body = root.querySelector('#body-finiquito');
    if (!body) return;

    var salario = parseFloat(val(body, '#fin-salario')) || 0;
    var diasTrab = parseInt(val(body, '#fin-dias'), 10) || 0;
    var vacPend = parseFloat(val(body, '#fin-vac')) || 0;
    var preaviso = parseInt(val(body, '#fin-preaviso'), 10) || 0;

    var salarioDia = salario / 30;
    var salarioPend = salarioDia * diasTrab;
    var vacsPend = (salario / 30) * vacPend;
    var preavisoPend = preaviso > 0 ? salarioDia * preaviso : 0;
    var total = salarioPend + vacsPend + preavisoPend;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="fin-salario">Salario bruto mensual <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="fin-salario" min="0" step="50" placeholder="1.800" value="' + (salario || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="fin-dias">Días del mes en curso trabajados</label>' +
            '<input type="number" id="fin-dias" min="0" max="31" placeholder="15" value="' + (diasTrab || '') + '">' +
            '<p class="field-note">Días trabajados en el mes de baja o despido.</p>' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="fin-vac">Días de vacaciones pendientes</label>' +
            '<input type="number" id="fin-vac" min="0" max="30" step="0.5" placeholder="8" value="' + (vacPend || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="fin-preaviso">Días de preaviso no trabajados <span class="lbl-note">(si aplica)</span></label>' +
            '<input type="number" id="fin-preaviso" min="0" max="90" placeholder="0" value="' + (preaviso || '') + '">' +
            '<p class="field-note">Solo si el preaviso no se ha cumplido y corresponde indemnizarlo.</p>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular finiquito</button>' +
        '</form>' +
        '<div>' +
          (salario > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Total finiquito (bruto)</div>' +
              '<div class="result-main">' + fmtE(total) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Salario días trabajados</span><span class="rv">' + fmtE(salarioPend) + '</span></div>' +
                '<div class="result-row"><span class="rk">Vacaciones pendientes</span><span class="rv">' + fmtE(vacsPend) + '</span></div>' +
                (preaviso > 0 ? '<div class="result-row"><span class="rk">Preaviso no trabajado</span><span class="rv">' + fmtE(preavisoPend) + '</span></div>' : '') +
              '</div>' +
              '<p class="result-note">⚠️ Este es el importe bruto. Se aplicará IRPF y Seguridad Social. El finiquito no incluye indemnización por despido, que es un concepto separado.</p>' +
              '<div class="result-actions">' +
                '<button type="button" class="btn-copy" data-copy="Finiquito estimado (bruto): ' + fmtE(total) + '\n- Salario pendiente: ' + fmtE(salarioPend) + '\n- Vacaciones: ' + fmtE(vacsPend) + '">Copiar resultado</button>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando datos</div><div class="result-main">—</div><p class="result-note">Rellena el salario y los días trabajados.</p></div>') +
        '</div>' +
      '</div>';
    attachEvents('finiquito', root);
  }

  // ── NÓMINA NETA ──────────────────────────────────────────────
  function renderNomina(root) {
    var body = root.querySelector('#body-nomina');
    if (!body) return;

    var bruto = parseFloat(val(body, '#nom-bruto')) || 0;
    var pagas = val(body, '#nom-pagas') || '14';
    var hijos = parseInt(val(body, '#nom-hijos'), 10) || 0;

    var irpf = 0;
    var brutoAnual = bruto * (pagas === '14' ? 14 : 12);
    if (brutoAnual <= 12450) irpf = 0.19;
    else if (brutoAnual <= 20200) irpf = 0.24;
    else if (brutoAnual <= 35200) irpf = 0.30;
    else if (brutoAnual <= 60000) irpf = 0.37;
    else if (brutoAnual <= 300000) irpf = 0.45;
    else irpf = 0.47;

    if (hijos >= 1) irpf = Math.max(irpf - 0.02, 0.05);
    if (hijos >= 3) irpf = Math.max(irpf - 0.02, 0.05);

    var ss = 0.0635;
    var descIRPF = bruto * irpf;
    var descSS = bruto * ss;
    var neto = bruto - descIRPF - descSS;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="nom-bruto">Salario bruto mensual <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="nom-bruto" min="0" step="50" placeholder="2.000" value="' + (bruto || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="nom-pagas">Número de pagas al año</label>' +
            '<select id="nom-pagas">' +
              '<option value="12"' + (pagas === '12' ? ' selected' : '') + '>12 pagas (extras prorrateadas)</option>' +
              '<option value="14"' + (pagas === '14' ? ' selected' : '') + '>14 pagas (extras en junio y diciembre)</option>' +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="nom-hijos">Hijos a cargo</label>' +
            '<input type="number" id="nom-hijos" min="0" max="10" placeholder="0" value="' + (hijos || '') + '">' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular neto</button>' +
        '</form>' +
        '<div>' +
          (bruto > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Salario neto mensual</div>' +
              '<div class="result-main">' + fmtE(neto) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Salario bruto</span><span class="rv">' + fmtE(bruto) + '</span></div>' +
                '<div class="result-row"><span class="rk">IRPF (' + (irpf * 100).toFixed(0) + ' %)</span><span class="rv">− ' + fmtE(descIRPF) + '</span></div>' +
                '<div class="result-row"><span class="rk">Seg. Social (6,35 %)</span><span class="rv">− ' + fmtE(descSS) + '</span></div>' +
                '<div class="result-row"><span class="rk">Neto mensual</span><span class="rv">' + fmtE(neto) + '</span></div>' +
                '<div class="result-row"><span class="rk">Neto anual</span><span class="rv">' + fmtE(neto * (pagas === '14' ? 14 : 12)) + '</span></div>' +
              '</div>' +
              '<p class="result-note">⚠️ Cálculo orientativo. El IRPF real depende de tu situación personal completa. Consulta tu nómina o a tu gestor.</p>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando salario</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('nomina', root);
  }

  // ── HIPOTECA ─────────────────────────────────────────────────
  function renderHipoteca(root) {
    var body = root.querySelector('#body-hipoteca');
    if (!body) return;

    var capital = parseFloat(val(body, '#hip-capital')) || 0;
    var anios = parseInt(val(body, '#hip-anios'), 10) || 25;
    var tipo = parseFloat(val(body, '#hip-tipo'));
    if (isNaN(tipo)) tipo = 3;

    var n = anios * 12;
    var r = (tipo / 100) / 12;
    var cuota = r === 0 ? capital / n : capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    var totalPagado = cuota * n;
    var totalIntereses = totalPagado - capital;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="hip-capital">Importe del préstamo <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="hip-capital" min="0" step="1000" placeholder="150.000" value="' + (capital || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="hip-anios">Plazo <span class="lbl-note">(años)</span></label>' +
            '<input type="number" id="hip-anios" min="1" max="40" placeholder="25" value="' + anios + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="hip-tipo">Tipo de interés anual <span class="lbl-note">(%)</span></label>' +
            '<input type="number" id="hip-tipo" min="0" max="20" step="0.01" placeholder="3,00" value="' + tipo + '">' +
            '<p class="field-note">Para hipoteca variable usa el Euríbor actual + diferencial.</p>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular hipoteca</button>' +
        '</form>' +
        '<div>' +
          (capital > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Cuota mensual</div>' +
              '<div class="result-main">' + fmtE(cuota) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Capital prestado</span><span class="rv">' + fmtE(capital) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total intereses</span><span class="rv">' + fmtE(totalIntereses) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total pagado</span><span class="rv">' + fmtE(totalPagado) + '</span></div>' +
                '<div class="result-row"><span class="rk">Coste real (% capital)</span><span class="rv">' + fmt(totalIntereses / capital * 100, 1) + ' %</span></div>' +
              '</div>' +
              '<div class="result-actions">' +
                '<button type="button" class="btn-copy" data-copy="Cuota mensual: ' + fmtE(cuota) + '\nTotal intereses: ' + fmtE(totalIntereses) + '\nTotal pagado: ' + fmtE(totalPagado) + '">Copiar resultado</button>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando datos</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('hipoteca', root);
  }

  // ── PORCENTAJES ──────────────────────────────────────────────
  function renderPorcentaje(root) {
    var body = root.querySelector('#body-porcentaje');
    if (!body) return;

    var modoBtn = body.querySelector('.seg .on');
    var modo = (modoBtn && modoBtn.dataset.val) || 'pct_de';
    var a = parseFloat(val(body, '#pct-a')) || 0;
    var b = parseFloat(val(body, '#pct-b')) || 0;

    var label = '', main = '', rows = [];
    if (modo === 'pct_de') {
      var r1 = (a / 100) * b;
      label = fmt(a, 0) + ' % de ' + fmt(b, 2); main = fmtE(r1);
      rows = [{ k: 'Porcentaje', v: fmt(a, 0) + ' %' }, { k: 'Base', v: fmtE(b) }, { k: 'Resultado', v: fmtE(r1) }];
    } else if (modo === 'que_pct') {
      var r2 = b !== 0 ? (a / b) * 100 : 0;
      label = fmt(a, 2) + ' es el … % de ' + fmt(b, 2); main = fmt(r2, 2) + ' %';
      rows = [{ k: 'Valor', v: fmtE(a) }, { k: 'Total', v: fmtE(b) }, { k: 'Porcentaje', v: fmt(r2, 2) + ' %' }];
    } else {
      var r3 = a !== 0 ? ((b - a) / a) * 100 : 0;
      var sign = r3 >= 0 ? '+' : '';
      label = 'Variación porcentual'; main = sign + fmt(r3, 2) + ' %';
      rows = [{ k: 'Valor inicial', v: fmtE(a) }, { k: 'Valor final', v: fmtE(b) }, { k: 'Variación', v: sign + fmt(r3, 2) + ' %' }, { k: 'Diferencia', v: fmtE(b - a) }];
    }

    var labels = { pct_de: ['Porcentaje (%)', 'Valor base'], que_pct: ['Es (valor)', 'De (total)'], variacion: ['Valor inicial', 'Valor final'] };
    var lbls = labels[modo] || labels.pct_de;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" id="pct-modo-label">Tipo de cálculo</label>' +
            '<div class="seg" role="group" aria-labelledby="pct-modo-label">' +
              '<button type="button" data-val="pct_de" class="' + (modo === 'pct_de' ? 'on' : '') + '">X% de Y</button>' +
              '<button type="button" data-val="que_pct" class="' + (modo === 'que_pct' ? 'on' : '') + '">Qué %</button>' +
              '<button type="button" data-val="variacion" class="' + (modo === 'variacion' ? 'on' : '') + '">Variación</button>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="pct-a">' + lbls[0] + '</label>' +
            '<input type="number" id="pct-a" step="any" placeholder="0" value="' + (a || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="pct-b">' + lbls[1] + '</label>' +
            '<input type="number" id="pct-b" step="any" placeholder="0" value="' + (b || '') + '">' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular</button>' +
        '</form>' +
        '<div>' +
          '<div class="result-box">' +
            '<div class="result-label">' + (label || 'Resultado') + '</div>' +
            '<div class="result-main">' + ((a || b) ? main : '—') + '</div>' +
            ((a || b) ? '<div class="result-rows">' + rows.map(function (r) { return '<div class="result-row"><span class="rk">' + r.k + '</span><span class="rv">' + r.v + '</span></div>'; }).join('') + '</div>' : '<p class="result-note">Introduce los valores arriba.</p>') +
          '</div>' +
        '</div>' +
      '</div>';
    attachEvents('porcentaje', root);
  }

  // ── DÍAS ENTRE FECHAS ────────────────────────────────────────
  function renderDias(root) {
    var body = root.querySelector('#body-dias');
    if (!body) return;

    var today = new Date().toISOString().slice(0, 10);
    var f1v = val(body, '#dias-f1') || today;
    var f2v = val(body, '#dias-f2') || today;
    var labChk = body.querySelector('#dias-lab');
    var labOpt = labChk ? labChk.checked : false;

    var dias = 0, diasLab = 0, main = '—', rows = [];
    if (f1v && f2v) {
      var d1 = new Date(f1v), d2 = new Date(f2v);
      var ms = Math.abs(d2 - d1);
      dias = Math.round(ms / 86400000);
      var semanas = Math.floor(dias / 7);
      var meses = Math.round(dias / 30.44);

      var cur = new Date(Math.min(d1, d2)), end = new Date(Math.max(d1, d2));
      diasLab = 0;
      while (cur <= end) { var d = cur.getDay(); if (d !== 0 && d !== 6) diasLab++; cur.setDate(cur.getDate() + 1); }

      main = (labOpt ? diasLab : dias) + ' días';
      rows = [
        { k: 'Días totales', v: dias + ' días' },
        { k: 'Días laborables', v: diasLab + ' días' },
        { k: 'Semanas completas', v: semanas + ' sem.' },
        { k: 'Meses aprox.', v: meses + ' meses' },
      ];
    }

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="dias-f1">Fecha de inicio</label>' +
            '<input type="date" id="dias-f1" value="' + f1v + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="dias-f2">Fecha de fin</label>' +
            '<input type="date" id="dias-f2" value="' + f2v + '">' +
          '</div>' +
          '<div class="field field-check">' +
            '<input type="checkbox" id="dias-lab"' + (labOpt ? ' checked' : '') + '>' +
            '<label for="dias-lab">Mostrar solo días laborables</label>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular</button>' +
        '</form>' +
        '<div>' +
          '<div class="result-box">' +
            '<div class="result-label">' + (labOpt ? 'Días laborables' : 'Días totales') + '</div>' +
            '<div class="result-main">' + main + '</div>' +
            (dias > 0 ? '<div class="result-rows">' + rows.map(function (r) { return '<div class="result-row"><span class="rk">' + r.k + '</span><span class="rv">' + r.v + '</span></div>'; }).join('') + '</div>' : '<p class="result-note">Selecciona las dos fechas.</p>') +
          '</div>' +
        '</div>' +
      '</div>';

    ['#dias-f1', '#dias-f2', '#dias-lab'].forEach(function (sel) {
      var el = body.querySelector(sel);
      if (el) el.onchange = function () { renderDias(root); };
    });
    attachEvents('dias', root);
  }

  // ── IMC ──────────────────────────────────────────────────────
  function renderIMC(root) {
    var body = root.querySelector('#body-imc');
    if (!body) return;

    var peso = parseFloat(val(body, '#imc-peso')) || 0;
    var altura = parseFloat(val(body, '#imc-altura')) || 0;

    var imc = 0, categoria = '', nota = '';
    if (peso > 0 && altura > 0) {
      var altM = altura / 100;
      imc = peso / (altM * altM);
      if (imc < 18.5) { categoria = 'Bajo peso'; nota = 'IMC por debajo de lo recomendado por la OMS.'; }
      else if (imc < 25) { categoria = 'Peso normal'; nota = 'IMC dentro del rango saludable según la OMS.'; }
      else if (imc < 30) { categoria = 'Sobrepeso'; nota = 'IMC por encima del rango saludable.'; }
      else if (imc < 35) { categoria = 'Obesidad grado I'; nota = 'Se recomienda consultar con un médico.'; }
      else if (imc < 40) { categoria = 'Obesidad grado II'; nota = 'Se recomienda atención médica.'; }
      else { categoria = 'Obesidad grado III'; nota = 'Consulta médica prioritaria.'; }
    }

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="imc-peso">Peso <span class="lbl-note">(kg)</span></label>' +
            '<input type="number" id="imc-peso" min="1" max="300" step="0.1" placeholder="70" value="' + (peso || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="imc-altura">Altura <span class="lbl-note">(cm)</span></label>' +
            '<input type="number" id="imc-altura" min="50" max="250" step="1" placeholder="170" value="' + (altura || '') + '">' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular IMC</button>' +
        '</form>' +
        '<div>' +
          (imc > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Índice de masa corporal</div>' +
              '<div class="result-main">' + fmt(imc, 1) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Categoría OMS</span><span class="rv">' + categoria + '</span></div>' +
                '<div class="result-row"><span class="rk">Peso normal para tu altura</span><span class="rv">' + fmt(18.5 * Math.pow(altura / 100, 2), 1) + ' – ' + fmt(24.9 * Math.pow(altura / 100, 2), 1) + ' kg</span></div>' +
              '</div>' +
              '<p class="result-note">⚠️ ' + nota + ' El IMC es un indicador general; no sustituye la evaluación médica.</p>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando datos</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('imc', root);
  }

  // ── PRÉSTAMO PERSONAL ────────────────────────────────────────
  function renderPrestamo(root) {
    var body = root.querySelector('#body-prestamo');
    if (!body) return;

    var capital = parseFloat(val(body, '#pre-capital')) || 0;
    var tin = parseFloat(val(body, '#pre-tin'));
    if (isNaN(tin)) tin = 8;
    var meses = parseInt(val(body, '#pre-meses'), 10) || 48;

    var r = (tin / 100) / 12;
    var cuota = r === 0 ? capital / meses : capital * r * Math.pow(1 + r, meses) / (Math.pow(1 + r, meses) - 1);
    var total = cuota * meses;
    var intereses = total - capital;
    var tae = Math.pow(1 + r, 12) - 1;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="pre-capital">Importe <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="pre-capital" min="0" step="100" placeholder="10.000" value="' + (capital || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="pre-tin">TIN anual <span class="lbl-note">(%)</span></label>' +
            '<input type="number" id="pre-tin" min="0" max="50" step="0.01" placeholder="8,00" value="' + tin + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="pre-meses">Plazo <span class="lbl-note">(meses)</span></label>' +
            '<input type="number" id="pre-meses" min="1" max="120" placeholder="48" value="' + meses + '">' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular cuota</button>' +
        '</form>' +
        '<div>' +
          (capital > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Cuota mensual</div>' +
              '<div class="result-main">' + fmtE(cuota) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Capital</span><span class="rv">' + fmtE(capital) + '</span></div>' +
                '<div class="result-row"><span class="rk">Intereses totales</span><span class="rv">' + fmtE(intereses) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total a pagar</span><span class="rv">' + fmtE(total) + '</span></div>' +
                '<div class="result-row"><span class="rk">TAE estimado</span><span class="rv">' + fmt(tae * 100, 2) + ' %</span></div>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando datos</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('prestamo', root);
  }

  // ── AHORRO ───────────────────────────────────────────────────
  function renderAhorro(root) {
    var body = root.querySelector('#body-ahorro');
    if (!body) return;

    var objetivo = parseFloat(val(body, '#aho-objetivo')) || 0;
    var inicial = parseFloat(val(body, '#aho-inicial')) || 0;
    var anios = parseInt(val(body, '#aho-anios'), 10) || 5;
    var rentabilidad = parseFloat(val(body, '#aho-renta'));
    if (isNaN(rentabilidad)) rentabilidad = 3;

    var n = anios * 12;
    var r = (rentabilidad / 100) / 12;
    var mensual = 0, totalAportado = 0, totalIntereses = 0;

    if (objetivo > inicial) {
      var falta = objetivo - inicial * Math.pow(1 + r, n);
      mensual = r === 0 ? falta / n : falta * r / (Math.pow(1 + r, n) - 1);
      totalAportado = inicial + mensual * n;
      totalIntereses = objetivo - totalAportado;
    }

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="aho-objetivo">Objetivo de ahorro <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="aho-objetivo" min="0" step="500" placeholder="20.000" value="' + (objetivo || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="aho-inicial">Ahorro actual <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="aho-inicial" min="0" step="100" placeholder="0" value="' + (inicial || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="aho-anios">Plazo <span class="lbl-note">(años)</span></label>' +
            '<input type="number" id="aho-anios" min="1" max="40" placeholder="5" value="' + anios + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="aho-renta">Rentabilidad anual esperada <span class="lbl-note">(%)</span></label>' +
            '<input type="number" id="aho-renta" min="0" max="30" step="0.1" placeholder="3,0" value="' + rentabilidad + '">' +
            '<p class="field-note">Cuenta de ahorro: 2–3 %. Fondo indexado histórico: 7–9 %.</p>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular ahorro</button>' +
        '</form>' +
        '<div>' +
          (objetivo > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Ahorro mensual necesario</div>' +
              '<div class="result-main">' + (mensual > 0 ? fmtE(mensual) : 'Ya lo tienes') + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Objetivo</span><span class="rv">' + fmtE(objetivo) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total aportado</span><span class="rv">' + fmtE(totalAportado) + '</span></div>' +
                '<div class="result-row"><span class="rk">Intereses generados</span><span class="rv">' + fmtE(Math.max(totalIntereses, 0)) + '</span></div>' +
                '<div class="result-row"><span class="rk">Plazo</span><span class="rv">' + anios + ' años (' + n + ' meses)</span></div>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando datos</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('ahorro', root);
  }

  // ── PROPINA ──────────────────────────────────────────────────
  function renderPropina(root) {
    var body = root.querySelector('#body-propina');
    if (!body) return;

    var cuenta = parseFloat(val(body, '#pro-cuenta')) || 0;
    var personas = parseInt(val(body, '#pro-personas'), 10) || 2;
    var pctBtn = body.querySelector('.seg.pro-pct .on');
    var pct = parseFloat((pctBtn && pctBtn.dataset.val) || '10');

    var propina = cuenta * (pct / 100);
    var total = cuenta + propina;
    var porPersona = personas > 0 ? total / personas : 0;
    var propinaPersona = personas > 0 ? propina / personas : 0;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="pro-cuenta">Total de la cuenta <span class="lbl-note">(€)</span></label>' +
            '<input type="number" id="pro-cuenta" min="0" step="0.5" placeholder="60,00" value="' + (cuenta || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" id="pro-pct-label">Propina</label>' +
            '<div class="seg pro-pct" role="group" aria-labelledby="pro-pct-label">' +
              '<button type="button" data-val="0" class="' + (pct === 0 ? 'on' : '') + '">0 %</button>' +
              '<button type="button" data-val="5" class="' + (pct === 5 ? 'on' : '') + '">5 %</button>' +
              '<button type="button" data-val="10" class="' + (pct === 10 ? 'on' : '') + '">10 %</button>' +
              '<button type="button" data-val="15" class="' + (pct === 15 ? 'on' : '') + '">15 %</button>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="pro-personas">Personas</label>' +
            '<input type="number" id="pro-personas" min="1" max="50" placeholder="2" value="' + personas + '">' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular reparto</button>' +
        '</form>' +
        '<div>' +
          (cuenta > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Por persona</div>' +
              '<div class="result-main">' + fmtE(porPersona) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Cuenta</span><span class="rv">' + fmtE(cuenta) + '</span></div>' +
                '<div class="result-row"><span class="rk">Propina (' + pct + ' %)</span><span class="rv">' + fmtE(propina) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total con propina</span><span class="rv">' + fmtE(total) + '</span></div>' +
                '<div class="result-row"><span class="rk">Propina por persona</span><span class="rv">' + fmtE(propinaPersona) + '</span></div>' +
                '<div class="result-row"><span class="rk">Total por persona</span><span class="rv">' + fmtE(porPersona) + '</span></div>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando cuenta</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('propina', root);
  }

  // ── COMBUSTIBLE ──────────────────────────────────────────────
  function renderCombustible(root) {
    var body = root.querySelector('#body-combustible');
    if (!body) return;

    var km = parseFloat(val(body, '#com-km')) || 0;
    var consumo = parseFloat(val(body, '#com-consumo'));
    if (isNaN(consumo)) consumo = 7;
    var precio = parseFloat(val(body, '#com-precio'));
    if (isNaN(precio)) precio = 1.65;

    var litros = (km * consumo) / 100;
    var coste = litros * precio;
    var costePorKm = km > 0 ? coste / km : 0;

    body.innerHTML =
      '<div class="panel-grid">' +
        '<form novalidate>' +
          '<div class="field">' +
            '<label class="lbl" for="com-km">Distancia del viaje <span class="lbl-note">(km)</span></label>' +
            '<input type="number" id="com-km" min="0" step="10" placeholder="500" value="' + (km || '') + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="com-consumo">Consumo del vehículo <span class="lbl-note">(l/100 km)</span></label>' +
            '<input type="number" id="com-consumo" min="0" max="40" step="0.1" placeholder="7,0" value="' + consumo + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="lbl" for="com-precio">Precio del combustible <span class="lbl-note">(€/litro)</span></label>' +
            '<input type="number" id="com-precio" min="0" max="5" step="0.001" placeholder="1,650" value="' + precio + '">' +
            '<p class="field-note">Gasolineras.es tiene el precio actualizado de cada estación.</p>' +
          '</div>' +
          '<button type="submit" class="btn-calc">Calcular coste</button>' +
        '</form>' +
        '<div>' +
          (km > 0 ?
            '<div class="result-box">' +
              '<div class="result-label">Coste del viaje</div>' +
              '<div class="result-main">' + fmtE(coste) + '</div>' +
              '<div class="result-rows">' +
                '<div class="result-row"><span class="rk">Litros necesarios</span><span class="rv">' + fmt(litros, 2) + ' l</span></div>' +
                '<div class="result-row"><span class="rk">Coste por km</span><span class="rv">' + fmt(costePorKm, 3) + ' €/km</span></div>' +
                '<div class="result-row"><span class="rk">Coste de ida y vuelta</span><span class="rv">' + fmtE(coste * 2) + '</span></div>' +
              '</div>' +
              '<div class="result-actions">' +
                '<button type="button" class="btn-copy" data-copy="Viaje de ' + km + ' km\nLitros: ' + fmt(litros, 2) + ' l\nCoste: ' + fmtE(coste) + '">Copiar resultado</button>' +
              '</div>' +
            '</div>' :
            '<div class="result-box"><div class="result-label">Esperando distancia</div><div class="result-main">—</div></div>') +
        '</div>' +
      '</div>';
    attachEvents('combustible', root);
  }

  function val(body, sel) {
    var el = body.querySelector(sel);
    return el ? el.value : '';
  }

  var RENDERERS = {
    iva: renderIVA,
    finiquito: renderFiniquito,
    nomina: renderNomina,
    hipoteca: renderHipoteca,
    porcentaje: renderPorcentaje,
    dias: renderDias,
    imc: renderIMC,
    prestamo: renderPrestamo,
    ahorro: renderAhorro,
    propina: renderPropina,
    combustible: renderCombustible,
  };

  function initCalculator(id) {
    var fn = RENDERERS[id];
    if (fn) fn(document);
  }

  window.CalcYa = { initCalculator: initCalculator };
})();
