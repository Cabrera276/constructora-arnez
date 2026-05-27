const usuario = localStorage.getItem("usuario");
const usuarioRol = localStorage.getItem("usuarioRol");

if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contador = 1;

// ============================
// MODO LECTURA - OCULTAR BOTONES
// ============================
function aplicarModoLectura() {
    if (usuarioRol === 'lectura') {
        // Ocultar botón de agregar
        const btnAgregar = document.getElementById('btnAgregarPlazo');
        if (btnAgregar) btnAgregar.style.display = 'none';
        
        // Ocultar botón de guardar
        const btnGuardar = document.getElementById('btnGuardarPlazos');
        if (btnGuardar) btnGuardar.style.display = 'none';
        
        // Hacer celdas no editables
        const celdasEditables = document.querySelectorAll('[contenteditable="true"]');
        celdasEditables.forEach(celda => {
            celda.setAttribute('contenteditable', 'false');
            celda.style.backgroundColor = '#f0f0f0';
        });
        
        // Deshabilitar inputs de fecha y plazo
        const inputs = document.querySelectorAll('.inicio-input, .fin-input, .plazo-input');
        inputs.forEach(input => {
            input.disabled = true;
            input.style.backgroundColor = '#f0f0f0';
            input.style.cursor = 'not-allowed';
        });
        
        // Ocultar botones de eliminar
        const btnsEliminar = document.querySelectorAll('.delete-btn');
        btnsEliminar.forEach(btn => {
            btn.style.display = 'none';
        });
        
        console.log('🔒 Modo lectura activado en Plazos');
    }
}

// ============================
// CARGAR DATOS
// ============================
window.addEventListener('load', cargarDatos);

async function cargarDatos() {
    try {
        const res = await fetch(`${URL_SERVIDOR}/ampliaciones`);
        const datos = await res.json();
        if (datos.length > 0) {
            // Limpiar tabla antes de cargar
            const tabla = document.getElementById('tablaPlazos');
            tabla.innerHTML = '';
            
            datos.forEach(d => agregarFila(d));
            contador = datos.length + 1;
        }
        recalcularAcumulados();
        
        // Aplicar modo lectura después de cargar los datos
        aplicarModoLectura();
        
    } catch (e) {
        console.error('Error al cargar:', e);
        alert('Error al cargar los datos');
    }
}

// ============================
// AGREGAR FILA
// ============================
document.getElementById('btnAgregarPlazo').addEventListener('click', () => agregarFila());

function agregarFila(dato = null) {
    const tabla = document.getElementById('tablaPlazos');
    // Usar el ID real de la BD o generar uno temporal negativo
    const num = dato ? dato.id : -contador; // Negativo para identificar nuevos
    
    const fila = document.createElement('tr');
    fila.dataset.id = num;
    
    // Formatear fechas correctamente (YYYY-MM-DD)
    let inicioValor = '';
    let finValor = '';
    if (dato) {
        if (dato.inicio) {
            const fechaInicio = new Date(dato.inicio);
            inicioValor = fechaInicio.toISOString().split('T')[0];
        }
        if (dato.fin) {
            const fechaFin = new Date(dato.fin);
            finValor = fechaFin.toISOString().split('T')[0];
        }
    }
    
    fila.innerHTML = `
        <td>${num}</td>
        <td contenteditable="true">${dato ? dato.descripcion || '' : ''}</td>
        <td><input type="date" class="inicio-input" value="${inicioValor}"></td>
        <td><input type="date" class="fin-input" value="${finValor}"></td>
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
// ELIMINAR FILA
// ============================
async function eliminarFila(btn) {
    // Si es usuario de lectura, no permitir
    if (usuarioRol === 'lectura') {
        alert("⚠️ Usuario de solo lectura. No puede eliminar.");
        return;
    }
    
    const fila = btn.closest('tr');
    const id = parseInt(fila.dataset.id);
    
    // Si es un ID negativo (nuevo registro no guardado), solo eliminar visualmente
    if (id < 0) {
        fila.remove();
        recalcularAcumulados();
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar esta ampliación?')) return;
    
    try {
        console.log('Eliminando ID:', id);
        const r = await fetch(`${URL_SERVIDOR}/eliminar-ampliacion/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await r.json();
        console.log('Respuesta:', data);
        
        if (data.success) {
            fila.remove();
            recalcularAcumulados();
            alert('✅ Eliminado correctamente');
        } else {
            alert('❌ Error: ' + (data.message || 'No se pudo eliminar'));
        }
    } catch (e) {
        console.error('Error detallado:', e);
        alert('❌ Error de conexión: ' + e.message);
    }
}

// ============================
// GUARDAR
// ============================
document.getElementById('btnGuardarPlazos').addEventListener('click', guardar);

async function guardar() {
    // Si es usuario de lectura, no permitir
    if (usuarioRol === 'lectura') {
        alert("⚠️ Usuario de solo lectura. No puede guardar cambios.");
        return;
    }
    
    const filas = document.querySelectorAll('#tablaPlazos tr');
    const datos = [];
    
    for (let fila of filas) {
        const id = parseInt(fila.dataset.id);
        const descripcion = fila.cells[1]?.textContent.trim() || '';
        const inicio = fila.querySelector('.inicio-input')?.value || '';
        const fin = fila.querySelector('.fin-input')?.value || '';
        const plazo = parseInt(fila.querySelector('.plazo-input')?.value) || 0;
        const acumulado = parseInt(fila.querySelector('.acumulado-cell')?.textContent) || 0;
        
        // Solo enviar si el ID es positivo (existe en BD) o si es nuevo (negativo)
        datos.push({
            id: (id > 0) ? id : null,
            descripcion: descripcion,
            inicio: inicio,
            fin: fin,
            plazo: plazo,
            acumulado: acumulado
        });
    }
    
    if (!datos.length) { 
        alert('No hay datos para guardar'); 
        return; 
    }
    
    console.log('Enviando datos:', datos);
    
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-ampliaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        
        const resultado = await r.json();
        console.log('Respuesta:', resultado);
        
        if (resultado.success) {
            alert('✅ Guardado correctamente');
            // Recargar para actualizar los IDs
            location.reload();
        } else {
            alert('❌ Error al guardar');
        }
    } catch (e) {
        console.error('Error detallado:', e);
        alert('❌ Error de conexión: ' + e.message);
    }
}

// ============================
// CONTACTOS Y MENÚ
// ============================
function abrirContactos() { 
    document.getElementById("modalContactos").style.display = "flex"; 
}

function cerrarContactos() { 
    document.getElementById("modalContactos").style.display = "none"; 
}

window.addEventListener("click", function(e) { 
    if (e.target === document.getElementById("modalContactos")) cerrarContactos(); 
});

function toggleMenu() {
    const menu = document.querySelector('.menu'), 
          boton = document.querySelector('.menu-hamburguesa');
    if (!menu || !boton) return;
    menu.classList.toggle('activo'); 
    boton.classList.toggle('activo');
    const icono = boton.querySelector('i');
    if (menu.classList.contains('activo')) { 
        icono.classList.remove('fa-bars'); 
        icono.classList.add('fa-times'); 
    } else { 
        icono.classList.remove('fa-times'); 
        icono.classList.add('fa-bars'); 
    }
}