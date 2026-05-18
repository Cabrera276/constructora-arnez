// ============================
// VERIFICAR SESIÓN
// ============================
const usuario = localStorage.getItem("usuario");
if (!usuario) {
    window.location.replace("index.html");
}

// ============================
// VARIABLES GLOBALES
// ============================
let moduloActual = 1;
let ordenCambio = 0;
let contratoMod = 0;
let accionConfirmada = null;
let modoOscuro = false;

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";

// ============================
// TOAST
// ============================
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icono = toast.querySelector('i');
    const texto = toast.querySelector('span');
    texto.textContent = mensaje;
    if (tipo === 'success') { toast.style.background = '#1db954'; icono.className = 'fa fa-check-circle'; }
    else if (tipo === 'error') { toast.style.background = '#ff3b3b'; icono.className = 'fa fa-exclamation-circle'; }
    else if (tipo === 'info') { toast.style.background = '#2d8cff'; icono.className = 'fa fa-info-circle'; }
    else if (tipo === 'warning') { toast.style.background = '#ff9800'; icono.className = 'fa fa-exclamation-triangle'; }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================
// MODO OSCURO
// ============================
function toggleModoOscuro() {
    modoOscuro = !modoOscuro;
    const tabla = document.querySelector('table');
    const boton = document.querySelector('.modo-oscuro-toggle');
    if (modoOscuro) {
        tabla.classList.add('modo-oscuro');
        if (boton) { boton.innerHTML = '<i class="fa fa-sun"></i>'; boton.style.background = '#ffc933'; boton.style.color = '#111'; }
        localStorage.setItem('modoOscuro', 'true');
    } else {
        tabla.classList.remove('modo-oscuro');
        if (boton) { boton.innerHTML = '<i class="fa fa-moon"></i>'; boton.style.background = '#333'; boton.style.color = '#ffc933'; }
        localStorage.setItem('modoOscuro', 'false');
    }
}
function cargarModoOscuro() { if (localStorage.getItem('modoOscuro') === 'true') { modoOscuro = false; toggleModoOscuro(); } }

// ============================
// MODAL
// ============================
function abrirModal(titulo, mensaje, callback) {
    document.getElementById('confirmTitle').innerText = titulo;
    document.getElementById('confirmText').innerText = mensaje;
    document.getElementById('confirmModal').style.display = 'flex';
    accionConfirmada = callback;
}
document.getElementById('cancelBtn').onclick = () => document.getElementById('confirmModal').style.display = 'none';
document.getElementById('acceptBtn').onclick = () => {
    if (accionConfirmada) accionConfirmada();
    document.getElementById('confirmModal').style.display = 'none';
};

// ============================
// FILTRAR
// ============================
function filtrarItems() {
    const input = document.getElementById('buscarItem');
    if (!input) return;
    const busqueda = input.value.toLowerCase();
    document.querySelectorAll('.item-fila').forEach(fila => {
        const desc = fila.querySelector('.descripcion')?.value?.toLowerCase() || '';
        fila.style.display = desc.includes(busqueda) ? '' : 'none';
    });
}

// ============================
// FUNCIONES AUXILIARES
// ============================
function calcularTotalFila(fila) {
    const cantidad = parseFloat(fila.querySelector('.cantidad')?.value) || 0;
    const precio = parseFloat(fila.querySelector('.precio')?.value) || 0;
    const total = cantidad * precio;
    const totalCell = fila.querySelector('.total-fila');
    if (totalCell) totalCell.innerText = total.toFixed(2);
    return total;
}

function actualizarTotalOC(fila, index) {
    const inputCant = fila.querySelector(`.oc-cant-${index}`);
    const inputPu = fila.querySelector(`.oc-pu-${index}`);
    const totalSpan = fila.querySelector(`.oc-total-${index}`);
    
    if (inputCant && inputPu && totalSpan) {
        const cantidad = parseFloat(inputCant.value) || 0;
        const precio = parseFloat(inputPu.value) || 0;
        totalSpan.innerText = (cantidad * precio).toFixed(2);
    }
    actualizarTodosLosTotales();
}

function actualizarTotalCM(fila, index) {
    const inputCant = fila.querySelector(`.cm-cant-${index}`);
    const inputPu = fila.querySelector(`.cm-pu-${index}`);
    const totalSpan = fila.querySelector(`.cm-total-${index}`);
    
    if (inputCant && inputPu && totalSpan) {
        const cantidad = parseFloat(inputCant.value) || 0;
        const precio = parseFloat(inputPu.value) || 0;
        totalSpan.innerText = (cantidad * precio).toFixed(2);
    }
    actualizarTodosLosTotales();
}

function actualizarTodosLosTotales() {
    let totalGeneral = 0;
    document.querySelectorAll('.item-fila').forEach(item => {
        const total = calcularTotalFila(item);
        totalGeneral += total;
    });
    
    const tfoot = document.querySelector('tfoot tr');
    if (tfoot) {
        const totalCell = tfoot.querySelector('td:nth-child(7)');
        if (totalCell) totalCell.innerHTML = `<strong>${totalGeneral.toFixed(2)}</strong>`;
    }
    
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.moduloId;
        let totalModulo = 0;
        document.querySelectorAll(`.item-fila[data-modulo-padre="${moduloId}"]`).forEach(item => {
            totalModulo += parseFloat(item.querySelector('.total-fila')?.innerText) || 0;
        });
        const totalRow = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
        if (totalRow) {
            const totalCell = totalRow.querySelector('.total-modulo-valor');
            if (totalCell) totalCell.innerText = totalModulo.toFixed(2);
        }
    });
}

function actualizarContadores() {
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.moduloId;
        const items = document.querySelectorAll(`.item-fila[data-modulo-padre="${moduloId}"]`);
        const badge = modulo.querySelector('.badge-items');
        if (badge) badge.textContent = `${items.length} ítems`;
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================
// FUNCIONES GLOBALES (onclick)
// ============================
window.toggleModulo = function(el, moduloId) {
    const flecha = el.querySelector('i');
    if (!flecha) return;
    const ocultar = !flecha.classList.contains('colapsado');
    document.querySelectorAll(`.item-fila[data-modulo-padre="${moduloId}"]`).forEach(item => {
        item.style.display = ocultar ? 'none' : '';
    });
    const total = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (total) total.style.display = ocultar ? 'none' : '';
    ocultar ? flecha.classList.add('colapsado') : flecha.classList.remove('colapsado');
};

window.editarModulo = function(btn) {
    const span = btn.closest('.modulo-row').querySelector('.modulo-nombre');
    if (span) {
        span.contentEditable = true;
        span.focus();
    }
};

window.eliminarModulo = function(btn) {
    abrirModal('Eliminar módulo', '¿Eliminar módulo y todos sus ítems?', () => {
        const filaModulo = btn.closest('tr');
        const moduloId = filaModulo.dataset.moduloId;
        document.querySelectorAll(`.item-fila[data-modulo-padre="${moduloId}"]`).forEach(fila => fila.remove());
        filaModulo.remove();
        document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`)?.remove();
        actualizarTodosLosTotales();
        actualizarContadores();
        mostrarToast('🗑 Módulo eliminado', 'info');
    });
};

window.editarFila = async function(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;
    if (!id) {
        mostrarToast('⚠️ Guarda el ítem primero', 'warning');
        return;
    }
    
    const moduloPadre = fila.dataset.moduloPadre;
    const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
    
    const numeroItem = fila.querySelector('.numero-item')?.value;
    const descripcion = fila.querySelector('.descripcion')?.value;
    const unidad = fila.querySelector('.unidad')?.value;
    const cantidad = parseFloat(fila.querySelector('.cantidad')?.value) || 0;
    const precio = parseFloat(fila.querySelector('.precio')?.value) || 0;
    const total = parseFloat(fila.querySelector('.total-fila')?.innerText) || 0;
    const porcentaje = parseFloat(fila.querySelector('.porcentaje')?.value) || 0;
    
    let ocs = [];
    for (let i = 0; i < ordenCambio; i++) {
        ocs.push({
            numero: i + 1,
            cantidad: parseFloat(fila.querySelector(`.oc-cant-${i}`)?.value) || 0,
            precio: parseFloat(fila.querySelector(`.oc-pu-${i}`)?.value) || 0,
            total: parseFloat(fila.querySelector(`.oc-total-${i}`)?.innerText) || 0
        });
    }
    
    let cms = [];
    for (let i = 0; i < contratoMod; i++) {
        cms.push({
            numero: i + 1,
            cantidad: parseFloat(fila.querySelector(`.cm-cant-${i}`)?.value) || 0,
            precio: parseFloat(fila.querySelector(`.cm-pu-${i}`)?.value) || 0,
            total: parseFloat(fila.querySelector(`.cm-total-${i}`)?.innerText) || 0
        });
    }
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/editar-item/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                modulo_id: moduloNombre,
                item_numero: numeroItem,
                descripcion: descripcion,
                unidad: unidad,
                cantidad: cantidad,
                precio_unitario: precio,
                total: total,
                ordenesCambio: ocs,
                contratosMod: cms,
                porcentaje_incidencia: porcentaje
            })
        });
        const data = await response.json();
        if (data.success) mostrarToast('✅ Actualizado', 'success');
        else mostrarToast('❌ Error', 'error');
    } catch (e) {
        mostrarToast('❌ Error de conexión', 'error');
    }
};

window.eliminarFila = async function(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;
    
    abrirModal('Eliminar ítem', '¿Estás seguro?', async () => {
        if (id) {
            try {
                await fetch(`${URL_SERVIDOR}/eliminar-item/${id}`, { method: 'DELETE' });
            } catch (e) { }
        }
        fila.remove();
        actualizarTodosLosTotales();
        actualizarContadores();
        mostrarToast('🗑 Eliminado', 'info');
    });
};

window.eliminarOC = function() {
    if (ordenCambio <= 0) {
        mostrarToast('⚠️ No hay OC', 'warning');
        return;
    }
    
    abrirModal('Eliminar OC', `¿Eliminar OC Nº${ordenCambio}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');
        
        filaPrincipal.children[filaPrincipal.children.length - 3].remove();
        for (let i = 0; i < 3; i++) {
            filaSecundaria.lastElementChild.remove();
        }
        
        document.querySelectorAll('.item-fila').forEach(fila => {
            const accionesCell = fila.querySelector('.acciones-cell');
            if (accionesCell) {
                for (let i = 0; i < 3; i++) {
                    const prev = accionesCell.previousSibling;
                    if (prev) prev.remove();
                }
            }
        });
        
        ordenCambio--;
        
        const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
        document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
            if (td.getAttribute('colspan')) {
                td.setAttribute('colspan', totalColumnas);
            }
        });
        
        actualizarTodosLosTotales();
        mostrarToast('🗑 OC eliminada', 'info');
    });
};

window.eliminarCM = function() {
    if (contratoMod <= 0) {
        mostrarToast('⚠️ No hay CM', 'warning');
        return;
    }
    
    abrirModal('Eliminar CM', `¿Eliminar CM Nº${contratoMod}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');
        
        filaPrincipal.children[filaPrincipal.children.length - 3].remove();
        for (let i = 0; i < 3; i++) {
            filaSecundaria.lastElementChild.remove();
        }
        
        document.querySelectorAll('.item-fila').forEach(fila => {
            const accionesCell = fila.querySelector('.acciones-cell');
            if (accionesCell) {
                for (let i = 0; i < 3; i++) {
                    const prev = accionesCell.previousSibling;
                    if (prev) prev.remove();
                }
            }
        });
        
        contratoMod--;
        
        const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
        document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
            if (td.getAttribute('colspan')) {
                td.setAttribute('colspan', totalColumnas);
            }
        });
        
        actualizarTodosLosTotales();
        mostrarToast('🗑 CM eliminado', 'info');
    });
};

// ============================
// BOTONES PRINCIPALES
// ============================
document.getElementById('btnModulo').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
    
    const fm = document.createElement('tr');
    fm.classList.add('grupo-modulo');
    fm.dataset.moduloId = moduloActual;
    fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row">
        <div class="modulo-content">
            <div style="display:flex;align-items:center;gap:10px">
                <span class="toggle-modulo" onclick="toggleModulo(this, ${moduloActual})">
                    <i class="fa fa-chevron-down"></i>
                </span>
                <span contenteditable="true" class="modulo-nombre">MÓDULO ${String(moduloActual).padStart(2, '0')}</span>
                <span class="badge-items">0 ítems</span>
            </div>
            <div class="table-actions">
                <button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button>
                <button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    </td>`;
    tabla.appendChild(fm);
    
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.moduloPadre = moduloActual;
    ft.innerHTML = `<td colspan="6"><strong>TOTAL MÓDULO</strong></td>
                    <td class="total-modulo-valor">0.00</td>
                    <td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 1}"></td>`;
    tabla.appendChild(ft);
    
    moduloActual++;
    actualizarContadores();
    mostrarToast('✅ Módulo creado', 'success');
});

document.getElementById('btnItem').addEventListener('click', () => {
    const modulos = document.querySelectorAll('.grupo-modulo');
    if (modulos.length === 0) {
        mostrarToast('⚠️ Primero crea un módulo', 'warning');
        return;
    }
    
    let moduloActivo = null;
    for (let modulo of modulos) {
        const flecha = modulo.querySelector('.toggle-modulo i');
        if (flecha && !flecha.classList.contains('colapsado')) {
            moduloActivo = modulo;
            break;
        }
    }
    if (!moduloActivo) moduloActivo = modulos[0];
    
    const moduloId = moduloActivo.dataset.moduloId;
    const moduloNombre = moduloActivo.querySelector('.modulo-nombre')?.innerText;
    
    let colOC = '';
    for (let i = 0; i < ordenCambio; i++) {
        colOC += `<td><input type="number" class="oc-cant-${i}" value="0" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center;"></td>
                  <td><input type="number" class="oc-pu-${i}" value="0" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center;"></td>
                  <td class="oc-total-${i}">0.00</td>`;
    }
    let colCM = '';
    for (let i = 0; i < contratoMod; i++) {
        colCM += `<td><input type="number" class="cm-cant-${i}" value="0" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center;"></td>
                  <td><input type="number" class="cm-pu-${i}" value="0" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center;"></td>
                  <td class="cm-total-${i}">0.00</td>`;
    }
    
    const fila = document.createElement('tr');
    fila.className = 'item-fila';
    fila.dataset.moduloPadre = moduloId;
    fila.innerHTML = `
        <td><input type="text" class="numero-item" value="" placeholder="N°" style="width:60px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
        <td><input type="text" class="descripcion" value="" placeholder="Descripción" style="width:200px; padding:6px; border-radius:6px; border:1px solid #ccc;"></td>
        <td><input type="text" class="unidad" value="" placeholder="Unidad" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
        <td><input type="number" class="cantidad" value="0" step="any" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
        <td><input type="number" class="precio" value="0" step="any" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
        <td class="total-fila">0.00</td>
        ${colOC}
        ${colCM}
        <td><input type="number" class="porcentaje" value="0" step="any" style="width:60px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
        <td class="acciones-cell">
            <div class="table-actions">
                <button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button>
                <button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button>
            </div>
        </td>
    `;
    
    const cantidadInput = fila.querySelector('.cantidad');
    const precioInput = fila.querySelector('.precio');
    cantidadInput.addEventListener('input', () => calcularTotalFila(fila));
    precioInput.addEventListener('input', () => calcularTotalFila(fila));
    
    for (let i = 0; i < ordenCambio; i++) {
        const cantOC = fila.querySelector(`.oc-cant-${i}`);
        const puOC = fila.querySelector(`.oc-pu-${i}`);
        if (cantOC) cantOC.addEventListener('input', () => actualizarTotalOC(fila, i));
        if (puOC) puOC.addEventListener('input', () => actualizarTotalOC(fila, i));
    }
    
    for (let i = 0; i < contratoMod; i++) {
        const cantCM = fila.querySelector(`.cm-cant-${i}`);
        const puCM = fila.querySelector(`.cm-pu-${i}`);
        if (cantCM) cantCM.addEventListener('input', () => actualizarTotalCM(fila, i));
        if (puCM) puCM.addEventListener('input', () => actualizarTotalCM(fila, i));
    }
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (totalModulo) {
        totalModulo.parentNode.insertBefore(fila, totalModulo);
    } else {
        document.getElementById('tablaItems').appendChild(fila);
    }
    
    actualizarTodosLosTotales();
    actualizarContadores();
    mostrarToast(`✅ Ítem agregado al ${moduloNombre}`, 'success');
});

document.getElementById('btnOC').addEventListener('click', () => { 
    ordenCambio++; 
    agregarColumna(`ORDEN CAMBIO Nº${ordenCambio}`, 'OC'); 
});

document.getElementById('btnCM').addEventListener('click', () => { 
    contratoMod++; 
    agregarColumna(`CONTRATO MOD Nº${contratoMod}`, 'CM'); 
});

// ============================
// FUNCIÓN PRINCIPAL CORREGIDA
// ============================
function agregarColumna(titulo, tipo) {
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    
    const g = document.createElement('th');
    g.colSpan = 3;
    g.innerText = titulo;
    fp.insertBefore(g, fp.children[fp.children.length - 2]);
    
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => {
        const th = document.createElement('th');
        th.innerText = t;
        fs.appendChild(th);
    });
    
    const nuevoIndice = (tipo === 'OC' ? ordenCambio : contratoMod) - 1;
    
    document.querySelectorAll('.item-fila').forEach(fila => {
        const accionesCell = fila.querySelector('.acciones-cell');
        
        // Crear input CANTIDAD
        const tdCant = document.createElement('td');
        const inputCant = document.createElement('input');
        inputCant.type = 'number';
        inputCant.className = tipo === 'OC' ? `oc-cant-${nuevoIndice}` : `cm-cant-${nuevoIndice}`;
        inputCant.value = '0';
        inputCant.step = 'any';
        inputCant.style.cssText = 'width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;';
        tdCant.appendChild(inputCant);
        
        // Crear input P.U.
        const tdPu = document.createElement('td');
        const inputPu = document.createElement('input');
        inputPu.type = 'number';
        inputPu.className = tipo === 'OC' ? `oc-pu-${nuevoIndice}` : `cm-pu-${nuevoIndice}`;
        inputPu.value = '0';
        inputPu.step = 'any';
        inputPu.style.cssText = 'width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;';
        tdPu.appendChild(inputPu);
        
        // Celda TOTAL
        const tdTotal = document.createElement('td');
        tdTotal.className = tipo === 'OC' ? `oc-total-${nuevoIndice}` : `cm-total-${nuevoIndice}`;
        tdTotal.innerText = '0.00';
        
        fila.insertBefore(tdTotal, accionesCell);
        fila.insertBefore(tdPu, accionesCell);
        fila.insertBefore(tdCant, accionesCell);
        
        // Evento para calcular TOTAL
        const update = () => {
            const cant = parseFloat(inputCant.value) || 0;
            const pu = parseFloat(inputPu.value) || 0;
            tdTotal.innerText = (cant * pu).toFixed(2);
            actualizarTodosLosTotales();
        };
        
        inputCant.addEventListener('input', update);
        inputPu.addEventListener('input', update);
        
        // FORZAR QUE EL INPUT SEA EDITABLE
        inputPu.click();
        inputPu.focus();
        inputPu.select();
    });
    
    const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
    document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
        if (td.getAttribute('colspan')) {
            td.setAttribute('colspan', totalColumnas);
        }
    });
    
    mostrarToast(`✅ ${titulo} agregado`, 'success');
}
// ============================
// GUARDAR DATOS
// ============================
document.getElementById("btnGuardar").addEventListener("click", guardarDatos);

async function guardarDatos() {
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    try {
        const items = [];
        const filas = document.querySelectorAll('.item-fila');
        
        for (const fila of filas) {
            const moduloPadre = fila.dataset.moduloPadre;
            const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
            
            const numeroItem = fila.querySelector('.numero-item')?.value;
            const descripcion = fila.querySelector('.descripcion')?.value;
            const unidad = fila.querySelector('.unidad')?.value;
            const cantidad = parseFloat(fila.querySelector('.cantidad')?.value) || 0;
            const precio = parseFloat(fila.querySelector('.precio')?.value) || 0;
            const total = parseFloat(fila.querySelector('.total-fila')?.innerText) || 0;
            const porcentaje = parseFloat(fila.querySelector('.porcentaje')?.value) || 0;
            
            if (!descripcion) continue;
            
            let ocs = [];
            for (let i = 0; i < ordenCambio; i++) {
                ocs.push({
                    numero: i + 1,
                    cantidad: parseFloat(fila.querySelector(`.oc-cant-${i}`)?.value) || 0,
                    precio: parseFloat(fila.querySelector(`.oc-pu-${i}`)?.value) || 0,
                    total: parseFloat(fila.querySelector(`.oc-total-${i}`)?.innerText) || 0
                });
            }
            
            let cms = [];
            for (let i = 0; i < contratoMod; i++) {
                cms.push({
                    numero: i + 1,
                    cantidad: parseFloat(fila.querySelector(`.cm-cant-${i}`)?.value) || 0,
                    precio: parseFloat(fila.querySelector(`.cm-pu-${i}`)?.value) || 0,
                    total: parseFloat(fila.querySelector(`.cm-total-${i}`)?.innerText) || 0
                });
            }
            
            items.push({
                modulo_id: moduloNombre,
                item_numero: numeroItem,
                descripcion: descripcion,
                unidad: unidad,
                cantidad: cantidad,
                precio_unitario: precio,
                total: total,
                ordenesCambio: ocs,
                contratosMod: cms,
                porcentaje_incidencia: porcentaje,
                id: fila.dataset.id
            });
        }
        
        if (items.length === 0) {
            mostrarToast('⚠️ No hay datos para guardar', 'warning');
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        const response = await fetch(`${URL_SERVIDOR}/guardar-items-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`✅ ${items.length} ítems guardados`, 'success');
            await cargarItems();
        } else {
            mostrarToast('❌ Error al guardar', 'error');
        }
        
    } catch (e) {
        mostrarToast('❌ Error de conexión', 'error');
        console.error(e);
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ============================
// CARGAR ÍTEMS DESDE BD
// ============================
async function cargarItems() {
    try {
        const [resItems, resOC, resCM] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`),
            fetch(`${URL_SERVIDOR}/contratos-mod`)
        ]);
        
        let items = await resItems.json();
        const ocdb = await resOC.json();
        const cmdb = await resCM.json();
        
        const tabla = document.getElementById('tablaItems');
        tabla.innerHTML = '';
        
        if (!items || items.length === 0) {
            console.log('No hay items para cargar');
            return;
        }
        
        const itemsPorModulo = {};
        items.forEach(item => {
            const moduloNombre = String(item.modulo_id || 'Sin módulo').trim();
            if (!itemsPorModulo[moduloNombre]) {
                itemsPorModulo[moduloNombre] = [];
            }
            itemsPorModulo[moduloNombre].push(item);
        });
        
        let moduloCounter = 1;
        
        for (const [moduloNombre, itemsDelModulo] of Object.entries(itemsPorModulo)) {
            const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
            const fm = document.createElement('tr');
            fm.classList.add('grupo-modulo');
            fm.dataset.moduloId = moduloCounter;
            fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row">
                <div class="modulo-content">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span class="toggle-modulo" onclick="toggleModulo(this, ${moduloCounter})">
                            <i class="fa fa-chevron-down"></i>
                        </span>
                        <span contenteditable="true" class="modulo-nombre">${escapeHtml(moduloNombre)}</span>
                        <span class="badge-items">0 ítems</span>
                    </div>
                    <div class="table-actions">
                        <button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button>
                        <button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            </td>`;
            tabla.appendChild(fm);
            
            itemsDelModulo.forEach(item => {
                let colOC = '';
                for (let i = 0; i < ordenCambio; i++) {
                    const oc = ocdb.find(o => o.item_id === item.id && o.numero_oc === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colOC += `<td><input type="number" class="oc-cant-${i}" value="${oc.cantidad}" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;"></td>
                              <td><input type="number" class="oc-pu-${i}" value="${oc.precio}" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;"></td>
                              <td class="oc-total-${i}">${oc.total}</td>`;
                }
                
                let colCM = '';
                for (let i = 0; i < contratoMod; i++) {
                    const cm = cmdb.find(o => o.item_id === item.id && o.numero_cm === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colCM += `<td><input type="number" class="cm-cant-${i}" value="${cm.cantidad}" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;"></td>
                              <td><input type="number" class="cm-pu-${i}" value="${cm.precio}" step="any" style="width:80px; padding:6px; border:1px solid #ccc; border-radius:6px; text-align:center; background:white; color:black;"></td>
                              <td class="cm-total-${i}">${cm.total}</td>`;
                }
                
                const fila = document.createElement('tr');
                fila.className = 'item-fila';
                fila.dataset.id = item.id;
                fila.dataset.moduloPadre = moduloCounter;
                fila.innerHTML = `
                    <td><input type="text" class="numero-item" value="${escapeHtml(item.item_numero || '')}" placeholder="N°" style="width:60px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
                    <td><input type="text" class="descripcion" value="${escapeHtml(item.descripcion || '')}" placeholder="Descripción" style="width:200px; padding:6px; border-radius:6px; border:1px solid #ccc;"></td>
                    <td><input type="text" class="unidad" value="${escapeHtml(item.unidad || '')}" placeholder="Unidad" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
                    <td><input type="number" class="cantidad" value="${item.cantidad || 0}" step="any" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
                    <td><input type="number" class="precio" value="${item.precio_unitario || 0}" step="any" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
                    <td class="total-fila">${item.total || 0}</td>
                    ${colOC}
                    ${colCM}
                    <td><input type="number" class="porcentaje" value="${item.porcentaje_incidencia || 0}" step="any" style="width:60px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center;"></td>
                    <td class="acciones-cell">
                        <div class="table-actions">
                            <button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button>
                            <button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button>
                        </div>
                    </td>
                `;
                
                const cantidadInput = fila.querySelector('.cantidad');
                const precioInput = fila.querySelector('.precio');
                cantidadInput.addEventListener('input', () => calcularTotalFila(fila));
                precioInput.addEventListener('input', () => calcularTotalFila(fila));
                
                for (let i = 0; i < ordenCambio; i++) {
                    const cantOC = fila.querySelector(`.oc-cant-${i}`);
                    const puOC = fila.querySelector(`.oc-pu-${i}`);
                    if (cantOC) cantOC.addEventListener('input', () => actualizarTotalOC(fila, i));
                    if (puOC) puOC.addEventListener('input', () => actualizarTotalOC(fila, i));
                }
                
                for (let i = 0; i < contratoMod; i++) {
                    const cantCM = fila.querySelector(`.cm-cant-${i}`);
                    const puCM = fila.querySelector(`.cm-pu-${i}`);
                    if (cantCM) cantCM.addEventListener('input', () => actualizarTotalCM(fila, i));
                    if (puCM) puCM.addEventListener('input', () => actualizarTotalCM(fila, i));
                }
                
                tabla.appendChild(fila);
            });
            
            const ft = document.createElement('tr');
            ft.classList.add('total-modulo');
            ft.dataset.moduloPadre = moduloCounter;
            ft.innerHTML = `<td colspan="6"><strong>TOTAL MÓDULO</strong></td>
                            <td class="total-modulo-valor">0.00</td>
                            <td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 1}"></td>`;
            tabla.appendChild(ft);
            
            moduloCounter++;
        }
        
        actualizarTodosLosTotales();
        actualizarContadores();
        moduloActual = moduloCounter;
        
    } catch (e) {
        console.error('Error cargando items:', e);
        mostrarToast('❌ Error al cargar datos', 'error');
    }
}

// ============================
// CONTACTOS
// ============================
function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", function(e) { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

// ============================
// MENÚ HAMBURGUESA
// ============================
function toggleMenu() {
    const menu = document.querySelector('.menu');
    const boton = document.querySelector('.menu-hamburguesa');
    if (!menu || !boton) return;
    menu.classList.toggle('activo');
    const icono = boton.querySelector('i');
    if (menu.classList.contains('activo')) {
        icono.classList.remove('fa-bars');
        icono.classList.add('fa-times');
    } else {
        icono.classList.remove('fa-times');
        icono.classList.add('fa-bars');
    }
}

document.querySelectorAll('.menu a').forEach(enlace => {
    enlace.addEventListener('click', () => {
        const menu = document.querySelector('.menu');
        const boton = document.querySelector('.menu-hamburguesa');
        if (menu && boton && menu.classList.contains('activo')) {
            menu.classList.remove('activo');
            const icono = boton.querySelector('i');
            if (icono) {
                icono.classList.remove('fa-times');
                icono.classList.add('fa-bars');
            }
        }
    });
});

// ============================
// CERRAR CON ESC
// ============================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('confirmModal').style.display = 'none';
        document.getElementById('modalContactos').style.display = 'none';
    }
});

// ============================
// INICIAR
// ============================
window.addEventListener('load', () => {
    cargarItems();
    cargarModoOscuro();
    console.log('🚀 Sistema cargado - P.U. con input type number CORREGIDO');
});