/**
 * Freemium UI components - tournament teaser and chip purchase mockup
 */

export interface FreemiumOverlayConfig {
  container: HTMLElement;
  onClose?: () => void;
  onPurchase?: (amount: number, price: string) => void;
}

export class FreemiumUI {
  private container: HTMLElement;
  private overlay: HTMLDivElement | null = null;
  private onClose?: () => void;
  private onPurchase?: (amount: number, price: string) => void;
  
  constructor(config: FreemiumOverlayConfig) {
    this.container = config.container;
    this.onClose = config.onClose;
    this.onPurchase = config.onPurchase;
  }
  
  showTournamentTeaser(): void {
    this.removeOverlay();
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'freemium-overlay';
    this.overlay.innerHTML = `
      <div class="freemium-modal tournament-teaser">
        <button class="close-btn">&times;</button>
        <div class="tournament-header">
          <span class="crown">👑</span>
          <h2>TOURNAMENT MODE</h2>
          <span class="badge">COMING SOON</span>
        </div>
        <div class="tournament-content">
          <div class="feature-list">
            <div class="feature">
              <span class="icon">🏆</span>
              <div>
                <strong>Daily Tournaments</strong>
                <p>Compete against players worldwide</p>
              </div>
            </div>
            <div class="feature">
              <span class="icon">💎</span>
              <div>
                <strong>Exclusive Rewards</strong>
                <p>Win rare chips and badges</p>
              </div>
            </div>
            <div class="feature">
              <span class="icon">📊</span>
              <div>
                <strong>Leaderboards</strong>
                <p>Climb the global rankings</p>
              </div>
            </div>
            <div class="feature">
              <span class="icon">🎯</span>
              <div>
                <strong>Sit-N-Go</strong>
                <p>Quick tournament action</p>
              </div>
            </div>
          </div>
          <div class="notify-section">
            <p>Be the first to know when tournaments launch!</p>
            <input type="email" placeholder="Enter your email" class="email-input">
            <button class="notify-btn">Notify Me</button>
          </div>
        </div>
      </div>
    `;
    
    this.addStyles();
    this.container.appendChild(this.overlay);
    
    // Event listeners
    this.overlay.querySelector('.close-btn')?.addEventListener('click', () => this.close());
    this.overlay.querySelector('.notify-btn')?.addEventListener('click', () => {
      const input = this.overlay?.querySelector('.email-input') as HTMLInputElement;
      if (input?.value) {
        alert('Thanks! You\'ll be notified when tournaments launch.');
        this.close();
      }
    });
    
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }
  
  showChipPurchase(): void {
    this.removeOverlay();
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'freemium-overlay';
    this.overlay.innerHTML = `
      <div class="freemium-modal chip-store">
        <button class="close-btn">&times;</button>
        <div class="store-header">
          <span class="chips-icon">💰</span>
          <h2>CHIP STORE</h2>
        </div>
        <div class="chip-packages">
          <div class="chip-package" data-chips="10000" data-price="$0.99">
            <div class="chip-amount">
              <span class="chips">🪙</span>
              <span class="amount">10,000</span>
            </div>
            <div class="chip-price">$0.99</div>
            <div class="chip-bonus"></div>
          </div>
          <div class="chip-package popular" data-chips="50000" data-price="$2.99">
            <div class="popular-badge">POPULAR</div>
            <div class="chip-amount">
              <span class="chips">🪙🪙</span>
              <span class="amount">50,000</span>
            </div>
            <div class="chip-price">$2.99</div>
            <div class="chip-bonus">+10% Bonus</div>
          </div>
          <div class="chip-package" data-chips="150000" data-price="$6.99">
            <div class="chip-amount">
              <span class="chips">🪙🪙🪙</span>
              <span class="amount">150,000</span>
            </div>
            <div class="chip-price">$6.99</div>
            <div class="chip-bonus">+25% Bonus</div>
          </div>
          <div class="chip-package best-value" data-chips="500000" data-price="$19.99">
            <div class="popular-badge">BEST VALUE</div>
            <div class="chip-amount">
              <span class="chips">💎</span>
              <span class="amount">500,000</span>
            </div>
            <div class="chip-price">$19.99</div>
            <div class="chip-bonus">+50% Bonus!</div>
          </div>
        </div>
        <div class="store-footer">
          <p class="disclaimer">This is a demo. No real purchases will be made.</p>
          <button class="free-chips-btn">🎁 Claim Free Daily Chips</button>
        </div>
      </div>
    `;
    
    this.addStyles();
    this.container.appendChild(this.overlay);
    
    // Event listeners
    this.overlay.querySelector('.close-btn')?.addEventListener('click', () => this.close());
    
    this.overlay.querySelectorAll('.chip-package').forEach(pkg => {
      pkg.addEventListener('click', () => {
        const chips = parseInt(pkg.getAttribute('data-chips') || '0');
        const price = pkg.getAttribute('data-price') || '';
        this.handlePurchase(chips, price);
      });
    });
    
    this.overlay.querySelector('.free-chips-btn')?.addEventListener('click', () => {
      alert('🎁 You claimed 1,000 free chips! Come back tomorrow for more.');
      this.close();
    });
    
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }
  
  private handlePurchase(chips: number, price: string): void {
    if (this.onPurchase) {
      this.onPurchase(chips, price);
    } else {
      alert(`Demo: Would purchase ${chips.toLocaleString()} chips for ${price}`);
    }
    this.close();
  }
  
  private close(): void {
    this.removeOverlay();
    if (this.onClose) this.onClose();
  }
  
  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
  
  private addStyles(): void {
    if (document.getElementById('freemium-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'freemium-styles';
    style.textContent = `
      .freemium-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .freemium-modal {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 16px;
        padding: 30px;
        max-width: 450px;
        width: 90%;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.2);
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .close-btn {
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        color: #888;
        font-size: 28px;
        cursor: pointer;
        transition: color 0.2s;
      }
      
      .close-btn:hover {
        color: #fff;
      }
      
      .tournament-header, .store-header {
        text-align: center;
        margin-bottom: 25px;
      }
      
      .tournament-header h2, .store-header h2 {
        color: #ffd700;
        margin: 10px 0;
        font-size: 24px;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }
      
      .crown, .chips-icon {
        font-size: 40px;
      }
      
      .badge {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        color: white;
      }
      
      .feature-list {
        margin-bottom: 25px;
      }
      
      .feature {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        margin-bottom: 10px;
      }
      
      .feature .icon {
        font-size: 28px;
      }
      
      .feature strong {
        color: #fff;
        display: block;
      }
      
      .feature p {
        color: #888;
        font-size: 13px;
        margin: 3px 0 0;
      }
      
      .notify-section {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .notify-section p {
        color: #888;
        margin-bottom: 15px;
      }
      
      .email-input {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        color: #fff;
        font-size: 14px;
        margin-bottom: 10px;
      }
      
      .email-input:focus {
        outline: none;
        border-color: #ffd700;
      }
      
      .notify-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
        border: none;
        border-radius: 8px;
        color: #1a1a2e;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .notify-btn:hover {
        transform: scale(1.02);
      }
      
      .chip-packages {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .chip-package {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px 15px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }
      
      .chip-package:hover {
        border-color: #ffd700;
        transform: translateY(-3px);
        background: rgba(255, 215, 0, 0.1);
      }
      
      .chip-package.popular {
        border-color: #f093fb;
      }
      
      .chip-package.best-value {
        border-color: #00ff88;
      }
      
      .popular-badge {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        color: white;
      }
      
      .chip-package.best-value .popular-badge {
        background: linear-gradient(135deg, #00ff88 0%, #00b894 100%);
        color: #1a1a2e;
      }
      
      .chip-amount {
        margin-bottom: 10px;
      }
      
      .chip-amount .chips {
        font-size: 24px;
        display: block;
        margin-bottom: 5px;
      }
      
      .chip-amount .amount {
        color: #fff;
        font-size: 20px;
        font-weight: bold;
      }
      
      .chip-price {
        color: #ffd700;
        font-size: 18px;
        font-weight: bold;
      }
      
      .chip-bonus {
        color: #00ff88;
        font-size: 12px;
        margin-top: 5px;
        min-height: 16px;
      }
      
      .store-footer {
        text-align: center;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .disclaimer {
        color: #666;
        font-size: 11px;
        margin-bottom: 15px;
      }
      
      .free-chips-btn {
        background: linear-gradient(135deg, #00ff88 0%, #00b894 100%);
        border: none;
        padding: 12px 25px;
        border-radius: 8px;
        color: #1a1a2e;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .free-chips-btn:hover {
        transform: scale(1.05);
      }
      
      @media (max-width: 500px) {
        .freemium-modal {
          padding: 20px;
          margin: 10px;
        }
        
        .chip-packages {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export function createFreemiumUI(config: FreemiumOverlayConfig): FreemiumUI {
  return new FreemiumUI(config);
}
