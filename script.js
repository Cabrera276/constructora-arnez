let moduloActual = 1;

let ordenCambio = 0;
let contratoMod = 0;

let accionConfirmada = null;

/* =========================
   MODAL PERSONALIZADO
========================= */

function abrirModal(titulo,mensaje,callback){

document.getElementById('confirmTitle').innerText = titulo;

document.getElementById('confirmText').innerText = mensaje;

document.getElementById('confirmModal').style.display = 'flex';

accionConfirmada = callback;

}

document.getElementById('cancelBtn').onclick = () => {

document.getElementById('confirmModal').style.display = 'none';

};

document.getElementById('acceptBtn').onclick = () => {

if(accionConfirmada){

accionConfirmada();

}

document.getElementById('confirmModal').style.display = 'none';

};

/* =========================
   AÑADIR MODULO
========================= */

document.getElementById('btnModulo')
.addEventListener('click', () => {

const tabla =
document.getElementById('tablaItems');

const totalColumnas =
11 + (ordenCambio * 3)
+ (contratoMod * 3);

const filaModulo =
document.createElement('tr');

filaModulo.classList.add('grupo-modulo');

filaModulo.dataset.modulo =
moduloActual;

filaModulo.innerHTML = `

<td colspan="${totalColumnas}" class="modulo-row">

<div class="modulo-content">

<span contenteditable="true">

MODULO ${moduloActual
.toString()
.padStart(2,'0')}

</span>

<div class="table-actions">

<button
class="edit-btn"
onclick="editarModulo(this)">
<i class="fa fa-pen"></i>
</button>

<button
class="delete-btn"
onclick="eliminarModulo(this)">
<i class="fa fa-trash"></i>
</button>

</div>

</div>

</td>
`;

tabla.appendChild(filaModulo);

/* TOTAL MODULO */

const filaTotal =
document.createElement('tr');

filaTotal.classList.add('total-modulo');

filaTotal.dataset.modulo =
moduloActual;

filaTotal.innerHTML = `

<td colspan="5">
<strong>TOTAL MÓDULO</strong>
</td>

<td>0.00</td>

<td colspan="${
(ordenCambio * 3)
+
(contratoMod * 3)
+
5
}"></td>

`;

tabla.appendChild(filaTotal);

moduloActual++;

});

/* =========================
   AÑADIR ITEM
========================= */

document.getElementById('btnItem')
.addEventListener('click', () => {

const tabla =
document.getElementById('tablaItems');

const modulos =
document.querySelectorAll('.grupo-modulo');

if(modulos.length === 0){

alert('Primero crea un módulo');

return;

}

const ultimoModulo =
modulos[modulos.length - 1];

const moduloId =
ultimoModulo.dataset.modulo;

const fila =
document.createElement('tr');

fila.dataset.modulo =
moduloId;

let columnasOC = '';
let columnasCM = '';

/* OC */

for(let i=0;i<ordenCambio;i++){

columnasOC += `

<td contenteditable="true"></td>
<td contenteditable="true"></td>
<td></td>

`;

}

/* CM */

for(let i=0;i<contratoMod;i++){

columnasCM += `

<td contenteditable="true"></td>
<td contenteditable="true"></td>
<td></td>

`;

}

fila.innerHTML = `

<td>${moduloId}</td>

<td contenteditable="true"></td>

<td contenteditable="true"></td>

<td contenteditable="true"></td>

<td contenteditable="true"></td>

<td></td>

${columnasOC}

${columnasCM}

<td contenteditable="true">0%</td>

<td>

<div class="evidencia-box">
<input
type="file"
class="input-imagen"
accept="image/*"

onchange="cargarImagen(event,this)"
data-imagenes="[]"
style="display:none"
>

<button
type="button"
class="btn-subir"
onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()"
>
Subir
</button>

<input
type="text"
class="descripcion-img"
placeholder="Descripción"
value=""
>

<button
type="button"
class="btn-ver"
onclick="verImagen(this)"
>
Ver
</button>

</div>

</td>

<td>

<div class="table-actions">

<button
type="button"
class="edit-btn"
onclick="editarFila(this)">
<i class="fa fa-pen"></i>
</button>

<button
type="button"
class="delete-btn"
onclick="eliminarFila(this)">
<i class="fa fa-trash"></i>
</button>

</div>

</td>

`;

const totales =
document.querySelectorAll('.total-modulo');

let totalModulo = null;

totales.forEach(total => {

if(total.dataset.modulo == moduloId){

totalModulo = total;

}

});

if(totalModulo){

tabla.insertBefore(
fila,
totalModulo
);

}else{

tabla.appendChild(fila);

}

actualizarTotales();

});

/* =========================
   AÑADIR ORDEN CAMBIO
========================= */

document.getElementById('btnOC')
.addEventListener('click', () => {

ordenCambio++;

agregarGrupo(
`ORDEN CAMBIO Nº${ordenCambio}`
);

});

/* =========================
   AÑADIR CONTRATO MOD
========================= */

document.getElementById('btnCM')
.addEventListener('click', () => {

contratoMod++;

agregarGrupo(
`CONTRATO MOD Nº${contratoMod}`
);

});

/* =========================
   AGREGAR COLUMNAS
========================= */

function agregarGrupo(titulo){

const filaPrincipal =
document.getElementById('filaPrincipal');

const filaSecundaria =
document.getElementById('filaSecundaria');

const grupo =
document.createElement('th');

grupo.colSpan = 3;

grupo.innerText = titulo;

filaPrincipal.insertBefore(
grupo,
filaPrincipal.children[
filaPrincipal.children.length - 3
]
);

['CANT.','P.U.Bs','TOTAL']
.forEach(texto => {

const th =
document.createElement('th');

th.innerText = texto;

filaSecundaria.appendChild(th);

});

document
.querySelectorAll('#tablaItems tr')
.forEach(fila => {

if(
!fila.querySelector('.modulo-row')
&&
!fila.classList.contains('total-modulo')
){

const c1 =
fila.insertCell(
fila.cells.length - 3
);

c1.contentEditable = true;

const c2 =
fila.insertCell(
fila.cells.length - 3
);

c2.contentEditable = true;

fila.insertCell(
fila.cells.length - 3
);

}

});

}

/* =========================
   ACTUALIZAR TOTALES
========================= */

document.addEventListener(
'input',
actualizarTotales
);

function actualizarTotales(){

const filas =
document.querySelectorAll('#tablaItems tr');

let totalGeneral = 0;

let totalModuloOriginal = 0;

let totalesOCModulo =
new Array(ordenCambio).fill(0);

let totalesCMModulo =
new Array(contratoMod).fill(0);

filas.forEach(fila => {

/* =========================
   CAMBIO MODULO
========================= */

if(
fila.classList.contains('grupo-modulo')
){

totalModuloOriginal = 0;

totalesOCModulo =
new Array(ordenCambio).fill(0);

totalesCMModulo =
new Array(contratoMod).fill(0);

return;

}

/* =========================
   FILA TOTAL MODULO
========================= */

if(
fila.classList.contains('total-modulo')
){

let htmlTotales = `

<td colspan="5">
<strong>TOTAL MÓDULO</strong>
</td>

<td>
${totalModuloOriginal.toFixed(2)}
</td>

`;

/* =========================
   TOTAL OC
========================= */

totalesOCModulo.forEach(total => {

htmlTotales += `

<td></td>
<td></td>
<td>${total.toFixed(2)}</td>

`;

});

/* =========================
   TOTAL CM
========================= */

totalesCMModulo.forEach(total => {

htmlTotales += `

<td></td>
<td></td>
<td>${total.toFixed(2)}</td>

`;

});

htmlTotales += `

<td colspan="5"></td>

`;

fila.innerHTML = htmlTotales;

return;

}

/* =========================
   FILAS NORMALES
========================= */

const celdas =
fila.querySelectorAll('td');

if(celdas.length < 6){
return;
}

/* ORIGINAL */

const puOriginal =
parseFloat(
celdas[4]?.innerText
) || 0;

const totalOriginal =
puOriginal;

celdas[5].innerText =
totalOriginal.toFixed(2);

/* =========================
   ORDENES CAMBIO
========================= */

let inicioOC = 6;

for(let i=0;i<ordenCambio;i++){

const precioOC =
parseFloat(
celdas[inicioOC + 1]?.innerText
) || 0;

const totalOC =
precioOC;

totalesOCModulo[i] += totalOC;

celdas[inicioOC + 2].innerText =
totalOC.toFixed(2);

inicioOC += 3;

}

/* =========================
   CONTRATOS MOD
========================= */

let inicioCM =
6 + (ordenCambio * 3);

for(let i=0;i<contratoMod;i++){

const precioCM =
parseFloat(
celdas[inicioCM + 1]?.innerText
) || 0;

const totalCM =
precioCM;

totalesCMModulo[i] += totalCM;

celdas[inicioCM + 2].innerText =
totalCM.toFixed(2);

inicioCM += 3;

}

/* =========================
   SUMAS
========================= */

let sumaFila = totalOriginal;

totalesOCModulo.forEach(total => {

sumaFila += total;

});

totalesCMModulo.forEach(total => {

sumaFila += total;

});

totalGeneral += sumaFila;

totalModuloOriginal += totalOriginal;

});

/* =========================
   TOTAL CONTRATO
========================= */

const filaTotal =
document.querySelector('tfoot tr');

filaTotal.innerHTML = `

<td colspan="5">

<strong>
TOTAL CONTRATO
</strong>

</td>

<td>
${totalGeneral.toFixed(2)}
</td>

<td colspan="${
(ordenCambio * 3)
+
(contratoMod * 3)
+
5
}"></td>

`;

}

/* =========================
   EDITAR FILA
========================= */

async function editarFila(btn){

const fila =
btn.closest('tr');

const celdas =
fila.querySelectorAll('td');

const id =
fila.dataset.id;

const datos = {

descripcion:
celdas[1].innerText,

unidad:
celdas[2].innerText,

cantidad:
parseFloat(celdas[3].innerText) || 0,

precio_unitario:
parseFloat(celdas[4].innerText) || 0,

total:
parseFloat(celdas[5].innerText) || 0

};

try{

await fetch(

`http://localhost:3000/editar-item/${id}`,

{
method:'PUT',

headers:{
'Content-Type':'application/json'
},

body: JSON.stringify(datos)

}

);

alert('Fila actualizada');

}catch(error){

console.log(error);

}

}

/* =========================
   ELIMINAR FILA
========================= */

async function eliminarFila(btn){

abrirModal(

'Eliminar fila',

'¿Seguro que deseas eliminar esta fila?',

async () => {

const fila =
btn.closest('tr');

const id =
fila.dataset.id;

try{

await fetch(

`http://localhost:3000/eliminar-item/${id}`,

{
method:'DELETE'
}

);

fila.remove();

actualizarTotales();

}catch(error){

console.log(error);

}

}

);

}

/* =========================
   EDITAR MODULO
========================= */

function editarModulo(btn){

const modulo =
btn.closest('.modulo-row');

const texto =
modulo.querySelector('span');

texto.contentEditable = true;

texto.focus();

}

/* =========================
   ELIMINAR MODULO
========================= */

function eliminarModulo(btn){

abrirModal(

'Eliminar módulo',

'¿Seguro que deseas eliminar este módulo?',

() => {

const filaModulo =
btn.closest('tr');

const modulo =
filaModulo.dataset.modulo;

const filas =
document.querySelectorAll('#tablaItems tr');



filas.forEach(fila => {

if(fila.dataset.modulo == modulo){

fila.remove();

}

});

actualizarTotales();

}

);

}

/* =========================
   IMAGEN
========================= */
async function cargarImagen(event,input){

const archivos = Array.from(input.files);

if(archivos.length === 0){
return;
}



try{

const imagenesActuales =
JSON.parse(
decodeURIComponent(
input.dataset.imagenes || '[]'
)
);
if(imagenesActuales.length >= 4){

alert('Máximo 4 imágenes');

return;

}

archivos.forEach(archivo => {

const reader = new FileReader();

reader.onload = e => {

imagenesActuales.push(e.target.result);

input.dataset.imagenes =
JSON.stringify(imagenesActuales);

};

reader.readAsDataURL(archivo);

});



}catch(error){

console.log(error);

alert('Error cargando imágenes');

}
}

function verImagen(btn){

const fila = btn.closest('tr');

const inputImagen =
fila.querySelector('.input-imagen');

const inputDescripcion =
fila.querySelector('.descripcion-img');

let imagenes = [];

try{

imagenes = JSON.parse(
decodeURIComponent(
inputImagen.dataset.imagenes || '[]'
)
);

}catch{

try{

imagenes = JSON.parse(
inputImagen.dataset.imagenes || '[]'
);

}catch{

imagenes = [];

}

}

const descripcion =
inputDescripcion.value;

if(imagenes.length === 0){

alert('Primero selecciona imágenes');

return;

}

let indiceActual = 0;

const htmlImagenes = `

<div class="carrusel-container">

<button
class="carrusel-btn prev"
onclick="cambiarImagen(-1)">
❮
</button>

<img
id="imagenCarrusel"
src="${imagenes[0]}"
style="
width:100%;
max-height:600px;
object-fit:contain;
border-radius:15px;
"
>

<button
class="carrusel-btn next"
onclick="cambiarImagen(1)">
❯
</button>

</div>

`;

const modal =
document.createElement('div');

modal.innerHTML = `

<style>

.carrusel-container{
position:relative;
display:flex;
align-items:center;
justify-content:center;
gap:20px;
}

.carrusel-btn{
background:#f5b400;
border:none;
width:50px;
height:50px;
border-radius:50%;
font-size:25px;
cursor:pointer;
font-weight:bold;
}

</style>

<div style="
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,0.8);
display:flex;
justify-content:center;
align-items:center;
z-index:9999;
overflow:auto;
">

<div style="
background:#111;
padding:20px;
border-radius:20px;
position:relative;
max-width:700px;
width:80%;
text-align:center;
">

<button id="cerrarModal" style="
position:absolute;
top:10px;
right:10px;
z-index:99999;
background:red;
color:white;
border:none;
width:40px;
height:40px;
border-radius:50%;
font-size:20px;
cursor:pointer;
">
×
</button>

${htmlImagenes}

<p style="
color:white;
font-size:20px;
margin-top:10px;
">
${descripcion}
</p>

</div>

</div>

`;

document.body.appendChild(modal);

window.cambiarImagen = function(direccion){

indiceActual += direccion;

if(indiceActual < 0){

indiceActual = imagenes.length - 1;

}

if(indiceActual >= imagenes.length){

indiceActual = 0;

}

document.getElementById(
'imagenCarrusel'
).src = imagenes[indiceActual];

};

document
.getElementById('cerrarModal')
.onclick = () => {

modal.remove();

};

}


function cerrarImagen(){

document.getElementById(
'modalImagen'
).style.display = 'none';

}

/* =========================
   GUARDAR MYSQL
========================= */

document.getElementById("btnGuardar")
.addEventListener("click", guardarDatos);

async function guardarDatos(){

const filas =
document.querySelectorAll("#tablaItems tr");

const datos = [];

for(const fila of filas){

if(
fila.classList.contains("grupo-modulo") ||
fila.classList.contains("total-modulo")
){
continue;
}

const celdas =
fila.children;

let ordenesCambio = [];
let contratosMod = [];

if(celdas.length < 6){
continue;
}

const descripcion =
celdas[1]?.textContent.trim();

if(descripcion === ''){
continue;
}

/* OC */

let inicioOC = 6;

for(let i=0;i<ordenCambio;i++){

const cantidad =
parseFloat(
celdas[inicioOC]?.innerText
) || 0;

const precio =
parseFloat(
celdas[inicioOC + 1]?.innerText
) || 0;

const total =
parseFloat(
celdas[inicioOC + 2]?.innerText
) || 0;

ordenesCambio.push({

numero: i + 1,
cantidad,
precio,
total

});

inicioOC += 3;

}

/* CM */

let inicioCM =
6 + (ordenCambio * 3);

for(let i=0;i<contratoMod;i++){

const cantidad =
parseFloat(
celdas[inicioCM]?.innerText
) || 0;

const precio =
parseFloat(
celdas[inicioCM + 1]?.innerText
) || 0;

const total =
parseFloat(
celdas[inicioCM + 2]?.innerText
) || 0;

contratosMod.push({

numero: i + 1,
cantidad,
precio,
total

});

inicioCM += 3;

}
const box =
fila.querySelector('.evidencia-box');

const inputImagen =
box.querySelector('.input-imagen');

const descripcionImagen =
box.querySelector('.descripcion-img');

datos.push({

modulo_id:
parseInt(
fila.dataset.modulo
),

descripcion: descripcion,

unidad:
celdas[2]?.innerText.trim(),

cantidad:
parseFloat(celdas[3]?.innerText) || 0,

precio_unitario:
parseFloat(celdas[4]?.innerText) || 0,

total:
parseFloat(celdas[5]?.innerText) || 0,

ordenesCambio,
contratosMod,

imagen:
inputImagen.dataset.imagenes || '',

descripcion_imagen:
descripcionImagen.value || '',

porcentaje_incidencia: 0

});

}

try{

await fetch(
'http://localhost:3000/guardar-item',
{
method:'POST',

headers:{
'Content-Type':'application/json'
},

body: JSON.stringify(datos)
}
);

alert("Datos guardados correctamente");

}catch(error){

console.log(error);

alert("Error guardando datos");

}

}

/* =========================
   CARGAR ITEMS MYSQL
========================= */

async function cargarItems(){

try{

const responseItems =
await fetch('http://localhost:3000/items');

const items =
await responseItems.json();

const responseOC =
await fetch('http://localhost:3000/ordenes-cambio');

const ordenesCambioDB =
await responseOC.json();

const responseCM =
await fetch('http://localhost:3000/contratos-mod');

const contratosModDB =
await responseCM.json();

const maxOC = Math.max(
...ordenesCambioDB.map(
oc => oc.numero_oc
),
0
);

for(let i=0;i<maxOC;i++){

ordenCambio++;

agregarGrupo(
`ORDEN CAMBIO Nº${ordenCambio}`
);

}

const maxCM = Math.max(
...contratosModDB.map(
cm => cm.numero_cm
),
0
);

for(let i=0;i<maxCM;i++){

contratoMod++;

agregarGrupo(
`CONTRATO MOD Nº${contratoMod}`
);

}

const tabla =
document.getElementById('tablaItems');

tabla.innerHTML = '';

let moduloAnterior = null;
let numeroVisualModulo = 1;

items.forEach(item => {

if(moduloAnterior != item.modulo_id){

moduloAnterior = item.modulo_id;

const filaModulo =
document.createElement('tr');

filaModulo.classList.add('grupo-modulo');

filaModulo.dataset.modulo =
item.modulo_id;

filaModulo.innerHTML = `

<td colspan="${
11 + (ordenCambio * 3)
+ (contratoMod * 3)
}" class="modulo-row">

<div class="modulo-content">

<span>
MÓDULO ${String(numeroVisualModulo)
.padStart(2,'0')}
</span>

<div class="table-actions">

<button
class="edit-btn"
onclick="editarModulo(this)">
✏️
</button>

<button
class="delete-btn"
onclick="eliminarModulo(this)">
🗑
</button>

</div>

</div>

</td>
`;

tabla.appendChild(filaModulo);

numeroVisualModulo++;
}

/* OC */

const ocItem =
ordenesCambioDB.filter(
oc => oc.item_id == item.id
);

let columnasOC = '';

ocItem.forEach(oc => {

columnasOC += `

<td contenteditable="true">
${oc.cantidad}
</td>

<td contenteditable="true">
${oc.precio}
</td>

<td>
${oc.total}
</td>

`;

});

/* CM */

const cmItem =
contratosModDB.filter(
cm => cm.item_id == item.id
);

let columnasCM = '';

cmItem.forEach(cm => {

columnasCM += `

<td contenteditable="true">
${cm.cantidad}
</td>

<td contenteditable="true">
${cm.precio}
</td>

<td>
${cm.total}
</td>

`;

});

/* FILA */

const fila =
document.createElement('tr');

fila.dataset.modulo =
item.modulo_id;
fila.dataset.id =
item.id;

fila.innerHTML = `

<td>${item.modulo_id}</td>

<td contenteditable="true">
${item.descripcion || ''}
</td>

<td contenteditable="true">
${item.unidad || ''}
</td>

<td contenteditable="true">
${item.cantidad || 0}
</td>

<td contenteditable="true">
${item.precio_unitario || 0}
</td>

<td>
${item.total || 0}
</td>

${columnasOC}

${columnasCM}

<td contenteditable="true">
${item.porcentaje_incidencia || 0}%
</td>

<td>

<div class="evidencia-box">
<input
type="file"
class="input-imagen"
accept="image/*"

onchange="cargarImagen(event,this)"
data-imagenes='${item.imagen || "[]"}'
style="display:none"
>

<button
type="button"
class="btn-subir"
onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()"
>
Subir
</button>

<input
type="text"
class="descripcion-img"
placeholder="Descripción"
value="${item.descripcion_imagen || ''}"
>

<button
type="button"
class="btn-ver"
onclick="verImagen(this)"
>
Ver
</button>

</div>

</td>

<td>

<div class="table-actions">

<button
type="button"
class="edit-btn"
onclick="editarFila(this)">
<i class="fa fa-pen"></i>
</button>

<button
type="button"
class="delete-btn"
onclick="eliminarFila(this)">
<i class="fa fa-trash"></i>
</button>

</div>

</td>

`;

tabla.appendChild(fila);

/* TOTAL MODULO */

const yaExisteTotal =
tabla.querySelector(
`.total-modulo[data-modulo="${item.modulo_id}"]`
);

if(!yaExisteTotal){

const filaTotal =
document.createElement('tr');

filaTotal.classList.add('total-modulo');

filaTotal.dataset.modulo =
item.modulo_id;

filaTotal.innerHTML = `

<td colspan="5">
<strong>TOTAL MÓDULO</strong>
</td>

<td>0.00</td>

<td>0.00</td>

<td>0.00</td>

<td colspan="${
(ordenCambio * 3)
+
(contratoMod * 3)
+
2
}"></td>

`;

tabla.appendChild(filaTotal);

}



});


/* CREAR UN SOLO TOTAL POR MODULO */

const modulosYaCreados = [];

items.forEach(item => {

if(modulosYaCreados.includes(item.modulo_id)){
return;
}

modulosYaCreados.push(item.modulo_id);

const filaTotal =
document.createElement('tr');

filaTotal.classList.add('total-modulo');

filaTotal.dataset.modulo =
item.modulo_id;

filaTotal.innerHTML = `

<td colspan="5">
<strong>TOTAL MÓDULO</strong>
</td>

<td>0.00</td>

<td colspan="${
(ordenCambio * 3)
+
(contratoMod * 3)
+
5
}"></td>

`;

const filasModulo =
[
...tabla.querySelectorAll(
`tr[data-modulo="${item.modulo_id}"]`
)
];

const ultimaFila =
filasModulo[filasModulo.length - 1];

ultimaFila.after(filaTotal);

});

/* =========================
   LIMPIAR TOTALES
========================= */

document.querySelectorAll('.total-modulo')
.forEach(fila => fila.remove());

/* =========================
   CREAR TOTAL POR MODULO
========================= */

const modulosUnicos =
[...new Set(items.map(item => item.modulo_id))];

modulosUnicos.forEach(moduloId => {

const filasModulo =
[
...tabla.querySelectorAll(
`tr[data-modulo="${moduloId}"]`
)
];

if(filasModulo.length === 0){
return;
}

const filaTotal =
document.createElement('tr');

filaTotal.classList.add('total-modulo');

filaTotal.dataset.modulo =
moduloId;

filaTotal.innerHTML = `

<td colspan="5">
<strong>TOTAL MÓDULO</strong>
</td>

<td class="total-original">0.00</td>

<td colspan="2"></td>

<td class="total-oc">0.00</td>

<td colspan="2"></td>

<td class="total-cm">0.00</td>

<td colspan="${
(ordenCambio * 3)
+
(contratoMod * 3)
+
2
}"></td>

`;

filasModulo[
filasModulo.length - 1
].after(filaTotal);

});
actualizarTotales();

if(items.length > 0){

const ultimoModuloGuardado =
Math.max(
...items.map(item => item.modulo_id)
);

moduloActual =
ultimoModuloGuardado + 1;

}

}catch(error){

console.log(error);

}

}

/* =========================
   AUTO CARGAR
========================= */

window.addEventListener(
'load',
cargarItems
);
/* =========================
   ELIMINAR ORDEN CAMBIO
========================= */

function eliminarOC(){

if(ordenCambio <= 0){
return;
}

abrirModal(

'Eliminar Orden Cambio',

'¿Seguro que deseas eliminar la última Orden de Cambio?',

() => {

const filaPrincipal =
document.getElementById('filaPrincipal');

const filaSecundaria =
document.getElementById('filaSecundaria');

/* ELIMINAR HEADERS */

filaPrincipal.children[
filaPrincipal.children.length - 4
].remove();

for(let i=0;i<3;i++){

filaSecundaria.lastElementChild.remove();

}

/* ELIMINAR COLUMNAS TABLA */

document
.querySelectorAll('#tablaItems tr')
.forEach(fila => {

if(
!fila.classList.contains('grupo-modulo')
){

for(let i=0;i<3;i++){

fila.deleteCell(
fila.cells.length - 4
);

}

}

});

ordenCambio--;

actualizarTotales();

}

);

}

/* =========================
   ELIMINAR CONTRATO MOD
========================= */

function eliminarCM(){

if(contratoMod <= 0){
return;
}

abrirModal(

'Eliminar Contrato Mod.',

'¿Seguro que deseas eliminar el último Contrato Modificatorio?',

() => {

const filaPrincipal =
document.getElementById('filaPrincipal');

const filaSecundaria =
document.getElementById('filaSecundaria');

/* ELIMINAR HEADERS */

filaPrincipal.children[
filaPrincipal.children.length - 4
].remove();

for(let i=0;i<3;i++){

filaSecundaria.lastElementChild.remove();

}

/* ELIMINAR COLUMNAS TABLA */

document
.querySelectorAll('#tablaItems tr')
.forEach(fila => {

if(
!fila.classList.contains('grupo-modulo')
){

for(let i=0;i<3;i++){

fila.deleteCell(
fila.cells.length - 4
);

}

}

});

contratoMod--;

actualizarTotales();

}

);

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