<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - Sistema POS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-[#0f172a] flex items-center justify-center h-screen">

    <div class="w-full max-w-md p-8 space-y-8 bg-[#1e293b] rounded-xl shadow-lg">
        
        <div class="text-center">
            <div class="mx-auto mb-4 w-24 h-24 flex items-center justify-center bg-gray-700 rounded-full">
                <span class="text-gray-400 font-bold text-lg">Logo</span>
            </div>
            <h1 class="text-3xl font-bold text-white">
                Bienvenido de Nuevo
            </h1>
            <p class="text-gray-400">
                Inicia sesión para acceder a tu sucursal
            </p>
        </div>

        <form class="mt-8 space-y-6" action="#" method="POST">
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="username" class="sr-only">Usuario</label>
                    <input id="username" name="username" type="text" required class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-[#6a5acd] focus:border-[#6a5acd] focus:z-10 sm:text-sm rounded-t-md" placeholder="Nombre de usuario">
                </div>
                <div>
                    <label for="password" class="sr-only">Contraseña</label>
                    <input id="password" name="password" type="password" required class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-[#6a5acd] focus:border-[#6a5acd] focus:z-10 sm:text-sm rounded-b-md" placeholder="Contraseña">
                </div>
            </div>

            <div>
                <button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#6a5acd] hover:bg-[#5a4cad] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    Iniciar Sesión
                </button>
            </div>
        </form>
    </div>

    <script src="js/rutas.js"></script>
    <script src="js/login.js"></script>
</body>
</html>
