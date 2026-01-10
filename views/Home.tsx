
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
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-12 animate-fade-in overflow-y-auto no-scrollbar py-6 md:py-12">
 {/* 1. 佛法名句区域 */}
 <div 
        className="w-full max-w-[480px] px-4 flex flex-col items-center mb-10" 
        style={{ 
          opacity: 0,
          animation: 'fadeInUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards'
        }}
      >
        <style>{`
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(40px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        
        {/* 上分隔线 */}
        <div className="w-24 h-[1px] bg-black/[0.05] mb-6"></div>
        
        <div className="w-full flex flex-col">
          {/* 名句内容 */}
          <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.5] tracking-[0.3em] text-justify font-light">
            {text}
          </p>
          
          {/* 出处 */}
          {source && (
            <p className="text-textMain/80 text-[13px] md:text-[15px] text-right mt-4 tracking-[0.2em] font-light">
              <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
            </p>
          )}
        </div>

        {/* 下分隔线 */}
        <div className="w-24 h-[1px] bg-black/[0.05] mt-6"></div>
      </div>
      {/* 2. 今日功课时长卡片 (原本在上方，现在调换到下方) */}
      <div 
        onClick={() => onNavigate(ViewName.TOOLS)}
        className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
      >
        {/* 标题 */}
        <h2 className="text-textSub text-xs md:text-sm font-medium tracking-[0.2em] mb-4 uppercase">
          {t.durationLabel}
        </h2>
        
        {/* 时长数字 */}
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-6xl md:text-7xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
            {totalMinutes}
          </span>
          <span className="text-xs font-medium text-textSub tracking-widest">{t.minutes}</span>
        </div>

        {/* 四项功课状态点 */}
        <div className="flex w-full justify-between items-center px-2">
          {[
            { label: t.nianfo, val: stats.nianfo },
            { label: t.baifo, val: stats.baifo },
            { label: t.zenghui, val: stats.zenghui }, 
            { label: t.breath, val: stats.breath },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2.5 w-1/4">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                {item.val > 0 && (
                   <span className="text-[10px] md:text-[11px] font-bold text-primary">
                    {item.val}
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs text-textSub font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
