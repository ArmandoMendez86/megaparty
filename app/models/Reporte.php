<?php
// Archivo: /app/models/Reporte.php

require_once __DIR__ . '/../../config/Database.php';

class Reporte {
    private $conn;

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    /**
     * Obtiene un reporte de ventas detallado para una sucursal en un rango de fechas.
     */
    public function getVentasPorFecha($id_sucursal, $fecha_inicio, $fecha_fin) {
        $fecha_fin_completa = $fecha_fin . ' 23:59:59';
        $query = "SELECT v.id, v.fecha, v.total, c.nombre as cliente_nombre, u.nombre as usuario_nombre
                  FROM ventas v
                  JOIN clientes c ON v.id_cliente = c.id
                  JOIN usuarios u ON v.id_usuario = u.id
                  WHERE v.id_sucursal = :id_sucursal AND v.fecha BETWEEN :fecha_inicio AND :fecha_fin_completa
                  ORDER BY v.fecha DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin_completa', $fecha_fin_completa);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calcula todos los datos necesarios para el corte de caja de un día específico.
     */
    public function getCorteDeCaja($id_sucursal, $fecha) {
        $fecha_inicio = $fecha . ' 00:00:00';
        $fecha_fin = $fecha . ' 23:59:59';
        
        $resultado = [
            'total_ventas' => 0,
            'ventas_efectivo' => 0,
            'ventas_tarjeta' => 0,
            'ventas_transferencia' => 0,
            'ventas_credito' => 0,
            'total_gastos' => 0,
            'abonos_clientes' => 0
        ];

        // 1. Total de ventas y desglose por método de pago
        $query_ventas = "SELECT metodo_pago, SUM(total) as total_por_metodo FROM ventas WHERE id_sucursal = :id_sucursal AND fecha BETWEEN :fecha_inicio AND :fecha_fin GROUP BY metodo_pago";
        $stmt_ventas = $this->conn->prepare($query_ventas);
        $stmt_ventas->bindParam(':id_sucursal', $id_sucursal);
        $stmt_ventas->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt_ventas->bindParam(':fecha_fin', $fecha_fin);
        $stmt_ventas->execute();
        while ($row = $stmt_ventas->fetch(PDO::FETCH_ASSOC)) {
            $resultado['total_ventas'] += $row['total_por_metodo'];
            switch ($row['metodo_pago']) {
                case 'Efectivo': $resultado['ventas_efectivo'] = $row['total_por_metodo']; break;
                case 'Tarjeta': $resultado['ventas_tarjeta'] = $row['total_por_metodo']; break;
                case 'Transferencia': $resultado['ventas_transferencia'] = $row['total_por_metodo']; break;
                case 'Crédito': $resultado['ventas_credito'] = $row['total_por_metodo']; break;
            }
        }

        // 2. Total de gastos
        $query_gastos = "SELECT SUM(monto) as total_gastos FROM gastos WHERE id_sucursal = :id_sucursal AND fecha BETWEEN :fecha_inicio AND :fecha_fin";
        $stmt_gastos = $this->conn->prepare($query_gastos);
        $stmt_gastos->bindParam(':id_sucursal', $id_sucursal);
        $stmt_gastos->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt_gastos->bindParam(':fecha_fin', $fecha_fin);
        $stmt_gastos->execute();
        $gastos_result = $stmt_gastos->fetch(PDO::FETCH_ASSOC);
        if ($gastos_result && $gastos_result['total_gastos']) {
            $resultado['total_gastos'] = $gastos_result['total_gastos'];
        }

        // 3. Total de abonos de clientes (solo en efectivo/transferencia)
        $query_abonos = "SELECT SUM(monto) as total_abonos FROM pagos_clientes pc JOIN usuarios u ON pc.id_usuario = u.id WHERE u.id_sucursal = :id_sucursal AND pc.fecha BETWEEN :fecha_inicio AND :fecha_fin AND pc.metodo_pago IN ('Efectivo', 'Transferencia')";
        $stmt_abonos = $this->conn->prepare($query_abonos);
        $stmt_abonos->bindParam(':id_sucursal', $id_sucursal);
        $stmt_abonos->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt_abonos->bindParam(':fecha_fin', $fecha_fin);
        $stmt_abonos->execute();
        $abonos_result = $stmt_abonos->fetch(PDO::FETCH_ASSOC);
        if ($abonos_result && $abonos_result['total_abonos']) {
            $resultado['abonos_clientes'] = $abonos_result['total_abonos'];
        }

        return $resultado;
    }
}
