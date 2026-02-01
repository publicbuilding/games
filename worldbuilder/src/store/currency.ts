/**
 * Currency System - Coins (earned) and Gems (premium)
 */

export interface CurrencyBalance {
  coins: number;
  gems: number;
}

export interface GemPackage {
  id: string;
  gems: number;
  price: number; // USD
  bonus: number; // Extra gems as bonus
  featured: boolean;
  label: string;
}

// Gem packages available for purchase
export const GEM_PACKAGES: GemPackage[] = [
  {
    id: 'starter-pack',
    gems: 100,
    price: 0.99,
    bonus: 0,
    featured: false,
    label: '100 Gems'
  },
  {
    id: 'value-pack',
    gems: 500,
    price: 3.99,
    bonus: 50,
    featured: false,
    label: '550 Gems'
  },
  {
    id: 'best-value',
    gems: 1200,
    price: 7.99,
    bonus: 200,
    featured: true,
    label: '1,400 Gems'
  },
  {
    id: 'mega-pack',
    gems: 3000,
    price: 14.99,
    bonus: 500,
    featured: true,
    label: '3,500 Gems'
  }
];

export class CurrencyManager {
  private balance: CurrencyBalance = {
    coins: 1000, // Starting coins
    gems: 0
  };

  /**
   * Add coins (earned through gameplay)
   */
  addCoins(amount: number): void {
    this.balance.coins = Math.max(0, this.balance.coins + amount);
  }

  /**
   * Spend coins
   */
  spendCoins(amount: number): boolean {
    if (this.balance.coins >= amount) {
      this.balance.coins -= amount;
      return true;
    }
    return false;
  }

  /**
   * Add gems (from purchase or bonus)
   */
  addGems(amount: number): void {
    this.balance.gems = Math.max(0, this.balance.gems + amount);
  }

  /**
   * Spend gems
   */
  spendGems(amount: number): boolean {
    if (this.balance.gems >= amount) {
      this.balance.gems -= amount;
      return true;
    }
    return false;
  }

  /**
   * Get current balance
   */
  getBalance(): CurrencyBalance {
    return { ...this.balance };
  }

  /**
   * Set balance (for testing/restoration)
   */
  setBalance(balance: CurrencyBalance): void {
    this.balance = { ...balance };
  }

  /**
   * Check if player can afford an item
   */
  canAfford(cost: { coins?: number; gems?: number }): boolean {
    if (cost.coins && this.balance.coins < cost.coins) return false;
    if (cost.gems && this.balance.gems < cost.gems) return false;
    return true;
  }

  /**
   * Process gem purchase
   * REQUIRES: Stripe publishable key from PB
   */
  purchaseGems(packageId: string): { success: boolean; message: string } {
    // Placeholder for Stripe integration
    const pkg = GEM_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Package not found' };
    }

    // TODO: Implement Stripe payment flow
    // Check if Stripe is configured
    const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      return { 
        success: false, 
        message: 'Payment setup required. Please configure Stripe.' 
      };
    }

    // Placeholder: In production, would redirect to Stripe Checkout
    console.log(`[PAYMENT PLACEHOLDER] User selected: ${pkg.gems} gems for $${pkg.price}`);
    
    return { 
      success: false, 
      message: 'Payment gateway not yet implemented. This is a placeholder.' 
    };
  }

  /**
   * Simulate gem purchase for testing (dev only)
   */
  debugAddGems(packageId: string): void {
    const pkg = GEM_PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      this.addGems(pkg.gems + pkg.bonus);
      console.log(`[DEV] Added ${pkg.gems + pkg.bonus} gems from package: ${packageId}`);
    }
  }
}

// Singleton instance
export const currencyManager = new CurrencyManager();
