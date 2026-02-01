/**
 * Premium Store UI Component
 * Handles store display, item browsing, cart system, and purchases
 */

import { StoreItem, StoreItemCategory, STORE_ITEMS_BY_CATEGORY, getItemById } from './storeItems';
import { CurrencyBalance, currencyManager } from './currency';

export interface CartItem {
  item: StoreItem;
  quantity: number;
}

export interface StoreUIState {
  isOpen: boolean;
  selectedCategory: StoreItemCategory | 'all' | 'sale';
  searchQuery: string;
  selectedItem: StoreItem | null;
  cart: CartItem[];
  showPaymentFlow: boolean;
}

export class StoreUI {
  private state: StoreUIState = {
    isOpen: false,
    selectedCategory: 'all',
    searchQuery: '',
    selectedItem: null,
    cart: [],
    showPaymentFlow: false
  };

  private container: HTMLElement | null = null;
  private onPurchaseCallback?: (item: StoreItem, quantity: number) => void;

  /**
   * Initialize store UI
   */
  initialize(containerId: string, onPurchase?: (item: StoreItem, quantity: number) => void): void {
    this.container = document.getElementById(containerId);
    this.onPurchaseCallback = onPurchase;
    if (!this.container) {
      console.warn(`Store container ${containerId} not found`);
    }
  }

  /**
   * Open store modal
   */
  open(): void {
    this.state.isOpen = true;
    this.render();
  }

  /**
   * Close store modal
   */
  close(): void {
    this.state.isOpen = false;
    this.state.showPaymentFlow = false;
    this.render();
  }

  /**
   * Set active category
   */
  setCategory(category: StoreItemCategory | 'all' | 'sale'): void {
    this.state.selectedCategory = category;
    this.state.selectedItem = null;
    this.render();
  }

  /**
   * Search items
   */
  search(query: string): void {
    this.state.searchQuery = query;
    this.render();
  }

  /**
   * Select item to view details
   */
  selectItem(itemId: string): void {
    const item = getItemById(itemId);
    if (item) {
      this.state.selectedItem = item;
      this.renderItemDetails();
    }
  }

  /**
   * Add item to cart
   */
  addToCart(itemId: string, quantity: number = 1): void {
    const item = getItemById(itemId);
    if (!item) return;

    const existingCartItem = this.state.cart.find(ci => ci.item.id === itemId);
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      this.state.cart.push({ item, quantity });
    }
    this.render();
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId: string): void {
    this.state.cart = this.state.cart.filter(ci => ci.item.id !== itemId);
    this.render();
  }

  /**
   * Get cart total
   */
  getCartTotal(): { coins: number; gems: number } {
    return this.state.cart.reduce(
      (total, cartItem) => ({
        coins: total.coins + ((cartItem.item.cost.coins || 0) * cartItem.quantity),
        gems: total.gems + ((cartItem.item.cost.gems || 0) * cartItem.quantity)
      }),
      { coins: 0, gems: 0 }
    );
  }

  /**
   * Proceed to checkout
   */
  checkout(): void {
    const total = this.getCartTotal();
    const balance = currencyManager.getBalance();

    // Check if player can afford items
    if (total.coins > balance.coins || total.gems > balance.gems) {
      this.showNotification('Insufficient currency for purchase');
      return;
    }

    // If gems are required, show payment flow
    if (total.gems > 0 && balance.gems < total.gems) {
      this.state.showPaymentFlow = true;
      this.renderPaymentFlow();
      return;
    }

    // Process purchase
    this.processPurchase(total);
  }

  /**
   * Process successful purchase
   */
  private processPurchase(total: { coins: number; gems: number }): void {
    // Spend currency
    if (total.coins > 0) {
      currencyManager.spendCoins(total.coins);
    }
    if (total.gems > 0) {
      currencyManager.spendGems(total.gems);
    }

    // Trigger purchase callback for each item
    this.state.cart.forEach(cartItem => {
      if (this.onPurchaseCallback) {
        this.onPurchaseCallback(cartItem.item, cartItem.quantity);
      }
    });

    this.showNotification('✅ Purchase successful!');
    this.state.cart = [];
    this.render();
  }

  /**
   * Show notification
   */
  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'store-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Get filtered items based on current state
   */
  private getFilteredItems(): StoreItem[] {
    let items: StoreItem[] = [];

    if (this.state.selectedCategory === 'all') {
      items = Object.values(STORE_ITEMS_BY_CATEGORY).flat();
    } else if (this.state.selectedCategory === 'sale') {
      items = Object.values(STORE_ITEMS_BY_CATEGORY)
        .flat()
        .filter(item => item.onSale);
    } else {
      items = STORE_ITEMS_BY_CATEGORY[this.state.selectedCategory];
    }

    // Apply search filter
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    return items;
  }

  /**
   * Render store UI
   */
  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = this.buildStoreHTML();
    this.attachEventListeners();
  }

  /**
   * Build main store HTML
   */
  private buildStoreHTML(): string {
    const balance = currencyManager.getBalance();
    const items = this.getFilteredItems();
    const cartTotal = this.getCartTotal();
    const cartCount = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);

    return `
      <div class="store-modal" ${this.state.isOpen ? '' : 'style="display: none;"'}>
        <div class="store-header">
          <h1>⭐ Premium Store</h1>
          <button class="store-close-btn" data-action="close">✕</button>
        </div>

        <div class="store-content">
          <!-- Sidebar with categories -->
          <div class="store-sidebar">
            <div class="currency-display">
              <div class="currency-item">
                <span>💰</span>
                <span class="currency-amount">${balance.coins}</span>
              </div>
              <div class="currency-item">
                <span>💎</span>
                <span class="currency-amount">${balance.gems}</span>
                <button class="buy-gems-btn" data-action="show-gem-purchase">Buy</button>
              </div>
            </div>

            <div class="store-categories">
              <button class="category-btn ${this.state.selectedCategory === 'all' ? 'active' : ''}" 
                      data-action="category" data-category="all">
                All Items
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'sale' ? 'active' : ''}" 
                      data-action="category" data-category="sale">
                🏷️ Sale Items
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'buildings' ? 'active' : ''}" 
                      data-action="category" data-category="buildings">
                🏯 Buildings
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'decorations' ? 'active' : ''}" 
                      data-action="category" data-category="decorations">
                🌸 Decorations
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'cosmetics' ? 'active' : ''}" 
                      data-action="category" data-category="cosmetics">
                🎨 Cosmetics
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'boosters' ? 'active' : ''}" 
                      data-action="category" data-category="boosters">
                ⚡ Boosters
              </button>
              <button class="category-btn ${this.state.selectedCategory === 'expansion' ? 'active' : ''}" 
                      data-action="category" data-category="expansion">
                🗺️ Expansion
              </button>
            </div>

            <div class="store-search">
              <input type="text" class="search-input" placeholder="Search items..." 
                     value="${this.state.searchQuery}" data-action="search">
            </div>
          </div>

          <!-- Main store grid -->
          <div class="store-main">
            <div class="items-grid">
              ${items.map(item => this.renderItemCard(item)).join('')}
            </div>
          </div>

          <!-- Cart panel -->
          <div class="store-cart">
            <h3>🛒 Cart (${cartCount})</h3>
            ${this.state.cart.length > 0 ? `
              <div class="cart-items">
                ${this.state.cart.map(ci => `
                  <div class="cart-item">
                    <span>${ci.item.icon} ${ci.item.name}</span>
                    <span class="cart-quantity">×${ci.quantity}</span>
                    <button class="remove-btn" data-action="remove-from-cart" data-id="${ci.item.id}">🗑️</button>
                  </div>
                `).join('')}
              </div>
              <div class="cart-total">
                ${cartTotal.coins > 0 ? `<div>💰 ${cartTotal.coins}</div>` : ''}
                ${cartTotal.gems > 0 ? `<div>💎 ${cartTotal.gems}</div>` : ''}
              </div>
              <button class="checkout-btn" data-action="checkout">Checkout</button>
            ` : `
              <p class="empty-cart">Cart is empty</p>
            `}
          </div>
        </div>

        <!-- Item details popup -->
        ${this.state.selectedItem ? this.renderItemDetailsPopup() : ''}

        <!-- Payment flow modal -->
        ${this.state.showPaymentFlow ? this.renderPaymentFlowModal() : ''}
      </div>
    `;
  }

  /**
   * Render individual item card
   */
  private renderItemCard(item: StoreItem): string {
    const rarityClass = `rarity-${item.rarity}`;
    const saleClass = item.onSale ? 'on-sale' : '';
    const originalPrice = item.cost.coins || item.cost.gems || 0;
    const discountedPrice = item.onSale && item.saleDiscount
      ? Math.floor(originalPrice * (1 - item.saleDiscount / 100))
      : originalPrice;

    return `
      <div class="store-item-card ${rarityClass} ${saleClass}" data-action="select-item" data-id="${item.id}">
        <div class="item-icon">${item.icon}</div>
        ${item.onSale ? `<div class="sale-badge">SALE -${item.saleDiscount}%</div>` : ''}
        <h3 class="item-name">${item.name}</h3>
        ${item.limited ? '<span class="limited-badge">Limited</span>' : ''}
        <div class="item-cost">
          ${item.cost.coins ? `<span>💰 ${item.cost.coins}</span>` : ''}
          ${item.cost.gems ? `<span>💎 ${item.cost.gems}</span>` : ''}
        </div>
        <button class="add-to-cart-btn" data-action="add-to-cart" data-id="${item.id}">Add to Cart</button>
      </div>
    `;
  }

  /**
   * Render item details popup
   */
  private renderItemDetailsPopup(): string {
    const item = this.state.selectedItem;
    if (!item) return '';

    return `
      <div class="item-details-popup">
        <div class="popup-content">
          <button class="popup-close" data-action="close-popup">✕</button>
          <div class="popup-icon">${item.icon}</div>
          <h2>${item.name}</h2>
          <p class="popup-description">${item.description}</p>
          
          <div class="item-stats">
            <div class="stat">
              <span class="stat-label">Rarity:</span>
              <span class="stat-value rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
            </div>
            ${item.effect ? `
              <div class="stat">
                <span class="stat-label">Effect:</span>
                <span class="stat-value">${item.effect.type}</span>
              </div>
            ` : ''}
            ${item.limited ? `
              <div class="stat limited">
                <span class="stat-label">⏰ Limited Time Offer</span>
              </div>
            ` : ''}
          </div>

          <div class="popup-cost">
            ${item.cost.coins ? `<div>💰 Costs ${item.cost.coins} coins</div>` : ''}
            ${item.cost.gems ? `<div>💎 Costs ${item.cost.gems} gems</div>` : ''}
          </div>

          <button class="add-to-cart-btn" data-action="add-to-cart" data-id="${item.id}">Add to Cart</button>
        </div>
      </div>
    `;
  }

  /**
   * Render item details in sidebar
   */
  private renderItemDetails(): void {
    if (!this.container) return;
    // Update the popup display
    this.render();
  }

  /**
   * Render payment flow modal
   */
  private renderPaymentFlowModal(): string {
    return `
      <div class="payment-modal">
        <div class="payment-content">
          <h2>Purchase Gems</h2>
          <p class="payment-message">You need more gems to complete this purchase.</p>
          
          <div class="gem-packages">
            <button class="gem-package" data-action="select-gem-package" data-package="starter-pack">
              <div class="package-gems">100</div>
              <div class="package-price">$0.99</div>
            </button>
            <button class="gem-package" data-action="select-gem-package" data-package="value-pack">
              <div class="package-gems">550</div>
              <div class="package-price">$3.99</div>
              <div class="bonus">+50</div>
            </button>
            <button class="gem-package featured" data-action="select-gem-package" data-package="best-value">
              <div class="package-gems">1,400</div>
              <div class="package-price">$7.99</div>
              <div class="bonus">+200</div>
            </button>
            <button class="gem-package" data-action="select-gem-package" data-package="mega-pack">
              <div class="package-gems">3,500</div>
              <div class="package-price">$14.99</div>
              <div class="bonus">+500</div>
            </button>
          </div>

          <div class="payment-warning">
            ⚠️ Payment setup required. Stripe integration placeholder.
          </div>

          <button class="cancel-btn" data-action="cancel-payment">Cancel</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Close button
    this.container.querySelectorAll('[data-action="close"]').forEach(el => {
      el.addEventListener('click', () => this.close());
    });

    // Category buttons
    this.container.querySelectorAll('[data-action="category"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        this.setCategory(e.target.dataset.category as StoreItemCategory);
      });
    });

    // Search
    const searchInput = this.container.querySelector('[data-action="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e: any) => {
        this.search(e.target.value);
      });
    }

    // Select item
    this.container.querySelectorAll('[data-action="select-item"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        this.selectItem(e.currentTarget.dataset.id);
      });
    });

    // Add to cart
    this.container.querySelectorAll('[data-action="add-to-cart"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.addToCart(e.currentTarget.dataset.id);
      });
    });

    // Remove from cart
    this.container.querySelectorAll('[data-action="remove-from-cart"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        this.removeFromCart(e.currentTarget.dataset.id);
      });
    });

    // Checkout
    this.container.querySelectorAll('[data-action="checkout"]').forEach(el => {
      el.addEventListener('click', () => {
        this.checkout();
      });
    });

    // Close popup
    this.container.querySelectorAll('[data-action="close-popup"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        e.stopPropagation();
        this.state.selectedItem = null;
        this.render();
      });
    });

    // Gem purchase
    this.container.querySelectorAll('[data-action="show-gem-purchase"]').forEach(el => {
      el.addEventListener('click', () => {
        this.state.showPaymentFlow = true;
        this.render();
      });
    });

    // Select gem package
    this.container.querySelectorAll('[data-action="select-gem-package"]').forEach(el => {
      el.addEventListener('click', (e: any) => {
        const packageId = e.currentTarget.dataset.package;
        const result = currencyManager.purchaseGems(packageId);
        if (result.success) {
          this.showNotification('✅ Purchase successful!');
          this.state.showPaymentFlow = false;
          this.render();
        } else {
          this.showNotification(result.message);
        }
      });
    });

    // Cancel payment
    this.container.querySelectorAll('[data-action="cancel-payment"]').forEach(el => {
      el.addEventListener('click', () => {
        this.state.showPaymentFlow = false;
        this.render();
      });
    });
  }

  /**
   * Get store state
   */
  getState(): StoreUIState {
    return { ...this.state };
  }

  /**
   * Set store state (for restoration/testing)
   */
  setState(newState: Partial<StoreUIState>): void {
    this.state = { ...this.state, ...newState };
    this.render();
  }
}

// ===== CSS STYLES =====

export const STORE_CSS = `
.store-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.store-header {
  background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #ffd700;
}

.store-header h1 {
  color: #ffd700;
  margin: 0;
  font-size: 24px;
}

.store-close-btn {
  background: none;
  border: none;
  color: #ffd700;
  font-size: 24px;
  cursor: pointer;
}

.store-content {
  display: grid;
  grid-template-columns: 200px 1fr 250px;
  gap: 20px;
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.store-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.currency-display {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.currency-amount {
  flex: 1;
}

.buy-gems-btn {
  padding: 4px 8px;
  background: #ffd700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
}

.store-categories {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-btn {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.category-btn:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
}

.category-btn.active {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
  font-weight: bold;
}

.store-search {
  margin-top: auto;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #ffd700;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Main grid */
.store-main {
  overflow-y: auto;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.store-item-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.store-item-card:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: #ffd700;
  transform: translateY(-2px);
}

.item-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.item-name {
  color: #fff;
  font-size: 12px;
  margin: 0 0 8px;
  flex: 1;
}

.item-cost {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #ffd700;
  margin-bottom: 8px;
}

.add-to-cart-btn {
  padding: 6px 8px;
  background: #ffd700;
  border: none;
  border-radius: 4px;
  color: #000;
  cursor: pointer;
  font-weight: bold;
  font-size: 11px;
}

.sale-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff4444;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}

.limited-badge {
  background: #ff00ff;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}

.on-sale .store-item-card {
  border-color: #ff4444;
}

/* Rarity colors */
.rarity-common {
  border-color: rgba(200, 200, 200, 0.3);
}

.rarity-uncommon {
  border-color: rgba(0, 200, 0, 0.3);
}

.rarity-rare {
  border-color: rgba(0, 0, 255, 0.3);
}

.rarity-legendary {
  border-color: rgba(255, 215, 0, 0.5);
  background: rgba(255, 215, 0, 0.05);
}

/* Cart panel */
.store-cart {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.store-cart h3 {
  color: #ffd700;
  margin: 0;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 12px;
  background: rgba(255, 215, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
}

.cart-quantity {
  margin-left: auto;
  color: #ffd700;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 14px;
}

.cart-total {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #ffd700;
  border-radius: 4px;
  padding: 8px;
  color: #fff;
  text-align: center;
  font-weight: bold;
}

.empty-cart {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin: auto;
}

.checkout-btn {
  padding: 10px;
  background: #ffd700;
  border: none;
  border-radius: 4px;
  color: #000;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}

/* Item details popup */
.item-details-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.popup-content {
  background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  position: relative;
  color: #fff;
}

.popup-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #ffd700;
  font-size: 24px;
  cursor: pointer;
}

.popup-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 12px;
}

.popup-content h2 {
  margin: 0 0 12px;
  color: #ffd700;
}

.popup-description {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.8);
}

.item-stats {
  background: rgba(255, 215, 0, 0.1);
  border-left: 3px solid #ffd700;
  padding: 12px;
  margin: 12px 0;
  border-radius: 4px;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  color: #ffd700;
  font-weight: bold;
}

.popup-cost {
  background: rgba(0, 200, 0, 0.1);
  border: 1px solid rgba(0, 200, 0, 0.3);
  padding: 12px;
  border-radius: 4px;
  margin: 12px 0;
}

.popup-cost div {
  color: #fff;
  margin-bottom: 4px;
}

/* Payment modal */
.payment-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.payment-content {
  background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  color: #fff;
  text-align: center;
}

.payment-content h2 {
  color: #ffd700;
  margin: 0 0 12px;
}

.payment-message {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

.gem-packages {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.gem-package {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.gem-package:hover {
  background: rgba(255, 215, 0, 0.2);
}

.gem-package.featured {
  border-color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.package-gems {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.package-price {
  color: #fff;
  font-size: 16px;
  margin-bottom: 4px;
}

.bonus {
  color: #00ff00;
  font-size: 12px;
  font-weight: bold;
}

.payment-warning {
  background: rgba(255, 200, 0, 0.2);
  border: 1px solid #ffd700;
  border-radius: 6px;
  padding: 12px;
  margin: 16px 0;
  color: #ffd700;
  font-size: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
}

.store-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 12px 20px;
  color: #fff;
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .store-content {
    grid-template-columns: 1fr;
  }

  .store-cart {
    display: none;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
`;

// Singleton instance
export const storeUI = new StoreUI();
