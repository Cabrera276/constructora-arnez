const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contadorFilas = 1;

// ============================
// CARGAR DATOS AL INICIAR
// ============================
window.addEventListener('load', cargarAmpliaciones);

async function cargarAmpliaciones() {
    try {
        const res = await fetch(`${URL_SERVIDOR}/ampliaciones`);
        const datos = await res.json();
        
        if (datos.length > 0) {
            datos.forEach(dato => {
                agregarFila(dato);
            });
            contadorFilas = datos.length + 1;
        }
    } catch (error) {
        console.error('Error cargando:', error);
    }
}

// ============================
// AGREGAR FILA
// ============================
document.getElementById('btnAgregarPlazo').addEventListener('click', () => agregarFila());

function agregarFila(dato = null) {
    const tabla = document.getElementById('tablaPlazos');
    const fila = document.createElement('tr');
    
    fila.innerHTML = `
        <td>${dato ? dato.id : contadorFilas}</td>
        <td contenteditable="true">${dato ? dato.descripcion || '' : ''}</td>
        <td><input type="date" class="fecha-inicio" value="${dato ? dato.inicio || '' : ''}" onchange="calcularDias(this)"></td>
        <td><input type="date" class="fecha-fin" value="${dato ? dato.fin || '' : ''}" onchange="calcularDias(this)"></td>
        <td class="plazo">${dato ? dato.plazo || 0 : 0}</td>
        <td class="plazo-acumulado">0</td>
        <td>
            <button class="delete-btn" onclick="eliminarFila(this)" title="Eliminar fila">
                <i class="fa fa-trash"></i>
            </button>
        </td>
    `;
    
    tabla.appendChild(fila);
    if (!dato) contadorFilas++;
    calcularAcumulados();
}

// ============================
// CALCULAR DÍAS ENTRE FECHAS
// ============================
function calcularDias(input) {
    const fila = input.closest('tr');
    const inicio = fila.querySelector('.fecha-inicio').value;
    const fin = fila.querySelector('.fecha-fin').value;
    const plazoCelda = fila.querySelector('.plazo');
    
    if (inicio && fin) {
        const fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        const diferencia = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
        plazoCelda.textContent = diferencia >= 0 ? diferencia : 0;
        calcularAcumulados();
    }
}

// ============================
// CALCULAR ACUMULADOS
// ============================
function calcularAcumulados() {
    const filas = document.querySelectorAll('#tablaPlazos tr');
    let acumulado = 0;
    
    filas.forEach(fila => {
        const plazo = parseInt(fila.querySelector('.plazo')?.textContent) || 0;
        acumulado += plazo;
        const acumCelda = fila.querySelector('.plazo-acumulado');
        if (acumCelda) acumCelda.textContent = acumulado;
    });
    
    const totalEl = document.getElementById('totalAcumulado');
    if (totalEl) totalEl.textContent = acumulado + ' días';
}

// ============================
// ELIMINAR FILA
// ============================
function eliminarFila(btn) {
    if (confirm('¿Eliminar esta ampliación?')) {
        btn.closest('tr').remove();
        calcularAcumulados();
    }
}

// ============================
// GUARDAR EN MYSQL
// ============================
document.getElementById('btnGuardarPlazos').addEventListener('click', guardarDatos);

async function guardarDatos() {
    const filas = document.querySelectorAll('#tablaPlazos tr');
    const datos = [];
    
    filas.forEach(fila => {
        datos.push({
            descripcion: fila.cells[1]?.textContent.trim() || '',
            inicio: fila.querySelector('.fecha-inicio')?.value || '',
            fin: fila.querySelector('.fecha-fin')?.value || '',
            plazo: parseInt(fila.querySelector('.plazo')?.textContent) || 0,
            acumulado: parseInt(fila.querySelector('.plazo-acumulado')?.textContent) || 0
        });
    });
    
    if (datos.length === 0) { alert('No hay datos'); return; }
    
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-ampliaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await r.json();
        alert(data.success ? '✅ Ampliaciones guardadas' : '❌ Error');
        if (data.success) location.reload();
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

// ============================
// MODAL CONTACTOS
// ============================
function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", function(e) { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

// ============================
// MENÚ HAMBURGUESA
// ============================
function toggleMenu() {
    const menu = document.querySelector('.menu'), boton = document.querySelector('.menu-hamburguesa');
    if (!menu || !boton) return;
    menu.classList.toggle('activo'); boton.classList.toggle('activo');
    const icono = boton.querySelector('i');
    if (menu.classList.contains('activo')) { icono.classList.remove('fa-bars'); icono.classList.add('fa-times'); }
    else { icono.classList.remove('fa-times'); icono.classList.add('fa-bars'); }
}