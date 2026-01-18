
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
    /* 严格扣除 140px（顶部装饰 + 底部导航） */
    <div className="h-[calc(100vh-140px)] w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 🟢 核心内容区：在手机端通过 justify-around 自动撑开间距 */}
      <div className="flex-[90] md:flex-none w-full flex flex-col items-center justify-around md:justify-center md:gap-16 min-h-0 relative py-2">
        
        {/* 名句区：固定宽度，防止被下方挤压 */}
        <div className="w-full max-w-[480px] px-4 flex flex-col items-center justify-center shrink-0">
          <div className="w-16 h-[1px] bg-black/[0.05] mb-6 md:mb-10"></div>
          
          {/* 动效容器：取消 overflow-hidden 的限制或确保高度充足 */}
          <div className="relative w-full min-h-[100px] flex items-center justify-center">
            <p 
              className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.8] tracking-[0.3em] text-center font-light quote-reveal-animation"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 0%, transparent 0%)',
                WebkitMaskSize: '100% 200%',
                maskImage: 'linear-gradient(to bottom, black 0%, black 0%, transparent 0%)',
                maskSize: '100% 200%',
              }}
            >
              {text}
            </p>
          </div>

          {source && (
            <div className="w-full text-right mt-4 opacity-0 animate-source-fade-in">
              <p className="text-textMain/60 text-[12px] md:text-[13px] tracking-[0.2em] font-light">
                <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
              </p>
            </div>
          )}
          <div className="w-16 h-[1px] bg-black/[0.05] mt-6 md:mt-10"></div>
        </div>

        {/* 卡片区：使用 shrink-0 确保自己不被压缩 */}
        <div className="w-full flex flex-col items-center shrink-0 z-10">
          <div 
            onClick={() => onNavigate(ViewName.TOOLS)}
            className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.95] cursor-pointer shadow-none border border-white/40"
          >
            <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-3 uppercase">
              今日功课时长
            </h2>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl md:text-6xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
                {totalMinutes}
              </span>
              <span className="text-xs font-medium text-textSub tracking-widest">分钟</span>
            </div>
            
            <div className="flex w-full justify-between items-center px-1">
               {/* 这里的分类图标代码保持你原有的不变 */}
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 底部 10% 安全留白 */}
      <div className="flex-[10] md:hidden shrink-0 w-full min-h-[60px]"></div>

      <style>{`
        @keyframes quoteReveal {
          0% { -webkit-mask-position: 0 100%; mask-position: 0 100%; }
          100% { -webkit-mask-position: 0 0%; mask-position: 0 0%; }
        }
        .quote-reveal-animation {
          animation: quoteReveal 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-source-fade-in {
          animation: fadeIn 1.5s ease-out 3.5s forwards;
        }
      `}</style>
    </div>
  );
};
export default Home;
