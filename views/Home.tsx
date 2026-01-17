
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
    /* 外层容器：确保整体不滚动，改为 flex 分布 */
    <div className="h-full w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 1. 佛法名句区域 - 占据上部约 1/3 空间 (flex-1) */}
      <div 
        className="flex-[2] w-full max-w-[480px] px-4 flex flex-col items-center justify-center min-h-0" 
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
        
        {/* 上分隔线 -  */}
        <div className="w-24 h-[1px] bg-black/[0.05] mb-4 shrink-0"></div>
        
        <div className="w-full flex flex-col">
          {/* 名句内容 - 严格保持 13px/15px 和 0.3em 间距 */}
          <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.6] tracking-[0.3em] text-justify font-light">
            {text}
          </p>
          
          {/* 出处 - 严格保持 13px/15px */}
          {source && (
            <p className="text-textMain/80 text-[13px] md:text-[15px] text-right mt-4 tracking-[0.3em] text-justify font-light">
              <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
            </p>
          )}
        </div>

        {/* 下分隔线 - 保持 mt-6 */}
        <div className="w-24 h-[1px] bg-black/[0.05] mt-4 shrink-0"></div>
      </div>

      {/* 2. 今日功课时长卡片 - 占据中部核心空间 (flex-[1.5]) */}
      {/* justify-start 确保它紧跟在名句下方，pt-2 提供一点微小的呼吸感 */}
      <div className="flex-[3] w-full flex flex-col items-center justify-start min-h-0 pt-0">
        <div 
          onClick={() => onNavigate(ViewName.TOOLS)}
          /* 严格保留：rounded-[2.5rem], p-6, 阴影和边框设置 */
          className="w-full max-w-lg bg-cloud rounded-[2rem] p-5 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
        >
          {/* 标题：间距缩小 mb-4 -> mb-2 */}
          <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-2 uppercase">
            {t.durationLabel}
          </h2>
          
          {/* 时长数字：字号缩小 text-6xl -> text-5xl，间距缩小 mb-8 -> mb-5 */}
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
              <div key={idx} className="flex flex-col items-center gap-2 w-1/4">
                {/* 圆圈缩小：w-11 -> w-10 */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                  {item.val > 0 && (
                    <span className="text-[10px] font-bold text-primary">
                      {item.val}
                    </span>
                  )}
                </div>
                {/* 标签字号微调 */}
                <span className="text-[10px] text-textSub font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 底部微小垫片 (flex-0.2) 防止贴底 */}
      <div className="flex-[0.2] shrink-0 w-full"></div>
    </div>
  );
};
export default Home;
