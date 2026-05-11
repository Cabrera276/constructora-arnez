const btnAgregar =
document.getElementById(
"btnAgregarPlazo"
);

const tabla =
document.getElementById(
"tablaPlazos"
);

/* AGREGAR FILA */

btnAgregar.addEventListener(
"click",
() => {

    agregarFila();

});

/* CREAR FILA */

function agregarFila() {

    const fila =
    document.createElement("tr");

    fila.innerHTML = `

        <td contenteditable="true"></td>

        <td contenteditable="true"></td>

        <td contenteditable="true"></td>

        <td 
        contenteditable="true"
        class="plazo">
        
        </td>

        <td class="plazo-acumulado">
        
        </td>

    `;

    tabla.appendChild(fila);

    /* EVENTO */

    const plazoCelda =
    fila.querySelector(".plazo");

    plazoCelda.addEventListener(
    "input",
    calcularAcumulados
    );

}

/* CALCULAR ACUMULADOS */

function calcularAcumulados() {

    const filas =
    document.querySelectorAll(
    "#tablaPlazos tr"
    );

    let acumulado = 0;

    filas.forEach(fila => {

        const plazoCelda =
        fila.querySelector(
        ".plazo"
        );

        const acumuladoCelda =
        fila.querySelector(
        ".plazo-acumulado"
        );

        const plazo =
        parseInt(
        plazoCelda.textContent
        ) || 0;

        acumulado += plazo;

        acumuladoCelda.textContent =
        acumulado;

    });

}
/* GUARDAR DATOS */

const btnGuardar =
document.getElementById(
"btnGuardarPlazos"
);

btnGuardar.addEventListener(
"click",
guardarDatosPlazos
);

function guardarDatosPlazos(){

    const filas =
    document.querySelectorAll(
    "#tablaPlazos tr"
    );

    const datos = [];

    filas.forEach(fila => {

        const columnas =
        fila.querySelectorAll("td");

        datos.push({

            descripcion:
            columnas[0].textContent,

            inicio:
            columnas[1].textContent,

            fin:
            columnas[2].textContent,

            plazo:
            columnas[3].textContent,

            acumulado:
            columnas[4].textContent

        });

    });

    localStorage.setItem(
    "datosPlazos",
    JSON.stringify(datos)
    );

    alert(
    "Datos guardados correctamente"
    );

}