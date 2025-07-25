<?php
require_once __DIR__ . '/../parciales/verificar_sesion.php'; 
?>
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Impresoras - Sistema POS</title>
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
      <h1 class="text-3xl font-bold text-white mb-8">
        Configuración de Impresora
      </h1>
      <div class="bg-[#1e293b] p-6 rounded-lg max-w-lg mx-auto">
        <form id="printer-form" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Impresora de Tickets
            </h3>
            <p class="text-sm text-gray-400 mb-4">
              Selecciona la impresora térmica que usarás para imprimir los
              recibos en esta estación de trabajo.
            </p>
            <div class="flex items-end gap-4">
              <div class="flex-1">
                <label
                  for="impresora_tickets"
                  class="block text-sm font-medium text-gray-300 mb-1">Impresora Seleccionada</label>
                <select
                  id="impresora_tickets"
                  name="impresora_tickets"
                  class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600">
                  <option value="">-- Busque impresoras --</option>
                </select>
              </div>
              <button
                type="button"
                id="find-printers-btn"
                class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                <i class="fas fa-search mr-2"></i> Buscar
              </button>
            </div>
            <p id="qz-status" class="text-xs text-gray-500 mt-2">
              Estado de QZ Tray:
              <span class="font-semibold">Desconectado</span>
            </p>
          </div>
          <div class="pt-4 flex justify-end">
            <button
              type="submit"
              class="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-2 px-6 rounded-lg">
              Guardar Impresora
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qz-tray@2.2/qz-tray.min.js"></script>
  <script src="js/qz-tray-handler.js"></script>
  <script src="js/rutas.js"></script>
  <script src="js/toast.js"></script>
  <script src="js/impresoras.js"></script>
</body>

</html>