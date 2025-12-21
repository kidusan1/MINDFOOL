
import React, { useEffect, useState } from 'react';
import { SPLASH_QUOTES as DEFAULT_QUOTES } from '../constants';

interface SplashProps {
  onFinish: () => void;
  quotes?: string[];
}

const Splash: React.FC<SplashProps> = ({ onFinish, quotes = DEFAULT_QUOTES }) => {
  const [quoteLines, setQuoteLines] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1. Pick a random quote
    const list = (quotes && quotes.length > 0) ? quotes : DEFAULT_QUOTES;
    const randomIndex = Math.floor(Math.random() * list.length);
    const text = list[randomIndex];

    // 2. Split by space for new lines (columns)
    const lines = text.split(' ').filter(Boolean);
    setQuoteLines(lines);

    // 3. Timer to hide
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 800); // Wait for fade out animation
    }, 4500); // Display slightly longer for reading

    return () => clearTimeout(timer);
  }, [onFinish, quotes]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#F0EEE9] flex items-center justify-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex flex-row-reverse gap-6 md:gap-10 w-full max-w-lg h-auto max-h-[80vh] items-start justify-center p-8 select-none">
        {quoteLines.map((line, idx) => (
          <div 
            key={idx} 
            className="text-[#6D8D9D] text-lg font-light tracking-[0.3em] leading-loose opacity-0 animate-fade-in-up"
            style={{ 
              writingMode: 'vertical-rl', 
              textOrientation: 'upright',
              animationDelay: `${idx * 0.3}s` // Staggered animation
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Splash;
