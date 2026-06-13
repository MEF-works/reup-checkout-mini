import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onContinue: () => void;
}

const IntroScreen: React.FC<Props> = ({ onContinue }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);

  const fullText = `The problem is not theoretical.

Frozen.
Shut down.
Unavailable.

Most failures don't come with warnings.
They arrive mid-transaction.

Funds pause.
Sessions expire.
Appeals go unanswered.

If it hasn't happened to you yet,
it has happened to someone nearby.

Not because they were reckless.
Because they assumed continuity.

This system exists to show what happens
when that assumption is removed.

What you are about to see is not a product.
It is a response.`;

  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 60; // milliseconds per character (slowed to half speed)

    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Wait a moment after typing completes, then show button
        setTimeout(() => {
          setShowButton(true);
        }, 500);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, []);

  // Split displayed text into lines for rendering
  const lines = displayedText.split('\n');
  const headline = lines[0] || '';
  const bodyLines = lines.slice(1);

  return (
    <div className="fixed inset-0 bg-[#0b0b0b] flex items-center justify-center z-50 overflow-hidden">
      {/* Subtle animated grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          animation: 'grain 8s steps(10) infinite'
        }}
      />
      
      {/* Very soft slow-moving shadow gradient */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute w-full h-full"
          style={{
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            animation: 'drift 20s ease-in-out infinite alternate'
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl px-4 md:px-8 text-center overflow-y-auto max-h-[90vh] py-8" style={{ fontFamily: "'Lora', serif" }}>
        {/* Headline */}
        {headline && (
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[#eaeaea] mb-6 md:mb-8 leading-tight">
            {headline}
          </h1>
        )}

        {/* Body text with reduced spacing */}
        <div className="space-y-1 md:space-y-2 mb-8 md:mb-12 text-[#d6d6d6] text-base md:text-lg lg:text-xl leading-relaxed font-normal">
          {bodyLines.map((line, index) => {
            // Empty lines for spacing
            if (line.trim() === '') {
              return <div key={index} className="h-2 md:h-3" />;
            }
            return (
              <p key={index}>
                {line || '\u00A0'}
              </p>
            );
          })}
          {/* Blinking cursor */}
          {displayedText.length < fullText.length && (
            <span className="inline-block w-0.5 h-5 md:h-6 bg-[#d6d6d6] ml-1 animate-pulse" />
          )}
        </div>

        {/* Button - fades in after typing completes */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-[#eaeaea] text-[#0b0b0b] font-medium text-sm tracking-wide hover:bg-[#d6d6d6] transition-colors duration-300 mb-4"
              >
                Continue to Demo
              </button>
              
              <p className="text-xs text-[#888]">
                Demo illustrates system behavior only. No live processing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
        
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(2%, -2%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;

