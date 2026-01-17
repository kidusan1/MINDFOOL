
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
    /* 外层容器：全屏高度，禁止滚动，垂直布局 */
    <div className="h-full w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 🟢 区域 1：佛法名句 (权重 35)
         布局策略：justify-end (底部对齐) + pb-6
         效果：这块区域占屏幕上方的 35%，但文字会沉在底部，
         这样既给顶部留出了呼吸空间，又保证了名句不会和卡片离得太远。
      */}
      <div 
        className="flex-[35] w-full max-w-[480px] px-4 flex flex-col items-center justify-end pb-6 min-h-0" 
        style={{ 
          opacity: 0,
          animation: 'fadeInUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards'
        }}
      >
        <style>{`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        
        {/* 上分隔线：间距进一步缩小 mb-3 */}
        <div className="w-20 h-[1px] bg-black/[0.05] mb-3 shrink-0"></div>
        
        <div className="w-full flex flex-col">
          {/* 名句内容：保留字号 */}
          <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.6] tracking-[0.3em] text-justify font-light">
            {text}
          </p>
          
          {/* 出处：间距 mt-2 */}
          {source && (
            <p className="text-textMain/80 text-[12px] md:text-[14px] text-right mt-2 tracking-[0.2em] font-light">
              <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
            </p>
          )}
        </div>

        {/* 下分隔线：间距进一步缩小 mt-3 */}
        <div className="w-20 h-[1px] bg-black/[0.05] mt-3 shrink-0"></div>
      </div>

      {/* 🟢 区域 2：今日功课卡片 (权重 50)
         布局策略：justify-start (顶对齐) + pt-4
         效果：占据屏幕中间 50% 的核心区域。
         pt-4 提供了它与上方名句之间的“硬隔离”间距。
      */}
      <div className="flex-[50] w-full flex flex-col items-center justify-start pt-4 min-h-0">
        <div 
          onClick={() => onNavigate(ViewName.TOOLS)}
          /* ⚡️ 视觉回归与优化：
             1. 恢复 rounded-[2.5rem] (之前版本的大圆角)
             2. 保持内部紧凑布局 (p-5, text-5xl) 以适应高度
          */
          className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-5 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
        >
          {/* 标题 */}
          <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-2 uppercase">
            {t.durationLabel}
          </h2>
          
          {/* 时长数字：text-5xl (紧凑型大字) */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-5xl md:text-6xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
              {totalMinutes}
            </span>
            <span className="text-[10px] font-medium text-textSub tracking-widest">{t.minutes}</span>
          </div>

          {/* 四项功课状态点 */}
          <div className="flex w-full justify-between items-center px-1">
            {[
              { label: t.nianfo, val: stats.nianfo },
              { label: t.baifo, val: stats.baifo },
              { label: t.zenghui, val: stats.zenghui }, 
              { label: t.breath, val: stats.breath },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-1/4">
                {/* 圆圈：w-10 (40px) */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                  {item.val > 0 && (
                    <span className="text-[10px] font-bold text-primary">
                      {item.val}
                    </span>
                  )}
                </div>
                <span className="text-[9px] md:text-[10px] text-textSub font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 区域 3：底部安全垫片 (权重 15)
         效果：强行占据底部 15% 的高度，确保卡片不会掉到底部被搜索按钮挡住。
      */}
      <div className="flex-[15] shrink-0 w-full"></div>

    </div>
  );
};
export default Home;
