import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal } from 'lucide-react';

interface Props {
  onGenerate: (biz: string, prod: string) => void;
  isLoading: boolean;
}

const SetupForm: React.FC<Props> = ({ onGenerate, isLoading }) => {
  const [biz, setBiz] = useState('');
  const [prod, setProd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(biz, prod);
  };

  return (
    <div className="max-w-md w-full mx-auto px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
          <Terminal className="w-4 h-4 text-brand-glow" />
          <span className="text-xs font-mono text-neutral-400">Merchant Onboarding v2.4</span>
        </div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-4">
          Sell the Concept.
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Configure the AltPay Nexus demo environment. 
          Gemini AI will generate a tailored merchant identity to demonstrate the "custom-fit" architecture.
        </p>
      </div>

      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 bg-neutral-900/30 p-8 rounded-2xl border border-white/5 backdrop-blur-sm"
      >
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-500 font-semibold ml-1">Merchant Industry</label>
          <input
            type="text"
            value={biz}
            onChange={(e) => setBiz(e.target.value)}
            placeholder="e.g. Rare Sneaker Resale"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-700 focus:outline-none focus:border-brand-glow focus:ring-1 focus:ring-brand-glow transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-500 font-semibold ml-1">Sample Product</label>
          <input
            type="text"
            value={prod}
            onChange={(e) => setProd(e.target.value)}
            placeholder="e.g. Jordan 1 High Travis Scott"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-700 focus:outline-none focus:border-brand-glow focus:ring-1 focus:ring-brand-glow transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Demo Environment
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
};

export default SetupForm;