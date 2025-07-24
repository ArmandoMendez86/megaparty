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
        
        $fecha = $_GET['date'] ?? date('Y-m-d');
        $id_sucursal = $_SESSION['branch_id'];

        try {
            $corte_data = $this->reporteModel->getCorteDeCaja($id_sucursal, $fecha);
            echo json_encode(['success' => true, 'data' => $corte_data]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al generar el corte de caja.', 'error' => $e->getMessage()]);
        }
    }
}
