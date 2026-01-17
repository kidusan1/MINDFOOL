
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
    /* 外层容器：使用 Flex 列布局，高度占满，禁止滚动 */
    <div className="h-full w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 🟢 区域 1：佛法名句 (权重 flex-[2]) 
          作用：占据约 33% 的高度，内容垂直居中
      */}
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
        
        {/* 上分隔线：间距由 mb-6 极大缩小为 mb-3，更紧凑 */}
        <div className="w-20 h-[1px] bg-black/[0.05] mb-3 shrink-0"></div>
        
        <div className="w-full flex flex-col">
          {/* 名句内容：保留字号，但增加一点行高 */}
          <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.6] tracking-[0.3em] text-justify font-light">
            {text}
          </p>
          
          {/* 出处：紧贴名句 */}
          {source && (
            <p className="text-textMain/80 text-[12px] md:text-[14px] text-right mt-2 tracking-[0.2em] font-light">
              <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
            </p>
          )}
        </div>

        {/* 下分隔线：间距缩小为 mt-3 */}
        <div className="w-20 h-[1px] bg-black/[0.05] mt-3 shrink-0"></div>
      </div>

      {/* 🟢 区域 2：今日功课卡片 (权重 flex-[3]) 
          作用：占据约 50% 的高度。
          关键修改：内容 justify-start (靠上对齐)，避免被挤到下面去。
      */}
      <div className="flex-[3] w-full flex flex-col items-center justify-start min-h-0 pt-1">
        <div 
          onClick={() => onNavigate(ViewName.TOOLS)}
          /* ⚡️ 卡片大瘦身：内边距减小 (p-4)，圆角微调，整体更扁平 */
          className="w-full max-w-lg bg-cloud rounded-[2rem] p-5 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
        >
          {/* 标题：极小化，mb-2 */}
          <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-2 uppercase">
            {t.durationLabel}
          </h2>
          
          {/* 时长数字：从 text-6xl 降为 text-5xl，mb-4 */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl md:text-6xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
              {totalMinutes}
            </span>
            <span className="text-[10px] font-medium text-textSub tracking-widest">{t.minutes}</span>
          </div>

          {/* 四项功课状态点：整体更紧凑 */}
          <div className="flex w-full justify-between items-center px-1">
            {[
              { label: t.nianfo, val: stats.nianfo },
              { label: t.baifo, val: stats.baifo },
              { label: t.zenghui, val: stats.zenghui }, 
              { label: t.breath, val: stats.breath },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-1/4">
                {/* 圆圈缩小：w-10 (40px) */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                  {item.val > 0 && (
                    <span className="text-[10px] font-bold text-primary">
                      {item.val}
                    </span>
                  )}
                </div>
                {/* 标签文字缩小 */}
                <span className="text-[9px] md:text-[10px] text-textSub font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 区域 3：底部安全缓冲 (权重 flex-[1]) 
          作用：占据约 16% 的高度。
          这块区域是空的，专门用来放置“放大镜”按钮，确保卡片永远不会和它重叠。
      */}
      <div className="flex-[1] shrink-0 w-full"></div>

    </div>
  );
};
export default Home;
