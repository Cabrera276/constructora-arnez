const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contador = 1;

// ============================
// CARGAR DATOS
// ============================
window.addEventListener('load', cargarDatos);

async function cargarDatos() {
    try {
        const res = await fetch(`${URL_SERVIDOR}/ampliaciones`);
        const datos = await res.json();
        if (datos.length > 0) {
            datos.forEach(d => agregarFila(d));
            contador = datos.length + 1;
        }
        recalcularAcumulados();
    } catch (e) {
        console.error('Error:', e);
    }
}

// ============================
// AGREGAR FILA
// ============================
document.getElementById('btnAgregarPlazo').addEventListener('click', () => agregarFila());

function agregarFila(dato = null) {
    const tabla = document.getElementById('tablaPlazos');
    const num = dato ? dato.id : contador;
    
    const fila = document.createElement('tr');
    fila.dataset.id = num;
    
    fila.innerHTML = `
        <td>${num}</td>
        <td contenteditable="true">${dato ? dato.descripcion || '' : ''}</td>
        <td><input type="date" class="inicio-input" value="${dato ? dato.inicio || '' : ''}"></td>
        <td><input type="date" class="fin-input" value="${dato ? dato.fin || '' : ''}"></td>
        <td><input type="number" class="plazo-input" value="${dato ? dato.plazo || 0 : 0}" oninput="recalcularAcumulados()"></td>
        <td class="acumulado-cell">${dato ? dato.acumulado || 0 : 0}</td>
        <td><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></td>
    `;
    
    tabla.appendChild(fila);
    if (!dato) contador++;
    recalcularAcumulados();
}

// ============================
// RECALCULAR ACUMULADOS
// ============================
function recalcularAcumulados() {
    const filas = document.querySelectorAll('#tablaPlazos tr');
    let acumulado = 0;
    
    filas.forEach(fila => {
        const plazoInput = fila.querySelector('.plazo-input');
        const acumCelda = fila.querySelector('.acumulado-cell');
        
        if (plazoInput && acumCelda) {
            const plazo = parseInt(plazoInput.value) || 0;
            acumulado += plazo;
            acumCelda.textContent = acumulado;
        }
    });
}

// ============================
// ELIMINAR FILA (CORREGIDO)
// ============================
async function eliminarFila(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;
    
    if (!confirm('¿Estás seguro de eliminar esta ampliación?')) return;
    
    try {
        const r = await fetch(`${URL_SERVIDOR}/eliminar-ampliacion/${id}`, {
            method: 'DELETE'
        });
        const data = await r.json();
        
        if (data.success) {
            fila.remove();
            recalcularAcumulados();
            alert('✅ Eliminado correctamente');
        } else {
            alert('❌ Error al eliminar: ' + (data.message || 'Desconocido'));
        }
    } catch (e) {
        console.error('Error:', e);
        alert('❌ Error de conexión');
    }
}

// ============================
// GUARDAR (CORREGIDO - ENVÍA IDs)
// ============================
document.getElementById('btnGuardarPlazos').addEventListener('click', guardar);

async function guardar() {
    const filas = document.querySelectorAll('#tablaPlazos tr');
    const datos = [];
    
    filas.forEach(fila => {
        const id = parseInt(fila.dataset.id);
        datos.push({
            id: id && !isNaN(id) ? id : null,
            descripcion: fila.cells[1]?.textContent.trim() || '',
            inicio: fila.querySelector('.inicio-input')?.value || '',
            fin: fila.querySelector('.fin-input')?.value || '',
            plazo: parseInt(fila.querySelector('.plazo-input')?.value) || 0,
            acumulado: parseInt(fila.querySelector('.acumulado-cell')?.textContent) || 0
        });
    });
    
    if (!datos.length) { alert('No hay datos'); return; }
    
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-ampliaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const resultado = await r.json();
        alert(resultado.success ? '✅ Guardado correctamente' : '❌ Error al guardar');
        
        // Recargar para actualizar IDs
        if (resultado.success) {
            location.reload();
        }
    } catch (e) {
        console.error('Error:', e);
        alert('❌ Error de conexión');
    }
}

// ============================
// CONTACTOS Y MENÚ
// ============================
function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", function(e) { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

function toggleMenu() {
    const menu = document.querySelector('.menu'), boton = document.querySelector('.menu-hamburguesa');
    if (!menu || !boton) return;
    menu.classList.toggle('activo'); boton.classList.toggle('activo');
    const icono = boton.querySelector('i');
    if (menu.classList.contains('activo')) { icono.classList.remove('fa-bars'); icono.classList.add('fa-times'); }
    else { icono.classList.remove('fa-times'); icono.classList.add('fa-bars'); }
}