
import React, { useMemo } from 'react';
import { ViewName, DailyStats, Language, User } from '../types';
import { TRANSLATIONS } from '../constants';

interface HomeProps {
  onNavigate: (view: ViewName) => void;
  stats: DailyStats;
  lang: Language;
  user: User;
  homeQuotes: string[];
}

// 打开 Home.tsx，找到函数开头：
const Home: React.FC<HomeProps> = ({ onNavigate, stats, lang, user, homeQuotes }) => {
  
  // 🟢 1. 【新增】必须加这个拦截！
  // 防止未登录时 user 为空导致后续代码读取 user.id 报错白屏
  if (!user) return null; 

  // ... 下面是原来的代码 ...
  const t = TRANSLATIONS[lang].home;
  const totalMinutes = stats.nianfo + stats.baifo + stats.zenghui + stats.breath;

  // 每日基于用户ID和日期随机选择一条名句
  const dailyQuote = useMemo(() => {
    if (!homeQuotes || homeQuotes.length === 0) return '';
    const dateStr = new Date().toISOString().split('T')[0];
    const seed = user.id + dateStr;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % homeQuotes.length;
    return homeQuotes[index];
  }, [user.id, homeQuotes]);

  // 解析名句 and 出处
  const { text, source } = useMemo(() => {
    if (!dailyQuote.includes('——')) return { text: dailyQuote, source: '' };
    const parts = dailyQuote.split('——');
    return { text: parts[0].trim(), source: parts[1].trim() };
  }, [dailyQuote]);
  
  return (
    <div className="h-[calc(100vh-140px)] w-full flex flex-col md:justify-center items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      <div className="flex-[90] md:flex-none w-full flex flex-col items-center justify-center min-h-0 relative">
        
        <div className="w-full max-w-[480px] px-4 flex flex-col items-center justify-center shrink-1">
          {/* 上装饰线 */}
          <div className="w-16 h-[1px] bg-black/[0.05] mb-8 md:mb-10 shrink-0"></div>
          
          {/* 🟢 自动化逐行扫描显示区 */}
          <div className="relative w-full overflow-hidden">
            <p 
              className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.8] tracking-[0.3em] text-justify font-light quote-reveal-animation"
              style={{
                /* 初始状态：通过遮罩隐藏文字 */
                maskImage: 'linear-gradient(to bottom, black 0%, black 0%, transparent 0%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 0%, transparent 0%)',
                maskSize: '100% 200%',
                WebkitMaskSize: '100% 200%',
              }}
            >
              {text}
            </p>
          </div>

          {/* 出处：平滑淡入 */}
          {source && (
            <div className="w-full text-right mt-6 opacity-0 animate-source-fade-in">
              <p className="text-textMain/60 text-[12px] md:text-[13px] tracking-[0.2em] font-light">
                <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
              </p>
            </div>
          )}

          {/* 下装饰线 */}
          <div className="w-16 h-[1px] bg-black/[0.05] mt-8 md:mt-10 shrink-0"></div>
        </div>

        <div className="flex-grow md:flex-none md:h-12 max-h-[60px] min-h-[20px] w-full"></div>

        {/* 卡片区保持原样 */}
        <div className="w-full flex flex-col items-center shrink-0">
          {/* ...原有卡片代码... */}
        </div>
      </div>

      <div className="flex-[10] md:hidden shrink-0 w-full min-h-[70px]"></div>

      <style>{`
        /* 这种动画模拟了文字一行行被“扫描”出来的感觉，不受手动空格限制 */
        @keyframes quoteReveal {
          0% {
            mask-image: linear-gradient(to bottom, transparent 0%, transparent 0%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, transparent 0%);
          }
          100% {
            mask-image: linear-gradient(to bottom, black 100%, black 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 100%, black 100%);
          }
        }

        .quote-reveal-animation {
          animation: quoteReveal 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.5s;
        }

        @keyframes sourceFadeIn {
          from { opacity: 0; transform: translateX(5px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-source-fade-in {
          animation: sourceFadeIn 1.5s ease-out 2.5s forwards;
        }
      `}</style>
    </div>
  );};
export default Home;
