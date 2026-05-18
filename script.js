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
    actualizarTodosLosTotales();
}

// ============================
// ACTUALIZAR TOTAL OC
// ============================
function actualizarTotalOC(fila, index) {
    const cantCell = fila.querySelector(`.oc-cant-${index}`);
    const puCell = fila.querySelector(`.oc-pu-${index}`);
    const totalCell = fila.querySelector(`.oc-total-${index}`);
    
    if (cantCell && puCell && totalCell) {
        const cantidad = parseFloat(cantCell.innerText) || 0;
        const precio = parseFloat(puCell.innerText) || 0;
        totalCell.innerText = (cantidad * precio).toFixed(2);
    }
    actualizarTodosLosTotales();
}

// ============================
// ACTUALIZAR TOTAL CM
// ============================
function actualizarTotalCM(fila, index) {
    const cantCell = fila.querySelector(`.cm-cant-${index}`);
    const puCell = fila.querySelector(`.cm-pu-${index}`);
    const totalCell = fila.querySelector(`.cm-total-${index}`);
    
    if (cantCell && puCell && totalCell) {
        const cantidad = parseFloat(cantCell.innerText) || 0;
        const precio = parseFloat(puCell.innerText) || 0;
        totalCell.innerText = (cantidad * precio).toFixed(2);
    }
    actualizarTodosLosTotales();
}

// ============================
// ACTUALIZAR TODOS LOS TOTALES
// ============================
function actualizarTodosLosTotales() {
    // Recalcular cada fila
    document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
        // Contrato Original
        const cantOriginal = parseFloat(fila.querySelector('.cantidad')?.innerText) || 0;
        const puOriginal = parseFloat(fila.querySelector('.precio')?.innerText) || 0;
        const totalOriginal = cantOriginal * puOriginal;
        const totalOriginalCell = fila.querySelector('.total-fila');
        if (totalOriginalCell) totalOriginalCell.innerText = totalOriginal.toFixed(2);
        
        // OC
        for (let i = 0; i < ordenCambio; i++) {
            const cantOC = fila.querySelector(`.oc-cant-${i}`);
            const puOC = fila.querySelector(`.oc-pu-${i}`);
            const totalOC = fila.querySelector(`.oc-total-${i}`);
            if (cantOC && puOC && totalOC) {
                const cant = parseFloat(cantOC.innerText) || 0;
                const pu = parseFloat(puOC.innerText) || 0;
                totalOC.innerText = (cant * pu).toFixed(2);
            }
        }
        
        // CM
        for (let i = 0; i < contratoMod; i++) {
            const cantCM = fila.querySelector(`.cm-cant-${i}`);
            const puCM = fila.querySelector(`.cm-pu-${i}`);
            const totalCM = fila.querySelector(`.cm-total-${i}`);
            if (cantCM && puCM && totalCM) {
                const cant = parseFloat(cantCM.innerText) || 0;
                const pu = parseFloat(puCM.innerText) || 0;
                totalCM.innerText = (cant * pu).toFixed(2);
            }
        }
    });
    
    // Calcular totales por módulo
    let totalGeneral = 0;
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.moduloId;
        let totalModulo = 0;
        document.querySelectorAll(`tr[data-modulo-padre="${moduloId}"]`).forEach(item => {
            const total = parseFloat(item.querySelector('.total-fila')?.innerText) || 0;
            totalModulo += total;
        });
        totalGeneral += totalModulo;
        const totalRow = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
        if (totalRow) {
            const totalCell = totalRow.querySelector('.total-modulo-valor');
            if (totalCell) totalCell.innerText = totalModulo.toFixed(2);
        }
    });
    
    // Total general
    const tfoot = document.querySelector('tfoot tr');
    if (tfoot) {
        const totalCell = tfoot.querySelector('td:nth-child(7)');
        if (totalCell) totalCell.innerHTML = `<strong>${totalGeneral.toFixed(2)}</strong>`;
    }
    
    actualizarContadores();
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
// CONFIGURAR EVENTOS DE UNA FILA
// ============================
function configurarEventosFila(fila) {
    // Contrato Original
    const cantOriginal = fila.querySelector('.cantidad');
    const puOriginal = fila.querySelector('.precio');
    if (cantOriginal) {
        cantOriginal.addEventListener('input', () => actualizarTotalFila(fila));
        cantOriginal.addEventListener('blur', () => actualizarTotalFila(fila));
    }
    if (puOriginal) {
        puOriginal.addEventListener('input', () => actualizarTotalFila(fila));
        puOriginal.addEventListener('blur', () => actualizarTotalFila(fila));
    }
    
    // OC
    for (let i = 0; i < ordenCambio; i++) {
        const cantOC = fila.querySelector(`.oc-cant-${i}`);
        const puOC = fila.querySelector(`.oc-pu-${i}`);
        if (cantOC) {
            cantOC.addEventListener('input', () => actualizarTotalOC(fila, i));
            cantOC.addEventListener('blur', () => actualizarTotalOC(fila, i));
        }
        if (puOC) {
            puOC.addEventListener('input', () => actualizarTotalOC(fila, i));
            puOC.addEventListener('blur', () => actualizarTotalOC(fila, i));
        }
    }
    
    // CM
    for (let i = 0; i < contratoMod; i++) {
        const cantCM = fila.querySelector(`.cm-cant-${i}`);
        const puCM = fila.querySelector(`.cm-pu-${i}`);
        if (cantCM) {
            cantCM.addEventListener('input', () => actualizarTotalCM(fila, i));
            cantCM.addEventListener('blur', () => actualizarTotalCM(fila, i));
        }
        if (puCM) {
            puCM.addEventListener('input', () => actualizarTotalCM(fila, i));
            puCM.addEventListener('blur', () => actualizarTotalCM(fila, i));
        }
    }
}

// ============================
// AÑADIR MÓDULO
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
                <span class="toggle-modulo" onclick="toggleModulo('${moduloActual}',this)"><i class="fa fa-chevron-down"></i></span>
                <span contenteditable="true" class="modulo-nombre">MÓDULO ${String(moduloActual).padStart(2, '0')}</span>
                <span class="badge-items">0 ítems</span>
            </div>
            <div class="table-actions">
                <button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button>
                <button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    </div>`;
    tabla.appendChild(fm);
    
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.moduloPadre = moduloActual;
    ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td class="total-modulo-valor">0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
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
        
        actualizarTodosLosTotales();
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
    
    let moduloId;
    if (modulos.length === 1) {
        moduloId = modulos[0].dataset.moduloId;
    } else {
        let mensaje = 'Selecciona el módulo:\n\n';
        modulos.forEach((m, i) => { mensaje += `  ${i+1}. ${m.querySelector('.modulo-nombre')?.innerText || 'MÓDULO '+m.dataset.moduloId}\n`; });
        const sel = prompt(mensaje + '\nEscribe el número:');
        if (!sel) return;
        const idx = parseInt(sel) - 1;
        if (isNaN(idx) || idx < 0 || idx >= modulos.length) return;
        moduloId = modulos[idx].dataset.moduloId;
    }
    
    // Construir columnas OC
    let colOC = '';
    for (let i = 0; i < ordenCambio; i++) {
        colOC += `<td contenteditable="true" class="oc-cant-${i}" style="cursor:text;">0</td>
                  <td contenteditable="true" class="oc-pu-${i}" style="cursor:text;">0</td>
                  <td class="oc-total-${i}">0.00</td>`;
    }
    
    // Construir columnas CM
    let colCM = '';
    for (let i = 0; i < contratoMod; i++) {
        colCM += `<td contenteditable="true" class="cm-cant-${i}" style="cursor:text;">0</td>
                  <td contenteditable="true" class="cm-pu-${i}" style="cursor:text;">0</td>
                  <td class="cm-total-${i}">0.00</td>`;
    }
    
    const fila = document.createElement('tr');
    fila.dataset.moduloPadre = moduloId;
    fila.innerHTML = `
        <td contenteditable="true" class="numero-item" style="cursor:text;"></td>
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
    
    configurarEventosFila(fila);
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (totalModulo) {
        tabla.insertBefore(fila, totalModulo);
    } else {
        tabla.appendChild(fila);
    }
    
    actualizarTodosLosTotales();
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
    
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => {
        const th = document.createElement('th');
        th.innerText = t;
        fs.appendChild(th);
    });
    
    const nuevoIndice = (tipo === 'OC' ? ordenCambio : contratoMod) - 1;
    
    document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
        const accionesCell = fila.querySelector('.acciones-cell');
        
        // CANTIDAD
        const tdCant = document.createElement('td');
        tdCant.contentEditable = true;
        tdCant.className = tipo === 'OC' ? `oc-cant-${nuevoIndice}` : `cm-cant-${nuevoIndice}`;
        tdCant.innerText = '0';
        tdCant.style.cursor = 'text';
        
        // P.U.
        const tdPu = document.createElement('td');
        tdPu.contentEditable = true;
        tdPu.className = tipo === 'OC' ? `oc-pu-${nuevoIndice}` : `cm-pu-${nuevoIndice}`;
        tdPu.innerText = '0';
        tdPu.style.cursor = 'text';
        
        // TOTAL
        const tdTotal = document.createElement('td');
        tdTotal.className = tipo === 'OC' ? `oc-total-${nuevoIndice}` : `cm-total-${nuevoIndice}`;
        tdTotal.innerText = '0.00';
        
        // Insertar antes de la celda de acciones
        fila.insertBefore(tdTotal, accionesCell);
        fila.insertBefore(tdPu, accionesCell);
        fila.insertBefore(tdCant, accionesCell);
        
        // Eventos para cálculos en tiempo real
        tdCant.addEventListener('input', () => actualizarTotalOC(fila, nuevoIndice));
        tdCant.addEventListener('blur', () => actualizarTotalOC(fila, nuevoIndice));
        tdPu.addEventListener('input', () => actualizarTotalOC(fila, nuevoIndice));
        tdPu.addEventListener('blur', () => actualizarTotalOC(fila, nuevoIndice));
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
// EDITAR ÍTEM (ACTUALIZAR EN BD)
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
                item_numero: celdas[0].innerText,
                descripcion: celdas[1].innerText, 
                unidad: celdas[2].innerText, 
                cantidad: parseFloat(celdas[3].innerText) || 0, 
                precio_unitario: parseFloat(celdas[4].innerText) || 0, 
                total: parseFloat(celdas[5].innerText) || 0 
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
        actualizarTodosLosTotales(); 
        actualizarContadores(); 
        mostrarToast('🗑 Eliminado', 'info');
    });
}

// ============================
// GUARDAR DATOS (CON OC Y CM)
// ============================
document.getElementById("btnGuardar").addEventListener("click", guardarDatos);

async function guardarDatos() {
    const filas = document.querySelectorAll("#tablaItems tr:not(.grupo-modulo):not(.total-modulo)");
    
    if (filas.length === 0) {
        mostrarToast('⚠️ No hay datos para guardar', 'warning');
        return;
    }
    
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    let guardados = 0;
    let actualizados = 0;
    let errores = 0;
    
    for (const fila of filas) {
        const celdas = fila.children;
        if (celdas.length < 6) continue;
        
        const moduloPadre = fila.dataset.moduloPadre;
        const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
        const numeroItem = celdas[0]?.innerText.trim();
        const descripcion = celdas[1]?.innerText.trim();
        
        if (!descripcion) continue;
        
        // Recolectar datos de OC
        let ocs = [];
        for (let i = 0; i < ordenCambio; i++) {
            const cantOC = fila.querySelector(`.oc-cant-${i}`);
            const puOC = fila.querySelector(`.oc-pu-${i}`);
            const totalOC = fila.querySelector(`.oc-total-${i}`);
            ocs.push({
                numero: i + 1,
                cantidad: parseFloat(cantOC?.innerText) || 0,
                precio: parseFloat(puOC?.innerText) || 0,
                total: parseFloat(totalOC?.innerText) || 0
            });
        }
        
        // Recolectar datos de CM
        let cms = [];
        for (let i = 0; i < contratoMod; i++) {
            const cantCM = fila.querySelector(`.cm-cant-${i}`);
            const puCM = fila.querySelector(`.cm-pu-${i}`);
            const totalCM = fila.querySelector(`.cm-total-${i}`);
            cms.push({
                numero: i + 1,
                cantidad: parseFloat(cantCM?.innerText) || 0,
                precio: parseFloat(puCM?.innerText) || 0,
                total: parseFloat(totalCM?.innerText) || 0
            });
        }
        
        const item = {
            modulo_id: moduloNombre,
            item_numero: numeroItem,
            descripcion: descripcion,
            unidad: celdas[2]?.innerText.trim() || '',
            cantidad: parseFloat(celdas[3]?.innerText) || 0,
            precio_unitario: parseFloat(celdas[4]?.innerText) || 0,
            total: parseFloat(celdas[5]?.innerText) || 0,
            ordenesCambio: ocs,
            contratosMod: cms,
            porcentaje_incidencia: parseFloat(celdas[celdas.length - 2]?.innerText) || 0,
            id: fila.dataset.id || null
        };
        
        try {
            const response = await fetch(`${URL_SERVIDOR}/guardar-item-completo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const data = await response.json();
            if (data.success) {
                if (data.actualizado) {
                    actualizados++;
                } else {
                    guardados++;
                }
                if (data.id && !fila.dataset.id) {
                    fila.dataset.id = data.id;
                }
            } else {
                errores++;
                console.error('Error:', data.error);
            }
        } catch(e) {
            errores++;
            console.error('Error:', e);
        }
    }
    
    mostrarToast(`✅ ${guardados} nuevos, 🔄 ${actualizados} actualizados, ⚠️ ${errores} errores`, guardados > 0 || actualizados > 0 ? 'success' : 'error');
    
    if (guardados > 0 || actualizados > 0) {
        setTimeout(() => location.reload(), 1500);
    }
    
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
}

// ============================
// ELIMINAR OC / CM
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
            if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
                const pos = fila.cells.length - 3;
                for (let i = 0; i < 3; i++) {
                    if (fila.cells[pos]) fila.deleteCell(pos);
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
}

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
            if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
                const pos = fila.cells.length - 3;
                for (let i = 0; i < 3; i++) {
                    if (fila.cells[pos]) fila.deleteCell(pos);
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
        
        const maxOC = Math.max(...ocdb.map(o => o.numero_oc), 0);
        for (let i = 0; i < maxOC; i++) { 
            ordenCambio++; 
            agregarColumna(`ORDEN CAMBIO Nº${ordenCambio}`, 'OC'); 
        }
        
        const maxCM = Math.max(...cmdb.map(o => o.numero_cm), 0);
        for (let i = 0; i < maxCM; i++) { 
            contratoMod++; 
            agregarColumna(`CONTRATO MOD Nº${contratoMod}`, 'CM'); 
        }
        
        const tabla = document.getElementById('tablaItems');
        tabla.innerHTML = '';
        
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
                        <span class="toggle-modulo" onclick="toggleModulo('${moduloCounter}',this)"><i class="fa fa-chevron-down"></i></span>
                        <span contenteditable="true" class="modulo-nombre">${escapeHtml(moduloNombre)}</span>
                        <span class="badge-items">0 ítems</span>
                    </div>
                    <div class="table-actions">
                        <button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button>
                        <button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
            tabla.appendChild(fm);
            
            itemsDelModulo.forEach(item => {
                let colOC = '';
                for (let i = 0; i < ordenCambio; i++) {
                    const oc = ocdb.find(o => o.item_id === item.id && o.numero_oc === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colOC += `<td contenteditable="true" class="oc-cant-${i}" style="cursor:text;">${oc.cantidad}</td>
                              <td contenteditable="true" class="oc-pu-${i}" style="cursor:text;">${oc.precio}</td>
                              <td class="oc-total-${i}">${oc.total}</td>`;
                }
                
                let colCM = '';
                for (let i = 0; i < contratoMod; i++) {
                    const cm = cmdb.find(o => o.item_id === item.id && o.numero_cm === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colCM += `<td contenteditable="true" class="cm-cant-${i}" style="cursor:text;">${cm.cantidad}</td>
                              <td contenteditable="true" class="cm-pu-${i}" style="cursor:text;">${cm.precio}</td>
                              <td class="cm-total-${i}">${cm.total}</td>`;
                }
                
                const fila = document.createElement('tr');
                fila.dataset.id = item.id;
                fila.dataset.moduloPadre = moduloCounter;
                fila.innerHTML = `
                    <td contenteditable="true" class="numero-item" style="cursor:text;">${item.item_numero || ''}</td>
                    <td contenteditable="true" class="descripcion" style="cursor:text;">${escapeHtml(item.descripcion || '')}</td>
                    <td contenteditable="true" class="unidad" style="cursor:text;">${escapeHtml(item.unidad || '')}</td>
                    <td contenteditable="true" class="cantidad" style="cursor:text;">${item.cantidad || 0}</td>
                    <td contenteditable="true" class="precio" style="cursor:text;">${item.precio_unitario || 0}</td>
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
            ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td class="total-modulo-valor">0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
            tabla.appendChild(ft);
            
            moduloCounter++;
        }
        
        actualizarTodosLosTotales();
        actualizarContadores();
        moduloActual = moduloCounter;
        
    } catch(e) { 
        console.error('Error cargando items:', e);
        mostrarToast('❌ Error al cargar datos', 'error');
    }
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
    console.log('🚀 Sistema cargado');
});