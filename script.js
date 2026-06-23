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
        const moduloText = fila.querySelector('td:first-child')?.textContent.toLowerCase() || '';
        const descText = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        fila.style.display = (moduloText.includes(busqueda) || descText.includes(busqueda)) ? '' : 'none';
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
// FUNCIONES VACÍAS - SIN CÁLCULO AUTOMÁTICO
// ============================
function calcularTotalFila(fila) {}
function calcularTotalOC(elemento) {}
function calcularTotalCM(elemento) {}

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
// ACTUALIZAR TOTALES (SIN CÁLCULO - TODO MANUAL)
// ============================
function actualizarTotales() {
    actualizarContadores();
}

// ============================
// MODO LECTURA
// ============================
function aplicarModoLectura() {
    const usuarioRol = localStorage.getItem("usuarioRol");
    
    if (usuarioRol === 'lectura') {
        const botonesOcultar = [
            'btnModulo', 'btnItem', 'btnOC', 'btnCM', 'btnGuardar', 'btnEliminarOC', 'btnEliminarCM'
        ];
        
        botonesOcultar.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
        
        document.querySelectorAll('#tablaItems td[contenteditable="true"]').forEach(celda => {
            celda.setAttribute('contenteditable', 'false');
            celda.style.backgroundColor = '#f0f0f0';
        });
        
        document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        document.querySelectorAll('.modulo-nombre').forEach(modulo => {
            modulo.setAttribute('contenteditable', 'false');
        });
        
        document.querySelectorAll('.grupo-modulo .edit-btn, .grupo-modulo .delete-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        console.log('🔒 Modo lectura activado en Items');
    }
}

// ============================
// FUNCIÓN PARA GENERAR HTML DEL TOTAL DE MÓDULO
// ============================
function generarHTMLTotalModulo() {
    let totalHTML = `<td></td><td></td><td></td><td></td><td></td>`;
    totalHTML += `<td contenteditable="true" class="total-modulo-valor" style="cursor:text; background:white; color:black; font-weight:bold;">0.00</td>`;
    
    for (let i = 0; i < ordenCambio; i++) {
        totalHTML += `<td></td><td></td><td contenteditable="true" class="total-oc-valor" style="cursor:text; background:#e8f5e9; color:black; font-weight:bold;">0.00</td>`;
    }
    
    for (let i = 0; i < contratoMod; i++) {
        totalHTML += `<td></td><td></td><td contenteditable="true" class="total-cm-valor" style="cursor:text; background:#e3f2fd; color:black; font-weight:bold;">0.00</td>`;
    }
    
    totalHTML += `<td></td><td></td>`;
    
    return totalHTML;
}

// ============================
// AÑADIR MÓDULO (TOTAL MÓDULO EDITABLE)
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
    </td>`;
    tabla.appendChild(fm);
    
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.moduloPadre = moduloActual;
    ft.innerHTML = generarHTMLTotalModulo();
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
        
        actualizarContadores(); 
        mostrarToast('🗑 Módulo eliminado', 'info');
    });
}

// ============================
// AÑADIR ÍTEM (TOTAL CONTRATO ORIGINAL EDITABLE)
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
    
    let colOC = '';
    for (let i = 0; i < ordenCambio; i++) {
        colOC += `<td contenteditable="true">0</td><td contenteditable="true">0</td><td contenteditable="true" class="oc-total-${i}" style="cursor:text; background:white; color:black;">0.00</td>`;
    }
    let colCM = '';
    for (let i = 0; i < contratoMod; i++) {
        colCM += `<td contenteditable="true">0</td><td contenteditable="true">0</td><td contenteditable="true" class="cm-total-${i}" style="cursor:text; background:white; color:black;">0.00</td>`;
    }
    
    const fila = document.createElement('tr');
    fila.dataset.moduloPadre = moduloId;
    fila.innerHTML = `
        <td contenteditable="true" style="cursor:text;" placeholder="N° Ítem"></td>
        <td contenteditable="true" style="cursor:text;" placeholder="Descripción"></td>
        <td contenteditable="true" style="cursor:text;" placeholder="Unidad"></td>
        <td contenteditable="true" style="cursor:text;" placeholder="Cantidad">0</td>
        <td contenteditable="true" style="cursor:text;" placeholder="P.U.">0</td>
        <td contenteditable="true" class="total-fila" style="cursor:text; background:white; color:black;">0.00</td>
        ${colOC}
        ${colCM}
        <td contenteditable="true" style="cursor:text;">0</td>
        <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
    `;
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo-padre="${moduloId}"]`);
    if (totalModulo) {
        tabla.insertBefore(fila, totalModulo);
    } else {
        tabla.appendChild(fila);
    }
    
    actualizarContadores();
    mostrarToast('✅ Ítem agregado', 'success');
});

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
    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(t => { 
        const th = document.createElement('th'); 
        th.innerText = t; 
        fs.insertBefore(th, fs.children[fs.children.length - 2]);
    });
    
    const nuevoIndice = (tipo === 'OC' ? ordenCambio : contratoMod) - 1;
    
    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
            const celdas = fila.cells;
            const pos = celdas.length - 2;
            
            const td1 = document.createElement('td');
            td1.contentEditable = true;
            td1.innerText = '0';
            
            const td2 = document.createElement('td');
            td2.contentEditable = true;
            td2.innerText = '0';
            
            const td3 = document.createElement('td');
            td3.contentEditable = true;
            td3.className = tipo === 'OC' ? `oc-total-${nuevoIndice}` : `cm-total-${nuevoIndice}`;
            td3.innerText = '0.00';
            td3.style.cursor = 'text';
            td3.style.backgroundColor = 'white';
            td3.style.color = 'black';
            
            fila.insertBefore(td3, celdas[pos]);
            fila.insertBefore(td2, celdas[pos]);
            fila.insertBefore(td1, celdas[pos]);
        }
    });
    
    const totalColumnas = 8 + (ordenCambio * 3) + (contratoMod * 3);
    document.querySelectorAll('.grupo-modulo td[colspan]').forEach(td => {
        td.setAttribute('colspan', totalColumnas);
    });
    
    document.querySelectorAll('.total-modulo').forEach(totalMod => {
        totalMod.innerHTML = generarHTMLTotalModulo();
    });
    
    mostrarToast(`✅ ${titulo} agregado`, 'success');
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
        actualizarContadores(); 
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
        
        const moduloPadre = fila.dataset.moduloPadre;
        const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloPadre}"] .modulo-nombre`)?.innerText;
        const numeroItem = celdas[0]?.innerText.trim();
        const descripcion = celdas[1]?.innerText.trim();
        
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
        });
    }
    
    const totalesModulo = [];
    document.querySelectorAll('.total-modulo').forEach(totalMod => {
        const moduloId = totalMod.dataset.moduloPadre;
        const moduloNombre = document.querySelector(`.grupo-modulo[data-modulo-id="${moduloId}"] .modulo-nombre`)?.innerText;
        
        if (!moduloNombre) return;
        
        const celdas = totalMod.querySelectorAll('td');
        
        let totalesOC = [];
        let idx = 6;
        for (let i = 0; i < ordenCambio; i++) {
            totalesOC.push({
                numero_oc: i + 1,
                total_modulo: parseFloat(celdas[idx]?.innerText) || 0
            });
            idx += 3;
        }
        
        let totalesCM = [];
        for (let i = 0; i < contratoMod; i++) {
            totalesCM.push({
                numero_cm: i + 1,
                total_modulo: parseFloat(celdas[idx]?.innerText) || 0
            });
            idx += 3;
        }
        
        totalesModulo.push({
            modulo_nombre: moduloNombre,
            totales_oc: totalesOC,
            totales_cm: totalesCM
        });
    });
    
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    let guardados = 0;
    let actualizados = 0;
    let errores = 0;
    
    if (datos.length > 0) {
        for (const item of datos) {
            try {
                const response = await fetch(`${URL_SERVIDOR}/guardar-item-completo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                const data = await response.json();
                if (data.success) {
                    if (data.actualizado) actualizados++;
                    else guardados++;
                } else {
                    errores++;
                }
            } catch(e) {
                errores++;
            }
        }
    }
    
    if (totalesModulo.length > 0) {
        for (const modulo of totalesModulo) {
            try {
                if (modulo.totales_oc && modulo.totales_oc.length > 0) {
                    await fetch(`${URL_SERVIDOR}/guardar-totales-modulo-oc`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            modulo_nombre: modulo.modulo_nombre,
                            totales_oc: modulo.totales_oc
                        })
                    });
                }
                
                if (modulo.totales_cm && modulo.totales_cm.length > 0) {
                    await fetch(`${URL_SERVIDOR}/guardar-totales-modulo-cm`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            modulo_nombre: modulo.modulo_nombre,
                            totales_cm: modulo.totales_cm
                        })
                    });
                }
            } catch(e) {}
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
            filaSecundaria.children[filaSecundaria.children.length - 3].remove();
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
        document.querySelectorAll('.grupo-modulo td[colspan]').forEach(td => {
            td.setAttribute('colspan', totalColumnas);
        });
        
        document.querySelectorAll('.total-modulo').forEach(totalMod => {
            totalMod.innerHTML = generarHTMLTotalModulo();
        });
        
        actualizarContadores();
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
            filaSecundaria.children[filaSecundaria.children.length - 3].remove();
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
        document.querySelectorAll('.grupo-modulo td[colspan]').forEach(td => {
            td.setAttribute('colspan', totalColumnas);
        });
        
        document.querySelectorAll('.total-modulo').forEach(totalMod => {
            totalMod.innerHTML = generarHTMLTotalModulo();
        });
        
        actualizarContadores();
        mostrarToast('🗑 CM eliminado', 'info');
    });
}

// ============================
// CARGAR ITEMS (CON TOTALES OC Y CM EDITABLES)
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
        
        let totalesDB = { oc: [], cm: [] };
        try {
            const resTotales = await fetch(`${URL_SERVIDOR}/totales-modulo`);
            if (resTotales.ok) totalesDB = await resTotales.json();
        } catch(e) {}
        
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
            </td>`;
            tabla.appendChild(fm);
            
            itemsDelModulo.forEach(item => {
                let colOC = '';
                for (let i = 0; i < ordenCambio; i++) {
                    const oc = ocdb.find(o => o.item_id === item.id && o.numero_oc === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colOC += `<td contenteditable="true">${oc.cantidad}</td><td contenteditable="true">${oc.precio}</td><td contenteditable="true" class="oc-total-${i}" style="cursor:text; background:white; color:black;">${oc.total}</td>`;
                }
                
                let colCM = '';
                for (let i = 0; i < contratoMod; i++) {
                    const cm = cmdb.find(o => o.item_id === item.id && o.numero_cm === i + 1) || { cantidad: 0, precio: 0, total: 0 };
                    colCM += `<td contenteditable="true">${cm.cantidad}</td><td contenteditable="true">${cm.precio}</td><td contenteditable="true" class="cm-total-${i}" style="cursor:text; background:white; color:black;">${cm.total}</td>`;
                }
                
                const fila = document.createElement('tr');
                fila.dataset.id = item.id;
                fila.dataset.moduloPadre = moduloCounter;
                fila.innerHTML = `
                    <td contenteditable="true" style="cursor:text;">${item.item_numero || ''}</td>
                    <td contenteditable="true" style="cursor:text;">${escapeHtml(item.descripcion || '')}</td>
                    <td contenteditable="true" style="cursor:text;">${escapeHtml(item.unidad || '')}</td>
                    <td contenteditable="true" style="cursor:text;">${item.cantidad || 0}</td>
                    <td contenteditable="true" style="cursor:text;">${item.precio_unitario || 0}</td>
                    <td contenteditable="true" class="total-fila" style="cursor:text; background:white; color:black;">${item.total || 0}</td>
                    ${colOC}
                    ${colCM}
                    <td contenteditable="true" style="cursor:text;">${item.porcentaje_incidencia || 0}</td>
                    <td class="acciones-cell"><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>
                `;
                tabla.appendChild(fila);
            });
            
            const ft = document.createElement('tr');
            ft.classList.add('total-modulo');
            ft.dataset.moduloPadre = moduloCounter;
            
            let totalModHTML = `<td></td><td></td><td></td><td></td><td></td>`;
            totalModHTML += `<td contenteditable="true" class="total-modulo-valor" style="cursor:text; background:white; color:black; font-weight:bold;">0.00</td>`;
            
            for (let i = 0; i < ordenCambio; i++) {
                const totalOC = totalesDB.oc ? totalesDB.oc.find(o => o.modulo_nombre === moduloNombre && o.numero_oc === i + 1) : null;
                const valor = totalOC ? totalOC.total_modulo : '0.00';
                totalModHTML += `<td></td><td></td><td contenteditable="true" class="total-oc-valor" style="cursor:text; background:#e8f5e9; color:black; font-weight:bold;">${valor}</td>`;
            }
            
            for (let i = 0; i < contratoMod; i++) {
                const totalCM = totalesDB.cm ? totalesDB.cm.find(o => o.modulo_nombre === moduloNombre && o.numero_cm === i + 1) : null;
                const valor = totalCM ? totalCM.total_modulo : '0.00';
                totalModHTML += `<td></td><td></td><td contenteditable="true" class="total-cm-valor" style="cursor:text; background:#e3f2fd; color:black; font-weight:bold;">${valor}</td>`;
            }
            
            totalModHTML += `<td></td><td></td>`;
            ft.innerHTML = totalModHTML;
            tabla.appendChild(ft);
            
            moduloCounter++;
        }
        
        const tfoot = document.querySelector('tfoot tr');
        if (tfoot) {
            const celdas = tfoot.querySelectorAll('td');
            if (celdas.length > 1) {
                celdas[1].innerHTML = `<strong contenteditable="true" style="cursor:text; background:white; color:black;">0.00</strong>`;
            }
        }
        
        actualizarContadores();
        moduloActual = moduloCounter;
        
        aplicarModoLectura();
        
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
// FORZAR TOTALES EDITABLES
// ============================
function forzarTotalesEditables() {
    setTimeout(() => {
        document.querySelectorAll('.total-fila').forEach(td => {
            td.setAttribute('contenteditable', 'true');
            td.style.cursor = 'text';
            td.style.backgroundColor = 'white';
            td.style.color = 'black';
        });
        document.querySelectorAll('.total-modulo-valor').forEach(td => {
            td.setAttribute('contenteditable', 'true');
            td.style.cursor = 'text';
            td.style.backgroundColor = 'white';
            td.style.color = 'black';
        });
        document.querySelectorAll('.total-oc-valor').forEach(td => {
            td.setAttribute('contenteditable', 'true');
            td.style.cursor = 'text';
            td.style.backgroundColor = '#e8f5e9';
            td.style.color = 'black';
        });
        document.querySelectorAll('.total-cm-valor').forEach(td => {
            td.setAttribute('contenteditable', 'true');
            td.style.cursor = 'text';
            td.style.backgroundColor = '#e3f2fd';
            td.style.color = 'black';
        });
        const tfoot = document.querySelector('tfoot tr');
        if (tfoot) {
            const totalContrato = tfoot.querySelector('td:nth-child(7) strong');
            if (totalContrato) {
                totalContrato.setAttribute('contenteditable', 'true');
                totalContrato.style.cursor = 'text';
                totalContrato.style.backgroundColor = 'white';
                totalContrato.style.color = 'black';
            }
        }
        console.log('✅ Todos los totales forzados a ser editables');
    }, 100);
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
    forzarTotalesEditables();
    console.log('🚀 Sistema cargado - TODOS LOS TOTALES EDITABLES MANUALMENTE');
});