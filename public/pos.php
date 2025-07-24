<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Punto de Venta - Sistema POS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
    rel="stylesheet" />
  <!-- Select2 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

    body {
      font-family: "Inter", sans-serif;
    }

    /* Define a custom smaller text size if needed, e.g., text-xxs */
    .text-xxs {
      font-size: 0.65rem; /* ~10.4px */
      line-height: 0.8rem;
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

    .product-grid {
      display: grid;
      /* Adjusted minmax for slightly smaller cards */
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }

    .modal-overlay {
      background-color: rgba(0, 0, 0, 0.75);
    }

    /* Estilos para el switch de tipo de precio (más compacto) */
    .switch {
      position: relative;
      display: inline-block;
      width: 48px; /* Reducido */
      height: 28px; /* Reducido */
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #4a5568;
      transition: .4s;
      border-radius: 28px; /* Ajustado al nuevo height */
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px; /* Reducido */
      width: 20px; /* Reducido */
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked+.slider {
      background-color: #4f46e5;
    }

    input:checked+.slider:before {
      transform: translateX(20px); /* Ajustado al nuevo width */
    }

    /* Estilos para Select2 con Tailwind */
    .select2-container--default .select2-selection--single {
        background-color: #1e293b !important; /* Fondo oscuro */
        border: 1px solid #4a5568 !important; /* Borde oscuro */
        border-radius: 0.375rem !important; /* rounded-md */
        height: 42px !important; /* Altura consistente con otros inputs */
        display: flex !important;
        align-items: center !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
    }

    .select2-container--default .select2-selection--single .select2-selection__rendered {
        color: #cbd5e1 !important; /* Texto gris claro */
        line-height: 40px !important; /* Centrar texto verticalmente */
        padding-left: 0 !important; /* Eliminar padding extra */
    }

    .select2-container--default .select2-selection--single .select2-selection__arrow {
        height: 40px !important; /* Ajustar altura de la flecha */
        right: 8px !important;
    }

    .select2-container--default .select2-selection--single .select2-selection__arrow b {
        border-color: #cbd5e1 transparent transparent transparent !important; /* Color de la flecha */
    }

    .select2-container--default.select2-container--open .select2-selection--single .select2-selection__arrow b {
        border-color: transparent transparent #cbd5e1 transparent !important; /* Color de la flecha al abrir */
    }

    .select2-dropdown {
        background-color: #1e293b !important; /* Fondo del dropdown */
        border: 1px solid #4a5568 !important; /* Borde del dropdown */
        border-radius: 0.375rem !important; /* rounded-md */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; /* Sombra */
    }

    .select2-container--default .select2-results__option--highlighted.select2-results__option--selectable {
        background-color: #4f46e5 !important; /* Fondo al pasar el mouse/seleccionar */
        color: white !important;
    }

    .select2-container--default .select2-results__option--selectable {
        color: #cbd5e1 !important; /* Color de texto de las opciones */
    }

    .select2-search--dropdown .select2-search__field {
        background-color: #0f172a !important; /* Fondo del campo de búsqueda en el dropdown */
        border: 1px solid #4a5568 !important;
        color: #cbd5e1 !important;
        padding: 0.5rem !important;
        border-radius: 0.25rem !important;
    }
    .select2-results__message {
        color: #cbd5e1 !important;
        background-color: #1e293b !important;
        padding: 0.5rem;
    }

    /* Estilos para los botones de acción en la tabla de ventas pendientes */
    .action-buttons-container {
      display: flex;
      justify-content: center;
      gap: 0.5rem; /* Espacio entre botones */
      flex-wrap: wrap; /* Permite que los botones se envuelvan en pantallas pequeñas */
    }

    .action-buttons-container button,
    .action-buttons-container a {
      padding: 0.3rem 0.75rem; /* Ajustar padding para botones más compactos */
      font-size: 0.75rem; /* text-xs */
      line-height: 1rem;
      border-radius: 0.5rem; /* rounded-lg */
      font-weight: 700; /* font-bold */
      text-align: center;
      transition: background-color 0.2s ease-in-out;
      display: inline-flex; /* Para alinear ícono y texto si lo hubiera */
      align-items: center;
      justify-content: center;
    }

    .action-buttons-container .load-sale-btn {
      color: #9ca3af;
      font-size: 15px;
    }

    .action-buttons-container .pdf-sale-btn {
      color: #9ca3af;
      font-size: 15px;
    }

    .action-buttons-container .delete-sale-btn {
      background-color: transparent;
      color: #9ca3af;
      padding: 0.3rem;
      font-size: 15px;
    }

    .action-buttons-container .delete-sale-btn:hover {
      color: white;
    }

    /* Responsividad para la tabla de ventas pendientes */
    @media (max-width: 768px) {
      .pending-sales-table-wrapper {
        overflow-x: auto; /* Habilita scroll horizontal en pantallas pequeñas */
      }

      .pending-sales-table-wrapper table {
        min-width: 600px; /* Asegura que la tabla no se colapse demasiado */
      }

      .action-buttons-container {
        flex-direction: column; /* Apila los botones verticalmente en móviles */
        gap: 0.25rem; /* Menos espacio entre botones apilados */
      }

      .action-buttons-container button,
      .action-buttons-container a {
        width: 100%; /* Ocupa todo el ancho disponible */
      }
    }

    /* Responsividad general del layout principal */
    @media (max-width: 1024px) {
      .flex-1.flex {
        flex-direction: column; /* Apila las secciones de productos y carrito en pantallas más pequeñas */
        overflow-y: auto; /* Permite scroll en la página principal si el contenido es largo */
      }

      .flex-1.flex > div {
        width: 100%; /* Cada sección ocupa todo el ancho */
        max-width: none; /* Elimina límites de ancho fijo */
      }

      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); /* Ajusta el tamaño de las tarjetas de producto */
      }
    }

  
  </style>
</head>

<body class="bg-[#0f172a] text-gray-300 flex h-screen overflow-hidden">


  <?php include_once '../parciales/navegacion.php'; ?>

  <div class="flex-1 flex lg:flex-row flex-col">
    <div class="lg:w-3/5 w-full flex flex-col p-4">
      <div class="mb-4">
        <input
          type="text"
          id="search-product"
          placeholder="Buscar producto por nombre, SKU o código de barras..."
          class="w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" />
      </div>
      <div
        id="product-list"
        class="flex-1 overflow-y-auto product-grid gap-4 p-1"></div>
    </div>

    <div class="lg:w-2/5 w-full bg-[#1e293b] flex flex-col p-4 shadow-lg">
      
      <!-- Sección de Búsqueda de Artículos en el Carrito -->
      <div class="mb-4">
        <input
          type="text"
          id="search-cart-item"
          placeholder="Buscar artículo en el carrito..."
          class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" />
      </div>

      <!-- Contenedor del Carrito -->
      <div
        id="cart-items"
        class="flex-1 overflow-y-auto border-t border-b border-gray-700 py-2">
        <div class="text-center text-gray-500 py-10">
          El carrito está vacío
        </div>
      </div>

      <!-- Sección de Cliente y Precios (reubicada) -->
      <div class="py-4 space-y-2 border-b border-gray-700"> <!-- Added border-b for separation -->
        <div class="relative">
          <label class="block text-sm font-medium mb-1">Cliente</label>
          <select
            id="search-client"
            class="w-full bg-gray-700 rounded-md p-2 border border-gray-600">
            <option value="1" selected>Público en General</option>
          </select>
          <div id="selected-client" class="mt-2 text-sm">
            Cliente:
            <span class="font-semibold text-white">Público en General</span>
          </div>
        </div>

        <div id="address-selection-container" class="hidden">
          <label for="client-address-select" class="block text-sm font-medium mb-1">Dirección de Envío</label>
          <select id="client-address-select" class="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600">
          </select>
        </div>

        <div class="p-3 bg-gray-800 rounded-lg flex justify-between items-center text-sm">
          <span class="font-semibold">Menudeo</span>
          <label class="switch">
            <input type="checkbox" id="price-type-switch">
            <span class="slider"></span>
          </label>
          <span class="font-semibold">Mayoreo</span>
        </div>
        <button id="open-pending-sales-btn" class="w-full text-sm text-blue-400 hover:text-blue-300 font-semibold mt-2 py-2 px-3 bg-gray-800 rounded-lg">
          <i class="fas fa-folder-open mr-1"></i> Ver Ventas Pendientes
        </button>
      </div>


      <!-- Sección de Totales -->
      <div class="py-4 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <label for="toggle-iva" class="font-medium text-gray-300 cursor-pointer">
            <input type="checkbox" id="toggle-iva" class="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 rounded border-gray-600" />
            Aplicar IVA (16%)
          </label>
          <span id="cart-tax">$0.00</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Subtotal</span><span id="cart-subtotal">$0.00</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-white">
          <span>Total</span><span id="cart-total">$0.00</span>
        </div>
      </div>

      <!-- Botones de Acción de Venta -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <button id="cancel-sale-btn" class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">
          Cancelar
        </button>
        <button id="save-sale-btn" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed" disabled>
          Guardar
        </button>
        <button id="charge-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg">
          Cobrar
        </button>
      </div>
    </div>
  </div>

  <div
    id="charge-modal"
    class="fixed inset-0 z-50 flex items-center justify-center modal-overlay hidden">
    <div class="bg-[#1e293b] rounded-lg shadow-xl w-full max-w-md">
      <div class="p-6 border-b border-gray-700">
        <h2 class="text-2xl font-bold text-white">Procesar Venta</h2>
      </div>
      <div class="p-6">
        <div class="text-center mb-6">
          <p class="text-gray-400 text-lg">Total a Pagar</p>
          <p id="modal-total" class="text-5xl font-bold text-green-400">
            $0.00
          </p>
        </div>
        
        <!-- Sección de Múltiples Métodos de Pago -->
        <div id="payment-methods-container" class="space-y-4 mb-4">
          <!-- Los métodos de pago se añadirán aquí dinámicamente -->
        </div>

        <button id="add-payment-method-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-md mb-4">
          <i class="fas fa-plus mr-2"></i> Añadir Método de Pago
        </button>

        <div class="space-y-2 text-lg">
            <div class="flex justify-between text-gray-300">
                <span>Monto Pagado:</span>
                <span id="modal-amount-paid">$0.00</span>
            </div>
            <div class="flex justify-between font-bold" id="modal-change-row">
                <span>Cambio:</span>
                <span id="modal-change">$0.00</span>
            </div>
            <div class="flex justify-between font-bold text-red-400" id="modal-pending-row">
                <span>Pendiente:</span>
                <span id="modal-pending">$0.00</span>
            </div>
        </div>

      </div>
      <div class="p-6 bg-gray-800 flex justify-end space-x-4 rounded-b-lg">
        <button
          type="button"
          id="modal-cancel-btn"
          class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
          Cancelar
        </button>
        <button
          type="button"
          id="modal-confirm-btn"
          class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">
          Confirmar Venta
        </button>
      </div>
    </div>
  </div>
  <div id="pending-sales-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-overlay hidden">
    <div class="bg-[#1e293b] rounded-lg shadow-xl w-full max-w-4xl">
      <div class="p-6 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-white">Ventas Guardadas</h2>
        <button id="close-pending-sales-modal-btn" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      <div class="p-6">
        <!-- Input de búsqueda para ventas pendientes -->
        <input
          type="text"
          id="search-pending-sale"
          placeholder="Buscar por folio o cliente..."
          class="w-full bg-gray-700 text-white rounded-md p-2 mb-4 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" />
        <div class="max-h-[60vh] overflow-y-auto pending-sales-table-wrapper">
          <table class="min-w-full">
            <thead class="bg-gray-800 text-xs text-gray-400 uppercase sticky top-0">
              <tr>
                <th class="py-2 px-4 text-left">Folio</th>
                <th class="py-2 px-4 text-left">Fecha</th>
                <th class="py-2 px-4 text-left">Cliente</th>
                <th class="py-2 px-4 text-right">Total</th>
                <th class="py-2 px-4 text-center w-40">Acciones</th>
              </tr>
            </thead>
            <tbody id="pending-sales-table-body" class="divide-y divide-gray-700">
              <!-- Las ventas pendientes se cargarán aquí -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qz-tray@2.2/qz-tray.min.js"></script>
  <script src="js/qz-tray-handler.js"></script>
  <!-- jQuery es un requisito para Select2 -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <!-- Select2 JS -->
  <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

  <script src="js/toast.js"></script>
  <script src="js/confirm.js"></script>
  <script src="js/pos.js"></script>
</body>

</html>
