import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, X, Loader2 } from 'lucide-react';
import { MerchantProfile, PaymentMethod } from '../types';
import PaymentOption from './PaymentOption';
import { getFactsForIndustry } from '../services/didYouKnowFacts';
import { startVerificationPoll } from '../services/verificationPoll';

const FACT_ROTATE_MS = 5000;
const DEMO_ORDER_ID = 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase();

/** Default P2P handles for demo; replace via profile.p2pHandles with your real handles */
const DEMO_P2P_HANDLES = {
  venmo: '@MEFWorks',
  cashapp: '$DaMefLyfe',
  zelle: 'your-zelle@example.com',
  paypal: 'menterprisefirminc@gmail.com',
};

interface Props {
  profile: MerchantProfile;
  onComplete: () => void;
  /** Optional: backend URL to poll for verification, e.g. "/api/orders/:orderId/verification" */
  verificationPollUrl?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    iconName: 'bitcoin',
    description: 'Direct wallet-to-wallet or card-to-wallettransfer. No intermediaries.',
    useCase: 'Use case: High approval, zero chargebacks',
    details: ['Network: TRC20 (USDT)', 'Addr: T9yB...8jLk', 'Amount: $145.00'],
    color: '#f7931a'
  },
  {
    id: 'p2p',
    name: 'P2P Transfer',
    iconName: 'banknote',
    description: 'Zelle, CashApp, or Venmo. Discreet payment method.',
    useCase: 'Use case: Fast settlement, processor-independent',
    details: ['Send to: @merchant-ops-01', 'Note: "Merch"', 'LEAVE BLANK or write "THANKS"'],
    color: '#10b981'
  },
  {
    id: 'private-card',
    name: 'Secure Card Gateway',
    iconName: 'credit-card',
    description: 'International private card processor (merchant-owned). Settlement configured per account. Represents external processor behavior.',
    useCase: 'Use case: Customer familiarity and fallback coverage',
    details: ['Card Number', 'Expiry', 'CVV'],
    color: '#3b82f6'
  }
];

const CheckoutModal: React.FC<Props> = ({ profile, onComplete, verificationPollUrl }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processorOutage, setProcessorOutage] = useState(false);
  const [cardFailed, setCardFailed] = useState(false);
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [cryptoSubOption, setCryptoSubOption] = useState<'direct' | 'card-to-crypto' | null>(null);
  const [showInfoPopup, setShowInfoPopup] = useState<string | null>(null);
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const pollCleanupRef = useRef<(() => void) | null>(null);

  const facts = getFactsForIndustry(profile.industry);
  const currentFact = facts[factIndex % facts.length];

  // Rotate fact card every 5 seconds while waiting
  useEffect(() => {
    if (!waitingForVerification || facts.length <= 1) return;
    const t = setInterval(() => setFactIndex((i) => i + 1), FACT_ROTATE_MS);
    return () => clearInterval(t);
  }, [waitingForVerification, facts.length]);

  // Start polling when entering waiting state; cleanup on verified or unmount
  useEffect(() => {
    if (!waitingForVerification) return;
    const orderId = DEMO_ORDER_ID;
    pollCleanupRef.current = startVerificationPoll({
      orderId,
      verificationUrl: verificationPollUrl,
      onVerified: () => {
        pollCleanupRef.current?.();
        pollCleanupRef.current = null;
        setWaitingForVerification(false);
        onComplete();
      },
    });
    return () => {
      pollCleanupRef.current?.();
      pollCleanupRef.current = null;
    };
  }, [waitingForVerification]); // eslint-disable-line react-hooks/exhaustive-deps -- onComplete intentionally not in deps to avoid restarting poll

  const handlePaymentSent = () => {
    setWaitingForVerification(true);
  };

  const handlePay = () => {
    if (!selectedId) return;

    // Card gateway integration: redirect to backend URL when configured
    if (selectedId === 'private-card' && profile.cardGateway?.url && !processorOutage) {
      const orderId = profile.orderId ?? DEMO_ORDER_ID;
      const amount = profile.orderTotal.replace(/[$,]/g, '').trim();
      const url = new URL(profile.cardGateway.url);
      url.searchParams.set('orderId', orderId);
      url.searchParams.set('amount', amount);
      url.searchParams.set('currency', 'USD');
      if (profile.cardGateway.openInNewTab) {
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url.toString();
      }
      return;
    }
    
    // Special handling for card payment during outage simulation
    if (processorOutage && selectedId === 'private-card') {
      setProcessing(true);
      setShowInfoPopup('Processing card payment...');
      // Simulate processing delay, then fail
      setTimeout(() => {
        setProcessing(false);
        setCardFailed(true);
        setSelectedId(null);
        setShowFailurePopup(true);
        setShowInfoPopup(null);
        // Auto-hide popup after 5 seconds
        setTimeout(() => setShowFailurePopup(false), 5000);
      }, 2000);
      return;
    }
    
    // Handle card->crypto flow (secondary processor) — always succeeds to demonstrate fallback success
    if (selectedId === 'crypto' && cryptoSubOption === 'card-to-crypto') {
      setProcessing(true);
      setShowInfoPopup('Processing card-to-crypto...');
      setTimeout(() => {
        setProcessing(false);
        setShowInfoPopup(null);
        onComplete();
      }, 2000);
      return;
    }
    
    // Direct crypto or other payment methods
    setProcessing(true);
    if (selectedId === 'crypto' && cryptoSubOption === 'direct') {
      setShowInfoPopup('Processing direct crypto transfer...');
    }
    setTimeout(() => {
      setProcessing(false);
      setShowInfoPopup(null);
      onComplete();
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Glow Effect */}
      <div 
        className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl -z-10"
        style={{ background: `linear-gradient(180deg, ${profile.accentColor}, transparent)` }}
      />

      <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Paying to</p>
              <h2 className="text-xl font-bold text-white">{profile.storeName}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Total</p>
              <p className="text-xl font-mono text-white">{profile.orderTotal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-600 bg-black/20 w-fit px-2 py-1 rounded-full border border-white/5">
             <Lock className="w-3 h-3" />
             <span>End-to-End Encrypted Session</span>
          </div>
        </div>

        {/* Processor Outage Toggle */}
        <div className="px-4 pt-4 pb-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={processorOutage}
              onChange={(e) => {
                setProcessorOutage(e.target.checked);
                // Reset card failure state when toggling
                if (!e.target.checked) {
                  setCardFailed(false);
                  setShowFailurePopup(false);
                  setCryptoSubOption(null);
                }
                // Deselect card gateway if outage is toggled on
                if (e.target.checked && selectedId === 'private-card') {
                  setSelectedId(null);
                }
              }}
              className="w-4 h-4 rounded border-white/20 bg-black text-blue-500 focus:ring-2 focus:ring-blue-500/50"
            />
            <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
              Simulate card processor outage + fallbacks
            </span>
          </label>
          {processorOutage && (
            <div className="mt-2 flex items-start gap-2 text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Primary processor unavailable. Alternative payment rails remain active.</span>
            </div>
          )}
          <p className="mt-2 text-[10px] text-neutral-600">
            when checked, Secure Card Gateway attempt fails, try another after.
          </p>
        </div>

        {/* Failure Popup */}
        <AnimatePresence>
          {showFailurePopup && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 backdrop-blur-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-red-300 font-medium">Card processor unavailable right now, please select another option.</p>
              </div>
              <button
                onClick={() => setShowFailurePopup(false)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Popup */}
        <AnimatePresence>
          {showInfoPopup && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-50 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 flex items-start gap-2 backdrop-blur-sm"
            >
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-blue-300 font-medium">{showInfoPopup}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting for P2P verification: fact cards + polling in background */}
        <AnimatePresence>
          {waitingForVerification && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-2xl"
            >
              <div className="flex items-center gap-2 text-neutral-400 mb-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-mono">Checking for your payment...</span>
              </div>
              <motion.div
                key={factIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900/80 p-5 text-center"
              >
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Did you know?</p>
                <p className="text-sm text-neutral-300 leading-relaxed">{currentFact}</p>
              </motion.div>
              <p className="text-[10px] text-neutral-600 mt-4">We’ll confirm as soon as we see it. Usually under 30 seconds.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {PAYMENT_METHODS.map((method) => {
            // Only disable card after it has failed, not just when outage toggle is on
            const isDisabled = cardFailed && method.id === 'private-card';
            return (
              <div key={method.id} className={isDisabled ? 'opacity-40 pointer-events-none' : ''}>
                <PaymentOption
                  method={method}
                  isSelected={selectedId === method.id}
                  onSelect={() => {
                    if (!isDisabled) {
                      setSelectedId(method.id === selectedId ? null : method.id);
                      if (method.id === 'crypto' && selectedId !== 'crypto') {
                        setCryptoSubOption(null);
                      }
                    }
                  }}
                  accentColor={profile.accentColor}
                  processorOutage={processorOutage}
                  onCardDemoClick={processorOutage && method.id === 'private-card' && selectedId === 'private-card' ? handlePay : undefined}
                  cryptoSubOption={method.id === 'crypto' ? cryptoSubOption : null}
                  onCryptoSubOptionSelect={method.id === 'crypto' ? (option: 'direct' | 'card-to-crypto') => setCryptoSubOption(option) : undefined}
                  onCryptoPayClick={method.id === 'crypto' && cryptoSubOption ? handlePay : undefined}
                  onPaymentSent={method.id === 'p2p' ? handlePaymentSent : undefined}
                  orderId={profile.orderId ?? DEMO_ORDER_ID}
                  orderTotal={profile.orderTotal}
                  p2pHandles={profile.p2pHandles ?? DEMO_P2P_HANDLES}
                  cryptoConfig={profile.cryptoConfig}
                  btcpayConfig={profile.btcpay}
                  onCryptoPaid={profile.btcpay ? onComplete : undefined}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900/50 border-t border-white/5 backdrop-blur-sm">
          {selectedId === 'p2p' ? (
            <button
              onClick={handlePaymentSent}
              disabled={waitingForVerification}
              className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: profile.accentColor, boxShadow: `0 0 20px -5px ${profile.accentColor}50` }}
            >
              I&apos;ve sent payment
            </button>
          ) : (
            (() => {
              const isCryptoBtcPayWaiting = selectedId === 'crypto' && cryptoSubOption === 'direct' && !!profile.btcpay;
              const disabled = !selectedId || processing || (processorOutage && selectedId === 'private-card' && !processing) || (selectedId === 'crypto' && !cryptoSubOption) || isCryptoBtcPayWaiting;
              return (
                <button
                  onClick={handlePay}
                  disabled={disabled}
                  className={`
                    w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300
                    ${disabled ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'}
                  `}
                  style={!disabled && !processing ? { backgroundColor: profile.accentColor, boxShadow: `0 0 20px -5px ${profile.accentColor}50` } : undefined}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : isCryptoBtcPayWaiting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                      Waiting for payment...
                    </span>
                  ) : (
                    <>
                      Confirm Payment <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              );
            })()
          )}
          
          <div className="mt-3 space-y-2">
            <div className="text-center flex items-center justify-center gap-1 text-[10px] text-neutral-600">
              <ShieldCheck className="w-3 h-3" />
              Powered by AltPay Nexus - Merchant First Solutions.
            </div>
            <div className="text-center text-[9px] text-neutral-700 italic">
              Custom-fit per merchant. Not a plug-and-play gateway.
            </div>
            <div className="text-center text-[9px] text-neutral-700 border-t border-white/5 pt-2 mt-2">
              Merchant Demo Only — Non-functional representation of actual payment flows.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutModal;