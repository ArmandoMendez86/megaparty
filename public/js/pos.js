// Archivo: /public/js/pos.js

document.addEventListener("DOMContentLoaded", function () {
  // --- Referencias a elementos del DOM ---
  const productListContainer = document.getElementById("product-list");
  const cartItemsContainer = document.getElementById("cart-items");
  const subtotalElem = document.getElementById("cart-subtotal");
  const taxElem = document.getElementById("cart-tax");
  const totalElem = document.getElementById("cart-total");
  const searchProductInput = document.getElementById("search-product");
  const chargeBtn = document.getElementById("charge-btn");
  const cancelSaleBtn = document.getElementById("cancel-sale-btn");
  const saveSaleBtn = document.getElementById("save-sale-btn");

  const chargeModal = document.getElementById("charge-modal");
  const modalTotalElem = document.getElementById("modal-total");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");

  const priceTypeSelector = document.getElementById("price-type-selector");
  const priceTypeValueInput = document.getElementById("price-type-value");

  const addressContainer = document.getElementById(
    "address-selection-container"
  );
  const addressSelect = document.getElementById("client-address-select");
  const openPendingSalesBtn = document.getElementById("open-pending-sales-btn");
  const pendingSalesModal = document.getElementById("pending-sales-modal");
  const closePendingSalesModalBtn = document.getElementById(
    "close-pending-sales-modal-btn"
  );
  const pendingSalesTableBody = document.getElementById(
    "pending-sales-table-body"
  );
  const searchPendingSaleInput = document.getElementById("search-pending-sale");

  const searchCartInput = document.getElementById("search-cart-item");
  const toggleIvaCheckbox = document.getElementById("toggle-iva");

  const searchClientSelect = $("#search-client");

  const paymentMethodsContainer = document.getElementById(
    "payment-methods-container"
  );
  const addPaymentMethodBtn = document.getElementById("add-payment-method-btn");
  const modalAmountPaidElem = document.getElementById("modal-amount-paid");
  const modalChangeElem = document.getElementById("modal-change");
  const modalPendingElem = document.getElementById("modal-pending");
  const modalChangeRow = document.getElementById("modal-change-row");
  const modalPendingRow = document.getElementById("modal-pending-row");

  const addClientModal = document.getElementById("add-client-modal");
  const addNewClientBtn = document.getElementById("add-new-client-btn");
  const closeAddClientModalBtn = document.getElementById(
    "close-add-client-modal-btn"
  );
  const addClientForm = document.getElementById("add-client-form");
  const cancelAddClientBtn = document.getElementById("cancel-add-client-btn");
  const clientHasCreditCheckbox = document.getElementById("client-has-credit");
  const creditLimitContainer = document.getElementById(
    "credit-limit-container"
  );

  // --- INICIO: Referencias para el nuevo modal de consulta de stock ---
  const stockCheckerModal = document.getElementById("stock-checker-modal");
  const openStockCheckerBtn = document.getElementById("open-stock-checker-btn");
  const closeStockCheckerModalBtn = document.getElementById(
    "close-stock-checker-modal-btn"
  );
  const stockCheckerSearchInput = document.getElementById(
    "stock-checker-search-input"
  );
  const stockCheckerResultsContainer = document.getElementById(
    "stock-checker-results"
  );
  let stockSearchTimer;
  // --- FIN: Referencias para el nuevo modal ---

  if (typeof connectQz === "function") {
    connectQz();
  }

  // --- Estado de la aplicación ---
  let allProducts = [];
  let cart = [];
  let selectedClient = {
    id: 1,
    nombre: "Público en General",
    tiene_credito: 0,
    limite_credito: 0.0,
    deuda_actual: 0.0,
  };
  let currentSaleId = null;
  let configuredPrinter = null;
  let applyIVA = false;
  let allPendingSales = [];
  let paymentInputs = [];

  // --- Lógica de la API ---
  async function fetchProducts() {
    try {
      const response = await fetch(`${BASE_URL}/getProducts`);
      const result = await response.json();
      if (result.success) {
        allProducts = result.data;
        renderProducts(allProducts.filter((p) => (p.stock || 0) > 0));
      } else {
        productListContainer.innerHTML = `<p class="text-red-500">Error al cargar productos.</p>`;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      productListContainer.innerHTML = `<p class="text-red-500">No se pudo conectar para cargar productos.</p>`;
    }
  }

  async function fetchPrinterConfig() {
    try {
      const response = await fetch(`${BASE_URL}/getPrinterConfig`);
      const result = await response.json();
      if (result.success && result.data.impresora_tickets) {
        configuredPrinter = result.data.impresora_tickets;
        console.log(`Impresora de tickets lista: ${configuredPrinter}`);
      } else {
        console.warn(
          "No hay una impresora de tickets configurada en el sistema."
        );
      }
    } catch (error) {
      console.error(
        "No se pudo cargar la configuración de la impresora al iniciar el TPV.",
        error
      );
    }
  }

  // --- Lógica de Renderizado ---
  function renderProducts(products) {
    productListContainer.innerHTML = "";
    if (products.length === 0) {
      productListContainer.innerHTML = `<p class="text-gray-500">No se encontraron productos.</p>`;
      return;
    }
    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.productId = product.id;

      const imageUrl = `https://placehold.co/100x100/334155/E2E8F0?text=${encodeURIComponent(
        product.nombre.substring(0, 8)
      )}`;

      productCard.innerHTML = `
          <img src="${imageUrl}" alt="${
        product.nombre
      }" class="product-card-image">
          <div class="flex-1 flex flex-col justify-between">
            <div class="font-bold text-white text-sm mb-1 truncate">${
              product.nombre
            }</div>
            <div class="text-xs text-gray-400 mb-2">Stock: ${
              product.stock || 0
            }</div>
            <div class="text-lg font-mono text-green-400">$${parseFloat(
              product.precio_menudeo
            ).toFixed(2)}</div>
          </div>
      `;
      productCard.addEventListener("click", () => addProductToCart(product.id));
      productListContainer.appendChild(productCard);
    });
  }

  function renderCart() {
    cartItemsContainer.innerHTML = "";
    const searchTerm = searchCartInput.value.toLowerCase();

    const filteredCart = cart.filter(
      (item) =>
        item.nombre.toLowerCase().includes(searchTerm) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
        (item.codigo_barras &&
          item.codigo_barras.toLowerCase().includes(searchTerm))
    );

    if (filteredCart.length === 0) {
      cartItemsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">El carrito está vacío</div>`;
    } else {
      filteredCart.forEach((item) => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const imageUrl = `https://placehold.co/50x50/334155/E2E8F0?text=${encodeURIComponent(
          item.nombre.substring(0, 5)
        )}`;

        let priceTypeLabel = "";
        if (item.tipo_precio_aplicado === "Especial") {
          priceTypeLabel =
            '<span class="text-xxs text-yellow-400">Especial</span> ';
        } else if (item.tipo_precio_aplicado === "Guardado") {
          priceTypeLabel =
            '<span class="text-xxs text-yellow-400">Guardado</span> ';
        } else if (item.tipo_precio_aplicado === "Mayoreo") {
          priceTypeLabel =
            '<span class="text-xxs text-blue-400">Mayoreo</span> ';
        } else if (item.tipo_precio_aplicado === "Menudeo") {
          priceTypeLabel =
            '<span class="text-xxs text-green-400">Menudeo</span> ';
        }

        cartItem.innerHTML = `
            <img src="${imageUrl}" alt="${item.nombre}" class="cart-item-image">
            <div class="flex-1">
                <p class="text-sm font-semibold text-white truncate">${
                  item.nombre
                }</p>
                <p class="text-xs text-gray-400">
                    ${priceTypeLabel}
                    <span class="editable-price" data-id="${
                      item.id
                    }" data-price="${item.precio_final}">
                        $${parseFloat(item.precio_final).toFixed(2)}
                    </span>
                </p>
            </div>
            <div class="flex items-center ml-2">
                <div class="quantity-controls">
                    <button data-id="${
                      item.id
                    }" class="quantity-change" data-action="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button data-id="${
                      item.id
                    }" class="quantity-change" data-action="increase">+</button>
                </div>
                <div class="text-right font-mono text-base ml-2">$${(
                  item.quantity * item.precio_final
                ).toFixed(2)}</div>
                <button data-id="${
                  item.id
                }" class="remove-item-btn text-red-400 hover:text-red-300 p-1 ml-1 rounded-full">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
      });
    }
    updateTotals();
    toggleSaveButton();
    addPriceEditListeners();
  }

  // --- INICIO: Lógica para el modal de consulta de stock ---
  function openStockCheckerModal() {
    stockCheckerModal.classList.remove("hidden");
    stockCheckerSearchInput.focus();
  }

  function closeStockCheckerModal() {
    stockCheckerModal.classList.add("hidden");
    stockCheckerSearchInput.value = "";
    stockCheckerResultsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Introduce un término de búsqueda para ver el stock.</div>`;
  }

  async function searchStockAcrossBranches() {
    const searchTerm = stockCheckerSearchInput.value.trim();

    if (searchTerm.length < 3) {
      stockCheckerResultsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Introduce al menos 3 caracteres para buscar.</div>`;
      return;
    }

    stockCheckerResultsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Buscando...</div>`;

    try {
      const response = await fetch(
        `${BASE_URL}/getStockAcrossBranches?term=${encodeURIComponent(
          searchTerm
        )}`
      );
      const result = await response.json();

      if (result.success) {
        renderStockResults(result.data);
      } else {
        stockCheckerResultsContainer.innerHTML = `<div class="text-center text-red-500 py-10">${result.message}</div>`;
      }
    } catch (error) {
      console.error("Error al buscar stock:", error);
      stockCheckerResultsContainer.innerHTML = `<div class="text-center text-red-500 py-10">Error de conexión.</div>`;
    }
  }

  function renderStockResults(products) {
    if (products.length === 0) {
      stockCheckerResultsContainer.innerHTML = `<div class="text-center text-gray-500 py-10">No se encontraron productos que coincidan con la búsqueda.</div>`;
      return;
    }

    let html = "";
    products.forEach((product) => {
      html += `
        <div class="product-stock-card">
          <h3 class="text-lg font-bold text-white">${product.producto_nombre}</h3>
          <p class="text-sm text-gray-400 mb-3">SKU: ${product.sku}</p>
          <ul class="space-y-2">
      `;
      product.sucursales.forEach((sucursal) => {
        const stockClass =
          sucursal.stock > 0 ? "text-green-400" : "text-red-400";
        const stockText =
          sucursal.stock > 0 ? `${sucursal.stock} en stock` : "Agotado";
        html += `
          <li class="flex justify-between items-center text-sm">
            <span><i class="fas fa-store mr-2 text-gray-500"></i>${sucursal.nombre}</span>
            <span class="font-semibold ${stockClass}">${stockText}</span>
          </li>
        `;
      });
      html += `
          </ul>
        </div>
      `;
    });
    stockCheckerResultsContainer.innerHTML = html;
  }

  // --- FIN: Lógica para el modal de consulta de stock ---

  function updateTotals() {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.quantity * item.precio_final,
      0
    );
    let tax = 0;
    if (applyIVA) {
      tax = subtotal * 0.16;
    }
    const total = subtotal + tax;

    subtotalElem.textContent = `$${total.toFixed(2)}`;
    taxElem.textContent = `$${tax.toFixed(2)}`;
    totalElem.textContent = `$${total.toFixed(2)}`;
  }

  function addPriceEditListeners() {
    document.querySelectorAll(".editable-price").forEach((priceSpan) => {
      if (priceSpan.dataset.hasListener === "true") {
        return;
      }
      priceSpan.dataset.hasListener = "true";

      priceSpan.addEventListener("click", function () {
        const currentPrice = parseFloat(this.dataset.price);
        const productId = this.dataset.id;
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.value = currentPrice.toFixed(2);
        input.className =
          "w-24 bg-gray-600 text-white rounded text-center text-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-400";
        input.dataset.id = productId;

        this.replaceWith(input);
        input.focus();

        let savingPrice = false;

        const saveNewPrice = async () => {
          if (savingPrice) return;
          savingPrice = true;

          let newPrice = parseFloat(input.value);
          if (isNaN(newPrice) || newPrice <= 0) {
            showToast("El precio debe ser un número positivo.", "error");
            newPrice = currentPrice;
          }

          const cartItem = cart.find((item) => item.id == productId);
          if (cartItem) {
            cartItem.precio_final = newPrice;
            cartItem.tipo_precio_aplicado = "Especial";

            if (selectedClient.id !== 1) {
              try {
                const response = await fetch(
                  `${BASE_URL}/saveSpecialClientPrice`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id_cliente: selectedClient.id,
                      id_producto: productId,
                      precio_especial: newPrice,
                    }),
                  }
                );
                const result = await response.json();
                if (result.success) {
                  showToast(
                    "Precio especial guardado para " + selectedClient.nombre,
                    "success"
                  );
                } else {
                  showToast(
                    "Error al guardar precio especial: " + result.message,
                    "error"
                  );
                }
              } catch (error) {
                console.error("Error al guardar precio especial:", error);
                showToast(
                  "Error de conexión al guardar precio especial.",
                  "error"
                );
              }
            }
          }
          renderCart();
          savingPrice = false;
        };

        input.addEventListener("blur", saveNewPrice);
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            saveNewPrice();
          }
        });
      });
    });
  }

  function populateAddresses(addresses) {
    addressSelect.innerHTML = "";
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr) => {
        const option = document.createElement("option");
        option.value = addr.id;
        option.textContent = addr.direccion;
        if (addr.principal == 1) {
          option.selected = true;
        }
        addressSelect.appendChild(option);
      });
      addressContainer.classList.remove("hidden");
    } else {
      addressContainer.classList.add("hidden");
    }
  }

  // --- Lógica del Carrito y Venta ---

  async function addProductToCart(productId) {
    const cartItem = cart.find((item) => item.id == productId);
    if (cartItem) {
      const productInfo = allProducts.find((p) => p.id == productId);
      if (productInfo && cartItem.quantity < productInfo.stock) {
        cartItem.quantity++;
        renderCart();
      } else if (productInfo) {
        showToast("Stock máximo alcanzado en el carrito.", "error");
      }
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/getProductForPOS?id_producto=${productId}&id_cliente=${selectedClient.id}`
      );
      const result = await response.json();
      if (result.success) {
        const product = result.data;
        if ((product.stock || 0) <= 0) {
          showToast("Producto sin stock.", "error");
          return;
        }

        const useWholesalePrice = priceTypeValueInput.value === "mayoreo";

        if (product.tipo_precio_aplicado !== "Especial") {
          product.precio_final = useWholesalePrice
            ? product.precio_mayoreo
            : product.precio_menudeo;
          product.tipo_precio_aplicado = useWholesalePrice
            ? "Mayoreo"
            : "Menudeo";
        }

        cart.push({ ...product, quantity: 1, id: product.id });
        renderCart();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión al añadir el producto.", "error");
    }
  }

  function handleQuantityChange(event) {
    const button = event.target.closest(".quantity-change");
    if (!button) return;
    const productId = button.dataset.id;
    const action = button.dataset.action;
    const cartItem = cart.find((item) => item.id == productId);
    if (!cartItem) return;

    if (action === "increase") {
      const product = allProducts.find((p) => p.id == productId);
      if (product && cartItem.quantity < product.stock) {
        cartItem.quantity++;
      } else if (product) {
        showToast("Stock máximo alcanzado en el carrito.", "error");
      } else {
        showToast(
          "Error: Información de producto no disponible para validar stock.",
          "error"
        );
      }
    } else if (action === "decrease") {
      cartItem.quantity--;
      if (cartItem.quantity === 0)
        cart = cart.filter((item) => item.id != productId);
    }
    renderCart();
  }

  function removeProductFromCart(productId) {
    cart = cart.filter((item) => item.id != productId);
    renderCart();
    showToast("Producto eliminado del carrito.", "info");
  }

  async function selectClient(client, confirmAction = true) {
    if (confirmAction && cart.length > 0) {
      const confirmed = await showConfirm(
        "Al cambiar de cliente, el carrito se vaciará para recalcular los precios. ¿Desea continuar?"
      );
      if (!confirmed) {
        searchClientSelect.val(selectedClient.id).trigger("change");
        return;
      }
    }

    try {
      const response = await fetch(`${BASE_URL}/getClient?id=${client.id}`);
      const result = await response.json();
      if (result.success) {
        selectedClient = result.data;
        if (confirmAction) {
          cart = [];
          renderCart();
        }
        populateAddresses(selectedClient.direcciones || []);
      } else {
        showToast("No se pudieron obtener los detalles del cliente.", "error");
      }
    } catch (error) {
      showToast("Error de conexión al obtener datos del cliente.", "error");
    }
  }

  function handlePriceTypeChange() {
    const useWholesalePrice = priceTypeValueInput.value === "mayoreo";
    if (cart.length === 0) return;
    cart.forEach((item) => {
      if (
        item.tipo_precio_aplicado !== "Especial" &&
        item.tipo_precio_aplicado !== "Guardado"
      ) {
        item.precio_final = useWholesalePrice
          ? item.precio_mayoreo
          : item.precio_menudeo;
        item.tipo_precio_aplicado = useWholesalePrice ? "Mayoreo" : "Menudeo";
      }
    });
    renderCart();
  }

  function resetSale() {
    cart = [];
    selectedClient = {
      id: 1,
      nombre: "Público en General",
      tiene_credito: 0,
      limite_credito: 0.0,
      deuda_actual: 0.0,
    };
    populateAddresses([]);
    renderCart();
    searchClientSelect.val("1").trigger("change");
    searchProductInput.value = "";
    currentSaleId = null;
    searchCartInput.value = "";
    toggleIvaCheckbox.checked = false;
    applyIVA = false;

    if (priceTypeSelector) {
      priceTypeSelector
        .querySelector(".price-type-btn.active-price-type")
        ?.classList.remove("active-price-type");
      priceTypeSelector
        .querySelector('button[data-price-type="menudeo"]')
        ?.classList.add("active-price-type");
    }
    if (priceTypeValueInput) {
      priceTypeValueInput.value = "menudeo";
    }
  }

  async function cancelSale() {
    if (cart.length > 0) {
      const confirmed = await showConfirm(
        "¿Desea cancelar la venta? Se limpiará el carrito."
      );
      if (confirmed) resetSale();
    }
  }

  function addPaymentMethodInput(method = "Efectivo", amount = 0) {
    const paymentMethodDiv = document.createElement("div");
    paymentMethodDiv.className =
      "flex items-center space-x-2 mb-2 payment-input-row";

    const paymentMethods = ["Efectivo", "Tarjeta", "Transferencia", "Crédito"];
    const optionsHtml = paymentMethods
      .map(
        (m) =>
          `<option value="${m}" ${m === method ? "selected" : ""}>${m}</option>`
      )
      .join("");

    paymentMethodDiv.innerHTML = `
        <select class="payment-method-select w-1/2 bg-gray-700 text-white rounded-md p-2 border border-gray-600">
            ${optionsHtml}
        </select>
        <input type="number" step="0.01" value="${amount.toFixed(
          2
        )}" placeholder="Monto"
               class="payment-amount-input w-1/2 bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-[#4f46e5] focus:border-[#4f46e5]" />
        <button class="remove-payment-method-btn text-red-400 hover:text-red-300 p-2">
            <i class="fas fa-times"></i>
        </button>
    `;
    paymentMethodsContainer.appendChild(paymentMethodDiv);

    const amountInput = paymentMethodDiv.querySelector(".payment-amount-input");
    const methodSelect = paymentMethodDiv.querySelector(
      ".payment-method-select"
    );

    amountInput.addEventListener("input", updatePaymentTotals);
    methodSelect.addEventListener("change", () => {
      if (methodSelect.value === "Crédito") {
        const totalToPay = parseFloat(totalElem.textContent.replace("$", ""));
        const currentNonCreditPaid = getCurrentNonCreditPaidAmount(amountInput);
        const remainingToPay = totalToPay - currentNonCreditPaid;

        if (selectedClient.id === 1) {
          showToast(
            "El crédito no se aplica al cliente 'Público en General'. Por favor, selecciona otro método de pago o un cliente registrado.",
            "error"
          );
          amountInput.value = (0).toFixed(2);
          methodSelect.value = "Efectivo";
        } else if (selectedClient.tiene_credito === 0) {
          showToast(
            `El cliente '${selectedClient.nombre}' no tiene una línea de crédito activada.`,
            "error"
          );
          amountInput.value = (0).toFixed(2);
          methodSelect.value = "Efectivo";
        } else {
          const availableCredit =
            selectedClient.limite_credito - selectedClient.deuda_actual;
          if (availableCredit <= 0) {
            showToast(
              `El cliente '${
                selectedClient.nombre
              }' no tiene crédito disponible. Deuda actual: $${selectedClient.deuda_actual.toFixed(
                2
              )} / Límite: $${selectedClient.limite_credito.toFixed(2)}`,
              "error"
            );
            amountInput.value = (0).toFixed(2);
            methodSelect.value = "Efectivo";
          } else {
            amountInput.value = Math.min(
              remainingToPay,
              availableCredit
            ).toFixed(2);
          }
        }
      } else {
        const hasCreditPaymentAlready = Array.from(
          document.querySelectorAll(".payment-method-select")
        ).some(
          (select) => select.value === "Crédito" && select !== methodSelect
        );

        if (paymentInputs.length === 1 || !hasCreditPaymentAlready) {
          const totalToPay = parseFloat(totalElem.textContent.replace("$", ""));
          const currentNonCreditPaid =
            getCurrentNonCreditPaidAmount(amountInput);
          amountInput.value = (totalToPay - currentNonCreditPaid).toFixed(2);
        }
      }
      updatePaymentTotals();
    });

    paymentMethodDiv
      .querySelector(".remove-payment-method-btn")
      .addEventListener("click", () => {
        paymentMethodDiv.remove();
        updatePaymentTotals();
      });
    paymentInputs.push(amountInput);
    updatePaymentTotals();
  }

  function getCurrentNonCreditPaidAmount(excludeInput = null) {
    let currentNonCreditPaid = 0;
    document.querySelectorAll(".payment-input-row").forEach((row) => {
      const amountInput = row.querySelector(".payment-amount-input");
      const methodSelect = row.querySelector(".payment-method-select");
      if (methodSelect.value !== "Crédito" && amountInput !== excludeInput) {
        currentNonCreditPaid += parseFloat(amountInput.value) || 0;
      }
    });
    return currentNonCreditPaid;
  }

  function updatePaymentTotals() {
    let totalPaid = 0;
    let creditAmount = 0;
    let hasCreditPayment = false;
    let creditExceeded = false;
    let creditNotAllowed = false;

    paymentInputs = [];
    document.querySelectorAll(".payment-input-row").forEach((row) => {
      const amountInput = row.querySelector(".payment-amount-input");
      const methodSelect = row.querySelector(".payment-method-select");
      const amount = parseFloat(amountInput.value) || 0;

      totalPaid += amount;
      paymentInputs.push(amountInput);

      if (methodSelect.value === "Crédito") {
        hasCreditPayment = true;
        creditAmount += amount;
        if (selectedClient.id === 1) {
          creditNotAllowed = true;
        } else if (selectedClient.tiene_credito === 0) {
          creditNotAllowed = true;
        } else {
          const availableCredit =
            selectedClient.limite_credito - selectedClient.deuda_actual;
          if (creditAmount > availableCredit) {
            creditExceeded = true;
          }
        }
      }
    });

    const totalToPay = parseFloat(totalElem.textContent.replace("$", ""));
    const change = totalPaid - totalToPay;
    const pending = totalToPay - totalPaid;

    modalAmountPaidElem.textContent = `$${totalPaid.toFixed(2)}`;

    if (change >= 0) {
      modalChangeElem.textContent = `$${change.toFixed(2)}`;
      modalChangeRow.classList.remove("hidden");
      modalPendingRow.classList.add("hidden");
    } else {
      modalPendingElem.textContent = `$${Math.abs(pending).toFixed(2)}`;
      modalChangeRow.classList.add("hidden");
      modalPendingRow.classList.remove("hidden");
    }

    modalConfirmBtn.disabled =
      totalPaid < totalToPay || creditExceeded || creditNotAllowed;

    if (modalConfirmBtn.disabled && hasCreditPayment) {
      if (creditNotAllowed) {
        if (selectedClient.id === 1) {
          showToast(
            "El crédito no se aplica al cliente 'Público en General'.",
            "error"
          );
        } else {
          showToast(
            `El cliente '${selectedClient.nombre}' no tiene una línea de crédito activada.`,
            "error"
          );
        }
      } else if (creditExceeded) {
        const availableCredit =
          selectedClient.limite_credito - selectedClient.deuda_actual;
        showToast(
          `Crédito insuficiente para '${
            selectedClient.nombre
          }'. Disponible: $${Math.max(0, availableCredit).toFixed(2)}`,
          "error"
        );
      }
    }
  }

  function showChargeModal() {
    if (cart.length === 0) {
      showToast("El carrito está vacío.", "error");
      return;
    }
    modalTotalElem.textContent = totalElem.textContent;

    paymentMethodsContainer.innerHTML = "";
    paymentInputs = [];
    addPaymentMethodInput(
      "Efectivo",
      parseFloat(totalElem.textContent.replace("$", ""))
    );
    updatePaymentTotals();

    chargeModal.classList.remove("hidden");
  }

  function hideChargeModal() {
    chargeModal.classList.add("hidden");
  }

  async function processSale() {
    const payments = [];
    document.querySelectorAll(".payment-input-row").forEach((row) => {
      const method = row.querySelector(".payment-method-select").value;
      const amount =
        parseFloat(row.querySelector(".payment-amount-input").value) || 0;
      if (amount > 0) {
        payments.push({ method: method, amount: amount });
      }
    });

    if (payments.length === 0) {
      showToast("Debe añadir al menos un método de pago.", "error");
      return;
    }

    let creditPaymentAmount = 0;
    for (const p of payments) {
      if (p.method === "Crédito") {
        creditPaymentAmount += p.amount;
      }
    }

    if (creditPaymentAmount > 0) {
      if (selectedClient.id === 1) {
        showToast(
          "Error: El crédito no se aplica al cliente 'Público en General'. Por favor, selecciona otro método de pago o un cliente registrado.",
          "error"
        );
        return;
      }
      if (selectedClient.tiene_credito === 0) {
        showToast(
          `Error: El cliente '${selectedClient.nombre}' no tiene una línea de crédito activada.`,
          "error"
        );
        return;
      }
      const availableCredit =
        selectedClient.limite_credito - selectedClient.deuda_actual;
      if (creditPaymentAmount > availableCredit) {
        showToast(
          `Error: El monto de crédito excede el disponible para '${
            selectedClient.nombre
          }'. Disponible: $${availableCredit.toFixed(2)}`,
          "error"
        );
        return;
      }
    }

    const saleData = {
      id_cliente: selectedClient.id,
      id_direccion_envio: addressSelect.value || null,
      cart: cart,
      total: parseFloat(totalElem.textContent.replace("$", "")),
      payments: payments,
      estado: "Completada",
      iva_aplicado: applyIVA ? 1 : 0,
    };

    if (currentSaleId) {
      saleData.id_venta = currentSaleId;
    }

    try {
      const response = await fetch(`${BASE_URL}/processSale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });
      const result = await response.json();
      if (result.success) {
        showToast(
          currentSaleId
            ? "Venta completada exitosamente."
            : "Venta registrada exitosamente.",
          "success"
        );
        if (result.id_venta) {
          await triggerPrint(result.id_venta);
        }
        resetSale();
        fetchProducts();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión al procesar la venta.", "error");
    } finally {
      hideChargeModal();
    }
  }

  async function handleSaveSale() {
    if (cart.length === 0 || !selectedClient || selectedClient.id === 1) {
      showToast(
        "Debe seleccionar un cliente y tener productos en el carrito para guardar la venta.",
        "error"
      );
      return;
    }

    const saleData = {
      id_cliente: selectedClient.id,
      id_direccion_envio: addressSelect.value || null,
      cart: cart,
      total: parseFloat(totalElem.textContent.replace("$", "")),
      estado: "Pendiente",
      iva_aplicado: applyIVA ? 1 : 0,
      payments: [],
    };

    if (currentSaleId) {
      saleData.id_venta = currentSaleId;
    }

    try {
      const response = await fetch(`${BASE_URL}/saveSale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });
      const result = await response.json();
      if (result.success) {
        showToast(
          currentSaleId
            ? "Venta actualizada exitosamente."
            : "Venta guardada exitosamente.",
          "success"
        );
        resetSale();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión al guardar la venta.", "error");
    }
  }

  function toggleSaveButton() {
    saveSaleBtn.disabled = !(
      selectedClient &&
      selectedClient.id !== 1 &&
      cart.length > 0
    );
  }

  async function triggerPrint(saleId) {
    if (typeof qz === "undefined" || !qz.websocket.isActive()) {
      showToast(
        "QZ Tray no está conectado. No se puede imprimir el ticket.",
        "warning"
      );
      return;
    }

    if (!configuredPrinter) {
      showToast(
        "Impresora no configurada. Vaya a Ajustes > Impresoras para seleccionar una.",
        "error"
      );
      return;
    }

    showToast(`Preparando ticket #${saleId} para impresión...`, "info");

    try {
      const response = await fetch(`${BASE_URL}/getTicketDetails?id=${saleId}`);
      const result = await response.json();

      if (result.success) {
        await printTicket(configuredPrinter, result.data);
      } else {
        showToast(
          `Error al obtener datos del ticket: ${result.message}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error al disparar la impresión:", error);
      showToast("Error de conexión al intentar imprimir el ticket.", "error");
    }
  }

  function filterProducts() {
    const query = searchProductInput.value.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        (p.stock || 0) > 0 &&
        (p.nombre.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(query)))
    );
    renderProducts(filtered);
  }

  async function handleBarcodeScan(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = searchProductInput.value.trim();
    if (code === "") return;

    const product = allProducts.find(
      (p) => p.codigo_barras === code || p.sku === code
    );
    if (product) {
      addProductToCart(product.id);
      searchProductInput.value = "";
      filterProducts();
    } else {
      showToast("Producto no encontrado.", "error");
    }
  }

  // --- Logic for Pending Sales Modal ---

  async function openPendingSalesModal() {
    pendingSalesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Cargando...</td></tr>`;
    pendingSalesModal.classList.remove("hidden");
    try {
      const response = await fetch(`${BASE_URL}/listPendingSales`);
      const result = await response.json();
      if (result.success) {
        allPendingSales = result.data;
        filterAndRenderPendingSales();
      } else {
        pendingSalesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">${result.message}</td></tr>`;
      }
    } catch (error) {
      pendingSalesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Error de conexión.</td></tr>`;
    }
  }

  function closePendingSalesModal() {
    pendingSalesModal.classList.add("hidden");
    searchPendingSaleInput.value = "";
  }

  function filterAndRenderPendingSales() {
    const searchTerm = searchPendingSaleInput.value.toLowerCase();
    const filteredSales = allPendingSales.filter(
      (sale) =>
        sale.id.toString().includes(searchTerm) ||
        sale.cliente_nombre.toLowerCase().includes(searchTerm)
    );
    renderPendingSales(filteredSales);
  }

  function renderPendingSales(sales) {
    if (!sales || sales.length === 0) {
      pendingSalesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">No hay ventas guardadas que coincidan con la búsqueda.</td></tr>`;
      return;
    }
    pendingSalesTableBody.innerHTML = "";
    sales.forEach((sale) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-800";
      const formattedDate = new Date(sale.fecha).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
      });
      tr.innerHTML = `
                <td class="py-2 px-4 text-sm font-semibold">#${sale.id}</td>
                <td class="py-2 px-4 text-sm">${formattedDate}</td>
                <td class="py-2 px-4 text-sm">${sale.cliente_nombre}</td>
                <td class="py-2 px-4 text-right text-sm font-mono">$${parseFloat(
                  sale.total
                ).toFixed(2)}</td>
                <td class="py-2 px-4 text-center">
                    <div class="action-buttons-container">
                        <button data-id="${
                          sale.id
                        }" class="load-sale-btn" title="Cargar Venta">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <a href="${BASE_URL}/generateQuote?id=${
        sale.id
      }" target="_blank" class="pdf-sale-btn" title="Ver Cotización PDF">
                            <i class="fas fa-file-pdf"></i>
                        </a>
                        <button data-id="${
                          sale.id
                        }" class="delete-sale-btn" title="Eliminar Venta">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
      pendingSalesTableBody.appendChild(tr);
    });
  }

  async function loadSale(saleId) {
    closePendingSalesModal();
    if (cart.length > 0) {
      const confirmed = await showConfirm(
        "Se limpiará el carrito actual para cargar la venta pendiente. ¿Desea continuar?"
      );
      if (!confirmed) return;
    }
    try {
      const response = await fetch(`${BASE_URL}/loadSale?id=${saleId}`);
      const result = await response.json();
      if (result.success) {
        loadSaleIntoPOS(result.data);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión al cargar la venta.", "error");
    }
  }

  async function loadSaleIntoPOS(saleData) {
    currentSaleId = saleData.header.id;

    await selectClient(
      {
        id: saleData.header.id_cliente,
        nombre: saleData.header.cliente_nombre,
      },
      false
    );

    const clientOption = new Option(
      selectedClient.nombre,
      selectedClient.id,
      true,
      true
    );
    searchClientSelect.append(clientOption).trigger("change");

    if (saleData.header.id_direccion_envio) {
      addressSelect.value = saleData.header.id_direccion_envio;
    }

    applyIVA = saleData.header.iva_aplicado == 1;
    toggleIvaCheckbox.checked = applyIVA;

    cart = saleData.items.map((item) => ({
      id: item.id_producto,
      nombre: item.nombre,
      quantity: parseInt(item.cantidad),
      precio_final: parseFloat(item.precio_unitario),
      precio_menudeo: item.precio_menudeo,
      precio_mayoreo: item.precio_mayoreo,
      tipo_precio_aplicado: "Guardado",
      sku: item.sku || null,
      codigo_barras: item.codigo_barras || null,
    }));

    renderCart();
    showToast(`Venta #${currentSaleId} cargada en el POS.`, "info");
  }

  async function handleDeletePendingSale(saleId) {
    const confirmed = await showConfirm(
      "¿Estás seguro de que quieres eliminar esta venta pendiente? Esta acción es irreversible."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${BASE_URL}/deletePendingSale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_venta: saleId }),
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
        openPendingSalesModal();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión al eliminar la venta.", "error");
    }
  }

  // --- Lógica para Añadir Nuevo Cliente ---
  function showAddClientModal() {
    addClientModal.classList.remove("hidden");
    addClientForm.reset();
    creditLimitContainer.classList.add("hidden");
  }

  function hideAddClientModal() {
    addClientModal.classList.add("hidden");
  }

  async function handleAddNewClient(event) {
    event.preventDefault();

    const formData = new FormData(addClientForm);
    const clientData = {};
    for (const [key, value] of formData.entries()) {
      clientData[key] = value;
    }

    clientData.tiene_credito = clientHasCreditCheckbox.checked ? 1 : 0;
    clientData.limite_credito = parseFloat(clientData.limite_credito) || 0.0;

    try {
      const response = await fetch(`${BASE_URL}/createClient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      const result = await response.json();

      if (result.success) {
        showToast("Cliente añadido exitosamente.", "success");
        hideAddClientModal();
        const newClient = {
          id: result.id,
          text: clientData.nombre,
          original: {
            id: result.id,
            nombre: clientData.nombre,
            tiene_credito: clientData.tiene_credito,
            limite_credito: clientData.limite_credito,
            deuda_actual: 0.0,
          },
        };

        const option = new Option(newClient.text, newClient.id, true, true);
        searchClientSelect.append(option).trigger("change");

        searchClientSelect.trigger({
          type: "select2:select",
          params: {
            data: newClient,
          },
        });
      } else {
        showToast(`Error al añadir cliente: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error al añadir cliente:", error);
      showToast("Error de conexión al añadir el cliente.", "error");
    }
  }

  clientHasCreditCheckbox.addEventListener("change", function () {
    if (this.checked) {
      creditLimitContainer.classList.remove("hidden");
    } else {
      creditLimitContainer.classList.add("hidden");
    }
  });

  // --- Asignación de Eventos ---
  searchProductInput.addEventListener("input", filterProducts);
  searchProductInput.addEventListener("keydown", handleBarcodeScan);

  cartItemsContainer.addEventListener("click", function (event) {
    const quantityButton = event.target.closest(".quantity-change");
    const removeButton = event.target.closest(".remove-item-btn");

    if (quantityButton) {
      handleQuantityChange(event);
    } else if (removeButton) {
      removeProductFromCart(removeButton.dataset.id);
    }
  });

  cancelSaleBtn.addEventListener("click", cancelSale);
  chargeBtn.addEventListener("click", showChargeModal);
  saveSaleBtn.addEventListener("click", handleSaveSale);
  modalCancelBtn.addEventListener("click", hideChargeModal);
  modalConfirmBtn.addEventListener("click", processSale);

  if (priceTypeSelector) {
    priceTypeSelector.addEventListener("click", (e) => {
      const targetButton = e.target.closest(".price-type-btn");
      if (!targetButton || targetButton.classList.contains("active-price-type"))
        return;

      priceTypeSelector.querySelectorAll(".price-type-btn").forEach((btn) => {
        btn.classList.remove("active-price-type");
      });

      targetButton.classList.add("active-price-type");

      const newPriceType = targetButton.dataset.priceType;
      if (priceTypeValueInput.value !== newPriceType) {
        priceTypeValueInput.value = newPriceType;
        priceTypeValueInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    });
  }

  if (priceTypeValueInput) {
    priceTypeValueInput.addEventListener("change", handlePriceTypeChange);
  }

  openPendingSalesBtn.addEventListener("click", openPendingSalesModal);
  closePendingSalesModalBtn.addEventListener("click", closePendingSalesModal);

  searchCartInput.addEventListener("input", renderCart);
  searchPendingSaleInput.addEventListener("input", filterAndRenderPendingSales);

  addPaymentMethodBtn.addEventListener("click", () => addPaymentMethodInput());

  toggleIvaCheckbox.addEventListener("change", () => {
    applyIVA = toggleIvaCheckbox.checked;
    updateTotals();
  });

  pendingSalesTableBody.addEventListener("click", function (event) {
    const loadButton = event.target.closest(".load-sale-btn");
    const deleteButton = event.target.closest(".delete-sale-btn");

    if (loadButton) {
      loadSale(loadButton.dataset.id);
    } else if (deleteButton) {
      handleDeletePendingSale(deleteButton.dataset.id);
    }
  });

  addNewClientBtn.addEventListener("click", showAddClientModal);
  closeAddClientModalBtn.addEventListener("click", hideAddClientModal);
  cancelAddClientBtn.addEventListener("click", hideAddClientModal);
  addClientForm.addEventListener("submit", handleAddNewClient);

  // --- INICIO: Event listeners para el modal de consulta de stock ---
  openStockCheckerBtn.addEventListener("click", openStockCheckerModal);
  closeStockCheckerModalBtn.addEventListener("click", closeStockCheckerModal);

  stockCheckerSearchInput.addEventListener("keyup", () => {
    clearTimeout(stockSearchTimer);
    stockSearchTimer = setTimeout(searchStockAcrossBranches, 300); // Debounce de 300ms
  });
  // --- FIN: Event listeners para el modal ---

  // --- Inicialización de Select2 para el cliente ---
  searchClientSelect.select2({
    width: "100%", // <-- CAMBIO: Asegura que el control ocupe todo el ancho disponible.
    placeholder: "Buscar cliente por nombre, RFC o teléfono...",
    minimumInputLength: 2,
    language: {
      inputTooShort: function () {
        return "Por favor, introduce 2 o más caracteres para buscar.";
      },
      noResults: function () {
        return "No se encontraron resultados.";
      },
      searching: function () {
        return "Buscando...";
      },
    },
    ajax: {
      url: `${BASE_URL}/searchClients`,
      dataType: "json",
      delay: 250,
      data: function (params) {
        return {
          term: params.term,
        };
      },
      processResults: function (data) {
        return {
          results: data.results.map((client) => ({
            id: client.id,
            text: client.text,
            original: client,
          })),
        };
      },
      cache: true,
    },
    templateSelection: function (data) {
      if (data.id === "1" && data.text === "Público en General") {
        return data.text;
      }
      return data.original ? data.original.nombre : data.text;
    },
    templateResult: function (data) {
      if (data.loading) return data.text;
      return $(`<div>${data.text}</div>`);
    },
  });

  searchClientSelect.on("select2:select", function (e) {
    const selectedData = e.params.data;
    const clientToSelect = selectedData.original || {
      id: selectedData.id,
      nombre: selectedData.text,
    };
    selectClient(clientToSelect);
  });

  // --- Carga Inicial ---
  fetchProducts();
  fetchPrinterConfig();
  toggleSaveButton();
});
