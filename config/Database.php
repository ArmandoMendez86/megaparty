<?php
// Archivo: /config/Database.php

class Database {
    // Parámetros de conexión a la base de datos
    // Es una buena práctica guardarlos en un archivo de configuración separado o en variables de entorno.
    private $host = 'localhost';
    private $db_name = 'multisucursal'; 
    private $username = 'root';
    private $password = 'linux'; // Coloca aquí tu contraseña de MySQL si tienes una
    private $conn;

    // Propiedad estática para almacenar la única instancia de la clase
    private static $instance = null;

    /**
     * Constructor privado para prevenir la creación de objetos mediante 'new'.
     * La conexión se establece aquí.
     */
    private function __construct() {
        $this->conn = null;
        try {
            // DSN (Data Source Name) para la conexión PDO
            $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8';
            
            // Creación de la instancia de PDO
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Configurar PDO para que lance excepciones en caso de error
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Configurar el modo de obtención de resultados a un array asociativo
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch(PDOException $e) {
            // Manejo de errores de conexión
            echo 'Error de Conexión: ' . $e->getMessage();
            // En una aplicación real, aquí deberías registrar el error en un log y mostrar un mensaje amigable.
            exit;
        }
    }

    /**
     * Previene la clonación de la instancia (patrón Singleton).
     */
    private function __clone() { }

    /**
     * Método estático que controla el acceso a la instancia Singleton.
     * Crea la instancia si no existe y la devuelve.
     *
     * @return Database La única instancia de la clase Database.
     */
    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    /**
     * Devuelve el objeto de conexión PDO para ser utilizado en los modelos.
     *
     * @return PDO El objeto de conexión PDO.
     */
    public function getConnection() {
        return $this->conn;
    }
}
?>
