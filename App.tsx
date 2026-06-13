import React, { useState, useEffect } from 'react';
import { generateThankYouMessage } from './services/geminiService';
import { MerchantProfile, AppStage } from './types';
import CheckoutModal from './components/CheckoutModal';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.reupmini.com').replace(/\/$/, '');

const demoProfile: MerchantProfile = {
  storeName: 'Nexus Demo Store',
  industry: 'General Retail',
  accentColor: '#6366f1',
  welcomeMessage: 'Welcome to the future of decentralized commerce.',
  orderTotal: '$145.00',
  items: ['Demo Item'],
  orderId: 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase()
};

const getCheckoutToken = () => {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('token');
  if (queryToken) return queryToken;

  const sessionMatch = window.location.pathname.match(/^\/session\/([^/]+)$/);
  return sessionMatch?.[1] || '';
};

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('loading');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [finalMessage, setFinalMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [sessionMode, setSessionMode] = useState(false);

  useEffect(() => {
    const loadCheckout = async () => {
      const token = getCheckoutToken();

      if (!token) {
        setProfile(demoProfile);
        setSessionMode(false);
        setStage('checkout');
        return;
      }

      setSessionMode(true);
      setStage('loading');

      try {
        const response = await fetch(`${API_BASE}/api/orders/session/${encodeURIComponent(token)}`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Checkout session not found');
        }

        const data = await response.json();
        if (!data.altpayProfile) {
          throw new Error('Checkout session did not include a payment profile');
        }

        setProfile(data.altpayProfile);
        setStage('checkout');
      } catch (err) {
        console.error('Failed to load checkout session:', err);
        setError(err instanceof Error ? err.message : 'Unable to load checkout session');
        setStage('setup');
      }
    };

    loadCheckout();
  }, []);

  const handleComplete = async () => {
    setStage('success');
    if (profile) {
      const msg = sessionMode
        ? 'Payment confirmed by ReUp.'
        : await generateThankYouMessage(profile.storeName);
      setFinalMessage(msg);
    }
  };

  const handleReset = () => {
    setError('');
    setProfile(demoProfile);
    setSessionMode(false);
    setFinalMessage('');
    setStage('checkout');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {stage === 'setup' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="z-10 text-center max-w-md"
          >
            <h1 className="text-2xl font-bold text-white mb-3">Checkout Unavailable</h1>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              {error || 'This checkout link is missing a valid session token.'}
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
            >
              Open Demo Checkout
            </button>
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <div className="w-16 h-16 border-4 border-neutral-800 border-t-white rounded-full animate-spin"></div>
            <p className="font-mono text-sm text-neutral-400 animate-pulse">Loading checkout...</p>
          </motion.div>
        )}

        {stage === 'checkout' && profile && (
          <motion.div
            key="checkout"
            className="w-full z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          >
            <div className="text-center mb-6">
              {!sessionMode && (
                <p className="text-xs font-mono text-neutral-500 mb-2">DEMO MODE ACTIVE</p>
              )}
              <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
                {profile.welcomeMessage}
              </div>
            </div>
            <CheckoutModal
              profile={profile}
              onComplete={handleComplete}
              verificationPollUrl={sessionMode ? `${API_BASE}/api/orders/:orderId/status` : undefined}
            />
          </motion.div>
        )}

        {stage === 'success' && profile && (
          <motion.div
            key="success"
            className="text-center z-10 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${profile.accentColor}20`, boxShadow: `0 0 40px ${profile.accentColor}40` }}
            >
              <CheckCircle2 className="w-12 h-12" style={{ color: profile.accentColor }} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Payment Confirmed</h2>
            <p className="text-neutral-400 mb-4 font-mono text-sm leading-relaxed">
              {finalMessage || 'Payment confirmed via selected rail'}
            </p>
            <p className="text-neutral-500 mb-2 font-mono text-xs leading-relaxed">
              Order successfully routed
            </p>
            {!sessionMode && (
              <p className="text-neutral-600 mb-8 font-mono text-[10px] italic border-t border-white/5 pt-4 mt-4">
                Demo flow complete - no real transaction occurred
              </p>
            )}

            <button
              onClick={handleReset}
              className="group flex items-center gap-2 mx-auto text-neutral-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
              <span>{sessionMode ? 'Open Demo' : 'Reset Demo'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
