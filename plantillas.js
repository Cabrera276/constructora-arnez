const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contadorPlanillas = 0;

window.addEventListener('load', () => cargarDatos());

async function cargarDatos() {
    try {
        const [itemsRes, ocRes, cmRes, planRes] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`),
            fetch(`${URL_SERVIDOR}/contratos-mod`),
            fetch(`${URL_SERVIDOR}/planillas`)
        ]);

        const items = await itemsRes.json();
        const ocs = await ocRes.json();
        const cms = await cmRes.json();
        const planillas = await planRes.json();

        const maxPlanilla = Math.max(...planillas.map(p => p.numero_planilla), 0);
        
        // Agregar cabeceras de planillas existentes
        for (let i = 1; i <= maxPlanilla; i++) {
            agregarPlanillaGeneral(false);
        }
        // Si no hay planillas, agregar una por defecto
        if (maxPlanilla === 0) {
            agregarPlanillaGeneral(false);
        }

        const tabla = document.getElementById('tablaReporte');
        tabla.innerHTML = '';

        let moduloAnterior = null;

        for (const item of items) {
            // Agregar fila de módulo si cambia
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                const fm = document.createElement('tr');
                fm.className = 'fila-modulo';
                fm.style.background = '#dcdcdc';
                // Calcular colspan dinámico: columnas fijas (14) + columnas de planillas (3 por planilla)
                const colspan = 14 + (contadorPlanillas * 3);
                fm.innerHTML = `<td colspan="${colspan}" style="font-weight:bold;font-size:18px;text-align:left;padding:14px;color:black">MÓDULO ${String(item.modulo_id).padStart(2, '0')}</td>`;
                tabla.appendChild(fm);
            }

            const oc = ocs.find(o => o.item_id == item.id) || {};
            const cm = cms.find(c => c.item_id == item.id) || {};

            const fila = document.createElement('tr');
            fila.className = 'fila-item';
            fila.dataset.itemId = item.id;

            // Columnas fijas del item
            fila.innerHTML = `
                <td>${item.modulo_id || ''}</td>
                <td>${item.descripcion || ''}</td>
                <td>${item.unidad || ''}</td>
                <td>${item.cantidad || 0}</td>
                <td>${item.precio_unitario || 0}</td>
                <td>${item.total || 0}</td>
                <td>${oc.cantidad || 0}</td>
                <td>${oc.precio || 0}</td>
                <td>${oc.total || 0}</td>
                <td>${cm.cantidad || 0}</td>
                <td>${cm.precio || 0}</td>
                <td>${cm.total || 0}</td>
                <td>${item.porcentaje_incidencia || '0%'}</td>
                <td class="columna-evidencia" style="text-align:center; min-width:150px;">
                    <div class="evidencia-container" data-item-id="${item.id}">
                        <input type="file" 
                               accept="image/*" 
                               class="input-imagen" 
                               style="display:none" 
                               data-item-id="${item.id}">
                        <button class="btn-subir-imagen" 
                                onclick="abrirSelectorImagen(this, ${item.id})"
                                style="background:#00b894; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px; margin-bottom:5px;">
                            📷 Subir
                        </button>
                        <div class="preview-imagen" style="margin-top:5px; position:relative; display:inline-block;">
                            ${item.imagen_evidencia ? 
                                `<div style="position:relative; display:inline-block;">
                                    <img src="${item.imagen_evidencia}" 
                                         class="mini-img" 
                                         onclick="verImagenGrande('${item.imagen_evidencia}')"
                                         style="width:80px;height:80px;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid #00b894;">
                                    <button onclick="eliminarImagen(${item.id}, this)" 
                                            style="position:absolute; top:-8px; right:-8px; background:red; color:white; border:none; width:24px; height:24px; border-radius:50%; cursor:pointer; font-size:14px; line-height:1;">
                                        ×
                                    </button>
                                </div>` 
                                : '<span class="sin-imagen" style="color:#999; font-size:11px;">Sin evidencia</span>'}
                        </div>
                    </div>
                </td>
            `;

            // Agregar columnas de planillas (CANTIDAD, P.U. Bs, TOTAL)
            for (let p = 1; p <= contadorPlanillas; p++) {
                // Columna CANTIDAD
                const tdCantidad = document.createElement('td');
                tdCantidad.contentEditable = 'true';
                tdCantidad.className = 'planilla-cantidad';
                tdCantidad.textContent = '0';
                tdCantidad.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;background:#fff;';
                tdCantidad.dataset.planilla = p;
                tdCantidad.dataset.tipo = 'cantidad';
                tdCantidad.addEventListener('input', function() {
                    calcularTotalPlanillaFila(fila, p);
                });

                // Columna P.U. Bs
                const tdPU = document.createElement('td');
                tdPU.contentEditable = 'true';
                tdPU.className = 'planilla-pu';
                tdPU.textContent = item.precio_unitario || '0';
                tdPU.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;background:#f0f0f0;';
                tdPU.dataset.planilla = p;
                tdPU.dataset.tipo = 'pu';
                tdPU.addEventListener('input', function() {
                    calcularTotalPlanillaFila(fila, p);
                });

                // Columna TOTAL (calculado automáticamente)
                const tdTotal = document.createElement('td');
                tdTotal.className = 'planilla-total';
                tdTotal.textContent = '0';
                tdTotal.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;background:#e8f5e9;';
                tdTotal.dataset.planilla = p;
                tdTotal.dataset.tipo = 'total';

                // Insertar antes de la columna de evidencia (penúltima columna)
                const columnaEvidencia = fila.querySelector('.columna-evidencia');
                fila.insertBefore(tdCantidad, columnaEvidencia);
                fila.insertBefore(tdPU, columnaEvidencia);
                fila.insertBefore(tdTotal, columnaEvidencia);
                
                // Calcular total inicial
                calcularTotalPlanillaFila(fila, p);
            }

            tabla.appendChild(fila);

            // Cargar datos guardados de planillas para este item
            const plansItem = planillas.filter(p => p.item_id == item.id);
            plansItem.forEach(plan => {
                const inicio = 13; // índice donde empiezan las columnas de planilla
                const offset = (plan.numero_planilla - 1) * 3;
                const idxCantidad = inicio + offset;
                const idxPU = inicio + offset + 1;
                const idxTotal = inicio + offset + 2;
                
                if (fila.cells[idxCantidad]) fila.cells[idxCantidad].textContent = plan.cantidad || '0';
                if (fila.cells[idxPU]) fila.cells[idxPU].textContent = plan.precio_unitario || item.precio_unitario || '0';
                if (fila.cells[idxTotal]) fila.cells[idxTotal].textContent = plan.total || '0';
            });
        }

        actualizarTotalesPlanilla();
        configurarListenersImagenes();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para calcular total de una planilla específica en una fila
function calcularTotalPlanillaFila(fila, numeroPlanilla) {
    const inicio = 13; // índice donde empiezan las columnas de planilla
    const offset = (numeroPlanilla - 1) * 3;
    const idxCantidad = inicio + offset;
    const idxPU = inicio + offset + 1;
    const idxTotal = inicio + offset + 2;
    
    const cantidad = parseFloat(fila.cells[idxCantidad]?.textContent) || 0;
    const pu = parseFloat(fila.cells[idxPU]?.textContent) || 0;
    const total = cantidad * pu;
    
    if (fila.cells[idxTotal]) {
        fila.cells[idxTotal].textContent = total.toFixed(2);
    }
    
    actualizarTotalesPlanilla();
}

// Función para actualizar todos los totales
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
    }
    
    // Actualizar colspan del footer si es necesario
    actualizarFooterColspan();
}

function actualizarFooterColspan() {
    const footerRow = document.querySelector('tfoot tr');
    if (footerRow) {
        const totalCell = footerRow.querySelector('td:first-child');
        if (totalCell) {
            // Las columnas fijas antes de las planillas son 5 (hasta CONTRATO ORIGINAL)
            totalCell.colSpan = 5;
        }
    }
}

function agregarPlanillaGeneral(actualizarFilas = true) {
    contadorPlanillas++;
    
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    
    // Agregar cabecera principal
    const thPrincipal = document.createElement('th');
    thPrincipal.colSpan = 3;
    thPrincipal.textContent = `PLANILLA Nº${contadorPlanillas}`;
    thPrincipal.style.background = 'linear-gradient(145deg, #00b894, #009d7a)';
    thPrincipal.style.color = 'white';
    
    // Insertar antes de %INC y EVIDENCIA
    const incHeader = Array.from(fp.children).find(th => th.textContent.includes('% INC'));
    fp.insertBefore(thPrincipal, incHeader);
    
    // Agregar subcabeceras
    ['CANTIDAD', 'P.U. Bs', 'TOTAL'].forEach(texto => {
        const thSecundario = document.createElement('th');
        thSecundario.textContent = texto;
        thSecundario.style.background = '#e0f7fa';
        
        const evidenciaHeader = Array.from(fs.children).find(th => th.textContent.includes('% INC') || th.textContent.includes('EVIDENCIA'));
        fs.insertBefore(thSecundario, evidenciaHeader);
    });
    
    // Agregar columnas a las filas existentes
    if (actualizarFilas) {
        document.querySelectorAll('.fila-item').forEach(fila => {
            const tdCantidad = document.createElement('td');
            tdCantidad.contentEditable = 'true';
            tdCantidad.className = 'planilla-cantidad';
            tdCantidad.textContent = '0';
            tdCantidad.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;';
            tdCantidad.dataset.planilla = contadorPlanillas;
            tdCantidad.dataset.tipo = 'cantidad';
            tdCantidad.addEventListener('input', function() {
                calcularTotalPlanillaFila(fila, contadorPlanillas);
            });
            
            const tdPU = document.createElement('td');
            tdPU.contentEditable = 'true';
            tdPU.className = 'planilla-pu';
            tdPU.textContent = fila.cells[4]?.textContent || '0'; // PU del contrato original
            tdPU.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;background:#f0f0f0;';
            tdPU.dataset.planilla = contadorPlanillas;
            tdPU.dataset.tipo = 'pu';
            tdPU.addEventListener('input', function() {
                calcularTotalPlanillaFila(fila, contadorPlanillas);
            });
            
            const tdTotal = document.createElement('td');
            tdTotal.className = 'planilla-total';
            tdTotal.textContent = '0';
            tdTotal.style.cssText = 'text-align:center;font-weight:bold;min-width:80px;background:#e8f5e9;';
            tdTotal.dataset.planilla = contadorPlanillas;
            tdTotal.dataset.tipo = 'total';
            
            const columnaEvidencia = fila.querySelector('.columna-evidencia');
            fila.insertBefore(tdCantidad, columnaEvidencia);
            fila.insertBefore(tdPU, columnaEvidencia);
            fila.insertBefore(tdTotal, columnaEvidencia);
            
            calcularTotalPlanillaFila(fila, contadorPlanillas);
        });
    }
    
    // Actualizar colspan de filas de módulo
    document.querySelectorAll('.fila-modulo').forEach(fm => {
        const nuevoColspan = 14 + (contadorPlanillas * 3);
        fm.cells[0].colSpan = nuevoColspan;
    });
    
    actualizarTotalesPlanilla();
}

function eliminarPlanillaGeneral() {
    if (contadorPlanillas <= 1) {
        alert('Debe existir al menos una planilla');
        return;
    }
    
    if (!confirm(`¿Eliminar Planilla Nº${contadorPlanillas}?`)) return;
    
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    
    // Encontrar y eliminar cabecera de planilla
    const headers = Array.from(fp.children);
    const headerPlanilla = headers.find(th => th.textContent === `PLANILLA Nº${contadorPlanillas}`);
    if (headerPlanilla) headerPlanilla.remove();
    
    // Eliminar 3 subcabeceras
    for (let i = 0; i < 3; i++) {
        const ultimoHeader = Array.from(fs.children).find(th => 
            !th.textContent.includes('% INC') && 
            !th.textContent.includes('EVIDENCIA') &&
            th !== fs.firstElementChild
        );
        if (fs.lastElementChild && 
            fs.lastElementChild.textContent !== 'EVIDENCIA' && 
            fs.lastElementChild.textContent !== '% INC.') {
            fs.removeChild(fs.lastElementChild);
        }
    }
    
    // Eliminar columnas de todas las filas
    document.querySelectorAll('.fila-item').forEach(fila => {
        const celdasPlanilla = fila.querySelectorAll(`[data-planilla="${contadorPlanillas}"]`);
        celdasPlanilla.forEach(celda => celda.remove());
    });
    
    contadorPlanillas--;
    
    // Actualizar colspan de filas de módulo
    document.querySelectorAll('.fila-modulo').forEach(fm => {
        const nuevoColspan = 14 + (contadorPlanillas * 3);
        fm.cells[0].colSpan = nuevoColspan;
    });
    
    actualizarTotalesPlanilla();
}

// Funciones para manejo de imágenes de evidencia
function configurarListenersImagenes() {
    document.querySelectorAll('.input-imagen').forEach(input => {
        input.addEventListener('change', function(e) {
            const itemId = this.dataset.itemId;
            const archivo = e.target.files[0];
            if (archivo) {
                subirImagen(itemId, archivo, this);
            }
        });
    });
}

function abrirSelectorImagen(boton, itemId) {
    const inputFile = boton.parentElement.querySelector('.input-imagen');
    if (inputFile) {
        inputFile.click();
    }
}

async function subirImagen(itemId, archivo, inputElement) {
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('item_id', itemId);
    
    try {
        // Mostrar loading
        const previewDiv = inputElement.parentElement.querySelector('.preview-imagen');
        previewDiv.innerHTML = '<span style="color:#ffc400;">⏳ Subiendo...</span>';
        
        const response = await fetch(`${URL_SERVIDOR}/subir-evidencia`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar preview
            previewDiv.innerHTML = `
                <div style="position:relative; display:inline-block;">
                    <img src="${result.url_imagen}" 
                         class="mini-img" 
                         onclick="verImagenGrande('${result.url_imagen}')"
                         style="width:80px;height:80px;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid #00b894;">
                    <button onclick="eliminarImagen(${itemId}, this)" 
                            style="position:absolute; top:-8px; right:-8px; background:red; color:white; border:none; width:24px; height:24px; border-radius:50%; cursor:pointer; font-size:14px; line-height:1;">
                        ×
                    </button>
                </div>`;
        } else {
            alert('Error al subir imagen: ' + (result.error || 'Error desconocido'));
            previewDiv.innerHTML = '<span class="sin-imagen" style="color:#999; font-size:11px;">Sin evidencia</span>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al subir imagen');
        const previewDiv = inputElement.parentElement.querySelector('.preview-imagen');
        previewDiv.innerHTML = '<span class="sin-imagen" style="color:#999; font-size:11px;">Sin evidencia</span>';
    }
}

async function eliminarImagen(itemId, boton) {
    if (!confirm('¿Eliminar esta imagen de evidencia?')) return;
    
    try {
        const response = await fetch(`${URL_SERVIDOR}/eliminar-evidencia/${itemId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            const previewDiv = boton.parentElement.parentElement;
            previewDiv.innerHTML = '<span class="sin-imagen" style="color:#999; font-size:11px;">Sin evidencia</span>';
        } else {
            alert('Error al eliminar imagen');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function verImagenGrande(url) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:flex;justify-content:center;align-items:center;z-index:99999';
    modal.innerHTML = `
        <div style="position:relative; max-width:90%; max-height:90%;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position:absolute; top:-40px; right:0; background:red; color:white; border:none; width:35px; height:35px; border-radius:50%; font-size:20px; cursor:pointer; z-index:1;">
                ×
            </button>
            <img src="${url}" 
                 style="max-width:90vw; max-height:85vh; object-fit:contain; border-radius:15px; border:3px solid #ffc400;">
        </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
}

async function guardarPlanillas() {
    const filas = document.querySelectorAll('.fila-item');
    const datos = [];
    
    filas.forEach(fila => {
        const itemId = parseInt(fila.dataset.itemId);
        
        for (let p = 1; p <= contadorPlanillas; p++) {
            const inicio = 13; // índice donde empiezan planillas
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
            alert('✅ Planillas guardadas exitosamente');
        } else {
            alert('❌ Error al guardar: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión al guardar');
    }
}

// Funciones existentes que se mantienen
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
    const menu = document.querySelector('.menu'), boton = document.querySelector('.menu-hamburguesa');
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

// Hacer clicable el CONTACTOS del menú
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

// También mantener la función verImagen original para compatibilidad
function verImagen(imagenesJSON, desc) {
    let imagenes = [];
    try { 
        imagenes = JSON.parse(decodeURIComponent(imagenesJSON || '[]')); 
    } catch { 
        try { 
            imagenes = JSON.parse(imagenesJSON || '[]'); 
        } catch { 
            imagenes = [imagenesJSON]; 
        } 
    }
    if (!Array.isArray(imagenes) || imagenes.length === 0) imagenes = [imagenesJSON];
    
    let indice = 0;
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:flex;justify-content:center;align-items:center;z-index:99999';
    modal.innerHTML = `<div style="background:#111;padding:25px;border-radius:20px;max-width:800px;width:90%;text-align:center;position:relative;border:2px solid #ffc933">
        <button id="cerrarEv" style="position:absolute;top:10px;right:10px;background:red;color:white;border:none;width:35px;height:35px;border-radius:50%;font-size:18px;cursor:pointer">×</button>
        ${imagenes.length > 1 ? 
            `<div style="display:flex;align-items:center;justify-content:center;gap:15px;margin:20px 0">
                <button onclick="cambiarImg(-1)" style="background:#ffc933;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;font-weight:bold">❮</button>
                <img id="imgEv" src="${imagenes[0]}" style="max-width:80%;max-height:450px;object-fit:contain;border-radius:15px">
                <button onclick="cambiarImg(1)" style="background:#ffc933;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;font-weight:bold">❯</button>
            </div>
            <p style="color:#ffc933;font-size:14px">Imagen 1 de ${imagenes.length}</p>` 
            : 
            `<img src="${imagenes[0]}" style="max-width:80%;max-height:450px;object-fit:contain;border-radius:15px;margin:20px 0">`}
        <p style="color:white;font-size:16px;margin-top:10px">${desc || ''}</p>
    </div>`;
    
    document.body.appendChild(modal);
    window.cambiarImg = function(dir) { 
        indice += dir; 
        if (indice < 0) indice = imagenes.length - 1; 
        if (indice >= imagenes.length) indice = 0; 
        const imgEl = document.getElementById('imgEv'); 
        if (imgEl) imgEl.src = imagenes[indice]; 
    };
    
    document.getElementById('cerrarEv').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) modal.remove(); 
    });
}