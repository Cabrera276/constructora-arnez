const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.replace("index.html");

const URL_SERVIDOR = "https://constructora-arnez.onrender.com";
let contadorPlanillas = 0;

// ============================
// CARGAR DATOS
// ============================
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

        // Restaurar planillas existentes
        const maxPlanilla = Math.max(...planillas.map(p => p.numero_planilla), 0);
        for (let i = 1; i <= maxPlanilla; i++) {
            agregarPlanillaGeneral();
        }

        const tabla = document.getElementById('tablaReporte');
        tabla.innerHTML = '';

        let moduloAnterior = null;

        items.forEach(item => {
            // Módulo
            if (moduloAnterior != item.modulo_id) {
                moduloAnterior = item.modulo_id;
                const fm = document.createElement('tr');
                fm.className = 'fila-modulo';
                fm.style.background = '#dcdcdc';
                fm.innerHTML = `<td colspan="20" style="font-weight:bold;font-size:18px;text-align:left;padding:14px;color:black">MÓDULO ${String(item.modulo_id).padStart(2, '0')}</td>`;
                tabla.appendChild(fm);
            }

            // OC y CM del ítem
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

            tabla.appendChild(fila);

            // Llenar planillas guardadas
const plansItem = planillas.filter(p => p.item_id == item.id);
plansItem.forEach(plan => {
    const inicio = 14 + ((plan.numero_planilla - 1) * 3);
    // Esperar a que las columnas existan
    setTimeout(() => {
        if (fila.cells[inicio] && fila.cells[inicio].querySelector('input')) {
            fila.cells[inicio].querySelector('input').value = plan.cantidad;
        }
        if (fila.cells[inicio + 1] && fila.cells[inicio + 1].querySelector('input')) {
            fila.cells[inicio + 1].querySelector('input').value = plan.total;
        }
        if (fila.cells[inicio + 2] && fila.cells[inicio + 2].querySelector('input')) {
            fila.cells[inicio + 2].querySelector('input').value = plan.avance;
        }
    }, 300);
});
        });

        actualizarTotalesPlanilla();

    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ============================
// AÑADIR PLANILLA
// ============================
function agregarPlanillaGeneral() {
    contadorPlanillas++;

    const fp = document.getElementById('filaPrincipal');
    const fs = document.getElementById('filaSecundaria');

    // Header
    const th = document.createElement('th');
    th.colSpan = 3;
    th.textContent = `PLANILLA Nº${contadorPlanillas}`;
    fp.insertBefore(th, fp.children[fp.children.length - 2]);

    // Subheaders
    ['CANTIDAD', 'TOTAL Bs', '% AVANCE'].forEach(t => {
        const th2 = document.createElement('th');
        th2.textContent = t;
        fs.insertBefore(th2, fs.children[fs.children.length - 1]);
    });

    // Columnas en cada ítem
    document.querySelectorAll('.fila-item').forEach(fila => {
        const td1 = document.createElement('td');
        td1.innerHTML = '<input type="number" class="planilla-input" placeholder="0">';
        const td2 = document.createElement('td');
        td2.innerHTML = '<input type="number" class="planilla-total" placeholder="0" oninput="actualizarTotalesPlanilla()">';
        const td3 = document.createElement('td');
        td3.innerHTML = '<input type="text" class="avance-input" value="100%">';

        fila.insertBefore(td1, fila.children[fila.children.length - 2]);
        fila.insertBefore(td2, fila.children[fila.children.length - 2]);
        fila.insertBefore(td3, fila.children[fila.children.length - 2]);
    });
}

// ============================
// ELIMINAR PLANILLA
// ============================
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

// ============================
// ACTUALIZAR TOTALES
// ============================
function actualizarTotalesPlanilla() {
    let totalContrato = 0;
    document.querySelectorAll('.fila-item').forEach(fila => {
        let suma = 0;
        fila.querySelectorAll('.planilla-total').forEach(input => {
            suma += parseFloat(input.value) || 0;
        });
        totalContrato += suma;
    });
    const totalEl = document.getElementById('totalContratoPlanilla');
    if (totalEl) totalEl.textContent = totalContrato.toFixed(2);
}

// ============================
// GUARDAR PLANILLAS
// ============================
async function guardarPlanillas() {
    const filas = document.querySelectorAll('.fila-item');
    const datos = [];

    filas.forEach(fila => {
        const itemId = fila.dataset.itemId;
        for (let p = 1; p <= contadorPlanillas; p++) {
            const inicio = 14 + ((p - 1) * 3);
            const cantidad = fila.cells[inicio]?.querySelector('input')?.value || 0;
            const total = fila.cells[inicio + 1]?.querySelector('input')?.value || 0;
            const avance = fila.cells[inicio + 2]?.querySelector('input')?.value || '0%';

            datos.push({
                numero_planilla: p,
                item_id: parseInt(itemId),
                cantidad: parseFloat(cantidad) || 0,
                total: parseFloat(total) || 0,
                avance
            });
        }
    });

    if (datos.length === 0) {
        alert('No hay datos para guardar');
        return;
    }

    try {
        const r = await fetch(`${URL_SERVIDOR}/guardar-planillas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await r.json();
        alert(data.success ? '✅ Planillas guardadas' : '❌ Error al guardar');
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

// ============================
// VER IMAGEN
// ============================
function verImagen(src, desc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:flex;justify-content:center;align-items:center;z-index:99999';
    modal.innerHTML = `
        <div style="background:#111;padding:20px;border-radius:20px;max-width:700px;text-align:center">
            <button onclick="this.parentElement.parentElement.remove()" style="background:red;color:white;border:none;width:35px;height:35px;border-radius:50%;font-size:18px;cursor:pointer;float:right">×</button>
            <img src="${src}" style="max-width:100%;max-height:500px;border-radius:15px;margin-top:10px">
            <p style="color:white;margin-top:15px;font-size:18px">${desc}</p>
        </div>`;
    document.body.appendChild(modal);
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