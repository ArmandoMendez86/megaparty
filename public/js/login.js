// Archivo: /public/js/login.js

document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.querySelector('form');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-center text-sm mt-4';
    loginForm.querySelector('button').insertAdjacentElement('afterend', messageDiv);

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm mt-4';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const formData = {
            username: username,
            password: password
        };

        // --- ¡ESTA ES LA LÍNEA CORREGIDA! ---
        // Usamos una ruta absoluta desde la raíz del servidor para asegurar
        // que la llamada a la API siempre sea correcta, sin importar
        // en qué archivo HTML estemos.
        const apiUrl = `${BASE_URL}/login`;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es 2xx, leemos el mensaje de error del JSON
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error en la respuesta del servidor');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.classList.add('text-green-400');

                setTimeout(() => {
                    // La redirección a dashboard.html sigue siendo correcta
                    // porque es relativa a la ubicación actual (la carpeta public).
                    window.location.href = 'dashboard.php'; 
                }, 1000);

            } else {
                // Este 'else' ahora es un respaldo, el manejo de errores se hace arriba.
                messageDiv.textContent = data.message || 'Error desconocido.';
                messageDiv.classList.add('text-red-500');
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
            // Mostramos el mensaje de error que capturamos.
            messageDiv.textContent = error.message;
            messageDiv.classList.add('text-red-500');
        });
    });
});
