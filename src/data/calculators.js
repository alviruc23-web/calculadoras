/* ============================================================
   Contenido de las calculadoras (fuente única).

   La LÓGICA de cálculo y los CAMPOS viven en
   assets/js/calc-engine.js (compartidos entre navegador y tests).
   Aquí vive solo el CONTENIDO editorial: nombre, textos, fórmula,
   ejemplo, FAQ y relaciones.

   Para añadir una calculadora nueva:
     1. añade su spec (campos + compute) en assets/js/calc-engine.js
     2. añade su entrada aquí (con su bloque `en` si se quiere en inglés)
   El build genera la página, la mete en su categoría, en el sitemap,
   en el buscador y en el enlazado interno automáticamente.

   Idiomas: `id` es la clave estable (español, nunca cambia — es la
   que usa CALC_SPECS[id] y el mount-div calc-${id}). `slug` es lo
   único que construye la URL: en español slug === id; en inglés es
   `en.enSlug`, optimizado por palabra clave, no traducción literal.
   getCalcs(locale) es el único punto que las plantillas y build.js
   deben usar para obtener la lista de calculadoras en el idioma
   correcto — para 'es' devuelve CALCS tal cual (cero riesgo).
   ============================================================ */

const ICONS = {
  iva: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  finiquito: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>',
  nomina: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  hipoteca: '<path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 21h18"/>',
  prestamo: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6"/>',
  ahorro: '<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-6"/>',
  porcentaje: '<circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><line x1="7" y1="17" x2="17" y2="7"/>',
  dias: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  imc: '<path d="M12 2a5 5 0 015 5c0 5.5-5 11-5 11S7 12.5 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="2"/>',
  propina: '<path d="M17 9V7a5 5 0 00-10 0v2"/><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 12v5"/>',
  combustible: '<path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
};

function icon(id) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[id] + '</svg>';
}

const CALCS = [
  {
    id: 'iva',
    cat: 'fiscal',
    yearSensitive: true,
    name: 'Calculadora de IVA',
    h1: 'Calculadora de IVA',
    short: 'Añade o quita el IVA de cualquier precio, con los tipos del 21 %, 10 % y 4 %.',
    intro: 'Introduce un precio y obtén al instante la base imponible, el importe del IVA y el total. Funciona en los dos sentidos: para añadir el IVA a un precio sin impuestos o para averiguar la base a partir de un precio que ya lo incluye.',
    keywords: 'iva impuesto valor añadido precio sin iva con iva desglose factura autonomo 21 10 4 tipo general reducido superreducido',
    formula: {
      title: 'Fórmula del IVA',
      lines: [
        { label: 'Añadir IVA', expr: 'Total = Base × (1 + tipo)' },
        { label: 'Quitar IVA', expr: 'Base = Total ÷ (1 + tipo)' },
        { label: 'Cuota de IVA', expr: 'IVA = Total − Base' },
      ],
      note: 'El «tipo» es el porcentaje en tanto por uno: 21 % → 0,21.',
      source: 'Tipos de IVA vigentes en España, Ley 37/1992 del Impuesto sobre el Valor Añadido.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Un servicio de 100 € sin IVA con el tipo general del 21 %: la cuota es 100 × 0,21 = 21 €, y el total a facturar es 121 €. A la inversa, si te cobran 121 € con IVA incluido, la base es 121 ÷ 1,21 = 100 €.',
    },
    faq: [
      { q: '¿Qué tipo de IVA tengo que aplicar?', a: 'El tipo general es el 21 % y cubre la mayoría de bienes y servicios. El reducido del 10 % se aplica a hostelería, transporte de viajeros y buena parte de los alimentos. El superreducido del 4 % corresponde a alimentos básicos, libros, periódicos y medicamentos.' },
      { q: '¿Cómo sé si un precio ya lleva el IVA incluido?', a: 'En una tienda, el precio que ves al público siempre incluye el IVA. En presupuestos y facturas entre profesionales suele indicarse la base y la cuota por separado, y la factura debe desglosar ambos importes.' },
      { q: '¿Puedo deducirme el IVA que pago?', a: 'Solo si eres autónomo o empresa, la compra está afecta a tu actividad económica y tienes factura completa a tu nombre. Un consumidor final no puede deducirlo.' },
      { q: '¿Qué pasa si aplico mal el tipo en una factura?', a: 'Habría que emitir una factura rectificativa. Si la diferencia ya se ha declarado, se corrige en la siguiente autoliquidación o mediante una complementaria.' },
    ],
    tip: 'Si eres autónomo, guarda siempre la factura completa: sin ella no puedes deducir el IVA soportado aunque la compra esté relacionada con tu actividad.',
    related: ['porcentaje', 'nomina', 'prestamo'],
    en: {
      enSlug: 'vat-calculator',
      name: 'Spanish VAT Calculator',
      h1: 'Spanish VAT Calculator',
      short: 'Add or remove Spanish VAT (IVA) from any price, at the 21%, 10% and 4% rates.',
      intro: 'Enter a price and instantly get the tax base, the VAT amount, and the total. Works both ways: add VAT to a price that excludes tax, or work out the base from a price that already includes it.',
      formula: {
        title: 'The VAT formula',
        lines: [
          { label: 'Add VAT', expr: 'Total = Base × (1 + rate)' },
          { label: 'Remove VAT', expr: 'Base = Total ÷ (1 + rate)' },
          { label: 'VAT amount', expr: 'VAT = Total − Base' },
        ],
        note: 'The "rate" is the percentage as a decimal: 21% → 0.21.',
        source: 'Current Spanish VAT rates, Law 37/1992 on Value Added Tax (IVA).',
      },
      example: {
        title: 'Example',
        text: "A €100 service excluding VAT at the standard 21% rate: the VAT is 100 × 0.21 = €21, and the total to invoice is €121. The other way round, if you're charged €121 including VAT, the base is 121 ÷ 1.21 = €100.",
      },
      faq: [
        { q: 'Which VAT rate applies?', a: 'The standard rate is 21% and covers most goods and services. The reduced 10% rate applies to hospitality, passenger transport and most food. The super-reduced 4% rate covers basic foodstuffs, books, newspapers and medicines.' },
        { q: 'How do I know if a price already includes VAT?', a: 'In a shop, the price shown to the public always includes VAT. On quotes and invoices between businesses, the base and the VAT amount are usually shown separately, and the invoice must break both out.' },
        { q: 'Can I deduct the VAT I pay?', a: "Only if you're self-employed or a business, the purchase relates to your economic activity, and you hold a full invoice in your name. A final consumer cannot deduct it." },
        { q: 'What happens if I apply the wrong rate on an invoice?', a: "You'd need to issue a corrective invoice. If the difference has already been declared, it's corrected in the next return or via a supplementary one." },
      ],
      tip: "If you're self-employed, always keep the full invoice: without it you can't deduct input VAT, even if the purchase relates to your business.",
    },
  },

  {
    id: 'finiquito',
    cat: 'laboral',
    yearSensitive: true,
    name: 'Calculadora de finiquito',
    h1: 'Calculadora de finiquito',
    short: 'Calcula lo que te deben al terminar un contrato: días trabajados, vacaciones y preaviso.',
    intro: 'El finiquito recoge lo que la empresa te debe hasta el último día: la parte proporcional del mes trabajado, las vacaciones que no has disfrutado y, si procede, el preaviso no cumplido. Esta herramienta lo estima en bruto y te muestra el desglose concepto a concepto.',
    keywords: 'finiquito despido baja voluntaria fin de contrato vacaciones no disfrutadas preaviso liquidacion saldo y finiquito dias trabajados',
    formula: {
      title: 'Cómo se calcula',
      lines: [
        { label: 'Salario diario', expr: 'Salario mensual ÷ 30' },
        { label: 'Días trabajados', expr: 'Salario diario × días del mes trabajados' },
        { label: 'Vacaciones', expr: 'Salario diario × días de vacaciones pendientes' },
        { label: 'Total', expr: 'Días trabajados + Vacaciones + Preaviso' },
      ],
      note: 'Se usa el divisor de 30 días, que es el criterio habitual en nómina mensual.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Con un salario de 1.800 € brutos al mes, dejas la empresa habiendo trabajado 15 días del mes y con 8 días de vacaciones pendientes. El salario diario es 1.800 ÷ 30 = 60 €. El finiquito bruto es 60 × 15 + 60 × 8 = 900 + 480 = 1.380 €.',
    },
    faq: [
      { q: '¿El finiquito y la indemnización son lo mismo?', a: 'No. El finiquito es lo que ya has devengado y está pendiente de cobro, y corresponde siempre, sea cual sea el motivo de la salida. La indemnización compensa la pérdida del empleo y solo se percibe en determinados tipos de despido o fin de contrato.' },
      { q: '¿Cuándo debo cobrarlo?', a: 'La ley no fija un plazo exacto. La práctica habitual es recibirlo el último día de trabajo o junto con la nómina del mes siguiente. Un retraso injustificado puede reclamarse.' },
      { q: '¿Tengo que firmar el finiquito en el momento?', a: 'No estás obligado a firmarlo en el acto. Puedes pedir una copia, revisarla con calma y, si no estás de acuerdo, firmar añadiendo «no conforme»: así cobras el importe y conservas el derecho a reclamar la diferencia.' },
      { q: '¿Se descuentan impuestos del finiquito?', a: 'Sí. El importe que calcula esta herramienta es bruto: sobre él se aplican la retención de IRPF y las cotizaciones a la Seguridad Social que correspondan.' },
    ],
    tip: 'Si el importe no te cuadra, el plazo para reclamar por la vía laboral es corto. Revisa el desglose cuanto antes y pide asesoramiento si ves diferencias.',
    related: ['nomina', 'dias', 'ahorro'],
    en: {
      enSlug: 'severance-pay-calculator',
      name: 'Spanish Severance Pay Calculator',
      h1: 'Spanish Severance Pay Calculator',
      short: "Work out what you're owed at the end of a Spanish employment contract: days worked, unused holiday and notice.",
      intro: "Finiquito is what a company owes you up to your last day under Spanish employment law: the pro-rata share of the month worked, any holiday you haven't taken, and unpaid notice if it applies. This tool estimates the gross amount and shows the breakdown item by item.",
      formula: {
        title: 'How it is calculated',
        lines: [
          { label: 'Daily wage', expr: 'Monthly salary ÷ 30' },
          { label: 'Days worked', expr: 'Daily wage × days worked in the month' },
          { label: 'Holiday', expr: 'Daily wage × unused holiday days' },
          { label: 'Total', expr: 'Days worked + Holiday + Notice' },
        ],
        note: 'A 30-day divisor is used, the standard convention for monthly payroll in Spain.',
      },
      example: {
        title: 'Example',
        text: 'With a gross monthly salary of €1,800, you leave the company having worked 15 days of the month with 8 days of unused holiday. The daily wage is 1,800 ÷ 30 = €60. The gross severance pay is 60 × 15 + 60 × 8 = 900 + 480 = €1,380.',
      },
      faq: [
        { q: 'Are severance pay (finiquito) and dismissal compensation the same thing?', a: "No. Finiquito is what you've already earned and is owed to you regardless of why you're leaving. Dismissal/redundancy compensation compensates job loss and only applies to certain types of dismissal or contract endings." },
        { q: 'When should I be paid?', a: "Spanish law doesn't set an exact deadline. In practice it's paid on your last working day or with the following month's payroll. An unjustified delay can be challenged." },
        { q: 'Do I have to sign it on the spot?', a: 'No. You can ask for a copy, review it calmly, and if you disagree, sign it marked "no conforme" (not in agreement): that lets you collect the amount while keeping the right to claim the difference.' },
        { q: 'Is tax deducted from severance pay?', a: 'Yes. This tool calculates the gross amount: Spanish income tax withholding (IRPF) and Social Security contributions are applied on top, as applicable.' },
      ],
      tip: "If the amount doesn't add up, the deadline to challenge it through a Spanish labor tribunal is short. Review the breakdown as soon as possible and get advice if you spot a difference.",
    },
  },

  {
    id: 'nomina',
    cat: 'laboral',
    yearSensitive: true,
    name: 'Calculadora de sueldo neto',
    h1: 'Calculadora de sueldo neto',
    short: 'Convierte tu salario bruto anual en el neto que cobras, con IRPF y Seguridad Social.',
    intro: 'Del bruto al neto hay dos descuentos: las cotizaciones a la Seguridad Social y la retención de IRPF. Esta calculadora aplica la escala del IRPF por tramos de forma progresiva y tiene en cuenta el mínimo personal y familiar, que es lo que hace que dos sueldos iguales tributen distinto según los hijos a cargo.',
    keywords: 'sueldo neto salario bruto a neto nomina irpf retencion seguridad social cuanto cobro 12 14 pagas calculadora sueldo',
    formula: {
      title: 'Cómo se calcula',
      lines: [
        { label: 'Cotización SS', expr: 'Bruto × 6,35 %' },
        { label: 'Base del IRPF', expr: 'Bruto − SS − gastos − reducción' },
        { label: 'Cuota', expr: 'Escala progresiva(base) − Escala(mínimo personal)' },
        { label: 'Neto anual', expr: 'Bruto − SS − Cuota IRPF' },
      ],
      note: 'La escala se aplica por tramos: cada porción del salario tributa a su tipo, no todo el salario al tipo más alto.',
      source: 'Escala general del IRPF y mínimo personal y familiar, Ley 35/2006 del IRPF.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Con 28.000 € brutos anuales y sin hijos, se descuentan unos 1.778 € de Seguridad Social. Sobre la base resultante se aplica la escala por tramos y se resta el mínimo personal, lo que deja una retención muy inferior al 30 % que sugeriría mirar solo el tramo en el que cae el salario.',
    },
    faq: [
      { q: '¿Por qué mi retención real no coincide exactamente?', a: 'La retención que aplica tu empresa depende de tu comunidad autónoma, tu situación familiar completa, tu tipo de contrato y otros datos que declaras en el modelo 145. Esta calculadora usa la escala general y el mínimo personal, así que da una estimación cercana pero no idéntica.' },
      { q: '¿Cambia el neto anual según las pagas?', a: 'No. Cobrar en 12 o en 14 pagas reparte el mismo dinero de otra forma: el neto anual es idéntico, solo cambia el importe de cada nómina.' },
      { q: '¿Qué es el mínimo personal y familiar?', a: 'Es la parte de tu renta que se considera destinada a cubrir necesidades básicas y que, en la práctica, no tributa. Aumenta con los hijos a cargo, y por eso la retención baja al declararlos.' },
      { q: '¿Cotizo sobre todo el salario?', a: 'Se cotiza sobre la base de cotización, que tiene un tope máximo anual. Por encima de esa base, un salario mayor ya no incrementa la cotización, aunque sí el IRPF.' },
    ],
    tip: 'Si tu situación personal cambia (un hijo, una hipoteca con derecho a deducción, un cambio de contrato), actualiza el modelo 145 en tu empresa: es lo que ajusta la retención.',
    related: ['finiquito', 'ahorro', 'iva'],
    en: {
      enSlug: 'spanish-payroll-calculator',
      name: 'Spanish Payroll Calculator (Net Salary)',
      h1: 'Spanish Payroll Calculator (Net Salary)',
      short: 'Convert your gross annual salary in Spain into net take-home pay, with income tax and Social Security.',
      intro: "Getting from gross to net involves two deductions under Spanish rules: Social Security contributions and income tax withholding (IRPF). This calculator applies Spain's progressive IRPF tax bands and accounts for the personal and family allowance, which is why two identical salaries are taxed differently depending on dependent children.",
      formula: {
        title: 'How it is calculated',
        lines: [
          { label: 'Social Security', expr: 'Gross × 6.35%' },
          { label: 'IRPF tax base', expr: 'Gross − Social Security − allowable expenses − reduction' },
          { label: 'Tax due', expr: 'Progressive scale(base) − Scale(personal allowance)' },
          { label: 'Net annual', expr: 'Gross − Social Security − IRPF due' },
        ],
        note: 'The scale is applied by bracket: each slice of salary is taxed at its own rate, not the whole salary at the top rate.',
        source: "Spain's general IRPF tax scale and personal/family allowance, Law 35/2006 on Personal Income Tax (IRPF).",
      },
      example: {
        title: 'Example',
        text: 'With €28,000 gross per year and no children, around €1,778 is deducted for Social Security. The progressive scale is then applied to the resulting base, minus the personal allowance — leaving a withholding well below the 30% you might expect from just looking at the top bracket your salary falls into.',
      },
      faq: [
        { q: "Why doesn't my actual withholding match exactly?", a: 'The withholding your employer applies depends on your Spanish region, your full family situation, your contract type and other data declared on form 145. This calculator uses the general scale and personal allowance, so it gives a close estimate, not an identical figure.' },
        { q: 'Does net annual pay change with the number of payments?', a: 'No. Being paid over 12 or 14 installments just splits the same money differently: the net annual amount is identical, only the amount per payslip changes.' },
        { q: 'What is the personal and family allowance?', a: "It's the part of your income considered to cover basic needs, which in practice isn't taxed. It increases with dependent children, which is why withholding drops once you declare them." },
        { q: 'Do I pay Social Security on my entire salary?', a: 'Contributions are based on a contribution base that has an annual cap. Above that base, a higher salary no longer increases your contribution, though it still increases IRPF.' },
      ],
      tip: "If your personal situation changes (a child, a mortgage with a tax deduction, a new contract type), update form 145 with your employer — that's what adjusts the withholding.",
    },
  },

  {
    id: 'hipoteca',
    cat: 'financiera',
    trustNote: 'No te pedimos datos ni te llamamos: el cálculo se hace en tu navegador.',
    name: 'Calculadora de hipoteca',
    h1: 'Calculadora de hipoteca',
    short: 'Cuota mensual, intereses totales y coste real de tu hipoteca.',
    intro: 'Calcula la cuota mensual de una hipoteca con el sistema francés, el que usan prácticamente todos los bancos en España. Verás además cuántos intereses pagarás en total y qué proporción representan sobre el capital que pides.',
    keywords: 'hipoteca cuota mensual prestamo hipotecario vivienda casa piso euribor interes fijo variable amortizacion cuanto pagare',
    formula: {
      title: 'Fórmula de la cuota (sistema francés)',
      lines: [
        { label: 'Cuota', expr: 'C × i × (1+i)ⁿ ÷ [(1+i)ⁿ − 1]' },
        { label: 'donde', expr: 'C = capital · i = interés mensual · n = nº de cuotas' },
      ],
      note: 'El interés mensual es el tipo anual dividido entre 12. La cuota es constante, pero al principio pagas más intereses y menos capital.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Una hipoteca de 150.000 € a 25 años al 3 % anual da una cuota de unos 711 € al mes. En total devolverás cerca de 213.000 €, de los cuales unos 63.000 € son intereses: un 42 % adicional sobre el capital prestado.',
    },
    faq: [
      { q: '¿Qué diferencia hay entre TIN y TAE?', a: 'El TIN es el interés puro del préstamo. El TAE incorpora además comisiones, gastos y la forma en que se capitalizan los intereses, así que es el dato que permite comparar ofertas de forma realista.' },
      { q: '¿Fija o variable?', a: 'La fija mantiene la cuota constante durante toda la vida del préstamo, a cambio de un tipo de partida algo mayor. La variable se referencia al Euríbor más un diferencial y se revisa periódicamente, por lo que la cuota puede subir o bajar.' },
      { q: '¿Cuánto debería suponer la hipoteca sobre mis ingresos?', a: 'La referencia habitual de las entidades es que la suma de todas tus cuotas no supere entre el 30 % y el 35 % de tus ingresos netos mensuales.' },
      { q: '¿Compensa amortizar anticipadamente?', a: 'Cuanto antes se amortiza, más intereses se ahorran, porque al principio de la vida del préstamo la parte de intereses de cada cuota es mayor. Conviene comprobar si tu escritura recoge comisión por amortización anticipada.' },
    ],
    tip: 'Antes de firmar, pide la FEIN y compara el TAE entre entidades: dos ofertas con el mismo TIN pueden costar miles de euros de diferencia por comisiones y productos vinculados.',
    related: ['prestamo', 'ahorro', 'nomina'],
    en: {
      enSlug: 'mortgage-calculator',
      name: 'Spanish Mortgage Calculator',
      h1: 'Spanish Mortgage Calculator',
      short: 'Monthly payment, total interest and the real cost of a mortgage in Spain.',
      intro: "Calculate the monthly payment of a mortgage using the French amortization system, used by practically every bank in Spain. You'll also see the total interest you'll pay and what proportion that represents of the amount borrowed.",
      trustNote: "We don't ask for your details or call you: the calculation runs entirely in your browser.",
      formula: {
        title: 'The payment formula (French amortization)',
        lines: [
          { label: 'Payment', expr: 'P × i × (1+i)ⁿ ÷ [(1+i)ⁿ − 1]' },
          { label: 'where', expr: 'P = principal · i = monthly interest rate · n = number of payments' },
        ],
        note: 'The monthly rate is the annual rate divided by 12. The payment stays constant, but early on you pay more interest and less principal.',
      },
      example: {
        title: 'Example',
        text: "A €150,000 mortgage over 25 years at 3% annual interest gives a monthly payment of around €711. In total you'll repay close to €213,000, of which about €63,000 is interest — an extra 42% on top of the amount borrowed.",
      },
      faq: [
        { q: "What's the difference between TIN and TAE?", a: 'TIN is the pure interest rate of the loan. TAE (APR) also factors in fees, costs and how interest compounds, making it the figure that lets you compare offers realistically.' },
        { q: 'Fixed or variable rate?', a: 'A fixed rate keeps the payment constant for the whole term, in exchange for a somewhat higher starting rate. A variable rate is pegged to the Euríbor plus a margin and is reviewed periodically, so the payment can rise or fall.' },
        { q: 'How much of my income should the mortgage take up?', a: "Spanish lenders typically use a rule of thumb that all your loan payments combined shouldn't exceed 30-35% of your net monthly income." },
        { q: 'Is it worth paying off early?', a: 'The earlier you pay down principal, the more interest you save, because the interest portion of each payment is highest early in the loan. Check whether your mortgage deed includes an early repayment fee.' },
      ],
      tip: 'Before signing, ask for the FEIN (the standardized pre-contract information sheet) and compare the TAE between lenders: two offers with the same TIN can differ by thousands of euros once fees and tied products are factored in.',
    },
  },

  {
    id: 'prestamo',
    cat: 'financiera',
    trustNote: 'No te pedimos datos ni te llamamos: el cálculo se hace en tu navegador.',
    name: 'Calculadora de préstamo personal',
    h1: 'Calculadora de préstamo personal',
    short: 'Cuota mensual y coste total de un préstamo personal o de un crédito al consumo.',
    intro: 'Calcula la cuota de un préstamo personal a partir del importe, el TIN y el plazo en meses. Verás también cuántos intereses pagas en total, que es la cifra que de verdad permite comparar entre ofertas.',
    keywords: 'prestamo personal credito consumo cuota mensual tin tae financiacion coche reforma cuanto me costara',
    formula: {
      title: 'Fórmula de la cuota',
      lines: [
        { label: 'Cuota', expr: 'C × i × (1+i)ⁿ ÷ [(1+i)ⁿ − 1]' },
        { label: 'Coste total', expr: 'Cuota × n − C' },
      ],
      note: 'Es el mismo sistema de amortización francés que se usa en las hipotecas.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Un préstamo de 10.000 € al 8 % TIN a 48 meses supone una cuota de unos 244 € al mes. Al final habrás devuelto unos 11.718 €, es decir, 1.718 € de intereses.',
    },
    faq: [
      { q: '¿Por qué el TAE es mayor que el TIN?', a: 'Porque el TAE incluye las comisiones y gastos del préstamo, además del efecto de la capitalización. Si un préstamo no tiene comisiones, TIN y TAE quedan muy próximos.' },
      { q: '¿Alargar el plazo es buena idea?', a: 'Alargar el plazo baja la cuota mensual, pero aumenta el total de intereses que acabas pagando. Conviene buscar el plazo más corto que tu presupuesto tolere con holgura.' },
      { q: '¿Puedo amortizar antes de tiempo?', a: 'Sí. En préstamos al consumo la comisión por amortización anticipada está limitada por ley y, en muchos casos, es cero. Revisa el contrato antes de firmar.' },
    ],
    tip: 'Cuidado con la financiación «sin intereses» del punto de venta: a veces el coste está incorporado al precio del producto. Compara siempre el importe total a pagar.',
    related: ['hipoteca', 'ahorro', 'porcentaje'],
    en: {
      enSlug: 'loan-calculator',
      name: 'Spanish Personal Loan Calculator',
      h1: 'Spanish Personal Loan Calculator',
      short: 'Monthly payment and total cost of a personal loan under Spanish lending terms (TIN/TAE).',
      intro: "Calculate the monthly payment of a personal loan in Spain from the amount, the interest rate (TIN) and the term in months. You'll also see the total interest paid — the figure that actually lets you compare offers.",
      trustNote: "We don't ask for your details or call you: the calculation runs entirely in your browser.",
      formula: {
        title: 'The payment formula',
        lines: [
          { label: 'Payment', expr: 'P × i × (1+i)ⁿ ÷ [(1+i)ⁿ − 1]' },
          { label: 'Total cost', expr: 'Payment × n − P' },
        ],
        note: 'This is the same French amortization system used for mortgages.',
      },
      example: {
        title: 'Example',
        text: "A €10,000 loan at 8% TIN over 48 months gives a monthly payment of around €244. By the end you'll have repaid about €11,718 — that's €1,718 in interest.",
      },
      faq: [
        { q: 'Why is the TAE higher than the TIN?', a: "Because the TAE (APR) includes the loan's fees and costs on top of the interest, plus the compounding effect. If a loan has no fees, TIN and TAE end up very close." },
        { q: 'Is a longer term a good idea?', a: 'A longer term lowers the monthly payment but increases the total interest you end up paying. Aim for the shortest term your budget can comfortably handle.' },
        { q: 'Can I pay it off early?', a: 'Yes. For consumer loans, the early repayment fee is capped by law and in many cases is zero. Check the contract before signing.' },
      ],
      tip: 'Watch out for "interest-free" financing offered at the point of sale — sometimes the cost is baked into the product price instead. Always compare the total amount payable.',
    },
  },

  {
    id: 'ahorro',
    cat: 'financiera',
    trustNote: 'No te pedimos datos ni te llamamos: el cálculo se hace en tu navegador.',
    name: 'Calculadora de ahorro',
    h1: 'Calculadora de ahorro',
    short: 'Cuánto necesitas ahorrar al mes para alcanzar un objetivo, con interés compuesto.',
    intro: 'Dinos cuánto quieres reunir, en cuánto tiempo y qué rentabilidad esperas, y calculamos la aportación mensual necesaria. Al separar lo que aportas tú de lo que generan los intereses se ve muy bien el efecto del interés compuesto a largo plazo.',
    keywords: 'ahorro mensual objetivo interes compuesto inversion fondo indexado plan ahorro cuanto ahorrar al mes meta',
    formula: {
      title: 'Fórmula de la aportación',
      lines: [
        { label: 'Falta por reunir', expr: 'Objetivo − Ahorro actual × (1+i)ⁿ' },
        { label: 'Aportación', expr: 'Falta × i ÷ [(1+i)ⁿ − 1]' },
      ],
      note: 'i es la rentabilidad mensual y n el número de meses. Si tu ahorro actual ya alcanza el objetivo por sí solo, la aportación necesaria es cero.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Para reunir 20.000 € en 5 años partiendo de cero y con una rentabilidad del 3 % anual, necesitas ahorrar unos 309 € al mes. Habrás aportado unos 18.560 € de tu bolsillo y el resto lo generan los intereses.',
    },
    faq: [
      { q: '¿Qué es el interés compuesto?', a: 'Es el efecto de que los intereses generados se reinvierten y, a su vez, generan más intereses. Su impacto es pequeño en plazos cortos y muy grande en plazos largos.' },
      { q: '¿Qué rentabilidad es razonable poner?', a: 'Una cuenta remunerada o un depósito se mueven hoy en el entorno del 2–3 %. Un fondo indexado global ha rendido históricamente entre el 7 % y el 9 % anual a largo plazo, pero con caídas por el camino y sin ninguna garantía de repetirlo.' },
      { q: '¿El cálculo tiene en cuenta la inflación?', a: 'No. El resultado está en euros de hoy sin descontar inflación: dentro de 20 años, esa cantidad tendrá menos poder adquisitivo del que tiene ahora.' },
      { q: '¿Y los impuestos de la rentabilidad?', a: 'Las ganancias del ahorro tributan al rescatarlas. La calculadora muestra el importe bruto, sin descontar la fiscalidad del producto que utilices.' },
    ],
    tip: 'Automatiza la aportación el mismo día que cobras. Ahorrar lo que sobra a fin de mes funciona mucho peor que apartar la cantidad al principio.',
    related: ['prestamo', 'hipoteca', 'porcentaje'],
    en: {
      enSlug: 'savings-calculator',
      name: 'Savings Calculator',
      h1: 'Savings Calculator',
      short: 'How much you need to save each month to reach a goal, with compound interest.',
      intro: "Tell us how much you want to reach, over what time frame, and what return you expect, and we'll calculate the monthly contribution you need. Separating what you contribute from what the interest generates makes the long-term effect of compound interest easy to see.",
      trustNote: "We don't ask for your details or call you: the calculation runs entirely in your browser.",
      formula: {
        title: 'The contribution formula',
        lines: [
          { label: 'Amount still needed', expr: 'Goal − Current savings × (1+i)ⁿ' },
          { label: 'Contribution', expr: 'Amount needed × i ÷ [(1+i)ⁿ − 1]' },
        ],
        note: 'i is the monthly rate of return and n the number of months. If your current savings already reach the goal on their own, the required contribution is zero.',
      },
      example: {
        title: 'Example',
        text: "To reach €20,000 in 5 years starting from zero, with a 3% annual return, you need to save around €309 a month. You'll have contributed about €18,560 out of pocket, with the rest generated by interest.",
      },
      faq: [
        { q: 'What is compound interest?', a: "It's the effect where interest earned is reinvested and, in turn, earns more interest. Its impact is small over short periods and very large over long ones." },
        { q: 'What return is reasonable to use?', a: 'A savings account or a term deposit currently runs around 2-3%. A global index fund has historically returned between 7% and 9% a year over the long term, but with drawdowns along the way and no guarantee of repeating that.' },
        { q: 'Does the calculation account for inflation?', a: "No. The result is in today's euros, without discounting for inflation: in 20 years, that amount will have less purchasing power than it does now." },
        { q: 'What about tax on the returns?', a: 'Savings gains are taxed when withdrawn. The calculator shows the gross amount, without deducting the tax treatment of whatever product you use.' },
      ],
      tip: 'Automate the contribution on the day you get paid. Saving whatever is left over at the end of the month works far worse than setting the amount aside first.',
    },
  },

  {
    id: 'porcentaje',
    cat: 'matematica',
    name: 'Calculadora de porcentajes',
    h1: 'Calculadora de porcentajes',
    short: 'Tres cálculos en uno: el X % de una cantidad, qué porcentaje representa y la variación.',
    intro: 'La herramienta cubre los tres casos que aparecen siempre: calcular el porcentaje de una cantidad (descuentos, propinas, comisiones), averiguar qué porcentaje representa un valor sobre otro, y medir la variación entre dos cifras.',
    keywords: 'porcentaje tanto por ciento descuento rebaja aumento subida variacion porcentual regla de tres cuanto es el por ciento',
    formula: {
      title: 'Las tres fórmulas',
      lines: [
        { label: 'X % de Y', expr: 'Y × X ÷ 100' },
        { label: '¿Qué % es A de B?', expr: 'A ÷ B × 100' },
        { label: 'Variación', expr: '(Final − Inicial) ÷ Inicial × 100' },
      ],
      note: 'En la variación, un resultado negativo indica un descenso.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Una chaqueta de 150 € con un 20 % de descuento: el descuento es 150 × 20 ÷ 100 = 30 €, y pagas 120 €. Si más tarde el precio sube de 120 € a 150 €, la variación es (150 − 120) ÷ 120 × 100 = +25 %.',
    },
    faq: [
      { q: '¿Por qué bajar un 20 % y luego subir un 20 % no devuelve el precio original?', a: 'Porque cada porcentaje se aplica sobre una base distinta. De 100 € un −20 % deja 80 €, y un +20 % sobre 80 € son 96 €, no 100 €. Para deshacer un descuento del 20 % hay que subir un 25 %.' },
      { q: '¿Cómo quito un porcentaje ya incluido en un precio?', a: 'Divide entre 1 más el porcentaje en tanto por uno. Para quitar un 21 % incluido: precio ÷ 1,21.' },
      { q: '¿Qué diferencia hay entre puntos porcentuales y por ciento?', a: 'Si algo pasa del 10 % al 12 %, ha subido 2 puntos porcentuales, pero un 20 % en términos relativos. Confundirlos es un error muy común al leer noticias.' },
    ],
    related: ['iva', 'dias', 'ahorro'],
    en: {
      enSlug: 'percentage-calculator',
      name: 'Percentage Calculator',
      h1: 'Percentage Calculator',
      short: 'Three calculations in one: X% of an amount, what percentage one value is of another, and the change between two figures.',
      intro: 'This tool covers the three cases that come up all the time: calculating the percentage of an amount (discounts, tips, commissions), finding out what percentage one value represents of another, and measuring the change between two figures.',
      formula: {
        title: 'The three formulas',
        lines: [
          { label: 'X% of Y', expr: 'Y × X ÷ 100' },
          { label: 'What % is A of B?', expr: 'A ÷ B × 100' },
          { label: 'Change', expr: '(Final − Initial) ÷ Initial × 100' },
        ],
        note: 'For change, a negative result means a decrease.',
      },
      example: {
        title: 'Example',
        text: 'A €150 jacket with a 20% discount: the discount is 150 × 20 ÷ 100 = €30, and you pay €120. If the price later rises from €120 to €150, the change is (150 − 120) ÷ 120 × 100 = +25%.',
      },
      faq: [
        { q: "Why doesn't decreasing by 20% and then increasing by 20% return the original price?", a: 'Because each percentage is applied to a different base. From €100, a −20% leaves €80, and a +20% on €80 is €96, not €100. To undo a 20% discount you need to increase by 25%.' },
        { q: 'How do I remove a percentage already included in a price?', a: 'Divide by 1 plus the percentage as a decimal. To remove a 21% already included: price ÷ 1.21.' },
        { q: "What's the difference between percentage points and percent?", a: "If something goes from 10% to 12%, it's risen by 2 percentage points, but by 20% in relative terms. Mixing these up is a very common mistake when reading the news." },
      ],
    },
  },

  {
    id: 'dias',
    cat: 'matematica',
    name: 'Calculadora de días entre fechas',
    h1: 'Calculadora de días entre fechas',
    short: 'Cuántos días, laborables, semanas y meses hay entre dos fechas.',
    intro: 'Calcula la diferencia exacta entre dos fechas, con el desglose entre días naturales y laborables. Útil para plazos de contratos, preavisos, vencimientos de facturas o simplemente saber cuánto falta para una fecha señalada.',
    keywords: 'dias entre fechas calcular dias laborables plazo vencimiento cuantos dias faltan diferencia fechas semanas meses',
    formula: {
      title: 'Cómo se calcula',
      lines: [
        { label: 'Días naturales', expr: '(Fecha fin − Fecha inicio) ÷ 1 día' },
        { label: 'Laborables', expr: 'Semanas completas × 5 + días sueltos L-V' },
      ],
      note: 'El cálculo se hace en horario universal, de modo que el resultado no cambia según el país desde el que se consulta.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Entre el 1 y el 31 de enero de 2026 hay 30 días naturales. De esos, 22 son laborables de lunes a viernes y 8 caen en fin de semana.',
    },
    faq: [
      { q: '¿Se descuentan los festivos?', a: 'No. El modo de días laborables excluye únicamente sábados y domingos. Los festivos nacionales, autonómicos y locales varían según dónde estés y no se descuentan automáticamente.' },
      { q: '¿Se cuenta el primer día?', a: 'Se calcula la diferencia entre las dos fechas, así que el día inicial no se cuenta como día completo. Si necesitas incluir ambos extremos, suma uno al resultado.' },
      { q: '¿Para qué plazos se usa habitualmente?', a: 'Preavisos de baja voluntaria, plazos de contratos de alquiler, vencimientos de facturas, periodos de prueba o días de vacaciones acumulados.' },
    ],
    related: ['porcentaje', 'finiquito'],
    en: {
      enSlug: 'days-between-dates-calculator',
      name: 'Days Between Dates Calculator',
      h1: 'Days Between Dates Calculator',
      short: 'How many days, working days, weeks and months there are between two dates.',
      intro: 'Calculate the exact difference between two dates, broken down into calendar days and working days. Useful for contract deadlines, notice periods, invoice due dates, or simply finding out how long is left until a given date.',
      formula: {
        title: 'How it is calculated',
        lines: [
          { label: 'Calendar days', expr: '(End date − Start date) ÷ 1 day' },
          { label: 'Working days', expr: 'Full weeks × 5 + remaining Mon-Fri days' },
        ],
        note: 'The calculation is done in universal time, so the result stays the same regardless of the country you check it from.',
      },
      example: {
        title: 'Example',
        text: 'Between 1 and 31 January 2026 there are 30 calendar days. Of those, 22 are working days (Monday to Friday) and 8 fall on a weekend.',
      },
      faq: [
        { q: 'Are public holidays excluded?', a: "No. Working-day mode only excludes Saturdays and Sundays. National, regional and local public holidays vary by location and aren't excluded automatically." },
        { q: 'Is the first day counted?', a: "The difference between the two dates is calculated, so the start day isn't counted as a full day. If you need to include both endpoints, add one to the result." },
        { q: 'What is this typically used for?', a: 'Resignation notice periods, rental contract terms, invoice due dates, probation periods, or accrued holiday days.' },
      ],
    },
  },

  {
    id: 'imc',
    cat: 'salud',
    name: 'Calculadora de IMC',
    h1: 'Calculadora de IMC (índice de masa corporal)',
    short: 'Tu índice de masa corporal y el rango de peso de referencia para tu altura.',
    intro: 'El índice de masa corporal relaciona peso y altura y sirve como primera referencia poblacional. Te mostramos tu valor, la categoría según la Organización Mundial de la Salud y qué rango de peso correspondería a tu altura.',
    keywords: 'imc indice masa corporal peso ideal altura obesidad sobrepeso bajo peso oms calcular imc',
    formula: {
      title: 'Fórmula del IMC',
      lines: [
        { label: 'IMC', expr: 'Peso (kg) ÷ Altura (m)²' },
        { label: 'Rango normal', expr: '18,5 ≤ IMC < 25' },
      ],
      note: 'La altura va en metros: 170 cm son 1,70 m, y el cuadrado es 2,89.',
      source: 'Clasificación del IMC de la Organización Mundial de la Salud (OMS).',
    },
    example: {
      title: 'Ejemplo',
      text: 'Una persona de 70 kg y 170 cm: 70 ÷ (1,70 × 1,70) = 70 ÷ 2,89 = 24,2. Está dentro del rango de peso normal, cuyo límite superior para esa altura son unos 72 kg.',
    },
    faq: [
      { q: '¿El IMC sirve para todo el mundo?', a: 'Es un indicador poblacional, no individual. No distingue entre masa muscular y grasa, por lo que puede clasificar como sobrepeso a personas muy musculadas, ni tiene en cuenta dónde se acumula la grasa, que es lo que más se asocia al riesgo cardiovascular.' },
      { q: '¿Cuáles son los rangos de la OMS?', a: 'Bajo peso por debajo de 18,5. Peso normal entre 18,5 y 24,9. Sobrepeso entre 25 y 29,9. Obesidad grado I entre 30 y 34,9, grado II entre 35 y 39,9 y grado III a partir de 40.' },
      { q: '¿Vale para niños o personas mayores?', a: 'En menores de 18 años se usan percentiles por edad y sexo, no los rangos de adultos. En personas mayores la interpretación también cambia. En ambos casos conviene la valoración de un profesional sanitario.' },
    ],
    tip: 'El perímetro de cintura aporta información que el IMC no recoge y es un complemento sencillo para valorar el riesgo metabólico.',
    related: ['propina', 'dias'],
    en: {
      enSlug: 'bmi-calculator',
      name: 'BMI Calculator',
      h1: 'BMI Calculator (Body Mass Index)',
      short: 'Your Body Mass Index and the reference weight range for your height.',
      intro: 'Body Mass Index relates weight and height and serves as a first population-level reference. We show your value, the World Health Organization category it falls into, and what weight range would correspond to your height.',
      formula: {
        title: 'The BMI formula',
        lines: [
          { label: 'BMI', expr: 'Weight (kg) ÷ Height (m)²' },
          { label: 'Normal range', expr: '18.5 ≤ BMI < 25' },
        ],
        note: 'Height goes in meters: 170 cm is 1.70 m, and the square is 2.89.',
        source: 'World Health Organization (WHO) BMI classification.',
      },
      example: {
        title: 'Example',
        text: 'A person weighing 70 kg at 170 cm: 70 ÷ (1.70 × 1.70) = 70 ÷ 2.89 = 24.2. That is within the normal weight range, whose upper limit for that height is around 72 kg.',
      },
      faq: [
        { q: 'Does BMI work for everyone?', a: "It's a population-level indicator, not an individual one. It doesn't distinguish between muscle and fat, so it can classify very muscular people as overweight, and it doesn't account for where fat is stored, which is what's most linked to cardiovascular risk." },
        { q: 'What are the WHO ranges?', a: 'Underweight below 18.5. Normal weight between 18.5 and 24.9. Overweight between 25 and 29.9. Obesity class I between 30 and 34.9, class II between 35 and 39.9, and class III from 40 upward.' },
        { q: 'Does it apply to children or older adults?', a: "Under-18s use age- and sex-specific percentiles, not the adult ranges. Interpretation also changes for older adults. In both cases, a healthcare professional's assessment is recommended." },
      ],
      tip: "Waist circumference captures information BMI doesn't, and it's a simple complement for assessing metabolic risk.",
    },
  },

  {
    id: 'propina',
    cat: 'viaje',
    name: 'Calculadora de propina',
    h1: 'Calculadora de propina y reparto de cuenta',
    short: 'Calcula la propina y reparte la cuenta entre todos los comensales.',
    intro: 'Introduce el total de la cuenta, elige el porcentaje de propina y el número de personas: te decimos cuánto pone cada uno, con la propina incluida y por separado.',
    keywords: 'propina restaurante repartir cuenta entre personas dividir cuenta pagar a escote comida cena',
    formula: {
      title: 'Cómo se calcula',
      lines: [
        { label: 'Propina', expr: 'Cuenta × porcentaje ÷ 100' },
        { label: 'Por persona', expr: '(Cuenta + Propina) ÷ nº de personas' },
      ],
    },
    example: {
      title: 'Ejemplo',
      text: 'Una cuenta de 60 € con un 10 % de propina son 6 € adicionales, 66 € en total. Entre dos personas, 33 € cada una.',
    },
    faq: [
      { q: '¿Cuánta propina se deja en España?', a: 'No hay ninguna norma ni obligación. Lo habitual es redondear o dejar entre un 5 % y un 10 % si el servicio ha gustado, y en restaurantes de nivel alto suele rondar el 10 %.' },
      { q: '¿Y cuando viajo a otros países?', a: 'Cambia mucho. En Estados Unidos se espera entre un 15 % y un 20 % porque forma parte del salario del personal. En Japón, en cambio, dejar propina puede resultar incómodo. Conviene informarse antes del viaje.' },
      { q: '¿La propina se calcula antes o después del IVA?', a: 'En España la cuenta que te entregan ya incluye el IVA, así que el porcentaje se aplica sobre ese total.' },
    ],
    related: ['combustible', 'porcentaje'],
    en: {
      enSlug: 'tip-calculator',
      name: 'Tip Calculator',
      h1: 'Tip Calculator & Bill Splitter',
      short: 'Calculate the tip and split the bill among everyone at the table.',
      intro: "Enter the total bill, choose the tip percentage and the number of people, and we'll tell you how much each person owes, with the tip included and shown separately.",
      formula: {
        title: 'How it is calculated',
        lines: [
          { label: 'Tip', expr: 'Bill × percentage ÷ 100' },
          { label: 'Per person', expr: '(Bill + Tip) ÷ number of people' },
        ],
      },
      example: {
        title: 'Example',
        text: 'A €60 bill with a 10% tip is an extra €6, €66 in total. Split between two people, that is €33 each.',
      },
      faq: [
        { q: 'How much do people tip in Spain?', a: "There's no rule or obligation. It's common to round up or leave 5-10% if the service was good, and around 10% is typical at higher-end restaurants." },
        { q: 'What about when I travel elsewhere?', a: "It varies a lot. In the US, 15-20% is expected because it forms part of staff wages. In Japan, by contrast, leaving a tip can be awkward. It's worth checking local customs before you travel." },
        { q: 'Is the tip calculated before or after VAT?', a: 'In Spain the bill you receive already includes VAT, so the percentage is applied to that total.' },
      ],
    },
  },

  {
    id: 'combustible',
    cat: 'viaje',
    name: 'Calculadora de gasto de combustible',
    h1: 'Calculadora de gasto de combustible',
    short: 'Cuánto cuesta un viaje en coche según los kilómetros, el consumo y el precio del carburante.',
    intro: 'Calcula los litros que gastarás y lo que te costará un trayecto, tanto solo de ida como de ida y vuelta. Si viajáis varios, también reparte el gasto entre los ocupantes.',
    keywords: 'gasto combustible gasolina diesel viaje coche coste kilometros litros consumo compartir gastos ruta',
    formula: {
      title: 'Cómo se calcula',
      lines: [
        { label: 'Litros', expr: 'Km × consumo ÷ 100' },
        { label: 'Coste', expr: 'Litros × precio por litro' },
      ],
      note: 'El consumo se expresa en litros cada 100 km, como en la ficha técnica del vehículo.',
    },
    example: {
      title: 'Ejemplo',
      text: 'Un viaje de 500 km con un consumo de 7 l/100 km y el gasóleo a 1,65 €/l: gastarás 35 litros y unos 57,75 € solo de ida, es decir, unos 115,50 € ida y vuelta.',
    },
    faq: [
      { q: '¿Dónde miro el consumo real de mi coche?', a: 'El ordenador de a bordo da el consumo medio real, que suele ser un 10–15 % superior al homologado de la ficha técnica, sobre todo en ciudad, con el coche cargado o a velocidad alta en autopista.' },
      { q: '¿Dónde consulto el precio del combustible?', a: 'El Ministerio para la Transición Ecológica publica los precios de todas las estaciones de servicio de España, y hay aplicaciones que muestran las más baratas cerca de tu ruta.' },
      { q: '¿El cálculo incluye peajes o desgaste?', a: 'No. Solo cubre el carburante. Para el coste real del viaje habría que sumar peajes y el desgaste del vehículo, que se suele estimar aparte por kilómetro.' },
    ],
    related: ['propina', 'porcentaje'],
    en: {
      enSlug: 'fuel-cost-calculator',
      name: 'Fuel Cost Calculator',
      h1: 'Fuel Cost Calculator',
      short: 'How much a car trip costs based on distance, fuel consumption and fuel price.',
      intro: "Calculate the liters you'll use and what a trip will cost, one-way or round-trip. If you're traveling with others, it also splits the cost between passengers.",
      formula: {
        title: 'How it is calculated',
        lines: [
          { label: 'Liters', expr: 'Distance × consumption ÷ 100' },
          { label: 'Cost', expr: 'Liters × price per liter' },
        ],
        note: "Consumption is expressed in liters per 100 km, as shown on a vehicle's spec sheet.",
      },
      example: {
        title: 'Example',
        text: "A 500 km trip with fuel consumption of 7 L/100 km and diesel at €1.65/L: you'll use 35 liters, around €57.75 one-way — about €115.50 round-trip.",
      },
      faq: [
        { q: "Where do I find my car's real fuel consumption?", a: 'The onboard computer gives the real average consumption, which is usually 10-15% higher than the official spec-sheet figure, especially in city driving, with a loaded car, or at high motorway speeds.' },
        { q: 'Where can I check fuel prices?', a: "Spain's Ministry for Ecological Transition publishes prices for every service station in the country, and several apps show the cheapest ones near your route." },
        { q: 'Does this include tolls or vehicle wear?', a: 'No. It only covers fuel. For the real cost of a trip you would need to add tolls and vehicle depreciation, which is usually estimated separately per kilometer.' },
      ],
    },
  },
];

CALCS.forEach(c => { c.icon = icon(c.id); c.slug = c.id; });

const CALC_BY_ID = Object.fromEntries(CALCS.map(c => [c.id, c]));

/* Devuelve la lista de calculadoras en el idioma pedido. Para 'es'
   devuelve CALCS tal cual (mismos objetos, cero riesgo). Para 'en'
   devuelve una copia superficial por calculadora con los campos de
   `en` superpuestos y `slug` apuntando a la URL en inglés — los
   campos estructurales (id, cat, icon, related, yearSensitive) no
   están en `en` y se heredan sin cambios. */
function getCalcs(locale) {
  if (locale !== 'en') return CALCS;
  return CALCS.map(c => Object.assign({}, c, c.en, { slug: c.en.enSlug }));
}

function getCalcById(locale, id) {
  return getCalcs(locale).find(c => c.id === id);
}

module.exports = { CALCS, CALC_BY_ID, getCalcs, getCalcById };
