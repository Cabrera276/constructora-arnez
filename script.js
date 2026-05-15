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
let contadorItems = 1;

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
        const desc = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        fila.style.display = desc.includes(busqueda) ? '' : 'none';
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
// CONTADORES
// ============================
function actualizarContadores() {
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const items = document.querySelectorAll(`tr[data-modulo="${modulo.dataset.modulo}"]:not(.grupo-modulo):not(.total-modulo)`);
        const badge = modulo.querySelector('.badge-items');
        if (badge) badge.textContent = `${items.length} ítems`;
    });
}

// ============================
// AÑADIR MÓDULO
// ============================
document.getElementById('btnModulo').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    const totalColumnas = 11 + (ordenCambio * 3) + (contratoMod * 3);
    const fm = document.createElement('tr');
    fm.classList.add('grupo-modulo');
    fm.dataset.modulo = moduloActual;
    fm.innerHTML = `<td colspan="${totalColumnas}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${moduloActual}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true">MÓDULO ${String(moduloActual).padStart(2,'0')}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarModulo(this)"><i class="fa fa-trash"></i></button></div></div></td>`;
    tabla.appendChild(fm);
    const ft = document.createElement('tr');
    ft.classList.add('total-modulo');
    ft.dataset.modulo = moduloActual;
    ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio*3)+(contratoMod*3)+5}"></td>`;
    tabla.appendChild(ft);
    moduloActual++;
    actualizarContadores();
    mostrarToast('✅ Módulo creado', 'success');
});

// ============================
// AÑADIR ÍTEM
// ============================
document.getElementById('btnItem').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    const modulos = document.querySelectorAll('.grupo-modulo');
    if (modulos.length === 0) { mostrarToast('⚠️ Primero crea un módulo', 'warning'); return; }
    let moduloId;
    if (modulos.length === 1) {
        moduloId = modulos[0].dataset.modulo;
    } else {
        let mensaje = 'Selecciona el módulo:\n\n';
        modulos.forEach((m, i) => { mensaje += `  ${i+1}. ${m.querySelector('span[contenteditable]')?.innerText || 'MÓDULO '+m.dataset.modulo}\n`; });
        const sel = prompt(mensaje + '\nEscribe el número:');
        if (!sel) return;
        const idx = parseInt(sel) - 1;
        if (isNaN(idx) || idx < 0 || idx >= modulos.length) return;
        moduloId = modulos[idx].dataset.modulo;
    }
    let colOC = '', colCM = '';
    for (let i = 0; i < ordenCambio; i++) colOC += `<td contenteditable="true"></td><td contenteditable="true"></td><td></td>`;
    for (let i = 0; i < contratoMod; i++) colCM += `<td contenteditable="true"></td><td contenteditable="true"></td><td></td>`;
    const fila = document.createElement('tr');
    fila.dataset.modulo = moduloId;
    fila.innerHTML = `<td>${contadorItems}</td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td></td>${colOC}${colCM}<td contenteditable="true">0%</td><td><div class="evidencia-box"><input type="file" class="input-imagen" accept="image/*" onchange="cargarImagen(event,this)" data-imagenes="[]" style="display:none"><button type="button" class="btn-subir" onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()">Subir</button><input type="text" class="descripcion-img" placeholder="Descripción"><button type="button" class="btn-ver" onclick="verImagen(this)">Ver</button></div></td><td><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>`;
    contadorItems++;
    const totalMod = document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`);
    if (totalMod) tabla.insertBefore(fila, totalMod);
    else tabla.appendChild(fila);
    actualizarTotales();
    actualizarContadores();
    mostrarToast('✅ Ítem agregado', 'success');
});

// ============================
// AÑADIR OC / CM
// ============================
document.getElementById('btnOC').addEventListener('click', () => { ordenCambio++; agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`); });
document.getElementById('btnCM').addEventListener('click', () => { contratoMod++; agregarGrupo(`CONTRATO MOD Nº${contratoMod}`); });

function agregarGrupo(titulo) {
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    const g = document.createElement('th'); g.colSpan = 3; g.innerText = titulo;
    fp.insertBefore(g, fp.children[fp.children.length - 3]);
    ['CANT.','P.U.Bs','TOTAL'].forEach(t => { const th = document.createElement('th'); th.innerText = t; fs.appendChild(th); });
    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
            fila.insertCell(fila.cells.length - 3).contentEditable = true;
            fila.insertCell(fila.cells.length - 3).contentEditable = true;
            fila.insertCell(fila.cells.length - 3);
        }
    });
}

// ============================
// ACTUALIZAR TOTALES
// ============================
document.addEventListener('input', actualizarTotales);
function actualizarTotales() {
    const filas = document.querySelectorAll('#tablaItems tr');
    let tg = 0, tmo = 0, toc = new Array(ordenCambio).fill(0), tcm = new Array(contratoMod).fill(0);
    filas.forEach(fila => {
        if (fila.classList.contains('grupo-modulo')) { tmo = 0; toc = new Array(ordenCambio).fill(0); tcm = new Array(contratoMod).fill(0); return; }
        if (fila.classList.contains('total-modulo')) {
            let h = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td>${tmo.toFixed(2)}</td>`;
            toc.forEach(t => h += `<td></td><td></td><td>${t.toFixed(2)}</td>`);
            tcm.forEach(t => h += `<td></td><td></td><td>${t.toFixed(2)}</td>`);
            h += '<td colspan="5"></td>';
            fila.innerHTML = h; return;
        }
        const c = fila.querySelectorAll('td');
        if (c.length < 6) return;
        const pu = parseFloat(c[4]?.innerText) || 0;
        c[5].innerText = pu.toFixed(2);
        let io = 6;
        for (let i = 0; i < ordenCambio; i++) { const p = parseFloat(c[io+1]?.innerText) || 0; toc[i] += p; c[io+2].innerText = p.toFixed(2); io += 3; }
        let ic = 6 + (ordenCambio*3);
        for (let i = 0; i < contratoMod; i++) { const p = parseFloat(c[ic+1]?.innerText) || 0; tcm[i] += p; c[ic+2].innerText = p.toFixed(2); ic += 3; }
        let sf = pu; toc.forEach(t => sf += t); tcm.forEach(t => sf += t);
        tg += sf; tmo += pu;
    });
    const ft = document.querySelector('tfoot tr');
    if (ft) ft.innerHTML = `<td colspan="5"><strong>TOTAL CONTRATO</strong></td><td><strong>${tg.toFixed(2)}</strong></td><td colspan="${(ordenCambio*3)+(contratoMod*3)+5}"></td>`;
    actualizarContadores();
}

// ============================
// EDITAR / ELIMINAR ÍTEM
// ============================
async function editarFila(btn) {
    const fila = btn.closest('tr'), c = fila.querySelectorAll('td'), id = fila.dataset.id;
    if (!id) { mostrarToast('⚠️ Guarda primero', 'warning'); return; }
    try {
        const r = await fetch(`${URL_SERVIDOR}/editar-item/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ descripcion: c[1].innerText, unidad: c[2].innerText, cantidad: parseFloat(c[3].innerText)||0, precio_unitario: parseFloat(c[4].innerText)||0, total: parseFloat(c[5].innerText)||0 }) });
        if ((await r.json()).success) mostrarToast('✅ Actualizado', 'success');
    } catch(e) { mostrarToast('❌ Error', 'error'); }
}
async function eliminarFila(btn) {
    const fila = btn.closest('tr'), id = fila.dataset.id;
    abrirModal('Eliminar ítem', '¿Seguro?', async () => {
        if (id) try { await fetch(`${URL_SERVIDOR}/eliminar-item/${id}`, { method:'DELETE' }); } catch(e) {}
        fila.remove(); actualizarTotales(); actualizarContadores(); mostrarToast('🗑 Eliminado', 'info');
    });
}

// ============================
// EDITAR / ELIMINAR MÓDULO
// ============================
function editarModulo(btn) { const t = btn.closest('.modulo-row').querySelector('span[contenteditable]'); if (t) { t.contentEditable = true; t.focus(); } }
function eliminarModulo(btn) {
    abrirModal('Eliminar módulo', '¿Eliminar módulo y sus ítems?', () => {
        const mid = btn.closest('tr').dataset.modulo;
        document.querySelectorAll(`#tablaItems tr[data-modulo="${mid}"]`).forEach(f => f.remove());
        actualizarTotales(); actualizarContadores(); mostrarToast('🗑 Módulo eliminado', 'info');
    });
}

// ============================
// IMAGEN
// ============================
async function cargarImagen(event, input) {
    const archivos = Array.from(input.files);
    if (!archivos.length) return;
    let imgs = [];
    try { imgs = JSON.parse(decodeURIComponent(input.dataset.imagenes || '[]')); } catch { imgs = []; }
    if (imgs.length >= 4) { mostrarToast('⚠️ Máximo 4', 'warning'); return; }
    let cargadas = 0;
    archivos.forEach(a => { const r = new FileReader(); r.onload = e => { imgs.push(e.target.result); input.dataset.imagenes = JSON.stringify(imgs); cargadas++; if (cargadas === archivos.length) mostrarToast(`📷 ${cargadas} imagen(es)`, 'success'); }; r.readAsDataURL(a); });
}
function verImagen(btn) {
    const fila = btn.closest('tr'), input = fila.querySelector('.input-imagen'), desc = fila.querySelector('.descripcion-img');
    let imgs = []; try { imgs = JSON.parse(decodeURIComponent(input.dataset.imagenes || '[]')); } catch { imgs = []; }
    if (!imgs.length) { mostrarToast('⚠️ Sin imágenes', 'warning'); return; }
    let idx = 0;
    const modal = document.createElement('div');
    modal.innerHTML = `<style>.carrusel-container{position:relative;display:flex;align-items:center;justify-content:center;gap:20px;padding:20px}.carrusel-btn{background:#f5b400;border:none;width:50px;height:50px;border-radius:50%;font-size:25px;cursor:pointer}.carrusel-btn:hover{background:#ff9900}</style><div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:flex;justify-content:center;align-items:center;z-index:99999"><div style="background:#111;padding:25px;border-radius:20px;position:relative;max-width:800px;width:90%;text-align:center;border:1px solid #ffc933"><button id="cerrarModal" style="position:absolute;top:15px;right:15px;background:red;color:white;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer">×</button><div class="carrusel-container"><button class="carrusel-btn" onclick="cambiarImagen(-1)">❮</button><img id="imagenCarrusel" src="${imgs[0]}" style="width:100%;max-height:500px;object-fit:contain;border-radius:15px"><button class="carrusel-btn" onclick="cambiarImagen(1)">❯</button></div><p style="color:#ffc933;font-size:14px;margin-top:10px">Imagen 1 de ${imgs.length}</p><p style="color:white;font-size:18px;margin-top:10px">${desc?.value||''}</p></div></div>`;
    document.body.appendChild(modal);
    window.cambiarImagen = function(d) { idx += d; if (idx < 0) idx = imgs.length-1; if (idx >= imgs.length) idx = 0; document.getElementById('imagenCarrusel').src = imgs[idx]; document.querySelector('.contador-imagenes') && (document.querySelector('.contador-imagenes').textContent = `Imagen ${idx+1} de ${imgs.length}`); };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

// ============================
// GUARDAR
// ============================
document.getElementById("btnGuardar").addEventListener("click", guardarDatos);
async function guardarDatos() {
    const filas = document.querySelectorAll("#tablaItems tr:not(.grupo-modulo):not(.total-modulo)");
    const datos = [];
    for (const fila of filas) {
        const c = fila.children;
        if (c.length < 6) continue;
        const desc = c[1]?.textContent.trim();
        if (!desc) continue;
        let ocs = [], cms = [];
        let io = 6;
        for (let i = 0; i < ordenCambio; i++) { ocs.push({ numero: i+1, cantidad: parseFloat(c[io]?.innerText)||0, precio: parseFloat(c[io+1]?.innerText)||0, total: parseFloat(c[io+2]?.innerText)||0 }); io += 3; }
        let ic = 6 + (ordenCambio*3);
        for (let i = 0; i < contratoMod; i++) { cms.push({ numero: i+1, cantidad: parseFloat(c[ic]?.innerText)||0, precio: parseFloat(c[ic+1]?.innerText)||0, total: parseFloat(c[ic+2]?.innerText)||0 }); ic += 3; }
        const box = fila.querySelector('.evidencia-box');
        datos.push({ modulo_id: parseInt(fila.dataset.modulo), descripcion: desc, unidad: c[2]?.innerText.trim()||'', cantidad: parseFloat(c[3]?.innerText)||0, precio_unitario: parseFloat(c[4]?.innerText)||0, total: parseFloat(c[5]?.innerText)||0, ordenesCambio: ocs, contratosMod: cms, imagen: box?.querySelector('.input-imagen')?.dataset.imagenes||'', descripcion_imagen: box?.querySelector('.descripcion-img')?.value||'', porcentaje_incidencia: 0 });
    }
    if (!datos.length) { mostrarToast('⚠️ No hay datos', 'warning'); return; }
    const btn = document.getElementById('btnGuardar');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-item`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(datos) });
        const data = await r.json();
        if (data.success) { mostrarToast(`✅ ${datos.length} ítems guardados`, 'success'); setTimeout(() => location.reload(), 1500); }
        else mostrarToast('❌ Error', 'error');
    } catch(e) { mostrarToast('❌ Error de conexión', 'error'); }
    finally { btn.innerHTML = '<i class="fa fa-save"></i> Guardar Datos'; btn.disabled = false; }
}

// ============================
// CARGAR ITEMS
// ============================
async function cargarItems() {
    try {
        const [ir, or, cr] = await Promise.all([fetch(`${URL_SERVIDOR}/items`), fetch(`${URL_SERVIDOR}/ordenes-cambio`), fetch(`${URL_SERVIDOR}/contratos-mod`)]);
        const items = await ir.json(), ocdb = await or.json(), cmdb = await cr.json();
        const maxOC = Math.max(...ocdb.map(o => o.numero_oc), 0);
        for (let i = 0; i < maxOC; i++) { ordenCambio++; agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`); }
        const maxCM = Math.max(...cmdb.map(o => o.numero_cm), 0);
        for (let i = 0; i < maxCM; i++) { contratoMod++; agregarGrupo(`CONTRATO MOD Nº${contratoMod}`); }
        const tabla = document.getElementById('tablaItems');
        tabla.innerHTML = '';
        let modAnt = null, numMod = 1, mods = [];
        items.forEach(item => {
            if (modAnt != item.modulo_id) {
                modAnt = item.modulo_id; mods.push(item.modulo_id);
                const fm = document.createElement('tr'); fm.classList.add('grupo-modulo'); fm.dataset.modulo = item.modulo_id;
                fm.innerHTML = `<td colspan="${11+(ordenCambio*3)+(contratoMod*3)}" class="modulo-row"><div class="modulo-content"><div style="display:flex;align-items:center;gap:10px"><span class="toggle-modulo" onclick="toggleModulo('${item.modulo_id}',this)"><i class="fa fa-chevron-down"></i></span><span contenteditable="true">MÓDULO ${String(numMod).padStart(2,'0')}</span><span class="badge-items">0 ítems</span></div><div class="table-actions"><button class="edit-btn" onclick="editarModulo(this)">✏️</button><button class="delete-btn" onclick="eliminarModulo(this)">🗑</button></div></div></td>`;
                tabla.appendChild(fm); numMod++;
            }
            const ocItem = ocdb.filter(o => o.item_id == item.id);
            let colOC = ''; ocItem.forEach(o => colOC += `<td contenteditable="true">${o.cantidad}</td><td contenteditable="true">${o.precio}</td><td>${o.total}</td>`);
            const cmItem = cmdb.filter(o => o.item_id == item.id);
            let colCM = ''; cmItem.forEach(o => colCM += `<td contenteditable="true">${o.cantidad}</td><td contenteditable="true">${o.precio}</td><td>${o.total}</td>`);
            const fila = document.createElement('tr'); fila.dataset.modulo = item.modulo_id; fila.dataset.id = item.id;
            fila.innerHTML = `<td>${item.modulo_id}</td><td contenteditable="true">${item.descripcion||''}</td><td contenteditable="true">${item.unidad||''}</td><td contenteditable="true">${item.cantidad||0}</td><td contenteditable="true">${item.precio_unitario||0}</td><td>${item.total||0}</td>${colOC}${colCM}<td contenteditable="true">${item.porcentaje_incidencia||0}%</td><td><div class="evidencia-box"><input type="file" class="input-imagen" accept="image/*" onchange="cargarImagen(event,this)" data-imagenes='${item.imagen||"[]"}' style="display:none"><button type="button" class="btn-subir" onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()">Subir</button><input type="text" class="descripcion-img" placeholder="Descripción" value="${item.descripcion_imagen||''}"><button type="button" class="btn-ver" onclick="verImagen(this)">Ver</button></div></td><td><div class="table-actions"><button class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button><button class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button></div></td>`;
            tabla.appendChild(fila);
        });
        mods.forEach(mid => {
            const ft = document.createElement('tr'); ft.classList.add('total-modulo'); ft.dataset.modulo = mid;
            ft.innerHTML = `<td colspan="5"><strong>TOTAL MÓDULO</strong></td><td>0.00</td><td colspan="${(ordenCambio*3)+(contratoMod*3)+5}"></td>`;
            const filas = [...tabla.querySelectorAll(`tr[data-modulo="${mid}"]`)];
            if (filas.length) filas[filas.length-1].after(ft);
        });
        actualizarTotales(); actualizarContadores();
        if (items.length) moduloActual = Math.max(...items.map(i => i.modulo_id)) + 1;
    } catch(e) { console.error('Error cargando:', e); }
}

// ============================
// ELIMINAR OC / CM
// ============================
function eliminarOC() {
    if (ordenCambio <= 0) { mostrarToast('⚠️ No hay OC', 'warning'); return; }
    abrirModal('Eliminar OC', `¿Eliminar OC Nº${ordenCambio}?`, () => {
        document.getElementById('filaPrincipal').children[document.getElementById('filaPrincipal').children.length-4].remove();
        for (let i = 0; i < 3; i++) document.getElementById('filaSecundaria').lastElementChild.remove();
        document.querySelectorAll('#tablaItems tr').forEach(f => { if (!f.classList.contains('grupo-modulo')) for (let i = 0; i < 3; i++) f.deleteCell(f.cells.length-4); });
        ordenCambio--; actualizarTotales(); mostrarToast('🗑 OC eliminada', 'info');
    });
}
function eliminarCM() {
    if (contratoMod <= 0) { mostrarToast('⚠️ No hay CM', 'warning'); return; }
    abrirModal('Eliminar CM', `¿Eliminar CM Nº${contratoMod}?`, () => {
        document.getElementById('filaPrincipal').children[document.getElementById('filaPrincipal').children.length-4].remove();
        for (let i = 0; i < 3; i++) document.getElementById('filaSecundaria').lastElementChild.remove();
        document.querySelectorAll('#tablaItems tr').forEach(f => { if (!f.classList.contains('grupo-modulo')) for (let i = 0; i < 3; i++) f.deleteCell(f.cells.length-4); });
        contratoMod--; actualizarTotales(); mostrarToast('🗑 CM eliminado', 'info');
    });
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
document.querySelectorAll('.menu a').forEach(enlace => {
    enlace.addEventListener('click', () => {
        const menu = document.querySelector('.menu'), boton = document.querySelector('.menu-hamburguesa');
        if (menu && boton && menu.classList.contains('activo')) {
            menu.classList.remove('activo'); boton.classList.remove('activo');
            const icono = boton.querySelector('i');
            if (icono) { icono.classList.remove('fa-times'); icono.classList.add('fa-bars'); }
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