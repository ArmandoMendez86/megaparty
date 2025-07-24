<?php
// Archivo: /app/models/Sucursal.php

require_once __DIR__ . '/../../config/Database.php';

class Sucursal {
    private $conn;
    private $table_name = "sucursales";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    /**
     * Obtiene los datos de una sucursal por su ID.
     */
    public function getById($id) {
        $query = "SELECT id, nombre, direccion, telefono, email, logo_url FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Actualiza los datos de una sucursal.
     */
    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                    nombre = :nombre,
                    direccion = :direccion,
                    telefono = :telefono,
                    email = :email,
                    logo_url = :logo_url
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);

        // Limpiamos los datos y los guardamos en variables locales
        $nombre = htmlspecialchars(strip_tags($data['nombre']));
        $direccion = htmlspecialchars(strip_tags($data['direccion']));
        $telefono = htmlspecialchars(strip_tags($data['telefono']));
        $email = htmlspecialchars(strip_tags($data['email']));
        $logo_url = htmlspecialchars(strip_tags($data['logo_url']));

        // Pasamos las variables a bindParam
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':direccion', $direccion);
        $stmt->bindParam(':telefono', $telefono);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':logo_url', $logo_url);

        return $stmt->execute();
    }
}
?>
