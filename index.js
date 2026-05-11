/* =========================
   LOGIN MYSQL
========================= */

async function iniciarSesion(){

    const usuario =
    document.getElementById("usuario").value;

    const password =
    document.getElementById("password").value;

    /* VALIDAR CAMPOS */

    if(!usuario || !password){

        alert("Completa todos los campos");

        return;
    }

    try{

        const respuesta = await fetch(

            "http://localhost:3000/login",

            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body: JSON.stringify({
                    usuario,
                    password
                })

            }

        );

        const data = await respuesta.json();

        /* LOGIN CORRECTO */

        if(data.success){

            /* GUARDAR DATOS */

            localStorage.setItem(
                "rol",
                data.usuario.rol
            );

            localStorage.setItem(
                "usuario",
                data.usuario.usuario
            );

            /* REDIRECCION */

            window.location.href =
            "inicio.html";

        }else{

            document.getElementById(
                "error-popup"
            ).style.display = "flex";

        }

    }catch(error){

        console.log(error);

        alert(
            "Error conectando con el servidor"
        );

    }

}

/* =========================
   CERRAR ERROR
========================= */

function cerrarError(){

    document.getElementById(
        "error-popup"
    ).style.display = "none";

}

/* =========================
   MOSTRAR / OCULTAR PASSWORD
========================= */

function togglePassword(){

    const input =
    document.getElementById("password");

    if(input.type === "password"){

        input.type = "text";

    }else{

        input.type = "password";

    }

}