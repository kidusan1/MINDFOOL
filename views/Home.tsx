
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
    return homeQuotes[index] || '';
  }, [user.id, homeQuotes, homeQuotes.length]); // 🔴 补上长度依赖

  // 解析名句 and 出处
  const { text, source } = useMemo(() => {
    // 🔴 增加判空保护，确保解析失败时也有内容
    if (!dailyQuote) return { text: '...', source: '' }; 
    if (!dailyQuote.includes('——')) return { text: dailyQuote, source: '' };
    
    const parts = dailyQuote.split('——');
    return { 
      // 🔴 确保 parts[0] 存在，否则回退到原始字符串
      text: parts[0] ? parts[0].trim() : dailyQuote, 
      source: parts[1] ? parts[1].trim() : '' 
    };
  }, [dailyQuote]);

  return (
    /* 1. 外层容器：精准扣除顶部装饰栏和底部导航栏的总高度 */
    <div className="h-[calc(100vh-140px)] w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 2. 核心内容区
          手机端：flex-[90] 配合 justify-around 动态分配名句与卡片间距
          电脑端：md:flex-1 配合 md:justify-center 确保整体处于屏幕垂直中点
      */}
{/* 🟢 修改点：增加 md:flex-1 确保在电脑端占据全部高度从而实现垂直居中 */}
<div className="flex-[90] md:flex-1 w-full flex flex-col items-center justify-around md:justify-center md:gap-16 min-h-0 relative py-4">        
        {/* A. 名句展示区（扫描动效沙盒化，不溢出，不挤压） */}
        <div className="w-full max-w-[480px] px-4 flex flex-col items-center justify-center shrink-0">
          <div className="w-16 h-[1px] bg-black/[0.05] mb-8"></div>
          
          <div className="relative w-full overflow-hidden text-center py-1">
          <p 
  /* 1. text-justify: 两端对齐
     2. break-all: 确保中英文或长句在行末能正确换行，不留大空白
     3. w-full: 撑满容器空间
  */
  className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.8] tracking-[0.3em] font-light quote-reveal-animation text-justify break-all w-full"
  style={{
    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 50%)',
    maskImage: 'linear-gradient(to bottom, black 50%, transparent 50%)',
    WebkitMaskSize: '100% 200%',
    maskSize: '100% 200%',
    WebkitMaskPosition: '0 100%',
    maskPosition: '0 100%',
    WebkitBackfaceVisibility: 'hidden',
    
    /* 🔴 核心：标准正文排版逻辑 */
    textAlign: 'justify',    // 两端对齐
    textAlignLast: 'left',   // 强制最后一行靠左（不居中，不拉伸）
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
          <div className="w-16 h-[1px] bg-black/[0.05] mt-5"></div>
        </div>

        {/* B. 功课卡片：严格使用你原本的 t 对象变量，不干涉翻译 */}
        <div className="w-full flex flex-col items-center shrink-0 z-10">
          <div 
            onClick={() => onNavigate(ViewName.TOOLS)}
            className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center border border-white/40 shadow-sm transition-all duration-100 active:brightness-95 touch-manipulation"
          >
            <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-3 uppercase text-center">
              {t.durationLabel}
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl md:text-6xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
                {totalMinutes}
              </span>
              <span className="text-xs font-medium text-textSub tracking-widest">{t.minutes}</span>
            </div>

            {/* 四个功课细节：恢复原始变量引用 */}
            <div className="flex w-full justify-between items-center px-1">
              {[
                { label: t.nianfo, val: stats.nianfo },
                { label: t.baifo, val: stats.baifo },
                { label: t.zenghui, val: stats.zenghui }, 
                { label: t.breath, val: stats.breath },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 w-1/4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center">
                    {item.val > 0 && (
                      <span className="text-[10px] md:text-[12px] font-bold text-primary">
                        {item.val}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-textSub font-medium tracking-tight text-center whitespace-nowrap">
                  {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 底部 10% 留白：手机端专用，PC端隐藏以保持绝对垂直居中 */}
      <div className="flex-[10] md:hidden shrink-0 w-full min-h-[60px]"></div>

      <style>{`
        @keyframes quoteReveal {
          0% { -webkit-mask-position: 0 100%; mask-position: 0 100%; }
          100% { -webkit-mask-position: 0 0%; mask-position: 0 0%; }
        }
        .quote-reveal-animation {
          animation: quoteReveal 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.2s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-source-fade-in {
          animation: fadeIn 1s ease-out 1.5s forwards;
        }
      `}</style>
    </div>
  );
};
export default Home;
