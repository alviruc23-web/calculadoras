# CalcYa

Plataforma de calculadoras online gratuitas para España: IVA, nómina, hipoteca,
IMC y más. Sitio estático (HTML/CSS/JS, sin frameworks) desplegado en GitHub
Pages sobre dominio propio: https://calculadorasfaciles.es

## Arquitectura

```
src/data/
  calculators.js   contenido editorial de cada calculadora (nombre, textos,
                    fórmula, ejemplo, FAQ, relacionadas) — SIN lógica de cálculo
  site.js          dominio, categorías, navegación, servicios (GA/AdSense)

src/templates/      generan el HTML de cada tipo de página (Node, en build)
  layout.js          <head>, header con buscador, footer
  home.js            landing: populares, categorías, todas las calculadoras
  categoryPage.js     /categoria/<slug>/
  calculatorPage.js   /<calculadora>/
  infoPage.js         /sobre-calcya/, /contacto/, /privacidad/

assets/js/           código que corre en el navegador (sin dependencias)
  calc-engine.js      matemática pura de las 11 calculadoras (testeable con Node)
  calc-ui.js           genera el formulario y el resultado de CUALQUIER
                        calculadora a partir de su especificación en
                        calc-engine.js — no hay código específico por calculadora
  search.js            buscador con tolerancia a erratas (índice embebido)
  consent.js            banner de cookies; solo tras aceptar carga Analytics/AdSense

assets/css/main.css  sistema de diseño único para todo el sitio

test/math.test.js    52 pruebas de la matemática (node --test)
build.js             genera todo el HTML estático a partir de lo anterior
```

## Cómo añadir una calculadora nueva

1. Añade su especificación (campos + fórmula) en `assets/js/calc-engine.js`,
   dentro de `CALC_SPECS`. Es solo datos + una función `compute(v)` pura.
2. Añade una prueba en `test/math.test.js` con un caso conocido.
3. Añade su contenido editorial en `src/data/calculators.js` (nombre, textos,
   fórmula visible, ejemplo, FAQ, categoría, relacionadas).
4. `npm run build`.

Con eso, la calculadora aparece automáticamente en su categoría, en la home,
en el sitemap, en el buscador y en el enlazado interno de "relacionadas".
No hay que copiar HTML ni tocar `build.js`.

## Cómo añadir una categoría nueva

Añade un objeto en `CATEGORIES` en `src/data/site.js` (slug, textos, color) y
usa ese `slug` en las calculadoras que pertenezcan a ella. El build genera su
página en `/categoria/<slug>/` sola.

## Comandos

```
npm run build   # genera todo el HTML estático (idempotente)
npm test        # reconstruye y ejecuta las 52 pruebas matemáticas
```

## Monetización y medición

El sitio usa Google Analytics y Google AdSense (Auto ads), ambos declarados en
`src/data/site.js` → `SERVICES`. **Ninguno de los dos se carga hasta que el
usuario acepta el aviso de cookies** (`assets/js/consent.js`): esto es un
requisito de las políticas de AdSense y del RGPD, no una opción de diseño.

## Despliegue

GitHub Pages sirve directamente el contenido generado (no hay paso de build en
CI). Tras cambiar cualquier fichero en `src/` o `assets/`, ejecuta
`npm run build` y commitea también el HTML resultante.
