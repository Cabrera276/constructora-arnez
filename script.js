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
    document.querySelectorAll(`tr[data-modulo="${moduloId}"]:not(.grupo-modulo):not(.total-modulo)`).forEach(item => item.style.display = ocultar ? 'none' : '');
    const total = document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`);
    if (total) total.style.display = ocultar ? 'none' : '';
    ocultar ? flecha.classList.add('colapsado') : flecha.classList.remove('colapsado');
}

// ============================
// CALCULAR TOTAL
// ============================
function calcularTotalFila(fila) {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length < 7) return;
    
    const cantidad = parseFloat(celdas[3]?.innerText) || 0;
    const precioUnitario = parseFloat(celdas[4]?.innerText) || 0;
    const total = cantidad * precioUnitario;
    
    celdas[5].innerText = total.toFixed(2);
    
    actualizarTotales();
}

// ============================
// ACTUALIZAR CONTADORES
// ============================
function actualizarContadores() {
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloNombre = modulo.querySelector('.modulo-nombre')?.innerText;
        let count = 0;
        document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(item => {
            const moduloItem = item.querySelector('td:first-child')?.innerText;
            if (moduloItem === moduloNombre) count++;
        });
        const badge = modulo.querySelector('.badge-items');
        if (badge) badge.textContent = `${count} ítems`;
    });
}

// ============================
// REORDENAR TOTALES (MOVERLOS DEBAJO DE LOS ITEMS)
// ============================
function reordenarTotales() {
    const modulos = document.querySelectorAll('.grupo-modulo');
    
    modulos.forEach(modulo => {
        const moduloNombre = modulo.querySelector('.modulo-nombre')?.innerText;
        let totalModulo = null;
        
        // Buscar el total-modulo que corresponde
        document.querySelectorAll('.total-modulo').forEach(total => {
            if (total.dataset.modulo === moduloNombre) {
                totalModulo = total;
            }
        });
        
        if (totalModulo) {
            // Encontrar el último item de este módulo
            let ultimoItem = null;
            document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(item => {
                const itemModulo = item.querySelector('td:first-child')?.innerText;
                if (itemModulo === moduloNombre) {
                    ultimoItem = item;
                }
            });
            
            // Mover el total después del último item
            if (ultimoItem && ultimoItem.nextSibling !== totalModulo) {
                totalModulo.parentNode.insertBefore(totalModulo, ultimoItem.nextSibling);
            }
        }
    });
}

// ============================
// AÑADIR MÓDULO
// ============================
document.getElementById('btnModulo').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    
    const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
    const fm = document.createElement('tr');
    fm.classList.add('grupo-modulo');
    fm.dataset.modulo = moduloActual;
    fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${moduloActual}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true" class="modulo-nombre">MÓDULO ${String(moduloActual).padStart(2, '0')}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button></div></div></div></td>`;
    tabla.appendChild(fm);
    
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.modulo = moduloActual;
    ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
    tabla.appendChild(ft);
    
    moduloActual++;
    actualizarContadores();
    reordenarTotales();
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
        const moduloId = filaModulo.dataset.modulo;
        const moduloNombre = filaModulo.querySelector('.modulo-nombre')?.innerText;
        
        document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
            const primerTd = fila.querySelector('td:first-child')?.innerText;
            if (primerTd === moduloNombre) {
                fila.remove();
            }
        });
        
        filaModulo.remove();
        document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`)?.remove();
        
        actualizarTotales(); 
        actualizarContadores(); 
        mostrarToast('🗑 Módulo eliminado', 'info');
    });
}

// ============================
// AÑADIR ÍTEM (INSERTA ANTES DEL TOTAL MÓDULO)
// ============================
document.getElementById('btnItem').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    
    let colOC = '', colCM = '';
    for (let i = 0; i < ordenCambio; i++) colOC += `<td contenteditable="true" oninput="calcularTotalOC(this)"></td><td contenteditable="true" oninput="calcularTotalOC(this)"></td><td oninput="calcularTotalOC(this)"></td>`;
    for (let i = 0; i < contratoMod; i++) colCM += `<td contenteditable="true" oninput="calcularTotalCM(this)"></td><td contenteditable="true" oninput="calcularTotalCM(this)"><td><td oninput="calcularTotalCM(this)"></td>`;
    
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td contenteditable="true" style="cursor:text;" placeholder="Ej: 01"></td>
        <td contenteditable="true" style="cursor:text;" placeholder="Descripción"></td>
        <td contenteditable="true" style="cursor:text;" placeholder="Unidad"></td>
        <td contenteditable="true" style="cursor:text;" oninput="calcularTotalFila(this.closest('tr'))" placeholder="Cantidad"></td>
        <td contenteditable="true" style="cursor:text;" oninput="calcularTotalFila(this.closest('tr'))" placeholder="P.U."></td>
        <td></td>
        ${colOC}
        ${colCM}
        <td contenteditable="true" style="cursor:text;">0</td>
        <td><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
    `;
    
    tabla.appendChild(fila);
    
    actualizarTotales();
    actualizarContadores();
    reordenarTotales();  // IMPORTANTE: reordenar después de agregar
    mostrarToast('✅ Ítem agregado', 'success');
});

// ============================
// CALCULAR TOTAL OC
// ============================
function calcularTotalOC(elemento) {
    const fila = elemento.closest('tr');
    const celdas = fila.querySelectorAll('td');
    let ocIndex = 7;
    
    for (let i = 0; i < ordenCambio; i++) {
        const cantidad = parseFloat(celdas[ocIndex]?.innerText) || 0;
        const precio = parseFloat(celdas[ocIndex + 1]?.innerText) || 0;
        const total = cantidad * precio;
        if (celdas[ocIndex + 2]) celdas[ocIndex + 2].innerText = total.toFixed(2);
        ocIndex += 3;
    }
    actualizarTotales();
}

// ============================
// CALCULAR TOTAL CM
// ============================
function calcularTotalCM(elemento) {
    const fila = elemento.closest('tr');
    const celdas = fila.querySelectorAll('td');
    let cmIndex = 7 + (ordenCambio * 3);
    
    for (let i = 0; i < contratoMod; i++) {
        const cantidad = parseFloat(celdas[cmIndex]?.innerText) || 0;
        const precio = parseFloat(celdas[cmIndex + 1]?.innerText) || 0;
        const total = cantidad * precio;
        if (celdas[cmIndex + 2]) celdas[cmIndex + 2].innerText = total.toFixed(2);
        cmIndex += 3;
    }
    actualizarTotales();
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
    fp.insertBefore(g, fp.children[fp.children.length - 2]);
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => { const th = document.createElement('th'); th.innerText = t; fs.appendChild(th); });
    
    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
            const celdas = fila.cells;
            const pos = celdas.length - 2;
            const td1 = document.createElement('td');
            td1.contentEditable = true;
            td1.setAttribute('oninput', tipo === 'OC' ? 'calcularTotalOC(this)' : 'calcularTotalCM(this)');
            const td2 = document.createElement('td');
            td2.contentEditable = true;
            td2.setAttribute('oninput', tipo === 'OC' ? 'calcularTotalOC(this)' : 'calcularTotalCM(this)');
            const td3 = document.createElement('td');
            fila.insertBefore(td1, celdas[pos]);
            fila.insertBefore(td2, celdas[pos + 1]);
            fila.insertBefore(td3, celdas[pos + 2]);
        }
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
// ACTUALIZAR TOTALES
// ============================
function actualizarTotales() {
    // Reordenar primero
    reordenarTotales();
    
    // Calcular totales
    const items = document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)');
    let totalGeneral = 0;
    let totalesPorModulo = {};
    
    items.forEach(item => {
        const celdas = item.querySelectorAll('td');
        if (celdas.length < 6) return;
        
        const moduloId = celdas[0]?.innerText || 'sin-modulo';
        const totalItem = parseFloat(celdas[5]?.innerText) || 0;
        
        if (!totalesPorModulo[moduloId]) totalesPorModulo[moduloId] = 0;
        totalesPorModulo[moduloId] += totalItem;
        totalGeneral += totalItem;
    });
    
    // Actualizar los totales en la tabla
    document.querySelectorAll('.total-modulo').forEach(total => {
        const moduloNombre = total.dataset.modulo;
        const totalModulo = totalesPorModulo[moduloNombre] || 0;
        const celdas = total.querySelectorAll('td');
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
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/editar-item/${id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                modulo_id: celdas[0].innerText,
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
        actualizarTotales(); 
        actualizarContadores(); 
        reordenarTotales();
        mostrarToast('🗑 Eliminado', 'info');
    });
}

// ============================
// GUARDAR DATOS
// ============================
document.getElementById("btnGuardar").addEventListener("click", guardarDatos);

async function guardarDatos() {
    const filas = document.querySelectorAll("#tablaItems tr:not(.grupo-modulo):not(.total-modulo)");
    const datos = [];
    
    for (const fila of filas) {
        const celdas = fila.children;
        if (celdas.length < 6) continue;
        
        const moduloTexto = celdas[0]?.textContent.trim();
        const descripcion = celdas[1]?.textContent.trim();
        
        if (!descripcion) continue;
        
        let ocs = [];
        let ocIndex = 7;
        for (let i = 0; i < ordenCambio; i++) {
            ocs.push({
                numero: i + 1,
                cantidad: parseFloat(celdas[ocIndex]?.innerText) || 0,
                precio: parseFloat(celdas[ocIndex + 1]?.innerText) || 0,
                total: parseFloat(celdas[ocIndex + 2]?.innerText) || 0
            });
            ocIndex += 3;
        }
        
        let cms = [];
        let cmIndex = 7 + (ordenCambio * 3);
        for (let i = 0; i < contratoMod; i++) {
            cms.push({
                numero: i + 1,
                cantidad: parseFloat(celdas[cmIndex]?.innerText) || 0,
                precio: parseFloat(celdas[cmIndex + 1]?.innerText) || 0,
                total: parseFloat(celdas[cmIndex + 2]?.innerText) || 0
            });
            cmIndex += 3;
        }
        
        datos.push({
            modulo_id: moduloTexto,
            descripcion: descripcion,
            unidad: celdas[2]?.innerText.trim() || '',
            cantidad: parseFloat(celdas[3]?.innerText) || 0,
            precio_unitario: parseFloat(celdas[4]?.innerText) || 0,
            total: parseFloat(celdas[5]?.innerText) || 0,
            ordenesCambio: ocs,
            contratosMod: cms,
            porcentaje_incidencia: parseFloat(celdas[celdas.length - 2]?.innerText) || 0
        });
    }
    
    if (!datos.length) { 
        mostrarToast('⚠️ No hay datos', 'warning'); 
        return; 
    }
    
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/guardar-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await response.json();
        
        if (data.success) { 
            mostrarToast(`✅ ${datos.length} ítems guardados`, 'success'); 
            setTimeout(() => location.reload(), 1500);
        } else {
            mostrarToast('❌ Error', 'error');
        }
    } catch(e) { 
        mostrarToast('❌ Error de conexión', 'error');
    } finally { 
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
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
        
        actualizarTotales();
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
        
        items = items.map(item => ({
            ...item,
            modulo_id: String(item.modulo_id || '').trim()
        }));
        
        const maxOC = Math.max(...ocdb.map(o => o.numero_oc), 0);
        for (let i = 0; i < maxOC; i++) { 
            ordenCambio++; 
            agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`, 'OC'); 
        }
        
        const maxCM = Math.max(...cmdb.map(o => o.numero_cm), 0);
        for (let i = 0; i < maxCM; i++) { 
            contratoMod++; 
            agregarGrupo(`CONTRATO MOD Nº${contratoMod}`, 'CM'); 
        }
        
        const tabla = document.getElementById('tablaItems');
        tabla.innerHTML = '';
        
        const modulosUnicos = [...new Set(items.filter(i => i.modulo_id && i.modulo_id !== "").map(i => i.modulo_id))];
        
        // Crear grupos de módulo
        modulosUnicos.forEach(moduloId => {
            const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
            const fm = document.createElement('tr');
            fm.classList.add('grupo-modulo');
            fm.dataset.modulo = moduloId;
            fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${moduloId}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true" class="modulo-nombre">${moduloId}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button></div></div></div></tr>`;
            tabla.appendChild(fm);
        });
        
        // Crear ítems
        items.forEach(item => {
            const ocItem = ocdb.filter(o => o.item_id == item.id);
            let colOC = '';
            for (let i = 0; i < ordenCambio; i++) {
                if (i < ocItem.length) {
                    colOC += `<td contenteditable="true" oninput="calcularTotalOC(this)">${ocItem[i].cantidad || 0}</td><td contenteditable="true" oninput="calcularTotalOC(this)">${ocItem[i].precio || 0}</td><td oninput="calcularTotalOC(this)">${ocItem[i].total || 0}</td>`;
                } else {
                    colOC += `<td contenteditable="true" oninput="calcularTotalOC(this)"></td><td contenteditable="true" oninput="calcularTotalOC(this)"></td><td oninput="calcularTotalOC(this)"></td>`;
                }
            }
            
            const cmItem = cmdb.filter(o => o.item_id == item.id);
            let colCM = '';
            for (let i = 0; i < contratoMod; i++) {
                if (i < cmItem.length) {
                    colCM += `<td contenteditable="true" oninput="calcularTotalCM(this)">${cmItem[i].cantidad || 0}</td><td contenteditable="true" oninput="calcularTotalCM(this)">${cmItem[i].precio || 0}</td><td oninput="calcularTotalCM(this)">${cmItem[i].total || 0}</td>`;
                } else {
                    colCM += `<td contenteditable="true" oninput="calcularTotalCM(this)"></td><td contenteditable="true" oninput="calcularTotalCM(this)"></td><td oninput="calcularTotalCM(this)"></td>`;
                }
            }
            
            const fila = document.createElement('tr');
            fila.dataset.id = item.id;
            fila.innerHTML = `
                <td contenteditable="true" style="cursor:text;">${item.modulo_id || ''}</td>
                <td contenteditable="true" style="cursor:text;">${item.descripcion || ''}</td>
                <td contenteditable="true" style="cursor:text;">${item.unidad || ''}</td>
                <td contenteditable="true" style="cursor:text;" oninput="calcularTotalFila(this.closest('tr'))">${item.cantidad || 0}</td>
                <td contenteditable="true" style="cursor:text;" oninput="calcularTotalFila(this.closest('tr'))">${item.precio_unitario || 0}</td>
                <td>${item.total || 0}</td>
                ${colOC}
                ${colCM}
                <td contenteditable="true" style="cursor:text;">${item.porcentaje_incidencia || 0}</td>
                <td><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
            `;
            tabla.appendChild(fila);
        });
        
        // Agregar totales
        modulosUnicos.forEach(moduloId => {
            const ft = document.createElement('tr');
            ft.classList.add('total-modulo');
            ft.dataset.modulo = moduloId;
            ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 2}"></td>`;
            tabla.appendChild(ft);
        });
        
        actualizarTotales();
        actualizarContadores();
        reordenarTotales();
        
        let maxModuloNum = 0;
        modulosUnicos.forEach(mod => {
            const num = parseInt(mod);
            if (!isNaN(num) && num > maxModuloNum) maxModuloNum = num;
        });
        moduloActual = maxModuloNum + 1;
        if (moduloActual < 1) moduloActual = 1;
        
    } catch(e) { 
        console.error('Error:', e);
        mostrarToast('❌ Error al cargar', 'error');
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
    console.log('🚀 Sistema cargado - Total módulo DEBAJO de los items');
});