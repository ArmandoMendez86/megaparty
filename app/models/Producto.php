<?php
// Archivo: /app/models/Producto.php

require_once __DIR__ . '/../../config/Database.php';

class Producto
{
    private $conn;
    private $table_name = "productos";
    private $inventory_table = "inventario_sucursal";
    private $special_prices_table = "cliente_precios_especiales";
    private $movements_table = "movimientos_inventario"; // Nueva tabla

    public function __construct()
    {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    /**
     * Obtiene una lista simple de todos los productos para la interfaz de precios especiales.
     */
    public function getAllSimple()
    {
        $query = "SELECT id, sku, nombre, precio_menudeo FROM " . $this->table_name . " WHERE activo = 1 ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAll($id_sucursal)
    {
        $query = "SELECT 
                    p.id, p.sku, p.codigo_barras, p.nombre, p.precio_menudeo, p.activo,
                    c.nombre as categoria_nombre,
                    m.nombre as marca_nombre,
                    inv.stock, inv.stock_minimo
                  FROM 
                    productos p
                  LEFT JOIN categorias c ON p.id_categoria = c.id
                  LEFT JOIN marcas m ON p.id_marca = m.id
                  LEFT JOIN inventario_sucursal inv ON p.id = inv.id_producto AND inv.id_sucursal = :id_sucursal
                  ORDER BY p.nombre ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_sucursal', $id_sucursal, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un único producto por una coincidencia exacta de SKU o código de barras.
     */
    public function findByBarcodeOrSku($code, $id_sucursal)
    {
        $query = "SELECT 
                    p.*, 
                    inv.stock, 
                    inv.stock_minimo
                  FROM 
                    " . $this->table_name . " p
                  LEFT JOIN 
                    " . $this->inventory_table . " inv ON p.id = inv.id_producto AND inv.id_sucursal = :id_sucursal
                  WHERE 
                    (p.sku = :code OR p.codigo_barras = :code)
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $code);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data, $id_sucursal)
    {
        $this->conn->beginTransaction();
        try {
            $query_producto = "INSERT INTO " . $this->table_name . " (id_categoria, id_marca, nombre, descripcion, sku, codigo_barras, precio_menudeo, precio_mayoreo) VALUES (:id_categoria, :id_marca, :nombre, :descripcion, :sku, :codigo_barras, :precio_menudeo, :precio_mayoreo)";
            $stmt_producto = $this->conn->prepare($query_producto);
            $stmt_producto->bindParam(':id_categoria', $data['id_categoria']);
            $stmt_producto->bindParam(':id_marca', $data['id_marca']);
            $stmt_producto->bindParam(':nombre', $data['nombre']);
            $stmt_producto->bindParam(':descripcion', $data['descripcion']);
            $stmt_producto->bindParam(':sku', $data['sku']);
            $stmt_producto->bindParam(':codigo_barras', $data['codigo_barras']);
            $stmt_producto->bindParam(':precio_menudeo', $data['precio_menudeo']);
            $stmt_producto->bindParam(':precio_mayoreo', $data['precio_mayoreo']);

            if ($stmt_producto->execute()) {
                $id_producto_nuevo = $this->conn->lastInsertId();

                $query_inventario = "INSERT INTO " . $this->inventory_table . " (id_producto, id_sucursal, stock, stock_minimo) VALUES (:id_producto, :id_sucursal, :stock, :stock_minimo)";
                $stmt_inventario = $this->conn->prepare($query_inventario);
                $stmt_inventario->bindParam(':id_producto', $id_producto_nuevo);
                $stmt_inventario->bindParam(':id_sucursal', $id_sucursal);
                $stmt_inventario->bindParam(':stock', $data['stock']);
                $stmt_inventario->bindParam(':stock_minimo', $data['stock_minimo']);

                if ($stmt_inventario->execute()) {
                    // Registrar el movimiento de inventario inicial
                    $this->addInventoryMovement(
                        $id_producto_nuevo,
                        $id_sucursal,
                        $_SESSION['user_id'], // Asume que el ID de usuario está en la sesión
                        'entrada',
                        $data['stock'],
                        0, // Stock anterior es 0 al crear
                        $data['stock'],
                        'Creación de producto e inventario inicial',
                        null
                    );
                    $this->conn->commit();
                    return $id_producto_nuevo;
                }
            }
            $this->conn->rollBack();
            return false;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e; // Re-lanzar la excepción para que el controlador la capture
        }
    }

    /**
     * Obtiene un producto y su stock para una sucursal específica.
     */
    public function getById($id, $id_sucursal)
    {
        $query = "SELECT 
                    p.*, 
                    inv.stock, 
                    inv.stock_minimo
                  FROM 
                    " . $this->table_name . " p
                  LEFT JOIN 
                    " . $this->inventory_table . " inv ON p.id = inv.id_producto AND inv.id_sucursal = :id_sucursal
                  WHERE 
                    p.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Actualiza un producto y su stock en una sucursal específica.
     */
    public function update($id, $data, $id_sucursal)
    {
        $this->conn->beginTransaction();
        try {
            // Paso 1: Obtener el stock actual antes de la actualización
            $currentProduct = $this->getById($id, $id_sucursal);
            $oldStock = $currentProduct['stock'] ?? 0;

            // Paso 2: Actualizar los datos maestros del producto
            $query_producto = "UPDATE " . $this->table_name . " SET id_categoria = :id_categoria, id_marca = :id_marca, nombre = :nombre, descripcion = :descripcion, sku = :sku, codigo_barras = :codigo_barras, precio_menudeo = :precio_menudeo, precio_mayoreo = :precio_mayoreo WHERE id = :id";
            $stmt_producto = $this->conn->prepare($query_producto);
            $stmt_producto->bindParam(':id', $id);
            $stmt_producto->bindParam(':id_categoria', $data['id_categoria']);
            $stmt_producto->bindParam(':id_marca', $data['id_marca']);
            $stmt_producto->bindParam(':nombre', $data['nombre']);
            $stmt_producto->bindParam(':descripcion', $data['descripcion']);
            $stmt_producto->bindParam(':sku', $data['sku']);
            $stmt_producto->bindParam(':codigo_barras', $data['codigo_barras']);
            $stmt_producto->bindParam(':precio_menudeo', $data['precio_menudeo']);
            $stmt_producto->bindParam(':precio_mayoreo', $data['precio_mayoreo']);

            if ($stmt_producto->execute()) {
                // Paso 3: Actualizar (o insertar si no existe) el stock para la sucursal
                $query_inventario = "INSERT INTO " . $this->inventory_table . " (id_producto, id_sucursal, stock, stock_minimo) 
                                     VALUES (:id_producto, :id_sucursal, :stock, :stock_minimo)
                                     ON DUPLICATE KEY UPDATE stock = :stock_update, stock_minimo = :stock_minimo_update";

                $stmt_inventario = $this->conn->prepare($query_inventario);
                $stmt_inventario->bindParam(':id_producto', $id);
                $stmt_inventario->bindParam(':id_sucursal', $id_sucursal);
                $stmt_inventario->bindParam(':stock', $data['stock']);
                $stmt_inventario->bindParam(':stock_minimo', $data['stock_minimo']);
                $stmt_inventario->bindParam(':stock_update', $data['stock']);
                $stmt_inventario->bindParam(':stock_minimo_update', $data['stock_minimo']);

                if ($stmt_inventario->execute()) {
                    // Registrar el movimiento de inventario si el stock ha cambiado
                    if ($oldStock != $data['stock']) {
                        $tipo_movimiento = ($data['stock'] > $oldStock) ? 'entrada' : 'salida';
                        $cantidad_movida = abs($data['stock'] - $oldStock);
                        $this->addInventoryMovement(
                            $id,
                            $id_sucursal,
                            $_SESSION['user_id'],
                            'ajuste', // Tipo de movimiento 'ajuste' para cambios manuales
                            $cantidad_movida,
                            $oldStock,
                            $data['stock'],
                            'Actualización de producto desde gestión',
                            null
                        );
                    }
                    $this->conn->commit();
                    return true;
                }
            }
            $this->conn->rollBack();
            return false;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * Elimina un producto del catálogo maestro. La BD se encarga del stock en cascada.
     */
    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    /**
     * Obtiene un producto para el POS, determinando el precio correcto basado en el cliente.
     * Jerarquía de precios:
     * 1. Precio Especial del Cliente.
     * 2. Precio de Menudeo/Mayoreo (según se solicite).
     */
    public function getForPOS($id_producto, $id_sucursal, $id_cliente)
    {
        // Paso 1: Obtener los datos base del producto y su stock.
        $query = "SELECT 
                    p.id, p.sku, p.nombre, p.precio_menudeo, p.precio_mayoreo,
                    inv.stock
                  FROM 
                    " . $this->table_name . " p
                  LEFT JOIN 
                    " . $this->inventory_table . " inv ON p.id = inv.id_producto AND inv.id_sucursal = :id_sucursal
                  WHERE 
                    p.id = :id_producto
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_producto', $id_producto);
        $stmt->bindParam(':id_sucursal', $id_sucursal);
        $stmt->execute();
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$producto) {
            return null; // El producto no existe o no está en esta sucursal.
        }

        // Paso 2: Buscar un precio especial para el cliente.
        // No buscamos para el cliente "Público en General" (ID 1).
        $precio_especial = null;
        if ($id_cliente != 1) {
            $query_precio = "SELECT precio_especial FROM " . $this->special_prices_table . " WHERE id_cliente = :id_cliente AND id_producto = :id_producto";
            $stmt_precio = $this->conn->prepare($query_precio);
            $stmt_precio->bindParam(':id_cliente', $id_cliente);
            $stmt_precio->bindParam(':id_producto', $id_producto);
            $stmt_precio->execute();
            $resultado_precio = $stmt_precio->fetch(PDO::FETCH_ASSOC);
            if ($resultado_precio) {
                $precio_especial = $resultado_precio['precio_especial'];
            }
        }

        // Paso 3: Asignar el precio final al producto.
        // Si hay un precio especial, se usa. Si no, se mantienen los precios de menudeo y mayoreo para que el frontend decida.
        if ($precio_especial !== null) {
            // Creamos un campo 'precio_final' para que el frontend lo use directamente.
            $producto['precio_final'] = $precio_especial;
            $producto['tipo_precio_aplicado'] = 'Especial';
        } else {
            $producto['precio_final'] = $producto['precio_menudeo']; // Por defecto
            $producto['tipo_precio_aplicado'] = 'Menudeo';
        }

        return $producto;
    }

    /**
     * Ajusta el stock de un producto en una sucursal específica
     * y registra el movimiento en el historial.
     *
     * @param int $id_producto ID del producto.
     * @param int $id_sucursal ID de la sucursal.
     * @param int $new_stock Nuevo valor de stock.
     * @param string $tipo_movimiento Tipo de movimiento (entrada, salida, ajuste).
     * @param int $cantidad_movida Cantidad que se movió.
     * @param int $stock_anterior Stock antes del movimiento.
     * @param string $motivo Motivo del ajuste.
     * @param int|null $referencia_id ID de referencia (ej. ID de venta).
     * @return bool True si el ajuste y registro fueron exitosos.
     */
    public function updateStock($id_producto, $id_sucursal, $new_stock, $tipo_movimiento, $cantidad_movida, $stock_anterior, $motivo, $referencia_id = null)
    {
        // REMOVIDO: beginTransaction, commit, rollBack para permitir transacciones externas
        try {
            // Actualizar el stock en inventario_sucursal
            $query_update_stock = "INSERT INTO " . $this->inventory_table . " (id_producto, id_sucursal, stock) 
                                   VALUES (:id_producto, :id_sucursal, :new_stock)
                                   ON DUPLICATE KEY UPDATE stock = :new_stock_update";
            $stmt_update = $this->conn->prepare($query_update_stock);
            $stmt_update->bindParam(':id_producto', $id_producto, PDO::PARAM_INT);
            $stmt_update->bindParam(':id_sucursal', $id_sucursal, PDO::PARAM_INT);
            $stmt_update->bindParam(':new_stock', $new_stock, PDO::PARAM_INT);
            $stmt_update->bindParam(':new_stock_update', $new_stock, PDO::PARAM_INT);
            $stmt_update->execute();

            // Registrar el movimiento en el historial
            $this->addInventoryMovement(
                $id_producto,
                $id_sucursal,
                $_SESSION['user_id'], // Asume que el ID de usuario está en la sesión
                $tipo_movimiento,
                $cantidad_movida,
                $stock_anterior,
                $new_stock,
                $motivo,
                $referencia_id
            );

            return true;
        } catch (Exception $e) {
            // No hacer rollback aquí, la transacción se maneja externamente
            throw $e;
        }
    }

    /**
     * Registra un movimiento en la tabla movimientos_inventario.
     *
     * @param int $id_producto
     * @param int $id_sucursal
     * @param int $id_usuario
     * @param string $tipo_movimiento
     * @param int $cantidad
     * @param int $stock_anterior
     * @param int $stock_nuevo
     * @param string $motivo
     * @param int|null $referencia_id
     * @return bool
     */
    public function addInventoryMovement($id_producto, $id_sucursal, $id_usuario, $tipo_movimiento, $cantidad, $stock_anterior, $stock_nuevo, $motivo = null, $referencia_id = null)
    {
        // REMOVIDO: beginTransaction, commit, rollBack para permitir transacciones externas
        try {
            $query = "INSERT INTO " . $this->movements_table . " 
                    (id_producto, id_sucursal, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id) 
                    VALUES (:id_producto, :id_sucursal, :id_usuario, :tipo_movimiento, :cantidad, :stock_anterior, :stock_nuevo, :motivo, :referencia_id)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_producto', $id_producto, PDO::PARAM_INT);
            $stmt->bindParam(':id_sucursal', $id_sucursal, PDO::PARAM_INT);
            $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
            $stmt->bindParam(':tipo_movimiento', $tipo_movimiento);
            $stmt->bindParam(':cantidad', $cantidad, PDO::PARAM_INT);
            $stmt->bindParam(':stock_anterior', $stock_anterior, PDO::PARAM_INT);
            $stmt->bindParam(':stock_nuevo', $stock_nuevo, PDO::PARAM_INT);
            $stmt->bindParam(':motivo', $motivo);
            $stmt->bindParam(':referencia_id', $referencia_id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (Exception $e) {
            // No hacer rollback aquí, la transacción se maneja externamente
            throw $e;
        }
    }

    /**
     * Obtiene el historial de movimientos de inventario para una sucursal.
     *
     * @param int $id_sucursal
     * @return array
     */
    public function getInventoryMovements($id_sucursal)
    {
        $query = "SELECT 
                    mov.fecha, 
                    p.nombre as producto_nombre, 
                    mov.tipo_movimiento, 
                    mov.cantidad,
                    mov.stock_anterior,
                    mov.stock_nuevo,
                    mov.motivo,
                    u.nombre as usuario_nombre,
                    mov.referencia_id
                  FROM " . $this->movements_table . " mov
                  JOIN productos p ON mov.id_producto = p.id
                  JOIN usuarios u ON mov.id_usuario = u.id
                  WHERE mov.id_sucursal = :id_sucursal
                  ORDER BY mov.fecha DESC
                  LIMIT 100"; // Limitar para no cargar demasiados datos
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_sucursal', $id_sucursal, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // --- INICIO: NUEVO MÉTODO ---
    /**
     * Busca un producto por término (SKU, nombre, código de barras) y devuelve
     * el stock disponible en todas las sucursales.
     *
     * @param string $searchTerm El término de búsqueda.
     * @return array Lista de productos con su stock por sucursal.
     */
    public function findStockInAllBranches($searchTerm)
    {
        $query = "SELECT 
                    p.id AS producto_id,
                    p.sku,
                    p.nombre AS producto_nombre,
                    s.nombre AS sucursal_nombre,
                    inv.stock
                  FROM 
                    {$this->table_name} p
                  JOIN 
                    {$this->inventory_table} inv ON p.id = inv.id_producto
                  JOIN 
                    sucursales s ON inv.id_sucursal = s.id
                  WHERE 
                    (p.sku LIKE :searchTerm OR p.nombre LIKE :searchTerm OR p.codigo_barras LIKE :searchTerm)
                    AND p.activo = 1
                  ORDER BY 
                    p.nombre, s.nombre";

        $stmt = $this->conn->prepare($query);
        $likeTerm = "%{$searchTerm}%";
        $stmt->bindParam(':searchTerm', $likeTerm);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    // --- FIN: NUEVO MÉTODO ---
}
