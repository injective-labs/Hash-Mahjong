/**
 * INJ Pass Wallet Adapter for Hash Mahjong
 *
 * Integrates INJ Pass wallet using iframe embed connector
 * Replaces the old popup-based implementation
 */
import { InjPassConnector, type ConnectedWallet } from '@injpass/cli';

export class InjPassWalletAdapter {
  private connector: InjPassConnector;
  private wallet: ConnectedWallet | null = null;
  private connected = false;
  private listeners: Set<() => void> = new Set();
  private isDisconnecting = false;

  constructor() {
    // Detect mobile for better UX
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

    // Get embed URL from environment variable
    const embedUrl = process.env.NEXT_PUBLIC_INJPASS_EMBED_URL;

    if (!embedUrl) {
      throw new Error(
        'NEXT_PUBLIC_INJPASS_EMBED_URL is not configured. ' +
        'Please set it in your .env file (e.g., https://injpass.xyz/embed for production)'
      );
    }

    this.connector = new InjPassConnector({
      embedUrl,
      mode: isMobile ? 'modal' : 'floating',
      position: { bottom: '20px', right: '20px' },
      size: isMobile
        ? { width: '90vw', height: '60vh' }
        : { width: '400px', height: '300px' },
      autoHide: false // Keep iframe visible for transaction signing
    });

    // Listen for disconnect events from SDK
    this.connector.onDisconnect(() => {
      if (!this.isDisconnecting) {
        this.isDisconnecting = true;
        this.disconnect();
      }
    });
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Connect to INJ Pass wallet
   * @returns Injective wallet address (inj1... or 0x... EVM format)
   */
  async connect(): Promise<string> {
    if (this.connected && this.wallet) {
      return this.wallet.address;
    }

    try {
      this.wallet = await this.connector.connect();
      this.connected = true;
      console.log('✅ INJ Pass connected:', {
        address: this.wallet.address,
        walletName: this.wallet.walletName,
      });
      this.notifyListeners();
      return this.wallet.address;
    } catch (error) {
      console.error('INJ Pass connection failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to connect to INJ Pass wallet'
      );
    }
  }

  /**
   * Get current wallet address (0x... EVM format)
   */
  getAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Get wallet name
   */
  getWalletName(): string | null {
    return this.wallet?.walletName || null;
  }

  /**
   * Sign a message
   * @param message - Message to sign
   * @returns Signature as Uint8Array
   */
  async signMessage(message: string): Promise<Uint8Array> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.wallet.signer.signMessage(message);
    } catch (error) {
      console.error('Signing failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to sign message'
      );
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.connector.disconnect();
    this.wallet = null;
    this.connected = false;
    this.isDisconnecting = false;
    this.notifyListeners();
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connected && this.wallet !== null;
  }

  /**
   * Show wallet UI (if hidden)
   */
  showWallet(): void {
    this.connector.show();
  }

  /**
   * Hide wallet UI
   */
  hideWallet(): void {
    this.connector.hide();
  }
}

// Singleton instance
let injPassWallet: InjPassWalletAdapter | null = null;

/**
 * Get or create INJ Pass wallet instance
 */
export function getInjPassWallet(): InjPassWalletAdapter {
  if (!injPassWallet) {
    injPassWallet = new InjPassWalletAdapter();
  }
  return injPassWallet;
}
