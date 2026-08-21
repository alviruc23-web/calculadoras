# calculadoras (CalcYa)

Calculadoras gratis para España: IVA, finiquito, nómina, hipoteca y más.

Sitio estático multipágina (HTML/CSS/JS sin frameworks) desplegado en GitHub Pages:
https://alviruc23-web.github.io/calculadoras/

## Estructura

```
src/data/          contenido único: las 11 calculadoras y config del sitio
src/templates/      layout compartido (header/footer), home y página de calculadora
assets/css/         hoja de estilos compartida por todas las páginas
assets/js/          motor de cálculo cliente + búsqueda/filtro de la home
build.js            genera index.html + una carpeta por calculadora (salida estática)
```

Cada calculadora (`iva`, `finiquito`, `nomina`, `hipoteca`, `prestamo`, `ahorro`,
`porcentaje`, `dias`, `imc`, `propina`, `combustible`) vive en su propia carpeta
(`/iva/`, `/finiquito/`…) con `<title>`, meta description y contenido (FAQ) propios.

## Editar contenido

- Cambiar nombre, descripción, FAQ o afiliados de una calculadora → `src/data/calculators.js`
- Cambiar nombre del sitio, categorías o agrupación del footer → `src/data/site.js`
- Cambiar el header, el footer o el `<head>` de todas las páginas → `src/templates/layout.js`
- Cambiar estilos globales → `assets/css/main.css`
- Cambiar la lógica de cálculo de una calculadora → `assets/js/calculators.js`

Después de editar cualquier fichero de `src/`, regenera las páginas:

```
npm run build
```

Esto sobrescribe `index.html` y las carpetas `/<id>/` en la raíz del repo, que es
lo que sirve GitHub Pages. Los ficheros de `assets/` no se generan: se editan
directamente y se sirven tal cual.
