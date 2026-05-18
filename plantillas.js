const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contadorPlanillas = 0;
let evidenciasGlobal = {};

window.addEventListener('load', () => cargarDatos());

async function cargarDatos() {
    const tabla = document.getElementById('tablaReporte');
    tabla.innerHTML = `<tr><td colspan="20" style="text-align:center;padding:40px;">
        <i class="fa fa-spinner fa-spin" style="font-size:24px;color:#ffc400;"></i><br>
        Cargando datos...
    </td></tr>`;
    
    try {
        const [itemsRes, ocRes, cmRes, planRes, evRes] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`),
            fetch(`${URL_SERVIDOR}/contratos-mod`),
            fetch(`${URL_SERVIDOR}/planillas`),
            fetch(`${URL_SERVIDOR}/evidencias`).catch(() => [])
        ]);

        const items = await itemsRes.json();
        const ocs = await ocRes.json();
        const cms = await cmRes.json();
        const planillas = await planRes.json();
        let evidenciasDB = [];
        try {
            evidenciasDB = await evRes.json();
        } catch(e) {}

        // Cargar evidencias
        if (Array.isArray(evidenciasDB)) {
            evidenciasDB.forEach(ev => {
                if (!evidenciasGlobal[ev.item_id]) evidenciasGlobal[ev.item_id] = [];
                evidenciasGlobal[ev.item_id].push({
                    id: ev.id,
                    url: ev.url_imagen || ev.url,
                    descripcion: ev.descripcion || '',
                    orden: ev.orden || 0
                });
            });
        }
        items.forEach(item => {
            if (!evidenciasGlobal[item.id]) evidenciasGlobal[item.id] = [];
        });

        const maxPlanilla = planillas.length > 0 ? Math.max(...planillas.map(p => p.numero_planilla), 0) : 1;
        
        // Limpiar columnas de planillas existentes
        const fp = document.getElementById('filaPrincipal');
        const fs = document.getElementById('filaSecundaria');
        
        while (fp.children.length > 15) fp.removeChild(fp.lastElementChild);
        while (fs.children.length > 9) fs.removeChild(fs.lastElementChild);
        
        contadorPlanillas = 0;
        for (let i = 1; i <= maxPlanilla; i++) {
            agregarPlanillaGeneral();
        }

        tabla.innerHTML = '';
        let moduloAnterior = null;

        for (const item of items) {
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                const fm = document.createElement('tr');
                fm.className = 'fila-modulo';
                fm.style.background = '#dcdcdc';
                const colspan = 14 + (contadorPlanillas * 3);
                fm.innerHTML = `<td colspan="${colspan}" style="font-weight:bold;font-size:16px;text-align:left;padding:12px;color:#1a2a3a">📦 MÓDULO ${String(item.modulo_id).padStart(2, '0')}</td>`;
                tabla.appendChild(fm);
            }

            const oc = ocs.find(o => o.item_id == item.id) || {};
            const cm = cms.find(c => c.item_id == item.id) || {};

            const fila = document.createElement('tr');
            fila.className = 'fila-item';
            fila.dataset.itemId = item.id;

            // Columnas fijas (solo lectura)
            const tdModulo = document.createElement('td');
            tdModulo.textContent = item.modulo_id || '';
            tdModulo.style.backgroundColor = '#f5f5f5';
            
            const tdDescripcion = document.createElement('td');
            tdDescripcion.textContent = item.descripcion || '';
            tdDescripcion.style.textAlign = 'left';
            tdDescripcion.style.backgroundColor = '#f5f5f5';
            
            const tdUnidad = document.createElement('td');
            tdUnidad.textContent = item.unidad || '';
            tdUnidad.style.backgroundColor = '#f5f5f5';
            
            // Contrato Original
            const tdContCant = document.createElement('td');
            tdContCant.textContent = item.cantidad || 0;
            tdContCant.style.backgroundColor = '#e8e8e8';
            
            const tdContPU = document.createElement('td');
            tdContPU.textContent = item.precio_unitario || 0;
            tdContPU.style.backgroundColor = '#e8e8e8';
            
            const tdContTotal = document.createElement('td');
            tdContTotal.textContent = item.total || 0;
            tdContTotal.style.fontWeight = 'bold';
            tdContTotal.style.backgroundColor = '#e8e8e8';
            
            // Orden de Cambio
            const tdOCCant = document.createElement('td');
            tdOCCant.textContent = oc.cantidad || 0;
            tdOCCant.style.backgroundColor = '#e8e8e8';
            
            const tdOCPU = document.createElement('td');
            tdOCPU.textContent = oc.precio || 0;
            tdOCPU.style.backgroundColor = '#e8e8e8';
            
            const tdOCTotal = document.createElement('td');
            tdOCTotal.textContent = oc.total || 0;
            tdOCTotal.style.fontWeight = 'bold';
            tdOCTotal.style.backgroundColor = '#e8e8e8';
            
            // Contrato Mod
            const tdCMCant = document.createElement('td');
            tdCMCant.textContent = cm.cantidad || 0;
            tdCMCant.style.backgroundColor = '#e8e8e8';
            
            const tdCMPU = document.createElement('td');
            tdCMPU.textContent = cm.precio || 0;
            tdCMPU.style.backgroundColor = '#e8e8e8';
            
            const tdCMTotal = document.createElement('td');
            tdCMTotal.textContent = cm.total || 0;
            tdCMTotal.style.fontWeight = 'bold';
            tdCMTotal.style.backgroundColor = '#e8e8e8';
            
            // % INCIDENCIA (EDITABLE)
            const tdPorcentaje = document.createElement('td');
            tdPorcentaje.contentEditable = 'true';
            tdPorcentaje.textContent = item.porcentaje_incidencia || '0%';
            tdPorcentaje.style.backgroundColor = '#fff9e6';
            tdPorcentaje.style.fontWeight = 'bold';
            tdPorcentaje.style.color = '#e67e22';
            tdPorcentaje.addEventListener('blur', function() {
                let val = this.textContent;
                if (!val.includes('%')) this.textContent = val + '%';
            });
            
            // Celda de Evidencia
            const tdEvidencia = document.createElement('td');
            tdEvidencia.className = 'columna-evidencia';
            const evidenciaContainer = document.createElement('div');
            evidenciaContainer.id = `evidencias-${item.id}`;
            evidenciaContainer.className = 'evidencia-gestor';
            tdEvidencia.appendChild(evidenciaContainer);
            
            // Agregar todas las celdas
            fila.appendChild(tdModulo);
            fila.appendChild(tdDescripcion);
            fila.appendChild(tdUnidad);
            fila.appendChild(tdContCant);
            fila.appendChild(tdContPU);
            fila.appendChild(tdContTotal);
            fila.appendChild(tdOCCant);
            fila.appendChild(tdOCPU);
            fila.appendChild(tdOCTotal);
            fila.appendChild(tdCMCant);
            fila.appendChild(tdCMPU);
            fila.appendChild(tdCMTotal);
            fila.appendChild(tdPorcentaje);
            fila.appendChild(tdEvidencia);
            
            // Planillas
            const precioUnitario = item.precio_unitario || 0;
            const totalContrato = item.total || 0;
            
            for (let p = 1; p <= contadorPlanillas; p++) {
                const planillaData = planillas.find(pl => pl.item_id == item.id && pl.numero_planilla == p) || {};
                
                const tdCant = document.createElement('td');
                tdCant.contentEditable = 'true';
                tdCant.className = 'planilla-input';
                tdCant.textContent = planillaData.cantidad || '0';
                tdCant.style.backgroundColor = '#fff9e6';
                
                const tdTotalPlan = document.createElement('td');
                tdTotalPlan.className = 'planilla-total';
                tdTotalPlan.textContent = planillaData.total || '0';
                tdTotalPlan.style.backgroundColor = '#e8f5e9';
                
                const tdAvance = document.createElement('td');
                tdAvance.contentEditable = 'true';
                tdAvance.className = 'avance-input';
                tdAvance.textContent = planillaData.avance || '0%';
                tdAvance.style.backgroundColor = '#fff9e6';
                
                const actualizarDesdeCantidad = () => {
                    let cantidad = parseFloat(tdCant.textContent) || 0;
                    let totalCalculado = cantidad * precioUnitario;
                    tdTotalPlan.textContent = totalCalculado.toFixed(2);
                    let porcentaje = totalContrato > 0 ? (totalCalculado / totalContrato) * 100 : 0;
                    tdAvance.textContent = Math.min(100, porcentaje).toFixed(1) + "%";
                    actualizarTotalesPlanilla();
                };
                
                tdCant.addEventListener('input', actualizarDesdeCantidad);
                tdCant.addEventListener('blur', () => {
                    if (isNaN(parseFloat(tdCant.textContent))) tdCant.textContent = "0";
                    actualizarDesdeCantidad();
                });
                
                fila.appendChild(tdCant);
                fila.appendChild(tdTotalPlan);
                fila.appendChild(tdAvance);
                actualizarDesdeCantidad();
            }
            
            tabla.appendChild(fila);
        }
        
        for (const item of items) {
            renderizarEvidencias(item.id);
        }
        
        actualizarTotalesPlanilla();
        
    } catch (error) {
        console.error('Error:', error);
        tabla.innerHTML = `<tr><td colspan="20" style="text-align:center;padding:40px;color:#ff6b6b;">
            Error al cargar datos: ${error.message}
            <br><button onclick="location.reload()" style="margin-top:15px; background:#ffc400; border:none; padding:8px 20px; border-radius:20px; cursor:pointer;">Reintentar</button>
        </td></tr>`;
    }
}

// Renderizar evidencias con miniaturas y botón Ver
function renderizarEvidencias(itemId) {
    const contenedor = document.getElementById(`evidencias-${itemId}`);
    if (!contenedor) {
        setTimeout(() => renderizarEvidencias(itemId), 100);
        return;
    }
    
    const evidencias = evidenciasGlobal[itemId] || [];
    contenedor.innerHTML = '';
    
    const gestorDiv = document.createElement('div');
    gestorDiv.className = 'evidencia-gestor';
    
    const galeriaDiv = document.createElement('div');
    galeriaDiv.className = 'galeria-miniaturas';
    
    if (evidencias.length === 0) {
        const sinEv = document.createElement('div');
        sinEv.className = 'sin-evidencias-compacto';
        sinEv.innerHTML = '<i class="fa-regular fa-folder-open"></i><br>Sin evidencias';
        galeriaDiv.appendChild(sinEv);
    } else {
        evidencias.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        evidencias.forEach((ev, idx) => {
            const miniatura = document.createElement('div');
            miniatura.className = 'miniatura-item';
            miniatura.innerHTML = `
                <img src="${ev.url}" alt="Evidencia ${idx + 1}" class="miniatura-img" onclick="abrirModalEvidencia(${itemId}, ${ev.id})">
                <button class="btn-ver-evidencia" onclick="abrirModalEvidencia(${itemId}, ${ev.id})">
                    <i class="fa fa-eye"></i> Ver
                </button>
            `;
            galeriaDiv.appendChild(miniatura);
        });
        
        const contador = document.createElement('div');
        contador.className = 'contador-evidencias';
        contador.innerHTML = `<i class="fa-regular fa-images"></i> ${evidencias.length}/4 imágenes`;
        galeriaDiv.appendChild(contador);
    }
    
    const btnAgregar = document.createElement('button');
    btnAgregar.className = 'btn-agregar-evidencia';
    btnAgregar.innerHTML = '<i class="fa fa-plus"></i> Agregar evidencia';
    btnAgregar.onclick = () => agregarEvidencia(itemId);
    
    if (evidencias.length >= 4) {
        btnAgregar.disabled = true;
        btnAgregar.style.opacity = '0.5';
        btnAgregar.style.cursor = 'not-allowed';
        btnAgregar.title = 'Máximo 4 imágenes por ítem';
    }
    
    gestorDiv.appendChild(galeriaDiv);
    gestorDiv.appendChild(btnAgregar);
    contenedor.appendChild(gestorDiv);
}

// Modal para ver y editar evidencia
function abrirModalEvidencia(itemId, evId) {
    const evidencia = evidenciasGlobal[itemId]?.find(ev => ev.id == evId);
    if (!evidencia) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-evidencia-full';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;justify-content:center;align-items:center;z-index:200000;';
    
    modal.innerHTML = `
        <div style="background:#1a1a1a; border-radius:20px; max-width:600px; width:90%; overflow:hidden; border:2px solid #ffc400;">
            <div style="padding:15px; background:#0d0d0d; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:#ffc400; margin:0;"><i class="fa fa-image"></i> Evidencia</h3>
                <button onclick="this.closest('.modal-evidencia-full').remove()" style="background:#e74c3c; border:none; width:30px; height:30px; border-radius:50%; color:white; cursor:pointer;">✕</button>
            </div>
            <div style="padding:20px;">
                <img src="${evidencia.url}" style="width:100%; max-height:350px; object-fit:contain; border-radius:12px; margin-bottom:15px;">
                <textarea id="modalDescripcion" placeholder="Descripción de la evidencia..." rows="3" style="width:100%; padding:10px; border-radius:10px; border:1px solid #444; background:#2a2a2a; color:white; font-size:14px; margin-bottom:15px; resize:vertical;">${evidencia.descripcion || ''}</textarea>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button onclick="guardarDescripcionDesdeModal(${itemId}, ${evId})" style="background:#27ae60; border:none; padding:10px 20px; border-radius:25px; color:white; font-weight:bold; cursor:pointer;"><i class="fa fa-save"></i> Guardar</button>
                    <button onclick="cambiarImagenDesdeModal(${itemId}, ${evId})" style="background:#f39c12; border:none; padding:10px 20px; border-radius:25px; color:#000; font-weight:bold; cursor:pointer;"><i class="fa fa-upload"></i> Cambiar</button>
                    <button onclick="eliminarEvidenciaDesdeModal(${itemId}, ${evId})" style="background:#e74c3c; border:none; padding:10px 20px; border-radius:25px; color:white; font-weight:bold; cursor:pointer;"><i class="fa fa-trash"></i> Eliminar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function guardarDescripcionDesdeModal(itemId, evId) {
    const modal = document.querySelector('.modal-evidencia-full');
    const textarea = modal?.querySelector('#modalDescripcion');
    if (textarea) {
        const evidencia = evidenciasGlobal[itemId]?.find(ev => ev.id == evId);
        if (evidencia) {
            evidencia.descripcion = textarea.value;
            guardarEvidencia(itemId, evidencia);
            alert("✅ Descripción guardada");
        }
    }
    modal?.remove();
    renderizarEvidencias(itemId);
}

async function cambiarImagenDesdeModal(itemId, evId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('item_id', itemId);
        formData.append('evidencia_id', evId);
        
        try {
            let response = await fetch(`${URL_SERVIDOR}/actualizar-evidencia-imagen`, { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                const evidencia = evidenciasGlobal[itemId]?.find(ev => ev.id == evId);
                if (evidencia) evidencia.url = data.url || data.url_imagen;
                renderizarEvidencias(itemId);
                alert("✅ Imagen reemplazada");
                document.querySelector('.modal-evidencia-full')?.remove();
            } else {
                throw new Error("Error en servidor");
            }
        } catch (err) {
            alert("❌ Error al reemplazar imagen");
        }
    };
    input.click();
}

async function eliminarEvidenciaDesdeModal(itemId, evId) {
    if (!confirm("¿Eliminar esta evidencia permanentemente?")) return;
    
    try {
        await fetch(`${URL_SERVIDOR}/eliminar-evidencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evidencia_id: evId, item_id: itemId })
        });
        evidenciasGlobal[itemId] = (evidenciasGlobal[itemId] || []).filter(ev => ev.id != evId);
        renderizarEvidencias(itemId);
        alert("✅ Evidencia eliminada");
        document.querySelector('.modal-evidencia-full')?.remove();
    } catch (err) {
        evidenciasGlobal[itemId] = (evidenciasGlobal[itemId] || []).filter(ev => ev.id != evId);
        renderizarEvidencias(itemId);
        alert("⚠️ Evidencia eliminada localmente");
        document.querySelector('.modal-evidencia-full')?.remove();
    }
}

async function agregarEvidencia(itemId) {
    const evidencias = evidenciasGlobal[itemId] || [];
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
        loadingMsg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#333;color:#ffc400;padding:10px;border-radius:8px;z-index:9999;';
        loadingMsg.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Subiendo imagen...';
        document.body.appendChild(loadingMsg);
        
        try {
            const formData = new FormData();
            formData.append('imagen', file);
            formData.append('item_id', itemId);
            formData.append('descripcion', '');
            formData.append('orden', evidencias.length);
            
            let response = await fetch(`${URL_SERVIDOR}/subir-evidencia`, { method: 'POST', body: formData });
            let urlImagen = null;
            
            if (response.ok) {
                const data = await response.json();
                urlImagen = data.url || data.url_imagen;
            } else {
                response = await fetch(`${URL_SERVIDOR}/evidencias/subir`, { method: 'POST', body: formData });
                if (response.ok) {
                    const data = await response.json();
                    urlImagen = data.url || data.url_imagen;
                } else {
                    throw new Error(`Servidor respondió ${response.status}`);
                }
            }
            
            if (urlImagen) {
                const nuevaEv = {
                    id: Date.now(),
                    url: urlImagen,
                    descripcion: '',
                    orden: evidencias.length
                };
                if (!evidenciasGlobal[itemId]) evidenciasGlobal[itemId] = [];
                evidenciasGlobal[itemId].push(nuevaEv);
                await guardarEvidencia(itemId, nuevaEv);
                renderizarEvidencias(itemId);
                alert("✅ Imagen subida correctamente");
            } else {
                throw new Error("No se recibió URL");
            }
        } catch (error) {
            console.error("Error al subir:", error);
            const reader = new FileReader();
            reader.onload = function(e) {
                const nuevaEv = {
                    id: Date.now(),
                    url: e.target.result,
                    descripcion: '',
                    orden: evidencias.length,
                    local: true
                };
                if (!evidenciasGlobal[itemId]) evidenciasGlobal[itemId] = [];
                evidenciasGlobal[itemId].push(nuevaEv);
                renderizarEvidencias(itemId);
                alert("⚠️ Imagen guardada localmente");
            };
            reader.readAsDataURL(file);
        } finally {
            loadingMsg.remove();
        }
    };
    input.click();
}

async function guardarEvidencia(itemId, evidencia) {
    try {
        await fetch(`${URL_SERVIDOR}/guardar-evidencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: evidencia.id,
                item_id: itemId,
                url_imagen: evidencia.url,
                descripcion: evidencia.descripcion,
                orden: evidencia.orden
            })
        });
    } catch (err) {
        console.warn("No se pudo guardar en BD:", err);
    }
}

function agregarPlanillaGeneral() {
    contadorPlanillas++;
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    const th = document.createElement('th');
    th.colSpan = 3;
    th.textContent = `PLANILLA Nº${contadorPlanillas}`;
    fp.insertBefore(th, fp.children[fp.children.length - 2]);
    ['CANTIDAD', 'TOTAL (Bs)', '% AVANCE'].forEach(t => {
        const th2 = document.createElement('th');
        th2.textContent = t;
        fs.insertBefore(th2, fs.children[fs.children.length - 1]);
    });
    
    document.querySelectorAll('.fila-item').forEach(fila => {
        const cells = fila.cells;
        let precioUnitario = 0, totalContrato = 0;
        if (cells[4]) precioUnitario = parseFloat(cells[4].textContent) || 0;
        if (cells[5]) totalContrato = parseFloat(cells[5].textContent) || 0;
        
        const tdCant = document.createElement('td');
        tdCant.contentEditable = 'true';
        tdCant.className = 'planilla-input';
        tdCant.textContent = '0';
        tdCant.style.backgroundColor = '#fff9e6';
        
        const tdTotal = document.createElement('td');
        tdTotal.className = 'planilla-total';
        tdTotal.textContent = '0';
        tdTotal.style.backgroundColor = '#e8f5e9';
        
        const tdAvance = document.createElement('td');
        tdAvance.contentEditable = 'true';
        tdAvance.className = 'avance-input';
        tdAvance.textContent = '0%';
        tdAvance.style.backgroundColor = '#fff9e6';
        
        const actualizar = () => {
            let cantidad = parseFloat(tdCant.textContent) || 0;
            let totalCalc = cantidad * precioUnitario;
            tdTotal.textContent = totalCalc.toFixed(2);
            let porcentaje = totalContrato > 0 ? (totalCalc / totalContrato) * 100 : 0;
            tdAvance.textContent = Math.min(100, porcentaje).toFixed(1) + "%";
            actualizarTotalesPlanilla();
        };
        
        tdCant.addEventListener('input', actualizar);
        
        const posInsercion = fila.children.length - 1;
        fila.insertBefore(tdCant, fila.children[posInsercion]);
        fila.insertBefore(tdTotal, fila.children[posInsercion + 1]);
        fila.insertBefore(tdAvance, fila.children[posInsercion + 2]);
    });
    actualizarTotalesPlanilla();
}

function eliminarPlanillaGeneral() {
    if (contadorPlanillas <= 1) {
        alert("Debe haber al menos una planilla.");
        return;
    }
    document.getElementById('filaPrincipal').children[document.getElementById('filaPrincipal').children.length - 3].remove();
    for (let i = 0; i < 3; i++) {
        document.getElementById('filaSecundaria').lastElementChild.remove();
    }
    document.querySelectorAll('.fila-item').forEach(fila => {
        for (let i = 0; i < 3; i++) {
            fila.deleteCell(fila.cells.length - 3);
        }
    });
    contadorPlanillas--;
    actualizarTotalesPlanilla();
}

function actualizarTotalesPlanilla() {
    let total = 0;
    document.querySelectorAll('.fila-item .planilla-total').forEach(td => {
        total += parseFloat(td.textContent) || 0;
    });
    document.getElementById('totalContratoPlanilla').textContent = total.toFixed(2);
}

async function guardarPlanillas() {
    const filas = document.querySelectorAll('.fila-item');
    const datos = [];
    filas.forEach(fila => {
        for (let p = 1; p <= contadorPlanillas; p++) {
            const inicio = 14 + ((p - 1) * 3);
            if (fila.cells[inicio]) {
                datos.push({
                    numero_planilla: p,
                    item_id: parseInt(fila.dataset.itemId),
                    cantidad: parseFloat(fila.cells[inicio].textContent) || 0,
                    total: parseFloat(fila.cells[inicio + 1].textContent) || 0,
                    avance: fila.cells[inicio + 2]?.textContent || '0%'
                });
            }
        }
    });
    if (!datos.length) {
        alert('No hay datos');
        return;
    }
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await r.json();
        alert(result.success ? '✅ Planillas guardadas' : '❌ Error al guardar');
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

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

document.addEventListener('click', function(e) {
    if (e.target.textContent === '📞 CONTACTOS' || (e.target.parentElement && e.target.parentElement.textContent === '📞 CONTACTOS')) {
        abrirContactos();
        const menu = document.querySelector('.menu');
        const boton = document.querySelector('.menu-hamburguesa');
        if (menu && menu.classList.contains('activo')) {
            menu.classList.remove('activo');
            if (boton) {
                const icono = boton.querySelector('i');
                icono.classList.remove('fa-times');
                icono.classList.add('fa-bars');
            }
        }
    }
});