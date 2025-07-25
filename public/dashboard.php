<?php
require_once __DIR__ . '/../parciales/verificar_sesion.php';
?>

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - Sistema POS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
    rel="stylesheet" />
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

    body {
      font-family: "Inter", sans-serif;
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #1e293b;
    }

    ::-webkit-scrollbar-thumb {
      background: #4a5568;
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #718096;
    }
  </style>
</head>

<body class="bg-[#0f172a] text-gray-300">
  <div class="flex h-screen">

    <?php include_once '../parciales/navegacion.php'; ?>

    <!-- Contenido Principal -->
    <main class="flex-1 p-8 overflow-y-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Dashboard</h1>

      <!-- Métricas Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-gray-400 text-sm font-medium">Ingresos del Día</h3>
          <!-- ID AÑADIDO -->
          <p id="ingresos-dia" class="text-3xl font-bold text-green-400 mt-2">$0.00</p>
        </div>
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-gray-400 text-sm font-medium">
            Cuentas por Cobrar
          </h3>
          <!-- ID AÑADIDO -->
          <p id="cuentas-cobrar" class="text-3xl font-bold text-yellow-400 mt-2">$0.00</p>
        </div>
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-gray-400 text-sm font-medium">Gastos del Día</h3>
          <!-- ID AÑADIDO -->
          <p id="gastos-dia" class="text-3xl font-bold text-red-400 mt-2">$0.00</p>
        </div>
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-gray-400 text-sm font-medium">Ventas del Día</h3>
          <!-- ID AÑADIDO -->
          <p id="ventas-dia" class="text-3xl font-bold text-white mt-2">0</p>
        </div>
      </div>

      <!-- Gráficas y Tablas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top 5 Productos -->
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-white font-semibold mb-4">
            Top 5 Productos Más Vendidos
          </h3>
          <!-- ID AÑADIDO -->
          <div id="top-productos-container" class="text-gray-400">Cargando datos...</div>
        </div>
        <!-- Top 5 Clientes -->
        <div class="bg-[#1e293b] p-6 rounded-lg">
          <h3 class="text-white font-semibold mb-4">Top 5 Clientes</h3>
          <!-- ID AÑADIDO -->
          <div id="top-clientes-container" class="text-gray-400">Cargando datos...</div>
        </div>
      </div>
    </main>
  </div>

  <script src="js/rutas.js"></script>
  <script src="js/dashboard.js"></script>
</body>

</html>