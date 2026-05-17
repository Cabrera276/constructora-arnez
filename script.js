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
    document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
        const descText = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        fila.style.display = descText.includes(busqueda) ? '' : 'none';
    });
}

// ============================
// COLAPSAR MÓDULO
// ============================
function toggleModulo(moduloId, el) {
    const flecha = el.querySelector('i');
    if (!flecha) return;
    const ocultar = !flecha.classList.contains('colapsado');
    document.querySelectorAll(`tr[data-modulo-padre="${moduloId}"]`).forEach(item => item.style.display = ocultar ? 'none' : '');
    const total = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (total) total.style.display = ocultar ? 'none' : '';
    ocultar ? flecha.classList.add('colapsado') : flecha.classList.remove('colapsado');
}

// ============================
// ACTUALIZAR TOTAL DE UNA FILA (Contrato Original)
// ============================
function actualizarTotalFila(fila) {
    const cantidad = parseFloat(fila.querySelector('.cantidad')?.innerText) || 0;
    const precio = parseFloat(fila.querySelector('.precio')?.innerText) || 0;
    const total = cantidad * precio;
    const totalCell = fila.querySelector('.total-fila');
    if (totalCell) totalCell.innerText = total.toFixed(2);
    actualizarTotalesGenerales();
}

// ============================
// ACTUALIZAR TOTAL DE OC
// ============================
function actualizarTotalOC(fila, index) {
    const cantidad = parseFloat(fila.querySelector(`.oc-cant-${index}`)?.innerText) || 0;
    const precio = parseFloat(fila.querySelector(`.oc-pu-${index}`)?.innerText) || 0;
    const total = cantidad * precio;
    const totalCell = fila.querySelector(`.oc-total-${index}`);
    if (totalCell) totalCell.innerText = total.toFixed(2);
    actualizarTotalesGenerales();
}

// ============================
// ACTUALIZAR TOTAL DE CM
// ============================
function actualizarTotalCM(fila, index) {
    const cantidad = parseFloat(fila.querySelector(`.cm-cant-${index}`)?.innerText) || 0;
    const precio = parseFloat(fila.querySelector(`.cm-pu-${index}`)?.innerText) || 0;
    const total = cantidad * precio;
    const totalCell = fila.querySelector(`.cm-total-${index}`);
    if (totalCell) totalCell.innerText = total.toFixed(2);
    actualizarTotalesGenerales();
}

// ============================
// CONFIGURAR CELDAS EDITABLES
// ============================
function hacerEditable(celda, evento) {
    if (!celda) return;
    celda.setAttribute('contenteditable', 'true');
    celda.style.cursor = 'text';
    celda.removeEventListener('input', evento);
    celda.removeEventListener('blur', evento);
    celda.addEventListener('input', evento);
    celda.addEventListener('blur', evento);
}

// ============================
// CONFIGURAR EVENTOS DE UNA FILA
// ============================
function configurarEventosFila(fila) {
    // Contrato Original
    const cantidadCell = fila.querySelector('.cantidad');
    const precioCell = fila.querySelector('.precio');
    
    hacerEditable(cantidadCell, () => actualizarTotalFila(fila));
    hacerEditable(precioCell, () => actualizarTotalFila(fila));
    
    // OC
    for (let i = 0; i < ordenCambio; i++) {
        const ocCant = fila.querySelector(`.oc-cant-${i}`);
        const ocPu = fila.querySelector(`.oc-pu-${i}`);
        hacerEditable(ocCant, () => actualizarTotalOC(fila, i));
        hacerEditable(ocPu, () => actualizarTotalOC(fila, i));
    }
    
    // CM
    for (let i = 0; i < contratoMod; i++) {
        const cmCant = fila.querySelector(`.cm-cant-${i}`);
        const cmPu = fila.querySelector(`.cm-pu-${i}`);
        hacerEditable(cmCant, () => actualizarTotalCM(fila, i));
        hacerEditable(cmPu, () => actualizarTotalCM(fila, i));
    }
    
    // Porcentaje
    const porcentajeCell = fila.querySelector('.porcentaje');
    hacerEditable(porcentajeCell, () => actualizarTotalesGenerales());
}

// ============================
// ACTUALIZAR CONTADORES DE MÓDULO
// ============================
function actualizarContadores() {
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.moduloId;
        const items = document.querySelectorAll(`tr[data-modulo-padre="${moduloId}"]`);
        const badge = modulo.querySelector('.badge-items');
        if (badge) badge.textContent = `${items.length} ítems`;
    });
}

// ============================
// ACTUALIZAR TOTALES GENERALES
// ============================
function actualizarTotalesGenerales() {
    const items = document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)');
    let totalGeneral = 0;
    let totalesPorModulo = {};
    
    items.forEach(item => {
        const moduloPadre = item.dataset.moduloPadre;
        const totalItem = parseFloat(item.querySelector('.total-fila')?.innerText) || 0;
        
        if (!totalesPorModulo[moduloPadre]) totalesPorModulo[moduloPadre] = 0;
        totalesPorModulo[moduloPadre] += totalItem;
        totalGeneral += totalItem;
    });
    
    document.querySelectorAll('.total-modulo').forEach(totalMod => {
        const moduloPadre = totalMod.dataset.moduloPadre;
        const totalModulo = totalesPorModulo[moduloPadre] || 0;
        const totalCell = totalModulo.querySelector('td:nth-child(2)');
        if (totalCell) totalCell.innerText = totalModulo.toFixed(2);
    });
    
    const tfoot = document.querySelector('tfoot tr');
    if (tfoot) {
        const totalCell = tfoot.querySelector('td:nth-child(2)');
        if (totalCell) totalCell.innerHTML = `<strong>${totalGeneral.toFixed(2)}</strong>`;
    }
    
    actualizarContadores();
}

// ============================
// AÑADIR MÓDULO
// ============================
document.getElementById('btnModulo').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    const totalColumnas = 9 + (ordenCambio * 3) + (contratoMod * 3);
    
    const fm = document.createElement('tr');
    fm.classList.add('grupo-modulo');
    fm.dataset.moduloId = moduloActual;
    fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${moduloActual}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true" class="modulo-nombre">MÓDULO ${String(moduloActual).padStart(2, '0')}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button></div></div></div></td>`;
    tabla.appendChild(fm);
    
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.moduloPadre = moduloActual;
    ft.innerHTML = `<td colspan="6"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
    tabla.appendChild(ft);
    
    moduloActual++;
    actualizarContadores();
    mostrarToast('✅ Módulo creado', 'success');
});

// ============================
// EDITAR MÓDULO
// ============================
function editarModulo(btn) { 
    const span = btn.closest('.modulo-row').querySelector('.modulo-nombre'); 
    if (span) { 
        span.contentEditable = true; 
        span.focus(); 
    } 
}

// ============================
// ELIMINAR MÓDULO
// ============================
function eliminarModulo(btn) {
    abrirModal('Eliminar módulo', '¿Eliminar módulo y todos sus ítems?', () => {
        const filaModulo = btn.closest('tr');
        const moduloId = filaModulo.dataset.moduloId;
        
        document.querySelectorAll(`tr[data-modulo-padre="${moduloId}"]`).forEach(fila => fila.remove());
        filaModulo.remove();
        document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`)?.remove();
        
        actualizarTotalesGenerales();
        actualizarContadores();
        mostrarToast('🗑 Módulo eliminado', 'info');
    });
}

// ============================
// AÑADIR ÍTEM
// ============================
document.getElementById('btnItem').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
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
    
    // Contar items actuales para el número secuencial
    const itemsActuales = document.querySelectorAll(`tr[data-modulo-padre="${moduloId}"]`);
    const nuevoNumero = itemsActuales.length + 1;
    
    let colOC = '';
    for (let i = 0; i < ordenCambio; i++) {
        colOC += `
            <td class="oc-cant-${i}" style="cursor:text;">0</td>
            <td class="oc-pu-${i}" style="cursor:text;">0</td>
            <td class="oc-total-${i}">0.00</td>
        `;
    }
    
    let colCM = '';
    for (let i = 0; i < contratoMod; i++) {
        colCM += `
            <td class="cm-cant-${i}" style="cursor:text;">0</td>
            <td class="cm-pu-${i}" style="cursor:text;">0</td>
            <td class="cm-total-${i}">0.00</td>
        `;
    }
    
    const fila = document.createElement('tr');
    fila.dataset.moduloPadre = moduloId;
    fila.innerHTML = `
        <td class="numero-item" style="cursor:text;">${nuevoNumero}</td>
        <td contenteditable="true" class="descripcion" style="cursor:text;">?</td>
        <td contenteditable="true" class="unidad" style="cursor:text;">?</td>
        <td class="cantidad" style="cursor:text;">0</td>
        <td class="precio" style="cursor:text;">0</td>
        <td class="total-fila">0.00</td>
        ${colOC}
        ${colCM}
        <td contenteditable="true" class="porcentaje" style="cursor:text;">0</td>
        <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
    `;
    
    configurarEventosFila(fila);
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (totalModulo) {
        tabla.insertBefore(fila, totalModulo);
    } else {
        tabla.appendChild(fila);
    }
    
    actualizarTotalesGenerales();
    actualizarContadores();
    mostrarToast('✅ Ítem agregado', 'success');
});

// ============================
// AÑADIR OC / CM
// ============================
document.getElementById('btnOC').addEventListener('click', () => { 
    ordenCambio++; 
    agregarColumna(`ORDEN CAMBIO Nº${ordenCambio}`, 'OC'); 
});
document.getElementById('btnCM').addEventListener('click', () => { 
    contratoMod++; 
    agregarColumna(`CONTRATO MOD Nº${contratoMod}`, 'CM'); 
});

function agregarColumna(titulo, tipo) {
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    const g = document.createElement('th'); 
    g.colSpan = 3; 
    g.innerText = titulo;
    fp.insertBefore(g, fp.children[fp.children.length - 2]);
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => { const th = document.createElement('th'); th.innerText = t; fs.appendChild(th); });
    
    const nuevoIndice = tipo === 'OC' ? ordenCambio - 1 : contratoMod - 1;
    
    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.classList.contains('grupo-modulo') && !fila.classList.contains('total-modulo')) {
            const accionesCell = fila.querySelector('.acciones-cell');
            
            const tdCant = document.createElement('td');
            tdCant.className = tipo === 'OC' ? `oc-cant-${nuevoIndice}` : `cm-cant-${nuevoIndice}`;
            tdCant.innerText = '0';
            tdCant.style.cursor = 'text';
            
            const tdPu = document.createElement('td');
            tdPu.className = tipo === 'OC' ? `oc-pu-${nuevoIndice}` : `cm-pu-${nuevoIndice}`;
            tdPu.innerText = '0';
            tdPu.style.cursor = 'text';
            
            const tdTotal = document.createElement('td');
            tdTotal.className = tipo === 'OC' ? `oc-total-${nuevoIndice}` : `cm-total-${nuevoIndice}`;
            tdTotal.innerText = '0.00';
            
            fila.insertBefore(tdTotal, accionesCell);
            fila.insertBefore(tdPu, accionesCell);
            fila.insertBefore(tdCant, accionesCell);
            
            if (tipo === 'OC') {
                hacerEditable(tdCant, () => actualizarTotalOC(fila, nuevoIndice));
                hacerEditable(tdPu, () => actualizarTotalOC(fila, nuevoIndice));
            } else {
                hacerEditable(tdCant, () => actualizarTotalCM(fila, nuevoIndice));
                hacerEditable(tdPu, () => actualizarTotalCM(fila, nuevoIndice));
            }
        }
    });
    
    const totalColumnas = 9 + (ordenCambio * 3) + (contratoMod * 3);
    document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
        if (td.getAttribute('colspan')) {
            td.setAttribute('colspan', totalColumnas);
        }
    });
    
    mostrarToast(`✅ ${titulo} agregado`, 'success');
}

// ============================
// EDITAR ÍTEM (ENVIAR A BD)
// ============================
async function editarFila(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;
    
    if (!id) { 
        mostrarToast('⚠️ Guarda el ítem primero', 'warning'); 
        return;
    }
    
    const moduloPadre = fila.dataset.moduloPadre;
    const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
    const numeroItem = fila.querySelector('.numero-item')?.innerText;
    const descripcion = fila.querySelector('.descripcion')?.innerText;
    const unidad = fila.querySelector('.unidad')?.innerText;
    const cantidad = parseFloat(fila.querySelector('.cantidad')?.innerText) || 0;
    const precio = parseFloat(fila.querySelector('.precio')?.innerText) || 0;
    const total = parseFloat(fila.querySelector('.total-fila')?.innerText) || 0;
    
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
                total: total 
            }) 
        });
        const data = await response.json();
        if (data.success) mostrarToast('✅ Actualizado', 'success');
        else mostrarToast('❌ Error', 'error');
    } catch(e) { 
        mostrarToast('❌ Error de conexión', 'error'); 
    }
}

// ============================
// ELIMINAR ÍTEM
// ============================
async function eliminarFila(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;
    
    abrirModal('Eliminar ítem', '¿Estás seguro?', async () => {
        if (id) {
            try { 
                await fetch(`${URL_SERVIDOR}/eliminar-item/${id}`, { method: 'DELETE' }); 
            } catch(e) {}
        }
        fila.remove(); 
        actualizarTotalesGenerales(); 
        actualizarContadores(); 
        mostrarToast('🗑 Eliminado', 'info');
    });
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
        const filas = document.querySelectorAll("#tablaItems tr:not(.grupo-modulo):not(.total-modulo)");
        const datos = [];
        
        for (const fila of filas) {
            const moduloPadre = fila.dataset.moduloPadre;
            const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
            const numeroItem = fila.querySelector('.numero-item')?.innerText;
            const descripcion = fila.querySelector('.descripcion')?.innerText;
            const unidad = fila.querySelector('.unidad')?.innerText;
            const cantidad = parseFloat(fila.querySelector('.cantidad')?.innerText) || 0;
            const precio = parseFloat(fila.querySelector('.precio')?.innerText) || 0;
            const total = parseFloat(fila.querySelector('.total-fila')?.innerText) || 0;
            const porcentaje = parseFloat(fila.querySelector('.porcentaje')?.innerText) || 0;
            
            if (!descripcion || !moduloNombre) continue;
            
            let ocs = [];
            for (let i = 0; i < ordenCambio; i++) {
                ocs.push({
                    numero: i + 1,
                    cantidad: parseFloat(fila.querySelector(`.oc-cant-${i}`)?.innerText) || 0,
                    precio: parseFloat(fila.querySelector(`.oc-pu-${i}`)?.innerText) || 0,
                    total: parseFloat(fila.querySelector(`.oc-total-${i}`)?.innerText) || 0
                });
            }
            
            let cms = [];
            for (let i = 0; i < contratoMod; i++) {
                cms.push({
                    numero: i + 1,
                    cantidad: parseFloat(fila.querySelector(`.cm-cant-${i}`)?.innerText) || 0,
                    precio: parseFloat(fila.querySelector(`.cm-pu-${i}`)?.innerText) || 0,
                    total: parseFloat(fila.querySelector(`.cm-total-${i}`)?.innerText) || 0
                });
            }
            
            datos.push({
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
            });
        }
        
        if (datos.length === 0) {
            mostrarToast('⚠️ No hay datos para guardar', 'warning');
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            return;
        }
        
        const response = await fetch(`${URL_SERVIDOR}/guardar-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`✅ ${datos.length} ítems guardados`, 'success');
            await cargarItems();
        } else {
            mostrarToast('❌ Error al guardar', 'error');
        }
        
    } catch(e) { 
        mostrarToast('❌ Error de conexión', 'error');
        console.error(e);
    } finally { 
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ============================
// ELIMINAR OC
// ============================
function eliminarOC() {
    if (ordenCambio <= 0) { mostrarToast('⚠️ No hay OC', 'warning'); return; }
    
    abrirModal('Eliminar OC', `¿Eliminar OC Nº${ordenCambio}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');
        
        filaPrincipal.children[filaPrincipal.children.length - 3].remove();
        for (let i = 0; i < 3; i++) {
            filaSecundaria.lastElementChild.remove();
        }
        
        document.querySelectorAll('#tablaItems tr').forEach(fila => {
            if (!fila.classList.contains('grupo-modulo') && !fila.classList.contains('total-modulo')) {
                const accionesCell = fila.querySelector('.acciones-cell');
                if (accionesCell) {
                    for (let i = 0; i < 3; i++) {
                        const prev = accionesCell.previousSibling;
                        if (prev) prev.remove();
                    }
                }
            }
        });
        
        ordenCambio--;
        
        const totalColumnas = 9 + (ordenCambio * 3) + (contratoMod * 3);
        document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
            if (td.getAttribute('colspan')) {
                td.setAttribute('colspan', totalColumnas);
            }
        });
        
        actualizarTotalesGenerales();
        mostrarToast('🗑 OC eliminada', 'info');
    });
}

// ============================
// ELIMINAR CM
// ============================
function eliminarCM() {
    if (contratoMod <= 0) { mostrarToast('⚠️ No hay CM', 'warning'); return; }
    
    abrirModal('Eliminar CM', `¿Eliminar CM Nº${contratoMod}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');
        
        filaPrincipal.children[filaPrincipal.children.length - 3].remove();
        for (let i = 0; i < 3; i++) {
            filaSecundaria.lastElementChild.remove();
        }
        
        document.querySelectorAll('#tablaItems tr').forEach(fila => {
            if (!fila.classList.contains('grupo-modulo') && !fila.classList.contains('total-modulo')) {
                const accionesCell = fila.querySelector('.acciones-cell');
                if (accionesCell) {
                    for (let i = 0; i < 3; i++) {
                        const prev = accionesCell.previousSibling;
                        if (prev) prev.remove();
                    }
                }
            }
        });
        
        contratoMod--;
        
        const totalColumnas = 9 + (ordenCambio * 3) + (contratoMod * 3);
        document.querySelectorAll('.grupo-modulo td, .total-modulo td').forEach(td => {
            if (td.getAttribute('colspan')) {
                td.setAttribute('colspan', totalColumnas);
            }
        });
        
        actualizarTotalesGenerales();
        mostrarToast('🗑 CM eliminado', 'info');
    });
}

// ============================
// CARGAR ITEMS DESDE BD
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
            const totalColumnas = 9 + (ordenCambio * 3) + (contratoMod * 3);
            const fm = document.createElement('tr');
            fm.classList.add('grupo-modulo');
            fm.dataset.moduloId = moduloCounter;
            fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${moduloCounter}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true" class="modulo-nombre">${moduloNombre}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button></div></div></div></td>`;
            tabla.appendChild(fm);
            
            itemsDelModulo.forEach(item => {
                let colOC = '';
                for (let i = 0; i < ordenCambio; i++) {
                    const oc = ocdb.find(o => o.item_id === item.id && o.numero_oc === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colOC += `
                        <td class="oc-cant-${i}" style="cursor:text;">${oc.cantidad || 0}</td>
                        <td class="oc-pu-${i}" style="cursor:text;">${oc.precio || 0}</td>
                        <td class="oc-total-${i}">${oc.total || 0}</td>
                    `;
                }
                
                let colCM = '';
                for (let i = 0; i < contratoMod; i++) {
                    const cm = cmdb.find(o => o.item_id === item.id && o.numero_cm === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colCM += `
                        <td class="cm-cant-${i}" style="cursor:text;">${cm.cantidad || 0}</td>
                        <td class="cm-pu-${i}" style="cursor:text;">${cm.precio || 0}</td>
                        <td class="cm-total-${i}">${cm.total || 0}</td>
                    `;
                }
                
                const fila = document.createElement('tr');
                fila.dataset.id = item.id;
                fila.dataset.moduloPadre = moduloCounter;
                fila.innerHTML = `
                    <td class="numero-item" style="cursor:text;">${item.item_numero || ''}</td>
                    <td contenteditable="true" class="descripcion" style="cursor:text;">${item.descripcion || ''}</td>
                    <td contenteditable="true" class="unidad" style="cursor:text;">${item.unidad || ''}</td>
                    <td class="cantidad" style="cursor:text;">${item.cantidad || 0}</td>
                    <td class="precio" style="cursor:text;">${item.precio_unitario || 0}</td>
                    <td class="total-fila">${item.total || 0}</td>
                    ${colOC}
                    ${colCM}
                    <td contenteditable="true" class="porcentaje" style="cursor:text;">${item.porcentaje_incidencia || 0}</td>
                    <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
                `;
                
                configurarEventosFila(fila);
                tabla.appendChild(fila);
            });
            
            const ft = document.createElement('tr');
            ft.classList.add('total-modulo');
            ft.dataset.moduloPadre = moduloCounter;
            ft.innerHTML = `<td colspan="6"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
            tabla.appendChild(ft);
            
            moduloCounter++;
        }
        
        actualizarTotalesGenerales();
        actualizarContadores();
        moduloActual = moduloCounter;
        
    } catch(e) { 
        console.error('Error cargando items:', e);
        mostrarToast('❌ Error al cargar datos', 'error');
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
    console.log('🚀 Sistema cargado');
});