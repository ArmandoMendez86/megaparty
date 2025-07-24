<?php
// Archivo: /public/index.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

$action = isset($_GET['action']) ? $_GET['action'] : null;

// Cargamos controladores según la acción
if (in_array($action, ['login', 'logout', 'check-session'])) {
    require_once __DIR__ . '/../app/controllers/LoginController.php';
    $controller = new LoginController();
} elseif (in_array($action, ['getProducts', 'createProduct', 'getProduct', 'updateProduct', 'deleteProduct', 'getProductForPOS', 'getProductByBarcode', 'adjustStock', 'getInventoryMovements'])) {
    require_once __DIR__ . '/../app/controllers/ProductoController.php';
    $controller = new ProductoController();
} elseif (in_array($action, ['getCategorias', 'getMarcas'])) {
    require_once __DIR__ . '/../app/controllers/CatalogoController.php';
    $controller = new CatalogoController();
} elseif (in_array($action, [
    'getClients', 'createClient', 'getClient', 'updateClient', 'deleteClient', 
    'searchClients', 'getProductosParaPreciosEspeciales', 'saveSpecialClientPrice', 
    'registrarAbono' // <-- NUEVA RUTA AÑADIDA AQUÍ
])) {
    require_once __DIR__ . '/../app/controllers/ClienteController.php';
    $controller = new ClienteController();
} elseif (in_array($action, ['processSale', 'saveSale', 'getTicketDetails', 'listPendingSales', 'loadSale', 'deletePendingSale', 'generateQuote'])) {
    require_once __DIR__ . '/../app/controllers/VentaController.php';
    $controller = new VentaController();
} elseif (in_array($action, ['getExpenses', 'createExpense', 'getExpense', 'updateExpense', 'deleteExpense'])) {
    require_once __DIR__ . '/../app/controllers/GastoController.php';
    $controller = new GastoController();
} elseif (in_array($action, ['getSalesReport', 'getCashCut'])) {
    require_once __DIR__ . '/../app/controllers/ReporteController.php';
    $controller = new ReporteController();
} elseif (in_array($action, ['getPrinterConfig', 'updatePrinterConfig', 'getBranchConfig', 'updateBranchConfig'])) {
    require_once __DIR__ . '/../app/controllers/ConfiguracionController.php';
    $controller = new ConfiguracionController();
}

switch ($action) {
    // --- RUTAS DE LOGIN ---
    case 'login':
        $controller->login();
        break;
    case 'logout':
        $controller->logout();
        break;
    case 'check-session':
        $controller->checkSession();
        break;

    // --- RUTAS DE PRODUCTOS E INVENTARIO ---
    case 'getProducts':
        $controller->getAll();
        break;
    case 'createProduct':
        $controller->create();
        break;
    case 'getProduct':
        $controller->getById();
        break;
    case 'updateProduct':
        $controller->update();
        break;
    case 'deleteProduct':
        $controller->delete();
        break;
    case 'getProductForPOS':
        $controller->getProductForPOS();
        break;
    case 'getProductByBarcode':
        $controller->getByBarcode();
        break;
    case 'adjustStock':
        $controller->adjustStock();
        break;
    case 'getInventoryMovements':
        $controller->getInventoryMovements();
        break;

    // --- RUTAS DE CATÁLOGOS ---
    case 'getCategorias':
        $controller->getCategorias();
        break;
    case 'getMarcas':
        $controller->getMarcas();
        break;

    // --- RUTAS DE CLIENTES ---
    case 'getClients':
        $controller->getAll();
        break;
    case 'createClient':
        $controller->create();
        break;
    case 'getClient':
        $controller->getById();
        break;
    case 'updateClient':
        $controller->update();
        break;
    case 'deleteClient':
        $controller->delete();
        break;
    case 'searchClients':
        $controller->search();
        break;
    case 'saveSpecialClientPrice':
        $controller->saveSpecialClientPrice();
        break;
    case 'getProductosParaPreciosEspeciales':
        $controller->getProductosParaPreciosEspeciales();
        break;
    case 'registrarAbono': // <-- NUEVO CASE AÑADIDO AQUÍ
        $controller->registrarAbono();
        break;

    // --- RUTAS DE VENTA ---
    case 'processSale':
        $controller->processSale();
        break;
    case 'saveSale':
        $controller->saveSale();
        break;
    case 'getTicketDetails':
        $controller->getTicketDetails();
        break;
    case 'listPendingSales':
        $controller->listPendingSales();
        break;
    case 'loadSale':
        $controller->loadSale();
        break;
    case 'deletePendingSale':
        $controller->deletePendingSale();
        break;
    case 'generateQuote':
        $controller->generateQuote();
        break;

    // --- RUTAS DE GASTOS ---
    case 'getExpenses':
        $controller->getAll();
        break;
    case 'createExpense':
        $controller->create();
        break;
    case 'getExpense':
        $controller->getById();
        break;
    case 'updateExpense':
        $controller->update();
        break;
    case 'deleteExpense':
        $controller->delete();
        break;

    // --- RUTAS DE REPORTES ---
    case 'getSalesReport':
        $controller->getVentas();
        break;
    case 'getCashCut':
        $controller->getCorteCaja();
        break;

    // --- RUTAS DE CONFIGURACIÓN ---
    case 'getBranchConfig':
        $controller->getBranchConfig();
        break;
    case 'updateBranchConfig':
        $controller->updateBranchConfig();
        break;
    case 'getPrinterConfig':
        $controller->getPrinterConfig();
        break;
    case 'updatePrinterConfig':
        $controller->updatePrinterConfig();
        break;

    default:
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado.']);
        break;
}
