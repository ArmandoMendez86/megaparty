<?php
// Archivo: /app/controllers/LoginController.php

require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/AperturaCaja.php'; // Incluir el nuevo modelo

class LoginController {

    public function login() {
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
                $_SESSION['rol'] = $user->rol; // <-- CORREGIDO: Usar 'rol' en lugar de 'user_role'
                $_SESSION['branch_id'] = $user->id_sucursal;

                $userData = [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'username' => $user->username,
                    'rol' => $user->rol,
                    'id_sucursal' => $user->id_sucursal
                ];

                // --- LÓGICA DE APERTURA DE CAJA ---
                $aperturaCajaModel = new AperturaCaja();
                $fecha_actual = date('Y-m-d'); // Obtiene la fecha actual del servidor

                // Si el usuario es Administrador, verificar si la caja está abierta para hoy
                if ($user->rol === 'Administrador') {
                    $apertura_hoy = $aperturaCajaModel->obtenerAperturaPorFecha($user->id_sucursal, $fecha_actual);
                    if (!$apertura_hoy) {
                        // La caja no ha sido abierta hoy por este administrador en esta sucursal
                        http_response_code(200);
                        echo json_encode([
                            'success' => true,
                            'message' => 'Inicio de sesión exitoso. Caja no abierta para hoy.',
                            'user' => $userData,
                            'requires_cash_opening' => true // Indicar al frontend que requiere apertura
                        ]);
                        return; // Detener la ejecución aquí
                    }
                }
                // --- FIN LÓGICA ---

                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Inicio de sesión exitoso.', 'user' => $userData, 'requires_cash_opening' => false]);
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
     * Verifica si existe una sesión activa y devuelve los datos del usuario.
     */
    public function checkSession() {
        header('Content-Type: application/json');

        if (isset($_SESSION['user_id'])) {
            // Si hay una sesión, devolvemos los datos guardados.
            $userData = [
                'id' => $_SESSION['user_id'],
                'nombre' => $_SESSION['user_name'],
                'rol' => $_SESSION['rol'], // <-- CORREGIDO: Usar 'rol'
                'id_sucursal' => $_SESSION['branch_id']
            ];
            echo json_encode(['success' => true, 'user' => $userData]);
        } else {
            // Si no hay sesión, lo indicamos.
            echo json_encode(['success' => false, 'message' => 'No hay sesión activa.']);
        }
    }
}
