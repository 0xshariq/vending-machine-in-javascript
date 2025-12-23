// Constants
const CURRENCY_SYMBOL = '₹';
const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const LOW_STOCK_THRESHOLD = 3;
const INITIAL_PRODUCTS = [
    { id: 1, name: "Water Bottle", price: 20, quantity: 10 },
    { id: 2, name: "Soda Can", price: 50, quantity: 8 },
    { id: 3, name: "Chocolate Bar", price: 30, quantity: 15 },
    { id: 4, name: "Chips Pack", price: 40, quantity: 12 },
    { id: 5, name: "Sandwich", price: 100, quantity: 5 },
    { id: 6, name: "Juice Box", price: 60, quantity: 7 },
    { id: 7, name: "Energy Drink", price: 120, quantity: 6 },
    { id: 8, name: "Fruit Snack", price: 25, quantity: 20 },
    { id: 9, name: "Gum Pack", price: 15, quantity: 25 },
    { id: 10, name: "Cookie Pack", price: 35, quantity: 10 }
];

/**
 * VendingMachine class manages product selection, cart, and transactions
 */
class VendingMachine {
    constructor() {
        this.denoms = [...DENOMINATIONS];
        this.products = [...INITIAL_PRODUCTS];
        this.selectedProducts = [];
        this.balance = 0;
    }

    /**
     * Adds a new product or restocks existing product
     * @param {Object} newProduct - Product to add/restock
     * @returns {Object} Result object with success status and message
     */
    restockProduct(newProduct) {
        // Validate product object
        if (!newProduct || typeof newProduct !== 'object') {
            return {
                success: false,
                message: "Invalid product data."
            };
        }

        // Validate required fields
        if (!newProduct.id || !newProduct.name || !newProduct.price) {
            return {
                success: false,
                message: "Product must have id, name, and price."
            };
        }

        // Validate price is positive
        if (newProduct.price <= 0) {
            return {
                success: false,
                message: "Price must be greater than zero."
            };
        }

        // Set default quantity if not provided
        const quantity = newProduct.quantity || 1;
        if (quantity <= 0) {
            return {
                success: false,
                message: "Quantity must be greater than zero."
            };
        }

        // Check if product already exists
        const existingProduct = this.products.find(product => product.id === newProduct.id);
        if (existingProduct) {
            // Restock existing product
            existingProduct.quantity += quantity;
            return {
                success: true,
                message: `Restocked ${newProduct.name}. New quantity: ${existingProduct.quantity}`
            };
        }

        // Add new product
        this.products.push({ ...newProduct, quantity });
        return {
            success: true,
            message: "Product added successfully."
        };
    }

    /**
     * Adds a product to the shopping cart
     * @param {number} productId - ID of product to select
     * @returns {Object} Result with success status and message
     */
    selectProduct(productId) {
        const product = this.products.find(prod => prod.id === productId);
        if (!product) {
            return {
                success: false,
                message: "Product not found."
            };
        }

        // Check if product is in stock
        if (product.quantity <= 0) {
            return {
                success: false,
                message: "Product out of stock."
            };
        }

        // Check if product is already in cart
        if (this.selectedProducts.some(p => p.id === productId)) {
            return {
                success: false,
                message: "Product already in cart."
            };
        }

        this.selectedProducts.push(product);
        return {
            success: true,
            product: `Added to cart: ${product.name}, Price: ${CURRENCY_SYMBOL}${product.price}`,
            selectedProducts: [...this.selectedProducts]
        };
    }

    /**
     * Removes a product from the shopping cart
     * @param {number} productId - ID of product to remove
     * @returns {Object} Result with success status and message
     */
    removeFromCart(productId) {
        const index = this.selectedProducts.findIndex(p => p.id === productId);
        if (index === -1) {
            return {
                success: false,
                message: "Product not in cart."
            };
        }
        const removed = this.selectedProducts.splice(index, 1)[0];
        return {
            success: true,
            message: `Removed from cart: ${removed.name}`,
            selectedProducts: [...this.selectedProducts]
        };
    }

    /**
     * Clears all products from the shopping cart
     * @returns {Object} Result with success status
     */
    clearCart() {
        this.selectedProducts = [];
        return {
            success: true,
            message: "Cart cleared."
        };
    }

    /**
     * Calculates the total price of all products in cart
     * @returns {number} Total price
     */
    getTotalPrice() {
        return this.selectedProducts.reduce((total, product) => total + product.price, 0);
    }
    /**
     * Processes payment and dispenses products
     * @param {number} amount - Amount of money inserted
     * @returns {Object} Transaction result with change and dispensed products
     */
    insertMoney(amount) {
        // Validate cart is not empty
        if (this.selectedProducts.length === 0) {
            return {
                success: false,
                message: "No products in cart."
            };
        }

        // Validate amount
        if (!Number.isInteger(amount) || amount <= 0) {
            return {
                success: false,
                message: "Please insert a valid amount."
            };
        }

        const totalPrice = this.getTotalPrice();
        if (amount < totalPrice) {
            return {
                success: false,
                message: `Insufficient amount. Please insert at least ${CURRENCY_SYMBOL}${totalPrice}.`
            };
        }

        this.balance += amount;
        const changeAmount = this.balance - totalPrice;
        const changeDenoms = this.calculateChange(changeAmount);

        // Dispense all selected products
        const dispensedProducts = [...this.selectedProducts];
        dispensedProducts.forEach(product => {
            this.dispenseProduct(product);
        });

        // Reset after successful transaction
        this.selectedProducts = [];
        this.balance = 0;

        return {
            success: true,
            message: `Transaction successful. Dispensed ${dispensedProducts.length} item(s).`,
            change: changeDenoms,
            changeAmount: changeAmount,
            dispensedProducts: dispensedProducts
        };
    }
    /**
     * Calculates change breakdown using greedy algorithm
     * @param {number} change - Amount of change to return
     * @returns {Object} Object with denomination counts
     */
    calculateChange(change) {
        const changeDenoms = {};
        let remainingChange = change;

        // Use greedy algorithm: start with largest denominations
        for (const denom of this.denoms) {
            if (remainingChange >= denom) {
                const count = Math.floor(remainingChange / denom);
                changeDenoms[denom] = count;
                remainingChange -= denom * count;
            }
        }

        return changeDenoms;
    }
    /**
     * Dispenses a product (decreases quantity or removes from inventory)
     * @param {Object} product - Product to dispense
     * @returns {Object} Result with success status
     */
    dispenseProduct(product) {
        const inventoryProduct = this.products.find(prod => prod.id === product.id);
        if (inventoryProduct) {
            inventoryProduct.quantity--;
            // Only remove from products if quantity reaches 0
            if (inventoryProduct.quantity <= 0) {
                this.products = this.products.filter(prod => prod.id !== product.id);
            }
        }
        return {
            success: true,
            message: `Dispensed: ${product.name}`
        };
    }
}

// Initialize vending machine instance
const vendingMachine = new VendingMachine();

/**
 * Renders all available products in the grid
 */
function renderProducts() {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return;

    productsGrid.innerHTML = "";

    vendingMachine.products.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        
        // Add stock status classes
        if (product.quantity === 0) {
            productCard.classList.add("out-of-stock");
        } else if (product.quantity <= LOW_STOCK_THRESHOLD) {
            productCard.classList.add("low-stock");
        }
        
        productCard.onclick = () => selectProduct(product.id);
        productCard.setAttribute('role', 'button');
        productCard.setAttribute('tabindex', '0');

        // Create stock badge
        let stockBadge = '';
        if (product.quantity === 0) {
            stockBadge = '<div class="stock-badge out">OUT OF STOCK</div>';
        } else if (product.quantity <= LOW_STOCK_THRESHOLD) {
            stockBadge = `<div class="stock-badge low">Only ${product.quantity} left!</div>`;
        } else {
            stockBadge = `<div class="stock-badge">In Stock: ${product.quantity}</div>`;
        }

        productCard.innerHTML = `
            ${stockBadge}
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-price">${CURRENCY_SYMBOL}${product.price}</div>
            <div class="product-id">ID: ${product.id}</div>
        `;

        productsGrid.appendChild(productCard);
    });
}

/**
 * Handles product selection from UI
 * @param {number} productId - ID of selected product
 */
function selectProduct(productId) {
    const result = vendingMachine.selectProduct(productId);
    const statusMessage = document.getElementById("statusMessage");

    if (!statusMessage) return;

    if (result.success) {
        statusMessage.textContent = result.product;
        statusMessage.className = "status-success";
        updateCart();
        updateProductCards();
    } else {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-error";
    }
}

/**
 * Removes a product from cart via UI
 * @param {number} productId - ID of product to remove
 */
function removeFromCart(productId) {
    const result = vendingMachine.removeFromCart(productId);
    const statusMessage = document.getElementById("statusMessage");

    if (!statusMessage) return;

    if (result.success) {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-success";
        updateCart();
        updateProductCards();
    } else {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-error";
    }
}

/**
 * Clears all items from cart via UI
 */
function clearCart() {
    vendingMachine.clearCart();
    updateCart();
    updateProductCards();
    const statusMessage = document.getElementById("statusMessage");
    if (statusMessage) {
        statusMessage.textContent = "Cart cleared";
        statusMessage.className = "status-success";
    }
}

/**
 * Updates the shopping cart display
 */
function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    const totalAmount = document.getElementById("totalAmount");
    const clearCartBtn = document.getElementById("clearCartBtn");

    if (!cartItems || !cartCount) return;

    if (vendingMachine.selectedProducts.length === 0) {
        cartItems.innerHTML = '<span class="no-selection">Cart is empty</span>';
        if (cartTotal) cartTotal.style.display = "none";
        if (clearCartBtn) clearCartBtn.style.display = "none";
        cartCount.textContent = "0";
    } else {
        const cartHTML = vendingMachine.selectedProducts.map(product => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${escapeHtml(product.name)}</span>
                    <span class="cart-item-price">${CURRENCY_SYMBOL}${product.price}</span>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${product.id})" aria-label="Remove ${escapeHtml(product.name)}">✕</button>
            </div>
        `).join('');

        cartItems.innerHTML = cartHTML;
        const total = vendingMachine.getTotalPrice();
        if (totalAmount) totalAmount.textContent = `${CURRENCY_SYMBOL}${total}`;
        if (cartTotal) cartTotal.style.display = "flex";
        if (clearCartBtn) clearCartBtn.style.display = "inline-block";
        cartCount.textContent = vendingMachine.selectedProducts.length;
    }
}

/**
 * Updates visual state of product cards based on cart contents
 */
function updateProductCards() {
    document.querySelectorAll(".product-card").forEach((card, index) => {
        const product = vendingMachine.products[index];
        if (!product) return;

        const isInCart = vendingMachine.selectedProducts.some(
            (p) => p.id === product.id
        );
        card.classList.toggle("in-cart", isInCart);
    });
}

/**
 * Processes money insertion and completes transaction
 */
function insertMoney() {
    const amountInput = document.getElementById("amountInput");
    const statusMessage = document.getElementById("statusMessage");
    const changeDisplay = document.getElementById("changeDisplay");
    const changeDetails = document.getElementById("changeDetails");

    if (!amountInput || !statusMessage) return;

    const amount = parseInt(amountInput.value);

    if (!amount || amount <= 0) {
        statusMessage.textContent = "Please enter a valid amount";
        statusMessage.className = "status-error";
        return;
    }

    const result = vendingMachine.insertMoney(amount);

    if (result.success) {
        statusMessage.textContent = `${result.message} Change: ${CURRENCY_SYMBOL}${result.changeAmount}`;
        statusMessage.className = "status-success";

        // Display change breakdown
        if (changeDisplay && changeDetails && Object.keys(result.change).length > 0) {
            const changeHTML = '<div class="change-breakdown">' +
                Object.entries(result.change)
                    .map(([denom, count]) => `<div class="change-item">${CURRENCY_SYMBOL}${denom} × ${count}</div>`)
                    .join('') +
                '</div>';
            changeDetails.innerHTML = changeHTML;
            changeDisplay.style.display = "block";

            setTimeout(() => {
                changeDisplay.style.display = "none";
            }, 5000);
        } else if (changeDisplay) {
            changeDisplay.style.display = "none";
        }

        // Reset UI
        amountInput.value = "";
        updateCart();
        updateProductCards();
        renderProducts();

        setTimeout(() => {
            statusMessage.textContent = "Welcome! Select products to start";
            statusMessage.className = "";
        }, 5000);
    } else {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-error";
    }
}

/**
 * Handles product restocking from UI
 */
function restockProduct() {
    const restockIdInput = document.getElementById("restockId");
    const restockNameInput = document.getElementById("restockName");
    const restockPriceInput = document.getElementById("restockPrice");
    const restockQuantityInput = document.getElementById("restockQuantity");
    const statusMessage = document.getElementById("statusMessage");

    if (!restockIdInput || !restockNameInput || !restockPriceInput || !statusMessage) return;

    const id = parseInt(restockIdInput.value);
    const name = restockNameInput.value.trim();
    const price = parseInt(restockPriceInput.value);
    const quantity = restockQuantityInput ? parseInt(restockQuantityInput.value) || 1 : 1;

    // Validate inputs
    if (!id || !name || !price) {
        statusMessage.textContent = "Please fill all required fields";
        statusMessage.className = "status-error";
        return;
    }

    if (price <= 0) {
        statusMessage.textContent = "Price must be greater than zero";
        statusMessage.className = "status-error";
        return;
    }

    if (quantity <= 0) {
        statusMessage.textContent = "Quantity must be greater than zero";
        statusMessage.className = "status-error";
        return;
    }

    const result = vendingMachine.restockProduct({ id, name, price, quantity });

    if (result.success) {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-success";
        renderProducts();
        updateProductCards();

        // Clear form
        restockIdInput.value = "";
        restockNameInput.value = "";
        restockPriceInput.value = "";
        if (restockQuantityInput) restockQuantityInput.value = "";
    } else {
        statusMessage.textContent = result.message;
        statusMessage.className = "status-error";
    }
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initializes event listeners when DOM is ready
 */
function initializeEventListeners() {
    const insertBtn = document.getElementById("insertBtn");
    const restockBtn = document.getElementById("restockBtn");
    const clearCartBtn = document.getElementById("clearCartBtn");
    const amountInput = document.getElementById("amountInput");

    if (insertBtn) insertBtn.addEventListener("click", insertMoney);
    if (restockBtn) restockBtn.addEventListener("click", restockProduct);
    if (clearCartBtn) clearCartBtn.addEventListener("click", clearCart);
    if (amountInput) {
        amountInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") insertMoney();
        });
    }
}

// Initialize application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        renderProducts();
        updateCart();
    });
} else {
    initializeEventListeners();
    renderProducts();
    updateCart();
}