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
    // 【小白说明】如果记事本上写着“已运行”，就直接停止，不再重复选词。
    if (hasInitialized.current) return;

    // 1. 选词逻辑：优先看管理员后台有没有改过，没有就用代码里的默认词。
    const list = (quotes && quotes.length > 0) ? quotes : DEFAULT_QUOTES;
    const randomIndex = Math.floor(Math.random() * list.length);
    const text = list[randomIndex];

    if (text) {
      // 2. 将文字按空格拆分成竖排显示的列
      const lines = text.split(' ').filter(Boolean);
      setQuoteLines(lines);
      // 【小白说明】运行完后，在记事本上写下“已运行”。
      hasInitialized.current = true; 
    }

    // 3. 计时器：4.5秒后开始变透明，5.3秒后彻底消失
    const timer = setTimeout(() => {
      setIsVisible(false); // 开始淡出动画
      setTimeout(onFinish, 800); // 动画结束后通知父组件关闭我
    }, 4500); 

    return () => clearTimeout(timer);
  }, [onFinish, quotes]);

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