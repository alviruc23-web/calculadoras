/* ============================================================
   CalcYa — pruebas de extremo a extremo (navegador real).

   Comprueba, contra el HTML ya generado (`node build.js`), que las
   11 calculadoras funcionan de verdad en un navegador: cálculo,
   copiar, restablecer, el buscador y el gating de consentimiento.
   También recorre TODAS las páginas comprobando que no haya errores
   de consola, overflow horizontal ni JSON-LD inválido.

   Requiere que exista un servidor estático sirviendo el sitio en
   BASE_URL (por defecto http://localhost:8123/) y el paquete
   `playwright` (devDependency, solo usado en CI/local, nunca en el
   sitio en producción). Se ejecuta con: node test/e2e.js
   ============================================================ */
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8123/';
const EXEC_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH; // opcional, para entornos con Chromium preinstalado

const CASES = [
  { path: 'iva/', field: 'iva-precio', value: '100', expectMain: /121,00\s*€/ },
  { path: 'finiquito/', field: 'finiquito-salario', value: '1800', extra: async p => { await p.fill('#finiquito-dias', '15'); await p.fill('#finiquito-vacaciones', '8'); }, expectMain: /1\.?380,00\s*€/ },
  { path: 'nomina/', field: 'nomina-bruto', value: '28000', expectMain: /€/ },
  { path: 'hipoteca/', field: 'hipoteca-capital', value: '150000', expectMain: /711,3\d\s*€/ },
  { path: 'prestamo/', field: 'prestamo-capital', value: '10000', expectMain: /244,1\d\s*€/ },
  { path: 'ahorro/', field: 'ahorro-objetivo', value: '20000', expectMain: /309,\d\d\s*€/ },
  { path: 'porcentaje/', field: 'porcentaje-a', value: '20', extra: async p => { await p.fill('#porcentaje-b', '150'); }, expectMain: /30,00/ },
  { path: 'dias/', field: 'dias-inicio', value: '2026-01-01', extra: async p => { await p.fill('#dias-fin', '2026-01-31'); }, expectMain: /30\s*días/, noEnter: true },
  { path: 'imc/', field: 'imc-peso', value: '70', extra: async p => { await p.fill('#imc-altura', '170'); }, expectMain: /24,2/ },
  { path: 'propina/', field: 'propina-cuenta', value: '60', expectMain: /33,00\s*€/ },
  { path: 'combustible/', field: 'combustible-km', value: '500', expectMain: /57,75\s*€/ },
];

const ALL_PAGES = ['', 'iva/', 'finiquito/', 'nomina/', 'hipoteca/', 'prestamo/', 'ahorro/', 'porcentaje/', 'dias/', 'imc/', 'propina/', 'combustible/',
  'categoria/fiscal/', 'categoria/laboral/', 'categoria/financiera/', 'categoria/matematica/', 'categoria/salud/', 'categoria/viaje/',
  'sobre-calcya/', 'contacto/', 'privacidad/'];

(async () => {
  const browser = await chromium.launch(EXEC_PATH ? { executablePath: EXEC_PATH } : {});
  let failures = 0;
  const fail = (msg) => { failures++; console.error('  ✗ ' + msg); };
  const ok = (msg) => console.log('  ✓ ' + msg);

  // ---- 1) interactivo: las 11 calculadoras ----
  for (const c of CASES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(BASE + c.path, { waitUntil: 'domcontentloaded' });
    await page.click('.btn-cookie-reject').catch(() => {});

    await page.fill('#' + c.field, c.value);
    if (c.extra) await c.extra(page);
    if (c.noEnter) await page.click('.btn-primary');
    else await page.locator('#' + c.field).press('Enter');
    await page.waitForTimeout(150);

    const mainText = await page.locator('.result-value').first().innerText().catch(() => '');
    const matched = c.expectMain.test(mainText);
    if (!matched) fail(`${c.path}: resultado inesperado "${mainText}" (esperaba ${c.expectMain})`);

    const copyBtn = page.locator('[data-copy]');
    if (await copyBtn.count()) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      const copyOk = (await page.locator('.btn-copy.is-done').count()) > 0;
      if (!copyOk) fail(`${c.path}: el botón copiar no confirma la copia`);
    }

    await page.click('[data-reset]');
    await page.waitForTimeout(100);
    const resetOk = (await page.locator('.result-empty').count()) > 0;
    if (!resetOk) fail(`${c.path}: restablecer no vuelve al estado vacío`);

    const realErrors = errors.filter(e => !/ResizeObserver/.test(e));
    if (realErrors.length) fail(`${c.path}: errores de consola: ${realErrors.join(' | ')}`);
    else if (matched) ok(`${c.path} calcula, copia y restablece correctamente`);

    await ctx.close();
  }

  // ---- 2) caso de error real (división entre cero) ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + 'porcentaje/', { waitUntil: 'domcontentloaded' });
    await page.click('.btn-cookie-reject').catch(() => {});
    await page.click('button[data-value="variacion"]');
    await page.fill('#porcentaje-a', '0');
    await page.fill('#porcentaje-b', '50');
    await page.locator('#porcentaje-b').press('Enter');
    await page.waitForTimeout(150);
    const hasError = (await page.locator('.result-error').count()) > 0;
    if (!hasError) fail('porcentaje: variación desde 0 no muestra error');
    else ok('porcentaje: variación desde 0 muestra error, no un resultado falso');
    await ctx.close();
  }

  // ---- 3) buscador: tolera errata, navega por teclado y clic ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.click('.btn-cookie-reject').catch(() => {});
    await page.fill('#hdr-search-input', 'hipoteka');
    await page.waitForTimeout(150);
    const results = await page.locator('.hdr-result-name').allInnerTexts();
    const foundHipoteca = results.some(t => /hipoteca/i.test(t));
    if (!foundHipoteca) fail(`buscador: "hipoteka" no sugiere "hipoteca" (${results.join(' | ')})`);
    else ok('buscador tolera errata ("hipoteka" -> hipoteca)');

    await page.fill('#hdr-search-input', 'imc');
    await page.waitForTimeout(150);
    if (await page.locator('.hdr-result').count()) {
      await page.locator('.hdr-result').first().click();
      await page.waitForLoadState('domcontentloaded');
      if (!page.url().includes('/imc/')) fail('buscador: clic en sugerencia no navega a la URL esperada');
      else ok('buscador: clic en sugerencia navega correctamente');
    } else fail('buscador: "imc" no da ningún resultado');
    await ctx.close();
  }

  // ---- 4) consentimiento: nada de GA/AdSense antes de aceptar, sí después ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const requests = [];
    page.on('request', r => requests.push(r.url()));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    const beforeHasGA = requests.some(u => u.includes('googletagmanager') || u.includes('googlesyndication'));
    if (beforeHasGA) fail('consentimiento: GA/AdSense se solicitan ANTES de aceptar');
    else ok('consentimiento: nada de GA/AdSense antes de aceptar');

    await page.click('.btn-cookie-accept');
    await page.waitForTimeout(300);
    const scriptSrcs = await page.evaluate(() => Array.from(document.querySelectorAll('script[src]')).map(s => s.src));
    const afterHasGA = scriptSrcs.some(u => u.includes('googletagmanager'));
    const afterHasAds = scriptSrcs.some(u => u.includes('googlesyndication'));
    if (!afterHasGA || !afterHasAds) fail(`consentimiento: tras aceptar no se insertan los scripts (GA=${afterHasGA} Ads=${afterHasAds})`);
    else ok('consentimiento: GA y AdSense se insertan tras aceptar');
    await ctx.close();
  }

  // ---- 5) todas las páginas: consola, overflow horizontal, JSON-LD ----
  for (const p of ALL_PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    if (!resp || resp.status() !== 200) fail(`${p || 'home'}: status ${resp && resp.status()}`);

    let overflow = false;
    for (const w of [375, 820, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(30);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov !== 0) overflow = true;
    }
    if (overflow) fail(`${p || 'home'}: overflow horizontal`);

    const jsonldOk = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      try { blocks.forEach(b => JSON.parse(b.textContent)); return true; } catch (e) { return false; }
    });
    if (!jsonldOk) fail(`${p || 'home'}: JSON-LD inválido`);

    if (errs.length) fail(`${p || 'home'}: errores de consola: ${errs.join(' | ')}`);
    if (!overflow && jsonldOk && !errs.length) ok(`${p || 'home'}: sin errores, sin overflow, JSON-LD válido`);
    await ctx.close();
  }

  await browser.close();
  console.log(failures === 0 ? '\nE2E: TODO OK' : `\nE2E: ${failures} FALLO(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
