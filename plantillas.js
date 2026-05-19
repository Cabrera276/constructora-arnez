const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let numeroPlanillas = 1;
let itemsData = [];
let ocData = [];
let cmData = [];
let evidenciasData = {};
let planillasGuardadas = {};

window.addEventListener('load', () => cargarTodo());

async function cargarTodo() {
    mostrarCargando();
    try {
        const [itemsRes, ocRes, cmRes, planRes, evRes] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`).catch(() => ({ json: () => [] })),
            fetch(`${URL_SERVIDOR}/contratos-mod`).catch(() => ({ json: () => [] })),
            fetch(`${URL_SERVIDOR}/planillas`).catch(() => ({ json: () => [] })),
            fetch(`${URL_SERVIDOR}/evidencias`).catch(() => ({ json: () => [] }))
        ]);

        itemsData = await itemsRes.json();
        ocData = await ocRes.json();
        cmData = await cmRes.json();
        const planillasDB = await planRes.json();
        const evidenciasDB = await evRes.json();

        // Cargar evidencias
        if (Array.isArray(evidenciasDB)) {
            evidenciasDB.forEach(ev => {
                if (!evidenciasData[ev.item_id]) evidenciasData[ev.item_id] = [];
                evidenciasData[ev.item_id].push({
                    id: ev.id,
                    url: ev.url_imagen || ev.url,
                    descripcion: ev.descripcion || ''
                });
            });
        }
        
        itemsData.forEach(item => {
            if (!evidenciasData[item.id]) evidenciasData[item.id] = [];
        });

        // Determinar número de planillas
        if (planillasDB.length > 0) {
            const maxPlan = Math.max(...planillasDB.map(p => p.numero_planilla));
            if (maxPlan > numeroPlanillas) numeroPlanillas = maxPlan;
        }

        // Guardar valores de planillas
        planillasGuardadas = {};
        planillasDB.forEach(p => {
            if (!planillasGuardadas[p.item_id]) planillasGuardadas[p.item_id] = {};
            planillasGuardadas[p.item_id][p.numero_planilla] = {
                cantidad: p.cantidad || 0,
                total: p.total || 0,
                avance: p.avance || "0%"
            };
        });

        renderizarTabla();
        
    } catch (error) {
        console.error(error);
        document.getElementById('tablaBody').innerHTML = `<tr><td colspan="20" style="color:red;text-align:center">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

function renderizarTabla() {
    renderizarCabeceras();
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    let moduloActual = null;
    
    for (const item of itemsData) {
        // Fila de módulo
        if (moduloActual !== item.modulo_id) {
            moduloActual = item.modulo_id;
            const colspan = 14 + (numeroPlanillas * 3);
            const rowModulo = document.createElement('tr');
            rowModulo.className = 'fila-modulo';
            rowModulo.innerHTML = `<td colspan="${colspan}" style="font-weight:bold;padding:10px;text-align:left">📦 MÓDULO ${String(item.modulo_id).padStart(2, '0')} - ${item.modulo_nombre || ''}</td>`;
            tbody.appendChild(rowModulo);
        }
        
        // Buscar OC y CM para este item
        const oc = ocData.find(o => o.item_id == item.id) || { cantidad: 0, precio: 0, total: 0 };
        const cm = cmData.find(c => c.item_id == item.id) || { cantidad: 0, precio: 0, total: 0 };
        
        const fila = document.createElement('tr');
        fila.setAttribute('data-item-id', item.id);
        
        // Crear fila con datos (TODOS EN MODO SOLO LECTURA excepto % INCIDENCIA)
        fila.innerHTML = `
            <td class="campo-solo-lectura">${item.modulo_id || ''}</td>
            <td class="campo-solo-lectura" style="text-align:left">${item.descripcion || ''}</td>
            <td class="campo-solo-lectura">${item.unidad || ''}</td>
            <td class="campo-solo-lectura">${item.cantidad || 0}</td>
            <td class="campo-solo-lectura">${item.precio_unitario || 0}</td>
            <td class="campo-solo-lectura" style="font-weight:bold">${item.total || 0}</td>
            <td class="campo-solo-lectura">${oc.cantidad || 0}</td>
            <td class="campo-solo-lectura">${oc.precio || 0}</td>
            <td class="campo-solo-lectura" style="font-weight:bold">${oc.total || 0}</td>
            <td class="campo-solo-lectura">${cm.cantidad || 0}</td>
            <td class="campo-solo-lectura">${cm.precio || 0}</td>
            <td class="campo-solo-lectura" style="font-weight:bold">${cm.total || 0}</td>
            <td class="porcentaje-incidencia" contenteditable="true">${item.porcentaje_incidencia || '0%'}</td>
            <td class="evidencia-container" id="ev-${item.id}"></td>
        `;
        
        // Agregar celdas de planillas
        const precioUnitario = item.precio_unitario || 0;
        const totalContrato = item.total || 0;
        
        for (let p = 1; p <= numeroPlanillas; p++) {
            const guardado = (planillasGuardadas[item.id] && planillasGuardadas[item.id][p]) || { cantidad: 0, total: 0, avance: "0%" };
            
            const tdCant = document.createElement('td');
            tdCant.contentEditable = 'true';
            tdCant.className = 'planilla-cant';
            tdCant.textContent = guardado.cantidad;
            
            const tdTotal = document.createElement('td');
            tdTotal.className = 'planilla-total';
            tdTotal.textContent = guardado.total;
            
            const tdAvance = document.createElement('td');
            tdAvance.contentEditable = 'true';
            tdAvance.className = 'planilla-avance';
            tdAvance.textContent = guardado.avance;
            
            const actualizar = () => {
                let cant = parseFloat(tdCant.textContent) || 0;
                let totalCalc = cant * precioUnitario;
                tdTotal.textContent = totalCalc.toFixed(2);
                let porcentaje = totalContrato > 0 ? (totalCalc / totalContrato) * 100 : 0;
                tdAvance.textContent = Math.min(100, porcentaje).toFixed(1) + "%";
                actualizarTotalGeneral();
            };
            
            tdCant.addEventListener('input', actualizar);
            tdAvance.addEventListener('blur', function() {
                let val = parseFloat(this.textContent);
                if (isNaN(val)) this.textContent = "0%";
                else if (!this.textContent.includes('%')) this.textContent = val + "%";
            });
            
            fila.appendChild(tdCant);
            fila.appendChild(tdTotal);
            fila.appendChild(tdAvance);
        }
        
        tbody.appendChild(fila);
        
        // Renderizar evidencias
        renderizarEvidencias(item.id);
    }
    
    actualizarTotalGeneral();
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
        <th colspan="3">ORDEN CAMBIO Nº1</th>
        <th colspan="3">CONTRATO MOD Nº1</th>
        <th rowspan="2">% INC.</th>
        <th rowspan="2">EVIDENCIA</th>
    `;
    
    row2.innerHTML = `
        <th>CANT.</th><th>P.U.Bs</th><th>TOTAL</th>
        <th>CANT.</th><th>P.U.Bs</th><th>TOTAL</th>
        <th>CANT.</th><th>P.U.Bs</th><th>TOTAL</th>
    `;
    
    for (let i = 1; i <= numeroPlanillas; i++) {
        const thGroup = document.createElement('th');
        thGroup.colSpan = 3;
        thGroup.textContent = `PLANILLA Nº${i}`;
        row1.appendChild(thGroup);
        
        const thCant = document.createElement('th'); thCant.textContent = "CANTIDAD";
        const thTotal = document.createElement('th'); thTotal.textContent = "TOTAL (Bs)";
        const thAvance = document.createElement('th'); thAvance.textContent = "% AVANCE";
        row2.appendChild(thCant);
        row2.appendChild(thTotal);
        row2.appendChild(thAvance);
    }
    
    thead.appendChild(row1);
    thead.appendChild(row2);
}

function renderizarEvidencias(itemId) {
    const contenedor = document.getElementById(`ev-${itemId}`);
    if (!contenedor) return;
    
    const evidencias = evidenciasData[itemId] || [];
    contenedor.innerHTML = '';
    
    const galeria = document.createElement('div');
    galeria.className = 'galeria-evidencias';
    
    if (evidencias.length === 0) {
        galeria.innerHTML = '<div class="sin-evidencias"><i class="fa-regular fa-image"></i><br>Sin evidencias</div>';
    } else {
        evidencias.forEach(ev => {
            const img = document.createElement('img');
            img.src = ev.url;
            img.className = 'miniatura-ev';
            img.onclick = () => abrirModalEvidencia(itemId, ev.id);
            galeria.appendChild(img);
        });
    }
    
    const btnAgregar = document.createElement('button');
    btnAgregar.className = 'btn-agregar-ev';
    btnAgregar.innerHTML = '<i class="fa fa-plus"></i> Agregar evidencia';
    btnAgregar.onclick = () => agregarEvidencia(itemId);
    
    if (evidencias.length >= 4) {
        btnAgregar.disabled = true;
        btnAgregar.style.opacity = '0.5';
        btnAgregar.title = 'Máximo 4 imágenes';
    }
    
    contenedor.appendChild(galeria);
    contenedor.appendChild(btnAgregar);
}

function abrirModalEvidencia(itemId, evId) {
    const evidencia = evidenciasData[itemId]?.find(e => e.id == evId);
    if (!evidencia) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-ev-modal';
    modal.innerHTML = `
        <div class="modal-ev-content">
            <div class="modal-ev-header">
                <h3><i class="fa fa-image"></i> Evidencia</h3>
                <button onclick="this.closest('.modal-ev-modal').remove()" style="background:#e74c3c;border:none;width:30px;height:30px;border-radius:50%;color:white;cursor:pointer">✕</button>
            </div>
            <div class="modal-ev-body">
                <img src="${evidencia.url}" class="modal-ev-img">
                <textarea class="modal-ev-desc" rows="3" placeholder="Descripción...">${evidencia.descripcion || ''}</textarea>
                <div class="modal-ev-buttons">
                    <button class="modal-ev-btn btn-guardar" onclick="guardarDescripcionModal(${itemId}, ${evId})"><i class="fa fa-save"></i> Guardar</button>
                    <button class="modal-ev-btn btn-cambiar" onclick="cambiarImagenModal(${itemId}, ${evId})"><i class="fa fa-upload"></i> Cambiar</button>
                    <button class="modal-ev-btn btn-eliminar" onclick="eliminarEvidenciaModal(${itemId}, ${evId})"><i class="fa fa-trash"></i> Eliminar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function guardarDescripcionModal(itemId, evId) {
    const modal = document.querySelector('.modal-ev-modal');
    const textarea = modal?.querySelector('.modal-ev-desc');
    if (textarea) {
        const ev = evidenciasData[itemId]?.find(e => e.id == evId);
        if (ev) ev.descripcion = textarea.value;
        guardarEvidenciaEnBD(itemId, ev);
        alert("✅ Descripción guardada");
    }
    modal?.remove();
    renderizarEvidencias(itemId);
}

async function cambiarImagenModal(itemId, evId) {
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
            const res = await fetch(`${URL_SERVIDOR}/actualizar-evidencia-imagen`, { method: 'POST', body: formData });
            const data = await res.json();
            const ev = evidenciasData[itemId]?.find(e => e.id == evId);
            if (ev) ev.url = data.url || data.url_imagen;
            renderizarEvidencias(itemId);
            alert("✅ Imagen cambiada");
            document.querySelector('.modal-ev-modal')?.remove();
        } catch(err) {
            alert("❌ Error al cambiar imagen");
        }
    };
    input.click();
}

async function eliminarEvidenciaModal(itemId, evId) {
    if (!confirm("¿Eliminar esta evidencia permanentemente?")) return;
    try {
        await fetch(`${URL_SERVIDOR}/eliminar-evidencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evidencia_id: evId, item_id: itemId })
        });
        evidenciasData[itemId] = (evidenciasData[itemId] || []).filter(e => e.id != evId);
        renderizarEvidencias(itemId);
        alert("✅ Evidencia eliminada");
        document.querySelector('.modal-ev-modal')?.remove();
    } catch(err) {
        evidenciasData[itemId] = (evidenciasData[itemId] || []).filter(e => e.id != evId);
        renderizarEvidencias(itemId);
        alert("⚠️ Evidencia eliminada localmente");
        document.querySelector('.modal-ev-modal')?.remove();
    }
}

async function agregarEvidencia(itemId) {
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
        
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('item_id', itemId);
        formData.append('descripcion', '');
        
        try {
            const res = await fetch(`${URL_SERVIDOR}/subir-evidencia`, { method: 'POST', body: formData });
            const data = await res.json();
            const url = data.url || data.url_imagen;
            
            if (url) {
                const nueva = { id: Date.now(), url: url, descripcion: '' };
                if (!evidenciasData[itemId]) evidenciasData[itemId] = [];
                evidenciasData[itemId].push(nueva);
                await guardarEvidenciaEnBD(itemId, nueva);
                renderizarEvidencias(itemId);
                alert("✅ Imagen subida correctamente");
            }
        } catch(err) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const nueva = { id: Date.now(), url: ev.target.result, descripcion: '' };
                if (!evidenciasData[itemId]) evidenciasData[itemId] = [];
                evidenciasData[itemId].push(nueva);
                renderizarEvidencias(itemId);
                alert("⚠️ Imagen guardada localmente");
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

async function guardarEvidenciaEnBD(itemId, evidencia) {
    try {
        await fetch(`${URL_SERVIDOR}/guardar-evidencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: evidencia.id,
                item_id: itemId,
                url_imagen: evidencia.url,
                descripcion: evidencia.descripcion
            })
        });
    } catch(err) {}
}

function agregarPlanilla() {
    numeroPlanillas++;
    
    // Agregar cabeceras
    const row1 = document.querySelector('#tablaHead tr:first-child');
    const row2 = document.querySelector('#tablaHead tr:last-child');
    
    const thGroup = document.createElement('th');
    thGroup.colSpan = 3;
    thGroup.textContent = `PLANILLA Nº${numeroPlanillas}`;
    row1.appendChild(thGroup);
    
    const thCant = document.createElement('th'); thCant.textContent = "CANTIDAD";
    const thTotal = document.createElement('th'); thTotal.textContent = "TOTAL (Bs)";
    const thAvance = document.createElement('th'); thAvance.textContent = "% AVANCE";
    row2.appendChild(thCant);
    row2.appendChild(thTotal);
    row2.appendChild(thAvance);
    
    // Agregar celdas a cada fila
    document.querySelectorAll('#tablaBody tr[data-item-id]').forEach(fila => {
        const cells = fila.cells;
        let precioUnitario = 0, totalContrato = 0;
        for (let i = 0; i < cells.length; i++) {
            if (i === 4) precioUnitario = parseFloat(cells[4]?.textContent) || 0;
            if (i === 5) totalContrato = parseFloat(cells[5]?.textContent) || 0;
        }
        
        const tdCant = document.createElement('td');
        tdCant.contentEditable = 'true';
        tdCant.className = 'planilla-cant';
        tdCant.textContent = '0';
        
        const tdTotal = document.createElement('td');
        tdTotal.className = 'planilla-total';
        tdTotal.textContent = '0';
        
        const tdAvance = document.createElement('td');
        tdAvance.contentEditable = 'true';
        tdAvance.className = 'planilla-avance';
        tdAvance.textContent = '0%';
        
        const actualizar = () => {
            let cant = parseFloat(tdCant.textContent) || 0;
            let totalCalc = cant * precioUnitario;
            tdTotal.textContent = totalCalc.toFixed(2);
            let porc = totalContrato > 0 ? (totalCalc / totalContrato) * 100 : 0;
            tdAvance.textContent = Math.min(100, porc).toFixed(1) + "%";
            actualizarTotalGeneral();
        };
        
        tdCant.addEventListener('input', actualizar);
        fila.appendChild(tdCant);
        fila.appendChild(tdTotal);
        fila.appendChild(tdAvance);
    });
    
    actualizarTotalGeneral();
}

function eliminarPlanilla() {
    if (numeroPlanillas <= 1) {
        alert("Debe haber al menos una planilla");
        return;
    }
    
    const row1 = document.querySelector('#tablaHead tr:first-child');
    const row2 = document.querySelector('#tablaHead tr:last-child');
    
    row1.removeChild(row1.lastElementChild);
    for (let i = 0; i < 3; i++) row2.removeChild(row2.lastElementChild);
    
    document.querySelectorAll('#tablaBody tr[data-item-id]').forEach(fila => {
        for (let i = 0; i < 3; i++) fila.removeChild(fila.lastElementChild);
    });
    
    numeroPlanillas--;
    actualizarTotalGeneral();
}

function actualizarTotalGeneral() {
    let total = 0;
    document.querySelectorAll('.planilla-total').forEach(td => {
        total += parseFloat(td.textContent) || 0;
    });
    const tfoot = document.getElementById('tablaFoot');
    tfoot.innerHTML = `<tr><td colspan="5"><strong>TOTAL ACUMULADO PLANILLAS (Bs)</strong></td><td style="background:#ffc400;font-weight:bold;font-size:16px">${total.toFixed(2)}</td><td colspan="10"></td></tr>`;
}

async function guardarTodo() {
    const datos = [];
    document.querySelectorAll('#tablaBody tr[data-item-id]').forEach(fila => {
        const itemId = parseInt(fila.getAttribute('data-item-id'));
        const celdas = Array.from(fila.querySelectorAll('.planilla-cant, .planilla-total, .planilla-avance'));
        for (let p = 1; p <= numeroPlanillas; p++) {
            const idx = (p - 1) * 3;
            if (celdas[idx]) {
                datos.push({
                    numero_planilla: p,
                    item_id: itemId,
                    cantidad: parseFloat(celdas[idx].textContent) || 0,
                    total: parseFloat(celdas[idx + 1].textContent) || 0,
                    avance: celdas[idx + 2]?.textContent || '0%'
                });
            }
        }
    });
    
    if (!datos.length) { alert("No hay datos para guardar"); return; }
    
    try {
        const res = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await res.json();
        alert(result.success ? "✅ Planillas guardadas correctamente" : "❌ Error al guardar");
    } catch(e) {
        alert("❌ Error de conexión");
    }
}

function mostrarCargando() {
    document.getElementById('tablaBody').innerHTML = `<tr><td colspan="20" style="text-align:center;padding:40px"><i class="fa fa-spinner fa-spin"></i> Cargando datos...</td></tr>`;
}

function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", e => { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu?.classList.toggle('activo');
}