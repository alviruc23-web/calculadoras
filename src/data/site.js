const SITE = {
  name: 'CalcYa',
  baseUrl: 'https://alviruc23-web.github.io/calculadoras/',
  tagline: 'Calculadoras prácticas para España. Gratis, sin registro y sin datos que recopilar.',
  year: 2026,
};

// Categorías usadas en los chips de filtro de la home.
const CATEGORIES = [
  { cat: 'fiscal', label: '💰 Fiscal' },
  { cat: 'laboral', label: '👔 Laboral' },
  { cat: 'financiera', label: '🏦 Financiero' },
  { cat: 'matematica', label: '📐 Matemática' },
  { cat: 'salud', label: '❤️ Salud' },
  { cat: 'viaje', label: '🚗 Viaje' },
];

// Agrupación de enlaces del footer (mismo criterio que la versión original).
const FOOTER_COLUMNS = [
  { title: 'Calculadoras', ids: ['iva', 'finiquito', 'nomina', 'hipoteca', 'prestamo'] },
  { title: 'Más herramientas', ids: ['porcentaje', 'dias', 'imc', 'ahorro', 'propina', 'combustible'] },
];

module.exports = { SITE, CATEGORIES, FOOTER_COLUMNS };
