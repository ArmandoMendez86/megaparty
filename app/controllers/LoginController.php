<?php
// Archivo: /app/controllers/LoginController.php

require_once __DIR__ . '/../models/Usuario.php';

class LoginController {

    public function login() {
        // ... (el método login que ya teníamos sigue igual)
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'));

        if (empty($data->username) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos.']);
            return;
        }

        try {
            $usuarioModel = new Usuario();
            $user = $usuarioModel->findByUsername($data->username);

            if ($user && password_verify($data->password, $user->password)) {
                if (session_status() == PHP_SESSION_NONE) {
                    session_start();
                }
                
                $_SESSION['user_id'] = $user->id;
                $_SESSION['user_name'] = $user->nombre;
                $_SESSION['user_role'] = $user->rol;
                $_SESSION['branch_id'] = $user->id_sucursal;

                $userData = [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'username' => $user->username,
                    'rol' => $user->rol,
                    'id_sucursal' => $user->id_sucursal
                ];

                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Inicio de sesión exitoso.', 'user' => $userData]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Ocurrió un error en el servidor.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * --- NUEVO MÉTODO ---
     * Cierra la sesión del usuario.
     */
    public function logout() {
        header('Content-Type: application/json');
        
        // Destruimos todas las variables de sesión.
        $_SESSION = array();

        // Si se desea destruir la sesión completamente, borre también la cookie de sesión.
        // Nota: ¡Esto destruirá la sesión, y no solo los datos de la sesión!
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        // Finalmente, destruir la sesión.
        session_destroy();

        echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente.']);
    }

    /**
     * --- NUEVO MÉTODO ---
     * Verifica si existe una sesión activa y devuelve los datos del usuario.
     */
    public function checkSession() {
        header('Content-Type: application/json');

        if (isset($_SESSION['user_id'])) {
            // Si hay una sesión, devolvemos los datos guardados.
            $userData = [
                'id' => $_SESSION['user_id'],
                'nombre' => $_SESSION['user_name'],
                'rol' => $_SESSION['user_role'],
                'id_sucursal' => $_SESSION['branch_id']
            ];
            echo json_encode(['success' => true, 'user' => $userData]);
        } else {
            // Si no hay sesión, lo indicamos.
            echo json_encode(['success' => false, 'message' => 'No hay sesión activa.']);
        }
    }
}
