export interface PaymentMethod {
  id: string;
  name: string;
  iconName: 'bitcoin' | 'wallet' | 'credit-card' | 'banknote';
  description: string;
  useCase: string; // Use case descriptor for demo
  details: string[]; // Instructions or form fields needed
  color: string;
}

/** Merchant P2P handles; used for deeplinks. Omit or leave empty to hide that app. */
export interface P2PHandles {
  venmo?: string;   // e.g. @YourHandle
  cashapp?: string;  // e.g. $YourHandle
  zelle?: string;   // email or phone
  paypal?: string;  // email or paypal.me/username
}

/** Per-network crypto address + amount; key = network label e.g. "TRC20 (USDT)", "BTC". */
export interface CryptoNetworkConfig {
  [networkKey: string]: {
    address: string;
    amount: string;
    /** Optional: QR code image URL for this network (backend-generated). */
    qrUrl?: string;
  };
}

/** Card gateway integration: URL to redirect or embed for card payment. */
export interface CardGatewayConfig {
  /** URL to open when user confirms card payment (e.g. gateway checkout or hosted form). Query params orderId, amount, currency can be appended by checkout. */
  url: string;
  /** Optional: open in new tab vs same window. Default same window. */
  openInNewTab?: boolean;
}

export interface MerchantProfile {
  storeName: string;
  industry: string;
  accentColor: string;
  welcomeMessage: string;
  orderTotal: string;
  items: string[];
  /** Optional: order/reference ID for P2P note and verification */
  orderId?: string;
  /** Optional: P2P app handles for "Open app" deeplinks */
  p2pHandles?: P2PHandles;
  /** Optional: crypto addresses per network for integration (overrides demo defaults) */
  cryptoConfig?: CryptoNetworkConfig;
  /** Optional: card gateway URL for integration (redirect/embed when user pays with card) */
  cardGateway?: CardGatewayConfig;
  /** Optional: BTCPay Server integration for real Bitcoin/crypto payments (your backend proxies to BTCPay) */
  btcpay?: BtcPayConfig;
}

/** BTCPay Server integration: backend endpoints that create invoice and return status (backend calls your BTCPay VM). */
export interface BtcPayConfig {
  /** POST: body { orderId, amount, currency }. Backend creates BTCPay invoice, returns BtcPayInvoice. */
  createInvoiceUrl: string;
  /** GET with ?invoiceId= or path :invoiceId. Backend returns { status: 'New' | 'Processing' | 'Settled' | 'Expired' }. */
  statusUrl: string;
}

/** Normalized invoice from backend after creating BTCPay invoice (from Get Invoice Payment Methods / checkout link). */
export interface BtcPayInvoice {
  invoiceId: string;
  paymentAddress: string;
  amount: string;
  cryptoCode: string;
  /** Optional: QR image URL. Backend can use BTCPay paymentLink or generate QR. */
  qrUrl?: string;
  /** BTCPay checkout page; open in new tab for "Pay in BTCPay" option. */
  checkoutLink?: string;
  /** Unix expiry if available. */
  expiry?: number;
}

export type AppStage = 'setup' | 'intro' | 'loading' | 'checkout' | 'success';

export interface SetupFormData {
  businessType: string;
  productType: string;
}