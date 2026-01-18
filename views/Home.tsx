
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
    /* 外层容器：
       - md:justify-center：电脑端垂直居中
       - overflow-y-auto：手机端超长时可滑动
    */
    <div className="h-[calc(100vh-140px)] w-full flex flex-col md:justify-center items-center px-6 md:px-12 animate-fade-in overflow-y-auto no-scrollbar relative">
      
      {/* 🟢 整体包裹区 */}
      <div className="w-full flex flex-col items-center pb-24 md:pb-0">
        
        {/* 1. 名句区：
           - max-h-[45vh] / max-h-[50dvh]：核心改动，锁定最大高度，防止大字体撑爆
           - overflow-y-auto：如果字体实在太大，允许在名句区域内微滚，不挤压下方卡片
        */}
        <div 
          className="w-full max-w-[480px] px-4 flex flex-col items-center justify-center py-6 md:py-12 shrink-0 max-h-[50dvh] overflow-y-auto no-scrollbar" 
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
            /* 优化建议：针对大字体系统，限制最大渲染字号，防止UI崩坏 */
            .quote-text {
              font-size: clamp(12px, 4vw, 15px); /* 👈 更好的优化建议：最小12px，最大15px，随屏幕自适应 */
            }
          `}</style>
          
          <div className="w-24 h-[1px] bg-black/[0.05] mb-4 shrink-0"></div>
          
          <div className="w-full flex flex-col">
            {/* 严格保留您的字号 text-[13px] md:text-[15px] */}
            <p className="quote-text text-textMain/80 text-[13px] md:text-[15px] leading-[1.6] tracking-[0.3em] text-justify font-light">
              {text}
            </p>
            {source && (
              <p className="quote-text text-textMain/80 text-[13px] md:text-[15px] text-right mt-3 tracking-[0.2em] font-light">
                <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
              </p>
            )}
          </div>
          
          <div className="w-24 h-[1px] bg-black/[0.05] mt-4 shrink-0"></div>
        </div>

        {/* 2. 卡片区：自然跟随 */}
        <div className="w-full flex flex-col items-center justify-start shrink-0 mt-4 md:mt-8">
          <div 
            onClick={() => onNavigate(ViewName.TOOLS)}
            /* 严格保留：p-5, rounded-[2.5rem], bg-cloud */
            className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-5 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-none border border-white/40"
          >
            <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-2 uppercase">
              {t.durationLabel}
            </h2>
            
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-5xl md:text-6xl font-semibold text-primary leading-none tabular-nums tracking-tighter">
                {totalMinutes}
              </span>
              <span className="text-xs font-medium text-textSub tracking-widest">{t.minutes}</span>
            </div>

            <div className="flex w-full justify-between items-center px-1">
              {[
                { label: t.nianfo, val: stats.nianfo },
                { label: t.baifo, val: stats.baifo },
                { label: t.zenghui, val: stats.zenghui }, 
                { label: t.breath, val: stats.breath },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 w-1/4">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                    {item.val > 0 && (
                      <span className="text-[10px] md:text-[11px] font-bold text-primary">
                        {item.val}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-textSub font-medium tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 安全垫片：
         - 手机端：pb-24 (在上面包裹层) + 此处 flex-[10] 双重保险，避开放大镜
         - 电脑端：hidden 直接移除
      */}
      <div className="flex-[10] shrink-0 w-full md:hidden"></div>

    </div>
  );
};
export default Home;
