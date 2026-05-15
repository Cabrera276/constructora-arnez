// ============================
// VERIFICAR SESIÓN
// ============================
const usuario = localStorage.getItem("usuario");

if(!usuario){
    window.location.replace("index.html");
}

// ============================
// MODAL DE CONTACTOS
// ============================
function abrirContactos(){
    document.getElementById("modalContactos").style.display = "flex";
}

function cerrarContactos(){
    document.getElementById("modalContactos").style.display = "none";
}

window.addEventListener("click", function(e){
    const modal = document.getElementById("modalContactos");
    if(e.target === modal){
        cerrarContactos();
    }
});

// ============================
// MENÚ HAMBURGUESA
// ============================
function toggleMenu() {
    const menu = document.querySelector('.menu');
    const boton = document.querySelector('.menu-hamburguesa');
    
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

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.menu a').forEach(enlace => {
    enlace.addEventListener('click', () => {
        const menu = document.querySelector('.menu');
        const boton = document.querySelector('.menu-hamburguesa');
        
        if (menu.classList.contains('activo')) {
            menu.classList.remove('activo');
            boton.classList.remove('activo');
            
            const icono = boton.querySelector('i');
            icono.classList.remove('fa-times');
            icono.classList.add('fa-bars');
        }
    });
});