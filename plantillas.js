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
        
        for (let i = 1; i <= maxPlanilla; i++) {
            agregarPlanillaGeneral();
        }

        const tabla = document.getElementById('tablaReporte');
        tabla.innerHTML = '';

        let moduloAnterior = null;

        for (const item of items) {
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                const fm = document.createElement('tr');
                fm.className = 'fila-modulo';
                fm.style.background = '#dcdcdc';
                fm.innerHTML = `<td colspan="20" style="font-weight:bold;font-size:18px;text-align:left;padding:14px;color:black">MÓDULO ${String(item.modulo_id).padStart(2, '0')}</td>`;
                tabla.appendChild(fm);
            }

            const oc = ocs.find(o => o.item_id == item.id) || {};
            const cm = cms.find(c => c.item_id == item.id) || {};

            const fila = document.createElement('tr');
            fila.className = 'fila-item';
            fila.dataset.itemId = item.id;

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
                <td>${item.imagen ? `<img src="${item.imagen}" class="mini-img" style="width:80px;border-radius:10px;cursor:pointer" onclick="verImagen('${item.imagen}','${item.descripcion_imagen || ''}')">` : 'Sin imagen'}</td>
            `;

            // Agregar columnas de planilla en ORDEN CORRECTO
            for (let p = 1; p <= maxPlanilla; p++) {
                const td1 = document.createElement('td'); // CANTIDAD
                td1.contentEditable = 'true';
                td1.className = 'planilla-input';
                td1.textContent = '0';
                td1.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';

                const td2 = document.createElement('td'); // TOTAL (Bs)
                td2.contentEditable = 'true';
                td2.className = 'planilla-total';
                td2.textContent = '0';
                td2.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';
                td2.addEventListener('input', actualizarTotalesPlanilla);

                const td3 = document.createElement('td'); // % AVANCE
                td3.contentEditable = 'true';
                td3.className = 'avance-input';
                td3.textContent = '100%';
                td3.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';

                // Agregar ANTES de la última columna (ACCIONES)
                const penultima = fila.children.length - 1;
                fila.insertBefore(td1, fila.children[penultima]);
                fila.insertBefore(td2, fila.children[penultima + 1]);
                fila.insertBefore(td3, fila.children[penultima + 2]);
            }

            tabla.appendChild(fila);

            // Llenar valores guardados
            const plansItem = planillas.filter(p => p.item_id == item.id);
            plansItem.forEach(plan => {
                const inicio = 14 + ((plan.numero_planilla - 1) * 3);
                if (fila.cells[inicio]) fila.cells[inicio].textContent = plan.cantidad || '0';
                if (fila.cells[inicio + 1]) fila.cells[inicio + 1].textContent = plan.total || '0';
                if (fila.cells[inicio + 2]) fila.cells[inicio + 2].textContent = plan.avance || '100%';
            });
        }

        actualizarTotalesPlanilla();
    } catch (error) {
        console.error('Error:', error);
    }
}

function agregarPlanillaGeneral() {
    contadorPlanillas++;

    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');

    const th = document.createElement('th');
    th.colSpan = 3;
    th.textContent = `PLANILLA Nº${contadorPlanillas}`;
    // Insertar antes de % INCIDENCIA
    fp.insertBefore(th, fp.children[fp.children.length - 2]);

    // Subheaders en orden: CANTIDAD, TOTAL (Bs), % AVANCE
    ['CANTIDAD', 'TOTAL (Bs)', '% AVANCE'].forEach(t => {
        const th2 = document.createElement('th');
        th2.textContent = t;
        // Insertar antes de EVIDENCIA
        fs.insertBefore(th2, fs.children[fs.children.length - 1]);
    });

    document.querySelectorAll('.fila-item').forEach(fila => {
        const td1 = document.createElement('td'); // CANTIDAD
        td1.contentEditable = 'true';
        td1.className = 'planilla-input';
        td1.textContent = '0';
        td1.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';

        const td2 = document.createElement('td'); // TOTAL (Bs)
        td2.contentEditable = 'true';
        td2.className = 'planilla-total';
        td2.textContent = '0';
        td2.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';
        td2.addEventListener('input', actualizarTotalesPlanilla);

        const td3 = document.createElement('td'); // % AVANCE
        td3.contentEditable = 'true';
        td3.className = 'avance-input';
        td3.textContent = '100%';
        td3.style.cssText = 'text-align:center;font-weight:bold;min-width:80px';

        // Agregar ANTES de la última columna (IMAGEN)
        const penultima = fila.children.length - 1;
        fila.insertBefore(td1, fila.children[penultima]);
        fila.insertBefore(td2, fila.children[penultima + 1]);
        fila.insertBefore(td3, fila.children[penultima + 2]);
    });
}

function eliminarPlanillaGeneral() {
    if (contadorPlanillas <= 0) return;
    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');
    fp.children[fp.children.length - 3].remove();
    for (let i = 0; i < 3; i++) fs.lastElementChild.remove();
    document.querySelectorAll('.fila-item').forEach(fila => {
        for (let i = 0; i < 3; i++) fila.deleteCell(fila.cells.length - 3);
    });
    contadorPlanillas--;
    actualizarTotalesPlanilla();
}

function actualizarTotalesPlanilla() {
    let totalContrato = 0;
    document.querySelectorAll('.fila-item').forEach(fila => {
        let suma = 0;
        fila.querySelectorAll('.planilla-total').forEach(td => {
            suma += parseFloat(td.textContent) || 0;
        });
        totalContrato += suma;
    });
    document.getElementById('totalContratoPlanilla').textContent = totalContrato.toFixed(2);
}

async function guardarPlanillas() {
    const filas = document.querySelectorAll('.fila-item');
    const datos = [];
    filas.forEach(fila => {
        for (let p = 1; p <= contadorPlanillas; p++) {
            const inicio = 14 + ((p - 1) * 3);
            datos.push({
                numero_planilla: p,
                item_id: parseInt(fila.dataset.itemId),
                cantidad: parseFloat(fila.cells[inicio]?.textContent) || 0,
                total: parseFloat(fila.cells[inicio + 1]?.textContent) || 0,
                avance: fila.cells[inicio + 2]?.textContent || '0%'
            });
        }
    });
    if (!datos.length) { alert('No hay datos'); return; }
    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        alert((await r.json()).success ? '✅ Planillas guardadas' : '❌ Error');
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

function verImagen(src, desc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:flex;justify-content:center;align-items:center;z-index:99999';
    modal.innerHTML = `<div style="background:#111;padding:20px;border-radius:20px;max-width:700px;text-align:center"><button onclick="this.parentElement.parentElement.remove()" style="background:red;color:white;border:none;width:35px;height:35px;border-radius:50%;font-size:18px;cursor:pointer;float:right">×</button><img src="${src}" style="max-width:100%;max-height:500px;border-radius:15px;margin-top:10px"><p style="color:white;margin-top:15px;font-size:18px">${desc}</p></div>`;
    document.body.appendChild(modal);
}

function abrirContactos() { document.getElementById("modalContactos").style.display = "flex"; }
function cerrarContactos() { document.getElementById("modalContactos").style.display = "none"; }
window.addEventListener("click", function(e) { if (e.target === document.getElementById("modalContactos")) cerrarContactos(); });

function toggleMenu() {
    const menu = document.querySelector('.menu'), boton = document.querySelector('.menu-hamburguesa');
    if (!menu || !boton) return;
    menu.classList.toggle('activo'); boton.classList.toggle('activo');
    const icono = boton.querySelector('i');
    if (menu.classList.contains('activo')) { icono.classList.remove('fa-bars'); icono.classList.add('fa-times'); }
    else { icono.classList.remove('fa-times'); icono.classList.add('fa-bars'); }
}