class VendingMachine {
    constructor() {
        this.denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1]; // Denominations in rupees
        this.products = [
            { id: 1, name: "Water Bottle", price: 20 },
            { id: 2, name: "Soda Can", price: 50 },
            { id: 3, name: "Chocolate Bar", price: 30 },
            { id: 4, name: "Chips Pack", price: 40 },
            { id: 5, name: "Sandwich", price: 100 },
            { id: 6, name: "Juice Box", price: 60 },
            { id: 7, name: "Energy Drink", price: 120 },
            { id: 8, name: "Fruit Snack", price: 25 },
            { id: 9, name: "Gum Pack", price: 15 },
            { id: 10, name: "Cookie Pack", price: 35 }
        ];
        this.selectedProducts = []; // Changed to array for multiple selections
        this.balance = 0;
    }

    restockProduct(newProduct) {
        const isOccupied = this.products.find(product => product.id === newProduct.id);
        if (isOccupied) {
            return {
                success: false,
                message: "Product ID already exists. Please use a different ID."
            }
        }
        this.products.push(newProduct);
        return {
            success: true,
            message: "Product restocked successfully."
        };
    };

    selectProduct(productId) {
        const product = this.products.find(prod => prod.id === productId);
        if (!product) {
            return {
                success: false,
                message: "Product not found."
            };
        }
        // Check if product is already selected
        const alreadySelected = this.selectedProducts.find(p => p.id === productId);
        if (alreadySelected) {
            return {
                success: false,
                message: "Product already in cart."
            };
        }
        this.selectedProducts.push(product);
        return {
            success: true,
            product: `Added to cart: ${product.name}, Price: ₹${product.price}`,
            selectedProducts: this.selectedProducts
        };
    }

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
            selectedProducts: this.selectedProducts
        };
    }

    clearCart() {
        this.selectedProducts = [];
        return {
            success: true,
            message: "Cart cleared."
        };
    }

    getTotalPrice() {
        return this.selectedProducts.reduce((total, product) => total + product.price, 0);
    }
    insertMoney(amount) {
        if (this.selectedProducts.length === 0) {
            return {
                success: false,
                message: "No products in cart."
            };
        }
        const totalPrice = this.getTotalPrice();
        if (amount < totalPrice) {
            return {
                success: false,
                message: `Insufficient amount. Please insert at least ₹${totalPrice}.`
            };
        }
        if (!Number.isInteger(amount) || amount <= 0) {
            return {
                success: false,
                message: "Please insert a valid amount."
            };
        }
        this.balance += amount;
        const changeAmount = this.balance - totalPrice;
        const changeDenoms = this.calculateChange(changeAmount);

        // Dispense all selected products
        const dispensedProducts = [...this.selectedProducts];
        this.selectedProducts.forEach(product => {
            this.dispenseProduct(product);
        });

        this.selectedProducts = []; // Clear cart after transaction
        this.balance = 0; // Reset balance after transaction
        return {
            success: true,
            message: `Transaction successful. Dispensed ${dispensedProducts.length} item(s).`,
            change: changeDenoms,
            changeAmount: changeAmount,
            dispensedProducts: dispensedProducts
        };
    }
    calculateChange(change) {
        const changeDenoms = {}; // To store the count of each denomination

        // Calculate change using the largest denominations first
        for (const denom of this.denoms) {
            while (change >= denom) {
                if (!changeDenoms[denom]) {
                    changeDenoms[denom] = 0;
                }
                changeDenoms[denom] += 1;
                change -= denom;
            }
        }
        return changeDenoms;
    }
    dispenseProduct(product) {
        this.products = this.products.filter(prod => prod.id !== product.id);
        return {
            success: true,
            message: `Dispensed: ${product.name}`
        };
    }

}

const vendingMachine = new VendingMachine();
