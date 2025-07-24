// Archivo: /public/js/inventario.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Referencias a elementos del DOM ---
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const productsTableBody = document.getElementById('products-table-body');
    const categoriaSelect = document.getElementById('id_categoria');
    const marcaSelect = document.getElementById('id_marca');
    const searchProductInput = document.getElementById('search-product-input');

    // --- INICIO: Referencias para la nueva función de Clonar ---
    const cloneSection = document.getElementById('clone-section');
    const toggleCloneBtn = document.getElementById('toggle-clone-btn');
    const cloneControls = document.getElementById('clone-controls');
    const cloneSourceProductSelect = document.getElementById('clone-source-product');
    const loadCloneDataBtn = document.getElementById('load-clone-data-btn');
    // --- FIN: Referencias para la nueva función de Clonar ---

    const adjustStockModal = document.getElementById('adjust-stock-modal');
    const closeAdjustModalBtn = document.getElementById('close-adjust-modal-btn');
    const cancelAdjustBtn = document.getElementById('cancel-adjust-btn');
    const confirmAdjustBtn = document.getElementById('confirm-adjust-btn');
    const adjustModalTitle = document.getElementById('adjust-modal-title');
    const adjustProductName = document.getElementById('adjust-product-name');
    const adjustProductId = document.getElementById('adjust-product-id');
    const adjustAction = document.getElementById('adjust-action');
    const adjustCurrentStockValue = document.getElementById('adjust-current-stock-value');
    const adjustCurrentStockDisplay = document.getElementById('adjust-current-stock-display');
    const adjustQuantityInput = document.getElementById('adjust-quantity');
    const adjustStockReasonInput = document.getElementById('adjust-stock-reason');
    
    const inventoryHistoryBody = document.getElementById('inventory-history-body');

    let allProducts = [];

    const showModal = () => productModal.classList.remove('hidden');
    const hideModal = () => productModal.classList.add('hidden');
    const showAdjustModal = () => adjustStockModal.classList.remove('hidden');
    const hideAdjustModal = () => adjustStockModal.classList.add('hidden');

    function prepareNewProductForm() {
        productForm.reset();
        document.getElementById('product-id').value = '';
        modalTitle.innerHTML = '<i class="fas fa-box-open mr-3"></i>Añadir Nuevo Producto';
        
        // Mostrar sección de clonar y poblar el dropdown
        cloneSection.classList.remove('hidden');
        cloneControls.classList.add('hidden'); // Empezar con los controles ocultos
        populateCloneSelect();

        showModal();
    }

    // --- INICIO: Nuevas funciones para Clonar ---

    /**
     * Puebla el selector de productos para la función de clonar.
     */
    function populateCloneSelect() {
        cloneSourceProductSelect.innerHTML = '<option value="" disabled selected>Selecciona un producto...</option>';
        if (allProducts && allProducts.length > 0) {
            // Ordenar productos alfabéticamente para el selector
            const sortedProducts = [...allProducts].sort((a, b) => a.nombre.localeCompare(b.nombre));
            sortedProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.nombre} (SKU: ${product.sku})`;
                cloneSourceProductSelect.appendChild(option);
            });
        }
    }

    /**
     * Carga los datos de un producto seleccionado en el formulario para clonarlo.
     */
    async function handleCloneProduct() {
        const sourceId = cloneSourceProductSelect.value;
        if (!sourceId) {
            showToast('Por favor, selecciona un producto para clonar.', 'warning');
            return;
        }

        try {
            // Usamos el endpoint existente para obtener todos los datos del producto
            const response = await fetch(`${BASE_URL}/getProduct?id=${sourceId}`);
            const result = await response.json();

            if (result.success) {
                const product = result.data;
                
                // Poblar el formulario con los datos del producto base
                document.getElementById('nombre').value = `${product.nombre} (Copia)`;
                document.getElementById('id_categoria').value = product.id_categoria;
                document.getElementById('id_marca').value = product.id_marca;
                document.getElementById('precio_menudeo').value = product.precio_menudeo;
                document.getElementById('precio_mayoreo').value = product.precio_mayoreo;
                document.getElementById('stock_minimo').value = product.stock_minimo;
                document.getElementById('descripcion').value = product.descripcion;

                // IMPORTANTE: Limpiar campos que deben ser únicos o reiniciarse
                document.getElementById('product-id').value = ''; // Esto asegura que se cree un NUEVO producto
                document.getElementById('sku').value = ''; // El usuario debe ingresar un nuevo SKU
                document.getElementById('codigo_barras').value = ''; // El usuario debe ingresar un nuevo código de barras si aplica
                document.getElementById('stock').value = 0; // Los productos nuevos/clonados inician con stock 0

                modalTitle.innerHTML = `<i class="fas fa-copy mr-3"></i>Clonando: ${product.nombre}`;
                showToast('Datos cargados. Modifica los campos necesarios y guarda.', 'info');
                
                cloneControls.classList.add('hidden');
                document.getElementById('nombre').focus();

            } else {
                showToast(`Error al cargar datos para clonar: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudieron obtener los datos del producto para clonar.', 'error');
        }
    }
    // --- FIN: Nuevas funciones para Clonar ---


    function populateSelect(selectElement, data, defaultText) {
        selectElement.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nombre;
            selectElement.appendChild(option);
        });
    }

    async function fetchCatalogs() {
        try {
            const [catResponse, marcaResponse] = await Promise.all([
                fetch(`${BASE_URL}/getCategorias`),
                fetch(`${BASE_URL}/getMarcas`)
            ]);
            const catResult = await catResponse.json();
            if (catResult.success) populateSelect(categoriaSelect, catResult.data, 'Selecciona una categoría');
            const marcaResult = await marcaResponse.json();
            if (marcaResult.success) populateSelect(marcaSelect, marcaResult.data, 'Selecciona una marca');
        } catch (error) {
            showToast('Error al cargar catálogos.', 'error');
        }
    }
    
    async function fetchProducts() {
        productsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500">Cargando productos...</td></tr>`;
        try {
            const response = await fetch(`${BASE_URL}/getProducts`);
            const result = await response.json();
            allProducts = result.success ? result.data : [];
            renderProducts(allProducts);
        } catch (error) {
            showToast('No se pudo conectar con el servidor para cargar productos.', 'error');
            productsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500">No se pudo conectar con el servidor.</td></tr>`;
        }
    }

    function renderProducts(productsToRender) {
        if (!productsToRender || productsToRender.length === 0) {
            productsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500">No hay productos.</td></tr>`;
            return;
        }
        productsTableBody.innerHTML = '';
        productsToRender.forEach(product => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-800';
            tr.innerHTML = `
                <td class="py-3 px-6 text-sm">${product.sku}</td>
                <td class="py-3 px-6 text-sm font-semibold text-white">${product.nombre}</td>
                <td class="py-3 px-6 text-sm">${product.marca_nombre || 'N/A'}</td>
                <td class="py-3 px-6 text-sm">${product.categoria_nombre || 'N/A'}</td>
                <td class="py-3 px-6 text-center text-sm">
                    <div class="flex items-center justify-center space-x-2">
                        <button class="adjust-stock-btn text-red-400 hover:text-red-300 font-bold text-lg" data-id="${product.id}" data-name="${product.nombre}" data-currentstock="${product.stock}" data-action="decrease" title="Restar Stock">-</button>
                        <input type="number" value="${product.stock}" class="stock-adjust-input bg-gray-700 text-white rounded text-center text-sm" readonly>
                        <button class="adjust-stock-btn text-green-400 hover:text-green-300 font-bold text-lg" data-id="${product.id}" data-name="${product.nombre}" data-currentstock="${product.stock}" data-action="increase" title="Añadir Stock">+</button>
                    </div>
                </td>
                <td class="py-3 px-6 text-right text-sm font-mono">$${parseFloat(product.precio_menudeo).toFixed(2)}</td>
                <td class="py-3 px-6 text-center">
                    <button data-id="${product.id}" class="edit-btn text-blue-400 hover:text-blue-300 mr-3" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button data-id="${product.id}" class="delete-btn text-red-500 hover:text-red-400" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });
    }
    
    async function handleEditProduct(id) {
        // Ocultar la sección de clonar cuando se está editando
        cloneSection.classList.add('hidden');

        try {
            const response = await fetch(`${BASE_URL}/getProduct?id=${id}`);
            const result = await response.json();
            if (result.success) {
                const product = result.data;
                document.getElementById('product-id').value = product.id;
                document.getElementById('nombre').value = product.nombre;
                document.getElementById('sku').value = product.sku;
                document.getElementById('id_categoria').value = product.id_categoria;
                document.getElementById('id_marca').value = product.id_marca;
                document.getElementById('stock').value = product.stock;
                document.getElementById('stock_minimo').value = product.stock_minimo;
                document.getElementById('precio_menudeo').value = product.precio_menudeo;
                document.getElementById('precio_mayoreo').value = product.precio_mayoreo;
                document.getElementById('codigo_barras').value = product.codigo_barras;
                document.getElementById('descripcion').value = product.descripcion;
                
                modalTitle.innerHTML = '<i class="fas fa-pencil-alt mr-3"></i>Editar Producto';
                showModal();
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudieron obtener los datos del producto.', 'error');
        }
    }

    async function handleDeleteProduct(id) {
        const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.');
        if (!confirmed) return;

        try {
            const response = await fetch(`${BASE_URL}/deleteProduct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Producto eliminado exitosamente.', 'success');
                fetchProducts();
                fetchInventoryMovements();
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo eliminar el producto.', 'error');
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(productForm);
        const productData = Object.fromEntries(formData.entries());
        const productId = productData.id;

        const url = productId ? `${BASE_URL}/updateProduct` : `${BASE_URL}/createProduct`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const result = await response.json();
            if (result.success) {
                hideModal();
                fetchProducts();
                fetchInventoryMovements();
                showToast(`Producto ${productId ? 'actualizado' : 'creado'} exitosamente.`, 'success');
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo conectar con el servidor.', 'error');
        }
    }

    function prepareAdjustStockModal(productId, productName, currentStock, action) {
        adjustProductId.value = productId;
        adjustProductName.textContent = productName;
        adjustAction.value = action;
        adjustCurrentStockValue.value = currentStock;
        adjustCurrentStockDisplay.textContent = currentStock;
        adjustQuantityInput.value = '';
        adjustStockReasonInput.value = '';

        if (action === 'increase') {
            adjustModalTitle.textContent = 'Abastecer Producto';
            adjustQuantityLabel.textContent = 'Cantidad a Añadir';
            confirmAdjustBtn.className = 'bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg';
            confirmAdjustBtn.textContent = 'Añadir Stock';
        } else if (action === 'decrease') {
            adjustModalTitle.textContent = 'Restar de Stock';
            adjustQuantityLabel.textContent = 'Cantidad a Restar';
            confirmAdjustBtn.className = 'bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg';
            confirmAdjustBtn.textContent = 'Restar Stock';
        }
        showAdjustModal();
        adjustQuantityInput.focus();
    }

    async function handleConfirmAdjustStock() {
        const productId = adjustProductId.value;
        const quantityChange = parseInt(adjustQuantityInput.value);
        const reason = adjustStockReasonInput.value.trim();
        const currentStock = parseInt(adjustCurrentStockValue.value);

        if (isNaN(quantityChange) || quantityChange <= 0) {
            showToast('La cantidad debe ser un número mayor que cero.', 'error');
            return;
        }
        if (!reason) {
            showToast('Por favor, ingresa un motivo para el ajuste de stock.', 'error');
            return;
        }

        const action = adjustAction.value;
        let newStock;
        let adjustmentType;

        if (action === 'increase') {
            newStock = currentStock + quantityChange;
            adjustmentType = 'entrada';
        } else if (action === 'decrease') {
            if (quantityChange > currentStock) {
                showToast('No se puede restar más stock del que hay disponible.', 'error');
                return;
            }
            newStock = currentStock - quantityChange;
            adjustmentType = 'salida';
        } else {
            return;
        }

        const confirmed = await showConfirm(`¿Confirmas el ajuste? El nuevo stock será ${newStock}.`);
        if (!confirmed) return;

        try {
            const response = await fetch(`${BASE_URL}/adjustStock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_producto: productId,
                    new_stock: newStock,
                    tipo_movimiento: adjustmentType,
                    cantidad_movida: quantityChange,
                    motivo: reason,
                    stock_anterior: currentStock
                })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Stock ajustado y movimiento registrado.', 'success');
                hideAdjustModal();
                fetchProducts();
                fetchInventoryMovements();
            } else {
                showToast(`Error al ajustar stock: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('Error de conexión al ajustar stock.', 'error');
        }
    }

    async function fetchInventoryMovements() {
        inventoryHistoryBody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-500">Cargando historial...</td></tr>`;
        try {
            const response = await fetch(`${BASE_URL}/getInventoryMovements`);
            const result = await response.json();
            renderInventoryMovements(result.success ? result.data : []);
        } catch (error) {
            inventoryHistoryBody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-red-500">No se pudo conectar con el servidor.</td></tr>`;
        }
    }

    function renderInventoryMovements(movements) {
        if (!movements || movements.length === 0) {
            inventoryHistoryBody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-500">No hay movimientos.</td></tr>`;
            return;
        }
        inventoryHistoryBody.innerHTML = '';
        movements.forEach(movement => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-800';
            const date = new Date(movement.fecha);
            const formattedDate = date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
            let quantityDisplay = movement.cantidad;
            let quantityColorClass = 'text-gray-300';
            
            if (movement.stock_nuevo > movement.stock_anterior) {
                quantityDisplay = `+${movement.cantidad}`;
                quantityColorClass = 'text-green-400';
            } else if (movement.stock_nuevo < movement.stock_anterior) {
                quantityDisplay = `-${movement.cantidad}`;
                quantityColorClass = 'text-red-400';
            }

            tr.innerHTML = `
                <td class="py-3 px-6 text-sm">${formattedDate}</td>
                <td class="py-3 px-6 text-sm font-semibold">${movement.producto_nombre}</td>
                <td class="py-3 px-6 text-sm capitalize">${movement.tipo_movimiento}</td>
                <td class="py-3 px-6 text-center text-sm font-mono ${quantityColorClass}">${quantityDisplay}</td>
                <td class="py-3 px-6 text-center text-sm">${movement.stock_anterior}</td>
                <td class="py-3 px-6 text-center text-sm">${movement.stock_nuevo}</td>
                <td class="py-3 px-6 text-sm">${movement.motivo || 'N/A'}</td>
                <td class="py-3 px-6 text-sm">${movement.usuario_nombre}</td>
            `;
            inventoryHistoryBody.appendChild(tr);
        });
    }

    function filterProducts() {
        const searchTerm = searchProductInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(product => {
            return product.nombre.toLowerCase().includes(searchTerm) ||
                   product.sku.toLowerCase().includes(searchTerm) ||
                   (product.marca_nombre && product.marca_nombre.toLowerCase().includes(searchTerm)) ||
                   (product.categoria_nombre && product.categoria_nombre.toLowerCase().includes(searchTerm));
        });
        renderProducts(filteredProducts);
    }


    // --- Asignación de Eventos ---
    addProductBtn.addEventListener('click', prepareNewProductForm);
    closeModalBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    productForm.addEventListener('submit', handleFormSubmit);

    // Eventos para clonar
    toggleCloneBtn.addEventListener('click', () => cloneControls.classList.toggle('hidden'));
    loadCloneDataBtn.addEventListener('click', handleCloneProduct);

    // Eventos para ajuste de stock
    closeAdjustModalBtn.addEventListener('click', hideAdjustModal);
    cancelAdjustBtn.addEventListener('click', hideAdjustModal);
    confirmAdjustBtn.addEventListener('click', handleConfirmAdjustStock);

    // Evento para búsqueda
    searchProductInput.addEventListener('keyup', filterProducts);
    searchProductInput.addEventListener('change', filterProducts);

    productsTableBody.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-btn');
        const deleteButton = event.target.closest('.delete-btn');
        const adjustButton = event.target.closest('.adjust-stock-btn');

        if (editButton) handleEditProduct(editButton.dataset.id);
        if (deleteButton) handleDeleteProduct(deleteButton.dataset.id);
        if (adjustButton) {
            prepareAdjustStockModal(adjustButton.dataset.id, adjustButton.dataset.name, parseInt(adjustButton.dataset.currentstock), adjustButton.dataset.action);
        }
    });
    
    // --- Carga Inicial ---
    fetchCatalogs();
    fetchProducts();
    fetchInventoryMovements();
});
