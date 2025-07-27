<?php
require_once __DIR__ . '/../parciales/verificar_sesion.php';
if ($_SESSION['rol'] !== 'Administrador') {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administración del Sistema</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        body { font-family: 'Inter', sans-serif; }
        .modal-overlay { background-color: rgba(0, 0, 0, 0.75); }
        .tab-btn.active { background-color: #4f46e5; color: white; border-color: #4f46e5; }
        .tab-btn { background-color: transparent; color: #9ca3af; border-color: transparent; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="bg-[#0f172a] text-gray-300 flex h-screen overflow-hidden">

    <?php $currentPage = 'admin.php'; ?>
    <?php include_once __DIR__ . '/../parciales/navegacion.php'; ?>

    <main class="flex-1 p-6 overflow-y-auto">
        <div class="max-w-7xl mx-auto">
            <h1 class="text-3xl font-bold text-white mb-6">Administración del Sistema</h1>

            <div class="mb-6">
                <div class="border-b border-gray-700">
                    <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                        <button class="tab-btn active whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg" data-tab="sucursales">
                            <i class="fas fa-building mr-2"></i>Sucursales
                        </button>
                        <button class="tab-btn whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg" data-tab="usuarios">
                            <i class="fas fa-users-cog mr-2"></i>Usuarios
                        </button>
                    </nav>
                </div>
            </div>

            <div id="tab-sucursales" class="tab-content active">
                <?php include_once __DIR__ . '/../parciales/admin_sucursales.php'; ?>
            </div>

            <div id="tab-usuarios" class="tab-content">
                <?php include_once __DIR__ . '/../parciales/admin_usuarios.php'; ?>
            </div>
        </div>
    </main>

    <script src="js/rutas.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/confirm.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>
