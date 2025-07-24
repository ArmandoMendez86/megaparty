<?php
// Archivo: /app/models/Marca.php

require_once __DIR__ . '/../../config/Database.php';

class Marca {
    private $conn;
    private $table_name = "marcas";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    /**
     * Obtiene todas las marcas.
     */
    public function getAll() {
        $query = "SELECT id, nombre FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
