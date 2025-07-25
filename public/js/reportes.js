// Archivo: /public/js/reportes.js

document.addEventListener("DOMContentLoaded", function () {
  // --- Referencias a elementos del DOM del Reporte de Ventas ---
  const generateReportBtn = document.getElementById("generate-report-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const reportTableBody = document.getElementById("report-table-body");

  // --- Referencias a elementos del DOM del Corte de Caja ---
  const cashCutDateInput = document.getElementById("cash-cut-date"); // CAMBIADO: Un solo input de fecha
  const initialCashInput = document.getElementById("initial-cash");
  const generateCashCutBtn = document.getElementById("generate-cash-cut-btn");
  const printCashCutBtn = document.getElementById("print-cash-cut-btn");
  const cashCutResultsContainer = document.getElementById("cash-cut-results");

  let currentReportData = [];
  let currentCashCutData = null;
  let currentCashCutDate = ""; // CAMBIADO: Una sola fecha para el corte
  let currentInitialCash = 0;


  if (typeof connectQz === "function") {
    connectQz();
  }


  // --- Funciones de ayuda para el formato de impresión ---
  const ticketWidth = 32; // Ancho estándar para tickets de 58mm (ajustable)

  const removeAccents = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  const formatCurrencyForTicket = (value) => {
    return (
      "$" +
      parseFloat(value).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const formatLine = (left, right = "", width = ticketWidth) => {
    const leftClean = removeAccents(left);
    const rightClean = removeAccents(right);
    const padding = Math.max(0, width - leftClean.length - rightClean.length);
    return leftClean + " ".repeat(padding) + rightClean + "\x0A";
  };

  const formatCentered = (text, width = ticketWidth) => {
    const textClean = removeAccents(text);
    const padding = Math.max(0, Math.floor((width - textClean.length) / 2));
    return (
      " ".repeat(padding) +
      textClean +
      " ".repeat(width - textClean.length - padding) +
      "\x0A"
    );
  };

  /**
   * Prints a sales ticket to a thermal printer using QZ Tray.
   * @param {string} printerName - The name of the printer to use.
   * @param {object} ticketData - The data for the ticket (venta and items).
   */
  async function printTicket(printerName, ticketData) {
    if (!qzTrayConnected) {
      showToast("No se puede imprimir: QZ Tray está desconectado.", "error");
      return;
    }

    const config = qz.configs.create(printerName);
    const ticketWidth = 32; // Ancho estándar para tickets de 58mm

    // --- Funciones de ayuda para el formato (reutilizadas) ---
    const removeAccents = (str) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const formatCurrencyForTicket = (value) => {
      return (
        "$" +
        parseFloat(value).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    };
    const formatLine = (left, right = "", width = ticketWidth) => {
      const leftClean = removeAccents(left);
      const rightClean = removeAccents(right);
      const padding = Math.max(0, width - leftClean.length - rightClean.length);
      return leftClean + " ".repeat(padding) + rightClean + "\x0A";
    };

    // --- Construcción del Ticket ---
    let dataToPrint = [
      "\x1B" + "\x40", // Inicializar impresora
      "\x1B" + "\x74" + "\x11", // Seleccionar página de códigos PC850 (Español)

      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x10", // Negrita y doble altura
      removeAccents(ticketData.venta.sucursal_nombre) + "\x0A",
      "\x1B" + "\x21" + "\x00", // Texto normal
      removeAccents(ticketData.venta.sucursal_direccion) + "\x0A",
      "Tel: " + ticketData.venta.sucursal_telefono + "\x0A",
      "\x0A",

      "\x1B" + "\x61" + "\x30", // Alinear a la izquierda
      formatLine(
        "Ticket:",
        "#" + ticketData.venta.id.toString().padStart(6, "0")
      ),
      formatLine(
        "Fecha:",
        new Date(ticketData.venta.fecha).toLocaleString("es-MX")
      ),
      formatLine("Cliente:", ticketData.venta.cliente),
      formatLine("Vendedor:", ticketData.venta.vendedor),
      "-".repeat(ticketWidth) + "\x0A",
      formatLine("Cant Descripcion", "Total"),
      "-".repeat(ticketWidth) + "\x0A",
    ];

    // Añadir items al ticket
    ticketData.items.forEach((item) => {
      // 1. Prepara las partes de la línea: cantidad y precio.
      const qtyPart = `${item.cantidad} `;
      const pricePart = formatCurrencyForTicket(item.subtotal);

      // 2. Calcula el espacio máximo disponible para el nombre del producto.
      // Restamos la longitud de la cantidad, el precio y un espacio de separación.
      const maxNameLength = ticketWidth - qtyPart.length - pricePart.length - 1;

      // 3. Trunca el nombre del producto si es necesario.
      let productName = item.producto_nombre;
      if (productName.length > maxNameLength) {
        // Acorta y añade "..." para indicar que está truncado.
        productName = productName.substring(0, maxNameLength - 3) + "...";
      }

      // 4. Construye y añade la línea principal del producto.
      const mainLine = qtyPart + productName;
      dataToPrint.push(formatLine(mainLine, pricePart));

      // 5. (Opcional pero recomendado) Añade el SKU en una nueva línea.
      if (item.sku) {
        // Añadimos un pequeño sangrado para mayor claridad.
        dataToPrint.push(formatLine(`  SKU: ${item.sku}`));
      }
    });

    dataToPrint.push("-".repeat(ticketWidth) + "\x0A");
    dataToPrint.push("\x1B" + "\x61" + "\x32"); // Alinear a la derecha
    dataToPrint.push("\x1B" + "\x21" + "\x08"); // Negrita
    dataToPrint.push(
      formatLine("TOTAL: ", formatCurrencyForTicket(ticketData.venta.total))
    );
    dataToPrint.push("\x1B" + "\x21" + "\x00"); // Texto normal
    dataToPrint.push("\x0A");

    dataToPrint.push("\x1B" + "\x61" + "\x31"); // Centrar
    dataToPrint.push(removeAccents("¡Gracias por su compra!") + "\x0A");
    dataToPrint.push("\x0A" + "\x0A" + "\x0A");
    dataToPrint.push("\x1D" + "\x56" + "\x41" + "\x03"); // Cortar papel

    try {
      await qz.print(config, dataToPrint);
      showToast("Ticket enviado a la impresora.", "success");
    } catch (err) {
      console.error("Error al imprimir:", err);
      showToast("Error al enviar el ticket a la impresora.", "error");
    }
  }


  // --- Lógica de la API ---

  /**
   * Fetches sales report data from the API based on selected dates.
   * Displays a loading message and then renders the report or an error message.
   */
  async function fetchSalesReport() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    if (!startDate || !endDate) {
      showToast(
        "Por favor, seleccione una fecha de inicio y de fin para el reporte de ventas.",
        "error"
      );
      return;
    }
    reportTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500">Generando reporte...</td></tr>`;

    try {
      const salesResponse = await fetch(
        `${BASE_URL}/getSalesReport?start=${startDate}&end=${endDate}`
      );
      const salesResult = await salesResponse.json();

      if (salesResult.success) {
        currentReportData = salesResult.data;
        renderReport(currentReportData);
      } else {
        reportTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500">${salesResult.message}</td></tr>`;
      }
    } catch (error) {
      console.error("Error fetching sales report:", error);
      reportTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500">No se pudo conectar con el servidor para el reporte de ventas.</td></tr>`;
    }
  }

  /**
   * Fetches cash cut data from the API for a specified date.
   * Displays a loading message and then renders the cash cut details or an error message.
   * This function is now triggered by its own button.
   */
  async function fetchCashCut() {
    const date = cashCutDateInput.value; // CAMBIADO: Obtener una sola fecha
    if (!date) {
      showToast(
        "Por favor, seleccione una fecha para el corte de caja.",
        "error"
      );
      return;
    }
    cashCutResultsContainer.innerHTML = `<p class="text-gray-400 col-span-full">Calculando corte de caja...</p>`;

    // Store date for printing
    currentCashCutDate = date; // CAMBIADO: Almacenar una sola fecha

    try {
      // Fetch initial cash amount for the selected date
      const initialCashResponse = await fetch(`${BASE_URL}/getMontoApertura?date=${date}`);
      const initialCashResult = await initialCashResponse.json();

      if (initialCashResult.success) {
          currentInitialCash = parseFloat(initialCashResult.monto_inicial || 0);
          initialCashInput.value = currentInitialCash.toFixed(2); // Set input value
          // Make input read-only if an amount was found (caja ya abierta)
          if (currentInitialCash > 0) {
              initialCashInput.readOnly = true;
              initialCashInput.classList.add('opacity-75', 'cursor-not-allowed');
          } else {
              initialCashInput.readOnly = false;
              initialCashInput.classList.remove('opacity-75', 'cursor-not-allowed');
          }
      } else {
          showToast(initialCashResult.message || 'Error al obtener monto de apertura de caja.', 'error');
          currentInitialCash = 0;
          initialCashInput.value = '0.00';
          initialCashInput.readOnly = false;
          initialCashInput.classList.remove('opacity-75', 'cursor-not-allowed');
      }

      // Fetch cash cut data for the single date
      const response = await fetch(
        `${BASE_URL}/getCashCut?date=${date}` // CAMBIADO: Enviar una sola fecha
      );
      const result = await response.json();
      if (result.success) {
        currentCashCutData = result.data; // Store data for printing
        renderCashCut(currentCashCutData, date, currentInitialCash); // CAMBIADO: Pasar una sola fecha
      } else {
        cashCutResultsContainer.innerHTML = `<p class="text-red-500 col-span-full">${result.message}</p>`;
        currentCashCutData = null; // Clear data if error
      }
    } catch (error) {
      console.error("Error fetching cash cut or initial cash:", error);
      cashCutResultsContainer.innerHTML = `<p class="text-red-500 col-span-full">No se pudo conectar con el servidor para el corte de caja.</p>`;
      currentCashCutData = null; // Clear data if error
      currentInitialCash = 0;
      initialCashInput.value = '0.00';
      initialCashInput.readOnly = false;
      initialCashInput.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  }

  /**
   * Fetches detailed expenses for a given date.
   * @param {string} date - The date (YYYY-MM-DD).
   * @returns {Promise<Array>} - A promise that resolves to an array of expense objects.
   */
  async function fetchDetailedExpenses(date) { // CAMBIADO: Un solo parámetro de fecha
    try {
      const response = await fetch(
        `${BASE_URL}/getDetailedExpenses?date=${date}` // CAMBIADO: Enviar una sola fecha
      );
      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        showToast(`Error al cargar gastos: ${result.message}`, "error");
        return [];
      }
    } catch (error) {
      console.error("Error fetching detailed expenses:", error);
      showToast("Error de conexión al cargar gastos detallados.", "error");
      return [];
    }
  }

  /**
   * Fetches detailed client payments for a given date.
   * @param {string} date - The date (YYYY-MM-DD).
   * @returns {Promise<Array>} - A promise that resolves to an array of payment objects.
   */
  async function fetchDetailedClientPayments(date) { // CAMBIADO: Un solo parámetro de fecha
    try {
      const response = await fetch(
        `${BASE_URL}/getDetailedClientPayments?date=${date}` // CAMBIADO: Enviar una sola fecha
      );
      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        showToast(`Error al cargar abonos: ${result.message}`, "error");
        return [];
      }
    } catch (error) {
      console.error("Error fetching detailed client payments:", error);
      showToast("Error de conexión al cargar abonos detallados.", "error");
      return [];
    }
  }

  /**
   * Sends a request to cancel a sale.
   * @param {number} saleId - The ID of the sale to cancel.
   */
  async function cancelSale(saleId) {
    // Mostrar un diálogo de confirmación antes de cancelar
    const confirmed = await showConfirm(
      `¿Está seguro de que desea CANCELAR la venta #${saleId.toString().padStart(6, "0")}? Esto devolverá el stock y ajustará el crédito del cliente.`
    );

    if (!confirmed) {
      showToast("Cancelación de venta abortada.", "info");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/cancelSale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_venta: saleId
        })
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
        // Re-fetch the sales report to update the table
        fetchSalesReport();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      console.error("Error cancelling sale:", error);
      showToast("Error de conexión al cancelar la venta.", "error");
    }
  }

  /**
   * Fetches ticket details for a given sale ID and then prints the ticket.
   * @param {number} saleId - The ID of the sale.
   */
  async function handlePrintTicket(saleId) {
    try {
      const response = await fetch(`${BASE_URL}/getTicketDetails?id=${saleId}`);
      const result = await response.json();

      if (result.success) {
        const defaultPrinter = "POS-58"; // Reemplaza con el nombre de tu impresora térmica
        printTicket(defaultPrinter, result.data);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      showToast("Error al obtener los detalles del ticket para imprimir.", "error");
    }
  }

  /**
   * Opens a new window to display the PDF version of the sale.
   * @param {number} saleId - The ID of the sale.
   */
  function handleViewPdf(saleId) {
    // Asumiendo que tienes un endpoint para generar la cotización/PDF
    const pdfUrl = `${BASE_URL}/generateQuote?id=${saleId}`;
    window.open(pdfUrl, '_blank');
  }


  // --- Lógica de Renderizado ---

  /**
   * Renders the sales report data into the table.
   * Applies the 'ticket-id-cell' class to the Ticket ID column.
   * @param {Array} sales - An array of sales objects.
   */
  function renderReport(sales) {
    if (!sales || sales.length === 0) {
      reportTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500">No se encontraron ventas en el rango de fechas.</td></tr>`;
      return;
    }
    reportTableBody.innerHTML = ""; // Clear previous report data
    sales.forEach((sale) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-800";
      const saleDate = new Date(sale.fecha);
      const formattedDate = saleDate.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const formattedTime = saleDate.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Determine status display and button visibility
      let statusText = sale.estado;
      let statusClass = '';
      let actionButtonsHtml = ''; // Use a generic variable for all action buttons

      if (sale.estado === 'Completada') {
        statusClass = 'text-green-400 font-semibold';
        actionButtonsHtml = `
          <div class="flex items-center space-x-2">
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs print-ticket-btn" data-id="${sale.id}" title="Imprimir Ticket">
                <i class="fas fa-receipt"></i>
            </button>
            <button class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg text-xs view-pdf-btn" data-id="${sale.id}" title="Ver PDF">
                <i class="fas fa-file-pdf"></i>
            </button>
            <button class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs cancel-sale-btn" data-id="${sale.id}" title="Cancelar Venta">
                <i class="fas fa-times-circle"></i>
            </button>
          </div>
        `;
      } else if (sale.estado === 'Pendiente') {
        statusClass = 'text-yellow-400 font-semibold';
        actionButtonsHtml = `<span class="text-gray-500 text-xs">N/A</span>`;
      } else if (sale.estado === 'Cancelada') {
        statusClass = 'text-red-500 font-semibold';
        actionButtonsHtml = `<span class="text-gray-500 text-xs">Cancelada</span>`;
      } else if (sale.estado === 'Cotizacion') {
        statusClass = 'text-blue-400 font-semibold';
        actionButtonsHtml = `
            <div class="flex items-center space-x-2">
                <button class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg text-xs view-pdf-btn" data-id="${sale.id}" title="Ver Cotización PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </div>
        `;
      }


      tr.innerHTML = `
                <td class="py-3 px-6 text-sm">${formattedDate} ${formattedTime}</td>
                <td class="py-3 px-6 text-sm font-mono ticket-id-cell">#${sale.id
                  .toString()
                  .padStart(6, "0")}</td>
                <td class="py-3 px-6 text-sm font-semibold text-white">${
                  sale.cliente_nombre
                }</td>
                <td class="py-3 px-6 text-sm">${sale.usuario_nombre}</td>
                <td class="py-3 px-6 text-right text-sm font-mono text-green-400">$${parseFloat(
                  sale.total
                ).toFixed(2)}</td>
                <td class="py-3 px-6 text-sm ${statusClass}">${statusText}</td>
                <td class="py-3 px-6 text-center">${actionButtonsHtml}</td>
            `;
      reportTableBody.appendChild(tr);
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.cancel-sale-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        // CORRECCIÓN: Encuentra el botón más cercano que tiene el data-id
        const targetButton = event.target.closest('.cancel-sale-btn');
        if (targetButton) {
          const saleId = targetButton.dataset.id;
          cancelSale(parseInt(saleId));
        }
      });
    });

    document.querySelectorAll('.print-ticket-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // CORRECCIÓN: Encuentra el botón más cercano que tiene el data-id
            const targetButton = event.target.closest('.print-ticket-btn');
            if (targetButton) {
              const saleId = targetButton.dataset.id;
              handlePrintTicket(parseInt(saleId));
            }
        });
    });

    document.querySelectorAll('.view-pdf-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // CORRECCIÓN: Encuentra el botón más cercano que tiene el data-id
            const targetButton = event.target.closest('.view-pdf-btn');
            if (targetButton) {
              const saleId = targetButton.dataset.id;
              handleViewPdf(parseInt(saleId));
            }
        });
    });
  }

  /**
   * Renders the cash cut data into the designated container with a two-column layout.
   * Includes expandable sections for detailed expenses and client payments.
   * @param {Object} data - The cash cut data.
   * @param {string} date - The date for fetching detailed data.
   * @param {number} initialCash - The initial cash amount for the day.
   */
  function renderCashCut(data, date, initialCash) { // CAMBIADO: Un solo parámetro de fecha
    const formatCurrency = (value) => `$${parseFloat(value || 0).toFixed(2)}`;
    const formatDate = (dateString) =>
      new Date(dateString).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const formatDateTime = (dateString) =>
      new Date(dateString).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    const totalIngresosEfectivo =
      parseFloat(data.ventas_efectivo || 0) +
      parseFloat(data.abonos_clientes || 0);
    const balanceFinal =
      initialCash + totalIngresosEfectivo - parseFloat(data.total_gastos || 0);

    cashCutResultsContainer.innerHTML = `
            <!-- Columna de Ingresos -->
            <div class="bg-gray-700 p-4 rounded-lg shadow-inner flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-arrow-alt-circle-down text-green-400 mr-2"></i> Ingresos
                    </h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between items-center">
                            <span>Caja Inicial:</span>
                            <span class="font-mono text-blue-300">${formatCurrency(initialCash)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Ventas en Efectivo:</span>
                            <span class="font-mono text-green-300">${formatCurrency(
                              data.ventas_efectivo
                            )}</span>
                        </div>
                        <div class="flex flex-col">
                            <div class="flex justify-between items-center cursor-pointer hover:text-gray-200" id="toggle-abonos">
                                <span>Abonos de Clientes (Efectivo/Transf.):</span>
                                <span class="font-mono text-green-300">${formatCurrency(
                                  data.abonos_clientes
                                )} <i class="fas fa-chevron-down ml-2 transition-transform duration-300"></i></span>
                            </div>
                            <div id="abonos-detail" class="mt-2 pl-4 text-xs text-gray-400 hidden">
                                <p>Cargando abonos...</p>
                            </div>
                        </div>
                        <hr class="border-gray-600 my-2">
                        <div class="flex justify-between items-center font-bold text-base">
                            <span>Total Ingresos en Caja:</span>
                            <span class="font-mono text-green-400">${formatCurrency(
                              totalIngresosEfectivo
                            )}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna de Egresos y Balance -->
            <div class="bg-gray-700 p-4 rounded-lg shadow-inner flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-arrow-alt-circle-up text-red-400 mr-2"></i> Egresos
                    </h3>
                    <div class="space-y-3 text-sm mb-4">
                        <div class="flex flex-col">
                            <div class="flex justify-between items-center cursor-pointer hover:text-gray-200" id="toggle-gastos">
                                <span>Total de Gastos:</span>
                                <span class="font-mono text-red-300">${formatCurrency(
                                  data.total_gastos
                                )} <i class="fas fa-chevron-down ml-2 transition-transform duration-300"></i></span>
                            </div>
                            <div id="gastos-detail" class="mt-2 pl-4 text-xs text-gray-400 hidden">
                                <p>Cargando gastos...</p>
                            </div>
                        </div>
                    </div>
                    <hr class="border-gray-600 my-2">
                    <div class="flex justify-between items-center pt-4 text-lg font-bold">
                        <span class="text-white">Balance Final en Caja:</span>
                        <span class="font-mono ${
                          balanceFinal >= 0 ? "text-green-400" : "text-red-400"
                        }">${formatCurrency(balanceFinal)}</span>
                    </div>
                </div>
            </div>

            <!-- Otros Totales (ocupa el ancho completo en ambas columnas) -->
            <div class="col-span-full bg-gray-800 p-4 rounded-lg shadow-inner mt-4">
                <h3 class="text-md font-semibold text-gray-400 mb-3 flex items-center">
                    <i class="fas fa-info-circle text-blue-400 mr-2"></i> Otros Totales (Informativos)
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    <div class="flex justify-between items-center">
                        <span>Total Ventas (Todos los métodos):</span>
                        <span class="font-mono text-gray-300">${formatCurrency(
                          data.total_ventas
                        )}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Ventas con Tarjeta:</span>
                        <span class="font-mono text-gray-300">${formatCurrency(
                          data.ventas_tarjeta
                        )}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Ventas por Transferencia:</span>
                        <span class="font-mono text-gray-300">${formatCurrency(
                          data.ventas_transferencia
                        )}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Ventas a Crédito:</span>
                        <span class="font-mono text-gray-300">${formatCurrency(
                          data.ventas_credito
                        )}</span>
                    </div>
                </div>
            </div>
        `;

    // Add event listeners for toggling details AFTER the HTML is rendered
    const toggleGastos = document.getElementById("toggle-gastos");
    const gastosDetail = document.getElementById("gastos-detail");
    const toggleAbonos = document.getElementById("toggle-abonos");
    const abonosDetail = document.getElementById("abonos-detail");

    if (toggleGastos && gastosDetail) {
      toggleGastos.addEventListener("click", async () => {
        gastosDetail.classList.toggle("hidden");
        toggleGastos.querySelector("i").classList.toggle("rotate-180");
        if (
          !gastosDetail.classList.contains("hidden") &&
          gastosDetail.dataset.loaded !== "true"
        ) {
          const expenses = await fetchDetailedExpenses(date); // CAMBIADO: Pasar una sola fecha
          gastosDetail.innerHTML = ""; // Clear loading message
          if (expenses.length > 0) {
            expenses.forEach((exp) => {
              const p = document.createElement("p");
              p.className =
                "flex justify-between items-center py-1 border-b border-gray-600 last:border-b-0";
              p.innerHTML = `
                                <span>${formatDate(
                                  exp.fecha
                                )} - ${exp.descripcion.substring(0, 30)}${
                exp.descripcion.length > 30 ? "..." : ""
              }</span>
                                <span class="font-mono text-red-300">${formatCurrency(
                                  exp.monto
                                )}</span>
                            `;
              gastosDetail.appendChild(p);
            });
          } else {
            gastosDetail.innerHTML =
              '<p class="text-center py-2">No se encontraron gastos para este período.</p>';
          }
          gastosDetail.dataset.loaded = "true"; // Mark as loaded
        }
      });
    }

    if (toggleAbonos && abonosDetail) {
      toggleAbonos.addEventListener("click", async () => {
        abonosDetail.classList.toggle("hidden");
        toggleAbonos.querySelector("i").classList.toggle("rotate-180");
        if (
          !abonosDetail.classList.contains("hidden") &&
          abonosDetail.dataset.loaded !== "true"
        ) {
          const payments = await fetchDetailedClientPayments(
            date // CAMBIADO: Pasar una sola fecha
          );
          abonosDetail.innerHTML = ""; // Clear loading message
          if (payments.length > 0) {
            payments.forEach((pay) => {
              const p = document.createElement("p");
              p.className =
                "flex justify-between items-center py-1 border-b border-gray-600 last:border-b-0";
              p.innerHTML = `
                                <span>${formatDateTime(pay.fecha)} - ${
                pay.cliente_nombre
              } (${pay.metodo_pago})</span>
                                <span class="font-mono text-green-300">${formatCurrency(
                                  pay.monto
                                )}</span>
                            `;
              abonosDetail.appendChild(p);
            });
          } else {
            abonosDetail.innerHTML =
              '<p class="text-center py-2">No se encontraron abonos para este período.</p>';
          }
          abonosDetail.dataset.loaded = "true"; // Mark as loaded
        }
      });
    }
  }

  /**
   * Exports the current report data to a CSV file.
   * Shows a toast message if there's no data to export.
   */
  function exportToCsv() {
    if (currentReportData.length === 0) {
      showToast("No hay datos para exportar.", "error");
      return;
    }
    let csvContent =
      "data:text/csv;charset=utf-8,Fecha,Ticket ID,Cliente,Vendedor,Total,Estado\r\n";
    currentReportData.forEach((row) => {
      // Ensure proper CSV formatting for each field
      const formattedDate = new Date(row.fecha).toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      let csvRow = [
        `"${formattedDate}"`,
        `"#${row.id.toString().padStart(6, "0")}"`, // Add '#' and pad with zeros for consistency
        `"${row.cliente_nombre.replace(/"/g, '""')}"`, // Escape double quotes in client name
        `"${row.usuario_nombre.replace(/"/g, '""')}"`, // Escape double quotes in user name
        `"${parseFloat(row.total).toFixed(2)}"`,
        `"${row.estado}"`,
      ].join(",");
      csvContent += csvRow + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_ventas_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Prints the Cash Cut report to a thermal printer using QZ Tray.
   * Includes detailed expenses and client payments.
   * @param {string} printerName - The name of the printer to use.
   */
  async function printCashCutReport(printerName) {
    if (!qzTrayConnected) {
      showToast("No se puede imprimir: QZ Tray está desconectado.", "error");
      return;
    }
    if (!currentCashCutData) {
      showToast(
        "No hay datos de corte de caja para imprimir. Genere un corte primero.",
        "error"
      );
      return;
    }

    const config = qz.configs.create(printerName);

    // OBTENER LA FECHA DIRECTAMENTE DEL INPUT PARA ASEGURAR SINCRONIZACIÓN
    const dateForPrint = cashCutDateInput.value; // CAMBIADO: Una sola fecha

    // Fetch detailed data if not already loaded (using date from input)
    const detailedExpenses = await fetchDetailedExpenses(dateForPrint); // CAMBIADO
    const detailedClientPayments = await fetchDetailedClientPayments(dateForPrint); // CAMBIADO

    // --- Funciones de ayuda para el formato (reutilizadas y adaptadas) ---
    const formatCurrency = (value) => `$${parseFloat(value || 0).toFixed(2)}`;
    
    // FUNCIÓN PARA FORMATO DD/MM/YYYY
    const formatInputDateToDDMMYYYY = (dateString) => {
        const parts = dateString.split('-'); // dateString es YYYY-MM-DD
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            return `${day}/${month}/${year}`;
        }
        return dateString; // Retorna original si no tiene el formato esperado
    };

    // FUNCIÓN PARA FORMATO DD/MM/YYYY HH:MM (para fechas de DB o new Date())
    const formatDBDateTimeToDDMMYYYYHHMM = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };


    // Calculos para el balance final
    const totalIngresosEfectivo =
      parseFloat(currentCashCutData.ventas_efectivo || 0) +
      parseFloat(currentCashCutData.abonos_clientes || 0);
    const balanceFinal =
      currentInitialCash + totalIngresosEfectivo - parseFloat(currentCashCutData.total_gastos || 0);

    let dataToPrint = [
      "\x1B" + "\x40", // Inicializar impresora
      "\x1B" + "\x74" + "\x11", // Seleccionar página de códigos PC850 (Español)

      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x10", // Negrita y doble altura
      removeAccents("MEGA PARTY") + "\x0A", // Asumiendo el nombre de la empresa
      "\x1B" + "\x21" + "\x00", // Texto normal
      removeAccents("SUCURSAL CENTRO") + "\x0A", // Placeholder, idealmente obtener de config
      removeAccents("AV. SIEMPRE VIVA 742") + "\x0A", // Placeholder
      "TEL: 555-123-4567" + "\x0A", // Placeholder
      "\x0A",

      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x10", // Negrita y doble altura
      removeAccents("REPORTE DE CORTE DE CAJA DIARIO") + "\x0A", // CAMBIADO: Título más específico
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x0A",

      "\x1B" + "\x61" + "\x30", // Alinear a la izquierda
      formatLine("Fecha del Corte:", formatInputDateToDDMMYYYY(dateForPrint)), // CAMBIADO: Una sola fecha
      formatLine("Generado el: ", formatDBDateTimeToDDMMYYYYHHMM(new Date())),
      "-".repeat(ticketWidth) + "\x0A",

      // --- Resumen del Corte de Caja ---
      "\x1B" + "\x21" + "\x08", // Negrita
      formatLine("INGRESOS"),
      "\x1B" + "\x21" + "\x00", // Texto normal
      formatLine(" (+) Caja Inicial:", formatCurrency(currentInitialCash)),
      formatLine(
        " (+) Ventas en Efectivo:",
        formatCurrency(currentCashCutData.ventas_efectivo)
      ),
      formatLine(
        " (+) Abonos de Clientes:",
        formatCurrency(currentCashCutData.abonos_clientes)
      ),
      "-".repeat(ticketWidth) + "\x0A",
      "\x1B" + "\x21" + "\x08", // Negrita
      formatLine(
        "Total Ingresos en Caja:",
        formatCurrency(totalIngresosEfectivo)
      ),
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x0A",

      "\x1B" + "\x21" + "\x08", // Negrita
      formatLine("EGRESOS"),
      "\x1B" + "\x21" + "\x00", // Texto normal
      formatLine(
        " (-) Total de Gastos:",
        formatCurrency(currentCashCutData.total_gastos)
      ),
      "\x0A",

      "-".repeat(ticketWidth) + "\x0A",
      "\x1B" + "\x21" + "\x10", // Negrita y doble altura
      formatLine("BALANCE FINAL EN CAJA:", formatCurrency(balanceFinal)),
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x0A",

      // --- Detalle de Gastos ---
      "=".repeat(ticketWidth) + "\x0A",
      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x08", // Negrita
      removeAccents("DETALLE DE GASTOS") + "\x0A",
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x1B" + "\x61" + "\x30", // Alinear a la izquierda
      "=".repeat(ticketWidth) + "\x0A",
      formatLine("Fecha      Descripcion", "Monto"),
      "-".repeat(ticketWidth) + "\x0A",
    ];

    if (detailedExpenses.length > 0) {
      detailedExpenses.forEach((exp) => {
        const desc = exp.descripcion.substring(
          0,
          ticketWidth - 10 - formatCurrency(exp.monto).length - 2
        );
        dataToPrint.push(
          formatLine(
            `${formatInputDateToDDMMYYYY(exp.fecha).padEnd(10)} ${removeAccents(desc)}`,
            formatCurrency(exp.monto)
          )
        );
      });
    } else {
      dataToPrint.push(formatCentered("No se encontraron gastos."));
    }
    dataToPrint.push("-".repeat(ticketWidth) + "\x0A");

    // --- Detalle de Abonos ---
    dataToPrint.push(
      "=".repeat(ticketWidth) + "\x0A",
      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x08", // Negrita
      removeAccents("DETALLE DE ABONOS DE CLIENTES") + "\x0A",
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x1B" + "\x61" + "\x30", // Alinear a la izquierda
      "=".repeat(ticketWidth) + "\x0A",
      formatLine("Fecha/Hora Cliente (Metodo)", "Monto"),
      "-".repeat(ticketWidth) + "\x0A"
    );

    if (detailedClientPayments.length > 0) {
      detailedClientPayments.forEach((pay) => {
        const clientInfo = `${pay.cliente_nombre} (${pay.metodo_pago})`;
        const clientInfoTruncated = clientInfo.substring(
          0,
          ticketWidth - 18 - formatCurrency(pay.monto).length - 2
        );
        dataToPrint.push(
          formatLine(
            `${formatDBDateTimeToDDMMYYYYHHMM(pay.fecha)
              .substring(0, 16)
              .padEnd(16)} ${removeAccents(clientInfoTruncated)}`,
            formatCurrency(pay.monto)
          )
        );
      });
    } else {
      dataToPrint.push(formatCentered("No se encontraron abonos."));
    }
    dataToPrint.push("-".repeat(ticketWidth) + "\x0A");

    // --- Otros Totales (Informativos) ---
    dataToPrint.push(
      "=".repeat(ticketWidth) + "\x0A",
      "\x1B" + "\x61" + "\x31", // Centrar
      "\x1B" + "\x21" + "\x08", // Negrita
      removeAccents("OTROS TOTALES (INFORMATIVOS)") + "\x0A",
      "\x1B" + "\x21" + "\x00", // Texto normal
      "\x1B" + "\x61" + "\x30", // Alinear a la izquierda
      formatLine(
        "Total Ventas (Todos los metodos):",
        formatCurrency(currentCashCutData.total_ventas)
      ),
      formatLine(
        "Ventas con Tarjeta:",
        formatCurrency(currentCashCutData.ventas_tarjeta)
      ),
      formatLine(
        "Ventas por Transferencia:",
        formatCurrency(currentCashCutData.ventas_transferencia)
      ),
      formatLine(
        "Ventas a Credito:",
        formatCurrency(currentCashCutData.ventas_credito)
      ),
      "\x0A",

      "\x1B" + "\x61" + "\x31", // Centrar
      removeAccents("¡Reporte generado con exito!") + "\x0A",
      "\x0A" + "\x0A" + "\x0A",
      "\x1D" + "\x56" + "\x41" + "\x03" // Cortar papel
    );

    // --- DEBUGGING LOG FOR PRINT ---
    console.log("Fecha de Corte de Caja para Impresión (desde input):", dateForPrint);
    // --- END DEBUGGING LOG ---

    try {
      await qz.print(config, dataToPrint);
      showToast("Corte de caja enviado a la impresora.", "success");
    } catch (err) {
      console.error("Error al imprimir el corte de caja:", err);
      showToast("Error al enviar el corte de caja a la impresora.", "error");
    }
  }

  // --- Asignación de Eventos ---
  generateReportBtn.addEventListener("click", fetchSalesReport);
  exportCsvBtn.addEventListener("click", exportToCsv);
  generateCashCutBtn.addEventListener("click", fetchCashCut);
  printCashCutBtn.addEventListener("click", () => {
    const defaultPrinter = "POS-58"; // Reemplaza con el nombre de tu impresora térmica
    printCashCutReport(defaultPrinter);
  });

  // --- Carga Inicial ---
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const todayFormatted = `${year}-${month}-${day}`;

  // --- DEBUGGING LOGS ---
  console.log("Current Date Object (new Date()):", now);
  console.log("Formatted Date for Input (YYYY-MM-DD):", todayFormatted);
  // --- END DEBUGGING LOGS ---

  startDateInput.value = todayFormatted;
  endDateInput.value = todayFormatted;
  cashCutDateInput.value = todayFormatted; // CAMBIADO: Un solo input de fecha

  fetchSalesReport();
  fetchCashCut(); // Llama a fetchCashCut para cargar la caja inicial al inicio
});
