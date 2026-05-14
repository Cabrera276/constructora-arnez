const usuario = localStorage.getItem("usuario");

if(!usuario){

    window.location.replace("index.html");

}
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