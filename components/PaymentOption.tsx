import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bitcoin, Wallet, CreditCard, Banknote, Copy, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { PaymentMethod, P2PHandles, CryptoNetworkConfig, BtcPayConfig, BtcPayInvoice } from '../types';
import { P2P_APPS, getP2PDeeplink, type P2PApp } from '../services/p2pDeeplinks';
import { createBtcPayInvoice, startBtcPayPoll } from '../services/btcpayService';

function parseOrderTotal(orderTotal: string): number {
  const cleaned = (orderTotal || '0').replace(/[$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

interface Props {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  accentColor: string;
  processorOutage?: boolean;
  onCardDemoClick?: () => void;
  cryptoSubOption?: 'direct' | 'card-to-crypto' | null;
  onCryptoSubOptionSelect?: (option: 'direct' | 'card-to-crypto') => void;
  onCryptoPayClick?: () => void;
  /** For P2P: called when user clicks "I've sent payment" to enter verification wait */
  onPaymentSent?: () => void;
  /** For P2P: order/reference ID and handles for deeplinks */
  orderId?: string;
  orderTotal?: string;
  p2pHandles?: P2PHandles;
  /** For Crypto: per-network address/amount from backend (overrides demo defaults) */
  cryptoConfig?: CryptoNetworkConfig;
  /** For Crypto: BTCPay Server integration (create invoice + poll status via your backend) */
  btcpayConfig?: BtcPayConfig;
  /** Called when BTCPay invoice is paid (status Settled) */
  onCryptoPaid?: () => void;
}

const DEFAULT_CRYPTO_NETWORKS: Record<string, { address: string; amount: string }> = {
  'TRC20 (USDT)': { address: 'T9yB...8jLk', amount: '$145.00' },
  'BTC': { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.0023 BTC' },
  'ETH': { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: '0.045 ETH' },
  'TON': { address: 'EQD...k9mP', amount: '45.2 TON' },
  'XMR': { address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3sk...', amount: '0.15 XMR' }
};

const PaymentOption: React.FC<Props> = ({ method, isSelected, onSelect, accentColor, processorOutage, onCardDemoClick, cryptoSubOption, onCryptoSubOptionSelect, onCryptoPayClick, onPaymentSent, orderId, orderTotal, p2pHandles, cryptoConfig, btcpayConfig, onCryptoPaid }) => {
  const [copied, setCopied] = useState(false);
  const [network, setNetwork] = useState('TRC20 (USDT)');
  const [showAutoSettleInfo, setShowAutoSettleInfo] = useState(false);
  const [btcpayInvoice, setBtcpayInvoice] = useState<BtcPayInvoice | null>(null);
  const [btcpayLoading, setBtcpayLoading] = useState(false);
  const [btcpayError, setBtcpayError] = useState<string | null>(null);
  const btcpayPollCleanupRef = React.useRef<(() => void) | null>(null);

  // Create BTCPay invoice when user selects crypto direct and btcpay is configured
  React.useEffect(() => {
    if (method.id !== 'crypto' || cryptoSubOption !== 'direct' || !btcpayConfig || btcpayInvoice || btcpayLoading) return;
    const refId = orderId || 'ORDER';
    const amount = (orderTotal || '0').replace(/[$,]/g, '').trim() || '0';
    setBtcpayLoading(true);
    setBtcpayError(null);
    createBtcPayInvoice(btcpayConfig.createInvoiceUrl, { orderId: refId, amount, currency: 'USD' })
      .then((inv) => {
        setBtcpayInvoice(inv);
        setBtcpayLoading(false);
      })
      .catch((err) => {
        setBtcpayError(err instanceof Error ? err.message : 'Failed to create invoice');
        setBtcpayLoading(false);
      });
  }, [method.id, cryptoSubOption, btcpayConfig, orderId, orderTotal]); // eslint-disable-line react-hooks/exhaustive-deps -- only run when entering crypto direct with btcpay

  // Poll BTCPay invoice status when we have an invoice
  React.useEffect(() => {
    if (!btcpayInvoice || !btcpayConfig?.statusUrl || !onCryptoPaid) return;
    btcpayPollCleanupRef.current = startBtcPayPoll({
      statusUrl: btcpayConfig.statusUrl,
      invoiceId: btcpayInvoice.invoiceId,
      onPaid: () => {
        btcpayPollCleanupRef.current?.();
        btcpayPollCleanupRef.current = null;
        onCryptoPaid();
      },
    });
    return () => {
      btcpayPollCleanupRef.current?.();
      btcpayPollCleanupRef.current = null;
    };
  }, [btcpayInvoice?.invoiceId, btcpayConfig?.statusUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- onCryptoPaid intentionally excluded

  // Reset BTCPay state when user switches away from crypto direct
  React.useEffect(() => {
    if (cryptoSubOption !== 'direct' || !btcpayConfig) {
      setBtcpayInvoice(null);
      setBtcpayError(null);
      setBtcpayLoading(false);
      btcpayPollCleanupRef.current?.();
      btcpayPollCleanupRef.current = null;
    }
  }, [cryptoSubOption, btcpayConfig]);

  // Network-specific address and amount: use cryptoConfig from backend when present, else demo defaults
  const getNetworkDetails = (selectedNetwork: string): { address: string; amount: string; qrUrl?: string } => {
    const fromConfig = cryptoConfig?.[selectedNetwork];
    const fallback = DEFAULT_CRYPTO_NETWORKS[selectedNetwork] ?? DEFAULT_CRYPTO_NETWORKS['TRC20 (USDT)'];
    return {
      address: fromConfig?.address ?? fallback.address,
      amount: fromConfig?.amount ?? fallback.amount,
      qrUrl: fromConfig?.qrUrl
    };
  };

  const Icon = () => {
    switch (method.iconName) {
      case 'bitcoin': return <Bitcoin className="w-5 h-5" />;
      case 'wallet': return <Wallet className="w-5 h-5" />;
      case 'credit-card': return <CreditCard className="w-5 h-5" />;
      case 'banknote': return <Banknote className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-xl border mb-3 cursor-pointer transition-colors duration-300
        ${isSelected ? 'bg-neutral-900 border-white/20' : 'bg-black border-white/5 hover:border-white/10'}
      `}
      style={{
        boxShadow: isSelected ? `0 0 20px -5px ${accentColor}40` : 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div 
            className={`p-2 rounded-lg transition-colors duration-300 ${isSelected ? 'text-white' : 'text-neutral-500'}`}
            style={{ backgroundColor: isSelected ? accentColor : '#1a1a1a' }}
          >
            <Icon />
          </div>
          <div>
            <h3 className={`font-medium ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
              {method.name}
            </h3>
            {!isSelected && (
              <p className="text-xs text-neutral-600 truncate max-w-[200px]">{method.description}</p>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/5">
              <p className="text-sm text-neutral-400 mb-2 font-mono leading-relaxed">
                {method.description}
              </p>
              <p className="text-xs text-neutral-500 mb-4 italic">
                {method.useCase}
              </p>
              
              {/* Card form for outage simulation */}
              {processorOutage && method.id === 'private-card' && onCardDemoClick ? (
                <div className="space-y-3">
                  <div className="bg-neutral-950 rounded p-3 border border-white/5">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Card Number</label>
                    <input
                      type="text"
                      value="4532 1234 5678 9010"
                      readOnly
                      className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-950 rounded p-3 border border-white/5">
                      <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Expiry</label>
                      <input
                        type="text"
                        value="12/25"
                        readOnly
                        className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                      />
                    </div>
                    <div className="bg-neutral-950 rounded p-3 border border-white/5">
                      <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">CVV</label>
                      <input
                        type="text"
                        value="123"
                        readOnly
                        className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardDemoClick();
                    }}
                    className="w-full mt-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 text-white hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 20px -5px ${accentColor}50`
                    }}
                  >
                    Press to demo experience
                  </button>
                </div>
              ) : method.id === 'crypto' && onCryptoSubOptionSelect ? (
                /* Crypto sub-options */
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500 mb-3">Choose payment method:</p>
                  
                  {/* Direct Crypto Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCryptoSubOptionSelect('direct');
                    }}
                    className={`w-full p-3 rounded-lg border transition-all ${
                      cryptoSubOption === 'direct'
                        ? 'bg-neutral-900 border-white/20'
                        : 'bg-neutral-950 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs text-neutral-300">Send crypto directly</span>
                      </div>
                      {cryptoSubOption === 'direct' && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  </button>

                  {/* Card to Crypto Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCryptoSubOptionSelect('card-to-crypto');
                    }}
                    className={`w-full p-3 rounded-lg border transition-all ${
                      cryptoSubOption === 'card-to-crypto'
                        ? 'bg-neutral-900 border-white/20'
                        : 'bg-neutral-950 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs text-neutral-300">Buy crypto with card</span>
                      </div>
                      {cryptoSubOption === 'card-to-crypto' && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAutoSettleInfo((prev) => !prev);
                    }}
                    className="text-[11px] text-neutral-500 text-left underline decoration-dotted hover:text-neutral-300 transition-colors"
                  >
                    Auto-settles directly to merchants account
                  </button>
                  <AnimatePresence>
                    {showAutoSettleInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-neutral-400 bg-neutral-950 border border-white/10 rounded-lg p-3"
                      >
                        Card to crypto payments allows your customers to purchase crypto that is directly deposited into the merchants wallet within a few minutes in most cases. This can then be converted to fiat and withdrawn or traded on the blockchain - the choice and control remain with the merchant - as it should!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show details based on selection */}
                  {cryptoSubOption === 'direct' && (
                    btcpayConfig ? (
                      /* BTCPay Server: create invoice, show address/amount/QR, poll until paid */
                      <div className="mt-4 space-y-3">
                        {btcpayLoading && (
                          <div className="flex items-center gap-2 text-neutral-400 py-4">
                            <span className="inline-block w-4 h-4 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                            <span className="text-xs font-mono">Creating invoice...</span>
                          </div>
                        )}
                        {btcpayError && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {btcpayError}
                          </div>
                        )}
                        {btcpayInvoice && !btcpayLoading && (
                          <>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Pay with {btcpayInvoice.cryptoCode}</p>
                            <div className="space-y-2">
                              <div className="bg-neutral-950 rounded p-3 border border-white/5 flex items-center justify-between gap-2 text-xs">
                                <span className="text-neutral-500">Address</span>
                                <div className="flex items-center gap-1 min-w-0">
                                  <code className="text-neutral-300 font-mono truncate">{btcpayInvoice.paymentAddress}</code>
                                  <button type="button" onClick={(e) => handleCopy(e, btcpayInvoice.paymentAddress)} className="text-neutral-500 hover:text-white shrink-0">
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-neutral-950 rounded p-3 border border-white/5 flex items-center justify-between gap-2 text-xs">
                                <span className="text-neutral-500">Amount</span>
                                <div className="flex items-center gap-1">
                                  <code className="text-neutral-300 font-mono">{btcpayInvoice.amount} {btcpayInvoice.cryptoCode}</code>
                                  <button type="button" onClick={(e) => handleCopy(e, `${btcpayInvoice.amount} ${btcpayInvoice.cryptoCode}`)} className="text-neutral-500 hover:text-white shrink-0">
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {(btcpayInvoice.qrUrl || btcpayInvoice.checkoutLink) && (
                              <div className="mt-3 flex flex-col items-center gap-2">
                                {btcpayInvoice.qrUrl && (
                                  <div className="w-32 h-32 bg-white p-2 rounded-lg">
                                    <img src={btcpayInvoice.qrUrl} alt="Payment QR" className="w-full h-full object-contain" />
                                  </div>
                                )}
                                {btcpayInvoice.checkoutLink && (
                                  <a
                                    href={btcpayInvoice.checkoutLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium text-white hover:opacity-90"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open in BTCPay
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-[10px] text-neutral-600 mt-2 text-center">Waiting for payment. We’ll confirm when the network confirms.</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-3">
                          <div className="bg-neutral-950 rounded p-3 border border-white/5">
                            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Network</label>
                            <select
                              value={network}
                              onChange={(e) => setNetwork(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="TRC20 (USDT)">TRC20 (USDT)</option>
                              <option value="BTC">BTC</option>
                              <option value="ETH">ETH</option>
                              <option value="TON">TON</option>
                              <option value="XMR">XMR</option>
                            </select>
                          </div>
                          {(() => {
                            const networkDetails = getNetworkDetails(network);
                            const details = [
                              `Network: ${network}`,
                              `Addr: ${networkDetails.address}`,
                              `Amount: ${networkDetails.amount}`
                            ];
                            return details.map((detail, idx) => (
                              <div key={idx} className="bg-neutral-950 rounded p-3 border border-white/5 flex items-center justify-between group">
                                <code className="text-xs text-neutral-300 break-all font-mono">{detail}</code>
                                {detail.length > 15 && (
                                  <button 
                                    onClick={(e) => handleCopy(e, detail)}
                                    className="ml-2 text-neutral-500 hover:text-white transition-colors"
                                  >
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                        <div className="mt-4 flex justify-center">
                           <div className="w-32 h-32 bg-white p-2 rounded-lg">
                             <img 
                               src={getNetworkDetails(network).qrUrl || 'https://mefworks.com/wp-content/uploads/2025/12/qr-code.png'} 
                               alt="QR Code" 
                               className="w-full h-full object-contain"
                               onError={(e) => {
                                 const el = e.target as HTMLImageElement;
                                 if (getNetworkDetails(network).qrUrl) {
                                   el.style.display = 'none';
                                 } else {
                                   el.src = 'https://mefworks.com/wp-content/uploads/2025/12/qr-code.png';
                                 }
                               }}
                             />
                           </div>
                        </div>
                      </div>
                    )
                  )}

                  {cryptoSubOption === 'card-to-crypto' && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-neutral-500 italic">Card will purchase crypto, sent directly to merchant wallet</p>
                      <div className="bg-neutral-950 rounded p-3 border border-white/5">
                        <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Card Number</label>
                        <input
                          type="text"
                          value="4532 1234 5678 9010"
                          readOnly
                          className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-950 rounded p-3 border border-white/5">
                          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Expiry</label>
                          <input
                            type="text"
                            value="12/25"
                            readOnly
                            className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                          />
                        </div>
                        <div className="bg-neutral-950 rounded p-3 border border-white/5">
                          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">CVV</label>
                          <input
                            type="text"
                            value="123"
                            readOnly
                            className="w-full bg-transparent text-xs text-neutral-300 font-mono border-none outline-none"
                          />
                        </div>
                      </div>
                      {onCryptoPayClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCryptoPayClick();
                          }}
                          className="w-full mt-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 text-white hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 20px -5px ${accentColor}50`
                          }}
                        >
                          Process Payment <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : method.id === 'p2p' && p2pHandles ? (
                /* P2P: all four rails (Venmo, Cash App, Zelle, PayPal) with deeplinks when handle is set */
                (() => {
                  const totalNum = parseOrderTotal(orderTotal || '0');
                  const refId = orderId || 'ORDER';
                  const amountStr = totalNum > 0 ? `$${totalNum.toFixed(2)}` : (orderTotal || '$0.00');
                  const p2pAppIds: P2PApp[] = ['venmo', 'cashapp', 'zelle', 'paypal'];

                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-400 font-mono leading-relaxed">{method.description}</p>
                      <p className="text-xs text-neutral-500 mb-3 italic">{method.useCase}</p>
                      <p className="text-xs text-neutral-500 mb-2">Choose your app, then open it to send payment.</p>
                      {p2pAppIds.map((app) => {
                        const config = P2P_APPS.find((a) => a.id === app);
                        if (!config) return null;
                        const handle = p2pHandles![app]?.trim();
                        const hasHandle = !!handle;
                        const deeplink = hasHandle ? getP2PDeeplink(app, handle, totalNum, refId) : null;
                        return (
                          <div key={app} className={`bg-neutral-950 rounded-xl border border-white/5 p-3 space-y-2 ${!hasHandle ? 'opacity-70' : ''}`}>
                            <p className="text-xs font-medium text-neutral-300">{config.name}</p>
                            {hasHandle ? (
                              <>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-neutral-500">Send to:</span>
                                  <div className="flex items-center gap-1">
                                    <code className="text-neutral-300 font-mono truncate max-w-[140px]">{handle}</code>
                                    <button type="button" onClick={(e) => handleCopy(e, handle)} className="text-neutral-500 hover:text-white shrink-0">
                                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-neutral-500">Amount:</span>
                                  <div className="flex items-center gap-1">
                                    <code className="text-neutral-300 font-mono">{amountStr}</code>
                                    <button type="button" onClick={(e) => handleCopy(e, amountStr)} className="text-neutral-500 hover:text-white shrink-0">
                                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-neutral-500">Reference:</span>
                                  <div className="flex items-center gap-1">
                                    <code className="text-neutral-300 font-mono truncate max-w-[120px]">{refId}</code>
                                    <button type="button" onClick={(e) => handleCopy(e, refId)} className="text-neutral-500 hover:text-white shrink-0">
                                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (deeplink) {
                                      window.location.href = deeplink;
                                    } else {
                                      window.open(/iphone|ipad/i.test(navigator.userAgent) ? config.appStoreUrl : config.playStoreUrl, '_blank');
                                    }
                                  }}
                                  className="w-full mt-2 py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {deeplink ? `Open ${config.name}` : `Get ${config.name}`}
                                </button>
                              </>
                            ) : (
                              <p className="text-[11px] text-neutral-500 italic">Configure handle in merchant settings.</p>
                            )}
                          </div>
                        );
                      })}
                      {onPaymentSent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPaymentSent();
                          }}
                          className="w-full mt-2 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 text-white hover:scale-[1.02] active:scale-[0.98]"
                          style={{ backgroundColor: accentColor, boxShadow: `0 0 20px -5px ${accentColor}50` }}
                        >
                          I&apos;ve sent payment
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="space-y-3">
                    {method.details.map((detail, idx) => (
                      <div key={idx} className="bg-neutral-950 rounded p-3 border border-white/5 flex items-center justify-between group">
                        <code className="text-xs text-neutral-300 break-all font-mono">{detail}</code>
                        {detail.length > 15 && (
                          <button 
                            onClick={(e) => handleCopy(e, detail)}
                            className="ml-2 text-neutral-500 hover:text-white transition-colors"
                          >
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {method.iconName === 'bitcoin' && (
                    <div className="mt-4 flex justify-center">
                       <div className="w-32 h-32 bg-white p-2 rounded-lg">
                         <img 
                           src="https://mefworks.com/wp-content/uploads/2025/12/qr-code.png" 
                           alt="QR Code" 
                           className="w-full h-full object-contain"
                           onError={(e) => {
                             console.error('QR code image failed to load');
                             (e.target as HTMLImageElement).style.display = 'none';
                           }}
                         />
                       </div>
                    </div>
                  )}

                  {method.id === 'p2p' && onPaymentSent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPaymentSent();
                      }}
                      className="w-full mt-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 text-white hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 0 20px -5px ${accentColor}50`
                      }}
                    >
                      I&apos;ve sent payment
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentOption;