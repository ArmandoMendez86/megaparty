<?php
require_once __DIR__ . '/../parciales/verificar_sesion.php'; 
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario - Sistema POS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            font-family: 'Inter', sans-serif;
        }

        .modal-overlay {
            background-color: rgba(0, 0, 0, 0.75);
        }

        .modal-body {
            max-height: 65vh;
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

        .stock-adjust-input {
            width: 60px; 
            text-align: center;
            -moz-appearance: textfield;
        }
        .stock-adjust-input::-webkit-outer-spin-button,
        .stock-adjust-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    </style>
</head>

<body class="bg-[#0f172a] text-gray-300">

    <div class="flex h-screen">
      
     <?php include_once '../parciales/navegacion.php'; ?>

        <!-- Contenido Principal -->
        <main class="flex-1 p-8 overflow-y-auto">
            <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 class="text-3xl font-bold text-white">Gestión de Inventario</h1>
                <div class="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div class="relative w-full md:w-64">
                        <input type="text" id="search-product-input" placeholder="Buscar producto..." class="w-full bg-gray-700 text-white rounded-md p-2 pl-10 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                        <i class="fas fa-search text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    </div>
                    <button id="add-product-btn" class="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-2 px-4 rounded-lg flex items-center w-full md:w-auto justify-center">
                        <i class="fas fa-plus mr-2"></i> Añadir Producto
                    </button>
                </div>
            </div>

            <!-- Tabla de Productos -->
            <div class="bg-[#1e293b] rounded-lg shadow overflow-hidden mb-8">
                <div class="max-h-[40vh] overflow-y-auto overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-800 text-xs text-gray-400 uppercase sticky top-0">
                            <tr>
                                <th class="py-3 px-6 text-left">SKU</th>
                                <th class="py-3 px-6 text-left">Nombre</th>
                                <th class="py-3 px-6 text-left">Marca</th>
                                <th class="py-3 px-6 text-left">Categoría</th>
                                <th class="py-3 px-6 text-center">Stock</th>
                                <th class="py-3 px-6 text-right">Precio Menudeo</th>
                                <th class="py-3 px-6 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="products-table-body" class="divide-y divide-gray-700">
                            <tr>
                                <td colspan="7" class="text-center py-10 text-gray-500">Cargando productos...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Historial de Movimientos de Inventario -->
            <div class="bg-[#1e293b] rounded-lg shadow overflow-hidden p-6">
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-history mr-3 text-blue-400"></i> Historial de Movimientos de Inventario
                </h2>
                <div class="max-h-[40vh] overflow-y-auto overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-800 text-xs text-gray-400 uppercase sticky top-0">
                            <tr>
                                <th class="py-3 px-6 text-left">Fecha</th>
                                <th class="py-3 px-6 text-left">Producto</th>
                                <th class="py-3 px-6 text-left">Tipo</th>
                                <th class="py-3 px-6 text-center">Cantidad</th>
                                <th class="py-3 px-6 text-center">Stock Anterior</th>
                                <th class="py-3 px-6 text-center">Stock Nuevo</th>
                                <th class="py-3 px-6 text-left">Motivo / Ref.</th>
                                <th class="py-3 px-6 text-left">Usuario</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-history-body" class="divide-y divide-gray-700">
                            <tr>
                                <td colspan="8" class="text-center py-10 text-gray-500">Cargando historial...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </main>
    </div>

    <!-- ========= INICIO: Modal para Añadir/Editar Producto (DISEÑO MEJORADO) ========= -->
    <div id="product-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-overlay hidden">
        <div class="bg-[#1e293b] rounded-lg shadow-xl w-full max-w-xl transform transition-all duration-300 ease-in-out">
            <div class="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 id="modal-title" class="text-xl font-bold text-white flex items-center"><i class="fas fa-box-open mr-3"></i>Añadir Nuevo Producto</h2>
                <button id="close-modal-btn" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form id="product-form">
                <input type="hidden" id="product-id" name="id">
                
                <!-- ========= INICIO: Nueva Sección para Clonar ========= -->
                <div id="clone-section" class="px-6 pt-4 pb-2 bg-[#131c2b] border-b border-gray-700 hidden">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-300">¿Crear a partir de un producto existente?</span>
                        <button type="button" id="toggle-clone-btn" class="text-sm text-[#6366f1] hover:underline">Clonar producto</button>
                    </div>
                    <div id="clone-controls" class="hidden mt-3">
                        <label for="clone-source-product" class="block text-sm font-medium text-gray-400 mb-1">Selecciona un producto para clonar sus datos</label>
                        <div class="flex gap-2">
                            <select id="clone-source-product" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                                <!-- Opciones se cargarán con JS -->
                            </select>
                            <button type="button" id="load-clone-data-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0">Cargar Datos</button>
                        </div>
                    </div>
                </div>
                <!-- ========= FIN: Nueva Sección para Clonar ========= -->

                <div class="p-6 modal-body overflow-y-auto">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div class="md:col-span-2">
                            <label for="nombre" class="block text-sm font-medium text-gray-300 mb-1">Nombre del Producto</label>
                            <input type="text" id="nombre" name="nombre" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" required>
                        </div>
                        
                        <div>
                            <label for="sku" class="block text-sm font-medium text-gray-300 mb-1">SKU / Código Interno</label>
                            <input type="text" id="sku" name="sku" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" required>
                        </div>

                        <div>
                            <label for="codigo_barras" class="block text-sm font-medium text-gray-300 mb-1">Código de Barras</label>
                            <input type="text" id="codigo_barras" name="codigo_barras" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                        </div>

                        <div>
                            <label for="id_categoria" class="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                            <select id="id_categoria" name="id_categoria" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                            </select>
                        </div>

                        <div>
                            <label for="id_marca" class="block text-sm font-medium text-gray-300 mb-1">Marca</label>
                            <select id="id_marca" name="id_marca" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                            </select>
                        </div>
                    </div>

                    <hr class="border-gray-600 my-6">

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <h3 class="md:col-span-2 text-lg font-semibold text-white mb-2">Precios y Stock</h3>

                        <div>
                            <label for="precio_menudeo" class="block text-sm font-medium text-gray-300 mb-1">Precio Menudeo</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                                <input type="number" step="0.01" id="precio_menudeo" name="precio_menudeo" class="w-full bg-gray-700 text-white rounded-md p-2 pl-7 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" required>
                            </div>
                        </div>
                        <div>
                            <label for="precio_mayoreo" class="block text-sm font-medium text-gray-300 mb-1">Precio Mayoreo</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                                <input type="number" step="0.01" id="precio_mayoreo" name="precio_mayoreo" class="w-full bg-gray-700 text-white rounded-md p-2 pl-7 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" required>
                            </div>
                        </div>
                        <div>
                            <label for="stock" class="block text-sm font-medium text-gray-300 mb-1">Stock Inicial</label>
                            <input type="number" id="stock" name="stock" value="0" min="0" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                        </div>
                        <div>
                            <label for="stock_minimo" class="block text-sm font-medium text-gray-300 mb-1">Stock Mínimo</label>
                            <input type="number" id="stock_minimo" name="stock_minimo" value="5" min="0" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]">
                        </div>
                    </div>

                    <hr class="border-gray-600 my-6">

                    <div>
                        <label for="descripcion" class="block text-sm font-medium text-gray-300 mb-1">Descripción (Opcional)</label>
                        <textarea id="descripcion" name="descripcion" rows="3" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]"></textarea>
                    </div>
                </div>

                <div class="px-6 py-4 bg-[#131c2b] rounded-b-lg flex justify-end items-center gap-4">
                    <button type="button" id="cancel-btn" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Cancelar</button>
                    <button type="submit" class="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200">
                        <i class="fas fa-save"></i>
                        Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    </div>
    <!-- ========= FIN: Modal para Añadir/Editar Producto (DISEÑO MEJORADO) ========= -->


    <!-- Modal para Ajuste de Stock -->
    <div id="adjust-stock-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-overlay hidden">
        <div class="bg-[#1e293b] rounded-lg shadow-xl w-full max-w-md">
            <div class="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 id="adjust-modal-title" class="text-2xl font-bold text-white">Ajustar Stock</h2>
                <button id="close-adjust-modal-btn" class="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div class="p-6">
                <input type="hidden" id="adjust-product-id">
                <input type="hidden" id="adjust-action">
                <input type="hidden" id="adjust-current-stock-value">
                
                <div class="mb-4">
                    <p class="text-gray-400">Producto: <span id="adjust-product-name" class="font-bold text-white"></span></p>
                    <p class="text-gray-400">Stock Actual: <span id="adjust-current-stock-display" class="font-bold text-white"></span></p>
                </div>

                <div class="mb-4">
                    <label id="adjust-quantity-label" for="adjust-quantity" class="block text-sm font-medium text-gray-300 mb-1">Cantidad</label>
                    <input type="number" id="adjust-quantity" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" placeholder="0" min="1">
                </div>
                <div class="mb-4">
                    <label for="adjust-stock-reason" class="block text-sm font-medium text-gray-300 mb-1">Motivo del Ajuste</label>
                    <textarea id="adjust-stock-reason" rows="3" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" required></textarea>
                </div>
            </div>
            <div class="p-6 border-t border-gray-700 flex justify-end">
                <button type="button" id="cancel-adjust-btn" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg mr-2">Cancelar</button>
                <button type="button" id="confirm-adjust-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
            </div>
        </div>
    </div>

     <script src="js/rutas.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/confirm.js"></script>
    <script src="js/inventario.js"></script>
</body>

</html>
