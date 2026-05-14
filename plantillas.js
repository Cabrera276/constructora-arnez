const usuario = localStorage.getItem("usuario");

if(!usuario){

    window.location.replace("index.html");

}
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
const planillasRes =
await fetch(
'http://localhost:3000/planillas'
);
const datos =
await itemsRes.json();

const ordenesCambio =
await ocRes.json();

const contratosMod =
await cmRes.json();
const planillas =
await planillasRes.json();

/* =========================
   CREAR BLOQUES PLANILLAS
========================= */

const maxPlanilla =
Math.max(
0,
...planillas.map(
p => p.numero_planilla
)
);

for(
let i = 1;
i <= maxPlanilla;
i++
){

agregarPlanillaGeneral();

}

const tabla =
document.getElementById(
'tablaReporte'
);

tabla.innerHTML = '';

let moduloAnterior = null;

datos.forEach(filaData => {

/* =========================
   CREAR BLOQUE MODULO
========================= */

if(moduloAnterior != filaData.modulo_id){

moduloAnterior =
filaData.modulo_id;

const filaModulo =
document.createElement('tr');

filaModulo.classList.add(
'fila-modulo'
);

filaModulo.innerHTML = `

<td colspan="30"
style="
background:#dcdcdc;
font-weight:bold;
font-size:18px;
text-align:left;
padding:14px;
color:black;
">

MODULO ${String(filaData.modulo_id)
.padStart(2,'0')}

</td>

`;

tabla.appendChild(filaModulo);

}

/* =========================
   OC
========================= */

const ocItem =
ordenesCambio.find(
oc => oc.item_id == filaData.id
) || {};

/* =========================
   CM
========================= */

const cmItem =
contratosMod.find(
cm => cm.item_id == filaData.id
) || {};

/* =========================
   FILA ITEM
========================= */

const fila =
document.createElement('tr');

fila.dataset.itemId =
filaData.id;

fila.classList.add(
'fila-item'
);

fila.innerHTML = `

<td>${filaData.modulo_id || ''}</td>

<td>${filaData.descripcion || ''}</td>

<td>${filaData.unidad || ''}</td>

<!-- ORIGINAL -->

<td>${filaData.cantidad || ''}</td>
<td>${filaData.precio_unitario || ''}</td>
<td>${filaData.total || ''}</td>

<!-- OC -->

<td>${ocItem.cantidad || ''}</td>
<td>${ocItem.precio || ''}</td>
<td>${ocItem.total || ''}</td>

<!-- CM -->

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
<i class="fa fa-pen"></i>
</button>

<button class="delete-btn">
<i class="fa fa-trash"></i>
</button>

</div>

</td>

`;

tabla.appendChild(fila);
/* =========================
   LLENAR PLANILLAS
========================= */

const planillasItem =
planillas.filter(
p => p.item_id == filaData.id
);

planillasItem.forEach(planilla => {

const inicio =
15 + (
(planilla.numero_planilla - 1) * 3
);

fila.cells[inicio]
.querySelector('input')
.value =
planilla.cantidad;

fila.cells[inicio + 1]
.querySelector('input')
.value =
planilla.total;

fila.cells[inicio + 2]
.querySelector('input')
.value =
planilla.avance;

});

/* =========================
   TOTAL MODULO
========================= */

const siguiente =
datos[
datos.indexOf(filaData) + 1
];

if(
!siguiente
||
siguiente.modulo_id != filaData.modulo_id
){

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


/* LLENAR DATOS */

setTimeout(() => {

planillasItem.forEach(planilla => {

const inicio =
15 + (
(planilla.numero_planilla - 1) * 3
);

fila.cells[inicio]
.querySelector('input')
.value =
planilla.cantidad;

fila.cells[inicio + 1]
.querySelector('input')
.value =
planilla.total;

fila.cells[inicio + 2]
.querySelector('input')
.value =
planilla.avance;

});

},100);

}

});

}

/* =========================
   AÑADIR PLANILLA
========================= */

function agregarPlanillaGeneral(){

contadorPlanillas++;

const filaPrincipal =
document.querySelector('thead tr:first-child');

const filaSecundaria =
document.querySelector('thead tr:last-child');

/* HEADER */

const thPlanilla =
document.createElement('th');

thPlanilla.colSpan = 3;

thPlanilla.innerHTML = `
PLANILLA Nº${contadorPlanillas}
`;

/* INSERTAR ANTES DE % */

filaPrincipal.insertBefore(
thPlanilla,
filaPrincipal.children[
filaPrincipal.children.length - 3
]
);

/* SUBHEADERS */

['CANTIDAD','TOTAL [Bs]','% AVANCE']
.forEach(texto => {

const th =
document.createElement('th');

th.innerText = texto;

filaSecundaria.insertBefore(
th,
filaSecundaria.children[
filaSecundaria.children.length
]
);

});

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

/* INSERTAR ANTES DE % */

fila.insertBefore(
tdCantidad,
fila.children[
fila.children.length - 3
]
);

fila.insertBefore(
tdTotal,
fila.children[
fila.children.length - 3
]
);

fila.insertBefore(
tdAvance,
fila.children[
fila.children.length - 3
]
);

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
/* =========================
   ELIMINAR PLANILLA
========================= */

function eliminarPlanillaGeneral(){

if(contadorPlanillas <= 0){
return;
}

const filaPrincipal =
document.querySelector('thead tr:first-child');

const filaSecundaria =
document.querySelector('thead tr:last-child');

/* ELIMINAR HEADER PLANILLA */

filaPrincipal.children[
filaPrincipal.children.length - 4
].remove();

/* ELIMINAR SUBHEADERS */

for(let i=0;i<3;i++){

filaSecundaria.lastElementChild.remove();

}

/* ELIMINAR COLUMNAS ITEMS */

const filas =
document.querySelectorAll('.fila-item');

filas.forEach(fila => {

for(let i=0;i<3;i++){

fila.deleteCell(
fila.cells.length - 4
);

}

});

contadorPlanillas--;

actualizarTotalesPlanilla();

}
/* =========================
   GUARDAR PLANILLAS
========================= */

async function guardarPlanillas(){

const filas =
document.querySelectorAll('.fila-item');

let datosPlanilla = [];

filas.forEach((fila,index) => {

const itemId =
fila.dataset.itemId;

for(let p=1; p<=contadorPlanillas; p++){

const inicio = 15 + ((p - 1) * 3);

const cantidad =
fila.cells[inicio]
.querySelector('input')?.value || 0;

const total =
fila.cells[inicio + 1]
.querySelector('input')?.value || 0;

const avance =
fila.cells[inicio + 2]
.querySelector('input')?.value || '0%';

if(cantidad || total){

datosPlanilla.push({

numero_planilla:p,

item_id:itemId,

cantidad,

total,

avance

});

}

}
});
try{

const respuesta = await fetch(
'http://localhost:3000/guardar-planillas',
{
method:'POST',

headers:{
'Content-Type':'application/json'
},

body:JSON.stringify(datosPlanilla)

}
);

const data =
await respuesta.json();

if(data.success){

alert(
'Planillas guardadas correctamente'
);

}else{

alert(
'Error al guardar planillas'
);

}

}catch(error){

console.log(error);

alert(
'Error conectando con el servidor'
);

}

}
function abrirContactos(){
    document.getElementById("modalContactos").style.display = "flex";
}

function cerrarContactos(){
    document.getElementById("modalContactos").style.display = "none";
}

window.addEventListener("click", function(e){

    const modal = document.getElementById("modalContactos");

    if(e.target === modal){
        cerrarContactos();
    }

});