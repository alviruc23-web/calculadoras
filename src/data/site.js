/* ============================================================
   Configuración global del sitio.
   Fuente única para dominio, identidad, categorías y navegación.

   Idiomas: el español (SITE/CATEGORIES/INFO_PAGES) es el contenido
   por defecto y no cambia. El inglés vive en las variantes _EN de
   cada export, bajo /en/. localeData(locale) es el único punto que
   las plantillas y build.js deben usar para resolver qué conjunto
   de datos corresponde a cada idioma.
   ============================================================ */

const SITE = {
  name: 'CalcYa',
  // Dominio propio (CNAME). Todos los canonical, og:url y el sitemap
  // se construyen a partir de aquí: cambiar solo esta línea si cambia el dominio.
  baseUrl: 'https://calculadorasfaciles.es/',
  tagline: 'Calculadoras online gratis, rápidas y sin registro. Pensadas para España.',
  description: 'Calculadoras online gratuitas para el día a día en España: impuestos, nómina, hipoteca, préstamos, salud y más. Sin registro y con el resultado explicado.',
  year: 2026,
  locale: 'es-ES',
  // Fecha de última revisión del contenido y de las fórmulas.
  reviewedOn: '2026-08',
  reviewedLabel: 'agosto de 2026',
  repoUrl: 'https://github.com/alviruc23-web/calculadoras',
  contactUrl: 'https://github.com/alviruc23-web/calculadoras/issues',
};

// Variante en inglés de SITE. baseUrl ya incluye /en/, así que todo el
// código que hace `SITE.baseUrl + algo` funciona igual sin cambios al
// recibir SITE_EN. reviewedOn se mantiene igual al español a propósito:
// es la misma revisión de contenido, hecha el mismo día, no una fecha
// distinta inventada para el inglés.
const SITE_EN = {
  name: 'CalcYa',
  baseUrl: 'https://calculadorasfaciles.es/en/',
  tagline: 'Free, fast online calculators. No sign-up required.',
  description: 'Free online calculators for everyday use: Spanish taxes, payroll, mortgages, loans, health and more. No sign-up, every result explained.',
  year: SITE.year,
  locale: 'en-US',
  reviewedOn: SITE.reviewedOn,
  reviewedLabel: 'August 2026',
  repoUrl: SITE.repoUrl,
  contactUrl: SITE.contactUrl,
};

// Medición y monetización. Ambos scripts se cargan SOLO tras consentimiento
// (ver assets/js/consent.js). Dejar el id vacío desactiva el servicio.
// Compartido entre idiomas: misma cuenta de Analytics/AdSense para todo el dominio.
const SERVICES = {
  analyticsId: 'G-35SN7B8GFE',
  adsenseClient: 'ca-pub-1786551149237210',
};

/* ---- Categorías -------------------------------------------------------
   Cada categoría genera su propia página (/categoria/<slug>/) y agrupa
   calculadoras. Añadir una categoría nueva es añadir un objeto aquí (y
   su equivalente en CATEGORIES_EN más abajo).
   slug/icon/color/text son estructurales e iguales en los dos idiomas;
   label/short/title/description/intro son prosa y sí cambian.
   ---------------------------------------------------------------------- */
const CATEGORIES = [
  {
    id: 'fiscal',
    slug: 'fiscal',
    label: 'Impuestos',
    short: 'Impuestos',
    icon: '💰',
    color: '#FEF3C7',
    text: '#92400E',
    title: 'Calculadoras de impuestos',
    description: 'Calcula el IVA de cualquier precio y otros impuestos habituales en España, con el desglose completo.',
    intro: 'El impuesto con el que te vas a encontrar más a menudo, ya sea comprando o facturando, es el IVA. Aquí puedes calcularlo en los dos sentidos —añadirlo a un precio o extraerlo de uno que ya lo incluye— con los tres tipos vigentes en España.',
  },
  {
    id: 'laboral',
    slug: 'laboral',
    label: 'Trabajo y nómina',
    short: 'Trabajo',
    icon: '👔',
    color: '#F0FDF4',
    text: '#166534',
    title: 'Calculadoras de trabajo y nómina',
    description: 'Del salario bruto al neto, finiquitos y conceptos laborales explicados paso a paso.',
    intro: 'De la nómina a la liquidación final: calcula cuánto vas a cobrar en tu sueldo neto mes a mes, y qué te corresponde al terminar un contrato, ya sea por baja voluntaria, despido o fin de contrato temporal.',
  },
  {
    id: 'financiera',
    slug: 'financiera',
    label: 'Finanzas',
    short: 'Finanzas',
    icon: '🏦',
    color: '#EFF6FF',
    text: '#1E40AF',
    title: 'Calculadoras financieras',
    description: 'Hipotecas, préstamos personales y objetivos de ahorro con interés compuesto.',
    intro: 'Antes de firmar un préstamo o una hipoteca, comprueba la cuota real y cuánto vas a pagar en intereses durante toda la vida del préstamo. Y si lo tuyo es ahorrar, calcula cuánto necesitas apartar cada mes para llegar a tu objetivo.',
  },
  {
    id: 'matematica',
    slug: 'matematica',
    label: 'Matemáticas',
    short: 'Matemáticas',
    icon: '📐',
    color: '#F5F3FF',
    text: '#5B21B6',
    title: 'Calculadoras de matemáticas',
    description: 'Porcentajes, variaciones y cálculos con fechas, con la fórmula siempre a la vista.',
    intro: 'Cálculos que se usan constantemente, dentro y fuera de las finanzas: porcentajes, aumentos o descensos entre dos valores, y la diferencia exacta entre dos fechas, en días naturales o solo laborables.',
  },
  {
    id: 'salud',
    slug: 'salud',
    label: 'Salud',
    short: 'Salud',
    icon: '❤️',
    color: '#FFF1F2',
    text: '#9F1239',
    title: 'Calculadoras de salud',
    description: 'Indicadores de referencia como el índice de masa corporal, con los rangos de la OMS.',
    intro: 'Un único indicador, pero de los más consultados como primera referencia: el índice de masa corporal, calculado con los rangos oficiales de la Organización Mundial de la Salud.',
  },
  {
    id: 'viaje',
    slug: 'viaje',
    label: 'Viajes y día a día',
    short: 'Viajes',
    icon: '🚗',
    color: '#ECFDF5',
    text: '#065F46',
    title: 'Calculadoras de viajes y día a día',
    description: 'Coste de un viaje en coche, reparto de cuentas y otros cálculos cotidianos.',
    intro: 'Para el día a día: reparte una cuenta con propina entre varias personas sin discusiones, o calcula cuánto te va a costar un trayecto en coche según el consumo del vehículo y el precio del combustible.',
  },
];

// slug/icon/color/text idénticos a CATEGORIES (mismo orden, misma
// posición) a propósito: son estructurales, no traducibles.
const CATEGORIES_EN = [
  {
    id: 'fiscal',
    slug: 'taxes',
    label: 'Taxes',
    short: 'Taxes',
    icon: '💰',
    color: '#FEF3C7',
    text: '#92400E',
    title: 'Tax calculators',
    description: 'Calculate VAT on any price and other common Spanish taxes, with the full breakdown.',
    intro: "The tax you'll run into most often, whether buying or invoicing, is VAT (IVA in Spain). Calculate it either way — add it to a price, or extract it from one that already includes it — using Spain's three current VAT rates.",
  },
  {
    id: 'laboral',
    slug: 'work-payroll',
    label: 'Work & Payroll',
    short: 'Payroll',
    icon: '👔',
    color: '#F0FDF4',
    text: '#166534',
    title: 'Work & payroll calculators',
    description: 'From gross to net salary, severance pay, and Spanish employment concepts explained step by step.',
    intro: "From payslip to final settlement: work out your net monthly salary under Spanish rules, and what you're owed when a contract ends — whether by resignation, dismissal, or a temporary contract expiring.",
  },
  {
    id: 'financiera',
    slug: 'finance',
    label: 'Finance',
    short: 'Finance',
    icon: '🏦',
    color: '#EFF6FF',
    text: '#1E40AF',
    title: 'Finance calculators',
    description: 'Mortgages, personal loans and savings goals, with compound interest.',
    intro: "Before signing a loan or a mortgage, check the real monthly payment and how much you'll pay in interest over its full term. Saving instead? Work out how much to set aside each month to hit your target.",
  },
  {
    id: 'matematica',
    slug: 'math',
    label: 'Math',
    short: 'Math',
    icon: '📐',
    color: '#F5F3FF',
    text: '#5B21B6',
    title: 'Math calculators',
    description: 'Percentages, changes between two values, and date calculations, with the formula always in view.',
    intro: 'Calculations used constantly, in finance and beyond: percentages, increases or decreases between two values, and the exact difference between two dates, in calendar or working days.',
  },
  {
    id: 'salud',
    slug: 'health',
    label: 'Health',
    short: 'Health',
    icon: '❤️',
    color: '#FFF1F2',
    text: '#9F1239',
    title: 'Health calculators',
    description: 'Reference indicators like Body Mass Index, using official WHO ranges.',
    intro: 'A single indicator, but one of the most widely used as a first reference: Body Mass Index, calculated using the World Health Organization’s official ranges.',
  },
  {
    id: 'viaje',
    slug: 'travel',
    label: 'Travel & Everyday',
    short: 'Travel',
    icon: '🚗',
    color: '#ECFDF5',
    text: '#065F46',
    title: 'Travel & everyday calculators',
    description: 'Road trip fuel cost, splitting a bill, and other everyday calculations.',
    intro: "For everyday life: split a bill with tip between several people without the awkward math, or work out how much a road trip will cost based on your car's fuel consumption and the price of fuel.",
  },
];

// Clavado por `id` (estable, independiente del idioma) porque los
// calculadores solo conocen el `id` de su categoría (c.cat), no su
// slug — que cambia entre idiomas. Usar `slug` aquí sería un error:
// una calculadora con cat:'fiscal' no encontraría su categoría en
// inglés si esto estuviera indexado por el slug 'taxes'.
const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const CATEGORY_BY_ID_EN = Object.fromEntries(CATEGORIES_EN.map(c => [c.id, c]));

// Páginas informativas/legales que aparecen en el footer.
// `id` es la clave estable (independiente del idioma) que build.js usa
// para saber qué contenido renderizar; `slug` es lo único que cambia
// entre idiomas y construye la URL.
const INFO_PAGES = [
  { id: 'about', slug: 'sobre-calcya', title: 'Sobre CalcYa', navLabel: 'Sobre nosotros' },
  { id: 'contact', slug: 'contacto', title: 'Contacto', navLabel: 'Contacto' },
  { id: 'privacy', slug: 'privacidad', title: 'Política de privacidad', navLabel: 'Privacidad' },
];

const INFO_PAGES_EN = [
  { id: 'about', slug: 'about', title: 'About CalcYa', navLabel: 'About us' },
  { id: 'contact', slug: 'contact', title: 'Contact', navLabel: 'Contact' },
  { id: 'privacy', slug: 'privacy-policy', title: 'Privacy Policy', navLabel: 'Privacy' },
];

/* Único punto que build.js y las plantillas deben usar para resolver
   qué SITE/CATEGORIES/INFO_PAGES corresponden a un idioma. Para 'es'
   devuelve exactamente los mismos objetos de siempre (sin copia ni
   transformación), así que el comportamiento español no cambia. */
function localeData(locale) {
  if (locale === 'en') {
    return { SITE: SITE_EN, CATEGORIES: CATEGORIES_EN, CATEGORY_BY_ID: CATEGORY_BY_ID_EN, INFO_PAGES: INFO_PAGES_EN };
  }
  return { SITE, CATEGORIES, CATEGORY_BY_ID, INFO_PAGES };
}

module.exports = { SITE, SITE_EN, SERVICES, CATEGORIES, CATEGORIES_EN, CATEGORY_BY_ID, CATEGORY_BY_ID_EN, INFO_PAGES, INFO_PAGES_EN, localeData };
