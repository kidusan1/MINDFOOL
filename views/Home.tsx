
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
       md:justify-center 是关键，它确保电脑端内容整体在屏幕中心
    */
    <div className="h-[calc(100vh-140px)] w-full flex flex-col md:justify-center items-center px-6 md:px-12 animate-fade-in overflow-hidden relative">
      
      {/* 🟢 手机端采用 90% 逻辑，电脑端维持自然居中 */}
      <div className="flex-[90] md:flex-none w-full flex flex-col items-center justify-center min-h-0 relative">
        
        {/* 1. 名句区：带 Apple Spring 果冻动效 */}
        <div 
          className="w-full max-w-[480px] px-4 flex flex-col items-center justify-center shrink-1" 
          style={{ 
            opacity: 0,
            /* 苹果风格：从上方掉落 + 阻尼回弹 */
            animation: 'appleSpringDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards'
          }}
        >
          <style>{`
  @keyframes appleSpringDown {
    0% { 
      opacity: 0; 
      transform: translateY(-50px) scale(0.98); /* 掉落起点：形变极小 */
    }
    50% {
      opacity: 1;
      transform: translateY(6px) scale(1.005); /* 落地：过冲仅6px，比例变化仅0.5% */
    }
    75% {
      transform: translateY(-2px) scale(0.998); /* 二次回弹：肉眼难察的轻微震颤 */
    }
    90% {
      transform: translateY(0.5px); /* 三次余震：模拟物理惯性 */
    }
    100% { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }

  .apple-spring {
    /* 时间控制在 0.55s，利落且富有生命力 */
    animation: appleSpringDown 0.55s cubic-bezier(0.23, 1, 0.32, 1) 0.2s forwards;
  }
`}</style>
          
          <div className="w-16 h-[1px] bg-black/[0.05] mb-6 md:mb-8 shrink-0"></div>
          <div className="w-full flex flex-col">
            <p className="text-textMain/80 text-[13px] md:text-[15px] leading-[1.7] tracking-[0.3em] text-justify font-light">
              {text}
            </p>
            {source && (
              <p className="text-textMain/80 text-[13px] md:text-[15px] text-right mt-4 tracking-[0.2em] font-light">
                <span className="mr-1 tracking-[-0.15em] font-extralight inline-block">——</span> {source}
              </p>
            )}
          </div>
          <div className="w-16 h-[1px] bg-black/[0.05] mt-6 md:mt-8 shrink-0"></div>
        </div>

        {/* ⚡️ 间距控制：
            - 手机端: flex-grow 自动撑开，保证在 90% 空间内平衡
            - 电脑端: md:h-12 固定间距，防止两个组件离得太远，保持之前满意的紧凑感
        */}
        <div className="flex-grow md:flex-none md:h-12 max-h-[60px] min-h-[20px] w-full"></div>

        {/* 2. 卡片区：严格保持原本样式 */}
        <div className="w-full flex flex-col items-center shrink-0">
          <div 
            onClick={() => onNavigate(ViewName.TOOLS)}
            className="w-full max-w-lg bg-cloud rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.95] cursor-pointer shadow-none border border-white/40"
          >
            <h2 className="text-textSub text-[10px] md:text-xs font-medium tracking-[0.2em] mb-3 uppercase">
              {t.durationLabel}
            </h2>
            
            <div className="flex items-baseline gap-2 mb-6">
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
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/[0.03] border border-black/[0.01] flex items-center justify-center transition-all">
                    {item.val > 0 && (
                      <span className="text-[10px] md:text-[12px] font-bold text-primary">
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

      {/* 🟢 安全区 (10%)：
          md:hidden 确保电脑端完全不加载这个占位符，从而让内容真正垂直居中
      */}
      <div className="flex-[10] md:hidden shrink-0 w-full min-h-[70px]"></div>

    </div>
  );
};
export default Home;
