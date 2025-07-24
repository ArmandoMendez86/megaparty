<?php
// Archivo: /app/models/Venta.php

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/Producto.php'; // Include Producto model to use its methods

class Venta
{
    private $conn;
    private $productoModel; // Declare productoModel

    public function __construct()
    {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        $this->productoModel = new Producto(); // Initialize productoModel
    }

    /**
     * Creates a new sale. Handles different statuses ('Completada', 'Pendiente')
     * and only deducts stock for completed sales.
     */
    public function create($data)
    {
        // Transaction is now handled in VentaController for consistency with inventory movements
        try {
            $estadoVenta = $data['estado'] ?? 'Completada';
            $idDireccion = $data['id_direccion_envio'] ?? null;
            $ivaAplicado = $data['iva_aplicado'] ?? 0;
            // FIX: Use null coalescing operator to handle missing 'payments' key for pending sales.
            $paymentsJson = !empty($data['payments']) ? json_encode($data['payments']) : null;

            // Step 2: Insert into the 'ventas' table
            $stmt_venta = $this->conn->prepare("INSERT INTO ventas (id_cliente, id_usuario, id_sucursal, id_direccion_envio, total, metodo_pago, iva_aplicado, estado) VALUES (:id_cliente, :id_usuario, :id_sucursal, :id_direccion_envio, :total, :metodo_pago, :iva_aplicado, :estado)");
            $stmt_venta->bindParam(':id_cliente', $data['id_cliente']);
            $stmt_venta->bindParam(':id_usuario', $data['id_usuario']);
            $stmt_venta->bindParam(':id_sucursal', $data['id_sucursal']);
            $stmt_venta->bindParam(':id_direccion_envio', $idDireccion);
            $stmt_venta->bindParam(':total', $data['total']);
            $stmt_venta->bindParam(':metodo_pago', $paymentsJson); // Store JSON of payments or NULL
            $stmt_venta->bindParam(':iva_aplicado', $ivaAplicado, PDO::PARAM_INT);
            $stmt_venta->bindParam(':estado', $estadoVenta);
            $stmt_venta->execute();
            $idVenta = $this->conn->lastInsertId();

            // Step 3: Insert each product into 'venta_detalles'
            $stmt_detalle = $this->conn->prepare("INSERT INTO venta_detalles (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario, :subtotal)");

            foreach ($data['cart'] as $item) {
                $precio_unitario = $item['precio_final'];
                $subtotal_item = $item['quantity'] * $precio_unitario;

                $stmt_detalle->bindParam(':id_venta', $idVenta);
                $stmt_detalle->bindParam(':id_producto', $item['id']);
                $stmt_detalle->bindParam(':cantidad', $item['quantity']);
                $stmt_detalle->bindParam(':precio_unitario', $precio_unitario);
                $stmt_detalle->bindParam(':subtotal', $subtotal_item);
                $stmt_detalle->execute();
            }

            return $idVenta;
        } catch (Exception $e) {
            throw $e;
        }
    }

     /**
     * Updates an existing sale.
     * @param array $data The sale data to update, including id_venta.
     * @return bool True if the update was successful.
     * @throws Exception If a transaction error occurs.
     */
    public function update($data)
    {
        try {
            $idVenta = $data['id_venta'];
            $estadoVenta = $data['estado'] ?? 'Completada';
            $idDireccion = $data['id_direccion_envio'] ?? null;
            $idSucursal = $data['id_sucursal'];
            $ivaAplicado = $data['iva_aplicado'] ?? 0;
            // FIX: Use null coalescing operator to handle missing 'payments' key for pending sales.
            $paymentsJson = !empty($data['payments']) ? json_encode($data['payments']) : null;

            // 1. Get current sale to determine if status changes from Pending to Completed
            $stmt_current_sale = $this->conn->prepare("SELECT estado FROM ventas WHERE id = :id_venta FOR UPDATE");
            $stmt_current_sale->bindParam(':id_venta', $idVenta);
            $stmt_current_sale->execute();
            $currentSale = $stmt_current_sale->fetch(PDO::FETCH_ASSOC);

            if (!$currentSale) {
                throw new Exception("Venta no encontrada para actualizar.");
            }

            // 2. Delete existing sale details for the current sale
            $stmt_delete_details = $this->conn->prepare("DELETE FROM venta_detalles WHERE id_venta = :id_venta");
            $stmt_delete_details->bindParam(':id_venta', $idVenta);
            $stmt_delete_details->execute();

            // 3. Update the 'ventas' table
            $stmt_venta = $this->conn->prepare("UPDATE ventas SET id_cliente = :id_cliente, id_usuario = :id_usuario, id_sucursal = :id_sucursal, id_direccion_envio = :id_direccion_envio, total = :total, metodo_pago = :metodo_pago, iva_aplicado = :iva_aplicado, estado = :estado WHERE id = :id_venta");
            $stmt_venta->bindParam(':id_cliente', $data['id_cliente']);
            $stmt_venta->bindParam(':id_usuario', $data['id_usuario']);
            $stmt_venta->bindParam(':id_sucursal', $idSucursal);
            $stmt_venta->bindParam(':id_direccion_envio', $idDireccion);
            $stmt_venta->bindParam(':total', $data['total']);
            $stmt_venta->bindParam(':metodo_pago', $paymentsJson); // Store JSON of payments or NULL
            $stmt_venta->bindParam(':iva_aplicado', $ivaAplicado, PDO::PARAM_INT);
            $stmt_venta->bindParam(':estado', $estadoVenta);
            $stmt_venta->bindParam(':id_venta', $idVenta);
            $stmt_venta->execute();

            // 4. Insert each product into 'venta_detalles'
            $stmt_detalle = $this->conn->prepare("INSERT INTO venta_detalles (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario, :subtotal)");

            foreach ($data['cart'] as $item) {
                $precio_unitario = $item['precio_final'];
                $subtotal_item = $item['quantity'] * $precio_unitario;

                $stmt_detalle->bindParam(':id_venta', $idVenta);
                $stmt_detalle->bindParam(':id_producto', $item['id']);
                $stmt_detalle->bindParam(':cantidad', $item['quantity']);
                $stmt_detalle->bindParam(':precio_unitario', $precio_unitario);
                $stmt_detalle->bindParam(':subtotal', $subtotal_item);
                $stmt_detalle->execute();
            }

            return true;
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Gets a list of all sales with 'Pendiente' status for a branch.
     */
    public function getPendingSales($id_sucursal)
    {
        $query = "SELECT v.id, v.fecha, v.total, c.nombre as cliente_nombre 
                  FROM ventas v
                  JOIN clientes c ON v.id_cliente = c.id
                  WHERE v.estado = 'Pendiente' AND v.id_sucursal = :id_sucursal
                  ORDER BY v.fecha DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

     /**
     * Gets all sale data to load it into the POS.
     */
    public function getSaleForPOS($id_venta)
    {
        $resultado = [];
        // 1. Get sale data
        $query_venta = "SELECT v.*, c.nombre as cliente_nombre FROM ventas v JOIN clientes c ON v.id_cliente = c.id WHERE v.id = :id_venta AND v.estado = 'Pendiente'";
        $stmt_venta = $this->conn->prepare($query_venta);
        $stmt_venta->bindParam(':id_venta', $id_venta);
        $stmt_venta->execute();
        $resultado['header'] = $stmt_venta->fetch(PDO::FETCH_ASSOC);

        if (!$resultado['header']) return null;

        // 2. Get details (cart products)
        $query_items = "SELECT vd.*, p.nombre, p.precio_menudeo, p.precio_mayoreo, p.sku, p.codigo_barras
                        FROM venta_detalles vd
                        JOIN productos p ON vd.id_producto = p.id
                        WHERE vd.id_venta = :id_venta";
        $stmt_items = $this->conn->prepare($query_items);
        $stmt_items->bindParam(':id_venta', $id_venta);
        $stmt_items->execute();
        $resultado['items'] = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        return $resultado;
    }


   /**
     * Gets all details of a sale, including the client's shipping address.
     */
    public function getDetailsForTicket($id_venta)
    {
        $resultado = [];

        // 1. Sale, branch and client address data
        $query_venta = "SELECT
                            v.id, v.fecha, v.total, v.metodo_pago, v.iva_aplicado,
                            c.nombre as cliente,
                            u.nombre as vendedor,
                            s.nombre as sucursal_nombre, s.direccion as sucursal_direccion, s.telefono as sucursal_telefono,
                            cd.direccion as cliente_direccion
                        FROM ventas v
                        JOIN clientes c ON v.id_cliente = c.id
                        JOIN usuarios u ON v.id_usuario = u.id
                        JOIN sucursales s ON v.id_sucursal = s.id
                        LEFT JOIN cliente_direcciones cd ON v.id_direccion_envio = cd.id
                        WHERE v.id = :id_venta";
        $stmt_venta = $this->conn->prepare($query_venta);
        $stmt_venta->bindParam(':id_venta', $id_venta);
        $stmt_venta->execute();
        $resultado['venta'] = $stmt_venta->fetch(PDO::FETCH_ASSOC);

        // 2. Sale items
        $query_items = "SELECT vd.cantidad, vd.precio_unitario, vd.subtotal, p.nombre as producto_nombre, p.sku
                        FROM venta_detalles vd
                        JOIN productos p ON vd.id_producto = p.id
                        WHERE vd.id_venta = :id_venta";
        $stmt_items = $this->conn->prepare($query_items);
        $stmt_items->bindParam(':id_venta', $id_venta);
        $stmt_items->execute();
        $resultado['items'] = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        return $resultado;
    }


     /**
     * Deletes a specific sale, but only if it is in 'Pendiente' status.
     * The database will handle cascading deletion of sale details.
     */
    public function deletePendingSale($id_venta, $id_sucursal)
    {
        $query = "DELETE FROM ventas WHERE id = :id_venta AND estado = 'Pendiente' AND id_sucursal = :id_sucursal";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_venta', $id_venta);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        
        if ($stmt->execute()) {
            // Returns true if at least one row was deleted
            return $stmt->rowCount() > 0;
        }
        return false;
    }
}
