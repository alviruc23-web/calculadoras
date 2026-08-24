/* ============================================================
   CalcYa — motor de cálculo.

   Este fichero NO toca el DOM. Contiene:
     - utilidades de formato y parseo
     - la especificación declarativa de cada calculadora (campos)
     - una función `compute` pura por calculadora

   Al no depender del navegador puede cargarse tanto con <script>
   como con require() desde Node, que es lo que permite testear la
   matemática (ver test/math.test.js).

   Para añadir una calculadora nueva basta con añadir una entrada a
   CALC_SPECS: la interfaz se genera sola desde `fields`.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CalcEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- formato ---------------------------------------------------- */

  function isFiniteNum(n) {
    return typeof n === 'number' && isFinite(n);
  }

  // Formatea un número en convención española. Devuelve '—' si no es finito,
  // de modo que ningún resultado pueda mostrar NaN o Infinity al usuario.
  function fmt(n, dec) {
    if (dec === undefined) dec = 2;
    if (!isFiniteNum(n)) return '—';
    // Evita "-0,00"
    if (Math.abs(n) < Math.pow(10, -dec) / 2) n = 0;
    return n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function eur(n) { return isFiniteNum(n) ? fmt(n, 2) + ' €' : '—'; }
  function pct(n, dec) { return isFiniteNum(n) ? fmt(n, dec === undefined ? 2 : dec) + ' %' : '—'; }

  /* ---- parseo ------------------------------------------------------
     Distingue "vacío" (null) de 0. El código antiguo usaba
     `parseFloat(x) || defecto`, que convertía un 0 legítimo escrito por
     el usuario en el valor por defecto.
     ------------------------------------------------------------------ */

  function num(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim();
    if (s === '') return null;
    var n = Number(s.replace(',', '.'));
    return isFiniteNum(n) ? n : null;
  }
  function intOr(raw, fallback) {
    var n = num(raw);
    if (n === null) return fallback;
    return Math.trunc(n);
  }
  function numOr(raw, fallback) {
    var n = num(raw);
    return n === null ? fallback : n;
  }

  /* ---- fechas ------------------------------------------------------
     Parsea 'YYYY-MM-DD' en UTC y opera siempre en UTC. Usar
     `new Date('2026-01-01')` + getDay() mezclaba UTC y hora local, lo
     que desplazaba el día de la semana (y por tanto el recuento de días
     laborables) en husos horarios por detrás de UTC.
     ------------------------------------------------------------------ */

  function parseISODate(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var ts = Date.UTC(y, mo - 1, d);
    var dt = new Date(ts);
    // Rechaza fechas imposibles (31 de febrero, etc.)
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }
  var DAY_MS = 86400000;

  /* ---- amortización francesa --------------------------------------- */

  // Cuota constante de un préstamo. `rate` es el tipo por periodo.
  function payment(principal, rate, periods) {
    if (!(periods > 0)) return NaN;
    if (rate === 0) return principal / periods;
    var f = Math.pow(1 + rate, periods);
    return principal * rate * f / (f - 1);
  }

  /* ---- IRPF --------------------------------------------------------
     Escala general (estatal + autonómica agregada) aplicada de forma
     PROGRESIVA por tramos. La versión anterior aplicaba el tipo del
     tramo a la totalidad del salario, lo que sobreestimaba mucho la
     retención (un sueldo de 28.000 € pagaba un 30 % plano).
     ------------------------------------------------------------------ */

  var IRPF_BRACKETS = [
    { upTo: 12450, rate: 0.19 },
    { upTo: 20200, rate: 0.24 },
    { upTo: 35200, rate: 0.30 },
    { upTo: 60000, rate: 0.37 },
    { upTo: 300000, rate: 0.45 },
    { upTo: Infinity, rate: 0.47 },
  ];

  function progressiveTax(base) {
    if (!(base > 0)) return 0;
    var total = 0, prev = 0;
    for (var i = 0; i < IRPF_BRACKETS.length; i++) {
      var b = IRPF_BRACKETS[i];
      if (base <= prev) break;
      var slice = Math.min(base, b.upTo) - prev;
      total += slice * b.rate;
      prev = b.upTo;
    }
    return total;
  }

  // Mínimo por descendientes (importes por hijo, acumulativos).
  var CHILD_MIN = [2400, 2700, 4000, 4500];
  var MAX_CHILDREN = 20; // tope defensivo: evita bucles enormes con entradas absurdas
  function childMinimum(n) {
    if (!isFiniteNum(n) || n <= 0) return 0;
    n = Math.min(Math.floor(n), MAX_CHILDREN);
    var total = 0;
    for (var i = 0; i < n; i++) total += CHILD_MIN[Math.min(i, CHILD_MIN.length - 1)];
    return total;
  }

  // Límites defensivos: entradas fuera de estos rangos no representan un caso
  // real y, sin tope, degeneran en Infinity o en cálculos sin sentido.
  var MAX_AMOUNT = 1e12;
  var MAX_YEARS = 100;
  var MAX_MONTHS = 1200;

  var SS_RATE = 0.0635;      // cotización del trabajador (régimen general)
  var PERSONAL_MIN = 5550;   // mínimo personal del contribuyente
  var WORK_EXPENSES = 2000;  // otros gastos deducibles (art. 19 LIRPF)

  // Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF).
  function workIncomeReduction(netIncome) {
    if (netIncome <= 14047.5) return 6498;
    if (netIncome < 19747.5) return 6498 - 1.14 * (netIncome - 14047.5);
    return 0;
  }

  /* ================================================================
     ESPECIFICACIONES
     Cada entrada: { fields, submitLabel, compute }
     `compute(v)` recibe los valores ya parseados y devuelve:
       { empty:true, hint }               -> aún faltan datos
       { error }                          -> entrada inválida
       { main:{label,value}, rows, note, copy }  -> resultado
     ================================================================ */

  var CALC_SPECS = {

    /* ---------------------------------------------------------- IVA */
    iva: {
      submitLabel: 'Calcular IVA',
      fields: [
        { id: 'precio', label: 'Precio', unit: '€', type: 'number', min: 0, step: '0.01', placeholder: '100', autofocus: true },
        {
          id: 'tipo', label: 'Tipo de IVA', type: 'segment', default: '21',
          options: [{ value: '4', label: '4 %' }, { value: '10', label: '10 %' }, { value: '21', label: '21 %' }],
        },
        {
          id: 'modo', label: 'Operación', type: 'select', default: 'anadir',
          options: [
            { value: 'anadir', label: 'Añadir IVA (precio sin IVA → con IVA)' },
            { value: 'quitar', label: 'Quitar IVA (precio con IVA → sin IVA)' },
          ],
        },
      ],
      compute: function (v) {
        var precio = num(v.precio);
        if (precio === null) return { empty: true, hint: 'Introduce un precio para ver el desglose del IVA.' };
        if (precio < 0) return { error: 'El precio no puede ser negativo.' };
        if (precio > MAX_AMOUNT) return { error: 'El precio introducido no es un importe real.' };

        var rate = numOr(v.tipo, 21) / 100;
        var base, iva, total;
        if (v.modo === 'quitar') {
          total = precio; base = precio / (1 + rate); iva = total - base;
        } else {
          base = precio; iva = precio * rate; total = base + iva;
        }
        return {
          main: { label: v.modo === 'quitar' ? 'Precio sin IVA' : 'Precio con IVA', value: eur(v.modo === 'quitar' ? base : total) },
          rows: [
            { k: 'Base imponible (sin IVA)', v: eur(base) },
            { k: 'IVA (' + fmt(numOr(v.tipo, 21), 0) + ' %)', v: eur(iva) },
            { k: 'Total con IVA', v: eur(total), strong: true },
          ],
          copy: 'Base sin IVA: ' + eur(base) + '\nIVA (' + fmt(numOr(v.tipo, 21), 0) + ' %): ' + eur(iva) + '\nTotal con IVA: ' + eur(total),
        };
      },
    },

    /* ---------------------------------------------------- FINIQUITO */
    finiquito: {
      submitLabel: 'Calcular finiquito',
      fields: [
        { id: 'salario', label: 'Salario bruto mensual', unit: '€', type: 'number', min: 0, step: '50', placeholder: '1800', autofocus: true },
        { id: 'dias', label: 'Días trabajados del mes en curso', type: 'number', min: 0, max: 31, placeholder: '15', help: 'Días trabajados en el mes de la baja o el despido.' },
        { id: 'vacaciones', label: 'Días de vacaciones pendientes', type: 'number', min: 0, max: 60, step: '0.5', placeholder: '8' },
        { id: 'preaviso', label: 'Días de preaviso no trabajados', type: 'number', min: 0, max: 90, placeholder: '0', help: 'Solo si el preaviso no se ha cumplido y corresponde indemnizarlo.' },
      ],
      compute: function (v) {
        var salario = num(v.salario);
        if (salario === null) return { empty: true, hint: 'Introduce tu salario bruto mensual para estimar el finiquito.' };
        if (salario < 0) return { error: 'El salario no puede ser negativo.' };
        if (salario > MAX_AMOUNT) return { error: 'El salario introducido no es un importe real.' };

        var dias = numOr(v.dias, 0), vac = numOr(v.vacaciones, 0), pre = numOr(v.preaviso, 0);
        if (dias < 0 || vac < 0 || pre < 0) return { error: 'Los días no pueden ser negativos.' };
        if (dias > 31) return { error: 'Un mes no puede tener más de 31 días trabajados.' };
        if (vac > 60) return { error: 'Los días de vacaciones pendientes no pueden superar los 60.' };
        if (pre > 90) return { error: 'Los días de preaviso no pueden superar los 90.' };

        var diario = salario / 30;
        var pSalario = diario * dias;
        var pVacaciones = diario * vac;
        var pPreaviso = diario * pre;
        var total = pSalario + pVacaciones + pPreaviso;

        var rows = [
          { k: 'Salario diario', v: eur(diario) },
          { k: 'Días trabajados (' + fmt(dias, 0) + ')', v: eur(pSalario) },
          { k: 'Vacaciones no disfrutadas (' + fmt(vac, 1) + ')', v: eur(pVacaciones) },
        ];
        if (pre > 0) rows.push({ k: 'Preaviso no trabajado (' + fmt(pre, 0) + ')', v: eur(pPreaviso) });
        rows.push({ k: 'Total bruto', v: eur(total), strong: true });

        return {
          main: { label: 'Finiquito bruto', value: eur(total) },
          rows: rows,
          note: 'Importe bruto: todavía se le aplicarán IRPF y Seguridad Social. El finiquito no incluye la indemnización por despido, que es un concepto aparte.',
          copy: 'Finiquito bruto estimado: ' + eur(total) + '\n- Días trabajados: ' + eur(pSalario) + '\n- Vacaciones: ' + eur(pVacaciones),
        };
      },
    },

    /* ------------------------------------------------------- NÓMINA */
    nomina: {
      submitLabel: 'Calcular sueldo neto',
      fields: [
        { id: 'bruto', label: 'Salario bruto anual', unit: '€', type: 'number', min: 0, step: '500', placeholder: '28000', autofocus: true, help: 'El total del año, antes de impuestos.' },
        {
          id: 'pagas', label: 'Número de pagas', type: 'segment', default: '14',
          options: [{ value: '12', label: '12 pagas' }, { value: '14', label: '14 pagas' }],
        },
        { id: 'hijos', label: 'Hijos a cargo menores de 25 años', type: 'number', min: 0, max: 10, placeholder: '0' },
      ],
      compute: function (v) {
        var bruto = num(v.bruto);
        if (bruto === null) return { empty: true, hint: 'Introduce tu salario bruto anual para calcular el neto.' };
        if (bruto < 0) return { error: 'El salario no puede ser negativo.' };
        if (bruto > MAX_AMOUNT) return { error: 'El salario introducido no es un importe real.' };

        var pagas = intOr(v.pagas, 14);
        var hijos = Math.max(0, intOr(v.hijos, 0));

        var ss = bruto * SS_RATE;
        var netoPrevio = Math.max(0, bruto - ss - WORK_EXPENSES);
        var reduccion = workIncomeReduction(netoPrevio);
        var baseLiquidable = Math.max(0, netoPrevio - reduccion);

        var minimo = PERSONAL_MIN + childMinimum(hijos);
        var cuota = Math.max(0, progressiveTax(baseLiquidable) - progressiveTax(minimo));

        var tipo = bruto > 0 ? (cuota / bruto) * 100 : 0;
        var netoAnual = bruto - ss - cuota;
        var netoPaga = pagas > 0 ? netoAnual / pagas : NaN;

        return {
          main: { label: 'Neto por paga (' + pagas + ' pagas)', value: eur(netoPaga) },
          rows: [
            { k: 'Bruto anual', v: eur(bruto) },
            { k: 'Seguridad Social (6,35 %)', v: '− ' + eur(ss) },
            { k: 'Retención IRPF (' + pct(tipo, 1) + ')', v: '− ' + eur(cuota) },
            { k: 'Neto anual', v: eur(netoAnual), strong: true },
            { k: 'Neto por paga', v: eur(netoPaga) },
            { k: 'Neto mensual equivalente', v: eur(netoAnual / 12) },
          ],
          note: 'Cálculo orientativo con la escala general del IRPF y el mínimo personal y familiar. Tu retención real depende de tu comunidad autónoma y de tu situación concreta (modelo 145).',
          copy: 'Bruto anual: ' + eur(bruto) + '\nNeto anual: ' + eur(netoAnual) + '\nNeto por paga (' + pagas + '): ' + eur(netoPaga),
        };
      },
    },

    /* ----------------------------------------------------- HIPOTECA */
    hipoteca: {
      submitLabel: 'Calcular cuota',
      fields: [
        { id: 'capital', label: 'Importe del préstamo', unit: '€', type: 'number', min: 0, step: '1000', placeholder: '150000', autofocus: true },
        { id: 'anios', label: 'Plazo', unit: 'años', type: 'number', min: 1, max: 40, placeholder: '25', default: '25' },
        { id: 'interes', label: 'Tipo de interés anual', unit: '%', type: 'number', min: 0, max: 20, step: '0.01', placeholder: '3', default: '3', help: 'En hipoteca variable, usa el Euríbor actual más tu diferencial.' },
      ],
      compute: function (v) {
        var capital = num(v.capital);
        if (capital === null) return { empty: true, hint: 'Introduce el importe del préstamo para ver tu cuota mensual.' };
        if (capital <= 0) return { error: 'El importe del préstamo debe ser mayor que cero.' };

        if (capital > MAX_AMOUNT) return { error: 'El importe es demasiado grande para un préstamo real.' };
        var anios = numOr(v.anios, 25);
        if (!(anios > 0)) return { error: 'El plazo debe ser de al menos un año.' };
        if (anios > MAX_YEARS) return { error: 'El plazo no puede superar los ' + MAX_YEARS + ' años.' };
        var interes = numOr(v.interes, 3);
        if (interes < 0) return { error: 'El tipo de interés no puede ser negativo.' };
        if (interes > 100) return { error: 'Introduce un tipo de interés real (en porcentaje anual, por ejemplo 3).' };

        var n = Math.round(anios * 12);
        var r = (interes / 100) / 12;
        var cuota = payment(capital, r, n);
        var totalPagado = cuota * n;
        var intereses = totalPagado - capital;

        return {
          main: { label: 'Cuota mensual', value: eur(cuota) },
          rows: [
            { k: 'Capital prestado', v: eur(capital) },
            { k: 'Plazo', v: fmt(anios, 0) + ' años (' + n + ' cuotas)' },
            { k: 'Intereses totales', v: eur(intereses) },
            { k: 'Total a devolver', v: eur(totalPagado), strong: true },
            { k: 'Intereses sobre el capital', v: pct(intereses / capital * 100, 1) },
          ],
          note: 'No incluye seguros, comisiones ni gastos asociados, que sí entran en el TAE.',
          copy: 'Cuota mensual: ' + eur(cuota) + '\nIntereses totales: ' + eur(intereses) + '\nTotal a devolver: ' + eur(totalPagado),
        };
      },
    },

    /* ----------------------------------------------------- PRÉSTAMO */
    prestamo: {
      submitLabel: 'Calcular cuota',
      fields: [
        { id: 'capital', label: 'Importe del préstamo', unit: '€', type: 'number', min: 0, step: '100', placeholder: '10000', autofocus: true },
        { id: 'tin', label: 'TIN anual', unit: '%', type: 'number', min: 0, max: 50, step: '0.01', placeholder: '8', default: '8' },
        { id: 'meses', label: 'Plazo', unit: 'meses', type: 'number', min: 1, max: 120, placeholder: '48', default: '48' },
      ],
      compute: function (v) {
        var capital = num(v.capital);
        if (capital === null) return { empty: true, hint: 'Introduce el importe para calcular la cuota del préstamo.' };
        if (capital <= 0) return { error: 'El importe del préstamo debe ser mayor que cero.' };

        if (capital > MAX_AMOUNT) return { error: 'El importe es demasiado grande para un préstamo real.' };
        var meses = numOr(v.meses, 48);
        if (!(meses >= 1)) return { error: 'El plazo debe ser de al menos un mes.' };
        if (meses > MAX_MONTHS) return { error: 'El plazo no puede superar los ' + MAX_MONTHS + ' meses.' };
        var tin = numOr(v.tin, 8);
        if (tin < 0) return { error: 'El TIN no puede ser negativo.' };
        if (tin > 100) return { error: 'Introduce un TIN real (en porcentaje anual, por ejemplo 8).' };

        var n = Math.round(meses);
        var r = (tin / 100) / 12;
        var cuota = payment(capital, r, n);
        var total = cuota * n;
        var intereses = total - capital;
        var tae = (Math.pow(1 + r, 12) - 1) * 100;

        return {
          main: { label: 'Cuota mensual', value: eur(cuota) },
          rows: [
            { k: 'Capital', v: eur(capital) },
            { k: 'Intereses totales', v: eur(intereses) },
            { k: 'Total a devolver', v: eur(total), strong: true },
            { k: 'TAE equivalente (sin comisiones)', v: pct(tae) },
          ],
          note: 'El TAE mostrado solo refleja la capitalización del TIN. El TAE real de una oferta incluye además comisiones y gastos.',
          copy: 'Cuota mensual: ' + eur(cuota) + '\nIntereses totales: ' + eur(intereses) + '\nTotal a devolver: ' + eur(total),
        };
      },
    },

    /* ------------------------------------------------------- AHORRO */
    ahorro: {
      submitLabel: 'Calcular ahorro mensual',
      fields: [
        { id: 'objetivo', label: 'Objetivo de ahorro', unit: '€', type: 'number', min: 0, step: '500', placeholder: '20000', autofocus: true },
        { id: 'inicial', label: 'Ahorro actual', unit: '€', type: 'number', min: 0, step: '100', placeholder: '0' },
        { id: 'anios', label: 'Plazo', unit: 'años', type: 'number', min: 1, max: 40, placeholder: '5', default: '5' },
        { id: 'rentabilidad', label: 'Rentabilidad anual esperada', unit: '%', type: 'number', min: 0, max: 30, step: '0.1', placeholder: '3', default: '3', help: 'Cuenta remunerada: 2–3 %. Fondo indexado global, históricamente: 7–9 %.' },
      ],
      compute: function (v) {
        var objetivo = num(v.objetivo);
        if (objetivo === null) return { empty: true, hint: 'Introduce cuánto quieres reunir para saber cuánto ahorrar al mes.' };
        if (objetivo <= 0) return { error: 'El objetivo debe ser mayor que cero.' };

        var inicial = Math.max(0, numOr(v.inicial, 0));
        if (objetivo > MAX_AMOUNT) return { error: 'El objetivo es demasiado grande.' };
        var anios = numOr(v.anios, 5);
        if (!(anios > 0)) return { error: 'El plazo debe ser de al menos un año.' };
        if (anios > MAX_YEARS) return { error: 'El plazo no puede superar los ' + MAX_YEARS + ' años.' };
        var rent = numOr(v.rentabilidad, 3);
        if (rent < 0) return { error: 'La rentabilidad no puede ser negativa.' };
        if (rent > 100) return { error: 'Introduce una rentabilidad anual real (en porcentaje, por ejemplo 5).' };

        var n = Math.round(anios * 12);
        var r = (rent / 100) / 12;
        var futuroInicial = inicial * Math.pow(1 + r, n);
        var falta = objetivo - futuroInicial;

        // Si lo que ya tienes ahorrado alcanza el objetivo por sí solo, la
        // aportación necesaria es cero (antes salía un importe negativo).
        if (falta <= 0) {
          return {
            main: { label: 'Ahorro mensual necesario', value: '0,00 €' },
            rows: [
              { k: 'Objetivo', v: eur(objetivo) },
              { k: 'Tienes ahora', v: eur(inicial) },
              { k: 'Valor en ' + fmt(anios, 0) + ' años', v: eur(futuroInicial), strong: true },
            ],
            note: 'Con la rentabilidad indicada, tu ahorro actual ya supera el objetivo en ese plazo sin necesidad de aportar nada más.',
            copy: 'Objetivo: ' + eur(objetivo) + '\nNo necesitas aportaciones: tu ahorro actual llega a ' + eur(futuroInicial) + '.',
          };
        }

        var mensual = r === 0 ? falta / n : falta * r / (Math.pow(1 + r, n) - 1);
        var aportado = inicial + mensual * n;
        var intereses = objetivo - aportado;

        return {
          main: { label: 'Ahorro mensual necesario', value: eur(mensual) },
          rows: [
            { k: 'Objetivo', v: eur(objetivo) },
            { k: 'Plazo', v: fmt(anios, 0) + ' años (' + n + ' meses)' },
            { k: 'Aportado de tu bolsillo', v: eur(aportado) },
            { k: 'Generado por intereses', v: eur(Math.max(0, intereses)) },
            { k: 'Total al final', v: eur(objetivo), strong: true },
          ],
          note: 'Supone aportaciones constantes a principio de cada mes y una rentabilidad estable, que en una inversión real puede variar.',
          copy: 'Para reunir ' + eur(objetivo) + ' en ' + fmt(anios, 0) + ' años necesitas ahorrar ' + eur(mensual) + ' al mes.',
        };
      },
    },

    /* --------------------------------------------------- PORCENTAJE */
    porcentaje: {
      submitLabel: 'Calcular',
      fields: [
        {
          id: 'modo', label: 'Tipo de cálculo', type: 'segment', default: 'pct_de',
          options: [
            { value: 'pct_de', label: 'X % de Y' },
            { value: 'que_pct', label: '¿Qué % es?' },
            { value: 'variacion', label: 'Variación' },
          ],
        },
        { id: 'a', label: 'Valor A', type: 'number', step: 'any', placeholder: '20', autofocus: true },
        { id: 'b', label: 'Valor B', type: 'number', step: 'any', placeholder: '150' },
      ],
      // Las etiquetas de A y B cambian según el modo elegido.
      labelsFor: function (modo) {
        if (modo === 'que_pct') return { a: 'Valor parcial', b: 'Valor total' };
        if (modo === 'variacion') return { a: 'Valor inicial', b: 'Valor final' };
        return { a: 'Porcentaje (%)', b: 'Cantidad' };
      },
      compute: function (v) {
        var modo = v.modo || 'pct_de';
        var a = num(v.a), b = num(v.b);
        if (a === null || b === null) return { empty: true, hint: 'Rellena los dos valores para ver el resultado.' };
        if (Math.abs(a) > MAX_AMOUNT || Math.abs(b) > MAX_AMOUNT) return { error: 'Introduce valores reales: alguno de los dos números es demasiado grande.' };

        if (modo === 'que_pct') {
          if (b === 0) return { error: 'El valor total no puede ser cero: no se puede calcular un porcentaje sobre cero.' };
          var p = (a / b) * 100;
          return {
            main: { label: fmt(a, 2) + ' de ' + fmt(b, 2) + ' es', value: pct(p) },
            rows: [{ k: 'Valor parcial', v: fmt(a, 2) }, { k: 'Valor total', v: fmt(b, 2) }, { k: 'Porcentaje', v: pct(p), strong: true }],
            copy: fmt(a, 2) + ' es el ' + pct(p) + ' de ' + fmt(b, 2),
          };
        }

        if (modo === 'variacion') {
          if (a === 0) return { error: 'No se puede calcular la variación porcentual partiendo de cero.' };
          var d = ((b - a) / a) * 100;
          var sign = d >= 0 ? '+' : '';
          return {
            main: { label: d >= 0 ? 'Aumento' : 'Descenso', value: sign + pct(d) },
            rows: [
              { k: 'Valor inicial', v: fmt(a, 2) },
              { k: 'Valor final', v: fmt(b, 2) },
              { k: 'Diferencia absoluta', v: fmt(b - a, 2) },
              { k: 'Variación', v: sign + pct(d), strong: true },
            ],
            copy: 'De ' + fmt(a, 2) + ' a ' + fmt(b, 2) + ': ' + sign + pct(d),
          };
        }

        var res = (a / 100) * b;
        return {
          main: { label: fmt(a, 2) + ' % de ' + fmt(b, 2), value: fmt(res, 2) },
          rows: [
            { k: 'Porcentaje', v: pct(a) },
            { k: 'Cantidad', v: fmt(b, 2) },
            { k: 'Resultado', v: fmt(res, 2), strong: true },
            { k: 'Cantidad menos ese %', v: fmt(b - res, 2) },
            { k: 'Cantidad más ese %', v: fmt(b + res, 2) },
          ],
          copy: 'El ' + pct(a) + ' de ' + fmt(b, 2) + ' es ' + fmt(res, 2),
        };
      },
    },

    /* --------------------------------------------------------- DÍAS */
    dias: {
      submitLabel: 'Calcular días',
      fields: [
        { id: 'inicio', label: 'Fecha de inicio', type: 'date', autofocus: true },
        { id: 'fin', label: 'Fecha de fin', type: 'date' },
        { id: 'soloLaborables', label: 'Contar solo días laborables (lunes a viernes)', type: 'checkbox' },
      ],
      compute: function (v) {
        var d1 = parseISODate(v.inicio), d2 = parseISODate(v.fin);
        if (!d1 || !d2) return { empty: true, hint: 'Selecciona las dos fechas para calcular la diferencia.' };

        var start = d1 <= d2 ? d1 : d2;
        var end = d1 <= d2 ? d2 : d1;
        var dias = Math.round((end - start) / DAY_MS);

        // Días laborables: se calculan por semanas completas más el resto,
        // en UTC, para que el resultado no dependa del huso del visitante.
        var semanasEnteras = Math.floor(dias / 7);
        var laborables = semanasEnteras * 5;
        var resto = dias - semanasEnteras * 7;
        var cursor = new Date(start.getTime() + semanasEnteras * 7 * DAY_MS);
        for (var i = 0; i < resto; i++) {
          cursor = new Date(cursor.getTime() + DAY_MS);
          var wd = cursor.getUTCDay();
          if (wd !== 0 && wd !== 6) laborables++;
        }

        var soloLab = !!v.soloLaborables;
        var valor = soloLab ? laborables : dias;

        return {
          main: { label: soloLab ? 'Días laborables' : 'Días totales', value: fmt(valor, 0) + (valor === 1 ? ' día' : ' días') },
          rows: [
            { k: 'Días naturales', v: fmt(dias, 0), strong: !soloLab },
            { k: 'Días laborables (L-V)', v: fmt(laborables, 0), strong: soloLab },
            { k: 'Fines de semana', v: fmt(dias - laborables, 0) },
            { k: 'Semanas completas', v: fmt(semanasEnteras, 0) },
            { k: 'Meses aproximados', v: fmt(dias / 30.44, 1) },
          ],
          note: 'No se descuentan los festivos nacionales, autonómicos ni locales.',
          copy: 'Entre ' + v.inicio + ' y ' + v.fin + ' hay ' + fmt(dias, 0) + ' días naturales (' + fmt(laborables, 0) + ' laborables).',
        };
      },
    },

    /* ---------------------------------------------------------- IMC */
    imc: {
      submitLabel: 'Calcular IMC',
      fields: [
        { id: 'peso', label: 'Peso', unit: 'kg', type: 'number', min: 1, max: 400, step: '0.1', placeholder: '70', autofocus: true },
        { id: 'altura', label: 'Altura', unit: 'cm', type: 'number', min: 50, max: 260, step: '1', placeholder: '170' },
      ],
      compute: function (v) {
        var peso = num(v.peso), altura = num(v.altura);
        if (peso === null || altura === null) return { empty: true, hint: 'Introduce tu peso y tu altura para calcular el IMC.' };
        if (peso <= 0) return { error: 'El peso debe ser mayor que cero.' };
        if (peso > 500) return { error: 'Introduce el peso en kilogramos (por ejemplo, 70).' };
        if (altura <= 0) return { error: 'La altura debe ser mayor que cero.' };
        if (altura < 50 || altura > 260) return { error: 'Introduce la altura en centímetros (por ejemplo, 170).' };

        var m = altura / 100;
        var imc = peso / (m * m);

        var cat, nota;
        if (imc < 18.5) { cat = 'Bajo peso'; nota = 'Por debajo del rango de referencia de la OMS.'; }
        else if (imc < 25) { cat = 'Peso normal'; nota = 'Dentro del rango de referencia de la OMS.'; }
        else if (imc < 30) { cat = 'Sobrepeso'; nota = 'Por encima del rango de referencia de la OMS.'; }
        else if (imc < 35) { cat = 'Obesidad grado I'; nota = 'Conviene valorarlo con un profesional sanitario.'; }
        else if (imc < 40) { cat = 'Obesidad grado II'; nota = 'Se recomienda valoración médica.'; }
        else { cat = 'Obesidad grado III'; nota = 'Se recomienda valoración médica prioritaria.'; }

        var pesoMin = 18.5 * m * m, pesoMax = 24.9 * m * m;

        return {
          main: { label: 'Índice de masa corporal', value: fmt(imc, 1) },
          rows: [
            { k: 'Categoría (OMS)', v: cat, strong: true },
            { k: 'Rango de peso normal para tu altura', v: fmt(pesoMin, 1) + ' – ' + fmt(pesoMax, 1) + ' kg' },
            { k: 'Diferencia con el rango', v: imc < 18.5 ? '−' + fmt(pesoMin - peso, 1) + ' kg' : (imc >= 25 ? '+' + fmt(peso - pesoMax, 1) + ' kg' : 'Dentro del rango') },
          ],
          note: nota + ' El IMC es un indicador orientativo: no distingue entre masa muscular y grasa, ni sustituye una valoración médica.',
          copy: 'IMC: ' + fmt(imc, 1) + ' (' + cat + ')',
        };
      },
    },

    /* ------------------------------------------------------ PROPINA */
    propina: {
      submitLabel: 'Calcular reparto',
      fields: [
        { id: 'cuenta', label: 'Total de la cuenta', unit: '€', type: 'number', min: 0, step: '0.5', placeholder: '60', autofocus: true },
        {
          id: 'porcentaje', label: 'Propina', type: 'segment', default: '10',
          options: [{ value: '0', label: '0 %' }, { value: '5', label: '5 %' }, { value: '10', label: '10 %' }, { value: '15', label: '15 %' }],
        },
        { id: 'personas', label: 'Personas', type: 'number', min: 1, max: 100, placeholder: '2', default: '2' },
      ],
      compute: function (v) {
        var cuenta = num(v.cuenta);
        if (cuenta === null) return { empty: true, hint: 'Introduce el total de la cuenta para repartirla.' };
        if (cuenta < 0) return { error: 'La cuenta no puede ser negativa.' };
        if (cuenta > MAX_AMOUNT) return { error: 'El importe de la cuenta no es real.' };

        var personas = intOr(v.personas, 2);
        if (!(personas >= 1)) return { error: 'Tiene que haber al menos una persona.' };
        if (personas > 1000) return { error: 'Introduce un número de personas real.' };

        var p = numOr(v.porcentaje, 10);
        var propina = cuenta * (p / 100);
        var total = cuenta + propina;

        return {
          main: { label: 'Paga cada persona', value: eur(total / personas) },
          rows: [
            { k: 'Cuenta', v: eur(cuenta) },
            { k: 'Propina (' + fmt(p, 0) + ' %)', v: eur(propina) },
            { k: 'Total con propina', v: eur(total), strong: true },
            { k: 'Propina por persona', v: eur(propina / personas) },
            { k: 'Total por persona (' + personas + ')', v: eur(total / personas) },
          ],
          copy: 'Cuenta ' + eur(cuenta) + ' + propina ' + eur(propina) + ' = ' + eur(total) + '. Cada persona: ' + eur(total / personas) + '.',
        };
      },
    },

    /* -------------------------------------------------- COMBUSTIBLE */
    combustible: {
      submitLabel: 'Calcular coste',
      fields: [
        { id: 'km', label: 'Distancia del viaje', unit: 'km', type: 'number', min: 0, step: '10', placeholder: '500', autofocus: true },
        { id: 'consumo', label: 'Consumo medio', unit: 'l/100 km', type: 'number', min: 0.1, max: 60, step: '0.1', placeholder: '7', default: '7' },
        { id: 'precio', label: 'Precio del combustible', unit: '€/litro', type: 'number', min: 0, max: 5, step: '0.001', placeholder: '1.65', default: '1.65' },
        { id: 'personas', label: 'Personas que comparten gastos', type: 'number', min: 1, max: 9, placeholder: '1', default: '1' },
      ],
      compute: function (v) {
        var km = num(v.km);
        if (km === null) return { empty: true, hint: 'Introduce los kilómetros del viaje para calcular el coste.' };
        if (km < 0) return { error: 'La distancia no puede ser negativa.' };
        if (km > 1e7) return { error: 'Esa distancia no corresponde a un viaje real.' };

        var consumo = numOr(v.consumo, 7);
        if (!(consumo > 0)) return { error: 'El consumo debe ser mayor que cero.' };
        var precio = numOr(v.precio, 1.65);
        if (precio < 0) return { error: 'El precio no puede ser negativo.' };
        var personas = Math.max(1, intOr(v.personas, 1));
        if (personas > 1000) return { error: 'Introduce un número de personas real.' };

        var litros = (km * consumo) / 100;
        var coste = litros * precio;

        var rows = [
          { k: 'Litros necesarios', v: fmt(litros, 2) + ' l' },
          { k: 'Coste por kilómetro', v: km > 0 ? fmt(coste / km, 3) + ' €/km' : '—' },
          { k: 'Coste solo ida', v: eur(coste), strong: true },
          { k: 'Ida y vuelta', v: eur(coste * 2) },
        ];
        if (personas > 1) rows.push({ k: 'Por persona (ida y vuelta)', v: eur(coste * 2 / personas) });

        return {
          main: { label: 'Coste del viaje (ida)', value: eur(coste) },
          rows: rows,
          note: 'El consumo real suele ser un 10–15 % superior al homologado, sobre todo en ciudad o con el coche cargado.',
          copy: 'Viaje de ' + fmt(km, 0) + ' km: ' + fmt(litros, 2) + ' litros, ' + eur(coste) + ' (ida).',
        };
      },
    },
  };

  return {
    CALC_SPECS: CALC_SPECS,
    fmt: fmt, eur: eur, pct: pct,
    num: num, numOr: numOr, intOr: intOr,
    parseISODate: parseISODate,
    payment: payment,
    progressiveTax: progressiveTax,
    childMinimum: childMinimum,
    compute: function (id, values) {
      var spec = CALC_SPECS[id];
      if (!spec) throw new Error('Calculadora desconocida: ' + id);
      return spec.compute(values);
    },
  };
});
