// Archivo: /public/js/inventario.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Referencias a elementos del DOM de Productos ---
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

    // --- Referencias para la función de Clonar ---
    const cloneSection = document.getElementById('clone-section');
    const toggleCloneBtn = document.getElementById('toggle-clone-btn');
    const cloneControls = document.getElementById('clone-controls');
    const cloneSourceProductSelect = document.getElementById('clone-source-product');
    const loadCloneDataBtn = document.getElementById('load-clone-data-btn');

    // --- Referencias para Ajuste de Stock ---
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
    const adjustQuantityLabel = document.getElementById('adjust-quantity-label');

    const inventoryHistoryBody = document.getElementById('inventory-history-body');

    // --- Referencias a elementos del DOM de Categorías ---
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeCategoryModalBtn = document.getElementById('close-category-modal-btn');
    const categoryForm = document.getElementById('category-form');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('category-name');
    const categoryDescriptionInput = document.getElementById('category-description');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryEditBtn = document.getElementById('cancel-category-edit-btn');
    const categoriesTableBody = document.getElementById('categories-table-body');

    // --- Referencias a elementos del DOM de Marcas (NUEVOS) ---
    const manageBrandsBtn = document.getElementById('manage-brands-btn');
    const brandModal = document.getElementById('brand-modal');
    const closeBrandModalBtn = document.getElementById('close-brand-modal-btn');
    const brandForm = document.getElementById('brand-form');
    const brandIdInput = document.getElementById('brand-id');
    const brandNameInput = document.getElementById('brand-name');
    const saveBrandBtn = document.getElementById('save-brand-btn');
    const cancelBrandEditBtn = document.getElementById('cancel-brand-edit-btn');
    const brandsTableBody = document.getElementById('brands-table-body');


    let allProducts = [];
    let allCategories = []; 
    let allBrands = []; // Para almacenar las marcas y gestionarlas en el modal

    // --- Funciones de utilidad para Modals ---
    const showModal = (modalElement) => modalElement.classList.remove('hidden');
    const hideModal = (modalElement) => modalElement.classList.add('hidden');

    function prepareNewProductForm() {
        productForm.reset();
        document.getElementById('product-id').value = '';
        modalTitle.innerHTML = '<i class="fas fa-box-open mr-3"></i>Añadir Nuevo Producto';
        
        // Mostrar sección de clonar y poblar el dropdown
        cloneSection.classList.remove('hidden');
        cloneControls.classList.add('hidden'); // Empezar con los controles ocultos
        populateCloneSelect();

        showModal(productModal);
    }

    // --- INICIO: Nuevas funciones para Clonar ---
    /**
     * Populates the product selector for the cloning function.
     */
    function populateCloneSelect() {
        cloneSourceProductSelect.innerHTML = '<option value="" disabled selected>Selecciona un producto...</option>';
        if (allProducts && allProducts.length > 0) {
            // Sort products alphabetically for the selector
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
     * Loads the data of a selected product into the form for cloning.
     */
    async function handleCloneProduct() {
        const sourceId = cloneSourceProductSelect.value;
        if (!sourceId) {
            showToast('Por favor, selecciona un producto para clonar.', 'warning');
            return;
        }

        try {
            // We use the existing endpoint to get all product data
            const response = await fetch(`${BASE_URL}/getProduct?id=${sourceId}`);
            const result = await response.json();

            if (result.success) {
                const product = result.data;
                
                // Populate the form with the base product data
                document.getElementById('nombre').value = `${product.nombre} (Copia)`;
                document.getElementById('id_categoria').value = product.id_categoria;
                document.getElementById('id_marca').value = product.id_marca;
                document.getElementById('precio_menudeo').value = product.precio_menudeo;
                document.getElementById('precio_mayoreo').value = product.precio_mayoreo;
                document.getElementById('stock_minimo').value = product.stock_minimo;
                document.getElementById('descripcion').value = product.descripcion;

                // IMPORTANT: Clear fields that must be unique or reset
                document.getElementById('product-id').value = ''; // This ensures a NEW product is created
                document.getElementById('sku').value = ''; // User must enter a new SKU
                document.getElementById('codigo_barras').value = ''; // User must enter a new barcode if applicable
                document.getElementById('stock').value = 0; // New/cloned products start with 0 stock

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
            if (catResult.success) {
                allCategories = catResult.data; // Almacenar categorías para el modal de categorías
                populateSelect(categoriaSelect, allCategories, 'Selecciona una categoría');
            }
            const marcaResult = await marcaResponse.json();
            if (marcaResult.success) {
                allBrands = marcaResult.data; // Almacenar marcas para el modal de marcas
                populateSelect(marcaSelect, allBrands, 'Selecciona una marca');
            }
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
        // Hide the clone section when editing
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
                showModal(productModal);
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
        }
        catch (error) {
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
                hideModal(productModal);
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
        showModal(adjustStockModal);
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
                hideModal(adjustStockModal);
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

    // --- INICIO: Funciones para la gestión de Categorías ---

    function prepareCategoryFormForAdd() {
        categoryForm.reset();
        categoryIdInput.value = '';
        saveCategoryBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Añadir Categoría';
        saveCategoryBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        saveCategoryBtn.classList.add('bg-green-600', 'hover:bg-green-500');
        cancelCategoryEditBtn.classList.add('hidden');
    }

    async function fetchCategories() {
        categoriesTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-gray-500">Cargando categorías...</td></tr>`;
        try {
            const response = await fetch(`${BASE_URL}/getCategorias`);
            const result = await response.json();
            if (result.success) {
                allCategories = result.data; // Actualizar la lista global de categorías
                renderCategories(allCategories);
                populateSelect(categoriaSelect, allCategories, 'Selecciona una categoría'); // Actualizar el select de categorías en el modal de producto
            } else {
                categoriesTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-red-500">${result.message}</td></tr>`;
            }
        } catch (error) {
            showToast('Error al cargar categorías.', 'error');
            categoriesTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-red-500">No se pudo conectar con el servidor para categorías.</td></tr>`;
        }
    }

    function renderCategories(categoriesToRender) {
        if (!categoriesToRender || categoriesToRender.length === 0) {
            categoriesTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-5 text-gray-500">No hay categorías.</td></tr>`;
            return;
        }
        categoriesTableBody.innerHTML = '';
        categoriesToRender.forEach(category => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-800';
            tr.innerHTML = `
                <td class="py-3 px-6 text-sm font-semibold text-white">${category.nombre}</td>
                <td class="py-3 px-6 text-sm">${category.descripcion || 'Sin descripción'}</td>
                <td class="py-3 px-6 text-center">
                    <button data-id="${category.id}" data-name="${category.nombre}" data-description="${category.descripcion || ''}" class="edit-category-btn text-blue-400 hover:text-blue-300 mr-3" title="Editar Categoría"><i class="fas fa-pencil-alt"></i></button>
                    <button data-id="${category.id}" class="delete-category-btn text-red-500 hover:text-red-400" title="Eliminar Categoría"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            categoriesTableBody.appendChild(tr);
        });
    }

    async function handleCategoryFormSubmit(event) {
        event.preventDefault();
        const categoryId = categoryIdInput.value;
        const categoryName = categoryNameInput.value.trim();
        const categoryDescription = categoryDescriptionInput.value.trim();

        if (!categoryName) {
            showToast('El nombre de la categoría es obligatorio.', 'error');
            return;
        }

        const categoryData = {
            id: categoryId,
            nombre: categoryName,
            descripcion: categoryDescription
        };

        const url = categoryId ? `${BASE_URL}/updateCategoria` : `${BASE_URL}/createCategoria`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
            const result = await response.json();
            if (result.success) {
                showToast(`Categoría ${categoryId ? 'actualizada' : 'añadida'} exitosamente.`, 'success');
                prepareCategoryFormForAdd(); // Reset form for new addition
                fetchCategories(); // Refresh the list
                fetchCatalogs(); // Refresh product categories dropdown
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo conectar con el servidor para gestionar categorías.', 'error');
        }
    }

    function handleEditCategory(id, name, description) {
        categoryIdInput.value = id;
        categoryNameInput.value = name;
        categoryDescriptionInput.value = description;
        saveCategoryBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        saveCategoryBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        saveCategoryBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
        cancelCategoryEditBtn.classList.remove('hidden');
        categoryNameInput.focus();
    }

    async function handleDeleteCategory(id) {
        const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer y los productos asociados quedarán sin categoría.');
        if (!confirmed) return;

        try {
            const response = await fetch(`${BASE_URL}/deleteCategoria`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Categoría eliminada exitosamente.', 'success');
                fetchCategories(); // Refresh the list
                fetchCatalogs(); // Refresh product categories dropdown
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo eliminar la categoría.', 'error');
        }
    }

    // --- FIN: Funciones para la gestión de Categorías ---

    // --- INICIO: Funciones para la gestión de Marcas (NUEVAS) ---

    function prepareBrandFormForAdd() {
        brandForm.reset();
        brandIdInput.value = '';
        saveBrandBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Añadir Marca';
        saveBrandBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        saveBrandBtn.classList.add('bg-green-600', 'hover:bg-green-500');
        cancelBrandEditBtn.classList.add('hidden');
    }

    async function fetchBrands() {
        brandsTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-5 text-gray-500">Cargando marcas...</td></tr>`;
        try {
            const response = await fetch(`${BASE_URL}/getMarcas`);
            const result = await response.json();
            if (result.success) {
                allBrands = result.data; // Actualizar la lista global de marcas
                renderBrands(allBrands);
                populateSelect(marcaSelect, allBrands, 'Selecciona una marca'); // Actualizar el select de marcas en el modal de producto
            } else {
                brandsTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-5 text-red-500">${result.message}</td></tr>`;
            }
        } catch (error) {
            showToast('Error al cargar marcas.', 'error');
            brandsTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-5 text-red-500">No se pudo conectar con el servidor para marcas.</td></tr>`;
        }
    }

    function renderBrands(brandsToRender) {
        if (!brandsToRender || brandsToRender.length === 0) {
            brandsTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-5 text-gray-500">No hay marcas.</td></tr>`;
            return;
        }
        brandsTableBody.innerHTML = '';
        brandsToRender.forEach(brand => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-800';
            tr.innerHTML = `
                <td class="py-3 px-6 text-sm font-semibold text-white">${brand.nombre}</td>
                <td class="py-3 px-6 text-center">
                    <button data-id="${brand.id}" data-name="${brand.nombre}" class="edit-brand-btn text-blue-400 hover:text-blue-300 mr-3" title="Editar Marca"><i class="fas fa-pencil-alt"></i></button>
                    <button data-id="${brand.id}" class="delete-brand-btn text-red-500 hover:text-red-400" title="Eliminar Marca"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            brandsTableBody.appendChild(tr);
        });
    }

    async function handleBrandFormSubmit(event) {
        event.preventDefault();
        const brandId = brandIdInput.value;
        const brandName = brandNameInput.value.trim();

        if (!brandName) {
            showToast('El nombre de la marca es obligatorio.', 'error');
            return;
        }

        const brandData = {
            id: brandId,
            nombre: brandName
        };

        const url = brandId ? `${BASE_URL}/updateMarca` : `${BASE_URL}/createMarca`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brandData)
            });
            const result = await response.json();
            if (result.success) {
                showToast(`Marca ${brandId ? 'actualizada' : 'añadida'} exitosamente.`, 'success');
                prepareBrandFormForAdd(); // Reset form for new addition
                fetchBrands(); // Refresh the list
                fetchCatalogs(); // Refresh product brands dropdown
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo conectar con el servidor para gestionar marcas.', 'error');
        }
    }

    function handleEditBrand(id, name) {
        brandIdInput.value = id;
        brandNameInput.value = name;
        saveBrandBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        saveBrandBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        saveBrandBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
        cancelBrandEditBtn.classList.remove('hidden');
        brandNameInput.focus();
    }

    async function handleDeleteBrand(id) {
        const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar esta marca? Esta acción no se puede deshacer y los productos asociados quedarán sin marca.');
        if (!confirmed) return;

        try {
            const response = await fetch(`${BASE_URL}/deleteMarca`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Marca eliminada exitosamente.', 'success');
                fetchBrands(); // Refresh the list
                fetchCatalogs(); // Refresh product brands dropdown
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('No se pudo eliminar la marca.', 'error');
        }
    }

    // --- FIN: Funciones para la gestión de Marcas ---


    // --- Asignación de Eventos ---
    addProductBtn.addEventListener('click', () => prepareNewProductForm());
    closeModalBtn.addEventListener('click', () => hideModal(productModal));
    cancelBtn.addEventListener('click', () => hideModal(productModal));
    productForm.addEventListener('submit', handleFormSubmit);

    // Eventos para clonar
    toggleCloneBtn.addEventListener('click', () => cloneControls.classList.toggle('hidden'));
    loadCloneDataBtn.addEventListener('click', handleCloneProduct);

    // Eventos para ajuste de stock
    closeAdjustModalBtn.addEventListener('click', () => hideModal(adjustStockModal));
    cancelAdjustBtn.addEventListener('click', () => hideModal(adjustStockModal));
    confirmAdjustBtn.addEventListener('click', handleConfirmAdjustStock);

    // Evento para búsqueda de productos
    searchProductInput.addEventListener('keyup', filterProducts);
    searchProductInput.addEventListener('change', filterProducts);

    // Event delegation para botones de productos (editar, eliminar, ajustar stock)
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
    
    // --- Eventos para el modal de Categorías ---
    manageCategoriesBtn.addEventListener('click', () => {
        prepareCategoryFormForAdd(); // Resetear el formulario al abrir
        fetchCategories(); // Cargar las categorías al abrir el modal
        showModal(categoryModal);
    });
    closeCategoryModalBtn.addEventListener('click', () => hideModal(categoryModal));
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    cancelCategoryEditBtn.addEventListener('click', () => prepareCategoryFormForAdd()); // Cancelar edición y limpiar formulario

    // Event delegation para botones de categorías (editar, eliminar)
    categoriesTableBody.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-category-btn');
        const deleteButton = event.target.closest('.delete-category-btn');

        if (editButton) {
            handleEditCategory(editButton.dataset.id, editButton.dataset.name, editButton.dataset.description);
        }
        if (deleteButton) {
            handleDeleteCategory(deleteButton.dataset.id);
        }
    });

    // --- Eventos para el nuevo modal de Marcas (NUEVOS) ---
    manageBrandsBtn.addEventListener('click', () => {
        prepareBrandFormForAdd(); // Resetear el formulario al abrir
        fetchBrands(); // Cargar las marcas al abrir el modal
        showModal(brandModal);
    });
    closeBrandModalBtn.addEventListener('click', () => hideModal(brandModal));
    brandForm.addEventListener('submit', handleBrandFormSubmit);
    cancelBrandEditBtn.addEventListener('click', () => prepareBrandFormForAdd()); // Cancelar edición y limpiar formulario

    // Event delegation para botones de marcas (editar, eliminar)
    brandsTableBody.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-brand-btn');
        const deleteButton = event.target.closest('.delete-brand-btn');

        if (editButton) {
            handleEditBrand(editButton.dataset.id, editButton.dataset.name);
        }
        if (deleteButton) {
            handleDeleteBrand(deleteButton.dataset.id);
        }
    });


    // --- Carga Inicial ---
    fetchCatalogs(); // Ahora también carga las categorías y marcas en allCategories/allBrands
    fetchProducts();
    fetchInventoryMovements();
});
