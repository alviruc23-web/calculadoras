/* ============================================================
   Tests de la matemática de las calculadoras.
   Se ejecutan con el runner nativo de Node: `npm test`.
   No requieren ninguna dependencia externa.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');

const E = require('../assets/js/calc-engine.js');
const compute = (id, v) => E.compute(id, v);

// Extrae el número de una cadena formateada en español ("1.234,56 €" -> 1234.56)
function parseES(str) {
  const m = String(str).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(m);
}
const near = (a, b, tol = 0.02) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

/* ---------------------------------------------------------------- IVA */

test('IVA: añadir 21 % a 100 € da 121 €', () => {
  const r = compute('iva', { precio: '100', tipo: '21', modo: 'anadir' });
  near(parseES(r.main.value), 121);
});

test('IVA: quitar el 21 % de 121 € devuelve la base de 100 €', () => {
  const r = compute('iva', { precio: '121', tipo: '21', modo: 'quitar' });
  near(parseES(r.main.value), 100);
});

test('IVA: quitar IVA es la operación inversa de añadirlo', () => {
  for (const tipo of ['4', '10', '21']) {
    const add = compute('iva', { precio: '250', tipo, modo: 'anadir' });
    const total = parseES(add.rows.find(r => r.k.startsWith('Total')).v);
    const back = compute('iva', { precio: String(total), tipo, modo: 'quitar' });
    near(parseES(back.main.value), 250, 0.05);
  }
});

test('IVA: un precio vacío pide datos en vez de calcular 0', () => {
  assert.equal(compute('iva', { precio: '', tipo: '21' }).empty, true);
});

test('IVA: un precio negativo devuelve error, no un resultado absurdo', () => {
  assert.ok(compute('iva', { precio: '-50', tipo: '21' }).error);
});

test('IVA: un precio de 0 se calcula (0 no es "vacío")', () => {
  const r = compute('iva', { precio: '0', tipo: '21', modo: 'anadir' });
  assert.ok(!r.empty && !r.error);
  near(parseES(r.main.value), 0);
});

/* ---------------------------------------------------------- PORCENTAJE */

test('Porcentaje: el 20 % de 150 es 30', () => {
  const r = compute('porcentaje', { modo: 'pct_de', a: '20', b: '150' });
  near(parseES(r.main.value), 30);
});

test('Porcentaje: 30 sobre 150 es el 20 %', () => {
  const r = compute('porcentaje', { modo: 'que_pct', a: '30', b: '150' });
  near(parseES(r.main.value), 20);
});

test('Porcentaje: de 100 a 125 es un aumento del 25 %', () => {
  const r = compute('porcentaje', { modo: 'variacion', a: '100', b: '125' });
  near(parseES(r.main.value), 25);
});

test('Porcentaje: de 100 a 75 es un descenso del 25 %', () => {
  const r = compute('porcentaje', { modo: 'variacion', a: '100', b: '75' });
  near(parseES(r.main.value), -25);
});

test('Porcentaje: variación partiendo de 0 da error en vez de 0 %', () => {
  // Antes devolvía "0 %", que es matemáticamente falso.
  assert.ok(compute('porcentaje', { modo: 'variacion', a: '0', b: '50' }).error);
});

test('Porcentaje: "qué % es" sobre un total de 0 da error, no Infinity', () => {
  const r = compute('porcentaje', { modo: 'que_pct', a: '5', b: '0' });
  assert.ok(r.error);
});

test('Porcentaje: valores desorbitados dan error en vez de un resultado ilegible', () => {
  // Antes mostraba una etiqueta con cientos de dígitos y un valor "—".
  const r = compute('porcentaje', { modo: 'pct_de', a: '1e308', b: '1e308' });
  assert.ok(r.error);
});

/* ------------------------------------------------------------ HIPOTECA */

test('Hipoteca: cuota conocida (150.000 €, 25 años, 3 %)', () => {
  const r = compute('hipoteca', { capital: '150000', anios: '25', interes: '3' });
  near(parseES(r.main.value), 711.32, 0.5);
});

test('Hipoteca: la barra capital/intereses suma 100 % y refleja los importes', () => {
  const r = compute('hipoteca', { capital: '150000', anios: '25', interes: '3' });
  assert.ok(Array.isArray(r.bar) && r.bar.length === 2);
  const suma = r.bar.reduce((s, seg) => s + seg.pct, 0);
  near(suma, 100, 0.01);
  const capitalSeg = r.bar.find(s => s.cls === 'principal');
  near(capitalSeg.value, 150000, 0.01);
});

test('Hipoteca: al 0 % de interés no hay barra de intereses con valor negativo', () => {
  const r = compute('hipoteca', { capital: '120000', anios: '10', interes: '0' });
  const interestSeg = r.bar.find(s => s.cls === 'interest');
  assert.ok(interestSeg.value >= -0.01);
});

test('Hipoteca: al 0 % la cuota es capital / número de meses', () => {
  const r = compute('hipoteca', { capital: '120000', anios: '10', interes: '0' });
  near(parseES(r.main.value), 1000);
});

test('Hipoteca: los intereses crecen con el tipo', () => {
  const bajo = compute('hipoteca', { capital: '200000', anios: '30', interes: '2' });
  const alto = compute('hipoteca', { capital: '200000', anios: '30', interes: '5' });
  assert.ok(parseES(alto.main.value) > parseES(bajo.main.value));
});

test('Hipoteca: capital 0 devuelve error en vez de NaN', () => {
  assert.ok(compute('hipoteca', { capital: '0', anios: '25', interes: '3' }).error);
});

test('Hipoteca: un plazo de 0 años da error (antes se convertía en 25)', () => {
  assert.ok(compute('hipoteca', { capital: '100000', anios: '0', interes: '3' }).error);
});

test('Hipoteca: un tipo de interés irreal da error, no una cuota absurda', () => {
  assert.ok(compute('hipoteca', { capital: '100000', anios: '25', interes: '999' }).error);
});

/* ------------------------------------------------------------ PRÉSTAMO */

test('Préstamo: 10.000 € al 8 % en 48 meses', () => {
  const r = compute('prestamo', { capital: '10000', tin: '8', meses: '48' });
  near(parseES(r.main.value), 244.13, 0.5);
});

test('Préstamo: el total devuelto siempre supera al capital con TIN > 0', () => {
  const r = compute('prestamo', { capital: '5000', tin: '6', meses: '24' });
  const total = parseES(r.rows.find(x => x.k === 'Total a devolver').v);
  assert.ok(total > 5000);
});

test('Préstamo: un TIN irreal da error', () => {
  assert.ok(compute('prestamo', { capital: '5000', tin: '999', meses: '24' }).error);
});

/* -------------------------------------------------------------- AHORRO */

test('Ahorro: sin rentabilidad, la aportación es el objetivo repartido', () => {
  const r = compute('ahorro', { objetivo: '12000', inicial: '0', anios: '1', rentabilidad: '0' });
  near(parseES(r.main.value), 1000);
});

test('Ahorro: si el ahorro actual ya supera el objetivo, la cuota es 0 (no negativa)', () => {
  // Caso que antes producía una aportación mensual NEGATIVA.
  const r = compute('ahorro', { objetivo: '20000', inicial: '19000', anios: '40', rentabilidad: '7' });
  near(parseES(r.main.value), 0);
  assert.ok(!r.error);
});

test('Ahorro: la aportación necesaria nunca es negativa', () => {
  for (const inicial of ['0', '5000', '15000', '19999', '25000']) {
    const r = compute('ahorro', { objetivo: '20000', inicial, anios: '10', rentabilidad: '5' });
    if (r.main) assert.ok(parseES(r.main.value) >= 0, `inicial=${inicial}`);
  }
});

test('Ahorro: con rentabilidad se aporta menos que sin ella', () => {
  const sin = compute('ahorro', { objetivo: '30000', inicial: '0', anios: '10', rentabilidad: '0' });
  const con = compute('ahorro', { objetivo: '30000', inicial: '0', anios: '10', rentabilidad: '6' });
  assert.ok(parseES(con.main.value) < parseES(sin.main.value));
});

test('Ahorro: una rentabilidad irreal da error', () => {
  assert.ok(compute('ahorro', { objetivo: '30000', inicial: '0', anios: '10', rentabilidad: '999' }).error);
});

/* ---------------------------------------------------------------- DÍAS */

test('Días: enero de 2026 tiene 30 días del 1 al 31', () => {
  const r = compute('dias', { inicio: '2026-01-01', fin: '2026-01-31' });
  near(parseES(r.main.value), 30, 0);
});

test('Días: una semana completa tiene 5 laborables', () => {
  const r = compute('dias', { inicio: '2026-01-05', fin: '2026-01-12', soloLaborables: true });
  near(parseES(r.main.value), 5, 0);
});

test('Días: el orden de las fechas no altera el resultado', () => {
  const a = compute('dias', { inicio: '2026-03-01', fin: '2026-03-20' });
  const b = compute('dias', { inicio: '2026-03-20', fin: '2026-03-01' });
  assert.equal(a.main.value, b.main.value);
});

test('Días: la misma fecha da 0 días', () => {
  const r = compute('dias', { inicio: '2026-05-10', fin: '2026-05-10' });
  near(parseES(r.main.value), 0, 0);
});

test('Días: los laborables no dependen del huso horario del visitante', () => {
  // El cálculo se hace en UTC; antes mezclaba UTC y hora local y el
  // recuento se desplazaba un día en husos negativos.
  const original = process.env.TZ;
  const results = [];
  for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Europe/Madrid']) {
    process.env.TZ = tz;
    results.push(compute('dias', { inicio: '2026-02-02', fin: '2026-02-27', soloLaborables: true }).main.value);
  }
  process.env.TZ = original;
  assert.equal(new Set(results).size, 1, 'el resultado varía según el huso: ' + results.join(' / '));
});

test('Días: una fecha inválida no rompe el cálculo', () => {
  assert.equal(compute('dias', { inicio: '2026-02-31', fin: '2026-03-01' }).empty, true);
});

test('Días: naturales = laborables + fines de semana', () => {
  const r = compute('dias', { inicio: '2026-01-01', fin: '2026-12-31' });
  const nat = parseES(r.rows.find(x => x.k === 'Días naturales').v);
  const lab = parseES(r.rows.find(x => x.k.startsWith('Días laborables')).v);
  const fin = parseES(r.rows.find(x => x.k === 'Fines de semana').v);
  assert.equal(lab + fin, nat);
});

/* ----------------------------------------------------------------- IMC */

test('IMC: 70 kg y 170 cm dan 24,2 (peso normal)', () => {
  const r = compute('imc', { peso: '70', altura: '170' });
  near(parseES(r.main.value), 24.2, 0.05);
  assert.match(r.rows[0].v, /normal/i);
});

test('IMC: clasifica correctamente cada categoría de la OMS', () => {
  const casos = [
    { peso: '45', altura: '175', esperado: /bajo peso/i },
    { peso: '70', altura: '175', esperado: /normal/i },
    { peso: '85', altura: '175', esperado: /sobrepeso/i },
    { peso: '100', altura: '175', esperado: /grado i$/i },
  ];
  for (const c of casos) {
    const r = compute('imc', { peso: c.peso, altura: c.altura });
    assert.match(r.rows[0].v, c.esperado, `${c.peso}kg/${c.altura}cm`);
  }
});

test('IMC: altura en metros por error se detecta y avisa', () => {
  assert.ok(compute('imc', { peso: '70', altura: '1.7' }).error);
});

test('IMC: altura 0 da error en vez de Infinity', () => {
  assert.ok(compute('imc', { peso: '70', altura: '0' }).error);
});

test('IMC: un peso irreal (fuera de rango humano) da error', () => {
  assert.ok(compute('imc', { peso: '1e15', altura: '170' }).error);
});

/* ------------------------------------------------------------- PROPINA */

test('Propina: 60 € con 10 % entre 2 personas son 33 € cada uno', () => {
  const r = compute('propina', { cuenta: '60', porcentaje: '10', personas: '2' });
  near(parseES(r.main.value), 33);
});

test('Propina: 0 personas da error en vez de dividir por cero', () => {
  assert.ok(compute('propina', { cuenta: '60', porcentaje: '10', personas: '0' }).error);
});

test('Propina: con 0 % el total coincide con la cuenta', () => {
  const r = compute('propina', { cuenta: '80', porcentaje: '0', personas: '4' });
  near(parseES(r.main.value), 20);
});

test('Propina: un número irreal de personas da error, no un reparto absurdo', () => {
  assert.ok(compute('propina', { cuenta: '60', porcentaje: '10', personas: '1e15' }).error);
});

/* --------------------------------------------------------- COMBUSTIBLE */

test('Combustible: 500 km, 7 l/100 km y 1,65 €/l cuestan 57,75 €', () => {
  const r = compute('combustible', { km: '500', consumo: '7', precio: '1.65', personas: '1' });
  near(parseES(r.main.value), 57.75);
});

test('Combustible: consumo 0 da error en vez de un viaje gratis', () => {
  assert.ok(compute('combustible', { km: '500', consumo: '0', precio: '1.65' }).error);
});

test('Combustible: compartir gastos divide el coste de ida y vuelta', () => {
  const r = compute('combustible', { km: '100', consumo: '8', precio: '1.5', personas: '4' });
  const porPersona = parseES(r.rows.find(x => x.k.startsWith('Por persona')).v);
  near(porPersona, (100 * 8 / 100 * 1.5 * 2) / 4);
});

test('Combustible: un número irreal de personas da error', () => {
  assert.ok(compute('combustible', { km: '500', consumo: '7', precio: '1.65', personas: '1e15' }).error);
});

/* ------------------------------------------------------- RETENCIÓN FACTURA */

test('Retención factura: 1.000 € de base, IVA 21 % y retención 15 % dan 1.060 €', () => {
  const r = compute('retencion-factura', { base: '1000', ivaTipo: '21', retencion: '15' });
  near(parseES(r.main.value), 1060);
  near(parseES(r.rows.find(x => x.k.startsWith('IVA')).v), 210);
  near(parseES(r.rows.find(x => x.k.startsWith('Retención')).v), 150);
});

test('Retención factura: una base de 0 € es un resultado válido, no un error', () => {
  const r = compute('retencion-factura', { base: '0', ivaTipo: '21', retencion: '15' });
  assert.ok(!r.error && !r.empty);
  near(parseES(r.main.value), 0);
});

test('Retención factura: decimales redondean a céntimos en cada línea', () => {
  const r = compute('retencion-factura', { base: '123.45', ivaTipo: '10', retencion: '15' });
  near(parseES(r.rows.find(x => x.k.startsWith('IVA')).v), 12.35);
  near(parseES(r.rows.find(x => x.k.startsWith('Retención')).v), 18.52);
  near(parseES(r.main.value), 117.28);
});

test('Retención factura: IVA 0 % no añade impuesto, la retención sigue aplicando', () => {
  const r = compute('retencion-factura', { base: '500', ivaTipo: '0', retencion: '15' });
  near(parseES(r.rows.find(x => x.k.startsWith('IVA')).v), 0);
  near(parseES(r.main.value), 425);
});

test('Retención factura: sin retención (particular) no aparece la fila de retención', () => {
  const r = compute('retencion-factura', { base: '800', ivaTipo: '21', retencion: '0' });
  assert.ok(!r.rows.some(x => x.k.startsWith('Retención')));
  near(parseES(r.main.value), 968);
});

test('Retención factura: los tres supuestos de retención (0/7/15 %) dan totales distintos', () => {
  const base = '1000', ivaTipo = '21';
  near(parseES(compute('retencion-factura', { base, ivaTipo, retencion: '0' }).main.value), 1210);
  near(parseES(compute('retencion-factura', { base, ivaTipo, retencion: '7' }).main.value), 1140);
  near(parseES(compute('retencion-factura', { base, ivaTipo, retencion: '15' }).main.value), 1060);
});

test('Retención factura: entrada inválida (vacía, negativa o irreal) no calcula un resultado', () => {
  assert.ok(compute('retencion-factura', { base: '', ivaTipo: '21', retencion: '15' }).empty);
  assert.ok(compute('retencion-factura', { base: '-100', ivaTipo: '21', retencion: '15' }).error);
  assert.ok(compute('retencion-factura', { base: '1e13', ivaTipo: '21', retencion: '15' }).error);
});

test('Retención factura: redondeo a céntimos no arrastra error en el total', () => {
  const r = compute('retencion-factura', { base: '33.33', ivaTipo: '21', retencion: '15' });
  near(parseES(r.main.value), 35.33);
});

/* ------------------------------------------------------------ FINIQUITO */

test('Finiquito: 1.800 €, 15 días y 8 de vacaciones dan 1.380 € brutos', () => {
  const r = compute('finiquito', { salario: '1800', dias: '15', vacaciones: '8', preaviso: '0' });
  near(parseES(r.main.value), 1380);
});

test('Finiquito: sin días ni vacaciones el importe es 0', () => {
  const r = compute('finiquito', { salario: '2000', dias: '0', vacaciones: '0', preaviso: '0' });
  near(parseES(r.main.value), 0);
});

test('Finiquito: más de 31 días trabajados en un mes da error', () => {
  assert.ok(compute('finiquito', { salario: '2000', dias: '45' }).error);
});

test('Finiquito: unas vacaciones pendientes irreales dan error, no un importe absurdo', () => {
  assert.ok(compute('finiquito', { salario: '2000', dias: '10', vacaciones: '1e10', preaviso: '0' }).error);
});

test('Finiquito: un preaviso irreal da error', () => {
  assert.ok(compute('finiquito', { salario: '2000', dias: '10', vacaciones: '0', preaviso: '99999' }).error);
});

/* --------------------------------------------------------------- NÓMINA */

test('Nómina: el IRPF es progresivo, no un tipo plano por tramo', () => {
  // Con el cálculo plano anterior, 28.000 € tributaban al 30 % (~8.400 €).
  // Con escala progresiva y mínimo personal la retención real es mucho menor.
  const r = compute('nomina', { bruto: '28000', pagas: '14', hijos: '0' });
  const irpfRow = r.rows.find(x => x.k.startsWith('Retención IRPF'));
  const irpf = parseES(irpfRow.v);
  assert.ok(irpf > 0 && irpf < 28000 * 0.22, `retención inesperada: ${irpf}`);
});

test('Nómina: el neto siempre es menor que el bruto y positivo', () => {
  for (const bruto of ['12000', '20000', '35000', '60000', '120000']) {
    const r = compute('nomina', { bruto, pagas: '14', hijos: '0' });
    const neto = parseES(r.rows.find(x => x.k === 'Neto anual').v);
    assert.ok(neto > 0 && neto < Number(bruto), `bruto=${bruto} neto=${neto}`);
  }
});

test('Nómina: a mayor bruto, mayor tipo efectivo (progresividad)', () => {
  const tipoDe = (bruto) => {
    const r = compute('nomina', { bruto, pagas: '14', hijos: '0' });
    return parseES(r.rows.find(x => x.k.startsWith('Retención IRPF')).v) / Number(bruto);
  };
  assert.ok(tipoDe('20000') < tipoDe('40000'));
  assert.ok(tipoDe('40000') < tipoDe('90000'));
});

test('Nómina: los hijos a cargo reducen la retención', () => {
  const sin = compute('nomina', { bruto: '35000', pagas: '14', hijos: '0' });
  const con = compute('nomina', { bruto: '35000', pagas: '14', hijos: '2' });
  const irpfSin = parseES(sin.rows.find(x => x.k.startsWith('Retención IRPF')).v);
  const irpfCon = parseES(con.rows.find(x => x.k.startsWith('Retención IRPF')).v);
  assert.ok(irpfCon < irpfSin);
});

test('Nómina: un salario bajo no genera retención de IRPF', () => {
  const r = compute('nomina', { bruto: '14000', pagas: '14', hijos: '0' });
  const irpf = parseES(r.rows.find(x => x.k.startsWith('Retención IRPF')).v);
  near(irpf, 0, 1);
});

test('Nómina: 12 y 14 pagas dan el mismo neto anual', () => {
  const a = compute('nomina', { bruto: '30000', pagas: '12', hijos: '0' });
  const b = compute('nomina', { bruto: '30000', pagas: '14', hijos: '0' });
  const netoA = parseES(a.rows.find(x => x.k === 'Neto anual').v);
  const netoB = parseES(b.rows.find(x => x.k === 'Neto anual').v);
  near(netoA, netoB, 0.5);
});

/* --------------------------------------------------- ROBUSTEZ GENERAL */

test('Ninguna calculadora devuelve NaN, Infinity o undefined con entradas extremas', () => {
  const entradas = ['', '0', '-1', '0.0001', '999999999999', 'abc', '1e308'];
  const ids = Object.keys(E.CALC_SPECS);
  for (const id of ids) {
    const spec = E.CALC_SPECS[id];
    for (const raw of entradas) {
      const v = {};
      for (const f of spec.fields) {
        v[f.id] = f.type === 'checkbox' ? false : (f.type === 'date' ? '2026-01-15' : raw);
      }
      const r = spec.compute(v);
      assert.ok(r && typeof r === 'object', `${id} no devolvió objeto`);
      // "bar":null es un valor legítimo (sin barra que dibujar), no un bug.
      const texto = JSON.stringify(r).replace(/"bar":null,?/, '');
      assert.ok(!/NaN|Infinity|undefined|null,/.test(texto), `${id} con "${raw}" produjo: ${texto.slice(0, 200)}`);
    }
  }
});

test('Toda calculadora con campos vacíos pide datos en lugar de calcular', () => {
  for (const id of Object.keys(E.CALC_SPECS)) {
    const spec = E.CALC_SPECS[id];
    const v = {};
    for (const f of spec.fields) v[f.id] = f.type === 'checkbox' ? false : '';
    const r = spec.compute(v);
    assert.ok(r.empty || r.error, `${id} calculó algo con todo vacío`);
  }
});

test('splitBar: reparte proporcionalmente y suma 100 %', () => {
  const bar = E.splitBar([{ label: 'A', value: 30, cls: 'principal' }, { label: 'B', value: 70, cls: 'interest' }]);
  assert.equal(bar.length, 2);
  near(bar[0].pct, 30);
  near(bar[1].pct, 70);
});

test('splitBar: con total 0 o negativo no devuelve barra (evita 0/0)', () => {
  assert.equal(E.splitBar([{ label: 'A', value: 0, cls: 'x' }, { label: 'B', value: 0, cls: 'y' }]), null);
  assert.equal(E.splitBar([{ label: 'A', value: -5, cls: 'x' }]), null);
});

test('Cada especificación está bien formada', () => {
  for (const [id, spec] of Object.entries(E.CALC_SPECS)) {
    assert.ok(Array.isArray(spec.fields) && spec.fields.length, `${id} sin campos`);
    assert.equal(typeof spec.compute, 'function', `${id} sin compute`);
    assert.ok(spec.submitLabel, `${id} sin submitLabel`);
    const ids = spec.fields.map(f => f.id);
    assert.equal(new Set(ids).size, ids.length, `${id} tiene ids de campo repetidos`);
    for (const f of spec.fields) {
      assert.ok(f.label, `${id}.${f.id} sin label`);
      if (f.type === 'segment' || f.type === 'select') {
        assert.ok(f.options && f.options.length, `${id}.${f.id} sin opciones`);
      }
    }
  }
});
