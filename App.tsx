import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  "如是施福非有聚处、非有形相，如是施已，施者身亡，施福不离，如影随形。是名施者得福报果，果福不失。”—— 《毘耶娑问经》",
  "若于色，说是生厌、离欲、灭尽、寂静法者，是名“法师”。若于受、想、行、识，说是生厌、离欲、灭尽、寂静法者，是名“法师”。是名如来所说“法师”。—— 《杂阿含经》",
  "一切法者，略有五种：一者心法、二者心所有法、三者色法、四者心不相应行法、五者无为法。一切最胜故，与此相应故，二所现影故，三分位差别故，四所显示故，如是次第。—— 《大乘百法明门论》",
  "心如工画师，能画诸世间，五蕴悉从生，无法而不造。如心佛亦尔，如佛众生然，应知佛与心，体性皆无尽。若人知心行，普造诸世间，是人则见佛，了佛真实性。心不住于身，身亦不住心，而能作佛事，自在未曾有。若人欲了知，三世一切佛，应观法界性，一切唯心造。—— 《方广佛华严经》",
  "佛法在世间，不离世间觉；离世觅菩提，恰如求兔角。—— 《六祖坛经》",
  "迦叶！譬如高原陆地不生莲花；菩萨亦复如是，于无为中不生佛法。迦叶！譬如卑湿淤泥中乃生莲花；菩萨亦尔，生死淤泥邪定众生能生佛法。—— 《大宝积经》",
  "诸佛如来但教化菩萨，诸有所作常为一事，唯以佛之知见示悟众众生。舍利弗！如来但以一佛乘故为众生说法，无有余乘若二若三。舍利弗！一切十方诸佛，法亦如是。—— 《妙法莲华经》",
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('growth_app_current_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => loadState('growth_app_users', INITIAL_USERS));
  const [authCode, setAuthCode] = useState(() => loadState('growth_app_auth_code', '888888'));
  const [splashQuotes, setSplashQuotes] = useState<string[]>(() => loadState('growth_app_splash_quotes', DEFAULT_SPLASH_QUOTES));
  const [homeQuotes, setHomeQuotes] = useState<string[]>(() => loadState('growth_app_home_quotes', DEFAULT_HOME_QUOTES));
  const [userStatsMap, setUserStatsMap] = useState<Record<string, DailyStats>>(() => loadState('growth_app_stats', {}));
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

  const isManager = currentUser?.id === 'admin' || currentUser?.isAdmin === true;

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

  // 1. 独立的 0 点跨天监听器 (每 30 秒检查一次)
  useEffect(() => {
    const checkMidnight = () => {
      const myId = currentUser?.id;
      if (!myId) return;

      const todayStr = getBeijingDateString(); 
      // 1. 获取带有 ID 的 Key
      const dateKey = `last_active_date_${myId}`;
      const lastDate = localStorage.getItem(dateKey);

      if (lastDate && lastDate !== todayStr) {
        console.log('检测到跨天，正在结算昨天数据并归零今日...');

        const userStats = JSON.parse(localStorage.getItem('growth_app_stats') || '{}');

        if (userStats[myId]) {
          const yStats = userStats[myId];
          const total = (yStats.nianfo || 0) + (yStats.baifo || 0) + (yStats.zenghui || 0) + (yStats.breath || 0);

          if (total > 0) {
            // 1. 更新历史记录 (这部分保留不动)
            setUserHistoryMap(prev => {
              const newHistory = {
                ...prev,
                [myId]: { ...(prev[myId] || {}), [lastDate]: total }
              };
              localStorage.setItem('growth_app_user_history', JSON.stringify(newHistory));
              return newHistory;
            });
          }

          // 重置今日数据
          const resetStats = { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
          setUserStatsMap(prev => {
            const newMap = { ...prev, [myId]: resetStats };
            localStorage.setItem('growth_app_stats', JSON.stringify(newMap));
            return newMap;
          });
        }

        // ----------------------------------------------------
        // 🔥 关键修改在这里！
        // 之前你是 localStorage.setItem('last_active_date', todayStr);
        // 现在要改成用 dateKey (即带 ID 的 key)
        // ----------------------------------------------------
        localStorage.setItem(dateKey, todayStr);
        
        console.log('结算完毕，即将自动重载页面...');
        setTimeout(() => {
          window.location.reload(); 
        }, 500);
      }
    };

    const timer = setInterval(checkMidnight, 30000); 
    return () => clearInterval(timer);
  }, [currentUser]); 

// 2. 独立的初始化 Auth 检查 (仅在组件加载时执行一次)
useEffect(() => {
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let u = null;

      // 尝试获取用户信息
      if (session?.user) {
        const savedUserJson = localStorage.getItem('growth_app_current_user');
        u = savedUserJson ? JSON.parse(savedUserJson) : null;
      } else {
        const savedUserJson = localStorage.getItem('growth_app_current_user');
        u = savedUserJson ? JSON.parse(savedUserJson) : null;
      }
      
      if (u && u.id) {
        setCurrentUser(u);

        const todayStr = getBeijingDateString(); 
        // ✅ 关键修复：统一使用带 ID 的 Key
        const dateKey = `last_active_date_${u.id}`;
        const lastDate = localStorage.getItem(dateKey); 

        // 如果日期不一致（跨天了），或者之前没有记录
        if (lastDate && lastDate !== todayStr) {
          const oldStatsMap = JSON.parse(localStorage.getItem('growth_app_stats') || '{}');
          const yesterdayStats = oldStatsMap[u.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
          
          const totalMins = (yesterdayStats.nianfo || 0) + (yesterdayStats.baifo || 0) + 
                            (yesterdayStats.zenghui || 0) + (yesterdayStats.breath || 0);
          
          // 如果昨天有数据，存入历史记录
          if (totalMins > 0) {
            setUserHistoryMap(prev => {
              const newHistory = {
                ...prev,
                [u.id]: { ...(prev[u.id] || {}), [lastDate]: totalMins }
              };
              localStorage.setItem('growth_app_user_history', JSON.stringify(newHistory));
              return newHistory;
            });
          }
        }

        // ✅ 无论是否跨天，最后统一更新一下“最后活跃日期”为今天
        // 这样就不用在 if 和 else 里分别写了
        localStorage.setItem(dateKey, todayStr);
        
        await loadUserDataFromSupabase(u.id);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    }
  };

  initAuth();
}, [loadUserDataFromSupabase]);

  // --- End of Core Logic Fix ---

  const currentWeekRangeStr = useMemo(() => {
    return calculateWeekRange(weekShift, checkInConfig?.weekStartDate || '2026-01-06');
  }, [weekShift, checkInConfig?.weekStartDate]);

  useEffect(() => {
    if (!currentUser) {
        setCurrentWeek(initialLeaveState);
        setCheckInStatus(CheckInType.NONE);
        return;
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
        setCurrentWeek(initialLeaveState);
        setCheckInStatus(CheckInType.NONE);
    }
  }, [currentUser, weeklyStates, weekShift, currentWeekRangeStr]);

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

  // 定义响铃函数
 
  const playAlarm = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
    audio.play().catch(e => console.log("浏览器拦截了自动播放，需点击页面"));
  };
 if (shouldPlayAlarm) {
    playAlarm();
  }
  // 2. 计算新数据
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
    localStorage.removeItem('growth_app_current_user_id');
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
  
  const handleCleanSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null); 
  
    try {
      // 这里的 URL 是我们即将配置的 Supabase 后端清洗中心
      const response = await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/clean-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: query,
          blacklist: ['萧平实', '正觉', '同修会', '导师', '平实'] // 严格执行过滤名单
        })
      });
      if (!response.ok) throw new Error('网络异常，请重试');
    
      const data = await response.json();
      if (data.pureContent) {
        setSearchResult({ title: query, content: data.pureContent });
      }
    } catch (err) {
      console.error("搜索失败，请更换词条重试:", err);
    } finally {
      setIsSearching(false);
    }
  };
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

  if (!allUsers || allUsers.length <= 1) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0EEE9] text-[#6D8D9D]">
        正在同步云端数据...
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={allUsers} authCode={authCode} lang={lang} setLang={setLang} />;
  }

  const currentContentKey = selectedCourseId ? `${currentUser.classVersion}-${selectedCourseId}` : '';

  return (
    <>
      <Layout currentView={currentView} onNavigate={navigate} onBack={goBack} user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang}>
        {currentView === ViewName.HOME && (
          <Home onNavigate={navigate} stats={dailyStats} lang={lang} user={currentUser} homeQuotes={homeQuotes} />
        )}
        {currentView === ViewName.TOOLS && <ToolsView onNavigate={navigate} setTimerType={setSelectedTimerType} lang={lang} />}
        {currentView === ViewName.BREATHING && <BreathingView onAddMinutes={(m) => handleAddMinutes(TimerType.BREATH, m)} lang={lang} />}
        {currentView === ViewName.TIMER && <TimerView type={selectedTimerType} onAddMinutes={(m) => handleAddMinutes(selectedTimerType, m)} lang={lang} />}
        {currentView === ViewName.STATS && <StatsView stats={dailyStats} history={historyStats} lang={lang} user={currentUser} homeQuotes={homeQuotes} allUsersStats={userStatsMap} rankPercentage={rankPercentage}/>}
        
        {currentView === ViewName.DAILY && (
          <DailyView checkInStatus={checkInStatus} setCheckInStatus={setCheckInStatus} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} currentDateStr={currentWeekRangeStr} onNavigate={navigate} setCourseId={setSelectedCourseId} classVersion={currentUser.classVersion} courses={coursesMap[currentUser.classVersion] || []} onUpdateWeeklyState={handleUpdateWeeklyState} checkInConfig={checkInConfig} lang={lang} />
        )}
        {currentView === ViewName.COURSE_DETAIL && <CourseDetail courseId={selectedCourseId} content={courseContents[currentContentKey] || ''} courses={coursesMap[currentUser.classVersion] || []} lang={lang} />}
        {currentView === ViewName.RECORD && <RecordView onOpenInput={openNewRecordModal} records={records} onDelete={handleDeleteRecord} onEdit={openEditModal} onPin={handlePinRecord} lang={lang} />}
        {currentView === ViewName.ADMIN && (
  <div className="h-full overflow-y-auto pb-20 custom-scrollbar"> {/* 添加滚动容器确保内容可见 */}
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      
      {/* --- 周期调整模块：放在课程管理最上方 --- */}
      <div className="bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icons.Calendar size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">班级学修周期设定</h3>
            <p className="text-[10px] text-gray-400">设置后，全班“正知正见”页面的周日期将自动更新</p>
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          <input 
            type="date" 
            className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={checkInConfig.weekStartDate || '2026-01-06'}
            onChange={(e) => setCheckInConfig({ ...checkInConfig, weekStartDate: e.target.value })}
          />
          <button 
            onClick={handleSaveGlobalConfigs}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            同步全班周期
          </button>
        </div>
      </div>

      {/* --- 原有的 Admin 组件 (课程管理、用户管理等) --- */}
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
      </Layout>

      {/* 录入日记的弹窗 */}
      {currentView === ViewName.RECORD_INPUT && <RecordInputModal onClose={goBack} onSave={handleSaveRecord} initialData={editingRecord} lang={lang} />}

{/* --- 1. 电脑版左侧 / 手机版右下角固定搜索按钮 --- */}
{!isSearchOpen && (
  <button
    onClick={() => setIsSearchOpen(true)}
    className={`
      fixed z-[999] flex items-center justify-center transition-all active:scale-95
      /* 统一颜色为深灰，增加透明度背景 */
      bg-white/20 backdrop-blur-md border border-white/30 shadow-lg text-[#666666]
      
      /* 📱 手机版：固定右下角，不再偏移 */
      bottom-24 right-6 w-10 h-10 rounded-full
      
      /* 💻 电脑版：保持在你要求的左侧位置，不影响原布局 */
      md:bottom-48 md:left-10 md:right-auto md:w-auto md:h-auto md:px-5 md:py-2.5 md:rounded-xl md:border-none md:shadow-none md:bg-transparent
      /* ✨ 核心：鼠标移入时的浅色方框效果（与目录一致） */
    md:hover:bg-[#E8E6E1] md:text-[#6D8D9D]
    `}
  >
    {/* 这里的 size 和文字保持你原来的设置 */}
    <Icons.Search size={20} strokeWidth={1.5} />
    <span className="hidden md:inline-block ml-3 text-sm font-light tracking-wide">
      {lang === 'zh' ? '搜索' : 'Search Terms'}
    </span>
  </button>
)}

      {/* --- 2. 全屏毛玻璃搜索层 --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center">
          {/* 点击背景关闭 */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-xl" 
            onClick={() => setIsSearchOpen(false)}
          />
          
          {/* 搜索框主体 */}
          <div className="relative w-[90%] max-w-lg z-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl px-4 py-4">
              <Icons.Search className="text-gray-500 mr-3" size={24} />
              <input 
                autoFocus
                type="text"
                placeholder={lang === 'zh' ? '搜索名词名相...' : 'Search terms...'}
                className="w-full bg-transparent border-none outline-none text-lg text-gray-800 placeholder:text-gray-400 font-light"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false);
                  if (e.key === 'Enter') {
                    handleCleanSearch(e.currentTarget.value); // 👈 修改这里
                  }
                }}
              />
              
              <button onClick={() => setIsSearchOpen(false)} className="p-2 text-gray-400">
                <Icons.X size={20} />
              </button>
            </div>
            {/* 在 input 所在的 div 闭合标签下方插入 */}
{isSearching && (
  <div className="mt-8 text-white/60 animate-pulse text-center font-light">
    正在为您从三摩地站点提取净纯法义...
  </div>
)}

{searchResult && (
  <div className="mt-8 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">{searchResult.title}</h3>
    <div className="text-gray-700 leading-relaxed space-y-4 font-light text-justify">
      {/* 渲染 AI 清洗后的 1000 字纯净内容 */}
      {searchResult.content}
    </div>
    <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center italic">
      此内容已通过 AI 严格执行去人名、去来源、屏蔽争议词清洗。
    </div>
  </div>
)}
            <div className="mt-4 text-center text-white/60 text-xs tracking-widest font-light">
            {lang === 'zh' ? '无痕浏览 · 点按空白处返回' : 'Search Only · Tap any space to return.'}
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;