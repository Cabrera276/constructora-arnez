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
let contadorItems = 1; // ✅ NUEVO: Numeración consecutiva de ítems

// URL base del servidor
const URL_SERVIDOR = "https://constructora-arnez.onrender.com";

// ============================
// TOAST DE NOTIFICACIÓN (MEJORA #9)
// ============================
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icono = toast.querySelector('i');
    const texto = toast.querySelector('span');
    
    texto.textContent = mensaje;
    
    if (tipo === 'success') {
        toast.style.background = '#1db954';
        icono.className = 'fa fa-check-circle';
    } else if (tipo === 'error') {
        toast.style.background = '#ff3b3b';
        icono.className = 'fa fa-exclamation-circle';
    } else if (tipo === 'info') {
        toast.style.background = '#2d8cff';
        icono.className = 'fa fa-info-circle';
    } else if (tipo === 'warning') {
        toast.style.background = '#ff9800';
        icono.className = 'fa fa-exclamation-triangle';
    }
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================
// MODO OSCURO (MEJORA #10)
// ============================
function toggleModoOscuro() {
    modoOscuro = !modoOscuro;
    const tabla = document.querySelector('table');
    const boton = document.querySelector('.modo-oscuro-toggle');
    
    if (modoOscuro) {
        tabla.classList.add('modo-oscuro');
        if (boton) {
            boton.innerHTML = '<i class="fa fa-sun"></i>';
            boton.style.background = '#ffc933';
            boton.style.color = '#111';
        }
        localStorage.setItem('modoOscuro', 'true');
        mostrarToast('🌙 Modo oscuro activado', 'info');
    } else {
        tabla.classList.remove('modo-oscuro');
        if (boton) {
            boton.innerHTML = '<i class="fa fa-moon"></i>';
            boton.style.background = '#333';
            boton.style.color = '#ffc933';
        }
        localStorage.setItem('modoOscuro', 'false');
        mostrarToast('☀️ Modo claro activado', 'info');
    }
}

function cargarModoOscuro() {
    const preferencia = localStorage.getItem('modoOscuro');
    if (preferencia === 'true') {
        modoOscuro = false;
        toggleModoOscuro();
    }
}

// ============================
// MODAL DE CONFIRMACIÓN
// ============================
function abrirModal(titulo, mensaje, callback) {
    document.getElementById('confirmTitle').innerText = titulo;
    document.getElementById('confirmText').innerText = mensaje;
    document.getElementById('confirmModal').style.display = 'flex';
    accionConfirmada = callback;
}

document.getElementById('cancelBtn').onclick = () => {
    document.getElementById('confirmModal').style.display = 'none';
};

document.getElementById('acceptBtn').onclick = () => {
    if (accionConfirmada) {
        accionConfirmada();
    }
    document.getElementById('confirmModal').style.display = 'none';
};

// ============================
// FILTRAR ÍTEMS (MEJORA #7)
// ============================
function filtrarItems() {
    const input = document.getElementById('buscarItem');
    if (!input) return;
    
    const busqueda = input.value.toLowerCase();
    let encontrados = 0;
    
    document.querySelectorAll('#tablaItems tr:not(.grupo-modulo):not(.total-modulo)').forEach(fila => {
        const descripcion = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const modulo = fila.querySelector('td:first-child')?.textContent || '';
        
        if (descripcion.includes(busqueda) || modulo.includes(busqueda)) {
            fila.style.display = '';
            encontrados++;
        } else {
            fila.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.modulo;
        const itemsVisibles = document.querySelectorAll(
            `tr[data-modulo="${moduloId}"]:not(.grupo-modulo):not(.total-modulo)`
        );
        let hayVisibles = false;
        itemsVisibles.forEach(item => {
            if (item.style.display !== 'none') hayVisibles = true;
        });
        modulo.style.display = hayVisibles || busqueda === '' ? '' : 'none';
        
        const totalModulo = document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`);
        if (totalModulo) {
            totalModulo.style.display = hayVisibles || busqueda === '' ? '' : 'none';
        }
    });
    
    if (busqueda !== '') {
        console.log(`🔍 Encontrados: ${encontrados} ítems para "${busqueda}"`);
    }
}

// ============================
// COLAPSAR/EXPANDIR MÓDULO (MEJORA #4)
// ============================
function toggleModulo(moduloId, elementoFlecha) {
    const items = document.querySelectorAll(`tr[data-modulo="${moduloId}"]`);
    const flecha = elementoFlecha.querySelector('i');
    
    if (!flecha) return;
    
    let ocultar = !flecha.classList.contains('colapsado');
    
    items.forEach(item => {
        if (!item.classList.contains('grupo-modulo') && !item.classList.contains('total-modulo')) {
            item.style.display = ocultar ? 'none' : '';
        }
    });
    
    const totalModulo = document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`);
    if (totalModulo) {
        totalModulo.style.display = ocultar ? 'none' : '';
    }
    
    if (ocultar) {
        flecha.classList.add('colapsado');
    } else {
        flecha.classList.remove('colapsado');
    }
}

// ============================
// ACTUALIZAR CONTADORES (MEJORA #6)
// ============================
function actualizarContadores() {
    document.querySelectorAll('.grupo-modulo').forEach(modulo => {
        const moduloId = modulo.dataset.modulo;
        const items = document.querySelectorAll(
            `tr[data-modulo="${moduloId}"]:not(.grupo-modulo):not(.total-modulo)`
        );
        const badge = modulo.querySelector('.badge-items');
        if (badge) {
            badge.textContent = `${items.length} ítems`;
        }
    });
}

// ============================
// AÑADIR MÓDULO
// ============================
document.getElementById('btnModulo').addEventListener('click', () => {
    const tabla = document.getElementById('tablaItems');
    const totalColumnas = 11 + (ordenCambio * 3) + (contratoMod * 3);

    const filaModulo = document.createElement('tr');
    filaModulo.classList.add('grupo-modulo');
    filaModulo.dataset.modulo = moduloActual;
    filaModulo.innerHTML = `
        <td colspan="${totalColumnas}" class="modulo-row">
            <div class="modulo-content">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="toggle-modulo" onclick="toggleModulo('${moduloActual}', this)" title="Colapsar/Expandir módulo">
                        <i class="fa fa-chevron-down"></i>
                    </span>
                    <span contenteditable="true" title="Clic para editar nombre del módulo">MÓDULO ${String(moduloActual).padStart(2, '0')}</span>
                    <span class="badge-items">0 ítems</span>
                </div>
                <div class="table-actions">
                    <button class="edit-btn" onclick="editarModulo(this)" title="Editar nombre del módulo">
                        <i class="fa fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="eliminarModulo(this)" title="Eliminar módulo y todos sus ítems">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
        </td>
    `;
    tabla.appendChild(filaModulo);

    const filaTotal = document.createElement('tr');
    filaTotal.classList.add('total-modulo');
    filaTotal.dataset.modulo = moduloActual;
    filaTotal.innerHTML = `
        <td colspan="5"><strong>TOTAL MÓDULO</strong></td>
        <td>0.00</td>
        <td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 5}"></td>
    `;
    tabla.appendChild(filaTotal);

    moduloActual++;
    actualizarContadores();
    mostrarToast('✅ Módulo creado correctamente', 'success');
    console.log('✅ Módulo creado. Próximo módulo será:', moduloActual);
});

// ============================
// AÑADIR ÍTEM - CORREGIDO CON NUMERACIÓN CONSECUTIVA
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
        moduloId = modulos[0].dataset.modulo;
        console.log('📌 Solo hay un módulo, ID:', moduloId);
    } else {
        let mensaje = 'Selecciona el módulo para este ítem:\n\n';
        modulos.forEach((mod, index) => {
            const texto = mod.querySelector('span[contenteditable]')?.innerText || 
                         mod.querySelector('span')?.innerText || 
                         `MÓDULO ${mod.dataset.modulo}`;
            mensaje += `  ${index + 1}. ${texto}\n`;
        });
        mensaje += '\nEscribe el número y presiona Aceptar:';
        
        const seleccion = prompt(mensaje);
        if (!seleccion) return;
        
        const indice = parseInt(seleccion) - 1;
        if (isNaN(indice) || indice < 0 || indice >= modulos.length) {
            mostrarToast('⚠️ Número de módulo inválido', 'error');
            return;
        }
        
        moduloId = modulos[indice].dataset.modulo;
        console.log('📌 Módulo seleccionado:', moduloId);
    }

    let columnasOC = '';
    let columnasCM = '';

    for (let i = 0; i < ordenCambio; i++) {
        columnasOC += `
            <td contenteditable="true" title="Cantidad OC${i+1}"></td>
            <td contenteditable="true" title="Precio Unitario OC${i+1}"></td>
            <td title="Total OC${i+1}"></td>
        `;
    }

    for (let i = 0; i < contratoMod; i++) {
        columnasCM += `
            <td contenteditable="true" title="Cantidad CM${i+1}"></td>
            <td contenteditable="true" title="Precio Unitario CM${i+1}"></td>
            <td title="Total CM${i+1}"></td>
        `;
    }

    const fila = document.createElement('tr');
    fila.dataset.modulo = moduloId;
    fila.innerHTML = `
        <td>${contadorItems}</td>
        <td contenteditable="true" title="Descripción del ítem"></td>
        <td contenteditable="true" title="Unidad de medida"></td>
        <td contenteditable="true" title="Cantidad"></td>
        <td contenteditable="true" title="Precio Unitario"></td>
        <td title="Total"></td>
        ${columnasOC}
        ${columnasCM}
        <td contenteditable="true" title="Porcentaje de incidencia">0%</td>
        <td>
            <div class="evidencia-box">
                <input type="file" class="input-imagen" accept="image/*" onchange="cargarImagen(event,this)" data-imagenes="[]" style="display:none">
                <button type="button" class="btn-subir" onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()" title="Subir imagen de evidencia">Subir</button>
                <input type="text" class="descripcion-img" placeholder="Descripción" value="" title="Descripción de la imagen">
                <button type="button" class="btn-ver" onclick="verImagen(this)" title="Ver imágenes">Ver</button>
            </div>
        </td>
        <td>
            <div class="table-actions">
                <button type="button" class="edit-btn" onclick="editarFila(this)" title="Editar este ítem"><i class="fa fa-pen"></i></button>
                <button type="button" class="delete-btn" onclick="eliminarFila(this)" title="Eliminar este ítem"><i class="fa fa-trash"></i></button>
            </div>
        </td>
    `;

    contadorItems++; // ✅ Incrementar contador

    const totalModulo = document.querySelector(`.total-modulo[data-modulo="${moduloId}"]`);
    if (totalModulo) {
        tabla.insertBefore(fila, totalModulo);
    } else {
        tabla.appendChild(fila);
    }

    actualizarTotales();
    actualizarContadores();
    mostrarToast('✅ Ítem agregado correctamente', 'success');
    console.log('✅ Ítem insertado en módulo', moduloId, '| Número:', contadorItems - 1);
});

// ============================
// AÑADIR ORDEN DE CAMBIO
// ============================
document.getElementById('btnOC').addEventListener('click', () => {
    ordenCambio++;
    agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`);
    mostrarToast(`✅ Orden de Cambio Nº${ordenCambio} agregada`, 'success');
});

// ============================
// AÑADIR CONTRATO MODIFICATORIO
// ============================
document.getElementById('btnCM').addEventListener('click', () => {
    contratoMod++;
    agregarGrupo(`CONTRATO MOD Nº${contratoMod}`);
    mostrarToast(`✅ Contrato Mod. Nº${contratoMod} agregado`, 'success');
});

// ============================
// AGREGAR GRUPO DE COLUMNAS (OC/CM)
// ============================
function agregarGrupo(titulo) {
    const filaPrincipal = document.getElementById('filaPrincipal');
    const filaSecundaria = document.getElementById('filaSecundaria');

    const grupo = document.createElement('th');
    grupo.colSpan = 3;
    grupo.innerText = titulo;
    filaPrincipal.insertBefore(grupo, filaPrincipal.children[filaPrincipal.children.length - 3]);

    ['CANT.', 'P.U.Bs', 'TOTAL'].forEach(texto => {
        const th = document.createElement('th');
        th.innerText = texto;
        filaSecundaria.appendChild(th);
    });

    document.querySelectorAll('#tablaItems tr').forEach(fila => {
        if (!fila.querySelector('.modulo-row') && !fila.classList.contains('total-modulo')) {
            const c1 = fila.insertCell(fila.cells.length - 3);
            c1.contentEditable = true;
            c1.title = 'Cantidad';
            const c2 = fila.insertCell(fila.cells.length - 3);
            c2.contentEditable = true;
            c2.title = 'Precio Unitario';
            fila.insertCell(fila.cells.length - 3).title = 'Total';
        }
    });
}

// ============================
// ACTUALIZAR TOTALES
// ============================
document.addEventListener('input', actualizarTotales);

function actualizarTotales() {
    const filas = document.querySelectorAll('#tablaItems tr');
    let totalGeneral = 0;
    let totalModuloOriginal = 0;
    let totalesOCModulo = new Array(ordenCambio).fill(0);
    let totalesCMModulo = new Array(contratoMod).fill(0);

    filas.forEach(fila => {
        if (fila.classList.contains('grupo-modulo')) {
            totalModuloOriginal = 0;
            totalesOCModulo = new Array(ordenCambio).fill(0);
            totalesCMModulo = new Array(contratoMod).fill(0);
            return;
        }

        if (fila.classList.contains('total-modulo')) {
            let htmlTotales = `
                <td colspan="5"><strong>TOTAL MÓDULO</strong></td>
                <td>${totalModuloOriginal.toFixed(2)}</td>
            `;
            totalesOCModulo.forEach(total => {
                htmlTotales += `<td></td><td></td><td>${total.toFixed(2)}</td>`;
            });
            totalesCMModulo.forEach(total => {
                htmlTotales += `<td></td><td></td><td>${total.toFixed(2)}</td>`;
            });
            htmlTotales += `<td colspan="5"></td>`;
            fila.innerHTML = htmlTotales;
            return;
        }

        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 6) return;

        const puOriginal = parseFloat(celdas[4]?.innerText) || 0;
        const totalOriginal = puOriginal;
        celdas[5].innerText = totalOriginal.toFixed(2);

        let inicioOC = 6;
        for (let i = 0; i < ordenCambio; i++) {
            const precioOC = parseFloat(celdas[inicioOC + 1]?.innerText) || 0;
            totalesOCModulo[i] += precioOC;
            celdas[inicioOC + 2].innerText = precioOC.toFixed(2);
            inicioOC += 3;
        }

        let inicioCM = 6 + (ordenCambio * 3);
        for (let i = 0; i < contratoMod; i++) {
            const precioCM = parseFloat(celdas[inicioCM + 1]?.innerText) || 0;
            totalesCMModulo[i] += precioCM;
            celdas[inicioCM + 2].innerText = precioCM.toFixed(2);
            inicioCM += 3;
        }

        let sumaFila = totalOriginal;
        totalesOCModulo.forEach(t => sumaFila += t);
        totalesCMModulo.forEach(t => sumaFila += t);

        totalGeneral += sumaFila;
        totalModuloOriginal += totalOriginal;
    });

    const filaTotal = document.querySelector('tfoot tr');
    if (filaTotal) {
        filaTotal.innerHTML = `
            <td colspan="5"><strong>TOTAL CONTRATO</strong></td>
            <td><strong>${totalGeneral.toFixed(2)}</strong></td>
            <td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 5}"></td>
        `;
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
        mostrarToast('⚠️ Guarda primero los datos antes de editar', 'warning');
        return;
    }

    const datos = {
        descripcion: celdas[1].innerText,
        unidad: celdas[2].innerText,
        cantidad: parseFloat(celdas[3].innerText) || 0,
        precio_unitario: parseFloat(celdas[4].innerText) || 0,
        total: parseFloat(celdas[5].innerText) || 0
    };

    try {
        const respuesta = await fetch(`${URL_SERVIDOR}/editar-item/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        if (data.success) {
            mostrarToast('✅ Ítem actualizado correctamente', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al actualizar el ítem', 'error');
    }
}

// ============================
// ELIMINAR ÍTEM
// ============================
async function eliminarFila(btn) {
    const fila = btn.closest('tr');
    const id = fila.dataset.id;

    abrirModal('Eliminar ítem', '¿Seguro que deseas eliminar este ítem?', async () => {
        if (id) {
            try {
                await fetch(`${URL_SERVIDOR}/eliminar-item/${id}`, { method: 'DELETE' });
                console.log('✅ Ítem eliminado del servidor');
            } catch (error) {
                console.error('Error:', error);
            }
        }
        fila.remove();
        actualizarTotales();
        actualizarContadores();
        mostrarToast('🗑 Ítem eliminado correctamente', 'info');
    });
}

// ============================
// EDITAR MÓDULO
// ============================
function editarModulo(btn) {
    const modulo = btn.closest('.modulo-row');
    const texto = modulo.querySelector('span[contenteditable]');
    if (texto) {
        texto.contentEditable = true;
        texto.focus();
        mostrarToast('📝 Puedes editar el nombre del módulo', 'info');
    }
}

// ============================
// ELIMINAR MÓDULO
// ============================
function eliminarModulo(btn) {
    abrirModal('Eliminar módulo', '¿Seguro que deseas eliminar este módulo y todos sus ítems?', () => {
        const filaModulo = btn.closest('tr');
        const moduloId = filaModulo.dataset.modulo;
        const filas = document.querySelectorAll('#tablaItems tr');

        let contador = 0;
        filas.forEach(fila => {
            if (fila.dataset.modulo == moduloId) {
                fila.remove();
                contador++;
            }
        });

        actualizarTotales();
        actualizarContadores();
        mostrarToast(`🗑 Módulo eliminado con ${contador - 2} ítems`, 'info');
    });
}

// ============================
// CARGAR IMAGEN
// ============================
async function cargarImagen(event, input) {
    const archivos = Array.from(input.files);
    if (archivos.length === 0) return;

    try {
        let imagenesActuales = [];
        try {
            imagenesActuales = JSON.parse(decodeURIComponent(input.dataset.imagenes || '[]'));
        } catch {
            imagenesActuales = [];
        }
        
        if (imagenesActuales.length >= 4) {
            mostrarToast('⚠️ Máximo 4 imágenes por ítem', 'warning');
            return;
        }

        let cargadas = 0;
        archivos.forEach(archivo => {
            const reader = new FileReader();
            reader.onload = e => {
                imagenesActuales.push(e.target.result);
                input.dataset.imagenes = JSON.stringify(imagenesActuales);
                cargadas++;
                if (cargadas === archivos.length) {
                    mostrarToast(`📷 ${cargadas} imagen(es) cargada(s)`, 'success');
                }
            };
            reader.readAsDataURL(archivo);
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error cargando imágenes', 'error');
    }
}

// ============================
// VER IMAGEN (CON CARRUSEL)
// ============================
function verImagen(btn) {
    const fila = btn.closest('tr');
    const inputImagen = fila.querySelector('.input-imagen');
    const inputDescripcion = fila.querySelector('.descripcion-img');
    
    let imagenes = [];
    try {
        imagenes = JSON.parse(decodeURIComponent(inputImagen.dataset.imagenes || '[]'));
    } catch {
        imagenes = [];
    }

    if (imagenes.length === 0) {
        mostrarToast('⚠️ Primero selecciona imágenes', 'warning');
        return;
    }

    let indiceActual = 0;
    const descripcion = inputDescripcion?.value || '';

    const modal = document.createElement('div');
    modal.innerHTML = `
        <style>
            .carrusel-container{position:relative;display:flex;align-items:center;justify-content:center;gap:20px;padding:20px}
            .carrusel-btn{background:#f5b400;border:none;width:50px;height:50px;border-radius:50%;font-size:25px;cursor:pointer;font-weight:bold;transition:0.3s;display:flex;align-items:center;justify-content:center}
            .carrusel-btn:hover{background:#ff9900;transform:scale(1.1)}
            .contador-imagenes{color:#ffc933;font-size:14px;margin-top:10px}
        </style>
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:99999;">
            <div style="background:#111;padding:25px;border-radius:20px;position:relative;max-width:800px;width:90%;text-align:center;border:1px solid #ffc933;">
                <button id="cerrarModal" style="position:absolute;top:15px;right:15px;background:red;color:white;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;z-index:10;">×</button>
                <div class="carrusel-container">
                    <button class="carrusel-btn prev" onclick="cambiarImagen(-1)">❮</button>
                    <img id="imagenCarrusel" src="${imagenes[0]}" style="width:100%;max-height:500px;object-fit:contain;border-radius:15px;">
                    <button class="carrusel-btn next" onclick="cambiarImagen(1)">❯</button>
                </div>
                <p class="contador-imagenes">Imagen 1 de ${imagenes.length}</p>
                <p style="color:white;font-size:18px;margin-top:10px;">${descripcion}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    window.cambiarImagen = function(direccion) {
        indiceActual += direccion;
        if (indiceActual < 0) indiceActual = imagenes.length - 1;
        if (indiceActual >= imagenes.length) indiceActual = 0;
        document.getElementById('imagenCarrusel').src = imagenes[indiceActual];
        document.querySelector('.contador-imagenes').textContent = `Imagen ${indiceActual + 1} de ${imagenes.length}`;
    };

    document.getElementById('cerrarModal').onclick = () => modal.remove();
    
    const cerrarConEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', cerrarConEsc);
        }
    };
    document.addEventListener('keydown', cerrarConEsc);
}

// ============================
// GUARDAR EN MYSQL
// ============================
document.getElementById("btnGuardar").addEventListener("click", guardarDatos);

async function guardarDatos() {
    const filas = document.querySelectorAll("#tablaItems tr");
    const datos = [];

    for (const fila of filas) {
        if (fila.classList.contains("grupo-modulo") || fila.classList.contains("total-modulo")) continue;

        const celdas = fila.children;
        if (celdas.length < 6) continue;

        const descripcion = celdas[1]?.textContent.trim();
        if (descripcion === '') continue;

        let ordenesCambio = [];
        let contratosMod = [];

        let inicioOC = 6;
        for (let i = 0; i < ordenCambio; i++) {
            ordenesCambio.push({
                numero: i + 1,
                cantidad: parseFloat(celdas[inicioOC]?.innerText) || 0,
                precio: parseFloat(celdas[inicioOC + 1]?.innerText) || 0,
                total: parseFloat(celdas[inicioOC + 2]?.innerText) || 0
            });
            inicioOC += 3;
        }

        let inicioCM = 6 + (ordenCambio * 3);
        for (let i = 0; i < contratoMod; i++) {
            contratosMod.push({
                numero: i + 1,
                cantidad: parseFloat(celdas[inicioCM]?.innerText) || 0,
                precio: parseFloat(celdas[inicioCM + 1]?.innerText) || 0,
                total: parseFloat(celdas[inicioCM + 2]?.innerText) || 0
            });
            inicioCM += 3;
        }

        const box = fila.querySelector('.evidencia-box');
        const inputImagen = box?.querySelector('.input-imagen');
        const descripcionImagen = box?.querySelector('.descripcion-img');

        datos.push({
            modulo_id: parseInt(fila.dataset.modulo),
            descripcion: descripcion,
            unidad: celdas[2]?.innerText.trim() || '',
            cantidad: parseFloat(celdas[3]?.innerText) || 0,
            precio_unitario: parseFloat(celdas[4]?.innerText) || 0,
            total: parseFloat(celdas[5]?.innerText) || 0,
            ordenesCambio,
            contratosMod,
            imagen: inputImagen?.dataset.imagenes || '',
            descripcion_imagen: descripcionImagen?.value || '',
            porcentaje_incidencia: 0
        });
    }

    if (datos.length === 0) {
        mostrarToast('⚠️ No hay datos para guardar', 'warning');
        return;
    }

    const btnGuardar = document.getElementById('btnGuardar');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    try {
        const respuesta = await fetch(`${URL_SERVIDOR}/guardar-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        
        if (data.success) {
            mostrarToast(`✅ ${datos.length} ítems guardados`, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            mostrarToast('❌ Error: ' + (data.mensaje || 'Desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error conectando con el servidor', 'error');
    } finally {
        btnGuardar.innerHTML = textoOriginal;
        btnGuardar.disabled = false;
    }
}

// ============================
// CARGAR ITEMS DESDE MYSQL
// ============================
async function cargarItems() {
    try {
        const [itemsRes, ocRes, cmRes] = await Promise.all([
            fetch(`${URL_SERVIDOR}/items`),
            fetch(`${URL_SERVIDOR}/ordenes-cambio`),
            fetch(`${URL_SERVIDOR}/contratos-mod`)
        ]);

        const items = await itemsRes.json();
        const ordenesCambioDB = await ocRes.json();
        const contratosModDB = await cmRes.json();

        const maxOC = Math.max(...ordenesCambioDB.map(oc => oc.numero_oc), 0);
        for (let i = 0; i < maxOC; i++) {
            ordenCambio++;
            agregarGrupo(`ORDEN CAMBIO Nº${ordenCambio}`);
        }

        const maxCM = Math.max(...contratosModDB.map(cm => cm.numero_cm), 0);
        for (let i = 0; i < maxCM; i++) {
            contratoMod++;
            agregarGrupo(`CONTRATO MOD Nº${contratoMod}`);
        }

        const tabla = document.getElementById('tablaItems');
        tabla.innerHTML = '';

        let moduloAnterior = null;
        let numeroVisualModulo = 1;
        const modulosCreados = [];

        items.forEach(item => {
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                modulosCreados.push(item.modulo_id);

                const filaModulo = document.createElement('tr');
                filaModulo.classList.add('grupo-modulo');
                filaModulo.dataset.modulo = item.modulo_id;
                filaModulo.innerHTML = `
                    <td colspan="${11 + (ordenCambio * 3) + (contratoMod * 3)}" class="modulo-row">
                        <div class="modulo-content">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="toggle-modulo" onclick="toggleModulo('${item.modulo_id}', this)" title="Colapsar/Expandir módulo">
                                    <i class="fa fa-chevron-down"></i>
                                </span>
                                <span contenteditable="true">MÓDULO ${String(numeroVisualModulo).padStart(2, '0')}</span>
                                <span class="badge-items">0 ítems</span>
                            </div>
                            <div class="table-actions">
                                <button class="edit-btn" onclick="editarModulo(this)">✏️</button>
                                <button class="delete-btn" onclick="eliminarModulo(this)">🗑</button>
                            </div>
                        </div>
                    </td>
                `;
                tabla.appendChild(filaModulo);
                numeroVisualModulo++;
            }

            const ocItem = ordenesCambioDB.filter(oc => oc.item_id == item.id);
            let columnasOC = '';
            ocItem.forEach(oc => {
                columnasOC += `
                    <td contenteditable="true">${oc.cantidad}</td>
                    <td contenteditable="true">${oc.precio}</td>
                    <td>${oc.total}</td>
                `;
            });

            const cmItem = contratosModDB.filter(cm => cm.item_id == item.id);
            let columnasCM = '';
            cmItem.forEach(cm => {
                columnasCM += `
                    <td contenteditable="true">${cm.cantidad}</td>
                    <td contenteditable="true">${cm.precio}</td>
                    <td>${cm.total}</td>
                `;
            });

            const fila = document.createElement('tr');
            fila.dataset.modulo = item.modulo_id;
            fila.dataset.id = item.id;
            fila.innerHTML = `
                <td>${item.modulo_id}</td>
                <td contenteditable="true">${item.descripcion || ''}</td>
                <td contenteditable="true">${item.unidad || ''}</td>
                <td contenteditable="true">${item.cantidad || 0}</td>
                <td contenteditable="true">${item.precio_unitario || 0}</td>
                <td>${item.total || 0}</td>
                ${columnasOC}
                ${columnasCM}
                <td contenteditable="true">${item.porcentaje_incidencia || 0}%</td>
                <td>
                    <div class="evidencia-box">
                        <input type="file" class="input-imagen" accept="image/*" onchange="cargarImagen(event,this)" data-imagenes='${item.imagen || "[]"}' style="display:none">
                        <button type="button" class="btn-subir" onclick="this.closest('.evidencia-box').querySelector('.input-imagen').click()">Subir</button>
                        <input type="text" class="descripcion-img" placeholder="Descripción" value="${item.descripcion_imagen || ''}">
                        <button type="button" class="btn-ver" onclick="verImagen(this)">Ver</button>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="edit-btn" onclick="editarFila(this)"><i class="fa fa-pen"></i></button>
                        <button type="button" class="delete-btn" onclick="eliminarFila(this)"><i class="fa fa-trash"></i></button>
                    </div>
                </td>
            `;
            tabla.appendChild(fila);
        });

        modulosCreados.forEach(moduloId => {
            const filaTotal = document.createElement('tr');
            filaTotal.classList.add('total-modulo');
            filaTotal.dataset.modulo = moduloId;
            filaTotal.innerHTML = `
                <td colspan="5"><strong>TOTAL MÓDULO</strong></td>
                <td>0.00</td>
                <td colspan="${(ordenCambio * 3) + (contratoMod * 3) + 5}"></td>
            `;
            
            const filasModulo = [...tabla.querySelectorAll(`tr[data-modulo="${moduloId}"]`)];
            const ultimaFila = filasModulo[filasModulo.length - 1];
            if (ultimaFila) ultimaFila.after(filaTotal);
        });

        actualizarTotales();
        actualizarContadores();

        if (items.length > 0) {
            moduloActual = Math.max(...items.map(item => item.modulo_id)) + 1;
        }

        console.log('✅ Datos cargados:', items.length, 'ítems');
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ============================
// ELIMINAR ORDEN DE CAMBIO
// ============================
function eliminarOC() {
    if (ordenCambio <= 0) {
        mostrarToast('⚠️ No hay Órdenes de Cambio', 'warning');
        return;
    }

    abrirModal('Eliminar Orden Cambio', `¿Eliminar Orden de Cambio Nº${ordenCambio}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');

        filaPrincipal.children[filaPrincipal.children.length - 4].remove();
        for (let i = 0; i < 3; i++) filaSecundaria.lastElementChild.remove();

        document.querySelectorAll('#tablaItems tr').forEach(fila => {
            if (!fila.classList.contains('grupo-modulo')) {
                for (let i = 0; i < 3; i++) fila.deleteCell(fila.cells.length - 4);
            }
        });

        ordenCambio--;
        actualizarTotales();
        mostrarToast(`🗑 OC Nº${ordenCambio + 1} eliminada`, 'info');
    });
}

// ============================
// ELIMINAR CONTRATO MOD
// ============================
function eliminarCM() {
    if (contratoMod <= 0) {
        mostrarToast('⚠️ No hay Contratos Mod.', 'warning');
        return;
    }

    abrirModal('Eliminar Contrato Mod.', `¿Eliminar Contrato Mod. Nº${contratoMod}?`, () => {
        const filaPrincipal = document.getElementById('filaPrincipal');
        const filaSecundaria = document.getElementById('filaSecundaria');

        filaPrincipal.children[filaPrincipal.children.length - 4].remove();
        for (let i = 0; i < 3; i++) filaSecundaria.lastElementChild.remove();

        document.querySelectorAll('#tablaItems tr').forEach(fila => {
            if (!fila.classList.contains('grupo-modulo')) {
                for (let i = 0; i < 3; i++) fila.deleteCell(fila.cells.length - 4);
            }
        });

        contratoMod--;
        actualizarTotales();
        mostrarToast(`🗑 CM Nº${contratoMod + 1} eliminado`, 'info');
    });
}

// ============================
// MODAL DE CONTACTOS
// ============================
function abrirContactos() {
    document.getElementById("modalContactos").style.display = "flex";
}

function cerrarContactos() {
    document.getElementById("modalContactos").style.display = "none";
}

window.addEventListener("click", function(e) {
    if (e.target === document.getElementById("modalContactos")) cerrarContactos();
});

// ============================
// MENÚ HAMBURGUESA
// ============================
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

document.querySelectorAll('.menu a').forEach(enlace => {
    enlace.addEventListener('click', () => {
        const menu = document.querySelector('.menu');
        const boton = document.querySelector('.menu-hamburguesa');
        if (menu && boton && menu.classList.contains('activo')) {
            menu.classList.remove('activo');
            boton.classList.remove('activo');
            const icono = boton.querySelector('i');
            if (icono) { icono.classList.remove('fa-times'); icono.classList.add('fa-bars'); }
        }
    });
});

// ============================
// CERRAR MODALES CON ESC
// ============================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('confirmModal').style.display = 'none';
        document.getElementById('modalContactos').style.display = 'none';
    }
});

// ============================
// CARGAR DATOS AL INICIAR
// ============================
window.addEventListener('load', () => {
    cargarItems();
    cargarModoOscuro();
    console.log('🚀 Sistema cargado');
});