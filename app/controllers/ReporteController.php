<?php
// Archivo: /app/controllers/ReporteController.php

require_once __DIR__ . '/../models/Reporte.php';

class ReporteController {

    private $reporteModel;

    public function __construct() {
        $this->reporteModel = new Reporte();
    }

    public function getVentas() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) { http_response_code(403); echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']); return; }
        if (empty($_GET['start']) || empty($_GET['end'])) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'Rango de fechas no proporcionado.']); return; }

        $id_sucursal = $_SESSION['branch_id'];
        $fecha_inicio = htmlspecialchars(strip_tags($_GET['start']));
        $fecha_fin = htmlspecialchars(strip_tags($_GET['end']));

        try {
            $ventas = $this->reporteModel->getVentasPorFecha($id_sucursal, $fecha_inicio, $fecha_fin);
            echo json_encode(['success' => true, 'data' => $ventas]);
        } catch (Exception $e) { http_response_code(500); echo json_encode(['success' => false, 'message' => 'Error al generar el reporte.', 'error' => $e->getMessage()]); }
    }

    public function getCorteCaja() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) { http_response_code(403); echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']); return; }
        
        // CAMBIADO: Ahora espera un solo parámetro 'date'
        if (empty($_GET['date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Fecha no proporcionada para el corte de caja.']);
            return;
        }

        $fecha = htmlspecialchars(strip_tags($_GET['date'])); // CAMBIADO: Obtener una sola fecha
        $id_sucursal = $_SESSION['branch_id'];

        try {
            // CAMBIADO: Pasar una sola fecha al modelo
            $corte_data = $this->reporteModel->getCorteDeCaja($id_sucursal, $fecha);
            echo json_encode(['success' => true, 'data' => $corte_data]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al generar el corte de caja.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Obtiene el detalle de gastos para una sucursal en una fecha específica.
     */
    public function getDetailedExpenses() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) { http_response_code(403); echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']); return; }
        
        // CAMBIADO: Ahora espera un solo parámetro 'date'
        if (empty($_GET['date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Fecha no proporcionada para los gastos detallados.']);
            return;
        }

        $fecha = htmlspecialchars(strip_tags($_GET['date'])); // CAMBIADO: Obtener una sola fecha
        $id_sucursal = $_SESSION['branch_id'];

        try {
            // CAMBIADO: Pasar una sola fecha al modelo
            $gastos = $this->reporteModel->getGastosDetallados($id_sucursal, $fecha);
            echo json_encode(['success' => true, 'data' => $gastos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener los gastos detallados.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Obtiene el detalle de abonos de clientes para una sucursal en una fecha específica.
     */
    public function getDetailedClientPayments() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) { http_response_code(403); echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']); return; }
        
        // CAMBIADO: Ahora espera un solo parámetro 'date'
        if (empty($_GET['date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Fecha no proporcionada para los abonos detallados.']);
            return;
        }

        $fecha = htmlspecialchars(strip_tags($_GET['date'])); // CAMBIADO: Obtener una sola fecha
        $id_sucursal = $_SESSION['branch_id'];

        try {
            // CAMBIADO: Pasar una sola fecha al modelo
            $abonos = $this->reporteModel->getAbonosDetallados($id_sucursal, $fecha);
            echo json_encode(['success' => true, 'data' => $abonos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener los abonos detallados.', 'error' => $e->getMessage()]);
        }
    }
}
