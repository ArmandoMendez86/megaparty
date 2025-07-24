<?php
// Archivo: /app/models/Usuario.php

// --- CORREGIDO ---
// Se añadió una barra inclinada '/' después de __DIR__
require_once __DIR__ . '/../../config/Database.php';

class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public $id;
    public $id_sucursal;
    public $nombre;
    public $username;
    public $password;
    public $rol;

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function findByUsername($username) {
        $query = "SELECT id, id_sucursal, nombre, username, password, rol 
                  FROM " . $this->table_name . " 
                  WHERE username = :username AND activo = 1 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $username = htmlspecialchars(strip_tags($username));
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Devolvemos el objeto directamente, ya que password_verify lo necesita
            return $stmt->fetch(PDO::FETCH_OBJ);
        }

        return null;
    }

     /**
     * --- NUEVO MÉTODO ---
     * Obtiene solo la configuración de la impresora de un usuario.
     */
    public function getPrinter($id) {
        $query = "SELECT impresora_tickets FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['impresora_tickets'] : null;
    }

    /**
     * --- NUEVO MÉTODO ---
     * Actualiza solo la configuración de la impresora de un usuario.
     */
    public function updatePrinter($id, $printerName) {
        $query = "UPDATE " . $this->table_name . " SET impresora_tickets = :impresora_tickets WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':impresora_tickets', $printerName);
        return $stmt->execute();
    }
}
