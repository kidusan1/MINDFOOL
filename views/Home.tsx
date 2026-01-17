
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
    /* 外层容器：确保占据剩余全部高度，整体不滚动 */
    <div className="h-full w-full flex flex-col items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 🟢 区域 1：佛法名句 (权重 35)
          justify-center 配合 flex-col，确保名句在屏幕上半部分自然居中
      */}
      <div 
        className="flex-[35] w-full max-w-[480px] px-4 flex flex-col items-center justify-center min-h-0" 
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
        
        {/* 上分隔线：保持你之前要求的紧凑间距 mb-3 */}
        <div className="w-24 h-[1px] bg-black/[0.05] mb-3 shrink-0"></div>
        
        <div className="w-full flex flex-col">
          {/* 严格复原：text-[13px] md:text-[15px], tracking-[0.3em] */}
          <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.6] tracking-[0.3em] text-justify font-light">
            {text}
          </p>
          
          {/* 严格复原：text-[13px] md:text-[15px] */}
          {source && (
            <p className="text-textMain/80 text-[13px] md:text-[15px] text-right mt-3 tracking-[0.2em] font-light">
              <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
            </p>
          )}
        </div>

        {/* 下分隔线：mt-3 */}
        <div className="w-24 h-[1px] bg-black/[0.05] mt-3 shrink-0"></div>
      </div>

      {/* 🟢 区域 2：今日功课卡片 (权重 45)
          justify-start：让卡片从这一块地盘的顶部开始排列，防止它掉得太靠下
      */}
      <div className="flex-[45] w-full flex flex-col items-center justify-start min-h-0 pt-2">
        <div 
          onClick={() => onNavigate(ViewName.TOOLS)}
          /* 严格复原：rounded-[2.5rem], p-6 md:p-10 */
          className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
        >
          {/* 标题：保持原有样式 */}
          <h2 className="text-textSub text-xs md:text-sm font-medium tracking-[0.2em] mb-4 uppercase">
            {t.durationLabel}
          </h2>
          
          {/* 时长数字：严格复原 text-6xl md:text-7xl */}
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
                {/* 严格复原圆圈尺寸：w-11 h-11 md:w-12 md:h-12 */}
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                  {item.val > 0 && (
                     <span className="text-[10px] md:text-[11px] font-bold text-primary">
                      {item.val}
                    </span>
                  )}
                </div>
                {/* 标签字号：text-[10px] md:text-xs */}
                <span className="text-[10px] md:text-xs text-textSub font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 区域 3：底部安全垫片 (权重 20)
          这 20% 的高度完全留空，把上面的内容往上推，避开放大镜按钮。
      */}
      <div className="flex-[20] shrink-0 w-full"></div>

    </div>
  );
};
export default Home;
