const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contadorPlanillas = 0;

window.addEventListener('load', () => cargarDatos());

async function cargarDatos() {
    try {
        const [itemsRes, ocRes, cmRes, planRes, evidenciasRes] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`),
            fetch(`${URL_SERVIDOR}/contratos-mod`),
            fetch(`${URL_SERVIDOR}/planillas`),
            fetch(`${URL_SERVIDOR}/evidencias`)
        ]);

        const items = await itemsRes.json();
        const ocs = await ocRes.json();
        const cms = await cmRes.json();
        const planillas = await planRes.json();
        const evidencias = await evidenciasRes.json();

        const maxPlanilla = Math.max(...planillas.map(p => p.numero_planilla), 0);
        
        // Agregar cabeceras de planillas
        for (let i = 1; i <= maxPlanilla; i++) {
            agregarPlanillaGeneral(false);
        }
        if (maxPlanilla === 0) {
            agregarPlanillaGeneral(false);
        }

        const tabla = document.getElementById('tablaReporte');
        tabla.innerHTML = '';

        let moduloAnterior = null;
        
        // Agrupar evidencias por item_id
        const evidenciasPorItem = {};
        evidencias.forEach(ev => {
            if (!evidenciasPorItem[ev.item_id]) {
                evidenciasPorItem[ev.item_id] = [];
            }
            evidenciasPorItem[ev.item_id].push(ev);
        });

        for (const item of items) {
            // Fila de módulo
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                const fm = document.createElement('tr');
                fm.className = 'fila-modulo';
                fm.style.background = '#1a1a1a';
                const colspan = 14 + (contadorPlanillas * 3);
                fm.innerHTML = `<td colspan="${colspan}" style="font-weight:bold;font-size:18px;text-align:left;padding:14px;color:#ffc400;background:linear-gradient(90deg, #1a1a1a, #2a2a2a);border-bottom:2px solid #ffc400;">📁 MÓDULO ${String(item.modulo_id).padStart(2, '0')}</td>`;
                tabla.appendChild(fm);
            }

            const oc = ocs.find(o => o.item_id == item.id) || {};
            const cm = cms.find(c => c.item_id == item.id) || {};

            const fila = document.createElement('tr');
            fila.className = 'fila-item';
            fila.dataset.itemId = item.id;
            fila.style.verticalAlign = 'top';

            // Columnas fijas
            fila.innerHTML = `
                <td style="vertical-align:middle;">${item.modulo_id || ''}</td>
                <td style="vertical-align:middle;text-align:left;min-width:200px;">${item.descripcion || ''}</td>
                <td style="vertical-align:middle;">${item.unidad || ''}</td>
                <td style="vertical-align:middle;">${item.cantidad || 0}</td>
                <td style="vertical-align:middle;">${item.precio_unitario || 0}</td>
                <td style="vertical-align:middle;font-weight:bold;">${item.total || 0}</td>
                <td style="vertical-align:middle;">${oc.cantidad || 0}</td>
                <td style="vertical-align:middle;">${oc.precio || 0}</td>
                <td style="vertical-align:middle;">${oc.total || 0}</td>
                <td style="vertical-align:middle;">${cm.cantidad || 0}</td>
                <td style="vertical-align:middle;">${cm.precio || 0}</td>
                <td style="vertical-align:middle;">${cm.total || 0}</td>
                <td style="vertical-align:middle;font-weight:bold;">${item.porcentaje_incidencia || '0%'}</td>
                <td class="columna-evidencia" style="min-width:350px;padding:10px;background:#0a0a0a;">
                    ${crearBloqueEvidenciaHTML(item.id, evidenciasPorItem[item.id] || [])}
                </td>
            `;

            // Columnas de planillas
            for (let p = 1; p <= contadorPlanillas; p++) {
                const tdCantidad = crearCeldaPlanilla('cantidad', '0', p);
                const tdPU = crearCeldaPlanilla('pu', item.precio_unitario || '0', p);
                const tdTotal = crearCeldaPlanilla('total', '0', p);
                
                tdCantidad.addEventListener('input', () => calcularTotalPlanillaFila(fila, p));
                tdPU.addEventListener('input', () => calcularTotalPlanillaFila(fila, p));

                const columnaEvidencia = fila.querySelector('.columna-evidencia');
                fila.insertBefore(tdCantidad, columnaEvidencia);
                fila.insertBefore(tdPU, columnaEvidencia);
                fila.insertBefore(tdTotal, columnaEvidencia);
                
                calcularTotalPlanillaFila(fila, p);
            }

            tabla.appendChild(fila);

            // Cargar datos guardados de planillas
            const plansItem = planillas.filter(p => p.item_id == item.id);
            plansItem.forEach(plan => {
                const inicio = 13;
                const offset = (plan.numero_planilla - 1) * 3;
                if (fila.cells[inicio + offset]) fila.cells[inicio + offset].textContent = plan.cantidad || '0';
                if (fila.cells[inicio + offset + 1]) fila.cells[inicio + offset + 1].textContent = plan.precio_unitario || '0';
                if (fila.cells[inicio + offset + 2]) fila.cells[inicio + offset + 2].textContent = plan.total || '0';
            });

            // Inicializar eventos de evidencias
            setTimeout(() => inicializarEventosEvidencia(fila), 100);
        }

        actualizarTotalesPlanilla();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos. Verifique la conexión.');
    }
}

function crearCeldaPlanilla(tipo, valor, planilla) {
    const td = document.createElement('td');
    td.contentEditable = tipo !== 'total';
    td.className = `planilla-${tipo}`;
    td.textContent = valor;
    td.dataset.planilla = planilla;
    td.dataset.tipo = tipo;
    
    const estilos = {
        cantidad: 'text-align:center;font-weight:bold;min-width:90px;background:#1e1e1e;color:#fff;',
        pu: 'text-align:center;font-weight:bold;min-width:90px;background:#252525;color:#00b894;',
        total: 'text-align:center;font-weight:bold;min-width:100px;background:#0a3d2e;color:#00ff88;font-size:15px;'
    };
    
    td.style.cssText = estilos[tipo] || '';
    return td;
}

function crearBloqueEvidenciaHTML(itemId, evidencias = []) {
    let html = '<div class="evidencia-gestor" style="display:flex;flex-direction:column;gap:12px;min-width:320px;">';
    
    // Cabecera
    html += `<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#ffc400;font-size:13px;font-weight:bold;">📎 EVIDENCIAS (${evidencias.length})</span>
        <button class="btn-agregar-evidencia" data-item-id="${itemId}">+ Agregar</button>
    </div>`;
    
    // Lista de evidencias
    html += '<div class="lista-evidencias" style="display:flex;flex-direction:column;gap:10px;">';
    
    if (evidencias.length === 0) {
        html += '<div class="sin-evidencias">Sin evidencias cargadas</div>';
    } else {
        evidencias.forEach(ev => {
            html += crearTarjetaEvidenciaHTML(ev);
        });
    }
    
    html += '</div>';
    
    // Input file oculto
    html += `<input type="file" accept="image/*" multiple style="display:none" class="input-evidencia" data-item-id="${itemId}">`;
    
    html += '</div>';
    
    return html;
}

function crearTarjetaEvidenciaHTML(evidencia) {
    return `
        <div class="tarjeta-evidencia" data-evidencia-id="${evidencia.id}" style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:10px;display:flex;gap:10px;transition:0.3s;">
            <div style="flex-shrink:0;position:relative;">
                <img src="${evidencia.url_imagen}" 
                     onclick="verImagenEvidencia('${evidencia.url_imagen}', '${(evidencia.descripcion || '').replace(/'/g, "\\'")}')"
                     style="width:70px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid #00b894;transition:0.3s;"
                     onmouseenter="this.style.borderColor='#ffc400';this.style.transform='scale(1.05)'"
                     onmouseleave="this.style.borderColor='#00b894';this.style.transform='scale(1)'">
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                <textarea class="descripcion-evidencia" 
                          data-evidencia-id="${evidencia.id}"
                          placeholder="Agregar descripción..."
                          style="width:100%;background:#0a0a0a;color:#ccc;border:1px solid #333;border-radius:6px;padding:6px;font-size:11px;resize:vertical;min-height:35px;"
                          rows="2">${evidencia.descripcion || ''}</textarea>
                <div style="display:flex;gap:6px;justify-content:flex-end;">
                    <button class="btn-reemplazar-img" data-evidencia-id="${evidencia.id}">🔄 Cambiar</button>
                    <button class="btn-eliminar-img" data-evidencia-id="${evidencia.id}">🗑 Eliminar</button>
                    <button class="btn-guardar-desc" data-evidencia-id="${evidencia.id}">💾 Guardar</button>
                </div>
            </div>
        </div>`;
}

function inicializarEventosEvidencia(fila) {
    const gestor = fila.querySelector('.evidencia-gestor');
    if (!gestor) return;
    
    const itemId = fila.dataset.itemId;
    const btnAgregar = gestor.querySelector('.btn-agregar-evidencia');
    const inputFile = gestor.querySelector('.input-evidencia');
    const listaEvidencias = gestor.querySelector('.lista-evidencias');
    
    // Evento botón agregar
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            inputFile.click();
        });
    }
    
    // Evento input file
    if (inputFile) {
        inputFile.addEventListener('change', (e) => manejarSubidaImagenes(e, itemId, listaEvidencias));
    }
    
    // Eventos botones de cada tarjeta
    gestor.querySelectorAll('.tarjeta-evidencia').forEach(tarjeta => {
        const evidenciaId = tarjeta.dataset.evidenciaId;
        
        tarjeta.querySelector('.btn-eliminar-img')?.addEventListener('click', () => eliminarEvidencia(evidenciaId, tarjeta));
        tarjeta.querySelector('.btn-reemplazar-img')?.addEventListener('click', () => reemplazarImagen(evidenciaId, tarjeta));
        tarjeta.querySelector('.btn-guardar-desc')?.addEventListener('click', () => guardarDescripcion(evidenciaId, tarjeta));
        
        // Hover efectos
        tarjeta.addEventListener('mouseenter', () => {
            tarjeta.style.borderColor = '#ffc400';
            tarjeta.style.boxShadow = '0 4px 15px rgba(255,196,0,0.15)';
        });
        tarjeta.addEventListener('mouseleave', () => {
            tarjeta.style.borderColor = '#333';
            tarjeta.style.boxShadow = 'none';
        });
    });
}

async function manejarSubidaImagenes(event, itemId, listaEvidencias) {
    const archivos = event.target.files;
    if (!archivos.length) return;

    const formData = new FormData();
    for (let archivo of archivos) {
        formData.append('imagenes', archivo);
    }
    formData.append('item_id', itemId);

    try {
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'color:#ffc400;text-align:center;padding:15px;font-size:12px;';
        loadingDiv.textContent = '⏳ Subiendo imágenes...';
        listaEvidencias.appendChild(loadingDiv);

        const response = await fetch(`${URL_SERVIDOR}/subir-evidencias`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        loadingDiv.remove();

        if (result.success) {
            // Actualizar contador
            const gestor = listaEvidencias.parentElement;
            const headerSpan = gestor.querySelector('span');
            const totalActual = parseInt(headerSpan.textContent.match(/\d+/)[0]) || 0;
            headerSpan.textContent = `📎 EVIDENCIAS (${totalActual + result.evidencias.length})`;

            // Agregar nuevas tarjetas
            result.evidencias.forEach(ev => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = crearTarjetaEvidenciaHTML(ev);
                const tarjeta = tempDiv.firstElementChild;
                listaEvidencias.appendChild(tarjeta);
                
                // Inicializar eventos de la nueva tarjeta
                setTimeout(() => {
                    tarjeta.querySelector('.btn-eliminar-img')?.addEventListener('click', () => eliminarEvidencia(ev.id, tarjeta));
                    tarjeta.querySelector('.btn-reemplazar-img')?.addEventListener('click', () => reemplazarImagen(ev.id, tarjeta));
                    tarjeta.querySelector('.btn-guardar-desc')?.addEventListener('click', () => guardarDescripcion(ev.id, tarjeta));
                    
                    tarjeta.addEventListener('mouseenter', () => {
                        tarjeta.style.borderColor = '#ffc400';
                        tarjeta.style.boxShadow = '0 4px 15px rgba(255,196,0,0.15)';
                    });
                    tarjeta.addEventListener('mouseleave', () => {
                        tarjeta.style.borderColor = '#333';
                        tarjeta.style.boxShadow = 'none';
                    });
                }, 50);
            });

            // Quitar mensaje "sin evidencias"
            const sinEvidencias = listaEvidencias.querySelector('.sin-evidencias');
            if (sinEvidencias) sinEvidencias.remove();

        } else {
            alert('Error al subir imágenes: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al subir imágenes');
        const loadingDiv = listaEvidencias.querySelector('div[style*="color:#ffc400"]');
        if (loadingDiv) loadingDiv.remove();
    }

    event.target.value = '';
}

async function eliminarEvidencia(evidenciaId, tarjeta) {
    if (!confirm('¿Eliminar esta evidencia permanentemente?')) return;

    try {
        const response = await fetch(`${URL_SERVIDOR}/evidencias/${evidenciaId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            tarjeta.style.transition = '0.3s';
            tarjeta.style.opacity = '0';
            tarjeta.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                const lista = tarjeta.parentElement;
                tarjeta.remove();
                
                // Actualizar contador
                const gestor = lista.parentElement;
                const headerSpan = gestor.querySelector('span');
                const totalActual = parseInt(headerSpan.textContent.match(/\d+/)[0]) || 0;
                headerSpan.textContent = `📎 EVIDENCIAS (${totalActual - 1})`;
                
                if (lista.children.length === 0) {
                    lista.innerHTML = '<div class="sin-evidencias">Sin evidencias cargadas</div>';
                }
            }, 300);
        } else {
            alert('Error al eliminar: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function reemplazarImagen(evidenciaId, tarjeta) {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    
    inputFile.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const formData = new FormData();
        formData.append('imagen', archivo);
        formData.append('evidencia_id', evidenciaId);

        try {
            const imgElement = tarjeta.querySelector('img');
            imgElement.style.opacity = '0.5';

            const response = await fetch(`${URL_SERVIDOR}/reemplazar-evidencia`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                imgElement.src = result.url_imagen + '?t=' + Date.now();
                imgElement.style.opacity = '1';
            } else {
                alert('Error al reemplazar: ' + (result.error || 'Error desconocido'));
                imgElement.style.opacity = '1';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
            tarjeta.querySelector('img').style.opacity = '1';
        }
    });

    inputFile.click();
}

async function guardarDescripcion(evidenciaId, tarjeta) {
    const textarea = tarjeta.querySelector('.descripcion-evidencia');
    const descripcion = textarea.value.trim();
    const btnGuardar = tarjeta.querySelector('.btn-guardar-desc');
    
    try {
        btnGuardar.textContent = '⏳';
        btnGuardar.disabled = true;

        const response = await fetch(`${URL_SERVIDOR}/evidencias/${evidenciaId}/descripcion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion })
        });

        const result = await response.json();

        if (result.success) {
            btnGuardar.textContent = '✅';
            setTimeout(() => {
                btnGuardar.textContent = '💾 Guardar';
                btnGuardar.disabled = false;
            }, 1500);
        } else {
            alert('Error al guardar descripción');
            btnGuardar.textContent = '💾 Guardar';
            btnGuardar.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
        btnGuardar.textContent = '💾 Guardar';
        btnGuardar.disabled = false;
    }
}

function verImagenEvidencia(url, descripcion) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;justify-content:center;align-items:center;z-index:999999;backdrop-filter:blur(10px);';
    modal.innerHTML = `
        <div style="position:relative;max-width:95%;max-height:95%;display:flex;flex-direction:column;align-items:center;gap:20px;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position:absolute;top:-50px;right:0;background:rgba(255,0,0,0.8);color:white;border:none;width:40px;height:40px;border-radius:50%;font-size:24px;cursor:pointer;z-index:1;transition:0.3s;"
                    onmouseenter="this.style.background='red';this.style.transform='scale(1.1)'"
                    onmouseleave="this.style.background='rgba(255,0,0,0.8)';this.style.transform='scale(1)'">
                ×
            </button>
            <img src="${url}" 
                 style="max-width:90vw;max-height:80vh;object-fit:contain;border-radius:15px;border:3px solid #ffc400;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
            ${descripcion ? `<p style="color:#ffc400;font-size:16px;max-width:600px;text-align:center;background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:10px;">${descripcion}</p>` : ''}
        </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function calcularTotalPlanillaFila(fila, numeroPlanilla) {
    const inicio = 13;
    const offset = (numeroPlanilla - 1) * 3;
    
    const cantidad = parseFloat(fila.cells[inicio + offset]?.textContent) || 0;
    const pu = parseFloat(fila.cells[inicio + offset + 1]?.textContent) || 0;
    const total = cantidad * pu;
    
    if (fila.cells[inicio + offset + 2]) {
        fila.cells[inicio + offset + 2].textContent = total.toFixed(2);
        
        fila.cells[inicio + offset + 2].style.transition = '0.3s';
        fila.cells[inicio + offset + 2].style.background = '#00ff8822';
        setTimeout(() => {
            fila.cells[inicio + offset + 2].style.background = '#0a3d2e';
        }, 300);
    }
    
    actualizarTotalesPlanilla();
}

function actualizarTotalesPlanilla() {
    let totalContrato = 0;
    
    document.querySelectorAll('.fila-item').forEach(fila => {
        fila.querySelectorAll('.planilla-total').forEach(td => {
            totalContrato += parseFloat(td.textContent) || 0;
        });
    });
    
    const totalElement = document.getElementById('totalContratoPlanilla');
    if (totalElement) {
        totalElement.textContent = totalContrato.toFixed(2);
        totalElement.style.color = totalContrato > 0 ? '#00ff88' : '#666';
    }
}

function agregarPlanillaGeneral(actualizarFilas = true) {
    contadorPlanillas++;
    
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    
    const thPrincipal = document.createElement('th');
    thPrincipal.colSpan = 3;
    thPrincipal.textContent = `PLANILLA Nº${contadorPlanillas}`;
    thPrincipal.style.cssText = 'background:linear-gradient(145deg, #00b894, #00695c);color:white;font-size:14px;';
    
    const incHeader = Array.from(fp.children).find(th => th.textContent.includes('% INC'));
    if (incHeader) {
        fp.insertBefore(thPrincipal, incHeader);
    } else {
        fp.appendChild(thPrincipal);
    }
    
    ['CANTIDAD', 'P.U. Bs', 'TOTAL Bs'].forEach(texto => {
        const thSecundario = document.createElement('th');
        thSecundario.textContent = texto;
        thSecundario.style.cssText = 'background:#1a3a2e;color:#00ff88;font-size:12px;';
        const evidenciaHeader = Array.from(fs.children).find(th => th.textContent.includes('EVIDENCIA'));
        if (evidenciaHeader) {
            fs.insertBefore(thSecundario, evidenciaHeader);
        } else {
            fs.appendChild(thSecundario);
        }
    });
    
    if (actualizarFilas) {
        document.querySelectorAll('.fila-item').forEach(fila => {
            const tdCantidad = crearCeldaPlanilla('cantidad', '0', contadorPlanillas);
            const tdPU = crearCeldaPlanilla('pu', fila.cells[4]?.textContent || '0', contadorPlanillas);
            const tdTotal = crearCeldaPlanilla('total', '0', contadorPlanillas);
            
            tdCantidad.addEventListener('input', () => calcularTotalPlanillaFila(fila, contadorPlanillas));
            tdPU.addEventListener('input', () => calcularTotalPlanillaFila(fila, contadorPlanillas));
            
            const columnaEvidencia = fila.querySelector('.columna-evidencia');
            if (columnaEvidencia) {
                fila.insertBefore(tdCantidad, columnaEvidencia);
                fila.insertBefore(tdPU, columnaEvidencia);
                fila.insertBefore(tdTotal, columnaEvidencia);
            }
            
            calcularTotalPlanillaFila(fila, contadorPlanillas);
        });
    }
    
    document.querySelectorAll('.fila-modulo').forEach(fm => {
        fm.cells[0].colSpan = 14 + (contadorPlanillas * 3);
    });
    
    actualizarTotalesPlanilla();
}

function eliminarPlanillaGeneral() {
    if (contadorPlanillas <= 1) {
        alert('⚠️ Debe existir al menos una planilla');
        return;
    }
    
    if (!confirm(`¿Eliminar Planilla Nº${contadorPlanillas} y todos sus datos?`)) return;
    
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    
    const headersPrincipales = Array.from(fp.children);
    const headerPlanilla = headersPrincipales.find(th => th.textContent === `PLANILLA Nº${contadorPlanillas}`);
    if (headerPlanilla) headerPlanilla.remove();
    
    // Eliminar 3 subcabeceras
    let eliminados = 0;
    const headersSecundarios = Array.from(fs.children);
    for (let i = headersSecundarios.length - 1; i >= 0 && eliminados < 3; i--) {
        const th = headersSecundarios[i];
        if (th.textContent !== 'EVIDENCIA' && th.textContent !== '% INC.' && 
            th.textContent !== 'CANT.' && th.textContent !== 'P.U.Bs' && th.textContent !== 'TOTAL') {
            th.remove();
            eliminados++;
        }
    }
    
    document.querySelectorAll('.fila-item').forEach(fila => {
        const celdasPlanilla = fila.querySelectorAll(`[data-planilla="${contadorPlanillas}"]`);
        celdasPlanilla.forEach(celda => celda.remove());
    });
    
    contadorPlanillas--;
    
    document.querySelectorAll('.fila-modulo').forEach(fm => {
        fm.cells[0].colSpan = 14 + (contadorPlanillas * 3);
    });
    
    actualizarTotalesPlanilla();
}

async function guardarPlanillas() {
    const filas = document.querySelectorAll('.fila-item');
    const datos = [];
    
    filas.forEach(fila => {
        const itemId = parseInt(fila.dataset.itemId);
        
        for (let p = 1; p <= contadorPlanillas; p++) {
            const inicio = 13;
            const offset = (p - 1) * 3;
            
            datos.push({
                numero_planilla: p,
                item_id: itemId,
                cantidad: parseFloat(fila.cells[inicio + offset]?.textContent) || 0,
                precio_unitario: parseFloat(fila.cells[inicio + offset + 1]?.textContent) || 0,
                total: parseFloat(fila.cells[inicio + offset + 2]?.textContent) || 0
            });
        }
    });
    
    // Guardar descripciones pendientes
    document.querySelectorAll('.descripcion-evidencia').forEach(textarea => {
        const evidenciaId = textarea.dataset.evidenciaId;
        if (evidenciaId && textarea.value.trim()) {
            fetch(`${URL_SERVIDOR}/evidencias/${evidenciaId}/descripcion`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: textarea.value.trim() })
            }).catch(err => console.error('Error guardando descripción:', err));
        }
    });
    
    if (!datos.length) {
        alert('No hay datos para guardar');
        return;
    }
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Planillas y evidencias guardadas exitosamente');
        } else {
            alert('❌ Error al guardar: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión al guardar');
    }
}

// Funciones de utilidad
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
    boton.classList.toggle('activo');
    
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
    if (e.target.textContent === '📞 CONTACTOS') {
        abrirContactos();
        const menu = document.querySelector('.menu');
        const boton = document.querySelector('.menu-hamburguesa');
        if (menu && menu.classList.contains('activo')) {
            menu.classList.remove('activo');
            boton.classList.remove('activo');
        }
    }
});