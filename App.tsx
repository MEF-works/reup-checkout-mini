import React, { useState, useEffect } from 'react';
import { generateMerchantProfile, generateThankYouMessage } from './services/geminiService';
import { MerchantProfile, AppStage } from './types';
import SetupForm from './components/SetupForm';
import CheckoutModal from './components/CheckoutModal';
import IntroScreen from './components/IntroScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('setup');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [finalMessage, setFinalMessage] = useState<string>("");
  const [hasDemoParam, setHasDemoParam] = useState<boolean>(false);

  // Check for demo parameter and handle intro screen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoDemo = params.get('demo') === '1' || params.get('skipSetup') === '1' || params.get('quick') === '1';
    setHasDemoParam(autoDemo);
    
    if (!autoDemo) return;

    // Check if intro has been accepted
    const introAccepted = localStorage.getItem('altpay-intro-accepted') === 'true';
    
    if (!introAccepted) {
      // Show intro screen first
      setStage('intro');
      return;
    }

    // Intro already accepted, load demo directly
    const loadDemo = async () => {
      setStage('loading');
      
      const fallbackProfile: MerchantProfile = {
        storeName: 'Nexus Demo Store',
        industry: 'General Retail',
        accentColor: '#6366f1',
        welcomeMessage: 'Welcome to the future of decentralized commerce.',
        orderTotal: '$145.00',
        items: ['Demo Item']
      };
      
      // Show loading for minimum 500ms for smooth transition, max 1500ms
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Try to get profile, but with timeout
        const profilePromise = generateMerchantProfile('Demo Merchant', 'Demo Product');
        const timeoutPromise = new Promise<MerchantProfile>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1500)
        );
        
        await minLoadTime;
        const generatedProfile = await Promise.race([profilePromise, timeoutPromise]);
        setProfile(generatedProfile);
      } catch {
        // Use fallback on any error or timeout
        setProfile(fallbackProfile);
      }
      
      // Ensure we transition to checkout after loading
      setStage('checkout');
    };

    loadDemo();
  }, []);

  const handleGenerate = async (biz: string, prod: string) => {
    setStage('loading');
    try {
      const generatedProfile = await generateMerchantProfile(biz, prod);
      setProfile(generatedProfile);
      setStage('checkout');
    } catch (error) {
      console.error(error);
      setStage('setup');
    }
  };

  const handleComplete = async () => {
    setStage('success');
    if (profile) {
      const msg = await generateThankYouMessage(profile.storeName);
      setFinalMessage(msg);
    }
  };

  const handleIntroContinue = async () => {
    // Store acceptance in localStorage
    localStorage.setItem('altpay-intro-accepted', 'true');
    
    // Load demo after intro
    setStage('loading');
    
    // Use fallback profile immediately - no API calls to avoid hanging
    const fallbackProfile: MerchantProfile = {
      storeName: 'Nexus Demo Store',
      industry: 'General Retail',
      accentColor: '#6366f1',
      welcomeMessage: 'Welcome to the future of decentralized commerce.',
      orderTotal: '$145.00',
      items: ['Demo Item']
    };
    
    // Show loading for minimum 800ms for smooth transition, max 1500ms
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Try to get profile, but with timeout
      const profilePromise = generateMerchantProfile('Demo Merchant', 'Demo Product');
      const timeoutPromise = new Promise<MerchantProfile>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1500)
      );
      
      await minLoadTime;
      const generatedProfile = await Promise.race([profilePromise, timeoutPromise]);
      setProfile(generatedProfile);
    } catch {
      // Use fallback on any error or timeout
      setProfile(fallbackProfile);
    }
    
    // Ensure we transition to checkout after loading
    setStage('checkout');
  };

  const handleReset = () => {
    // If demo param present, keep merchants inside the demo (no setup screen)
    if (hasDemoParam && profile) {
      setStage('checkout');
      setFinalMessage("");
      return;
    }
    setStage('setup');
    setProfile(null);
    setFinalMessage("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Grid Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <IntroScreen onContinue={handleIntroContinue} />
        )}

        {stage === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="w-full z-10 relative"
          >
            <div className={hasDemoParam ? '' : 'blur-sm pointer-events-none select-none'}>
              <SetupForm onGenerate={handleGenerate} isLoading={false} />
            </div>
            
            {/* Lock Overlay - Only show when demo param is missing */}
            {!hasDemoParam && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md"
              >
                <div className="text-center max-w-md px-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 border-2 border-white/20 mb-6">
                    <Lock className="w-10 h-10 text-neutral-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Setup Locked</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                    This configuration screen is restricted. Access the demo directly using the demo URL.
                  </p>
                  <div className="inline-block px-4 py-2 rounded-lg bg-neutral-900 border border-white/10">
                    <p className="text-xs text-neutral-500 font-mono">
                      Add <code className="text-neutral-300">?demo=1</code> to the URL
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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
            <p className="font-mono text-sm text-neutral-400 animate-pulse">Initializing Secure Environment...</p>
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
                <p className="text-xs font-mono text-neutral-500 mb-2">DEMO MODE ACTIVE</p>
                <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
                  {profile.welcomeMessage}
                </div>
             </div>
            <CheckoutModal profile={profile} onComplete={handleComplete} />
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
              Payment confirmed via selected rail
            </p>
            <p className="text-neutral-500 mb-2 font-mono text-xs leading-relaxed">
              Order successfully routed
            </p>
            <p className="text-neutral-600 mb-8 font-mono text-[10px] italic border-t border-white/5 pt-4 mt-4">
              Demo flow complete — no real transaction occurred
            </p>
            
            <button 
              onClick={handleReset}
              className="group flex items-center gap-2 mx-auto text-neutral-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
              <span>Reset Demo</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;