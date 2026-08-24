/* ============================================================
   Configuración global del sitio.
   Fuente única para dominio, identidad, categorías y navegación.
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

// Medición y monetización. Ambos scripts se cargan SOLO tras consentimiento
// (ver assets/js/consent.js). Dejar el id vacío desactiva el servicio.
const SERVICES = {
  analyticsId: 'G-35SN7B8GFE',
  adsenseClient: 'ca-pub-1786551149237210',
};

/* ---- Categorías -------------------------------------------------------
   Cada categoría genera su propia página (/categoria/<slug>/) y agrupa
   calculadoras. Añadir una categoría nueva es añadir un objeto aquí.
   ---------------------------------------------------------------------- */
const CATEGORIES = [
  {
    slug: 'fiscal',
    label: 'Impuestos',
    short: 'Impuestos',
    icon: '💰',
    color: '#FEF3C7',
    text: '#92400E',
    title: 'Calculadoras de impuestos',
    description: 'Calcula el IVA de cualquier precio y otros impuestos habituales en España, con el desglose completo.',
  },
  {
    slug: 'laboral',
    label: 'Trabajo y nómina',
    short: 'Trabajo',
    icon: '👔',
    color: '#F0FDF4',
    text: '#166534',
    title: 'Calculadoras de trabajo y nómina',
    description: 'Del salario bruto al neto, finiquitos y conceptos laborales explicados paso a paso.',
  },
  {
    slug: 'financiera',
    label: 'Finanzas',
    short: 'Finanzas',
    icon: '🏦',
    color: '#EFF6FF',
    text: '#1E40AF',
    title: 'Calculadoras financieras',
    description: 'Hipotecas, préstamos personales y objetivos de ahorro con interés compuesto.',
  },
  {
    slug: 'matematica',
    label: 'Matemáticas',
    short: 'Matemáticas',
    icon: '📐',
    color: '#F5F3FF',
    text: '#5B21B6',
    title: 'Calculadoras de matemáticas',
    description: 'Porcentajes, variaciones y cálculos con fechas, con la fórmula siempre a la vista.',
  },
  {
    slug: 'salud',
    label: 'Salud',
    short: 'Salud',
    icon: '❤️',
    color: '#FFF1F2',
    text: '#9F1239',
    title: 'Calculadoras de salud',
    description: 'Indicadores de referencia como el índice de masa corporal, con los rangos de la OMS.',
  },
  {
    slug: 'viaje',
    label: 'Viajes y día a día',
    short: 'Viajes',
    icon: '🚗',
    color: '#ECFDF5',
    text: '#065F46',
    title: 'Calculadoras de viajes y día a día',
    description: 'Coste de un viaje en coche, reparto de cuentas y otros cálculos cotidianos.',
  },
];

const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));

// Páginas informativas/legales que aparecen en el footer.
const INFO_PAGES = [
  { slug: 'sobre-calcya', title: 'Sobre CalcYa', navLabel: 'Sobre nosotros' },
  { slug: 'contacto', title: 'Contacto', navLabel: 'Contacto' },
  { slug: 'privacidad', title: 'Política de privacidad', navLabel: 'Privacidad' },
];

module.exports = { SITE, SERVICES, CATEGORIES, CATEGORY_BY_SLUG, INFO_PAGES };
