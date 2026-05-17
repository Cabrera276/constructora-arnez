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
        const descText = fila.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
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
// ACTUALIZAR TOTAL DE UNA FILA
// ============================
function actualizarTotalFila(fila) {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length < 7) return;
    
    // Índices según tu HTML: 0:N°, 1:MÓDULO, 2:DESCRIPCIÓN, 3:UNID, 4:CANT, 5:P.U, 6:TOTAL
    const cantidad = parseFloat(celdas[4]?.innerText) || 0;
    const precioUnitario = parseFloat(celdas[5]?.innerText) || 0;
    const total = cantidad * precioUnitario;
    
    celdas[6].innerText = total.toFixed(2);
    actualizarTotales();
}

// ============================
// AGREGAR EVENTOS A UNA FILA
// ============================
function agregarEventosFila(fila) {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length < 7) return;
    
    const cantidadCell = celdas[4];
    const puCell = celdas[5];
    
    const handler = () => actualizarTotalFila(fila);
    
    if (cantidadCell) {
        cantidadCell.removeEventListener('input', handler);
        cantidadCell.removeEventListener('blur', handler);
        cantidadCell.addEventListener('input', handler);
        cantidadCell.addEventListener('blur', handler);
    }
    
    if (puCell) {
        puCell.removeEventListener('input', handler);
        puCell.removeEventListener('blur', handler);
        puCell.addEventListener('input', handler);
        puCell.addEventListener('blur', handler);
    }
}

// ============================
// ACTUALIZAR CONTADORES
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
        
        actualizarTotales(); 
        actualizarContadores(); 
        mostrarToast('🗑 Módulo eliminado', 'info');
    });
}

// ============================
// AÑADIR ÍTEM (SEGÚN ESTRUCTURA HTML)
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
        const toggleSpan = modulo.querySelector('.toggle-modulo');
        const flecha = toggleSpan?.querySelector('i');
        if (flecha && !flecha.classList.contains('colapsado')) {
            moduloActivo = modulo;
            break;
        }
    }
    if (!moduloActivo) moduloActivo = modulos[0];
    
    const moduloId = moduloActivo.dataset.moduloId;
    const moduloNombre = moduloActivo.querySelector('.modulo-nombre')?.innerText;
    
    // Construir columnas OC y CM
    let colOC = '';
    for (let i = 0; i < ordenCambio; i++) {
        colOC += `<td class="oc-cant" contenteditable="true">0</td><td class="oc-pu" contenteditable="true">0</td><td class="oc-total">0.00</td>`;
    }
    let colCM = '';
    for (let i = 0; i < contratoMod; i++) {
        colCM += `<td class="cm-cant" contenteditable="true">0</td><td class="cm-pu" contenteditable="true">0</td><td class="cm-total">0.00</td>`;
    }
    
    const fila = document.createElement('tr');
    fila.dataset.moduloPadre = moduloId;
    // Estructura: N° | MÓDULO | DESCRIPCIÓN | UNID. | CANT. | P.U.Bs | TOTAL | OC... | CM... | % | ACCIONES
    fila.innerHTML = `
        <td contenteditable="true" class="numero-item" style="cursor:text;">1</td>
        <td style="background:#f0f0f0;">${moduloNombre}</td>
        <td contenteditable="true" class="descripcion" style="cursor:text;"></td>
        <td contenteditable="true" class="unidad" style="cursor:text;"></td>
        <td contenteditable="true" class="cantidad" style="cursor:text;">0</td>
        <td contenteditable="true" class="precio" style="cursor:text;">0</td>
        <td class="total-fila">0.00</td>
        ${colOC}
        ${colCM}
        <td contenteditable="true" class="porcentaje" style="cursor:text;">0</td>
        <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
    `;
    
    // Agregar eventos
    agregarEventosFila(fila);
    
    // Agregar eventos para OC
    const ocCantCells = fila.querySelectorAll('.oc-cant');
    const ocPuCells = fila.querySelectorAll('.oc-pu');
    ocCantCells.forEach(cell => {
        cell.addEventListener('input', () => calcularTotalOCFila(fila));
        cell.addEventListener('blur', () => calcularTotalOCFila(fila));
    });
    ocPuCells.forEach(cell => {
        cell.addEventListener('input', () => calcularTotalOCFila(fila));
        cell.addEventListener('blur', () => calcularTotalOCFila(fila));
    });
    
    // Agregar eventos para CM
    const cmCantCells = fila.querySelectorAll('.cm-cant');
    const cmPuCells = fila.querySelectorAll('.cm-pu');
    cmCantCells.forEach(cell => {
        cell.addEventListener('input', () => calcularTotalCMFila(fila));
        cell.addEventListener('blur', () => calcularTotalCMFila(fila));
    });
    cmPuCells.forEach(cell => {
        cell.addEventListener('input', () => calcularTotalCMFila(fila));
        cell.addEventListener('blur', () => calcularTotalCMFila(fila));
    });
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (totalModulo) {
        tabla.insertBefore(fila, totalModulo);
    } else {
        tabla.appendChild(fila);
    }
    
    actualizarTotales();
    actualizarContadores();
    mostrarToast(`✅ Ítem agregado al ${moduloNombre}`, 'success');
});

// ============================
// CALCULAR TOTAL OC PARA UNA FILA
// ============================
function calcularTotalOCFila(fila) {
    const ocCants = fila.querySelectorAll('.oc-cant');
    const ocPus = fila.querySelectorAll('.oc-pu');
    const ocTotals = fila.querySelectorAll('.oc-total');
    
    for (let i = 0; i < ordenCambio; i++) {
        const cantidad = parseFloat(ocCants[i]?.innerText) || 0;
        const precio = parseFloat(ocPus[i]?.innerText) || 0;
        const total = cantidad * precio;
        if (ocTotals[i]) ocTotals[i].innerText = total.toFixed(2);
    }
    actualizarTotales();
}

// ============================
// CALCULAR TOTAL CM PARA UNA FILA
// ============================
function calcularTotalCMFila(fila) {
    const cmCants = fila.querySelectorAll('.cm-cant');
    const cmPus = fila.querySelectorAll('.cm-pu');
    const cmTotals = fila.querySelectorAll('.cm-total');
    
    for (let i = 0; i < contratoMod; i++) {
        const cantidad = parseFloat(cmCants[i]?.innerText) || 0;
        const precio = parseFloat(cmPus[i]?.innerText) || 0;
        const total = cantidad * precio;
        if (cmTotals[i]) cmTotals[i].innerText = total.toFixed(2);
    }
    actualizarTotales();
}

// ============================
// CALCULAR TOTAL OC (global)
// ============================
function calcularTotalOC(elemento) {
    calcularTotalOCFila(elemento.closest('tr'));
}

// ============================
// CALCULAR TOTAL CM (global)
// ============================
function calcularTotalCM(elemento) {
    calcularTotalCMFila(elemento.closest('tr'));
}

// ============================
// AÑADIR OC / CM
// ============================
document.getElementById('btnOC').addEventListener('click', () => { 
    ordenCambio++; 
    agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`, 'OC'); 
});
document.getElementById('btnCM').addEventListener('click', () => { 
    contratoMod++; 
    agregarGrupo(`CONTRATO MOD Nº${contratoMod}`, 'CM'); 
});

function agregarGrupo(titulo, tipo) {
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    const g = document.createElement('th'); 
    g.colSpan = 3; 
    g.innerText = titulo;
    // Insertar antes de % INCIDENCIA y ACCIONES (últimas 2 columnas)
    fp.insertBefore(g, fp.children[fp.children.length - 2]);
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => { const th = document.createElement('th'); th.innerText = t; fs.appendChild(th); });
    
    // Agregar columnas a todas las filas de items
    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.classList.contains('grupo-modulo') && !fila.classList.contains('total-modulo')) {
            const accionesCell = fila.querySelector('.acciones-cell');
            
            const td1 = document.createElement('td');
            td1.contentEditable = true;
            td1.className = tipo === 'OC' ? 'oc-cant' : 'cm-cant';
            td1.innerText = '0';
            
            const td2 = document.createElement('td');
            td2.contentEditable = true;
            td2.className = tipo === 'OC' ? 'oc-pu' : 'cm-pu';
            td2.innerText = '0';
            
            const td3 = document.createElement('td');
            td3.className = tipo === 'OC' ? 'oc-total' : 'cm-total';
            td3.innerText = '0.00';
            
            // Insertar antes de la celda de acciones
            fila.insertBefore(td3, accionesCell);
            fila.insertBefore(td2, accionesCell);
            fila.insertBefore(td1, accionesCell);
            
            td1.addEventListener('input', () => {
                if (tipo === 'OC') calcularTotalOC(td1);
                else calcularTotalCM(td1);
            });
            td2.addEventListener('input', () => {
                if (tipo === 'OC') calcularTotalOC(td2);
                else calcularTotalCM(td2);
            });
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
// ACTUALIZAR TOTALES GENERALES
// ============================
function actualizarTotales() {
    document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
        actualizarTotalFila(fila);
        calcularTotalOCFila(fila);
        calcularTotalCMFila(fila);
    });
    
    const items = document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)');
    let totalGeneral = 0;
    let totalesPorModulo = {};
    
    items.forEach(item => {
        const celdas = item.querySelectorAll('td');
        if (celdas.length < 7) return;
        
        const moduloPadre = item.dataset.moduloPadre;
        const totalItem = parseFloat(celdas[6]?.innerText) || 0;
        
        if (!totalesPorModulo[moduloPadre]) totalesPorModulo[moduloPadre] = 0;
        totalesPorModulo[moduloPadre] += totalItem;
        totalGeneral += totalItem;
    });
    
    document.querySelectorAll('.total-modulo').forEach(totalMod => {
        const moduloPadre = totalMod.dataset.moduloPadre;
        const totalModulo = totalesPorModulo[moduloPadre] || 0;
        const celdas = totalMod.querySelectorAll('td');
        if (celdas.length > 1) {
            celdas[1].innerText = totalModulo.toFixed(2);
        }
    });
    
    const tfoot = document.querySelector('tfoot tr');
    if (tfoot) {
        const celdas = tfoot.querySelectorAll('td');
        if (celdas.length > 1) {
            celdas[1].innerHTML = `<strong>${totalGeneral.toFixed(2)}</strong>`;
        }
    }
    
    actualizarContadores();
}

// ============================
// EDITAR ÍTEM
// ============================
async function editarFila(btn) {
    const fila = btn.closest('tr');
    const celdas = fila.querySelectorAll('td');
    const id = fila.dataset.id;
    
    if (!id) { 
        mostrarToast('⚠️ Guarda el ítem primero', 'warning'); 
        return;
    }
    
    const moduloPadre = fila.dataset.moduloPadre;
    const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/editar-item/${id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                modulo_id: moduloNombre,
                numero_item: celdas[0].innerText,
                descripcion: celdas[2].innerText, 
                unidad: celdas[3].innerText, 
                cantidad: parseFloat(celdas[4].innerText) || 0, 
                precio_unitario: parseFloat(celdas[5].innerText) || 0, 
                total: parseFloat(celdas[6].innerText) || 0 
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
        actualizarTotales(); 
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
        actualizarTotales();
        
        const filas = document.querySelectorAll("#tablaItems tr:not(.grupo-modulo):not(.total-modulo)");
        const datos = [];
        
        for (const fila of filas) {
            const celdas = fila.children;
            if (celdas.length < 8) continue;
            
            const moduloPadre = fila.dataset.moduloPadre;
            const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
            const numeroItem = celdas[0]?.textContent.trim();
            const descripcion = celdas[2]?.textContent.trim();
            
            if (!descripcion || !moduloNombre) continue;
            
            const ocCants = fila.querySelectorAll('.oc-cant');
            const ocPus = fila.querySelectorAll('.oc-pu');
            const ocTotals = fila.querySelectorAll('.oc-total');
            let ocs = [];
            for (let i = 0; i < ordenCambio; i++) {
                ocs.push({
                    numero: i + 1,
                    cantidad: parseFloat(ocCants[i]?.innerText) || 0,
                    precio: parseFloat(ocPus[i]?.innerText) || 0,
                    total: parseFloat(ocTotals[i]?.innerText) || 0
                });
            }
            
            const cmCants = fila.querySelectorAll('.cm-cant');
            const cmPus = fila.querySelectorAll('.cm-pu');
            const cmTotals = fila.querySelectorAll('.cm-total');
            let cms = [];
            for (let i = 0; i < contratoMod; i++) {
                cms.push({
                    numero: i + 1,
                    cantidad: parseFloat(cmCants[i]?.innerText) || 0,
                    precio: parseFloat(cmPus[i]?.innerText) || 0,
                    total: parseFloat(cmTotals[i]?.innerText) || 0
                });
            }
            
            datos.push({
                modulo_id: moduloNombre,
                item_numero: numeroItem,
                descripcion: descripcion,
                unidad: celdas[3]?.innerText.trim() || '',
                cantidad: parseFloat(celdas[4]?.innerText) || 0,
                precio_unitario: parseFloat(celdas[5]?.innerText) || 0,
                total: parseFloat(celdas[6]?.innerText) || 0,
                ordenesCambio: ocs,
                contratosMod: cms,
                porcentaje_incidencia: parseFloat(celdas[celdas.length - 2]?.innerText) || 0
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
                        const prevCell = accionesCell.previousSibling;
                        if (prevCell && (prevCell.classList.contains('oc-cant') || prevCell.classList.contains('oc-pu') || prevCell.classList.contains('oc-total'))) {
                            prevCell.remove();
                        }
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
        
        actualizarTotales();
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
                        const prevCell = accionesCell.previousSibling;
                        if (prevCell && (prevCell.classList.contains('cm-cant') || prevCell.classList.contains('cm-pu') || prevCell.classList.contains('cm-total'))) {
                            prevCell.remove();
                        }
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
        
        actualizarTotales();
        mostrarToast('🗑 CM eliminado', 'info');
    });
}

// ============================
// CARGAR ITEMS
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
                const ocItem = ocdb.filter(o => o.item_id == item.id);
                let colOC = '';
                for (let i = 0; i < ordenCambio; i++) {
                    if (i < ocItem.length) {
                        colOC += `<td class="oc-cant" contenteditable="true">${ocItem[i].cantidad || 0}</td><td class="oc-pu" contenteditable="true">${ocItem[i].precio || 0}</td><td class="oc-total">${ocItem[i].total || 0}</td>`;
                    } else {
                        colOC += `<td class="oc-cant" contenteditable="true">0</td><td class="oc-pu" contenteditable="true">0</td><td class="oc-total">0.00</td>`;
                    }
                }
                
                const cmItem = cmdb.filter(o => o.item_id == item.id);
                let colCM = '';
                for (let i = 0; i < contratoMod; i++) {
                    if (i < cmItem.length) {
                        colCM += `<td class="cm-cant" contenteditable="true">${cmItem[i].cantidad || 0}</td><td class="cm-pu" contenteditable="true">${cmItem[i].precio || 0}</td><td class="cm-total">${cmItem[i].total || 0}</td>`;
                    } else {
                        colCM += `<td class="cm-cant" contenteditable="true">0</td><td class="cm-pu" contenteditable="true">0</td><td class="cm-total">0.00</td>`;
                    }
                }
                
                const fila = document.createElement('tr');
                fila.dataset.id = item.id;
                fila.dataset.moduloPadre = moduloCounter;
                fila.innerHTML = `
                    <td contenteditable="true" class="numero-item" style="cursor:text;">${item.item_numero || ''}</td>
                    <td style="background:#f0f0f0;">${moduloNombre}</td>
                    <td contenteditable="true" class="descripcion" style="cursor:text;">${item.descripcion || ''}</td>
                    <td contenteditable="true" class="unidad" style="cursor:text;">${item.unidad || ''}</td>
                    <td contenteditable="true" class="cantidad" style="cursor:text;">${item.cantidad || 0}</td>
                    <td contenteditable="true" class="precio" style="cursor:text;">${item.precio_unitario || 0}</td>
                    <td class="total-fila">${item.total || 0}</td>
                    ${colOC}
                    ${colCM}
                    <td contenteditable="true" class="porcentaje" style="cursor:text;">${item.porcentaje_incidencia || 0}</td>
                    <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></tr>
                `;
                
                agregarEventosFila(fila);
                tabla.appendChild(fila);
            });
            
            const ft = document.createElement('tr');
            ft.classList.add('total-modulo');
            ft.dataset.moduloPadre = moduloCounter;
            ft.innerHTML = `<td colspan="6"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
            tabla.appendChild(ft);
            
            moduloCounter++;
        }
        
        actualizarTotales();
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