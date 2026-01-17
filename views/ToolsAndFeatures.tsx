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

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-4 flex flex-col justify-center">
      <div className="flex flex-col gap-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 content-center h-full">
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
    { phase: 'In', duration: 4000, text: lang === 'en' ? 'In' : '吸' },
    { phase: 'Hold1', duration: 6000, text: lang === 'en' ? 'Hold' : '持' },
    { phase: 'Out', duration: 4000, text: lang === 'en' ? 'Out' : '呼' },
    { phase: 'Hold2', duration: 6000, text: lang === 'en' ? 'Hold' : '持' },
  ]).current;

  useEffect(() => {
      cycle[0].text = lang === 'en' ? 'In' : '吸';
      cycle[1].text = lang === 'en' ? 'Hold' : '持';
      cycle[2].text = lang === 'en' ? 'Out' : '呼';
      cycle[3].text = lang === 'en' ? 'Hold' : '持';
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

  // --- 状态保留 ---
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdownTarget, setCountdownTarget] = useState(20);
  const [countdownRemaining, setCountdownRemaining] = useState(20 * 60);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  // --- 新增：核心计时沙漏 ---
  const effectiveSecondsRef = useRef<number>(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // ✅ 核心功能 1：闹铃逻辑 (完全保留你原来的逻辑)
  const startAlarmSound = () => {
    try {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        for (let i = 0; i < 120; i++) {
            const start = now + i * 1.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
            gain.gain.linearRampToValueAtTime(0, start + 0.15);
            gain.gain.setValueAtTime(0, start + 0.25);
            gain.gain.linearRampToValueAtTime(0.4, start + 0.3);
            gain.gain.linearRampToValueAtTime(0, start + 0.4);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscillatorRef.current = osc;
        setIsAlarmActive(true);
    } catch (e) { console.error('Failed to start alarm', e); }
  };

  const stopAlarmSound = () => {
    if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(e) {}
        oscillatorRef.current = null;
    }
    setIsAlarmActive(false);
    setIsCountdownRunning(false);
    setCountdownRemaining(countdownTarget * 60);
  };

  // ✅ 核心功能 2：心脏脉冲计时 (整合去重、自动保存、离开保底)
  useEffect(() => {
    let timer: any;
    if (isRunning || isCountdownRunning) {
      timer = setInterval(() => {
        // 1. 只要任意一个在跑，沙漏就加 1 秒（实现去重）
        effectiveSecondsRef.current += 1;

        // 2. 每满 60 秒自动保存一次（实现保底）
        if (effectiveSecondsRef.current >= 60) {
          onAddMinutes?.(1);
          effectiveSecondsRef.current = 0;
          console.log("⏱️ 已满 1 分钟，数据自动同步");
        }

        // 3. 处理倒计时数字展示
        if (isCountdownRunning) {
          setCountdownRemaining(prev => {
            if (prev <= 1) {
              if (effectiveSecondsRef.current >= 10) onAddMinutes?.(1); // 最后的残余
              effectiveSecondsRef.current = 0;
              startAlarmSound();
              return 0;
            }
            return prev - 1;
          });
        }

        // 4. 处理正计时数字展示
        if (isRunning) {
          setSeconds(s => s + 1);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isCountdownRunning, onAddMinutes]);

  // ✅ 核心功能 3：切页/返回保底
  useEffect(() => {
    return () => {
      // 离开组件时，剩下的沙漏超过 30 秒补 1 分钟
      if (effectiveSecondsRef.current >= 30) {
        onAddMinutes?.(1);
        effectiveSecondsRef.current = 0;
      }
      if (oscillatorRef.current) oscillatorRef.current.stop();
    };
  }, [onAddMinutes]);

  // ✅ 核心功能 4：长按归零处理
  const handleReset = (mode: 'up' | 'down') => {
    playSound('medium');
    if (effectiveSecondsRef.current >= 10) {
      onAddMinutes?.(1);
      effectiveSecondsRef.current = 0;
    }
    if (mode === 'up') {
      setIsRunning(false);
      setSeconds(0);
    } else {
      setIsCountdownRunning(false);
      setCountdownRemaining(countdownTarget * 60);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const adjustCountdown = (delta: number) => {
    if (isCountdownRunning || isAlarmActive) return;
    let next = Math.max(1, Math.min(120, countdownTarget + delta));
    setCountdownTarget(next);
    setCountdownRemaining(next * 60);
  };

  // ✅ UI 展示 (包含了 pb-32 解决滑动问题)
  return (
    <div className="min-h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-4 pb-32 w-full px-6 md:px-0">
      <div className="w-full md:max-w-4xl md:mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* 正计时卡片 */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-6 md:p-8 bg-cloud rounded-[2.5rem] border border-white/60 shadow-sm transition-all hover:shadow-md relative">
            <h2 className="text-sm md:text-base font-medium text-textSub tracking-[0.2em] mt-2 mb-2">{typeLabel}</h2>
            <div className="text-6xl font-semibold text-primary tracking-tighter tabular-nums my-4 sm:my-8">{formatTime(seconds)}</div>
            <div className="flex flex-col items-center gap-2">
                <div className="h-4 flex items-center">{!isRunning && seconds === 0 && <p className="text-textSub text-xs animate-pulse">{t.tools.timer.clickStart}</p>}</div>
                <button 
                  onClick={() => { playSound('confirm'); setIsRunning(!isRunning); }} 
                  onContextMenu={(e) => { e.preventDefault(); handleReset('up'); }}
                  className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl active:scale-95 transition-all ${isRunning ? 'bg-primary' : 'bg-gray-400'}`}
                >
                    {isRunning ? <Icons.Pause size={28} /> : <Icons.Play size={28} className="ml-1" />}
                </button>
                <p className="text-[10px] text-gray-300 mt-1">长按归零并保存</p>
            </div>
          </div>

          {isBaifo && (
            <>
                <div className="hidden md:block w-px h-64 bg-gray-200 shrink-0"></div>
                {/* 倒计时卡片 */}
                <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-6 md:p-8 bg-cloud rounded-[2.5rem] border border-white/60 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
                    <h2 className="text-sm md:text-base font-medium text-textSub tracking-[0.2em] mt-2 mb-2">{t.tools.timer.countdown}</h2>
                    <div className="flex items-center gap-4 my-4 sm:my-8">
                        {!isCountdownRunning && !isAlarmActive && <button onClick={() => adjustCountdown(-5)} className="w-8 h-8 rounded-full border border-secondary text-secondary flex items-center justify-center active:bg-secondary/10">-</button>}
                        <div className={`text-6xl font-semibold tracking-tighter tabular-nums ${isAlarmActive ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                            {isCountdownRunning ? formatTime(countdownRemaining) : (isAlarmActive ? '00:00' : `${countdownTarget}${lang === 'zh' ? '分' : ' m'}`)}
                        </div>
                        {!isCountdownRunning && !isAlarmActive && <button onClick={() => adjustCountdown(5)} className="w-8 h-8 rounded-full border border-secondary text-secondary flex items-center justify-center active:bg-secondary/10">+</button>}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 w-full">
                        {isAlarmActive ? (
                            <button onClick={stopAlarmSound} className="w-full max-w-[200px] py-4 bg-red-600 text-white rounded-full font-bold shadow-lg animate-bounce flex items-center justify-center gap-2 text-sm">
                                <Icons.Cancel size={18} /> {lang === 'zh' ? '关闭闹铃' : 'Stop Alarm'}
                            </button>
                        ) : (
                            <>
                                <div className="h-4 flex items-center">{!isCountdownRunning && <p className="text-textSub text-xs animate-pulse">{t.tools.timer.clickStart}</p>}</div>
                                <button 
                                  onClick={() => { playSound('confirm'); setIsCountdownRunning(!isCountdownRunning); }} 
                                  onContextMenu={(e) => { e.preventDefault(); handleReset('down'); }}
                                  className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl active:scale-95 transition-all ${isCountdownRunning ? 'bg-primary' : 'bg-gray-400'}`}
                                >
                                    {isCountdownRunning ? <Icons.Pause size={28} /> : <Icons.Play size={28} className="ml-0.5" />}
                                </button>
                                <p className="text-[10px] text-gray-300 mt-1">长按归零并保存</p>
                            </>
                        )}
                    </div>
                </div>
            </>
          )}
        </div>
      </div>
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
        const phrasesZh = ["真心", "吃茶去", "一食顷", "莫妄想", "止观", "观自在", "不二"];
        const hash = user.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return phrasesZh[(hash + new Date().getDate()) % phrasesZh.length];
    }, [user.name]);

    useEffect(() => {
        if (posterRef.current) {
            setTimeout(() => {
                toPng(posterRef.current!, { cacheBust: true, pixelRatio: 2.5 })
                    .then((dataUrl) => {
                        setImageUri(dataUrl);
                    })
                    .catch((err) => {
                        console.error('oops, something went wrong!', err);
                    });
            }, 500);
        }
    }, [showDetails, lang]);

    const blueBoxText = useMemo(() => {
      const items = completedItems.map(i => i.name).join(lang === 'zh' ? '、' : ', ');
      if (lang === 'zh') {
          return `今天我已完成 ${items}，回向大家色身康泰、福慧增长、道业增上，随喜赞叹各位伙伴！`;
      } else {
          return `I have completed ${items} today. Dedicating this to everyone's health, wisdom, and spiritual progress. Rejoicing in everyone's practice!`;
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
                          <span className="text-primary text-xs animate-bounce font-medium uppercase tracking-widest">Generating Poster...</span>
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
                                  <p className="text-lg text-textMain/80 leading-loose text-left font-light tracking-wide">{quoteText}</p>
                                  {quoteSource && (
                                      <p className="text-base text-textMain/80 text-right mt-1 font-light">
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
                                  <div className="bg-primary/90 p-5 text-white rounded-2xl shadow-lg"> 
                                      <p className="text-base leading-relaxed font-medium">{blueBoxText}</p> 
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