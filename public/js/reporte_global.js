// Archivo: /public/js/reporte_global.js
$(document).ready(function() {
    const apiURL = `${BASE_URL}/getGlobalSalesReport`;

    // --- INICIO DE LA CORRECCIÓN ---
    // Se mueve la inicialización del plugin DENTRO del bloque ready,
    // para asegurar que todas las librerías (jQuery, DataTables, Moment) ya se cargaron.
    $.fn.dataTable.moment('DD/MM/YYYY, h:mm a');
    // --- FIN DE LA CORRECCIÓN ---

    // 1. INICIALIZACIÓN DE DATERANGEPICKER (Sin cambios)
    const dateRangeInput = $('#daterange-filter');
    dateRangeInput.daterangepicker({
        opens: 'left',
        autoUpdateInput: false,
        locale: {
            "format": "DD/MM/YYYY", "separator": " - ", "applyLabel": "Aplicar", "cancelLabel": "Limpiar",
            "fromLabel": "Desde", "toLabel": "Hasta", "customRangeLabel": "Personalizado", "weekLabel": "S",
            "daysOfWeek": ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
            "monthNames": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            "firstDay": 1
        },
        ranges: {
           'Hoy': [moment(), moment()], 'Ayer': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Últimos 7 días': [moment().subtract(6, 'days'), moment()], 'Últimos 30 días': [moment().subtract(29, 'days'), moment()],
           'Este Mes': [moment().startOf('month'), moment().endOf('month')],
           'Mes Pasado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    });

    // 2. FILTRO PERSONALIZADO PARA DATATABLES (Sin cambios)
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            const dateRangeValue = dateRangeInput.val();
            if (!dateRangeValue) {
                return true;
            }
            const picker = dateRangeInput.data('daterangepicker');
            const minDate = picker.startDate.clone().startOf('day');
            const maxDate = picker.endDate.clone().endOf('day');
            const dateStr = data[0];
            const dateParts = dateStr.split(' ')[0].split('/');
            const rowDate = moment(dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0], "YYYY-MM-DD");
            return rowDate.isBetween(minDate, maxDate, 'day', '[]');
        }
    );

    const table = $('#global-sales-table').DataTable({
        "processing": true,
        "ajax": { "url": apiURL, "dataSrc": "data" },
        "columns": [
            { "data": "fecha", "render": (data) => moment(data).format('DD/MM/YYYY, h:mm a') },
            { "data": "id", "className": "ticket-id-cell", "render": (data) => '#' + String(data).padStart(6, '0') },
            { "data": "sucursal_nombre" }, { "data": "cliente_nombre" }, { "data": "usuario_nombre" },
            { "data": "total", "className": "text-right" },
            { "data": "estado", "render": (data) => `<span class="${data === 'Completada' ? 'text-green-400' : 'text-red-500'} font-semibold">${data}</span>` },
            { "data": "id", "className": "text-center", "orderable": false, "searchable": false, "render": (data) => `<button class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg text-xs view-pdf-btn" data-id="${data}" title="Ver PDF"><i class="fas fa-file-pdf"></i></button>` }
        ],
        "columnDefs": [{ "targets": 5, "render": (data) => `$${parseFloat(data).toFixed(2)}` }],
        "order": [[0, 'desc']],
        "language": { "url": "js/es.json" },
        "responsive": true,
        "footerCallback": function (row, data, start, end, display) {
            const api = this.api();
            const floatVal = (i) => typeof i === 'string' ? parseFloat(i.replace(/[^\d.-]/g, '')) : typeof i === 'number' ? i : 0;
            const pageTotal = api.column(5, { page: 'current' }).data().reduce((a, b) => floatVal(a) + floatVal(b), 0);
            $(api.column(5).footer()).html(`$${pageTotal.toFixed(2)}`);
        }
    });

    // 3. EVENTOS DEL DATERANGEPICKER (Sin cambios)
    dateRangeInput.on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
        table.draw();
    });
    dateRangeInput.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        table.draw();
    });

    // Delegación de eventos para los botones de PDF (sin cambios)
    $('#global-sales-table tbody').on('click', '.view-pdf-btn', function () {
        const saleId = $(this).data('id');
        window.open(`${BASE_URL}/generateQuote?id=${saleId}`, '_blank');
    });
});