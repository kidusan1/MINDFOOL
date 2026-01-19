import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ViewName, TimerType, DailyStats, Language, User } from '../types';
import { TIMER_TYPES, playSound, TRANSLATIONS } from '../constants';
import { Icons } from '../components/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import { toPng } from 'html-to-image';
import { supabase } from '../src/supabaseClient';
// 直接注入行楷字体样式
if (typeof document !== 'undefined') {
  const styleId = 'poster-font-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: 'xingkai';
        src: url('/fonts/xingkai.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }
}
const getBeijingDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/\//g, '-');
};
// --- 每日功课入口列表 ---
interface ToolsProps {
  onNavigate: (view: ViewName, params?: any) => void;
  setTimerType: (type: TimerType) => void;
  lang: Language;
}

export const ToolsView: React.FC<ToolsProps> = ({ onNavigate, setTimerType, lang }) => {
  const t = TRANSLATIONS[lang];
  const getToolLabel = (type: TimerType) => {
      switch(type) {
          case TimerType.NIANFO: return t.home.nianfo;
          case TimerType.BAIFO: return t.home.baifo;
          case TimerType.ZENGHUI: return t.home.zenghui;
          default: return '';
      }
  };

  // --- ToolsView 完整布局替换 ---
return (
  <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center px-6">
    {/* 🟢 顶部：手机版固定 32px(h-8) 确保靠上；电脑版(md)变为弹性弹簧实现居中 */}
    <div className="h-8 md:flex-grow shrink-0 w-full"></div>

    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 content-center">
          {TIMER_TYPES.map((tool) => (
          <button
              key={tool.type}
              onClick={() => {
                  playSound('medium');
                  setTimerType(tool.type);
                  onNavigate(ViewName.TIMER);
              }}
              className="aspect-square bg-cloud rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow border border-white/50"
          >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${tool.color}33`, color: tool.color }}>
              <Icons.Play size={20} fill="currentColor" />
              </div>
              <span className="text-textSub font-medium text-sm tracking-[0.3em]">{getToolLabel(tool.type)}</span>
          </button>
          ))}

          <button
          onClick={() => {
              playSound('medium');
              onNavigate(ViewName.BREATHING);
          }}
          className="aspect-square bg-cloud rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow border border-white/50"
          >
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary mb-2">
              <Icons.Breathing size={20} />
          </div>
          <span className="text-textSub font-medium text-sm tracking-[0.3em]">{t.tools.breathing}</span>
          </button>

          <button
          onClick={() => {
              playSound('medium');
              onNavigate(ViewName.STATS);
          }}
          className="col-span-2 md:col-span-4 bg-gradient-to-r from-[#E8F1F5] to-cloud rounded-2xl p-4 flex items-center justify-between shadow-sm border border-white/50 mt-1"
          >
          <span className="text-textSub font-medium ml-2 text-sm tracking-[0.3em]">{t.tools.stats}</span>
          <div className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-primary shadow-sm mr-2">
              <Icons.Stats size={16} />
          </div>
          </button>
      </div>
    </div>

    {/* 🟢 底部：电脑版弹簧(配合顶部实现正居中) + 手机版超大垫片(确保不被放大镜遮挡) */}
    <div className="hidden md:flex md:flex-grow shrink-0 w-full"></div>
    <div className="h-48 md:h-12 shrink-0 w-full"></div>
  </div>
);
};

// --- 呼吸跟随 ---
interface BreathingViewProps {
  onAddMinutes?: (minutes: number) => void;
  lang: Language;
}

export const BreathingView: React.FC<BreathingViewProps> = ({ onAddMinutes, lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'In' | 'Hold1' | 'Out' | 'Hold2'>('In');
  const [text, setText] = useState('吸');
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cycle = useRef([
    { phase: 'In', duration: 4000, text: lang === 'en' ? 'Inhale' : '吸气' },
    { phase: 'Hold1', duration: 4000, text: lang === 'en' ? 'Hold' : '屏息' },
    { phase: 'Out', duration: 4000, text: lang === 'en' ? 'Exhale' : '呼气' },
    { phase: 'Hold2', duration: 4000, text: lang === 'en' ? 'Hold' : '屏息' },
  ]).current;

  useEffect(() => {
      cycle[0].text = lang === 'en' ? 'Inhale' : '吸气';
      cycle[1].text = lang === 'en' ? 'Hold' : '屏息';
      cycle[2].text = lang === 'en' ? 'Exhale' : '呼气';
      cycle[3].text = lang === 'en' ? 'Hold' : '屏息';
  }, [lang]);

  const runCycle = (stepIndex: number) => {
    const currentStep = cycle[stepIndex % 4];
    setPhase(currentStep.phase as any);
    setText(currentStep.text);
    timeoutRef.current = setTimeout(() => {
      runCycle(stepIndex + 1);
    }, currentStep.duration);
  };

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      runCycle(0);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('In');
      setText(lang === 'en' ? 'Ready' : '准备');
      
      // --- 修复开始：确保不报错且逻辑准确 ---
      if (startTimeRef.current && onAddMinutes) {
          const durationSec = (Date.now() - startTimeRef.current) / 1000;
          // 只要超过 55 秒，就计入功课
          if (durationSec >= 55) {
             const mins = Math.max(1, Math.round(durationSec / 60));
             onAddMinutes(mins);
          } else {
             console.log("⏱️ 呼吸时间不足 1 分钟，不予计入");
          }
          startTimeRef.current = null;
      }
      // --- 修复结束 ---
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isActive, lang]);

  const MAX_SIZE = 270;
  const getScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'In': return 1.5;
      case 'Hold1': return 1.5;
      case 'Out': return 0.5;
      case 'Hold2': return 0.5;
      default: return 1;
    }
  };

  const getTransitionDuration = () => (phase === 'In' || phase === 'Out') ? '4000ms' : '0ms';

  return (
    <div className="h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center min-h-[500px]">
      <div className="relative flex items-center justify-center mb-8" style={{ width: MAX_SIZE, height: MAX_SIZE }}>
        <div 
          className="rounded-full bg-secondary/50 backdrop-blur-sm shadow-[0_0_40px_rgba(169,198,207,0.4)] flex items-center justify-center transition-all"
          style={{ width: '180px', height: '180px', transform: `scale(${getScale()})`, transitionDuration: getTransitionDuration() }}
        >
          <div className={`absolute inset-0 rounded-full border border-primary/20 ${isActive ? 'animate-pulse' : ''}`}></div>
        </div>
      </div>
      <div className="h-10 flex items-center justify-center mb-8">
         <h2 className="text-3xl font-light text-primary tracking-widest">{text}</h2>
      </div>
      <button onClick={() => { playSound('confirm'); setIsActive(!isActive); }} className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
        {isActive ? <Icons.Pause size={28} /> : <Icons.Play size={28} className="ml-1" />}
      </button>
    </div>
  );
};

// --- 功课计时 ---
interface TimerViewProps {
  type: TimerType;
  onAddMinutes?: (minutes: number) => void;
  lang: Language;
}
export const TimerView: React.FC<TimerViewProps> = ({ type, onAddMinutes, lang }) => {
  const t = TRANSLATIONS[lang];
  const isBaifo = type === TimerType.BAIFO;

  let typeLabel = '';
  switch(type) {
      case TimerType.NIANFO: typeLabel = t.home.nianfo; break;
      case TimerType.BAIFO: typeLabel = t.home.baifo; break;
      case TimerType.ZENGHUI: typeLabel = t.home.zenghui; break;
      case TimerType.BREATH: typeLabel = t.home.breath; break;
  }

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdownTarget, setCountdownTarget] = useState(20);
  const [countdownRemaining, setCountdownRemaining] = useState(20 * 60);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [needUserToStartAlarm, setNeedUserToStartAlarm] = useState(false);
  const [isAlarmUnlocked, setIsAlarmUnlocked] = useState(false);
  
  const effectiveSecondsRef = useRef<number>(0);
  // 🔴 新增：记录点击开始时的精确物理时刻
  const physicalStartTimeRef = useRef<number | null>(null);
  // 🟢 精准新增：记录这一段计时中已经存入数据库的分钟数
  const accumulatedMinsRef = useRef<number>(0); 
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);
  


  // --- 1. 闹铃核心逻辑：解决停不掉和 iPhone 没声 ---
  const startAlarmSound = () => {
    setIsAlarmActive(true);
    const audio = document.getElementById('alarm-audio') as HTMLAudioElement;
    if (audio) {
      audio.muted = false;
      audio.volume = 1.0; 
      // 🟢 修复：确保使用英文分号 ;
      audio.play().catch(e => console.log("播放失败", e));
    }
  };
  const stopAlarmSound = () => {
    const audio = document.getElementById('alarm-audio') as HTMLAudioElement;
    if (audio) {
      audio.pause(); 
      audio.currentTime = 0; 
    }
    setIsAlarmActive(false);
    setIsCountdownRunning(false);
    setCountdownRemaining(countdownTarget * 60);
  };

  // --- 2. 交互逻辑：长按重置 ---
  const handleReset = (mode: 'up' | 'down') => {
    playSound('medium');
    // 重置所有状态
    physicalStartTimeRef.current = null; // 🔴 清除锚点
    effectiveSecondsRef.current = 0;   // 🔴 清除累加器
    effectiveSecondsRef.current = 0;

    if (mode === 'up') {
      setIsRunning(false);
      setSeconds(0);
    } else {
      setIsCountdownRunning(false);
      setCountdownRemaining(countdownTarget * 60);
      stopAlarmSound();
    }
  };

  const startPress = (mode: 'up' | 'down') => {
    longPressTimerRef.current = setTimeout(() => handleReset(mode), 800);
  };
  const endPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  // 🟢 统合后的唯一计时心脏：处理 UI、自动存分、唤醒对账、退出补录
useEffect(() => {
  let timer: any;

  const syncMinutes = () => {
    // 只要有任何一个计时器在跑，就根据物理时间对账
    const isAnyActive = isRunning || isCountdownRunning;
    
    if (isAnyActive && physicalStartTimeRef.current) {
      const now = Date.now();
      const elapsedSecs = Math.floor((now - physicalStartTimeRef.current) / 1000);
      const totalMinsEligible = Math.floor(elapsedSecs / 60);
      const gap = totalMinsEligible - accumulatedMinsRef.current;
      
      if (gap > 0) {
        onAddMinutes?.(gap);
        accumulatedMinsRef.current = totalMinsEligible;
      }
    }
  };

  if (isRunning || isCountdownRunning) {
    if (!physicalStartTimeRef.current) {
      physicalStartTimeRef.current = Date.now();
    }
    
    timer = setInterval(() => {
      // --- UI 同步逻辑 ---
      const now = Date.now();
      const elapsedSecs = Math.floor((now - physicalStartTimeRef.current!) / 1000);
      
      if (isRunning) setSeconds(elapsedSecs);
      
      if (isCountdownRunning) {
        const remain = (countdownTarget * 60) - elapsedSecs;
        if (remain <= 0) {
          setCountdownRemaining(0);
          if (!isAlarmActive) startAlarmSound();
        } else {
          setCountdownRemaining(remain);
        }
      }
      // --- 自动对账 ---
      syncMinutes(); 
    }, 1000);
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') syncMinutes();
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // 🔴 退出补录逻辑：只在这里处理一次，最干净
  return () => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibility);
    
    if (physicalStartTimeRef.current) {
      const now = Date.now();
      const elapsedSecs = Math.floor((now - physicalStartTimeRef.current) / 1000);
      
      // 55秒补偿原则
      const extra = (elapsedSecs % 60 >= 55) ? 1 : 0;
      const finalMins = Math.floor(elapsedSecs / 60) + extra;
      const finalGap = finalMins - accumulatedMinsRef.current;
      
      if (finalGap > 0) {
        onAddMinutes?.(finalGap);
      }
      
      // 如果此时没有计时器在跑了（即用户点击了停止），才清空锚点
      // 如果用户只是切换页面但计时器没停，锚点会保留（取决于你 App 的 State 结构）
      if (!isRunning && !isCountdownRunning) {
         physicalStartTimeRef.current = null;
         accumulatedMinsRef.current = 0;
      }
    }
  };
}, [isRunning, isCountdownRunning, countdownTarget, isAlarmActive, onAddMinutes]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 4. 终极布局结构：解决居中与滑动 ---
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center px-6">
  {/* 手机版固定小高度(h-8)，电脑版变成弹簧(flex-grow)实现居中 */}
   <div className="flex-grow shrink-0 w-full"></div>

    <div className="w-full md:max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 shrink-0 pt-4 md:pt-0">
      
              {/* 正计时卡片 */}
        <div className="flex flex-col items-center justify-center w-full md:flex-1 md:max-w-[420px] md:h-[380px] p-6 md:p-8 bg-cloud rounded-[2.5rem] border border-white/60 shadow-sm min-h-[300px]">
          <h2 className="text-sm md:text-base font-medium text-textSub tracking-[0.2em] mb-2">{typeLabel}</h2>
          <div className="text-6xl font-semibold text-primary tracking-tighter tabular-nums my-8 tabular-nums">{formatTime(seconds)}</div>
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => { playSound('confirm'); setIsRunning(!isRunning); }}
              onMouseDown={() => startPress('up')} onMouseUp={endPress} onTouchStart={() => startPress('up')} onTouchEnd={endPress}
              className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl transition-all ${isRunning ? 'bg-primary' : 'bg-gray-400'}`}
            >
              {isRunning ? <Icons.Pause size={28} /> : <Icons.Play size={28} className="ml-1" />}
            </button>
            <p className="text-[10px] text-gray-400 font-light tracking-widest uppercase mt-1">
              {lang === 'zh' ? '长按归零' : 'Hold to Reset'}
            </p>
          </div>
        </div>

        {isBaifo && (
          <>
            <div className="hidden md:block w-px h-64 bg-gray-200 shrink-0"></div>

{/* 倒计时卡片 */}
            <div className="flex flex-col items-center justify-center w-full md:flex-1 md:max-w-[420px] md:h-[380px] p-6 md:p-8 bg-cloud rounded-[2.5rem] border border-white/60 shadow-sm min-h-[300px] relative">
                <h2 className="text-sm md:text-base font-medium text-textSub tracking-[0.2em] mb-2">{t.tools.timer.countdown}</h2>
                <div className="flex items-center gap-4 my-8">
                {!isCountdownRunning && !isAlarmActive && (
  <button 
    onClick={() => {
      // 逻辑：如果当前 <= 5分，直接降到 1分；否则减 5
      const next = countdownTarget <= 5 ? 1 : countdownTarget - 5;
      setCountdownTarget(next);
      setCountdownRemaining(next * 60);
    }} 
    className="w-8 h-8 rounded-full border border-secondary flex items-center justify-center"
  >
    -
  </button>
)}
 <div className={`text-6xl font-semibold tracking-tighter tabular-nums ${isAlarmActive ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
  {isCountdownRunning ? (
    formatTime(countdownRemaining)
  ) : isAlarmActive ? (
    '00:00'
  ) : (
    <div className="flex items-baseline justify-center">
      {/* 数字部分 */}
      <span>{countdownTarget}</span>
      {/* 单位部分：上调至 4xl，并微调透明度 */}
      <span className="text-4xl ml-1.5 font-semibold opacity-90">
        {lang === 'zh' ? '分' : 'm'}
      </span>
    </div>
  )}
</div>

{!isCountdownRunning && !isAlarmActive && (
  <button 
    onClick={() => {
      // 逻辑：如果当前是 1分，直接跳到 5分；否则加 5
      const next = countdownTarget === 1 ? 5 : countdownTarget + 5;
      setCountdownTarget(next);
      setCountdownRemaining(next * 60);
}} 
className="w-8 h-8 rounded-full border border-secondary flex items-center justify-center"
>
+
</button>
)}
</div>               
<div className="flex flex-col items-center gap-2 w-full">
                
{isAlarmActive ? (
<button onClick={stopAlarmSound} className="w-full max-w-[200px] py-4 bg-red-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2 text-sm animate-pulse">
<Icons.Cancel size={18} /> {lang === 'zh' ? '停止' : 'Stop Alarm'}
</button>
) : (
<>

<button 
onClick={() => {
const audio = document.getElementById('alarm-audio') as HTMLAudioElement;
if (audio && !isCountdownRunning) {
 // 🟢 预热激活：在点击开始的瞬间，让它以极小音量播一下
audio.muted = true;
audio.play().then(() => {
// 保持 play 状态，但声音关死
audio.volume = 0; 
  }).catch(e => console.log("预热被拦截", e));
}else if (audio && isCountdownRunning) {
  audio.pause();
}
setIsCountdownRunning(!isCountdownRunning); 
}}
onMouseDown={() => startPress('down')} onMouseUp={endPress} onTouchStart={() => startPress('down')} onTouchEnd={endPress}
className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl transition-all ${isCountdownRunning ? 'bg-primary' : 'bg-gray-400'}`}
>
{isCountdownRunning ? <Icons.Pause size={28} /> : <Icons.Play size={28} className="ml-0.5" />}
 </button>
   <p className="text-[10px] text-gray-400 font-light tracking-widest uppercase mt-1">
       {lang === 'zh' ? '长按归零' : 'Hold to Reset'}
        </p>
        </>
         )}
                </div>
            </div>
          </>
        )}
      </div>
{/* 电脑端底部弹簧 */}
      <div className="hidden md:flex md:flex-grow shrink-0 w-full"></div>
      {/* 手机端安全垫片：确保滑到底部不被放大镜遮挡 */}
      <div className="flex-grow shrink-0 w-full"></div>
      <div className="h-32 shrink-0 md:hidden"></div>
    {/* loop 属性让它无限循环，muted={false} 配合 volume=0 躲避拦截 */}
  <audio id="alarm-audio" preload="auto" loop src="alarm.mp3"></audio>
    </div>
  );
};

// --- 数据统计 ---
export const StatsView: React.FC<{ 
  stats: DailyStats, 
  history?: Record<string, number>, 
  lang: Language, 
  user: User | null, 
  homeQuotes: string[], 
  allUsersStats: Record<string, Partial<DailyStats>>;

  rankPercentage: number 
}> = ({ 
  stats, 
  history = {}, 
  lang, 
  user, 
  homeQuotes, 
  allUsersStats = {}, 
  rankPercentage 
}) => {
  const t = TRANSLATIONS[lang].stats;
  
  const [showPoster, setShowPoster] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const listData = [
    { name: TRANSLATIONS[lang].home.nianfo, value: stats.nianfo, color: '#6D8D9D' },
    { name: TRANSLATIONS[lang].home.baifo, value: stats.baifo, color: '#AEC6CF' },
    { name: TRANSLATIONS[lang].home.zenghui, value: stats.zenghui, color: '#B5D9AD' }, 
    { name: TRANSLATIONS[lang].home.breath, value: stats.breath, color: '#94A3B8' },
  ];

  const completedItems = listData.filter(d => d.value >= 1);
  const totalMinutes = stats.nianfo + stats.baifo + stats.zenghui + stats.breath;

  // 实时排名计算：使用全局拉取的所有用户数据 删掉了



// --- 修改后的逻辑：从“昨天”起倒推 7 天 ---
const weeklyData = Array.from({length: 7}, (_, i) => {
  const today = new Date();
  // 基于本地时间创建日期对象，避免时区偏移
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - (7 - i)); 
  
  // 生成 YYYY-MM-DD 格式，确保与 App.tsx 的 getBeijingDateString 匹配
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const val = history[dateKey] || 0;
  const dayMap = lang === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] 
    : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  return { name: dayMap[d.getDay()], min: val };
});

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-4 pb-24 md:pb-0 relative">
      <div className="bg-cloud rounded-3xl p-6 shadow-sm border border-white/50 text-center">
        <div className="inline-block text-left max-w-full">
            {completedItems.length > 0 ? (
            <p className="text-textSub text-sm leading-loose">
                {t.encouragement_prefix}{' '}
                {completedItems.map((item, i) => (
                    <span key={item.name}>
                        <span style={{ color: item.color, fontWeight: 'bold' }}>{item.name}</span>
                        {i < completedItems.length - 1 ? (lang === 'en' ? ', ' : '、') : ''}
                    </span>
                ))}
                {t.encouragement_suffix}
            </p>
            ) : (
            <p className="text-textSub text-sm">{t.encouragement_empty}</p>
            )}
        </div>
        <div className="mt-4 pt-4 border-t border-white text-center">
            <div className="inline-block text-left max-w-full">
                <p className="text-xs text-textSub leading-relaxed">{t.ranking.replace('%s', rankPercentage.toString())}</p>
            </div>
        </div>
      </div>

      <div className="bg-cloud rounded-3xl p-4 shadow-sm border border-white/50">
        <h3 className="text-xs font-medium text-textSub mb-2">{t.trend}</h3>
        <div className="h-40 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><XAxis dataKey="name" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} /><Bar dataKey="min" fill="#6D8D9D" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={true} /></BarChart></ResponsiveContainer></div>
      </div>

      <div className="space-y-2">
        {listData.map((item) => (
          <div key={item.name} className="flex items-center justify-between bg-cloud p-3 rounded-xl border border-white/50">
             <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div><span className="text-textSub text-sm font-medium">{item.name}</span></div>
             <span className="text-primary font-bold text-sm">{item.value} <span className="text-[10px] font-normal text-textSub">{TRANSLATIONS[lang].home.minutes}</span></span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-6 pb-4">
          <button 
            onClick={() => { playSound('confirm'); setShowPoster(true); }}
            className="group relative flex items-center gap-3 px-12 py-4 bg-primary text-white rounded-[2rem] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 overflow-hidden"
          >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Icons.Plus size={18} className="rotate-0" />
              <span className="font-bold tracking-widest text-sm uppercase">{t.share}</span>
          </button>

          <div className="flex items-center gap-3 bg-cloud/50 px-4 py-2 rounded-full border border-white/50">
             <span className="text-xs text-textSub font-medium">{showDetails ? t.hideDetails : t.showDetails}</span>
             <button 
                onClick={() => { playSound('light'); setShowDetails(!showDetails); }}
                className={`w-10 h-5 rounded-full transition-colors relative ${showDetails ? 'bg-primary' : 'bg-gray-300'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showDetails ? 'left-6' : 'left-1'}`}></div>
             </button>
          </div>
      </div>

      {showPoster && (
          <PosterModal onClose={() => setShowPoster(false)} lang={lang} stats={stats} user={user} homeQuotes={homeQuotes} showDetails={showDetails} />
      )}
    </div>
  );
};

const PosterModal: React.FC<{ onClose: () => void, lang: Language, stats: DailyStats, user: User, homeQuotes: string[], showDetails: boolean }> = ({ onClose, lang, stats, user, homeQuotes, showDetails }) => {
    //const t = TRANSLATIONS[lang].stats;
    const [imageUri, setImageUri] = useState<string | null>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    const completedItems = [
        { name: TRANSLATIONS[lang].home.nianfo, val: stats.nianfo },
        { name: TRANSLATIONS[lang].home.baifo, val: stats.baifo },
        { name: TRANSLATIONS[lang].home.zenghui, val: stats.zenghui },
        { name: TRANSLATIONS[lang].home.breath, val: stats.breath }
    ].filter(i => i.val >= 1);

    const dailyQuote = useMemo(() => {
        if (!homeQuotes || homeQuotes.length === 0) return '';
        const dateStr = new Date().toISOString().split('T')[0];
        const seed = user.id + dateStr;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        return homeQuotes[Math.abs(hash | 0) % homeQuotes.length];
    }, [user.id, homeQuotes]);

    const { quoteText, quoteSource } = useMemo(() => {
        if (!dailyQuote.includes('——')) return { quoteText: dailyQuote, quoteSource: '' };
        const parts = dailyQuote.split('——');
        return { quoteText: parts[0].trim(), quoteSource: '—— ' + parts[1].trim() };
    }, [dailyQuote]);

    const dateStr = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const zenText = useMemo(() => {
        const phrasesZh = ["真心", "吃茶去", "一食顷", "莫妄想", "止观", "观自在", "不二", "一念"];
        const hash = user.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return phrasesZh[(hash + new Date().getDate()) % phrasesZh.length];
    }, [user.name]);

   // 底纹
useEffect(() => {
  if (posterRef.current) {
      setTimeout(() => {
          toPng(posterRef.current!, { 
              cacheBust: true, 
              pixelRatio: 3, // 提高采样率，确保细微底纹被抓取
              backgroundColor: '#F9F8F6', // 强制指定背景色
              style: { fontFamily: "'xingkai', serif" } // 再次注入字体
          })
          .then((dataUrl) => {
              setImageUri(dataUrl);
          })
          .catch((err) => {
              console.error('oops, something went wrong!', err);
          });
      }, 800); // 延迟稍微拉长到 800ms，给字体留足时间
  }
}, [showDetails, lang]);

    const blueBoxText = useMemo(() => {
      const items = completedItems.map(i => i.name).join(lang === 'zh' ? '、' : ', ');
      if (lang === 'zh') {
          return `今天我已完成 ${items}，回向大家色身康泰、福慧增长、道业增上，世间法所求如愿，随喜赞叹各位伙伴！`;
      } else {
          return `I have completed ${items} today. Dedicated to everyone’s well-being, blessings, wisdom, and spiritual growth. May all wishes be fulfilled. Rejoicing in all！`;
      }
  }, [completedItems, lang]);

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm flex flex-col gap-4 py-8">
              
              <button 
                  onClick={onClose} 
                  className="absolute -bottom-4 right-0 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all z-[110] shadow-lg border border-white/20"
              >
                  <Icons.Plus size={24} className="rotate-45" />
              </button>

              <div className="relative w-full overflow-hidden rounded-lg shadow-2xl">
  {imageUri ? (
    <img 
      src={imageUri} 
      alt="Practice Summary Poster" 
      className="w-full h-auto select-all"
      style={{ pointerEvents: 'auto' }}
    />
  ) : (
    <div className="w-full aspect-[9/12] bg-[#F9F8F6] flex items-center justify-center">
      <span className="text-primary text-[10px] md:text-xs animate-bounce font-medium tracking-widest uppercase">
        {/* ⚡️ 修复点：直接写逻辑，不要再套一层 {} */}
        {lang === 'zh' ? '分享海报生成中...' : 'Generating Poster...'}
      </span>
    </div>
  )}

                  {/* --- 这里是生成的实际海报节点 --- */}
                  <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none" style={{ width: '450px' }}>
                      <div 
                          ref={posterRef}
                          className="bg-[#F9F8F6] flex flex-col overflow-hidden border-[15px] border-white h-auto relative"
                      >
                         {/* 书法底纹层 (恢复旧版隶书位移) */}
                         <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.035] z-0 px-2 overflow-hidden"style={{ fontFamily: "'xingkai', serif" }}>
                              <div className="flex flex-col items-center justify-center leading-none tracking-tighter -space-y-32">
                                  {zenText.length === 3 ? (
                                      zenText.split('').map((char, i) => (
                                          <span 
                                            key={i} 
                                            className="text-[25rem] font-[1000] inline-block"
                                            style={{ transform: `translateX(${i === 1 ? '4.2rem' : '-4.2rem'})` }}
                                          >
                                              {char}
                                          </span>
                                      ))
                                  ) : (
                                      zenText.split('').map((char, i) => (
                                          <span key={i} className="text-[25rem] font-[1000]">{char}</span>
                                      ))
                                  )}
                              </div>
                          </div>

          {/* 内容展示层 */}
          <div className="p-10 flex flex-col gap-8 relative z-10 overflow-hidden h-full">
                              {/* A. 引用名句区域 */}
                              <div className="pt-2">
                                  <p className="text-lg text-textMain/80 leading-loose text-left font-extralight tracking-wide">{quoteText}</p>
                                  {quoteSource && (
                                      <p className="text-base text-textMain/80 text-right mt-1 font-extralight">
                                          <span className="tracking-[-0.15em] font-thin inline-block mr-1">——</span> {quoteSource.replace('—— ', '')}
                                      </p>
                                  )}
                              </div>
                            
                              {/* B. 慢心障道装饰栏 */}
                              <div className="flex flex-col items-center justify-center bg-white/5 rounded-lg py-3">
                                  <span className="text-[15px] tracking-[0.4em] font-medium text-textMain mb-1 opacity-80 uppercase whitespace-nowrap">
                                      慢心障道
                                  </span>
                                  <div className="flex justify-center w-full text-[13px] tracking-[0.15em] font-bold text-gray-400 uppercase">
                                      <span>{dateStr}</span>
                                  </div>
                              </div>

                              {/* C. 功课数据 + 回向文字区域 */}
                              {showDetails && (
                              <div className="flex flex-col justify-center gap-8">
                                  {/* 功课详情：横向平铺布局 */}
                                  <div className="flex flex-row flex-wrap justify-center gap-x-10 gap-y-4 px-2">
                                      {completedItems.map((item, idx) => ( 
                                          <div key={idx} className="flex flex-col items-center">
                                              <span className="text-[11px] text-primary font-bold uppercase tracking-widest leading-none mb-2 whitespace-nowrap">{item.name}</span>
                                              <div className="flex items-baseline gap-1">
                                                  <span className="text-4xl font-light text-black tracking-tighter leading-none">{item.val}</span>
                                                  <span className="text-[11px] text-gray-400 font-medium tracking-tighter uppercase">
                                                      {lang === 'zh' ? '分' : 'MINS'}
                                                  </span>
                                              </div>
                                          </div> 
                                      ))}
                                  </div>
                                  {/* 蓝色回向框 */}
                                  <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-3xl border border-primary/20 justify-center"> 
                                  <p className="inline-block mx-auto text-[14px] leading-relaxed font-light text-primary tracking-wide opacity-90 text-left">
                                  {blueBoxText}
                                   </p>
                                  </div>
                              </div>
                              )}

                              {/* D. 底部签名区域 (紧凑对齐) */}
                              <div className="flex justify-between items-end pb-3 border-b border-black/[0.05] mt-auto">
                                  <div className="flex flex-col items-start">
                                      <h3 className="text-2xl font-light text-textMain/80 tracking-tighter leading-none">
                                          {user.name}
                                      </h3>
                                      <span className="text-[10px] text-gray-400 mt-1 uppercase whitespace-nowrap leading-none">
                                          {user.classVersion}
                                      </span>
                                  </div>
                                  <div className="w-12 h-px bg-black/20 mb-2"></div>
                              </div>

                              {/* E. 底部 Logo */}
                              <div className="flex justify-center py-2 opacity-20 shrink-0">
                                  <span className="text-[16px] font-bold tracking-[0.6em] text-textMain">MINDFOOL</span>
                              </div>
                          </div> {/* 结束 p-10 内容展示层 */}
                      </div> {/* 4. 闭合 posterRef (白底海报主体) */}
                  </div> {/* 5. 闭合 absolute -z-50 (隐藏生成区) */}
            </div> {/* 6. 闭合 relative overflow-hidden (图片展示区) */}

            {/* 在 PosterModal 组件返回的 JSX 中 */}
<div className="relative w-full overflow-hidden rounded-lg shadow-2xl">
    {/* ... 图片显示逻辑 ... */}
</div> 

{/* 文字提示贴在这里 */}
<p className="text-white/60 text-[11px] text-center px-10 animate-pulse tracking-widest uppercase mt-4">
    <span className="block md:hidden">
        {lang === 'zh' ? '可长按保存/分享' : 'Long press to save/share'}
    </span>
    <span className="hidden md:block">
        {lang === 'zh' ? '可右键保存/分享' : 'Right-click to save/share'}
    </span>
</p>

          </div> {/* 7. 闭合 relative w-full max-w-sm (居中容器) */}
      </div> 
   );
};