// ============================
// INICIAR SESIÓN
// ============================
async function iniciarSesion() {
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    // Validar campos
    if (!usuario || !password) {
        alert("Completa todos los campos");
        return;
    }

    // Mostrar loading (opcional)
    const btn = document.querySelector('.login-box button');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> INGRESANDO...';
    btn.disabled = true;

    try {
        const respuesta = await fetch(
            "https://constructora-arnez.onrender.com/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario,
                    password
                })
            }
        );

        const data = await respuesta.json();

        // Login correcto
        if (data.success) {
            // Guardar usuario en localStorage
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            localStorage.setItem("usuarioRol", data.usuario.rol || 'lectura');
            
            // Redireccionar
            window.location.href = "inicio.html";
        } else {
            // Mostrar error
            document.getElementById("error-popup").style.display = "flex";
            
            // Restaurar botón
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }

    } catch (error) {
        console.log("Error:", error);
        alert("Error conectando con el servidor");
        
        // Restaurar botón
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ============================
// CERRAR POPUP DE ERROR
// ============================
function cerrarError() {
    document.getElementById("error-popup").style.display = "none";
}

// ============================
// MOSTRAR / OCULTAR CONTRASEÑA
// ============================
function togglePassword() {
    const input = document.getElementById("password");
    const icono = document.querySelector('.toggle-password');
    
    if (input.type === "password") {
        input.type = "text";
        icono.classList.remove('fa-eye');
        icono.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icono.classList.remove('fa-eye-slash');
        icono.classList.add('fa-eye');
    }
}

// ============================
// ENTER PARA INICIAR SESIÓN
// ============================
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        iniciarSesion();
    }
});