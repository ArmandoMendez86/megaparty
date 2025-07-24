// Archivo: /public/js/reportes.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Referencias a elementos del DOM ---
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const reportTableBody = document.getElementById('report-table-body');
    const cashCutResultsContainer = document.getElementById('cash-cut-results');

    let currentReportData = [];

    // --- Lógica de la API ---

    async function fetchSalesReport() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (!startDate || !endDate) {
            showToast('Por favor, seleccione una fecha de inicio y de fin.', 'error');
            return;
        }
        reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Generando reporte...</td></tr>`;
        try {
            const response = await fetch(`${BASE_URL}/getSalesReport?start=${startDate}&end=${endDate}`);
            const result = await response.json();
            if (result.success) {
                currentReportData = result.data;
                renderReport(currentReportData);
            } else {
                reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">${result.message}</td></tr>`;
            }
        } catch (error) {
            reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">No se pudo conectar con el servidor.</td></tr>`;
        }
    }

    async function fetchCashCut() {
        cashCutResultsContainer.innerHTML = `<p class="text-gray-400">Calculando corte de caja...</p>`;
        try {
            const response = await fetch(`${BASE_URL}/getCashCut`); // Por defecto toma la fecha de hoy
            const result = await response.json();
            if (result.success) {
                renderCashCut(result.data);
            } else {
                cashCutResultsContainer.innerHTML = `<p class="text-red-500">${result.message}</p>`;
            }
        } catch (error) {
            cashCutResultsContainer.innerHTML = `<p class="text-red-500">No se pudo conectar con el servidor.</p>`;
        }
    }

    // --- Lógica de Renderizado ---

    function renderReport(sales) {
        if (!sales || sales.length === 0) {
            reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">No se encontraron ventas en el rango de fechas.</td></tr>`;
            return;
        }
        reportTableBody.innerHTML = '';
        sales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-800';
            const saleDate = new Date(sale.fecha);
            const formattedDate = saleDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            tr.innerHTML = `
                <td class="py-3 px-6 text-sm">${formattedDate} ${formattedTime}</td>
                <td class="py-3 px-6 text-sm font-mono">#${sale.id.toString().padStart(6, '0')}</td>
                <td class="py-3 px-6 text-sm font-semibold text-white">${sale.cliente_nombre}</td>
                <td class="py-3 px-6 text-sm">${sale.usuario_nombre}</td>
                <td class="py-3 px-6 text-right text-sm font-mono text-green-400">$${parseFloat(sale.total).toFixed(2)}</td>
            `;
            reportTableBody.appendChild(tr);
        });
    }

    function renderCashCut(data) {
        const formatCurrency = (value) => `$${parseFloat(value || 0).toFixed(2)}`;
        
        const totalIngresosEfectivo = parseFloat(data.ventas_efectivo || 0) + parseFloat(data.abonos_clientes || 0);
        const balanceFinal = totalIngresosEfectivo - parseFloat(data.total_gastos || 0);

        cashCutResultsContainer.innerHTML = `
            <div class="space-y-4 text-sm">
                <div class="flex justify-between border-b border-gray-700 pb-2">
                    <span class="font-semibold text-green-400">(+) Ventas en Efectivo:</span>
                    <span class="font-mono text-green-400">${formatCurrency(data.ventas_efectivo)}</span>
                </div>
                <div class="flex justify-between border-b border-gray-700 pb-2">
                    <span class="font-semibold text-green-400">(+) Abonos de Clientes (Efectivo/Transf.):</span>
                    <span class="font-mono text-green-400">${formatCurrency(data.abonos_clientes)}</span>
                </div>
                <div class="flex justify-between border-b border-gray-700 pb-2">
                    <span class="font-semibold text-red-400">(-) Total de Gastos:</span>
                    <span class="font-mono text-red-400">${formatCurrency(data.total_gastos)}</span>
                </div>
                <div class="flex justify-between pt-4 text-lg">
                    <span class="font-bold text-white">(=) Balance Final en Caja:</span>
                    <span class="font-bold font-mono text-white">${formatCurrency(balanceFinal)}</span>
                </div>
                <hr class="border-gray-600 my-4">
                <h3 class="text-md font-semibold text-gray-400 pt-4">Otros Totales (Informativos)</h3>
                <div class="flex justify-between text-xs"><span>Total Ventas (Todos los métodos):</span><span class="font-mono">${formatCurrency(data.total_ventas)}</span></div>
                <div class="flex justify-between text-xs"><span>Ventas con Tarjeta:</span><span class="font-mono">${formatCurrency(data.ventas_tarjeta)}</span></div>
                <div class="flex justify-between text-xs"><span>Ventas por Transferencia:</span><span class="font-mono">${formatCurrency(data.ventas_transferencia)}</span></div>
                <div class="flex justify-between text-xs"><span>Ventas a Crédito:</span><span class="font-mono">${formatCurrency(data.ventas_credito)}</span></div>
            </div>
        `;
    }

    function exportToCsv() {
        if (currentReportData.length === 0) {
            showToast('No hay datos para exportar.', 'error');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,Fecha,Ticket ID,Cliente,Vendedor,Total\r\n";
        currentReportData.forEach(row => {
            let csvRow = [`"${new Date(row.fecha).toLocaleString('es-MX')}"`, `"${row.id}"`, `"${row.cliente_nombre}"`, `"${row.usuario_nombre}"`, `"${row.total}"`].join(',');
            csvContent += csvRow + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- Asignación de Eventos ---
    generateReportBtn.addEventListener('click', fetchSalesReport);
    exportCsvBtn.addEventListener('click', exportToCsv);

    // --- Carga Inicial ---
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
    fetchSalesReport();
    fetchCashCut();
});
