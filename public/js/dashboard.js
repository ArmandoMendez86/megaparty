// Archivo: /public/js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {
 /*  const userNombreElem = document.getElementById("user-nombre");
  const userRolElem = document.getElementById("user-rol"); */
  //const sucursalNombreElem = document.getElementById("sucursal-nombre");


  function checkSession() {
    fetch("/multi-sucursal/check-session")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.user) {
          if (userNombreElem) userNombreElem.textContent = data.user.nombre;
          if (userRolElem) userRolElem.textContent = data.user.rol;
        } else {
          window.location.href = "login.php";
        }
      })
      .catch((error) => {
        console.error("Error al verificar la sesión:", error);
        window.location.href = "login.php";
      });
  }

 

  checkSession();

  

  
});
