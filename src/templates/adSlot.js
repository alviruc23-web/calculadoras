/* ============================================================
   Hueco de anuncio, independiente del proveedor.

   Devuelve '' mientras SERVICES.adsEnabled sea false (por defecto):
   cero HTML, cero espacio reservado, cero diferencia en el build de
   hoy. El día que se apruebe AdSense, cambiar ese único valor activa
   los huecos ya maquetados — sin tocar ninguna plantilla, sin añadir
   dependencias.

   Reglas de colocación (ver CLAUDE del PR): nunca antes de la
   calculadora ni pegado al botón de calcular/copiar; siempre con
   alto mínimo reservado para no producir CLS al cargar el anuncio
   real; siempre con la etiqueta "Publicidad"/"Advertisement" visible,
   para que nunca se pueda confundir con contenido o navegación propia.
   ============================================================ */
const { SERVICES } = require('../data/site');

const LABEL = { es: 'Publicidad', en: 'Advertisement' };

// minHeight por posición: evita que el layout salte cuando el anuncio
// real sustituya al hueco (causa habitual de mal CLS con AdSense).
const MIN_HEIGHT = { content: 100, sidebar: 250 };

function renderAdSlot(position, locale) {
  if (!SERVICES.adsEnabled) return '';
  const minHeight = MIN_HEIGHT[position] || MIN_HEIGHT.content;
  const label = LABEL[locale] || LABEL.es;
  return `
    <div class="ad-slot ad-slot-${position}" style="min-height:${minHeight}px" data-ad-position="${position}">
      <span class="ad-slot-label">${label}</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${SERVICES.adsenseClient}" data-ad-slot="" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>`;
}

module.exports = { renderAdSlot };
