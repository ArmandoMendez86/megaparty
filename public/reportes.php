<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reportes - Sistema POS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            font-family: 'Inter', sans-serif;
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
            <h1 class="text-3xl font-bold text-white mb-8">Reportes y Análisis</h1>

            <!-- Sección de Reporte de Ventas -->
            <div class="bg-[#1e293b] p-6 rounded-lg mb-8">
                <h2 class="text-xl font-semibold text-white mb-4">Reporte de Ventas</h2>
                <!-- Filtros -->
                <div class="flex flex-wrap items-end gap-4 mb-6">
                    <div>
                        <label for="start-date" class="block text-sm font-medium text-gray-300 mb-1">Fecha de Inicio</label>
                        <input type="date" id="start-date" class="bg-gray-700 text-white rounded-md p-2 border border-gray-600">
                    </div>
                    <div>
                        <label for="end-date" class="block text-sm font-medium text-gray-300 mb-1">Fecha de Fin</label>
                        <input type="date" id="end-date" class="bg-gray-700 text-white rounded-md p-2 border border-gray-600">
                    </div>
                    <button id="generate-report-btn" class="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-2 px-4 rounded-lg">Generar Reporte</button>
                    <button id="export-csv-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <i class="fas fa-file-csv mr-2"></i> Exportar a CSV
                    </button>
                </div>

                <!-- Tabla de Reporte -->
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-800 text-xs text-gray-400 uppercase">
                            <tr>
                                <th class="py-3 px-6 text-left">Fecha</th>
                                <th class="py-3 px-6 text-left">Ticket ID</th>
                                <th class="py-3 px-6 text-left">Cliente</th>
                                <th class="py-3 px-6 text-left">Vendedor</th>
                                <th class="py-3 px-6 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="divide-y divide-gray-700">
                            <tr>
                                <td colspan="5" class="text-center py-10 text-gray-500">Seleccione un rango de fechas y genere un reporte.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Sección de Corte de Caja -->
            <div class="bg-[#1e293b] p-6 rounded-lg">
                <h2 class="text-xl font-semibold text-white mb-4">Corte de Caja</h2>
                <!-- Aquí irán los resultados del corte -->
                <div id="cash-cut-results">
                    <p class="text-gray-400">Funcionalidad de corte de caja próximamente...</p>
                </div>
            </div>
        </main>
    </div>

   <!--  <script src="js/dashboard.js"></script> -->
    <script src="js/toast.js"></script>
    <script src="js/confirm.js"></script>
    <script src="js/reportes.js"></script>
</body>

</html>