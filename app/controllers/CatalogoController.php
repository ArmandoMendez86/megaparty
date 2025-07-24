<?php
// Archivo: /app/controllers/CatalogoController.php

require_once __DIR__ . '/../models/Categoria.php';
require_once __DIR__ . '/../models/Marca.php';

class CatalogoController {

    public function getCategorias() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
            return;
        }
        $categoriaModel = new Categoria();
        $categorias = $categoriaModel->getAll();
        echo json_encode(['success' => true, 'data' => $categorias]);
    }

    public function getMarcas() {
        header('Content-Type: application/json');
        if (!isset($_SESSION['user_id'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
            return;
        }
        $marcaModel = new Marca();
        $marcas = $marcaModel->getAll();
        echo json_encode(['success' => true, 'data' => $marcas]);
    }
}
