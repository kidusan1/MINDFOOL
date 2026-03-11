import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Icons from 'lucide-react';
import Layout from './components/Layout';
import { ViewName, TimerType, CheckInType, DailyStats, GrowthRecord, User, LeaveState, CourseContentMap, CourseScheduleMap, CourseWeek, CourseStatus, UserWeeklyState, CheckInConfig, Language } from './types';
import Home from './views/Home';
import Login from './views/Login';
import Admin from './views/Admin';
import { ToolsView, BreathingView, TimerView, StatsView } from './views/ToolsAndFeatures';
import { DailyView, RecordView, RecordInputModal } from './views/DailyAndRecord';
import CourseDetail from './views/CourseDetail';
import Splash from './views/Splash';
import { COURSE_SCHEDULE, SPLASH_QUOTES as DEFAULT_SPLASH_QUOTES } from './constants';
import { supabase } from './src/supabaseClient';
import dictionaryDataRaw from './app_dictionary.json';

// ✅ 把不完整的 DailyStats 补齐成完整结构（给 UI 用）
// ===== 工具函数：补齐 DailyStats，供 UI 使用 =====

function normalizeDailyStats(stats: Partial<DailyStats>): DailyStats {
  return {
    nianfo: stats.nianfo ?? 0,
    baifo: stats.baifo ?? 0,
    zenghui: stats.zenghui ?? 0,
    breath: stats.breath ?? 0,
    recordCount: stats.recordCount ?? 0,
    total_minutes: stats.total_minutes ?? 0,
  };
}


if (typeof document !== 'undefined') {
  const styleId = 'search-ui-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    /* 强制给主页和每日功课的最底层容器加间距 */
    /* 这样即便内部组件有自己的样式，也会被强制推上去 */
    .home-view-wrapper, .daily-view-wrapper {
      padding-bottom: 180px !important;
      height: auto !important;
      min-height: 100vh;
      margin-top: 10px; /* 增加顶部间距 */
      }
   /* 确保子元素不强制撑满 */
.daily-view-wrapper > div {
  height: auto !important;
}

    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    
    /* 省略号的颜色和粗细 */
    .dots-indicator {
      color: #888 !important;
      font-weight: 900 !important;
    }
  `;

    document.head.appendChild(style);
  }
}
// 2. 强制定义为数组，这样 TypeScript 就不再报“不存在属性 find”的错误了
const dictionaryData = (dictionaryDataRaw as any).default || (dictionaryDataRaw as any[]);

/**
 * 核心工具：获取当前北京时间的 YYYY-MM-DD 字符串
 * 确保全球用户无论在哪里，统计周期都以北京为准
 */
const getBeijingDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/\//g, '-');
};

const DEFAULT_HOME_QUOTES = [
  "诸菩萨摩诃萨应如是生清净心，不应住色生心，不应住声、香、味、触、法生心，应无所住而生其心。—— 《金刚经》",
  "假使经百劫，所作业不亡；因缘会遇时，果报还自受。—— 《大宝积经》",
  "我观是阎浮众生，举心动念，无非是罪。脱获善利，多退初心。—— 《地藏菩萨本愿经》",
  "凡所有相，皆是虚妄，若见诸相非相，即见如来。—— 《金刚经》",
  "是诸众生无复我相、人相、众生相、寿者相，无法相、亦无非法相。—— 《金刚经》",
  "如是施福非有聚处、非有形相，如是施已，施者身亡，施福不离，如影随形。是名施者得福报果，果福不失。—— 《毘耶娑问经》",
  "若于色，说是生厌、离欲、灭尽、寂静法者，是名“法师”。若于受、想、行、识，说是生厌、离欲、灭尽、寂静法者，是名“法师”。是名如来所说“法师”。—— 《杂阿含经》",
  "一切法者，略有五种：一者心法、二者心所有法、三者色法、四者心不相应行法、五者无为法。一切最胜故，与此相应故，二所现影故，三分位差别故，四所显示故，如是次第。—— 《大乘百法明门论》",
  "佛法在世间，不离世间觉；离世觅菩提，恰如求兔角。—— 《六祖坛经》",
  "迦叶！譬如高原陆地不生莲花；菩萨亦复如是，于无为中不生佛法。迦叶！譬如卑湿淤泥中乃生莲花；菩萨亦尔，生死淤泥邪定众生能生佛法。—— 《大宝积经》",
  "诸佛如来但教化菩萨，诸有所作常为一事，唯以佛之知见示悟众众生。舍利弗！如来但以一佛乘故为众生说法，无有余乘若二若三。舍利弗！一切十方诸佛，法亦如是。—— 《妙法莲华经》",
  "若人造重罪，作已深自责，忏悔更不造，能拔根本业。—— 《佛为首迦长者说业报差别经》",
  "觉了二谛：世谛、真谛，名三藐三佛陀。—— 《优婆塞戒经》",
  "知一切法及一切行，故名为佛。—— 《优婆塞戒经》",
  "如来从观不净，乃至得阿耨多罗三藐三菩提；从庄严地至解脱地，胜于声闻辟支佛等，是故如来名无上尊。—— 《优婆塞戒经》",
  "若众生心，忆佛念佛，现前当来，必定见佛，去佛不远，不假方便，自得心开。—— 《大势至菩萨念佛圆通章》",
  "如来世尊修空三昧、灭定三昧、四禅、慈悲、观十二因缘，皆悉为利诸众生故。如来正觉发言无二，故名如来。如往先佛从庄严地出，得阿耨多罗三藐三菩提，故名如来。—— 《菩萨优婆塞戒经》",
  "十方如来于十八界一一修行，皆得圆满无上菩提，于其中间亦无优劣；但汝下劣，未能于中圆自在慧，故我宣扬，令汝但于一门深入，入一无妄，彼六知根一时清净。—— 《楞严经》"
];

const INITIAL_USERS: User[] = [
  { id: 'admin', name: '管理员', password: '010101', classVersion: '成长班 1.0', isAdmin: true },
];

const INITIAL_COURSES_MAP: CourseScheduleMap = {
  '成长班 1.0': [...COURSE_SCHEDULE], 
  '感理班 2.0': [ 
    { id: 1, title: '2.0 第一周: 进阶佛法', status: CourseStatus.ENDED },
    { id: 2, title: '2.0 第二周: 深入经藏', status: CourseStatus.IN_PROGRESS },
  ] 
};

const INITIAL_CONTENT_MAP: CourseContentMap = {
  '成长班 1.0-1': `何谓佛教？\n\n佛教不仅仅是宗教，更是一种生活方式 and 生命教育。\n它教导我们如何觉知当下，认识自我。\n\n(管理员可在后台编辑此内容)`,
};

const INITIAL_CHECKIN_CONFIG: CheckInConfig = {
    latitude: 39.9042, 
    longitude: 116.4074,
    radius: 100,
    enabled: false, 
    locationName: '共修点'
};

// 1. 纯净版计算函数：不直接依赖 checkInConfig，而是通过参数传入 baseDate
const calculateWeekRange = (shiftWeeks: number = 0, baseDateStr: string = '2026-01-06') => {
  const baseStart = new Date(baseDateStr);
  baseStart.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 计算经过的周数
  const diffTime = today.getTime() - baseStart.getTime();
  const weeksSinceBase = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));

  // 计算目标周的起始
  const currentWeekStart = new Date(baseStart);
  currentWeekStart.setDate(baseStart.getDate() + (weeksSinceBase + shiftWeeks) * 7);

  // 计算目标周的结束
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

  const fmt = (d: Date) => `${(d.getMonth() + 1)}.${d.getDate()}`;
  return `${fmt(currentWeekStart)} - ${fmt(currentWeekEnd)}`;
};

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const loadState = <T,>(key: string, fallback: T): T => {
    
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return fallback;
      }
    }
    return fallback;
  };

  // --- State Definitions ---
    // 🟢 就在这里定义，不要放外面
    const triggerHaptic = (ms = 15) => {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    };
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('growth_app_current_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const isManager = Boolean(
    currentUser?.isAdmin || currentUser?.id === 'admin'
  );
  
  const [allUsers, setAllUsers] = useState<User[]>(() => loadState('growth_app_users', INITIAL_USERS));
  const [authCode, setAuthCode] = useState(() => loadState('growth_app_auth_code', '888888'));
  const [splashQuotes, setSplashQuotes] = useState<string[]>(() => loadState('growth_app_splash_quotes', DEFAULT_SPLASH_QUOTES));
  const [homeQuotes, setHomeQuotes] = useState<string[]>(() => loadState('growth_app_home_quotes', DEFAULT_HOME_QUOTES));
  // ✅ 允许局部缺字段，避免 TS 报错
const [userStatsMap, setUserStatsMap] = useState<Record<string, Partial<DailyStats>>>(
  () => loadState('growth_app_stats', {}));
  const [userHistoryMap, setUserHistoryMap] = useState<Record<string, Record<string, number>>>(() => loadState('growth_app_user_history', {}));
  const [userRecordsMap, setUserRecordsMap] = useState<Record<string, GrowthRecord[]>>(() => loadState('growth_app_records', {}));
  const [coursesMap, setCoursesMap] = useState<CourseScheduleMap>(() => loadState('growth_app_courses_map', INITIAL_COURSES_MAP));
  const [courseContents, setCourseContents] = useState<CourseContentMap>(() => loadState('growth_app_course_content', INITIAL_CONTENT_MAP));
  const [weeklyStates, setWeeklyStates] = useState<Record<string, UserWeeklyState>>(() => loadState('growth_app_weekly_states', {}));
  // 补回丢失的 weekShift 状态定义
  const [weekShift, setWeekShift] = useState<number>(() => loadState('growth_app_week_shift', 0));
  const [checkInConfig, setCheckInConfig] = useState<CheckInConfig>(() => loadState('growth_app_checkin_config', INITIAL_CHECKIN_CONFIG));
  const [lang, setLang] = useState<Language>(() => loadState('growth_app_lang', 'zh'));

  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.HOME);
  const [history, setHistory] = useState<ViewName[]>([]);
  const [selectedTimerType, setSelectedTimerType] = useState<TimerType>(TimerType.NIANFO);
  const [checkInStatus, setCheckInStatus] = useState<CheckInType>(CheckInType.NONE);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const initialLeaveState: LeaveState = { hasLeft: false, leaveReason: '', hasRevokedLeave: false };
  const [currentWeek, setCurrentWeek] = useState<LeaveState>(initialLeaveState);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  // 当前搜索输入内容（用于受控 input 和返回列表恢复）
const [searchQuery, setSearchQuery] = useState('');
const searchInputRef = useRef<HTMLInputElement>(null); // 🟢 增加这一行


  // ✅ 搜索视图状态：列表 / 详情
  const [searchView, setSearchView] = useState<'list' | 'detail'>('list');
// 🟢 搜索交互增强：处理 Esc 退出与自动聚焦
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isSearchOpen) {
      setIsSearchOpen(false);
      setSearchView('list');
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  if (isSearchOpen) {
    // 这里的延迟是为了避开搜索框弹出的动画时间，确保聚焦成功
    const timer = setTimeout(() => searchInputRef.current?.focus(), 200);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isSearchOpen]);


  // 保存数据到 Supabase
  const saveToSupabase = useCallback(async (userId: string, keyName: string, content: any) => {
    try {
      const userIdStr = String(userId);
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userIdStr,
          key: keyName,
          content: content,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,key'
        });
      
      if (error) {
        console.error(`Error saving ${keyName} to Supabase:`, error);
      }
    } catch (err) {
      console.error(`Error saving ${keyName} to Supabase:`, err);
    }
  }, []);

  // 保存全局配置到 Supabase
  const saveGlobalConfig = useCallback(async (key: string, content: any) => {
    if (!isManager) return;
    try {
      await supabase
        .from('global_configs')
        .upsert({
          key: key,
          content: content,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    } catch (err) {
      console.error(`Error saving config ${key}:`, err);
    }
  }, [isManager]);

  
  // 从 Supabase 加载所有用户
  const loadAllUsers = useCallback(async () => {
    
    try {
      const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('user_id, content')
        .eq('key', 'user_profile');
      
      if (!userDataError && userData) {
        const users: User[] = [{ id: 'admin', name: '管理员', password: '010101', classVersion: '成长班 1.0', isAdmin: true }];
        userData.forEach((row: any) => {
          if (row.content && row.user_id !== 'admin') {
            users.push({
              id: row.user_id,
              name: row.content.name || '',
              classVersion: row.content.classVersion || '成长班 1.0',
              isAdmin: row.content.isAdmin || false,
            });
          }
        });
        setAllUsers(users);
      }
    } catch (err) {
      console.error('Error loading all users from Supabase:', err);
    }
  }, []);

  // 从 Supabase 加载全局配置
  const loadGlobalConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_configs')
        .select('key, content');

      if (error) {
        console.error('Error loading global configs from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach((row: { key: string; content: any }) => {
          const { key, content } = row;
          if (!content) return;

          switch (key) {
            case 'courses_map': setCoursesMap(content); break;
            case 'course_contents': setCourseContents(content); break;
            case 'splash_quotes': if (Array.isArray(content)) setSplashQuotes(content); break;
            case 'home_quotes': if (Array.isArray(content)) setHomeQuotes(content); break;
            case 'checkin_config': setCheckInConfig(content); break;
            case 'auth_code': setAuthCode(content); break;
            case 'weekly_states': setWeeklyStates(content); break;
          }
        });
        console.log('--- 云端全局配置已同步 ---');
      }
    } catch (err) {
      console.error('Error loading global configs from Supabase:', err);
    }
  }, []);

  const refreshWeeklyStates = useCallback(async () => {
    try {
      const { data: globalData, error: globalError } = await supabase
        .from('global_configs')
        .select('content')
        .eq('key', 'weekly_states')
        .maybeSingle();
      
      const allStates: Record<string, UserWeeklyState> = {};
      if (!globalError && globalData && globalData.content) {
        Object.assign(allStates, globalData.content);
      }
      
      const { data: userDataStates, error: userDataError } = await supabase
        .from('user_data')
        .select('user_id, content')
        .like('key', 'weekly_state_%');
      
      if (!userDataError && userDataStates) {
        userDataStates.forEach((row: any) => {
          if (row.content && typeof row.content === 'object') {
            const state = row.content as UserWeeklyState;
            if (state.key) allStates[state.key] = state;
          }
        });
      }
      if (Object.keys(allStates).length > 0) setWeeklyStates(allStates);
    } catch (err) {
      console.error('Error refreshing weekly states:', err);
    }
  }, []);

  const loadAllUsersData = useCallback(async () => {
    try {
      const todayStr = getBeijingDateString();
      const { data: dailyStatsData, error: dailyStatsError } = await supabase
        .from('daily_stats')
        .select('*') 
        .eq('date', todayStr);
      
      if (!dailyStatsError && dailyStatsData) {
        const allStats: Record<string, any> = {};
        dailyStatsData.forEach((row: any) => {
          allStats[row.user_id] = {
            nianfo: row.nianfo || 0,
            baifo: row.baifo || 0,
            zenghui: row.zenghui || 0,
            breath: row.breath || 0,
            total_minutes: row.total_minutes || 0
          };
        });
        setUserStatsMap(prev => ({ ...prev, ...allStats }));
      }
      await refreshWeeklyStates();
    } catch (err) {
      console.error('Error loading all users data:', err);
    }
  }, [refreshWeeklyStates]);
  
// 从 Supabase 加载单个用户数据
const loadUserDataFromSupabase = useCallback(async (userId: string) => {
  try {
    if (!userId || userId === 'admin') return;
    const { data, error } = await supabase
      .from('user_data')
      .select('key, content')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading user data:', error);
      return;
    }
    

    if (data) {
      data.forEach((row: { key: string; content: any }) => {
        const { key, content } = row;
        switch (key) {
          case 'growth_app_stats':
            setUserStatsMap(prev => ({ ...prev, [userId]: content }));
            break;
          case 'growth_app_user_history':
            // 过滤掉超过14天的历史数据
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const filteredHistory: Record<string, number> = {};
            if (content && typeof content === 'object') {
              Object.entries(content).forEach(([date, minutes]) => {
                const dateObj = new Date(date);
                if (dateObj >= fourteenDaysAgo) filteredHistory[date] = minutes as number;
              });
            }
            setUserHistoryMap(prev => ({ ...prev, [userId]: filteredHistory }));
            break;
          case 'growth_app_records':
            const recordsArray = Array.isArray(content) ? content : [];
            setUserRecordsMap(prev => ({ ...prev, [userId]: recordsArray.slice(0, 50) }));
            break;
        }
      });
    }
    
    const todayStr = getBeijingDateString();
    // 【这里修复了 406 报错】：去掉了字符串里的空格，并确保能读到 total_minutes
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_stats')
      .select('nianfo,baifo,zenghui,breath,total_minutes') 
      .eq('user_id', userId)
      .eq('date', todayStr)
      .maybeSingle(); // <--- 换成了 .maybeSingle()，允许数据为空
    
    if (!dailyError && dailyData) {
      setUserStatsMap(prev => ({
        ...prev,
        [userId]: {
          nianfo: dailyData.nianfo || 0,
          baifo: dailyData.baifo || 0,
          zenghui: dailyData.zenghui || 0,
          breath: dailyData.breath || 0,
          // 确保同步下来的数据也有总时间
          total_minutes: dailyData.total_minutes || 0
        }
      }));
   }

    // 历史数据加载逻辑保持不变...
    const currentDate = getBeijingDateString(); 
    const todayObj = new Date(currentDate); 
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(todayObj.getDate() - 1);
    const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
    
    const startDateObj = new Date(yesterdayObj);
    startDateObj.setDate(yesterdayObj.getDate() - 6); 
    const startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;

    const { data: historyData, error: historyError } = await supabase
      .from('daily_stats')
      .select('date,total_minutes')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', yesterdayStr)
      .order('date', { ascending: true });
    
    if (!historyError && historyData) {
      const historyMap: Record<string, number> = {};
      historyData.forEach((row: any) => {
        historyMap[row.date] = row.total_minutes || 0;
      });
      setUserHistoryMap(prev => ({ ...prev, [userId]: historyMap }));
    }
  } catch (err) {
    console.error('Error loading user data from Supabase:', err);
  }
}, []);

// --- [保险丝版] 零点静默刷新工具 ---
const refreshDailyData = useCallback(async () => {
  // 0. 如果没登录，直接退出，不执行
  if (!currentUser) return;

  try {
    console.log("📅 检测到跨天，正在为您同步云端最新数据...");
    // 1. 立即清空前端显示（视觉归零）
    // 风险预防：使用函数式更新，确保拿到的是最新状态
    if (typeof setUserStatsMap === 'function') {
      setUserStatsMap(prev => ({
        ...prev,
        [currentUser.id]: { nianfo: 0, baifo: 0, zenghui: 0, breath: 0, total_minutes: 0 }
      }));
    }

    // 2. 重置打卡按钮状态（对齐你代码中的枚举 CheckInType）
    if (typeof setCheckInStatus === 'function') {
      setCheckInStatus(CheckInType.NONE); 
    }
    // 3. 核心避震：延迟 500ms 后拉取云端，给数据库写入留出一点余量
    setTimeout(async () => {
      // 从云端拉取真实的“今日（新的一天）”数据
      // 风险预防：这里会覆盖掉上面手动设置的 0，如果云端已有新数据，以云端为准
      await loadUserDataFromSupabase(currentUser.id);
      await loadAllUsers();
      console.log("✅ [跨天处理] 云端同步已完成");
    }, 500);
  
  } catch (error) {
    // 如果网络报错，静默处理，不弹窗打扰用户
    console.error("跨天同步异常:", error);
  }
}, [currentUser, loadUserDataFromSupabase, loadAllUsers]);



  // --- Effect Hooks ---

useEffect(() => { localStorage.setItem('growth_app_users', JSON.stringify(allUsers)); }, [allUsers]);


// 跨天数据自动归零逻辑


  // 同步用户数据到 Supabase
  useEffect(() => {
    if (currentUser?.id) {
      const userStats = userStatsMap[currentUser.id];
      if (userStats) saveToSupabase(currentUser.id, 'growth_app_stats', userStats);
    }
    localStorage.setItem('growth_app_stats', JSON.stringify(userStatsMap));
  }, [userStatsMap, currentUser, saveToSupabase]);

  useEffect(() => {
    if (currentUser?.id) {
      const userHistory = userHistoryMap[currentUser.id];
      if (userHistory) {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const filteredHistory: Record<string, number> = {};
        Object.entries(userHistory).forEach(([date, minutes]) => {
          const dateObj = new Date(date);
          if (dateObj >= fourteenDaysAgo) filteredHistory[date] = minutes;
        });
        
        if (Object.keys(filteredHistory).length < Object.keys(userHistory).length) {
          setUserHistoryMap(prev => ({ ...prev, [currentUser.id]: filteredHistory }));
        }
        saveToSupabase(currentUser.id, 'growth_app_user_history', filteredHistory);
      }
    }
    localStorage.setItem('growth_app_user_history', JSON.stringify(userHistoryMap));
  }, [userHistoryMap, currentUser, saveToSupabase]);

  // 数据清理监听
  useEffect(() => {
    const cleanupOldData = async () => {
      try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];
        const { error } = await supabase.from('daily_stats').delete().lt('date', fourteenDaysAgoStr);
        if (error) console.error('Error cleaning up old daily stats:', error);
      } catch (err) {
        console.error('Error cleaning up old daily stats:', err);
      }
    };
    cleanupOldData();
    const interval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      const userRecords = userRecordsMap[currentUser.id];
      if (userRecords) {
        const limitedRecords = userRecords.slice(0, 50);
        saveToSupabase(currentUser.id, 'growth_app_records', limitedRecords);
        if (userRecords.length > 50) {
          setUserRecordsMap(prev => ({ ...prev, [currentUser.id]: limitedRecords }));
        }
      }
    }
    localStorage.setItem('growth_app_records', JSON.stringify(userRecordsMap));
  }, [userRecordsMap, currentUser, saveToSupabase]);

  useEffect(() => {
    if (Object.keys(weeklyStates).length > 0) {
      if (currentUser && (currentUser.isAdmin || currentUser.id === 'admin')) {
        saveGlobalConfig('weekly_states', weeklyStates);
      }
    }
    localStorage.setItem('growth_app_weekly_states', JSON.stringify(weeklyStates));
  }, [weeklyStates, saveGlobalConfig, currentUser]);

  useEffect(() => { 
    localStorage.setItem('growth_app_courses_map', JSON.stringify(coursesMap));
    saveGlobalConfig('courses_map', coursesMap);
  }, [coursesMap, saveGlobalConfig]);
  
  useEffect(() => { 
    localStorage.setItem('growth_app_course_content', JSON.stringify(courseContents));
    saveGlobalConfig('course_contents', courseContents);
  }, [courseContents, saveGlobalConfig]);
  
  useEffect(() => { localStorage.setItem('growth_app_week_shift', JSON.stringify(weekShift)); }, [weekShift]);
  
  useEffect(() => { 
    localStorage.setItem('growth_app_checkin_config', JSON.stringify(checkInConfig));
    saveGlobalConfig('checkin_config', checkInConfig);
  }, [checkInConfig, saveGlobalConfig]);
  
  useEffect(() => { localStorage.setItem('growth_app_lang', JSON.stringify(lang)); }, [lang]);
  
  useEffect(() => { 
    localStorage.setItem('growth_app_splash_quotes', JSON.stringify(splashQuotes));
    saveGlobalConfig('splash_quotes', splashQuotes);
  }, [splashQuotes, saveGlobalConfig]);
  
  useEffect(() => { 
    localStorage.setItem('growth_app_home_quotes', JSON.stringify(homeQuotes));
    saveGlobalConfig('home_quotes', homeQuotes);
  }, [homeQuotes, saveGlobalConfig]);
  
  useEffect(() => { 
    localStorage.setItem('growth_app_auth_code', JSON.stringify(authCode));
    saveGlobalConfig('auth_code', authCode);
  }, [authCode, saveGlobalConfig]);

  useEffect(() => {
    let changed = false;
    const newUsers = allUsers.map(u => {
      if (u.id === 'admin' && u.password !== '010101') {
        changed = true;
        return { ...u, password: '010101' };
      }
      return u;
    });
    if (changed) {
      setAllUsers(newUsers);
      if (currentUser?.id === 'admin') {
        setCurrentUser(prev => prev ? { ...prev, password: '010101' } : null);
      }
    }
  }, [allUsers, currentUser]);

  // 初始化加载
  useEffect(() => {
    loadAllUsers();
    loadGlobalConfig();
    loadAllUsersData();
    refreshWeeklyStates();
  }, [loadAllUsers, loadGlobalConfig, loadAllUsersData, refreshWeeklyStates]);

  useEffect(() => {
    if (currentUser) {
      loadAllUsersData();
    }
  }, [currentUser, loadAllUsersData]);

  // 临时测试数据
  useEffect(() => {
    setUserStatsMap(prev => ({
      ...prev,
      'test_user_1': { nianfo: 1, baifo: 0, zenghui: 0, breath: 0 },
      'test_user_2': { nianfo: 3, baifo: 2, zenghui: 0, breath: 0 },
      'test_user_3': { nianfo: 5, baifo: 3, zenghui: 2, breath: 0 },
    }));
  }, []);

  useEffect(() => {
    if (currentUser) loadAllUsersData();
  }, [currentView, currentUser, loadAllUsersData]);


  // ============================================
  // 🔥 核心修复区域：跨天重置与初始化逻辑 🔥
  // ============================================

  // 1. 独立的 0 点跨天监听器 (修复版：确保历史数据先上传数据库，再归零)
// --- 修改一：彻底隔离未登录状态 ---
useEffect(() => {
  const myId = currentUser?.id;
  // 必须有用户且不是管理员才跑重置
  // 1. 如果没有登录，或者身份是管理员，不执行跨天重置逻辑
  if (!myId || myId === 'admin') return;
  const checkMidnight = async () => {
    const todayStr = getBeijingDateString(); 
    const dateKey = `last_active_date_${myId}`;
    const lastDate = localStorage.getItem(dateKey);

 // 2. 只有当记录的日期存在且不等于今天，才触发“结算”
 if (lastDate && lastDate !== todayStr) {
  console.log(`[静默结算] 检测到日期变更: ${lastDate} -> ${todayStr}`);

  // 从本地读取旧数据准备上传（为了趋势图）
  const statsMap = JSON.parse(localStorage.getItem('growth_app_stats') || '{}');
  const yStats = statsMap[myId];
  if (yStats) {
    const total = (yStats.nianfo || 0) + (yStats.baifo || 0) + (yStats.zenghui || 0) + (yStats.breath || 0);
    if (total > 0) {
      // 🛡️ 最稳健处理：暂时注释掉这个会报错的备份逻辑
      /*
      try {
        // 将昨天的数据备份到数据库趋势表
        await supabase.from('growth_records').upsert({
          user_id: myId,
          date: lastDate,
          meditation_minutes: (yStats.nianfo || 0) + (yStats.baifo || 0) + (yStats.breath || 0),
          study_minutes: (yStats.zenghui || 0),
          is_completed: true,
          
        }, { onConflict: 'user_id,date' });
      } catch (e) { console.error("跨天备份失败", e); }
       */
      console.log("检测到跨天，本地状态即将重置");
    }
  }
  // 3. 🔥 静默重置：直接修改 React 状态，不刷新页面
  const resetStats = { nianfo: 0, baifo: 0, zenghui: 0, breath: 0, total_minutes: 0 };
      
  // 更新内存状态（UI 立即变 0）
  setUserStatsMap(prev => ({ ...prev, [myId]: resetStats }));
  
  // 更新本地存储（防止刷新后读旧值）
  const newMap = { ...statsMap, [myId]: resetStats };
  localStorage.setItem('growth_app_stats', JSON.stringify(newMap));
  localStorage.setItem(dateKey, todayStr);
  // ✅【在此处插入】强制归零数据库，防止刷新后旧数据回流
  try {
    await supabase.from('daily_stats').upsert({
        user_id: myId,
        date: todayStr, // 使用新日期
        nianfo: 0, baifo: 0, zenghui: 0, breath: 0, total_minutes: 0,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
    console.log("数据库今日数据已强制归零");
} catch (err) { console.error("数据库归零失败", err); }
// 👆👆👆 插入结束

} else if (!lastDate) {
  // 纯新用户或初次记录日期
  localStorage.setItem(dateKey, todayStr);
    // 4. 如果是新用户，只存日期，不执行任何重置
    localStorage.setItem(dateKey, todayStr);
  }
};

const timer = setInterval(checkMidnight, 30000); // 每30秒检查一次
checkMidnight(); 

return () => clearInterval(timer);
}, [currentUser?.id]); // 只有登录用户变动时重跑监听

// 2. 初始化 Auth 检查：仅负责登录状态判定，不再参与跨天逻辑（职责分离）
useEffect(() => {
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const savedUserJson = localStorage.getItem('growth_app_current_user');
      const u = savedUserJson ? JSON.parse(savedUserJson) : null;
      
      // 只要本地有缓存或 session 有效
      if (u && u.id) {
        setCurrentUser(u);
        // 加载云端数据（会自动处理当天的数据同步）
        await loadUserDataFromSupabase(u.id);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    }
  };
  initAuth();
}, [loadUserDataFromSupabase]);



  // --- End of Core Logic Fix ---

  //打卡部分
  const currentWeekRangeStr = useMemo(() => {
    return calculateWeekRange(weekShift, checkInConfig?.weekStartDate || '2026-01-06');
  }, [weekShift, checkInConfig?.weekStartDate]);

  useEffect(() => {
    if (!currentUser) {
        setCurrentWeek(initialLeaveState);
        setCheckInStatus(CheckInType.NONE);
        return;
    }
    if (checkInConfig?.isVacationMode) {
      setCurrentWeek({
          hasLeft: true,
          leaveReason: checkInConfig.resumeDate || '假期模式',
          hasRevokedLeave: false
      });
      setCheckInStatus(CheckInType.NONE);
      return; // 强制拦截，不走下面的个人周数据逻辑
  }
    const thisWeekKey = `${currentUser.id}_${currentWeekRangeStr}`;
    const thisWeekData = weeklyStates[thisWeekKey];
    if (thisWeekData) {
        setCurrentWeek({
            hasLeft: !!thisWeekData.leaveReason,
            leaveReason: thisWeekData.leaveReason || '',
            hasRevokedLeave: !!thisWeekData.hasRevokedLeave
        });
        if (thisWeekData.checkInStatus === '线下签到') setCheckInStatus(CheckInType.OFFLINE);
        else if (thisWeekData.checkInStatus === '线上打卡') setCheckInStatus(CheckInType.ONLINE);
        else setCheckInStatus(CheckInType.NONE);
    } else {
      console.log("上课期间暂无本周记录，重置为初始状态");
      setCurrentWeek(initialLeaveState);
      setCheckInStatus(CheckInType.NONE);
    }
  }, [currentUser?.id, weeklyStates, weekShift, currentWeekRangeStr, checkInConfig?.isVacationMode]);
  
  const dailyStats = useMemo(() => {
    const stats = currentUser ? (userStatsMap[currentUser.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 }) : { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
    return {
      ...stats,
      // 这里主动算好总和，方便 UI 和排名逻辑直接调用
      total_minutes: (stats.nianfo || 0) + (stats.baifo || 0) + (stats.zenghui || 0) + (stats.breath || 0)
    };
  }, [currentUser, userStatsMap]);

  const records = currentUser ? (userRecordsMap[currentUser.id] || []) : [];
  const historyStats = currentUser ? (userHistoryMap[currentUser.id] || {}) : {};

 
// 1. 计算排名百分比 (已整合最新逻辑)
const rankPercentage = useMemo(() => {
  if (!currentUser || !userStatsMap || Object.keys(userStatsMap).length === 0) return 0;

  // 计算当前用户的今日总分
  const userId = currentUser.id;
  const myStats = userStatsMap[userId] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
  const myToday = (myStats.nianfo || 0) + (myStats.baifo || 0) + (myStats.zenghui || 0) + (myStats.breath || 0);

  const allTotals = Object.values(userStatsMap).map((s: any) => 
    (s.nianfo || 0) + (s.baifo || 0) + (s.zenghui || 0) + (s.breath || 0)
  );

  if (allTotals.length <= 1) return 100;

  const lowerThanMe = allTotals.filter(t => t < myToday).length;
  let percentage = Math.floor((lowerThanMe / allTotals.length) * 100);
  
  return Math.min(99, Math.max(0, percentage));
}, [userStatsMap, currentUser]);

// 2. 核心功课保存函数 (已彻底修复嵌套问题)
// --- 核心功课保存函数 (小白直接替换版) ---
const handleAddMinutes = useCallback(async (type: TimerType, minutes: number, shouldPlayAlarm: boolean = false) => {
// 1. 基础检查：调整为允许 1 分钟（及通过进位达到的 1 分钟）通过
if (!currentUser || minutes < 1) {
  if (currentUser && minutes > 0 ) {
     console.log("收到分钟数：", minutes, "，不足 1 分钟，不计入统计");
  }
  return; // 这里必须要 return，否则逻辑会穿透
}
  // 检查结束
  
  const todayStr = getBeijingDateString();
  const userId = currentUser.id;
  const key = type === TimerType.NIANFO ? 'nianfo' 
            : type === TimerType.BAIFO ? 'baifo'
            : type === TimerType.ZENGHUI ? 'zenghui' : 'breath';


  // . 计算新数据
  const currentStats = userStatsMap[userId] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
  const updatedStats = {
    ...currentStats,
    [key]: (currentStats[key] || 0) + minutes
  };
  const newTotal = (updatedStats.nianfo || 0) + (updatedStats.baifo || 0) + (updatedStats.zenghui || 0) + (updatedStats.breath || 0);

  // 3. 更新本地 UI (立即生效)
  // 更新今日数字
  setUserStatsMap(prev => ({ 
    ...prev, 
    [userId]: { ...updatedStats, total_minutes: newTotal } 
  }));
  
  // 更新趋势图（柱状图）
  setUserHistoryMap(prev => {
    const userHist = prev[userId] || {};
    return {
      ...prev,
      [userId]: { ...userHist, [todayStr]: (userHist[todayStr] || 0) + minutes }
    };
  });

  // 4. 同步到云端数据库
  try {
    const { error } = await supabase
      .from('daily_stats')
      .upsert({
        user_id: userId,
        date: todayStr, 
        nianfo: updatedStats.nianfo,
        baifo: updatedStats.baifo,
        zenghui: updatedStats.zenghui,
        breath: updatedStats.breath,
        total_minutes: newTotal,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' });

    if (error) throw error;
    
    console.log("✅ 功课已保存并响铃");

  } catch (err) {
    console.error('❌ 数据库保存失败:', err);
  }
}, [currentUser, userStatsMap]);

  const handleLogin = async (user: User) => {
    const isNewUser = !allUsers.find(u => u.id === user.id);
    
    if (isNewUser) {
      setAllUsers(prev => [...prev, user]);
      try {
        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            key: 'user_profile',
            content: {
              name: user.name,
              classVersion: user.classVersion,
              isAdmin: user.isAdmin || false,
            },
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,key'
          });
        
        const initialStats = { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            key: 'growth_app_stats',
            content: initialStats,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,key'
          });
        
          const currentWeekRangeStr = calculateWeekRange(0, checkInConfig?.weekStartDate || '2025-12-30');
        const initialWeeklyState: UserWeeklyState = {
          key: `${user.id}_${currentWeekRangeStr}`,
          userId: user.id,
          userName: user.name,
          weekRange: currentWeekRangeStr,
          leaveReason: '',
          checkInStatus: '',
          updatedAt: new Date().toISOString(),
        };
        
        setWeeklyStates(prev => {
          const updated = {
            ...prev,
            [initialWeeklyState.key]: initialWeeklyState
          };
          saveGlobalConfig('weekly_states', updated);
          return updated;
        });
        
        setUserStatsMap(prev => ({ ...prev, [user.id]: initialStats }));
      } catch (err) {
        console.error('Error saving user profile to Supabase:', err);
      }
    } else {
      setAllUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }
    
    setCurrentUser(user);
    localStorage.setItem('growth_app_current_user', JSON.stringify(user));
    
    await loadUserDataFromSupabase(user.id);
    await loadAllUsers();
    await loadAllUsersData();
    
    if (isNewUser) {
      setTimeout(async () => {
        await loadAllUsers();
        await loadAllUsersData();
      }, 1000);
    }
    
   // 只要名字是管理员，或者后台勾选了 isAdmin，或者是 admin 账号
   if (user.isAdmin || user.id === 'admin' || user.name === '管理员') {
    setCurrentView(ViewName.ADMIN);
    setTimeout(async () => {
      await handleSaveGlobalConfigs();
    }, 500); 
  }
};

  const handleLogout = async () => {
    
    await supabase.auth.signOut();
    localStorage.removeItem('growth_app_current_user');
    setCurrentUser(null);
    setCurrentView(ViewName.HOME);
    setHistory([]);
  };

  const handleUpdateWeeklyState = (weekRange: string, updates:
    Partial<UserWeeklyState>) => { if (!currentUser) return; 
      const key =`${currentUser.id}_${weekRange}`; const existing = weeklyStates[key] || { key, userId:
        currentUser.id, userName: currentUser.name, weekRange, leaveReason: '',
        checkInStatus: '', updatedAt: new Date().toISOString() }; const updatedState = {
          ...existing, ...updates, updatedAt: new Date().toISOString() }; setWeeklyStates(prev => ({
            ...prev, [key]: updatedState })); saveToSupabase(currentUser.id,
              `weekly_state_${weekRange}`, updatedState); if (currentUser.isAdmin || currentUser.id
                === 'admin') { saveGlobalConfig('weekly_states', { ...weeklyStates, [key]: updatedState }); } };

  const navigate = (view: ViewName) => {

    if (view === currentView) return;
    if ([ViewName.HOME, ViewName.TOOLS, ViewName.DAILY, ViewName.RECORD].includes(view)) setHistory([]);
    else setHistory(prev => [...prev, currentView]);
    setCurrentView(view);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prevHist => prevHist.slice(0, -1));
      setCurrentView(prev);
    } else setCurrentView(ViewName.HOME);
    setEditingRecord(null);
  };
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{title: string, content: string} | null>(null);
  
 // 1. 新增：联想建议状态和联想函数
 const [suggestions, setSuggestions] = useState<any[]>([]); // 👈 必须加这一行


 // 2. 核心搜索函数（支持中英文提示）
 const handleCleanSearch = useCallback((query: string) => {
   const q = query.trim();
   if (!q) return;
   
   setIsSearching(true);
   setSearchResult(null);
   setSuggestions([]); // 搜索后清空候选列表


   // 模拟 200ms 延迟，增加交互舒适度
   setTimeout(() => {
     // 在 JSON 中查找
     const found = dictionaryData.find(item => 
       item.title === q || item.title.includes(q)
     );

     if (found) {
       setSearchResult({ title: found.title, content: found.content });
     } else {
      setSearchResult(null);
    }
     setIsSearching(false);
   }, 200);
 }, [lang]); // 依赖 lang 确保语言切换时提示同步

  const handleSaveRecord = (type: string, content: string, colors: any) => {
    if (!currentUser) return;
    
    const userRecs = userRecordsMap[currentUser.id] || [];
    
    if (editingRecord) {
      setUserRecordsMap(prev => {
        const updatedRecs = userRecs.map(r => r.id === editingRecord.id ? { ...r, type, content, color: colors.color, bgColor: colors.bgColor, textColor: colors.textColor } : r);
        return { ...prev, [currentUser.id]: updatedRecs };
      });
      setEditingRecord(null);
      goBack();
      if (currentView !== ViewName.RECORD) navigate(ViewName.RECORD);
      return;
    }
    
    if (userRecs.length >= 50) {
      alert('记录数量已达到上限（50条），请先删除一些记录后再添加。');
      return;
    }
    
    setUserRecordsMap(prev => {
      const newRecord: GrowthRecord = { id: Date.now(), type, content, time: '刚刚', color: colors.color, bgColor: colors.bgColor, textColor: colors.textColor, isPinned: false };
      const updatedRecs = [newRecord, ...userRecs];
      return { ...prev, [currentUser.id]: updatedRecs };
    });
    setEditingRecord(null);
    goBack();
    if (currentView !== ViewName.RECORD) navigate(ViewName.RECORD);
  };

  const handleDeleteRecord = (id: number) => {
    if (!currentUser) return;
    setUserRecordsMap(prev => ({ ...prev, [currentUser.id]: (prev[currentUser.id] || []).filter(r => r.id !== id) }));
  };

  const handlePinRecord = (id: number) => {
    if (!currentUser) return;
    setUserRecordsMap(prev => {
        const recs = prev[currentUser.id] || [];
        return { ...prev, [currentUser.id]: recs.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r) };
    });
  };

  const openEditModal = (rec: GrowthRecord) => { setEditingRecord(rec); setHistory(prev => [...prev, ViewName.RECORD]); setCurrentView(ViewName.RECORD_INPUT); };
  const openNewRecordModal = () => {
    if (!currentUser) return;
    const userRecs = userRecordsMap[currentUser.id] || [];
    if (userRecs.length >= 50) {
      alert('记录数量已达到上限（50条），请先删除一些记录后再添加。');
      return;
    }
    setEditingRecord(null);
    setHistory(prev => [...prev, ViewName.RECORD]);
    setCurrentView(ViewName.RECORD_INPUT);
  };
  
  const handleUpdateCourseContent = (version: string, id: number, content: string) => {
    setCourseContents(prev => {
      const updated = { ...prev, [`${version}-${id}`]: content };
      saveGlobalConfig('course_contents', updated);
      return updated;
    });
  };
  
  const handleUpdateCourseStatus = (version: string, id: number, status: CourseStatus) => {
    setCoursesMap(prev => {
      const updated = { ...prev, [version]: (prev[version] || []).map(c => c.id === id ? { ...c, status } : c) };
      saveGlobalConfig('courses_map', updated);
      return updated;
    });
  };
  
  const handleUpdateCourseTitle = (version: string, id: number, title: string) => {
    setCoursesMap(prev => {
      const updated = { ...prev, [version]: (prev[version] || []).map(c => c.id === id ? { ...c, title } : c) };
      saveGlobalConfig('courses_map', updated);
      return updated;
    });
  };
  
  const handleAddCourseWeek = (version: string) => {
    setCoursesMap(prev => {
      const list = prev[version] || [];
      const nextId = list.length + 1;
      const updated = { ...prev, [version]: [...list, { id: nextId, title: `${version.includes('成长班') ? '成长班' : '感理班'} 第${nextId}周: (新课程)`, status: CourseStatus.NOT_STARTED }] };
      saveGlobalConfig('courses_map', updated);
      return updated;
    });
  };
  
  const handleDeleteCourseWeek = (version: string, idToDelete: number) => {
    setCoursesMap(prev => {
      const updated = { ...prev, [version]: (prev[version] || []).filter(c => c.id !== idToDelete) };
      saveGlobalConfig('courses_map', updated);
      return updated;
    });
  };
  
  const handleSaveGlobalConfigs = useCallback(async () => {
    if (!currentUser || (!currentUser.isAdmin && currentUser.id !== 'admin')) {
      console.log('普通用户无权保存全局配置，已跳过');
      return;
    }
    
    try {
      await Promise.all([
        saveGlobalConfig('courses_map', coursesMap),
        saveGlobalConfig('course_contents', courseContents),
        saveGlobalConfig('splash_quotes', splashQuotes),
        saveGlobalConfig('home_quotes', homeQuotes),
        saveGlobalConfig('checkin_config', checkInConfig),
        saveGlobalConfig('auth_code', authCode),
      ]);
      console.log('全局配置已成功保存到数据库');
    } catch (err) {
      console.error('保存全局配置时出错:', err);
    }
  }, [coursesMap, courseContents, splashQuotes, homeQuotes, checkInConfig, authCode, saveGlobalConfig, currentUser]);

  const handleUpdateUserPermission = async (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        (async () => {
          try {
            await supabase
              .from('user_data')
              .upsert({
                user_id: userId,
                key: 'user_profile',
                content: {
                  name: updated.name,
                  classVersion: updated.classVersion,
                  isAdmin: updated.isAdmin || false,
                },
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,key'
              });
          } catch (err) {
            console.error('Error saving user profile:', err);
          }
        })();
        return updated;
      }
      return u;
    }));
  };

  // ✅ 监控器必须放在组件顶层，不能放在 if (showSplash) 后面
useEffect(() => {
  const checkDateChange = () => {
    const savedDate = localStorage.getItem('growth_app_active_date');
    const today = new Date().toLocaleDateString();
    if (savedDate && savedDate !== today) {
      if (!isSearchOpen) {
        localStorage.setItem('growth_app_active_date', today);
        refreshDailyData(); 
      }
    }
    if (!savedDate) {
      localStorage.setItem('growth_app_active_date', today);
    }
  };
  const timer = setInterval(checkDateChange, 30000);
  checkDateChange();
  return () => clearInterval(timer);
}, [refreshDailyData, isSearchOpen]);

  if (showSplash) {
    return (
      <Splash 
        onFinish={() => {
          console.log("海报播放完毕，切换状态");
          setShowSplash(false);
        }} 
        quotes={splashQuotes} 
      />
    );
  }

  const currentContentKey = selectedCourseId ? `${currentUser.classVersion}-${selectedCourseId}` : '';

  return (
    <>
      {/* 🟢 第一层：登录拦截 */}
      {!currentUser ? (
        <Login users={allUsers} authCode={authCode} lang={lang} setLang={setLang} onLogin={handleLogin} />
      ) : (
        /* 🟢 第二层：数据同步拦截 */
        !allUsers ? ( 
          <div className="flex items-center justify-center h-screen bg-[#F0EEE9] text-[#6D8D9D]">
            正在同步云端数据...
          </div>
        ) : (
          /* 🟢 第三层：主应用 Layout */
          <Layout 
            currentView={currentView} onNavigate={navigate} onBack={goBack} 
            user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang}
          >
            {currentView === ViewName.HOME && (
              <div className="home-view-wrapper">
                <Home onNavigate={navigate} stats={normalizeDailyStats(dailyStats)} lang={lang} user={currentUser} homeQuotes={homeQuotes} />
              </div>
            )}
            {currentView === ViewName.TOOLS && <ToolsView onNavigate={navigate} setTimerType={setSelectedTimerType} lang={lang} />}
            {currentView === ViewName.BREATHING && <BreathingView onAddMinutes={(m) => handleAddMinutes(TimerType.BREATH, m)} lang={lang} />}
            {currentView === ViewName.TIMER && <TimerView type={selectedTimerType} onAddMinutes={(m) => handleAddMinutes(selectedTimerType, m)} lang={lang} />}
            {currentView === ViewName.STATS && (
              <StatsView stats={normalizeDailyStats(dailyStats)} history={historyStats} lang={lang} user={currentUser} homeQuotes={homeQuotes} allUsersStats={userStatsMap} rankPercentage={rankPercentage} />
            )}
            {currentView === ViewName.DAILY && (
              <div className="daily-view-wrapper">
                <DailyView checkInStatus={checkInStatus} setCheckInStatus={setCheckInStatus} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} currentDateStr={currentWeekRangeStr} onNavigate={navigate} setCourseId={setSelectedCourseId} classVersion={currentUser.classVersion} courses={coursesMap[currentUser.classVersion] || []} onUpdateWeeklyState={handleUpdateWeeklyState} checkInConfig={checkInConfig} lang={lang} />
              </div>
            )}
            {currentView === ViewName.COURSE_DETAIL && <CourseDetail courseId={selectedCourseId} content={courseContents[currentContentKey] || ''} courses={coursesMap[currentUser.classVersion] || []} lang={lang} />}
            {currentView === ViewName.RECORD && <RecordView onOpenInput={openNewRecordModal} records={records} onDelete={handleDeleteRecord} onEdit={openEditModal} onPin={handlePinRecord} lang={lang} />}
        {currentView === ViewName.ADMIN && (
  <div className="h-full overflow-y-auto pb-20 custom-scrollbar">
    <div className="max-w-4xl mx-auto p-4">
      <Admin 
        courseContents={courseContents} 
        onUpdateCourseContent={handleUpdateCourseContent} 
        onUpdateCourseStatus={handleUpdateCourseStatus} 
        onUpdateCourseTitle={handleUpdateCourseTitle} 
        allUsers={allUsers} 
        onUpdateUserPermission={handleUpdateUserPermission} 
        coursesMap={coursesMap} 
        onAddCourseWeek={handleAddCourseWeek} 
        onDeleteCourseWeek={handleDeleteCourseWeek} 
        authCode={authCode} 
        setAuthCode={setAuthCode} 
        weeklyStates={weeklyStates} 
        splashQuotes={splashQuotes} 
        setSplashQuotes={setSplashQuotes} 
        homeQuotes={homeQuotes} 
        setHomeQuotes={setHomeQuotes} 
        checkInConfig={checkInConfig} 
        setCheckInConfig={setCheckInConfig} 
        lang={lang} 
        onSaveGlobalConfigs={handleSaveGlobalConfigs} 
        onRefreshUsers={loadAllUsers} 
        onRefreshWeeklyStates={refreshWeeklyStates} 
      />
    </div>
  </div>
)}
</Layout> // 👈 检查这里：必须有这个闭合 Layout
) // 👈 检查这里：对应 !allUsers 的括号
)} // 👈 检查这里：对应 !currentUser 的括号

      {/* 🟡 独立于 Layout 的弹窗组件 */}
      {currentView === ViewName.RECORD_INPUT && <RecordInputModal onClose={goBack} onSave={handleSaveRecord} initialData={editingRecord} lang={lang} />}

{/* --- 搜索按钮：彻底移除长按，改为双击 --- */}
{currentUser && !isSearchOpen && (
  <button
    // 1. 核心交互：双击唤起
    onDoubleClick={() => {
      if (navigator.vibrate) navigator.vibrate(10); // 短促震动反馈
      setIsSearchOpen(true);
    }}
    // 2. 电脑端单击依然保留（方便操作），手机端单击不触发进入
    onClick={(e) => {
      if (window.innerWidth > 768) setIsSearchOpen(true);
    }}
    // 3. 关键：禁止系统默认的长按弹出菜单（防止选中空字符）
    onContextMenu={(e) => e.preventDefault()}

    // 🟢 重点：确保 active:scale 存在，这是 iOS 的“触感”核心
    className="fixed z-[999] bottom-24 right-6 w-12 h-12 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-300 active:scale-90 active:brightness-75 hover:scale-105 md:bottom-48 md:left-10 md:right-auto md:w-auto md:h-auto md:px-5 md:py-2 md:rounded-xl"
  >

    <Icons.Search style={{ color: '#6D8D9D' }} size={22} strokeWidth={2} />
    <span className="hidden md:inline-block ml-2 text-sm font-extralight tracking-[0.2em] text-[#6D8D9D]/70">
      {lang === 'zh' ? '搜索' : 'SEARCH'}
    </span>
  </button>
)}

      {/* --- 2. 全屏毛玻璃搜索层：空间稳定性版 --- */}
      {currentUser && isSearchOpen && (
        <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-20 md:pt-32 pb-12"
        onClick={() => { setIsSearchOpen(false); setSearchView('list'); }} // ✅ 正确：它是 div 的属性
      >
          {/* 背景层 */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[20px] animate-in fade-in duration-300" 
          onClick={() => { setIsSearchOpen(false); setSearchView('list'); }} />
          
          {/* 内容容器 */}
<div 
  className="relative w-[92%] max-w-lg z-10 animate-in fade-in zoom-in-0 duration-700 pointer-events-none" // 🔴 删掉了 slide-in
  style={{
    // 🟢 动画曲线：使用带回弹效果的贝塞尔
    animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // 🟢 动态计算起点
    transformOrigin: window.innerWidth > 768 ? 'left center' : 'calc(100% - 24px) calc(100% - 96px)' 
  }}
>
<div 
  onClick={() => { setIsSearchOpen(false); setSearchView('list'); }}
  className="mb-3 text-center text-white/70 text-[11px] tracking-widest cursor-pointer transition-colors pointer-events-auto"
>
            {lang === 'zh' ? (
    <>
      {/* 📱 手机端显示 */}
      <span className="md:hidden">无痕浏览 · 点按空白处返回</span>
      {/* 💻 电脑端显示 */}
      <span className="hidden md:inline">无痕浏览 · 点按空白处或ESC键返回</span>
    </>
  ) : (
    <>
      <span className="md:hidden">Private Search · Tap any place to return</span>
      <span className="hidden md:inline">Private Search · Tap any place or press ESC to return</span>
    </>
  )}
</div>
           {/* --- C. 搜索实体区：恢复 pointer-events-auto 让卡片变“坚实” --- */}
      <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}> 
            
            {/* 搜索卡片框 */}
            <div className="flex items-center bg-white/55 backdrop-blur-md border border-white/40 rounded-3xl px-4 py-4 shadow-xl">
              <Icons.Search className="text-[#6D8D9D]/70 mr-3" size={24} />
              <input 
              ref={searchInputRef} // 🟢 绑定 ref
                type="text" 
                className="w-full bg-transparent border-none outline-none text-lg text-gray-800 font-light" value={searchQuery}
                placeholder={lang === 'zh' ? '搜索名词名相...' : 'Search terms...'}
                onChange={(e) => {
                  const val = e.target.value; setSearchView('list'); setSearchResult(null); setSearchQuery(val);
                  if (val.length >= 1) {
                    // ✅ 恢复排序算法逻辑
                    const matches = dictionaryData.filter((i: any) => i.title.includes(val))
                      .sort((a: any, b: any) => {
                        if (a.title === val) return -1; if (b.title === val) return 1;
                        const aStarts = a.title.startsWith(val); const bStarts = b.title.startsWith(val);
                        if (aStarts && !bStarts) return -1; if (!aStarts && bStarts) return 1;
                        return a.title.length - b.title.length;
                      }).slice(0, 13);
                    setSuggestions(matches);
                  } else setSuggestions([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false);
                  if (e.key === 'Enter') {
                    if (suggestions.length > 0) { setSearchResult(suggestions[0]); setSearchView('detail'); }
                    else { handleCleanSearch(e.currentTarget.value); } // ✅ 恢复保底搜索
                  }
                }}
              />
              <button onClick={() => { setSearchQuery(''); setSuggestions([]); setSearchView('list');
                // 🟢 清空后立即强制聚焦，保持键盘弹出状态
  setTimeout(() => searchInputRef.current?.focus(), 0);
               }} 
               className="p-2 text-gray-400"><Icons.X size={20} /></button>
            </div>

            {/* 结果容器：确保位置完全重合 */}
            <div className="relative mt-3 w-full">
              {/* 联想列表 */}
              {searchView === 'list' && suggestions.length > 0 && (
                <div className="relative mt-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[60vh] border border-white/30 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  {suggestions.map((item: any) => (
                    <div key={item.id} className="px-5 py-3 hover:bg-[#E8E6E1] cursor-pointer border-b border-gray-100 flex justify-between items-center transition-colors" onClick={() => { setSearchResult(item); setSearchQuery(item.title); setSearchView('detail'); }}>
                      <span className="text-gray-600 font-light tracking-wide">{item.title}</span>
                      <span className="text-xs text-gray-400 truncate ml-4 max-w-[150px] font-light">
                        {item.content.replace(/【.*?】/g, '').substring(0, 20)}... {/* ✅ 恢复内容过滤 */}
                      </span>
                    </div>
                  ))}
                  {suggestions.length >= 13 && ( <div className="py-3 text-center text-[10px] text-gray-500 tracking-[1em]">···</div> )}
                </div>
              )}

            {/* 无结果提示 */}
{searchView === 'list' && searchQuery && suggestions.length === 0 && !isSearching && (
  <div className="relative px-6 py-8 text-center bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 animate-in fade-in duration-300">
    {/* 第一行：主要状态 - 保持 text-sm 和 font-light (或微调为 font-medium 增加可读性) */}
    <p className="text-sm font-light text-gray-600 tracking-wide">
      {lang === 'zh' ? '该词条尚未收录' : 'Term not found'}
    </p>
    
    {/* 第二行：引导建议 - 使用更小的 text-[11px] 和更淡的 text-gray-400，形成层级感 */}
    <p className="text-[11px] font-extralight text-gray-400 mt-2 tracking-wider">
      {lang === 'zh' ? '请调整关键词再试' : 'Refine keywords and try again'}
    </p>
  </div>
)}

              {/* 详情卡片 */}
              {searchView === 'detail' && searchResult && (
                <div className="relative mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-500 ease-out">
                  <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-medium text-gray-800">{searchResult.title}</h3>
                    <button 
                      onClick={() => {
                        setSearchView('list'); setSearchResult(null);
                        // ✅ 恢复返回时重刷列表功能
                        if (searchQuery && suggestions.length === 0) {
                          const matches = dictionaryData.filter((i: any) => i.title.includes(searchQuery)).slice(0, 13);
                          setSuggestions(matches);
                        }
                      }} 
                      className="flex items-center text-[10px] text-gray-500 bg-gray-100 px-3 py-2 rounded-full transition-all active:scale-90"
                    >
                      <Icons.ChevronLeft size={12} className="mr-1" />{lang === 'zh' ? '返回列表' : 'Back'}
                    </button>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    <div className="text-gray-700 font-light whitespace-pre-wrap text-justify leading-[1.9] max-w-[42rem] mx-auto pb-32 px-1">
                      {searchResult.content}
                      <div className="h-24 w-full" />
                    </div>
                  </div>
                  <div className="shrink-0 px-6 py-3 border-t border-gray-100 text-[10px] text-gray-400 text-center tracking-[0.5em]">{lang === 'zh' ? '闻 · 思 · 修 · 证' : 'PRACTICE'}</div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
export default App;