/* ============================================================
   Textos de interfaz compartidos entre plantillas (layout, home,
   categoría, calculadora). Un único punto de verdad por idioma en
   vez de repetir el mismo literal ("Inicio", "Preguntas frecuentes"…)
   en varios ficheros — hoy algunos de estos literales están
   duplicados de forma independiente hasta 4 veces en el código.

   Las plaquillas {n}/{cat}/{date}/{path} se sustituyen con String.replace
   en el sitio de uso; esto es solo texto, sin lógica.
   ============================================================ */

const UI_STRINGS = {
  es: {
    skipLink: 'Saltar al contenido',
    navAriaLabel: 'Navegación principal',
    navHome: 'Inicio',
    navCategories: 'Categorías',
    searchLabel: 'Buscar una calculadora',
    searchPlaceholderHeader: 'Buscar: IVA, hipoteca, IMC…',
    cookiePrefs: 'Preferencias de cookies',
    footerDisclaimer: 'Los resultados son orientativos; consulta siempre a un profesional para decisiones importantes.',

    breadcrumbAriaLabel: 'Migas de pan',
    breadcrumbHome: 'Inicio',
    backToHome: 'Volver al inicio',

    popularBadge: 'Popular',
    useCalculator: 'Usar calculadora',
    calcCountSingular: 'calculadora',
    calcCountPlural: 'calculadoras',

    heroEyebrow: '{n} calculadoras · gratis · sin registro',
    heroH1: '¿Qué quieres calcular?',
    heroLead: 'Impuestos, nómina, hipoteca, salud y más — con la fórmula y un ejemplo siempre a la vista. Sin publicidad invasiva ni letra pequeña.',
    heroSearchPlaceholder: 'Busca por nombre: IVA, hipoteca, IMC…',
    heroSearchButton: 'Buscar',
    trustBadges: ['Sin registro', 'Cálculo instantáneo', 'Fórmula explicada', 'Funciona en el móvil'],

    recentHeading: 'Continuar donde lo dejaste',
    popularHeading: 'Calculadoras más usadas',
    categoriesHeading: 'Explora por categoría',
    allCalcsHeading: 'Todas las calculadoras',
    filterAriaLabel: 'Filtrar por categoría',
    filterAllLabel: 'Todas',
    filterAllValue: 'todas',
    emptyStateHeading: 'Sin resultados para esa búsqueda',
    emptyStateBody: 'Prueba con otra palabra: «IVA», «hipoteca», «IMC»…',

    otherCategoriesHeading: 'Otras categorías',
    viewAllCategoriesLink: 'Ver todas las categorías',

    sourcePrefix: 'Fuente: ',
    noscriptMessage: 'Esta calculadora necesita JavaScript activado para funcionar.',
    faqHeading: 'Preguntas frecuentes',
    moreCalculatorsPrefix: 'Más calculadoras de ',
    reviewedNote: 'Contenido y fórmulas revisados en {date}.',
    relatedHeading: 'Calculadoras relacionadas',

    recentBadge: 'Reciente',
    recalculateCta: 'Volver a calcular',

    cookieAriaLabel: 'Aviso de cookies',
    cookieBody: 'Usamos cookies propias necesarias para el sitio. Si aceptas, también activamos Google Analytics y Google AdSense, que instalan cookies de medición y publicidad. Puedes cambiar tu decisión cuando quieras desde "Preferencias de cookies" en el pie de página. <a href="{privacyHref}">Más información</a>.',
    cookieReject: 'Rechazar',
    cookieAccept: 'Aceptar',

    homeTitle: 'Calculadoras online gratis — IVA, nómina, hipoteca, IMC y más',
    titleFreeNoSignup: ' — Gratis y sin registro',
    calcDescFree: 'Calculadora gratuita',
    calcDescUpdatedFor: ' y actualizada a ',
    calcDescNoSignupInstant: ', sin registro, resultado inmediato.',
  },

  en: {
    skipLink: 'Skip to content',
    navAriaLabel: 'Main navigation',
    navHome: 'Home',
    navCategories: 'Categories',
    searchLabel: 'Search for a calculator',
    searchPlaceholderHeader: 'Search: VAT, mortgage, BMI…',
    cookiePrefs: 'Cookie preferences',
    footerDisclaimer: 'Results are for guidance only; always consult a professional before making important decisions.',

    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbHome: 'Home',
    backToHome: 'Back to home',

    popularBadge: 'Popular',
    useCalculator: 'Use calculator',
    calcCountSingular: 'calculator',
    calcCountPlural: 'calculators',

    heroEyebrow: '{n} calculators · free · no sign-up',
    heroH1: 'What do you want to calculate?',
    heroLead: 'Spanish taxes, payroll, mortgages, health and more — with the formula and a worked example always in view. No invasive ads, no fine print.',
    heroSearchPlaceholder: 'Search by name: VAT, mortgage, BMI…',
    heroSearchButton: 'Search',
    trustBadges: ['No sign-up', 'Instant results', 'Formula explained', 'Works on mobile'],

    recentHeading: 'Continue where you left off',
    popularHeading: 'Most used calculators',
    categoriesHeading: 'Browse by category',
    allCalcsHeading: 'All calculators',
    filterAriaLabel: 'Filter by category',
    filterAllLabel: 'All',
    filterAllValue: 'all',
    emptyStateHeading: 'No results for that search',
    emptyStateBody: 'Try another word: "VAT", "mortgage", "BMI"…',

    otherCategoriesHeading: 'Other categories',
    viewAllCategoriesLink: 'View all categories',

    sourcePrefix: 'Source: ',
    noscriptMessage: 'This calculator needs JavaScript enabled to work.',
    faqHeading: 'Frequently asked questions',
    moreCalculatorsPrefix: 'More calculators about ',
    reviewedNote: 'Content and formulas reviewed in {date}.',
    relatedHeading: 'Related calculators',

    recentBadge: 'Recent',
    recalculateCta: 'Calculate again',

    cookieAriaLabel: 'Cookie notice',
    cookieBody: 'We use our own cookies required for the site to work. If you accept, we also enable Google Analytics and Google AdSense, which set measurement and advertising cookies. You can change your choice anytime from "Cookie preferences" in the footer. <a href="{privacyHref}">Learn more</a>.',
    cookieReject: 'Reject',
    cookieAccept: 'Accept',

    homeTitle: 'Free Online Calculators — Spanish VAT, Payroll, Mortgage, BMI & More',
    titleFreeNoSignup: ' — Free, No Sign-Up',
    calcDescFree: 'Free calculator',
    calcDescUpdatedFor: ', updated for ',
    calcDescNoSignupInstant: ', no sign-up, instant results.',
  },
};

function t(locale) {
  return UI_STRINGS[locale] || UI_STRINGS.es;
}

module.exports = { UI_STRINGS, t };
