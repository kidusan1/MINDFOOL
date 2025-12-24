import React, { useEffect, useState, useRef } from 'react';
import { SPLASH_QUOTES as DEFAULT_QUOTES } from '../constants';

interface SplashProps {
  onFinish: () => void;
  quotes?: string[];
}

const Splash: React.FC<SplashProps> = ({ onFinish, quotes = [] }) => {
  const [quoteLines, setQuoteLines] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  
  // 【小白说明】Ref 就像一个记事本，它改变时不会让页面刷新。
  // 我们用它来记录“随机逻辑是否已经运行过”。
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 如果已经初始化过，直接返回
    if (hasInitialized.current) return;

    // 1. 选词
    const list = (quotes && quotes.length > 0) ? quotes : DEFAULT_QUOTES;
    const randomIndex = Math.floor(Math.random() * list.length);
    const text = list[randomIndex] || "吉祥如意"; // 增加一个保底词

    // 2. 拆分文字
    const lines = text.split(' ').filter(Boolean);
    setQuoteLines(lines);
    
    // 【关键】无论有没有词，都标记为已初始化，确保计时器一定运行
    hasInitialized.current = true; 

    // 3. 核心计时器：确保 4.5 秒后一定触发消失
    const timer = setTimeout(() => {
      setIsVisible(false); // 先变透明
      
      // 800毫秒动画结束后，执行交接
      setTimeout(() => {
        onFinish(); 
      }, 800);
    }, 4500); 

    return () => clearTimeout(timer);
  }, [onFinish]); // 注意：这里去掉了 quotes，防止它反复干扰
  
  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#F0EEE9] flex items-center justify-center transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-row-reverse gap-6 md:gap-10 w-full max-w-lg h-auto max-h-[80vh] items-start justify-center p-8 select-none">
        {quoteLines.map((line, idx) => (
          <div 
            key={idx} 
            className="text-[#6D8D9D] text-lg font-light tracking-[0.3em] leading-loose opacity-0 animate-fade-in-up"
            style={{ 
              writingMode: 'vertical-rl', 
              textOrientation: 'upright',
              animationDelay: `${idx * 0.3}s` 
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