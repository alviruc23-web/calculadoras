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

   Idiomas: por defecto todo el texto (campos y resultados) es
   español — el comportamiento de siempre, sin llamar a nada nuevo.
   `CalcEngine.configure({locale:'en'})` cambia el formato numérico
   (fmt/eur/pct) y sustituye el texto de CALC_SPECS y de los
   compute() por su versión en inglés, SIN tocar ninguna fórmula ni
   valor numérico: solo cambia qué palabras se usan para mostrarlo.
   configure({locale:'es'}) siempre puede volver al estado español
   original, restaurado desde una copia tomada al cargar el módulo.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CalcEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- idioma activo ------------------------------------------------
     Una única variable mutable que compute() lee en el momento de
     ejecutarse (no al definirse), así que cambia con configure()
     sin necesidad de reconstruir las specs. ------------------------ */
  var CURRENT_LOCALE = 'es';

  /* ---- formato ---------------------------------------------------- */

  function isFiniteNum(n) {
    return typeof n === 'number' && isFinite(n);
  }

  // Formatea un número en la convención del idioma activo. Devuelve '—'
  // si no es finito, de modo que ningún resultado pueda mostrar NaN o
  // Infinity al usuario.
  function fmt(n, dec) {
    if (dec === undefined) dec = 2;
    if (!isFiniteNum(n)) return '—';
    // Evita "-0,00"
    if (Math.abs(n) < Math.pow(10, -dec) / 2) n = 0;
    var loc = CURRENT_LOCALE === 'en' ? 'en-US' : 'es-ES';
    return n.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function eur(n) {
    if (!isFiniteNum(n)) return '—';
    return CURRENT_LOCALE === 'en' ? '€' + fmt(n, 2) : fmt(n, 2) + ' €';
  }
  function pct(n, dec) {
    if (!isFiniteNum(n)) return '—';
    var s = fmt(n, dec === undefined ? 2 : dec);
    return CURRENT_LOCALE === 'en' ? s + '%' : s + ' %';
  }

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

  // Reparto proporcional para la barra visual del resultado (p. ej.
  // capital vs. intereses). Devuelve null si no hay nada que repartir,
  // para que la UI simplemente no dibuje la barra.
  function splitBar(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i++) total += Math.max(0, parts[i].value);
    if (!(total > 0)) return null;
    return parts.map(function (p) {
      return { label: p.label, value: p.value, cls: p.cls, pct: (Math.max(0, p.value) / total) * 100 };
    });
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
     TEXTO — todo el texto español usado dentro de los compute() está
     aquí (no repartido por el código), para poder ofrecer una tabla
     en inglés en paralelo sin tocar ninguna línea de matemática.
     `T` es la tabla activa; compute() la lee en cada llamada.
     ================================================================ */

  var T_ES = {
    iva: {
      hint: 'Introduce un precio para ver el desglose del IVA.',
      errNegative: 'El precio no puede ser negativo.',
      errTooLarge: 'El precio introducido no es un importe real.',
      mainQuitar: 'Precio sin IVA',
      mainAnadir: 'Precio con IVA',
      rowBase: 'Base imponible (sin IVA)',
      rowVat: 'IVA',
      rowTotal: 'Total con IVA',
      copyBase: 'Base sin IVA: ',
      copyTotal: 'Total con IVA: ',
    },
    finiquito: {
      hint: 'Introduce tu salario bruto mensual para estimar el finiquito.',
      errNegative: 'El salario no puede ser negativo.',
      errTooLarge: 'El salario introducido no es un importe real.',
      errDaysNegative: 'Los días no pueden ser negativos.',
      errDaysMax: 'Un mes no puede tener más de 31 días trabajados.',
      errVacationMax: 'Los días de vacaciones pendientes no pueden superar los 60.',
      errNoticeMax: 'Los días de preaviso no pueden superar los 90.',
      rowDaily: 'Salario diario',
      rowWorked: 'Días trabajados',
      rowVacation: 'Vacaciones no disfrutadas',
      rowNotice: 'Preaviso no trabajado',
      rowTotal: 'Total bruto',
      mainLabel: 'Finiquito bruto',
      note: 'Importe bruto: todavía se le aplicarán IRPF y Seguridad Social. El finiquito no incluye la indemnización por despido, que es un concepto aparte.',
      copyPrefix: 'Finiquito bruto estimado: ',
      copyWorked: '\n- Días trabajados: ',
      copyVacation: '\n- Vacaciones: ',
    },
    nomina: {
      hint: 'Introduce tu salario bruto anual para calcular el neto.',
      errNegative: 'El salario no puede ser negativo.',
      errTooLarge: 'El salario introducido no es un importe real.',
      mainLabel: 'Neto por paga',
      pagasSuffix: ' pagas',
      rowGross: 'Bruto anual',
      rowSS: 'Seguridad Social',
      rowIRPF: 'Retención IRPF',
      rowNetAnnual: 'Neto anual',
      rowNetPaga: 'Neto por paga',
      rowNetMonthly: 'Neto mensual equivalente',
      note: 'Cálculo orientativo con la escala general del IRPF y el mínimo personal y familiar. Tu retención real depende de tu comunidad autónoma y de tu situación concreta (modelo 145).',
      copyGross: 'Bruto anual: ',
      copyNetAnnual: '\nNeto anual: ',
      copyNetPaga: '\nNeto por paga (',
    },
    hipoteca: {
      hint: 'Introduce el importe del préstamo para ver tu cuota mensual.',
      errZero: 'El importe del préstamo debe ser mayor que cero.',
      errTooLarge: 'El importe es demasiado grande para un préstamo real.',
      errTermMin: 'El plazo debe ser de al menos un año.',
      errTermMax: 'El plazo no puede superar los ',
      errTermMaxSuffix: ' años.',
      errRateNegative: 'El tipo de interés no puede ser negativo.',
      errRateReal: 'Introduce un tipo de interés real (en porcentaje anual, por ejemplo 3).',
      mainLabel: 'Cuota mensual',
      rowCapital: 'Capital prestado',
      rowTerm: 'Plazo',
      termYearsOpen: ' años (',
      termInstallmentsClose: ' cuotas)',
      rowInterestTotal: 'Intereses totales',
      rowTotalToRepay: 'Total a devolver',
      rowInterestPctCapital: 'Intereses sobre el capital',
      barCapital: 'Capital',
      barInterest: 'Intereses',
      note: 'No incluye seguros, comisiones ni gastos asociados, que sí entran en el TAE.',
    },
    prestamo: {
      hint: 'Introduce el importe para calcular la cuota del préstamo.',
      errZero: 'El importe del préstamo debe ser mayor que cero.',
      errTooLarge: 'El importe es demasiado grande para un préstamo real.',
      errTermMin: 'El plazo debe ser de al menos un mes.',
      errTermMax: 'El plazo no puede superar los ',
      errTermMaxSuffix: ' meses.',
      errRateNegative: 'El TIN no puede ser negativo.',
      errRateReal: 'Introduce un TIN real (en porcentaje anual, por ejemplo 8).',
      mainLabel: 'Cuota mensual',
      rowCapital: 'Capital',
      rowInterestTotal: 'Intereses totales',
      rowTotalToRepay: 'Total a devolver',
      rowTAE: 'TAE equivalente (sin comisiones)',
      barCapital: 'Capital',
      barInterest: 'Intereses',
      note: 'El TAE mostrado solo refleja la capitalización del TIN. El TAE real de una oferta incluye además comisiones y gastos.',
    },
    ahorro: {
      hint: 'Introduce cuánto quieres reunir para saber cuánto ahorrar al mes.',
      errZero: 'El objetivo debe ser mayor que cero.',
      errTooLarge: 'El objetivo es demasiado grande.',
      errTermMin: 'El plazo debe ser de al menos un año.',
      errTermMax: 'El plazo no puede superar los ',
      errTermMaxSuffix: ' años.',
      errRateNegative: 'La rentabilidad no puede ser negativa.',
      errRateReal: 'Introduce una rentabilidad anual real (en porcentaje, por ejemplo 5).',
      mainLabel: 'Ahorro mensual necesario',
      rowGoal: 'Objetivo',
      rowCurrent: 'Tienes ahora',
      rowFutureValue: 'Valor en ',
      yearsOpen: ' años',
      noteZero: 'Con la rentabilidad indicada, tu ahorro actual ya supera el objetivo en ese plazo sin necesidad de aportar nada más.',
      copyGoal: 'Objetivo: ',
      copyNoContribution: 'No necesitas aportaciones: tu ahorro actual llega a ',
      rowTerm: 'Plazo',
      termYearsOpen: ' años (',
      termMonthsClose: ' meses)',
      rowContributed: 'Aportado de tu bolsillo',
      rowInterestGenerated: 'Generado por intereses',
      rowTotalFinal: 'Total al final',
      barContributed: 'Aportado',
      barInterest: 'Intereses',
      note: 'Supone aportaciones constantes a principio de cada mes y una rentabilidad estable, que en una inversión real puede variar.',
      copyToReach: 'Para reunir ',
      copyInYears: ' en ',
      copyYearsSuffix: ' años necesitas ahorrar ',
      copyPerMonth: ' al mes.',
    },
    porcentaje: {
      hint: 'Rellena los dos valores para ver el resultado.',
      errTooLarge: 'Introduce valores reales: alguno de los dos números es demasiado grande.',
      errZeroTotal: 'El valor total no puede ser cero: no se puede calcular un porcentaje sobre cero.',
      errZeroInitial: 'No se puede calcular la variación porcentual partiendo de cero.',
      quePctIs: ' es',
      rowPartial: 'Valor parcial',
      rowTotal: 'Valor total',
      rowPercentage: 'Porcentaje',
      copyQuePct: ' es el ',
      copyQuePctOf: ' de ',
      variacionUp: 'Aumento',
      variacionDown: 'Descenso',
      rowInitial: 'Valor inicial',
      rowFinal: 'Valor final',
      rowAbsDiff: 'Diferencia absoluta',
      rowChange: 'Variación',
      copyFrom: 'De ',
      copyTo: ' a ',
      of: ' de ',
      rowAmount: 'Cantidad',
      rowResult: 'Resultado',
      rowAmountMinus: 'Cantidad menos ese %',
      rowAmountPlus: 'Cantidad más ese %',
      copyThe: 'El ',
      copyIs: ' es ',
    },
    dias: {
      hint: 'Selecciona las dos fechas para calcular la diferencia.',
      mainWorking: 'Días laborables',
      mainTotal: 'Días totales',
      daySingular: ' día',
      dayPlural: ' días',
      rowCalendar: 'Días naturales',
      rowWorking: 'Días laborables (L-V)',
      rowWeekend: 'Fines de semana',
      rowFullWeeks: 'Semanas completas',
      rowMonths: 'Meses aproximados',
      note: 'No se descuentan los festivos nacionales, autonómicos ni locales.',
      copyBetween: 'Entre ',
      copyAnd: ' y ',
      copyThereAre: ' hay ',
      copyCalendarDays: ' días naturales (',
      copyWorkingSuffix: ' laborables).',
    },
    imc: {
      hint: 'Introduce tu peso y tu altura para calcular el IMC.',
      errWeightZero: 'El peso debe ser mayor que cero.',
      errWeightReal: 'Introduce el peso en kilogramos (por ejemplo, 70).',
      errHeightZero: 'La altura debe ser mayor que cero.',
      errHeightReal: 'Introduce la altura en centímetros (por ejemplo, 170).',
      catUnder: 'Bajo peso', noteUnder: 'Por debajo del rango de referencia de la OMS.',
      catNormal: 'Peso normal', noteNormal: 'Dentro del rango de referencia de la OMS.',
      catOver: 'Sobrepeso', noteOver: 'Por encima del rango de referencia de la OMS.',
      catObese1: 'Obesidad grado I', noteObese1: 'Conviene valorarlo con un profesional sanitario.',
      catObese2: 'Obesidad grado II', noteObese2: 'Se recomienda valoración médica.',
      catObese3: 'Obesidad grado III', noteObese3: 'Se recomienda valoración médica prioritaria.',
      mainLabel: 'Índice de masa corporal',
      rowCategory: 'Categoría (OMS)',
      rowRange: 'Rango de peso normal para tu altura',
      rowDiff: 'Diferencia con el rango',
      diffWithinRange: 'Dentro del rango',
      noteSuffix: ' El IMC es un indicador orientativo: no distingue entre masa muscular y grasa, ni sustituye una valoración médica.',
      copyPrefix: 'IMC: ',
    },
    propina: {
      hint: 'Introduce el total de la cuenta para repartirla.',
      errNegative: 'La cuenta no puede ser negativa.',
      errTooLarge: 'El importe de la cuenta no es real.',
      errPeopleMin: 'Tiene que haber al menos una persona.',
      errPeopleReal: 'Introduce un número de personas real.',
      mainLabel: 'Paga cada persona',
      rowBill: 'Cuenta',
      rowTip: 'Propina',
      rowTotalWithTip: 'Total con propina',
      rowTipPerPerson: 'Propina por persona',
      rowTotalPerPerson: 'Total por persona',
      copyBill: 'Cuenta ',
      copyPlusTip: ' + propina ',
      copyEquals: ' = ',
      copyEachPerson: '. Cada persona: ',
    },
    combustible: {
      hint: 'Introduce los kilómetros del viaje para calcular el coste.',
      errNegative: 'La distancia no puede ser negativa.',
      errTooLarge: 'Esa distancia no corresponde a un viaje real.',
      errConsumptionZero: 'El consumo debe ser mayor que cero.',
      errPriceNegative: 'El precio no puede ser negativo.',
      errPeopleReal: 'Introduce un número de personas real.',
      rowLiters: 'Litros necesarios',
      rowCostPerKm: 'Coste por kilómetro',
      rowOneWay: 'Coste solo ida',
      rowRoundTrip: 'Ida y vuelta',
      rowPerPerson: 'Por persona (ida y vuelta)',
      mainLabel: 'Coste del viaje (ida)',
      note: 'El consumo real suele ser un 10–15 % superior al homologado, sobre todo en ciudad o con el coche cargado.',
      copyTrip: 'Viaje de ',
      copyKm: ' km: ',
      copyLiters: ' litros, ',
      copyOneWaySuffix: ' (ida).',
    },

    'retencion-factura': {
      hint: 'Introduce la base imponible de la factura para calcular el resultado.',
      errNegative: 'La base imponible no puede ser negativa.',
      errTooLarge: 'El importe introducido no es una base real.',
      rowBase: 'Base imponible',
      rowVat: 'IVA',
      rowWithholding: 'Retención IRPF',
      rowTotal: 'El cliente te paga',
      mainLabel: 'El cliente te paga',
      note: 'La retención se calcula siempre sobre la base imponible, nunca sobre el importe con IVA incluido. La ingresa el cliente en Hacienda en tu nombre, como pago a cuenta de tu IRPF.',
      copyBase: 'Base: ',
      copyVat: '\nIVA: ',
      copyWithholding: '\nRetención: ',
      copyTotal: '\nEl cliente paga: ',
    },
  };

  var T_EN = {
    iva: {
      hint: 'Enter a price to see the VAT breakdown.',
      errNegative: 'The price cannot be negative.',
      errTooLarge: 'The price entered is not a real amount.',
      mainQuitar: 'Price excluding VAT',
      mainAnadir: 'Price including VAT',
      rowBase: 'Tax base (excluding VAT)',
      rowVat: 'VAT',
      rowTotal: 'Total including VAT',
      copyBase: 'Base excluding VAT: ',
      copyTotal: 'Total including VAT: ',
    },
    finiquito: {
      hint: 'Enter your gross monthly salary to estimate severance pay.',
      errNegative: 'Salary cannot be negative.',
      errTooLarge: 'The salary entered is not a real amount.',
      errDaysNegative: 'Days cannot be negative.',
      errDaysMax: 'A month cannot have more than 31 days worked.',
      errVacationMax: 'Unused holiday days cannot exceed 60.',
      errNoticeMax: 'Notice days cannot exceed 90.',
      rowDaily: 'Daily wage',
      rowWorked: 'Days worked',
      rowVacation: 'Unused holiday',
      rowNotice: 'Unpaid notice',
      rowTotal: 'Gross total',
      mainLabel: 'Gross severance pay',
      note: 'Gross amount: Spanish income tax (IRPF) and Social Security contributions will still be applied. Severance pay does not include dismissal compensation, which is a separate concept.',
      copyPrefix: 'Estimated gross severance pay: ',
      copyWorked: '\n- Days worked: ',
      copyVacation: '\n- Holiday: ',
    },
    nomina: {
      hint: 'Enter your gross annual salary to calculate the net amount.',
      errNegative: 'Salary cannot be negative.',
      errTooLarge: 'The salary entered is not a real amount.',
      mainLabel: 'Net per payment',
      pagasSuffix: ' payments',
      rowGross: 'Gross annual',
      rowSS: 'Social Security',
      rowIRPF: 'Income tax withholding (IRPF)',
      rowNetAnnual: 'Net annual',
      rowNetPaga: 'Net per payment',
      rowNetMonthly: 'Net monthly equivalent',
      note: 'An estimate based on the general IRPF scale and the personal/family allowance. Your actual withholding depends on your Spanish region and your specific situation (form 145).',
      copyGross: 'Gross annual: ',
      copyNetAnnual: '\nNet annual: ',
      copyNetPaga: '\nNet per payment (',
    },
    hipoteca: {
      hint: 'Enter the loan amount to see your monthly payment.',
      errZero: 'The loan amount must be greater than zero.',
      errTooLarge: 'The amount is too large for a real loan.',
      errTermMin: 'The term must be at least one year.',
      errTermMax: 'The term cannot exceed ',
      errTermMaxSuffix: ' years.',
      errRateNegative: 'The interest rate cannot be negative.',
      errRateReal: 'Enter a real interest rate (annual percentage, e.g. 3).',
      mainLabel: 'Monthly payment',
      rowCapital: 'Loan principal',
      rowTerm: 'Term',
      termYearsOpen: ' years (',
      termInstallmentsClose: ' payments)',
      rowInterestTotal: 'Total interest',
      rowTotalToRepay: 'Total to repay',
      rowInterestPctCapital: 'Interest as % of principal',
      barCapital: 'Principal',
      barInterest: 'Interest',
      note: 'Does not include insurance, fees or associated costs, which are included in the TAE (APR).',
    },
    prestamo: {
      hint: 'Enter the amount to calculate the loan payment.',
      errZero: 'The loan amount must be greater than zero.',
      errTooLarge: 'The amount is too large for a real loan.',
      errTermMin: 'The term must be at least one month.',
      errTermMax: 'The term cannot exceed ',
      errTermMaxSuffix: ' months.',
      errRateNegative: 'The TIN cannot be negative.',
      errRateReal: 'Enter a real TIN (annual percentage, e.g. 8).',
      mainLabel: 'Monthly payment',
      rowCapital: 'Principal',
      rowInterestTotal: 'Total interest',
      rowTotalToRepay: 'Total to repay',
      rowTAE: 'Equivalent TAE (excluding fees)',
      barCapital: 'Principal',
      barInterest: 'Interest',
      note: 'The TAE shown only reflects the compounding of the TIN. The real TAE of an offer also includes fees and costs.',
    },
    ahorro: {
      hint: 'Enter how much you want to reach to see how much to save each month.',
      errZero: 'The goal must be greater than zero.',
      errTooLarge: 'The goal is too large.',
      errTermMin: 'The term must be at least one year.',
      errTermMax: 'The term cannot exceed ',
      errTermMaxSuffix: ' years.',
      errRateNegative: 'The return cannot be negative.',
      errRateReal: 'Enter a real annual return (percentage, e.g. 5).',
      mainLabel: 'Required monthly savings',
      rowGoal: 'Goal',
      rowCurrent: 'You currently have',
      rowFutureValue: 'Value in ',
      yearsOpen: ' years',
      noteZero: 'At the return rate shown, your current savings already exceed the goal over that period, with no need to contribute anything more.',
      copyGoal: 'Goal: ',
      copyNoContribution: 'No contributions needed: your current savings reach ',
      rowTerm: 'Term',
      termYearsOpen: ' years (',
      termMonthsClose: ' months)',
      rowContributed: 'Contributed out of pocket',
      rowInterestGenerated: 'Generated by interest',
      rowTotalFinal: 'Total at the end',
      barContributed: 'Contributed',
      barInterest: 'Interest',
      note: 'Assumes constant contributions at the start of each month and a stable return, which can vary in a real investment.',
      copyToReach: 'To reach ',
      copyInYears: ' in ',
      copyYearsSuffix: ' years you need to save ',
      copyPerMonth: ' a month.',
    },
    porcentaje: {
      hint: 'Fill in both values to see the result.',
      errTooLarge: 'Enter real values: one of the two numbers is too large.',
      errZeroTotal: 'The total value cannot be zero: a percentage cannot be calculated on zero.',
      errZeroInitial: 'The percentage change cannot be calculated starting from zero.',
      quePctIs: ' is',
      rowPartial: 'Partial value',
      rowTotal: 'Total value',
      rowPercentage: 'Percentage',
      copyQuePct: ' is ',
      copyQuePctOf: ' of ',
      variacionUp: 'Increase',
      variacionDown: 'Decrease',
      rowInitial: 'Initial value',
      rowFinal: 'Final value',
      rowAbsDiff: 'Absolute difference',
      rowChange: 'Change',
      copyFrom: 'From ',
      copyTo: ' to ',
      of: ' of ',
      rowAmount: 'Amount',
      rowResult: 'Result',
      rowAmountMinus: 'Amount minus that %',
      rowAmountPlus: 'Amount plus that %',
      copyThe: '',
      copyIs: ' is ',
    },
    dias: {
      hint: 'Select both dates to calculate the difference.',
      mainWorking: 'Working days',
      mainTotal: 'Total days',
      daySingular: ' day',
      dayPlural: ' days',
      rowCalendar: 'Calendar days',
      rowWorking: 'Working days (Mon-Fri)',
      rowWeekend: 'Weekend days',
      rowFullWeeks: 'Full weeks',
      rowMonths: 'Approximate months',
      note: 'National, regional and local public holidays are not excluded.',
      copyBetween: 'Between ',
      copyAnd: ' and ',
      copyThereAre: ' there are ',
      copyCalendarDays: ' calendar days (',
      copyWorkingSuffix: ' working).',
    },
    imc: {
      hint: 'Enter your weight and height to calculate your BMI.',
      errWeightZero: 'Weight must be greater than zero.',
      errWeightReal: 'Enter your weight in kilograms (e.g. 70).',
      errHeightZero: 'Height must be greater than zero.',
      errHeightReal: 'Enter your height in centimeters (e.g. 170).',
      catUnder: 'Underweight', noteUnder: 'Below the WHO reference range.',
      catNormal: 'Normal weight', noteNormal: 'Within the WHO reference range.',
      catOver: 'Overweight', noteOver: 'Above the WHO reference range.',
      catObese1: 'Obesity class I', noteObese1: 'Worth assessing with a healthcare professional.',
      catObese2: 'Obesity class II', noteObese2: 'Medical assessment recommended.',
      catObese3: 'Obesity class III', noteObese3: 'Priority medical assessment recommended.',
      mainLabel: 'Body Mass Index',
      rowCategory: 'Category (WHO)',
      rowRange: 'Normal weight range for your height',
      rowDiff: 'Difference from the range',
      diffWithinRange: 'Within the range',
      noteSuffix: ' BMI is a general indicator: it does not distinguish between muscle and fat, and does not replace a medical assessment.',
      copyPrefix: 'BMI: ',
    },
    propina: {
      hint: 'Enter the total bill to split it.',
      errNegative: 'The bill cannot be negative.',
      errTooLarge: 'The bill amount is not real.',
      errPeopleMin: 'There must be at least one person.',
      errPeopleReal: 'Enter a real number of people.',
      mainLabel: 'Each person pays',
      rowBill: 'Bill',
      rowTip: 'Tip',
      rowTotalWithTip: 'Total with tip',
      rowTipPerPerson: 'Tip per person',
      rowTotalPerPerson: 'Total per person',
      copyBill: 'Bill ',
      copyPlusTip: ' + tip ',
      copyEquals: ' = ',
      copyEachPerson: '. Each person: ',
    },
    combustible: {
      hint: 'Enter the trip distance to calculate the cost.',
      errNegative: 'The distance cannot be negative.',
      errTooLarge: 'That distance does not correspond to a real trip.',
      errConsumptionZero: 'Consumption must be greater than zero.',
      errPriceNegative: 'The price cannot be negative.',
      errPeopleReal: 'Enter a real number of people.',
      rowLiters: 'Liters needed',
      rowCostPerKm: 'Cost per kilometer',
      rowOneWay: 'One-way cost',
      rowRoundTrip: 'Round trip',
      rowPerPerson: 'Per person (round trip)',
      mainLabel: 'Trip cost (one-way)',
      note: 'Real-world consumption is usually 10-15% higher than the official figure, especially in the city or with a loaded car.',
      copyTrip: 'Trip of ',
      copyKm: ' km: ',
      copyLiters: ' liters, ',
      copyOneWaySuffix: ' (one-way).',
    },

    'retencion-factura': {
      hint: 'Enter the invoice tax base to calculate the result.',
      errNegative: 'The tax base cannot be negative.',
      errTooLarge: 'The amount entered is not a real tax base.',
      rowBase: 'Tax base',
      rowVat: 'VAT',
      rowWithholding: 'IRPF withholding',
      rowTotal: 'The client pays you',
      mainLabel: 'The client pays you',
      note: 'Withholding tax is always calculated on the tax base, never on the VAT-inclusive amount. The client pays it directly to the Spanish Tax Agency on your behalf.',
      copyBase: 'Base: ',
      copyVat: '\nVAT: ',
      copyWithholding: '\nWithholding: ',
      copyTotal: '\nClient pays: ',
    },
  };

  var T = T_ES;

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
        if (precio === null) return { empty: true, hint: T.iva.hint };
        if (precio < 0) return { error: T.iva.errNegative };
        if (precio > MAX_AMOUNT) return { error: T.iva.errTooLarge };

        var rate = numOr(v.tipo, 21) / 100;
        var base, iva, total;
        if (v.modo === 'quitar') {
          total = precio; base = precio / (1 + rate); iva = total - base;
        } else {
          base = precio; iva = precio * rate; total = base + iva;
        }
        var vatRow = T.iva.rowVat + ' (' + pct(numOr(v.tipo, 21), 0) + ')';
        return {
          main: { label: v.modo === 'quitar' ? T.iva.mainQuitar : T.iva.mainAnadir, value: eur(v.modo === 'quitar' ? base : total) },
          rows: [
            { k: T.iva.rowBase, v: eur(base) },
            { k: vatRow, v: eur(iva) },
            { k: T.iva.rowTotal, v: eur(total), strong: true },
          ],
          copy: T.iva.copyBase + eur(base) + '\n' + vatRow + ': ' + eur(iva) + '\n' + T.iva.copyTotal + eur(total),
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
        if (salario === null) return { empty: true, hint: T.finiquito.hint };
        if (salario < 0) return { error: T.finiquito.errNegative };
        if (salario > MAX_AMOUNT) return { error: T.finiquito.errTooLarge };

        var dias = numOr(v.dias, 0), vac = numOr(v.vacaciones, 0), pre = numOr(v.preaviso, 0);
        if (dias < 0 || vac < 0 || pre < 0) return { error: T.finiquito.errDaysNegative };
        if (dias > 31) return { error: T.finiquito.errDaysMax };
        if (vac > 60) return { error: T.finiquito.errVacationMax };
        if (pre > 90) return { error: T.finiquito.errNoticeMax };

        var diario = salario / 30;
        var pSalario = diario * dias;
        var pVacaciones = diario * vac;
        var pPreaviso = diario * pre;
        var total = pSalario + pVacaciones + pPreaviso;

        var rows = [
          { k: T.finiquito.rowDaily, v: eur(diario) },
          { k: T.finiquito.rowWorked + ' (' + fmt(dias, 0) + ')', v: eur(pSalario) },
          { k: T.finiquito.rowVacation + ' (' + fmt(vac, 1) + ')', v: eur(pVacaciones) },
        ];
        if (pre > 0) rows.push({ k: T.finiquito.rowNotice + ' (' + fmt(pre, 0) + ')', v: eur(pPreaviso) });
        rows.push({ k: T.finiquito.rowTotal, v: eur(total), strong: true });

        return {
          main: { label: T.finiquito.mainLabel, value: eur(total) },
          rows: rows,
          note: T.finiquito.note,
          copy: T.finiquito.copyPrefix + eur(total) + T.finiquito.copyWorked + eur(pSalario) + T.finiquito.copyVacation + eur(pVacaciones),
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
        if (bruto === null) return { empty: true, hint: T.nomina.hint };
        if (bruto < 0) return { error: T.nomina.errNegative };
        if (bruto > MAX_AMOUNT) return { error: T.nomina.errTooLarge };

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
          main: { label: T.nomina.mainLabel + ' (' + pagas + T.nomina.pagasSuffix + ')', value: eur(netoPaga) },
          rows: [
            { k: T.nomina.rowGross, v: eur(bruto) },
            { k: T.nomina.rowSS + ' (' + pct(SS_RATE * 100, 2) + ')', v: '− ' + eur(ss) },
            { k: T.nomina.rowIRPF + ' (' + pct(tipo, 1) + ')', v: '− ' + eur(cuota) },
            { k: T.nomina.rowNetAnnual, v: eur(netoAnual), strong: true },
            { k: T.nomina.rowNetPaga, v: eur(netoPaga) },
            { k: T.nomina.rowNetMonthly, v: eur(netoAnual / 12) },
          ],
          note: T.nomina.note,
          copy: T.nomina.copyGross + eur(bruto) + T.nomina.copyNetAnnual + eur(netoAnual) + T.nomina.copyNetPaga + pagas + '): ' + eur(netoPaga),
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
        if (capital === null) return { empty: true, hint: T.hipoteca.hint };
        if (capital <= 0) return { error: T.hipoteca.errZero };

        if (capital > MAX_AMOUNT) return { error: T.hipoteca.errTooLarge };
        var anios = numOr(v.anios, 25);
        if (!(anios > 0)) return { error: T.hipoteca.errTermMin };
        if (anios > MAX_YEARS) return { error: T.hipoteca.errTermMax + MAX_YEARS + T.hipoteca.errTermMaxSuffix };
        var interes = numOr(v.interes, 3);
        if (interes < 0) return { error: T.hipoteca.errRateNegative };
        if (interes > 100) return { error: T.hipoteca.errRateReal };

        var n = Math.round(anios * 12);
        var r = (interes / 100) / 12;
        var cuota = payment(capital, r, n);
        var totalPagado = cuota * n;
        var intereses = totalPagado - capital;

        return {
          main: { label: T.hipoteca.mainLabel, value: eur(cuota) },
          rows: [
            { k: T.hipoteca.rowCapital, v: eur(capital) },
            { k: T.hipoteca.rowTerm, v: fmt(anios, 0) + T.hipoteca.termYearsOpen + n + T.hipoteca.termInstallmentsClose },
            { k: T.hipoteca.rowInterestTotal, v: eur(intereses) },
            { k: T.hipoteca.rowTotalToRepay, v: eur(totalPagado), strong: true },
            { k: T.hipoteca.rowInterestPctCapital, v: pct(intereses / capital * 100, 1) },
          ],
          bar: splitBar([
            { label: T.hipoteca.barCapital, value: capital, cls: 'principal' },
            { label: T.hipoteca.barInterest, value: intereses, cls: 'interest' },
          ]),
          note: T.hipoteca.note,
          copy: T.hipoteca.mainLabel + ': ' + eur(cuota) + '\n' + T.hipoteca.rowInterestTotal + ': ' + eur(intereses) + '\n' + T.hipoteca.rowTotalToRepay + ': ' + eur(totalPagado),
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
        if (capital === null) return { empty: true, hint: T.prestamo.hint };
        if (capital <= 0) return { error: T.prestamo.errZero };

        if (capital > MAX_AMOUNT) return { error: T.prestamo.errTooLarge };
        var meses = numOr(v.meses, 48);
        if (!(meses >= 1)) return { error: T.prestamo.errTermMin };
        if (meses > MAX_MONTHS) return { error: T.prestamo.errTermMax + MAX_MONTHS + T.prestamo.errTermMaxSuffix };
        var tin = numOr(v.tin, 8);
        if (tin < 0) return { error: T.prestamo.errRateNegative };
        if (tin > 100) return { error: T.prestamo.errRateReal };

        var n = Math.round(meses);
        var r = (tin / 100) / 12;
        var cuota = payment(capital, r, n);
        var total = cuota * n;
        var intereses = total - capital;
        var tae = (Math.pow(1 + r, 12) - 1) * 100;

        return {
          main: { label: T.prestamo.mainLabel, value: eur(cuota) },
          rows: [
            { k: T.prestamo.rowCapital, v: eur(capital) },
            { k: T.prestamo.rowInterestTotal, v: eur(intereses) },
            { k: T.prestamo.rowTotalToRepay, v: eur(total), strong: true },
            { k: T.prestamo.rowTAE, v: pct(tae) },
          ],
          bar: splitBar([
            { label: T.prestamo.barCapital, value: capital, cls: 'principal' },
            { label: T.prestamo.barInterest, value: intereses, cls: 'interest' },
          ]),
          note: T.prestamo.note,
          copy: T.prestamo.mainLabel + ': ' + eur(cuota) + '\n' + T.prestamo.rowInterestTotal + ': ' + eur(intereses) + '\n' + T.prestamo.rowTotalToRepay + ': ' + eur(total),
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
        if (objetivo === null) return { empty: true, hint: T.ahorro.hint };
        if (objetivo <= 0) return { error: T.ahorro.errZero };

        var inicial = Math.max(0, numOr(v.inicial, 0));
        if (objetivo > MAX_AMOUNT) return { error: T.ahorro.errTooLarge };
        var anios = numOr(v.anios, 5);
        if (!(anios > 0)) return { error: T.ahorro.errTermMin };
        if (anios > MAX_YEARS) return { error: T.ahorro.errTermMax + MAX_YEARS + T.ahorro.errTermMaxSuffix };
        var rent = numOr(v.rentabilidad, 3);
        if (rent < 0) return { error: T.ahorro.errRateNegative };
        if (rent > 100) return { error: T.ahorro.errRateReal };

        var n = Math.round(anios * 12);
        var r = (rent / 100) / 12;
        var futuroInicial = inicial * Math.pow(1 + r, n);
        var falta = objetivo - futuroInicial;

        // Si lo que ya tienes ahorrado alcanza el objetivo por sí solo, la
        // aportación necesaria es cero (antes salía un importe negativo).
        if (falta <= 0) {
          return {
            main: { label: T.ahorro.mainLabel, value: eur(0) },
            rows: [
              { k: T.ahorro.rowGoal, v: eur(objetivo) },
              { k: T.ahorro.rowCurrent, v: eur(inicial) },
              { k: T.ahorro.rowFutureValue + fmt(anios, 0) + T.ahorro.yearsOpen, v: eur(futuroInicial), strong: true },
            ],
            note: T.ahorro.noteZero,
            copy: T.ahorro.copyGoal + eur(objetivo) + '\n' + T.ahorro.copyNoContribution + eur(futuroInicial) + '.',
          };
        }

        var mensual = r === 0 ? falta / n : falta * r / (Math.pow(1 + r, n) - 1);
        var aportado = inicial + mensual * n;
        var intereses = objetivo - aportado;

        return {
          main: { label: T.ahorro.mainLabel, value: eur(mensual) },
          rows: [
            { k: T.ahorro.rowGoal, v: eur(objetivo) },
            { k: T.ahorro.rowTerm, v: fmt(anios, 0) + T.ahorro.termYearsOpen + n + T.ahorro.termMonthsClose },
            { k: T.ahorro.rowContributed, v: eur(aportado) },
            { k: T.ahorro.rowInterestGenerated, v: eur(Math.max(0, intereses)) },
            { k: T.ahorro.rowTotalFinal, v: eur(objetivo), strong: true },
          ],
          bar: splitBar([
            { label: T.ahorro.barContributed, value: aportado, cls: 'principal' },
            { label: T.ahorro.barInterest, value: intereses, cls: 'interest' },
          ]),
          note: T.ahorro.note,
          copy: T.ahorro.copyToReach + eur(objetivo) + T.ahorro.copyInYears + fmt(anios, 0) + T.ahorro.copyYearsSuffix + eur(mensual) + T.ahorro.copyPerMonth,
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
        if (CURRENT_LOCALE === 'en') {
          if (modo === 'que_pct') return { a: 'Partial value', b: 'Total value' };
          if (modo === 'variacion') return { a: 'Initial value', b: 'Final value' };
          return { a: 'Percentage (%)', b: 'Amount' };
        }
        if (modo === 'que_pct') return { a: 'Valor parcial', b: 'Valor total' };
        if (modo === 'variacion') return { a: 'Valor inicial', b: 'Valor final' };
        return { a: 'Porcentaje (%)', b: 'Cantidad' };
      },
      compute: function (v) {
        var modo = v.modo || 'pct_de';
        var a = num(v.a), b = num(v.b);
        if (a === null || b === null) return { empty: true, hint: T.porcentaje.hint };
        if (Math.abs(a) > MAX_AMOUNT || Math.abs(b) > MAX_AMOUNT) return { error: T.porcentaje.errTooLarge };

        if (modo === 'que_pct') {
          if (b === 0) return { error: T.porcentaje.errZeroTotal };
          var p = (a / b) * 100;
          return {
            main: { label: fmt(a, 2) + T.porcentaje.of + fmt(b, 2) + T.porcentaje.quePctIs, value: pct(p) },
            rows: [{ k: T.porcentaje.rowPartial, v: fmt(a, 2) }, { k: T.porcentaje.rowTotal, v: fmt(b, 2) }, { k: T.porcentaje.rowPercentage, v: pct(p), strong: true }],
            copy: fmt(a, 2) + T.porcentaje.copyQuePct + pct(p) + T.porcentaje.copyQuePctOf + fmt(b, 2),
          };
        }

        if (modo === 'variacion') {
          if (a === 0) return { error: T.porcentaje.errZeroInitial };
          var d = ((b - a) / a) * 100;
          var sign = d >= 0 ? '+' : '';
          return {
            main: { label: d >= 0 ? T.porcentaje.variacionUp : T.porcentaje.variacionDown, value: sign + pct(d) },
            rows: [
              { k: T.porcentaje.rowInitial, v: fmt(a, 2) },
              { k: T.porcentaje.rowFinal, v: fmt(b, 2) },
              { k: T.porcentaje.rowAbsDiff, v: fmt(b - a, 2) },
              { k: T.porcentaje.rowChange, v: sign + pct(d), strong: true },
            ],
            copy: T.porcentaje.copyFrom + fmt(a, 2) + T.porcentaje.copyTo + fmt(b, 2) + ': ' + sign + pct(d),
          };
        }

        var res = (a / 100) * b;
        return {
          main: { label: pct(a, 2) + T.porcentaje.of + fmt(b, 2), value: fmt(res, 2) },
          rows: [
            { k: T.porcentaje.rowPercentage, v: pct(a) },
            { k: T.porcentaje.rowAmount, v: fmt(b, 2) },
            { k: T.porcentaje.rowResult, v: fmt(res, 2), strong: true },
            { k: T.porcentaje.rowAmountMinus, v: fmt(b - res, 2) },
            { k: T.porcentaje.rowAmountPlus, v: fmt(b + res, 2) },
          ],
          copy: T.porcentaje.copyThe + pct(a) + T.porcentaje.of + fmt(b, 2) + T.porcentaje.copyIs + fmt(res, 2),
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
        if (!d1 || !d2) return { empty: true, hint: T.dias.hint };

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
          main: { label: soloLab ? T.dias.mainWorking : T.dias.mainTotal, value: fmt(valor, 0) + (valor === 1 ? T.dias.daySingular : T.dias.dayPlural) },
          rows: [
            { k: T.dias.rowCalendar, v: fmt(dias, 0), strong: !soloLab },
            { k: T.dias.rowWorking, v: fmt(laborables, 0), strong: soloLab },
            { k: T.dias.rowWeekend, v: fmt(dias - laborables, 0) },
            { k: T.dias.rowFullWeeks, v: fmt(semanasEnteras, 0) },
            { k: T.dias.rowMonths, v: fmt(dias / 30.44, 1) },
          ],
          note: T.dias.note,
          copy: T.dias.copyBetween + v.inicio + T.dias.copyAnd + v.fin + T.dias.copyThereAre + fmt(dias, 0) + T.dias.copyCalendarDays + fmt(laborables, 0) + T.dias.copyWorkingSuffix,
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
        if (peso === null || altura === null) return { empty: true, hint: T.imc.hint };
        if (peso <= 0) return { error: T.imc.errWeightZero };
        if (peso > 500) return { error: T.imc.errWeightReal };
        if (altura <= 0) return { error: T.imc.errHeightZero };
        if (altura < 50 || altura > 260) return { error: T.imc.errHeightReal };

        var m = altura / 100;
        var imc = peso / (m * m);

        var cat, nota;
        if (imc < 18.5) { cat = T.imc.catUnder; nota = T.imc.noteUnder; }
        else if (imc < 25) { cat = T.imc.catNormal; nota = T.imc.noteNormal; }
        else if (imc < 30) { cat = T.imc.catOver; nota = T.imc.noteOver; }
        else if (imc < 35) { cat = T.imc.catObese1; nota = T.imc.noteObese1; }
        else if (imc < 40) { cat = T.imc.catObese2; nota = T.imc.noteObese2; }
        else { cat = T.imc.catObese3; nota = T.imc.noteObese3; }

        var pesoMin = 18.5 * m * m, pesoMax = 24.9 * m * m;

        return {
          main: { label: T.imc.mainLabel, value: fmt(imc, 1) },
          rows: [
            { k: T.imc.rowCategory, v: cat, strong: true },
            { k: T.imc.rowRange, v: fmt(pesoMin, 1) + ' – ' + fmt(pesoMax, 1) + ' kg' },
            { k: T.imc.rowDiff, v: imc < 18.5 ? '−' + fmt(pesoMin - peso, 1) + ' kg' : (imc >= 25 ? '+' + fmt(peso - pesoMax, 1) + ' kg' : T.imc.diffWithinRange) },
          ],
          note: nota + T.imc.noteSuffix,
          copy: T.imc.copyPrefix + fmt(imc, 1) + ' (' + cat + ')',
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
        if (cuenta === null) return { empty: true, hint: T.propina.hint };
        if (cuenta < 0) return { error: T.propina.errNegative };
        if (cuenta > MAX_AMOUNT) return { error: T.propina.errTooLarge };

        var personas = intOr(v.personas, 2);
        if (!(personas >= 1)) return { error: T.propina.errPeopleMin };
        if (personas > 1000) return { error: T.propina.errPeopleReal };

        var p = numOr(v.porcentaje, 10);
        var propina = cuenta * (p / 100);
        var total = cuenta + propina;

        return {
          main: { label: T.propina.mainLabel, value: eur(total / personas) },
          rows: [
            { k: T.propina.rowBill, v: eur(cuenta) },
            { k: T.propina.rowTip + ' (' + pct(p, 0) + ')', v: eur(propina) },
            { k: T.propina.rowTotalWithTip, v: eur(total), strong: true },
            { k: T.propina.rowTipPerPerson, v: eur(propina / personas) },
            { k: T.propina.rowTotalPerPerson + ' (' + personas + ')', v: eur(total / personas) },
          ],
          copy: T.propina.copyBill + eur(cuenta) + T.propina.copyPlusTip + eur(propina) + T.propina.copyEquals + eur(total) + T.propina.copyEachPerson + eur(total / personas) + '.',
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
        if (km === null) return { empty: true, hint: T.combustible.hint };
        if (km < 0) return { error: T.combustible.errNegative };
        if (km > 1e7) return { error: T.combustible.errTooLarge };

        var consumo = numOr(v.consumo, 7);
        if (!(consumo > 0)) return { error: T.combustible.errConsumptionZero };
        var precio = numOr(v.precio, 1.65);
        if (precio < 0) return { error: T.combustible.errPriceNegative };
        var personas = Math.max(1, intOr(v.personas, 1));
        if (personas > 1000) return { error: T.combustible.errPeopleReal };

        var litros = (km * consumo) / 100;
        var coste = litros * precio;

        var rows = [
          { k: T.combustible.rowLiters, v: fmt(litros, 2) + ' l' },
          { k: T.combustible.rowCostPerKm, v: km > 0 ? fmt(coste / km, 3) + ' €/km' : '—' },
          { k: T.combustible.rowOneWay, v: eur(coste), strong: true },
          { k: T.combustible.rowRoundTrip, v: eur(coste * 2) },
        ];
        if (personas > 1) rows.push({ k: T.combustible.rowPerPerson, v: eur(coste * 2 / personas) });

        return {
          main: { label: T.combustible.mainLabel, value: eur(coste) },
          rows: rows,
          note: T.combustible.note,
          copy: T.combustible.copyTrip + fmt(km, 0) + T.combustible.copyKm + fmt(litros, 2) + T.combustible.copyLiters + eur(coste) + T.combustible.copyOneWaySuffix,
        };
      },
    },

    /* --------------------------------------------- RETENCIÓN FACTURA */
    'retencion-factura': {
      submitLabel: 'Calcular factura',
      fields: [
        { id: 'base', label: 'Base imponible', unit: '€', type: 'number', min: 0, step: '0.01', placeholder: '1000', autofocus: true },
        {
          id: 'ivaTipo', label: 'Tipo de IVA', type: 'segment', default: '21',
          options: [{ value: '0', label: '0 %' }, { value: '4', label: '4 %' }, { value: '10', label: '10 %' }, { value: '21', label: '21 %' }],
        },
        {
          id: 'retencion', label: 'Retención de IRPF', type: 'select', default: '15',
          options: [
            { value: '0', label: 'Sin retención (factura a particular)' },
            { value: '15', label: 'General — 15 %' },
            { value: '7', label: 'Nuevo profesional (1.er año y los 2 siguientes) — 7 %' },
          ],
        },
      ],
      compute: function (v) {
        var T2 = T['retencion-factura'];
        var base = num(v.base);
        if (base === null) return { empty: true, hint: T2.hint };
        if (base < 0) return { error: T2.errNegative };
        if (base > MAX_AMOUNT) return { error: T2.errTooLarge };

        var ivaRate = numOr(v.ivaTipo, 21) / 100;
        var retRate = numOr(v.retencion, 15) / 100;
        var iva = base * ivaRate;
        var retencion = base * retRate;
        var total = base + iva - retencion;

        var rows = [
          { k: T2.rowBase, v: eur(base) },
          { k: T2.rowVat + ' (' + pct(numOr(v.ivaTipo, 21), 0) + ')', v: eur(iva) },
        ];
        if (retRate > 0) {
          rows.push({ k: T2.rowWithholding + ' (' + pct(numOr(v.retencion, 15), 0) + ')', v: '−' + eur(retencion) });
        }
        rows.push({ k: T2.rowTotal, v: eur(total), strong: true });

        return {
          main: { label: T2.mainLabel, value: eur(total) },
          rows: rows,
          note: T2.note,
          copy: T2.copyBase + eur(base) + T2.copyVat + eur(iva) + (retRate > 0 ? T2.copyWithholding + eur(retencion) : '') + T2.copyTotal + eur(total),
        };
      },
    },
  };

  /* ================================================================
     TEXTO DE CAMPOS EN INGLÉS — labels/placeholders/help/unit/options
     de CALC_SPECS. Se aplican por encima de los valores españoles (que
     son los que ya están escritos arriba, sin cambios) cuando se llama
     a configure({locale:'en'}). No se toca ninguna `compute`.
     ================================================================ */

  var FIELD_EN = {
    iva: {
      submitLabel: 'Calculate VAT',
      fields: {
        precio: { label: 'Price' },
        tipo: { label: 'VAT rate', options: { '4': '4%', '10': '10%', '21': '21%' } },
        modo: { label: 'Operation', options: { anadir: 'Add VAT (price excluding VAT → including VAT)', quitar: 'Remove VAT (price including VAT → excluding VAT)' } },
      },
    },
    finiquito: {
      submitLabel: 'Calculate severance pay',
      fields: {
        salario: { label: 'Gross monthly salary' },
        dias: { label: 'Days worked in the current month', help: 'Days worked in the month of leaving or dismissal.' },
        vacaciones: { label: 'Unused holiday days' },
        preaviso: { label: 'Unworked notice days', help: 'Only if notice was not worked and compensation applies.' },
      },
    },
    nomina: {
      submitLabel: 'Calculate net salary',
      fields: {
        bruto: { label: 'Gross annual salary', help: 'The full-year total, before tax.' },
        pagas: { label: 'Number of payments', options: { '12': '12 payments', '14': '14 payments' } },
        hijos: { label: 'Dependent children under 25' },
      },
    },
    hipoteca: {
      submitLabel: 'Calculate payment',
      fields: {
        capital: { label: 'Loan amount' },
        anios: { label: 'Term', unit: 'years' },
        interes: { label: 'Annual interest rate', help: 'For a variable-rate mortgage, use the current Euríbor plus your margin.' },
      },
    },
    prestamo: {
      submitLabel: 'Calculate payment',
      fields: {
        capital: { label: 'Loan amount' },
        tin: { label: 'Annual interest rate (TIN)' },
        meses: { label: 'Term', unit: 'months' },
      },
    },
    ahorro: {
      submitLabel: 'Calculate monthly savings',
      fields: {
        objetivo: { label: 'Savings goal' },
        inicial: { label: 'Current savings' },
        anios: { label: 'Term', unit: 'years' },
        rentabilidad: { label: 'Expected annual return', help: 'Savings account: 2-3%. Global index fund, historically: 7-9%.' },
      },
    },
    porcentaje: {
      submitLabel: 'Calculate',
      fields: {
        modo: { label: 'Calculation type', options: { pct_de: 'X% of Y', que_pct: 'What % is it?', variacion: 'Change' } },
        a: { label: 'Value A' },
        b: { label: 'Value B' },
      },
    },
    dias: {
      submitLabel: 'Calculate days',
      fields: {
        inicio: { label: 'Start date' },
        fin: { label: 'End date' },
        soloLaborables: { label: 'Count working days only (Monday to Friday)' },
      },
    },
    imc: {
      submitLabel: 'Calculate BMI',
      fields: {
        peso: { label: 'Weight' },
        altura: { label: 'Height' },
      },
    },
    propina: {
      submitLabel: 'Calculate split',
      fields: {
        cuenta: { label: 'Total bill' },
        porcentaje: { label: 'Tip', options: { '0': '0%', '5': '5%', '10': '10%', '15': '15%' } },
        personas: { label: 'People' },
      },
    },
    combustible: {
      submitLabel: 'Calculate cost',
      fields: {
        km: { label: 'Trip distance' },
        consumo: { label: 'Average consumption', unit: 'L/100 km' },
        precio: { label: 'Fuel price', unit: '€/liter' },
        personas: { label: 'People sharing the cost' },
      },
    },
    'retencion-factura': {
      submitLabel: 'Calculate invoice',
      fields: {
        base: { label: 'Tax base' },
        ivaTipo: { label: 'VAT rate', options: { '0': '0%', '4': '4%', '10': '10%', '21': '21%' } },
        retencion: {
          label: 'IRPF withholding',
          options: {
            '0': 'No withholding (invoice to a private individual)',
            '15': 'Standard — 15%',
            '7': 'New professional (1st year + following 2) — 7%',
          },
        },
      },
    },
  };

  // Copia de los textos de campo originales (español), tomada una sola
  // vez al cargar el módulo, antes de cualquier mutación — así
  // configure({locale:'es'}) siempre puede restaurar el estado exacto
  // de partida sin depender del orden en que se llame.
  var FIELD_ES_SNAPSHOT = {};
  Object.keys(CALC_SPECS).forEach(function (id) {
    var spec = CALC_SPECS[id];
    var snap = { submitLabel: spec.submitLabel, fields: {} };
    spec.fields.forEach(function (f) {
      var fs = { label: f.label, unit: f.unit, placeholder: f.placeholder, help: f.help };
      if (f.options) fs.options = f.options.map(function (o) { return o.label; });
      snap.fields[f.id] = fs;
    });
    FIELD_ES_SNAPSHOT[id] = snap;
  });

  function applyFieldText(locale) {
    Object.keys(CALC_SPECS).forEach(function (id) {
      var spec = CALC_SPECS[id];
      var base = FIELD_ES_SNAPSHOT[id];
      var over = locale === 'en' ? FIELD_EN[id] : null;

      spec.submitLabel = (over && over.submitLabel) || base.submitLabel;
      spec.fields.forEach(function (f) {
        var b = base.fields[f.id];
        var o = over && over.fields[f.id];
        f.label = (o && o.label) || b.label;
        f.unit = (o && o.unit) || b.unit;
        f.placeholder = b.placeholder; // los ejemplos numéricos no cambian con el idioma
        f.help = (o && o.help) || b.help;
        if (f.options && b.options) {
          f.options.forEach(function (opt, i) {
            var oOpt = o && o.options && o.options[String(opt.value)];
            opt.label = oOpt || b.options[i];
          });
        }
      });
    });
  }

  /* Cambia el idioma activo: formato numérico (fmt/eur/pct), texto de
     resultado (compute) y texto de formulario (CALC_SPECS), todo a la
     vez y de forma reversible. No toca ninguna fórmula. */
  function configure(opts) {
    opts = opts || {};
    var locale = opts.locale === 'en' ? 'en' : 'es';
    CURRENT_LOCALE = locale;
    T = locale === 'en' ? T_EN : T_ES;
    applyFieldText(locale);
    return { locale: CURRENT_LOCALE };
  }

  return {
    CALC_SPECS: CALC_SPECS,
    fmt: fmt, eur: eur, pct: pct,
    num: num, numOr: numOr, intOr: intOr,
    parseISODate: parseISODate,
    payment: payment,
    progressiveTax: progressiveTax,
    childMinimum: childMinimum,
    splitBar: splitBar,
    configure: configure,
    compute: function (id, values) {
      var spec = CALC_SPECS[id];
      if (!spec) throw new Error('Calculadora desconocida: ' + id);
      return spec.compute(values);
    },
  };
});
