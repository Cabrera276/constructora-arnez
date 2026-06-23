const usuario = localStorage.getItem("usuario");
const usuarioRol = localStorage.getItem("usuarioRol");

if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let numeroPlanillas = 1;
let itemsData = [];
let ocData = [];
let cmData = [];
let evidenciasData = {};
let planillasGuardadas = {};

window.addEventListener('load', () => cargarTodo());

// Escuchar cambios en localStorage (cuando Items guarda, Planillas se actualiza)
window.addEventListener('storage', (e) => {
    if (e.key === 'itemsActualizados') {
        cargarTodo();
    }
});

async function fetchJSON(url, defaultValue = []) {
    try {
        const response = await fetch(url);
        if (!response.ok) return defaultValue;
        const text = await response.text();
        if (text.trim().startsWith('<')) return defaultValue;
        try {
            return JSON.parse(text);
        } catch(e) {
            return defaultValue;
        }
    } catch(error) {
        return defaultValue;
    }
}

async function cargarTodo() {
    document.getElementById('tablaBody').innerHTML = `<tr><td colspan="20" style="text-align:center;padding:40px"><i class="fa fa-spinner fa-spin"></i> Cargando datos...</td></tr>`;
    
    try {
        const [items, ocs, cms, planillasDB, evidenciasDB] = await Promise.all([
            fetchJSON(`${URL_SERVIDOR}/items`, []),
            fetchJSON(`${URL_SERVIDOR}/ordenes-cambio`, []),
            fetchJSON(`${URL_SERVIDOR}/contratos-mod`, []),
            fetchJSON(`${URL_SERVIDOR}/planillas`, []),
            fetchJSON(`${URL_SERVIDOR}/evidencias`, [])
        ]);

        itemsData = items;
        ocData = ocs;
        cmData = cms;

        if (!itemsData.length) {
            document.getElementById('tablaBody').innerHTML = `<tr><td colspan="20" style="color:#ff9800;text-align:center;padding:40px">No hay items cargados. Primero agregue items en la página de ITEMS.</td></tr>`;
            return;
        }

        evidenciasData = {};
        if (Array.isArray(evidenciasDB)) {
            evidenciasDB.forEach(ev => {
                if (!evidenciasData[ev.item_id]) evidenciasData[ev.item_id] = [];
                evidenciasData[ev.item_id].push({
                    id: ev.id,
                    url: ev.url_imagen,
                    descripcion: ev.descripcion || '',
                    orden: ev.orden || 0
                });
            });
        }
        
        itemsData.forEach(item => {
            if (!evidenciasData[item.id]) evidenciasData[item.id] = [];
            evidenciasData[item.id].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        });

        if (planillasDB.length > 0) {
            const maxPlan = Math.max(...planillasDB.map(p => p.numero_planilla));
            if (maxPlan > numeroPlanillas) numeroPlanillas = maxPlan;
        }

        planillasGuardadas = {};
        planillasDB.forEach(p => {
            if (!planillasGuardadas[p.item_id]) planillasGuardadas[p.item_id] = {};
            planillasGuardadas[p.item_id][p.numero_planilla] = {
                cantidad: p.cantidad || 0,
                precio_unitario: p.precio_unitario || 0,
                total: p.total || 0,
                avance: p.avance || "0%"
            };
        });

        renderizarTabla();
        
        const totalGuardado = localStorage.getItem('totalAcumuladoPlanillas');
        if (totalGuardado) {
            setTimeout(() => {
                const inputTotal = document.querySelector('.total-acumulado-input');
                if (inputTotal) inputTotal.value = totalGuardado;
            }, 100);
        }
        
        aplicarModoLectura();
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('tablaBody').innerHTML = `<tr><td colspan="20" style="color:#ff6b6b;text-align:center;padding:40px">Error al cargar datos.<br><button onclick="location.reload()" style="background:#ffc400;border:none;padding:8px 16px;border-radius:20px;margin-top:10px;cursor:pointer">Reintentar</button></td></tr>`;
    }
}

function aplicarModoLectura() {
    if (usuarioRol === 'lectura') {
        const botones = document.querySelectorAll('.btn-planilla-general');
        botones.forEach(btn => {
            btn.style.display = 'none';
        });
        
        const celdasEditables = document.querySelectorAll('[contenteditable="true"]');
        celdasEditables.forEach(celda => {
            celda.setAttribute('contenteditable', 'false');
            celda.style.backgroundColor = '#f0f0f0';
        });
        
        const botonesEvidencia = document.querySelectorAll('.btn-agregar-evidencia');
        botonesEvidencia.forEach(btn => {
            btn.style.display = 'none';
        });
        
        console.log('🔒 Modo lectura activado en Planillas');
    }
}

function getImagenUrl(evidenciaId) {
    return `${URL_SERVIDOR}/evidencias/imagen/${evidenciaId}`;
}

function renderizarTabla() {
    renderizarCabeceras();
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    let moduloActual = null;
    let itemsModulo = [];
    
    // Primero, recorremos para insertar filas y totales
    for (let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        const siguienteItem = itemsData[i + 1];
        
        if (moduloActual !== item.modulo_id) {
            // Si cambia de módulo, insertar total del módulo anterior
            if (moduloActual !== null && itemsModulo.length > 0) {
                insertarTotalModulo(tbody, itemsModulo);
            }
            moduloActual = item.modulo_id;
            itemsModulo = [];
            
            const colspan = 4 + (numeroPlanillas * 4) + 1;
            const rowModulo = document.createElement('tr');
            rowModulo.className = 'fila-modulo';
            rowModulo.innerHTML = `<td colspan="${colspan}" style="font-weight:bold;padding:10px;text-align:left;background:#e0e0e0">📦 MÓDULO ${String(item.modulo_id).padStart(2, '0')}${item.modulo_nombre ? ' - ' + item.modulo_nombre : ''}</td>`;
            tbody.appendChild(rowModulo);
        }
        
        itemsModulo.push(item);
        
        const fila = document.createElement('tr');
        fila.setAttribute('data-item-id', item.id);
        
        fila.innerHTML = `
            <td style="background:#e8e8e8">${item.modulo_id || ''}</td>
            <td style="text-align:left;background:#e8e8e8">${item.descripcion || ''}</td>
            <td style="background:#e8e8e8">${item.unidad || ''}</td>
            <td style="background:#e8e8e8">${item.cantidad || 0}</td>
            <td style="background:#e8e8e8">${item.precio_unitario || 0}</td>
            <td style="font-weight:bold;background:#e8e8e8">${item.total || 0}</td>
        `;
        
        for (let p = 1; p <= numeroPlanillas; p++) {
            const guardado = (planillasGuardadas[item.id] && planillasGuardadas[item.id][p]) || { cantidad: 0, precio_unitario: 0, total: 0, avance: "0%" };
            
            const tdCant = document.createElement('td');
            tdCant.contentEditable = 'true';
            tdCant.className = 'planilla-cant';
            tdCant.textContent = guardado.cantidad || '0';
            tdCant.style.background = "#fff9e6";
            
            const tdPU = document.createElement('td');
            tdPU.contentEditable = 'true';
            tdPU.className = 'planilla-pu';
            tdPU.textContent = guardado.precio_unitario || '0';
            tdPU.style.background = "#fff9e6";
            
            const tdTotal = document.createElement('td');
            tdTotal.contentEditable = 'true';
            tdTotal.className = 'planilla-total';
            tdTotal.textContent = guardado.total || '0';
            tdTotal.style.background = "#e8f5e9";
            tdTotal.style.fontWeight = "bold";
            tdTotal.style.cursor = "text";
            
            const tdAvance = document.createElement('td');
            tdAvance.contentEditable = 'true';
            tdAvance.className = 'planilla-avance';
            tdAvance.textContent = guardado.avance || '0%';
            tdAvance.style.background = "#fff9e6";
            
            const actualizarTotal = () => {
                actualizarTotalGeneral();
            };
            
            tdCant.addEventListener('input', actualizarTotal);
            tdPU.addEventListener('input', actualizarTotal);
            tdTotal.addEventListener('input', actualizarTotal);
            
            fila.appendChild(tdCant);
            fila.appendChild(tdPU);
            fila.appendChild(tdTotal);
            fila.appendChild(tdAvance);
        }
        
        const tdEvidencia = document.createElement('td');
        tdEvidencia.className = 'evidencia-container';
        tdEvidencia.id = `ev-${item.id}`;
        tdEvidencia.style.minWidth = "200px";
        tdEvidencia.style.padding = "5px";
        fila.appendChild(tdEvidencia);
        
        tbody.appendChild(fila);
        renderizarEvidencias(item.id);
        
        // Si es el último item o cambia de módulo, insertar total
        if (!siguienteItem || siguienteItem.modulo_id !== item.modulo_id) {
            insertarTotalModulo(tbody, itemsModulo);
        }
    }
    
    actualizarTotalGeneral();
}

function insertarTotalModulo(tbody, itemsModulo) {
    if (itemsModulo.length === 0) return;
    
    const colspan = 4 + (numeroPlanillas * 4) + 1;
    const rowTotal = document.createElement('tr');
    rowTotal.className = 'fila-total-modulo';
    rowTotal.style.background = '#d5e8d4';
    rowTotal.style.fontWeight = 'bold';
    
    let html = `<td colspan="6" style="text-align:right;padding:8px;background:#d5e8d4"><strong>TOTAL MÓDULO</strong></td>`;
    
    for (let p = 1; p <= numeroPlanillas; p++) {
        let sumaTotal = 0;
        itemsModulo.forEach(item => {
            const guardado = (planillasGuardadas[item.id] && planillasGuardadas[item.id][p]);
            if (guardado) sumaTotal += parseFloat(guardado.total) || 0;
        });
        html += `<td colspan="2" style="background:#d5e8d4"></td>`;
        html += `<td style="background:#d5e8d4;color:#006400;font-size:15px;text-align:center">${sumaTotal.toFixed(2)}</td>`;
        html += `<td style="background:#d5e8d4"></td>`;
    }
    
    html += `<td style="background:#d5e8d4"></td>`;
    rowTotal.innerHTML = html;
    tbody.appendChild(rowTotal);
}

function renderizarCabeceras() {
    const thead = document.getElementById('tablaHead');
    thead.innerHTML = '';
    
    const row1 = document.createElement('tr');
    const row2 = document.createElement('tr');
    
    row1.innerHTML = `
        <th rowspan="2">MÓDULO</th>
        <th rowspan="2">DESCRIPCIÓN</th>
        <th rowspan="2">UNID.</th>
        <th colspan="3">CONTRATO ORIGINAL</th>
    `;
    
    row2.innerHTML = `
        <th>CANT.</th><th>P.U.Bs</th><th>TOTAL</th>
    `;
    
    for (let i = 1; i <= numeroPlanillas; i++) {
        const thGroup = document.createElement('th');
        thGroup.colSpan = 4;
        thGroup.textContent = `PLANILLA Nº${i}`;
        row1.appendChild(thGroup);
        
        const thCant = document.createElement('th'); thCant.textContent = "CANTIDAD";
        const thPU = document.createElement('th'); thPU.textContent = "P.U. (Bs)";
        const thTotal = document.createElement('th'); thTotal.textContent = "TOTAL";
        const thAvance = document.createElement('th'); thAvance.textContent = "% AVANCE";
        row2.appendChild(thCant);
        row2.appendChild(thPU);
        row2.appendChild(thTotal);
        row2.appendChild(thAvance);
    }
    
    const thEvidencia = document.createElement('th');
    thEvidencia.rowSpan = 2;
    thEvidencia.textContent = "EVIDENCIA";
    row1.appendChild(thEvidencia);
    
    thead.appendChild(row1);
    thead.appendChild(row2);
}

function renderizarEvidencias(itemId) {
    const contenedor = document.getElementById(`ev-${itemId}`);
    if (!contenedor) return;
    
    const evidencias = evidenciasData[itemId] || [];
    contenedor.innerHTML = '';
    
    const galeria = document.createElement('div');
    galeria.style.display = 'flex';
    galeria.style.flexWrap = 'wrap';
    galeria.style.gap = '8px';
    galeria.style.justifyContent = 'center';
    
    if (evidencias.length === 0) {
        galeria.innerHTML = '<div style="color:#999;font-size:11px;text-align:center;padding:15px"><i class="fa-regular fa-image"></i><br>Sin evidencias</div>';
    } else {
        evidencias.forEach(ev => {
            const img = document.createElement('img');
            img.src = ev.url;
            img.style.width = '55px';
            img.style.height = '55px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '6px';
            img.style.cursor = 'pointer';
            img.style.border = '2px solid #ffc400';
            img.onclick = () => abrirModalEvidencia(itemId, ev.id);
            galeria.appendChild(img);
        });
    }
    
    const btnAgregar = document.createElement('button');
    btnAgregar.innerHTML = '<i class="fa fa-plus"></i> Agregar evidencia';
    btnAgregar.style.background = '#00b894';
    btnAgregar.style.color = 'white';
    btnAgregar.style.border = 'none';
    btnAgregar.style.padding = '5px 10px';
    btnAgregar.style.borderRadius = '15px';
    btnAgregar.style.fontSize = '10px';
    btnAgregar.style.cursor = 'pointer';
    btnAgregar.style.marginTop = '8px';
    btnAgregar.style.width = '100%';
    btnAgregar.className = 'btn-agregar-evidencia';
    btnAgregar.onclick = () => agregarEvidencia(itemId);
    
    if (evidencias.length >= 4) {
        btnAgregar.disabled = true;
        btnAgregar.style.opacity = '0.5';
        btnAgregar.title = 'Máximo 4 imágenes';
    }
    
    contenedor.appendChild(galeria);
    contenedor.appendChild(btnAgregar);
}

async function agregarEvidencia(itemId) {
    if (usuarioRol === 'lectura') {
        alert("⚠️ Usuario de solo lectura. No puede agregar evidencias.");
        return;
    }
    
    const evidencias = evidenciasData[itemId] || [];
    if (evidencias.length >= 4) {
        alert("⚠️ Máximo 4 imágenes por ítem");
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#333;color:#ffc400;padding:10px;border-radius:8px;z-index:9999';
        loadingMsg.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Subiendo imagen...';
        document.body.appendChild(loadingMsg);
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const imagenBase64 = reader.result;
                
                const response = await fetch(`${URL_SERVIDOR}/subir-evidencia`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_id: itemId,
                        descripcion: '',
                        orden: evidencias.length,
                        imagen_base64: imagenBase64
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const nuevaEvidencia = {
                        id: data.id,
                        descripcion: '',
                        orden: evidencias.length
                    };
                    if (!evidenciasData[itemId]) evidenciasData[itemId] = [];
                    evidenciasData[itemId].push(nuevaEvidencia);
                    renderizarEvidencias(itemId);
                    alert("✅ Imagen guardada en la base de datos");
                } else {
                    throw new Error(data.error || 'Error al guardar');
                }
                loadingMsg.remove();
            };
        } catch (error) {
            alert("❌ Error: " + error.message);
            loadingMsg.remove();
        }
    };
    input.click();
}

function abrirModalEvidencia(itemId, evId) {
    const evidencia = evidenciasData[itemId]?.find(e => e.id == evId);
    if (!evidencia) return;
    
    const imagenUrl = getImagenUrl(evId);
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;justify-content:center;align-items:center;z-index:200000';
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border-radius:16px;max-width:500px;width:90%;border:2px solid #ffc400">
            <div style="padding:15px;background:#0d0d0d;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center">
                <h3 style="color:#ffc400;margin:0"><i class="fa fa-image"></i> Evidencia</h3>
                <button id="cerrarModalBtn" style="background:#e74c3c;border:none;width:30px;height:30px;border-radius:50%;color:white;cursor:pointer;font-size:16px">✕</button>
            </div>
            <div style="padding:20px">
                <img id="modalImg" src="${imagenUrl}" style="width:100%;max-height:300px;object-fit:contain;border-radius:10px;margin-bottom:15px">
                <textarea id="modalDescEv" rows="3" style="width:100%;padding:10px;border-radius:8px;background:#2a2a2a;color:white;border:1px solid #444;margin-bottom:15px;resize:vertical" ${usuarioRol === 'lectura' ? 'disabled' : ''}>${evidencia.descripcion || ''}</textarea>
                <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
                    <button id="guardarDescBtn" style="background:#27ae60;border:none;padding:8px 16px;border-radius:20px;color:white;cursor:pointer"><i class="fa fa-save"></i> Guardar</button>
                    <button id="cambiarImgBtn" style="background:#f39c12;border:none;padding:8px 16px;border-radius:20px;color:black;cursor:pointer"><i class="fa fa-upload"></i> Cambiar</button>
                    <button id="eliminarEvBtn" style="background:#e74c3c;border:none;padding:8px 16px;border-radius:20px;color:white;cursor:pointer"><i class="fa fa-trash"></i> Eliminar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (usuarioRol === 'lectura') {
        ['guardarDescBtn', 'cambiarImgBtn', 'eliminarEvBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
        });
    }
    
    document.getElementById('cerrarModalBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    document.getElementById('guardarDescBtn').onclick = async () => {
        if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
        const textarea = document.getElementById('modalDescEv');
        if (textarea) {
            const ev = evidenciasData[itemId]?.find(e => e.id == evId);
            if (ev) {
                ev.descripcion = textarea.value;
                await fetch(`${URL_SERVIDOR}/guardar-evidencia`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: ev.id, item_id: itemId, descripcion: ev.descripcion, orden: ev.orden || 0 })
                });
                alert("✅ Descripción guardada");
            }
        }
        modal.remove();
        renderizarEvidencias(itemId);
    };
    
    document.getElementById('cambiarImgBtn').onclick = () => {
        if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#333;color:#ffc400;padding:10px;border-radius:8px;z-index:9999';
            loadingMsg.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Actualizando...';
            document.body.appendChild(loadingMsg);
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const res = await fetch(`${URL_SERVIDOR}/actualizar-evidencia-imagen`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_id: itemId, evidencia_id: evId, imagen_base64: reader.result })
                    });
                    const data = await res.json();
                    if (data.success) { document.getElementById('modalImg').src = getImagenUrl(evId); alert("✅ Imagen actualizada"); }
                    else throw new Error(data.error);
                    loadingMsg.remove();
                };
            } catch (error) { alert("❌ Error: " + error.message); loadingMsg.remove(); }
        };
        input.click();
    };
    
    document.getElementById('eliminarEvBtn').onclick = async () => {
        if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
        if (!confirm("¿Eliminar esta evidencia permanentemente?")) return;
        try {
            await fetch(`${URL_SERVIDOR}/eliminar-evidencia`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evidencia_id: evId, item_id: itemId })
            });
            evidenciasData[itemId] = (evidenciasData[itemId] || []).filter(e => e.id != evId);
            renderizarEvidencias(itemId);
            alert("✅ Evidencia eliminada");
            modal.remove();
        } catch(err) { alert("❌ Error al eliminar"); }
    };
}

function agregarPlanilla() {
    if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
    numeroPlanillas++;
    renderizarTabla();
}

function eliminarPlanilla() {
    if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
    if (numeroPlanillas <= 1) { alert("Debe haber al menos una planilla"); return; }
    numeroPlanillas--;
    renderizarTabla();
}

function actualizarTotalGeneral() {
    const tfoot = document.getElementById('tablaFoot');
    if (tfoot.children.length === 0 || !tfoot.querySelector('.total-acumulado-input')) {
        const colspanTotal = 5 + (numeroPlanillas * 4);
        tfoot.innerHTML = `<td colspan="${colspanTotal}" style="text-align:right;padding:8px"><strong>TOTAL ACUMULADO PLANILLAS (Bs)</strong></td>
                           <td style="background:#ffc400;font-weight:bold;font-size:16px;padding:0">
                               <input type="number" class="total-acumulado-input" value="0" step="any" 
                                      style="width:150px;padding:8px;background:#ffc400;border:none;font-weight:bold;font-size:16px;text-align:center">
                           </td>
                           <td></td>`;
        const inputTotal = tfoot.querySelector('.total-acumulado-input');
        inputTotal.addEventListener('input', () => {
            localStorage.setItem('totalAcumuladoPlanillas', inputTotal.value);
        });
    }
}

async function guardarTodo() {
    if (usuarioRol === 'lectura') { alert("⚠️ Usuario de solo lectura."); return; }
    
    const datos = [];
    document.querySelectorAll('#tablaBody tr[data-item-id]').forEach(fila => {
        const itemId = parseInt(fila.getAttribute('data-item-id'));
        const celdas = Array.from(fila.querySelectorAll('.planilla-cant, .planilla-pu, .planilla-total, .planilla-avance'));
        for (let p = 1; p <= numeroPlanillas; p++) {
            const idx = (p - 1) * 4;
            if (celdas[idx]) {
                datos.push({
                    numero_planilla: p,
                    item_id: itemId,
                    cantidad: parseFloat(celdas[idx].textContent) || 0,
                    precio_unitario: parseFloat(celdas[idx + 1].textContent) || 0,
                    total: parseFloat(celdas[idx + 2].textContent) || 0,
                    avance: celdas[idx + 3]?.textContent || '0%'
                });
            }
        }
    });
    
    const totalAcumuladoInput = document.querySelector('.total-acumulado-input');
    if (totalAcumuladoInput) {
        localStorage.setItem('totalAcumuladoPlanillas', totalAcumuladoInput.value);
    }
    
    if (!datos.length) { alert("No hay datos para guardar"); return; }
    
    try {
        const res = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
        });
        const result = await res.json();
        alert(result.success ? "✅ Planillas guardadas correctamente" : "❌ Error al guardar");
        
        // Notificar a otras pestañas que se actualizaron los datos
        localStorage.setItem('planillasActualizadas', Date.now());
    } catch(e) { alert("❌ Error de conexión"); }
}

function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", e => { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu?.classList.toggle('activo');
}