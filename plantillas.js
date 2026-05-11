window.addEventListener('load', () => {

mostrarDatos();

});

/* CONTADOR PLANILLAS */

let contadorPlanillas = 0;

/* =========================
   MOSTRAR DATOS
========================= */

async function mostrarDatos(){

const itemsRes =
await fetch(
'http://localhost:3000/items'
);

const ocRes =
await fetch(
'http://localhost:3000/ordenes-cambio'
);

const cmRes =
await fetch(
'http://localhost:3000/contratos-mod'
);

const datos =
await itemsRes.json();

const ordenesCambio =
await ocRes.json();

const contratosMod =
await cmRes.json();

const tabla =
document.getElementById(
'tablaReporte'
);

tabla.innerHTML = '';

datos.forEach(filaData => {
  const ocItem =
ordenesCambio.find(
oc => oc.item_id == filaData.id
) || {};

const cmItem =
contratosMod.find(
cm => cm.item_id == filaData.id
) || {};
const fila =
document.createElement('tr');

fila.classList.add(
'fila-item'
);


fila.innerHTML = `

<td>${filaData.modulo_id || ''}</td>

<td>${filaData.descripcion || ''}</td>

<td>${filaData.unidad || ''}</td>

<!-- CONTRATO ORIGINAL -->

<td>${filaData.cantidad || ''}</td>
<td>${filaData.precio_unitario || ''}</td>
<td>${filaData.total || ''}</td>

<!-- OC -->

<td>${ocItem.cantidad || ''}</td>
<td>${ocItem.precio || ''}</td>
<td>${ocItem.total || ''}</td>
<!-- CM1 -->

<td>${cmItem.cantidad || ''}</td>
<td>${cmItem.precio || ''}</td>
<td>${cmItem.total || ''}</td>

<!-- CM2 -->

<td>${filaData.cm2_cantidad || ''}</td>
<td>${filaData.cm2_pu || ''}</td>
<td>${filaData.cm2_total || ''}</td>

<td>
${filaData.porcentaje_incidencia || 0}%
</td>

<td>

${filaData.imagen
? `<img
src="${filaData.imagen}"
class="mini-img"
onclick="verImagen(
'${filaData.imagen}',
'${filaData.descripcion_imagen || ''}'
)"
>`
: ''
}

</td>

<td>

<div class="acciones">

<button class="edit-btn">
✏️
</button>

<button class="delete-btn">
🗑️
</button>

</div>

</td>

`;

tabla.appendChild(fila);

/* TOTAL MODULO */

const filaTotal =
document.createElement('tr');

filaTotal.classList.add(
'fila-total-modulo'
);

filaTotal.innerHTML = `

<td colspan="5">

<strong>
TOTAL MODULO
</strong>

</td>

<td class="modulo-total">

0.00

</td>

<td colspan="20"></td>

`;

tabla.appendChild(filaTotal);

});

}

/* =========================
   AÑADIR PLANILLA
========================= */

function agregarPlanillaGeneral(){

contadorPlanillas++;

/* HEADERS */

const filaPrincipal =
document.getElementById(
'filaPrincipal'
);

const filaSecundaria =
document.getElementById(
'filaSecundaria'
);

/* ELIMINAR ACUMULADO ANTERIOR */

const acumuladoAnterior =
document.getElementById(
'thAcumulado'
);

if(acumuladoAnterior){

acumuladoAnterior.remove();

document
.querySelectorAll(
'.td-acumulado'
)
.forEach(td => td.remove());

}

/* HEADER PLANILLA */

const thPlanilla =
document.createElement('th');

thPlanilla.colSpan = 3;

thPlanilla.innerHTML = `

PLANILLA Nº${contadorPlanillas}

`;

filaPrincipal.appendChild(
thPlanilla
);

/* SUBHEADERS */

filaSecundaria.innerHTML += `

<th>CANTIDAD</th>

<th>TOTAL [Bs]</th>

<th>% AVANCE</th>

`;

/* FILAS ITEMS */

const filas =
document.querySelectorAll(
'.fila-item'
);

filas.forEach(fila => {

/* CANTIDAD */

const tdCantidad =
document.createElement('td');

tdCantidad.innerHTML = `

<input
type="number"
class="planilla-input"
>

`;

fila.appendChild(tdCantidad);

/* TOTAL */

const tdTotal =
document.createElement('td');

tdTotal.innerHTML = `

<input
type="number"
class="planilla-total"
oninput="actualizarTotalesPlanilla()"
>

`;

fila.appendChild(tdTotal);

/* AVANCE */

const tdAvance =
document.createElement('td');

tdAvance.innerHTML = `

<input
type="text"
class="avance-input"
value="100,00%"
>

`;

fila.appendChild(tdAvance);

});

/* CREAR NUEVO ACUMULADO */

const thAcumulado =
document.createElement('th');

thAcumulado.id =
'thAcumulado';

thAcumulado.rowSpan = 2;

thAcumulado.innerHTML = `

% AVANCE
ACUMULADO

`;

filaPrincipal.appendChild(
thAcumulado
);

/* INPUTS ACUMULADOS */

filas.forEach(fila => {

const td =
document.createElement('td');

td.classList.add(
'td-acumulado'
);

td.innerHTML = `

<input
type="text"
class="avance-acumulado"
value="100,00%"
>

`;

fila.appendChild(td);

});

}

/* =========================
   ACTUALIZAR TOTALES
========================= */

function actualizarTotalesPlanilla(){

let totalContrato = 0;

const filas =
document.querySelectorAll(
'.fila-item'
);

filas.forEach(fila => {

let totalModulo = 0;

const inputs =
fila.querySelectorAll(
'.planilla-total'
);

inputs.forEach(input => {

totalModulo +=
parseFloat(input.value) || 0;

});

/* TOTAL MODULO */

const filaTotal =
fila.nextElementSibling;

const totalCelda =
filaTotal.querySelector(
'.modulo-total'
);

if(totalCelda){

totalCelda.textContent =
totalModulo.toFixed(2);

}

totalContrato += totalModulo;

});

/* TOTAL CONTRATO */

const totalGeneral =
document.getElementById(
'totalContratoPlanilla'
);

if(totalGeneral){

totalGeneral.textContent =
totalContrato.toFixed(2);

}

}

/* =========================
   VER IMAGEN
========================= */

function verImagen(src, descripcion){

const modal =
document.createElement('div');

modal.className =
'modal-imagen';

modal.innerHTML = `

<div class="contenido-modal">

<button
class="cerrar-modal"
onclick="this.parentElement.parentElement.remove()">

✖

</button>

<img src="${src}">

<p>${descripcion}</p>

</div>

`;

document.body.appendChild(modal);

}