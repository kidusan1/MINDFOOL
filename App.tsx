import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { ViewName, TimerType, CheckInType, DailyStats, GrowthRecord, User, LeaveState, CourseContentMap, CourseScheduleMap, CourseWeek, CourseStatus, UserWeeklyState, CheckInConfig, Language } from './types';
import Home from './views/Home';
import Login from './views/Login';
import Admin from './views/Admin';
import { ToolsView, BreathingView, TimerView, StatsView } from './views/ToolsAndFeatures';
import { DailyView, RecordView, RecordInputModal } from './views/DailyAndRecord';
import CourseDetail from './views/CourseDetail';
import Splash from './views/Splash';
import { COURSE_SCHEDULE, SPLASH_QUOTES as DEFAULT_SPLASH_QUOTES, SPLASH_QUOTES_EN } from './constants';
import { supabase } from './src/supabaseClient';
const getBeijingDateString = () => {
  // 强制获取北京时间（东八区）的日期字符串 YYYY-MM-DD
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\//g, '-');
};
/**
 * 核心工具：获取当前北京时间的 YYYY-MM-DD 字符串
 * 确保全球用户无论在哪里，统计周期都以北京为准
 */
const getBeijingDateString = (date = new Date()) => {
  // 强制获取北京时间（东八区）的日期字符串 YYYY-MM-DD
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

const calculateWeekRange = (shiftWeeks: number = 0, offsetWeeks: number = 0) => {
  const today = new Date();
  const day = today.getDay(); 
  const diff = (day - 3 + 7) % 7;
  const start = new Date(today);
  start.setHours(0,0,0,0);
  start.setDate(today.getDate() - diff);
  const totalWeeks = shiftWeeks + offsetWeeks;
  start.setDate(start.getDate() + (totalWeeks * 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => `${(d.getMonth() + 1)}.${d.getDate()}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

const App: React.FC = () => {
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

  // 保存数据到 Supabase
  // 保存数据到 Supabase（支持 TEXT 类型的 user_id，包括 "admin" 字符串）
  const saveToSupabase = useCallback(async (userId: string, keyName: string, content: any) => {
    try {
      // 确保 userId 是字符串类型，支持 "admin" 等字符串
      const userIdStr = String(userId);
      
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userIdStr, // TEXT 类型，支持任何字符串
          key: keyName,
          content: content,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,key'
        });
      
      if (error) {
        console.error(`Error saving ${keyName} to Supabase:`, error);
        // 如果是 UUID 类型错误，提示用户
        if (error.message?.includes('UUID') || error.message?.includes('uuid')) {
          console.error(`UUID 类型错误：请确保数据库 user_id 字段是 TEXT 类型。当前 user_id: ${userIdStr}`);
        }
      }
    } catch (err) {
      console.error(`Error saving ${keyName} to Supabase:`, err);
    }
  }, []);

  // 保存全局配置到 Supabase
  // currentUser 需要在所有使用它的函数之前定义
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // 【小白说明】这行代码的意思是：启动时先看一眼浏览器有没有存过用户信息
    const saved = localStorage.getItem('growth_app_current_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const saveGlobalConfig = useCallback(async (key: string, content: any) => {
    // 修复保存权限报错：只有管理员才能写入全局配置
    if (!currentUser || (!currentUser.isAdmin && currentUser.id !== 'admin')) {
      // 普通用户禁止写入全局配置，只允许读取
      console.log(`普通用户无权写入全局配置 ${key}，已跳过`);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('global_configs')
        .upsert({
          key: key,
          content: content,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });
      
      if (error) {
        console.error(`Error saving global config ${key} to Supabase:`, error);
        // 修复 404：如果表不存在或权限问题，输出详细错误信息
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('not found')) {
          console.error(`表 global_configs 可能不存在或无法访问。请检查数据库配置。错误详情:`, error);
        }
      } else {
        console.log(`全局配置 ${key} 已成功保存`);
      }
    } catch (err) {
      console.error(`Error saving global config ${key} to Supabase:`, err);
    }
  }, [currentUser]);

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
  const [weekShift, setWeekShift] = useState<number>(() => loadState('growth_app_week_shift', 0));
  const [checkInConfig, setCheckInConfig] = useState<CheckInConfig>(() => loadState('growth_app_checkin_config', INITIAL_CHECKIN_CONFIG));
  const [lang, setLang] = useState<Language>(() => loadState('growth_app_lang', 'zh'));
  
  // 从 Supabase 加载所有用户
  const loadAllUsers = useCallback(async () => {
    try {
      // 从 user_data 表获取所有用户的 profile 信息
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
      // 使用一个对象暂存，避免多次 setState 导致页面闪烁
      data.forEach((row: { key: string; content: any }) => {
        const { key, content } = row;
        if (!content) return;

        switch (key) {
          case 'courses_map':
            setCoursesMap(content);
            break;
          case 'course_contents':
            setCourseContents(content);
            break;
          case 'splash_quotes':
            if (Array.isArray(content)) setSplashQuotes(content);
            break;
          case 'home_quotes':
            if (Array.isArray(content)) setHomeQuotes(content);
            break;
          case 'checkin_config':
            setCheckInConfig(content);
            break;
          case 'auth_code':
            setAuthCode(content);
            break;
          case 'weekly_states':
            setWeeklyStates(content);
            break;
        }
      });
      console.log('--- 云端全局配置已同步 ---');
    }
  } catch (err) {
    console.error('Error loading global configs from Supabase:', err);
  }
}, []);


  // 刷新 weeklyStates：从全局配置和 user_data 表加载所有用户的周状态
  const refreshWeeklyStates = useCallback(async () => {
    try {
      // 首先从全局配置加载（管理员保存的汇总数据）
      const { data: globalData, error: globalError } = await supabase
        .from('global_configs')
        .select('content')
        .eq('key', 'weekly_states')
        .single();
      
      const allStates: Record<string, UserWeeklyState> = {};
      
      if (!globalError && globalData && globalData.content) {
        Object.assign(allStates, globalData.content);
      }
      
      // 同时从 user_data 表加载所有用户的周状态（确保实时性）
      const { data: userDataStates, error: userDataError } = await supabase
        .from('user_data')
        .select('user_id, content')
        .like('key', 'weekly_state_%');
      
      if (!userDataError && userDataStates) {
        // 合并 user_data 表中的周状态数据
        userDataStates.forEach((row: any) => {
          if (row.content && typeof row.content === 'object') {
            const state = row.content as UserWeeklyState;
            if (state.key) {
              allStates[state.key] = state;
            }
          }
        });
      }
      
      // 更新状态
      if (Object.keys(allStates).length > 0) {
        setWeeklyStates(allStates);
      }
    } catch (err) {
      console.error('Error refreshing weekly states:', err);
    }
  }, []);

  // 全局数据监听：从 Supabase 拉取所有用户的功课时长、打卡和请假状态
  const loadAllUsersData = useCallback(async () => {
    try {
      // 从 daily_stats 表拉取当天所有用户的数据（最准确和实时）
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: dailyStatsData, error: dailyStatsError } = await supabase
        .from('daily_stats')
        .select('user_id, nianfo, baifo, zenghui, breath')
        .eq('date', todayStr);
      
      if (!dailyStatsError && dailyStatsData) {
        const allStats: Record<string, DailyStats> = {};
        dailyStatsData.forEach((row: any) => {
          allStats[row.user_id] = {
            nianfo: row.nianfo || 0,
            baifo: row.baifo || 0,
            zenghui: row.zenghui || 0,
            breath: row.breath || 0,
          };
        });
        // 合并到现有的 userStatsMap
        setUserStatsMap(prev => ({ ...prev, ...allStats }));
      }

      // 拉取所有用户的 weekly_states 数据（从全局配置）
      await refreshWeeklyStates();
    } catch (err) {
      console.error('Error loading all users data:', err);
    }
  }, [refreshWeeklyStates]);
  
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.HOME);
  const [history, setHistory] = useState<ViewName[]>([]);
  const [selectedTimerType, setSelectedTimerType] = useState<TimerType>(TimerType.NIANFO);
  const [checkInStatus, setCheckInStatus] = useState<CheckInType>(CheckInType.NONE);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const initialLeaveState: LeaveState = { hasLeft: false, leaveReason: '', hasRevokedLeave: false };
  const [currentWeek, setCurrentWeek] = useState<LeaveState>(initialLeaveState);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  useEffect(() => { localStorage.setItem('growth_app_users', JSON.stringify(allUsers)); }, [allUsers]);
  
  // 同步用户数据到 Supabase
  useEffect(() => {
    if (currentUser?.id) {
      const userStats = userStatsMap[currentUser.id];
      if (userStats) {
        saveToSupabase(currentUser.id, 'growth_app_stats', userStats);
      }
    }
    // 同时保存到 LocalStorage 作为备份
    localStorage.setItem('growth_app_stats', JSON.stringify(userStatsMap));
  }, [userStatsMap, currentUser, saveToSupabase]);

  useEffect(() => {
    if (currentUser?.id) {
      const userHistory = userHistoryMap[currentUser.id];
      if (userHistory) {
        // 只保留最近7天的数据
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const filteredHistory: Record<string, number> = {};
        Object.entries(userHistory).forEach(([date, minutes]) => {
          const dateObj = new Date(date);
          if (dateObj >= sevenDaysAgo) {
            filteredHistory[date] = minutes;
          }
        });
        
        // 更新本地状态，移除超过7天的数据
        if (Object.keys(filteredHistory).length < Object.keys(userHistory).length) {
          setUserHistoryMap(prev => ({
            ...prev,
            [currentUser.id]: filteredHistory
          }));
        }
        
        saveToSupabase(currentUser.id, 'growth_app_user_history', filteredHistory);
      }
    }
    localStorage.setItem('growth_app_user_history', JSON.stringify(userHistoryMap));
  }, [userHistoryMap, currentUser, saveToSupabase]);

  // 清理超过7天的 daily_stats 数据
  useEffect(() => {
    const cleanupOldData = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('daily_stats')
          .delete()
          .lt('date', sevenDaysAgoStr);
        
        if (error) {
          console.error('Error cleaning up old daily stats:', error);
        }
      } catch (err) {
        console.error('Error cleaning up old daily stats:', err);
      }
    };
    
    // 每天清理一次
    cleanupOldData();
    const interval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // 24小时
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      const userRecords = userRecordsMap[currentUser.id];
      if (userRecords) {
        // 只保存最多50条记录
        const limitedRecords = userRecords.slice(0, 50);
        saveToSupabase(currentUser.id, 'growth_app_records', limitedRecords);
        // 如果超过50条，更新本地状态
        if (userRecords.length > 50) {
          setUserRecordsMap(prev => ({
            ...prev,
            [currentUser.id]: limitedRecords
          }));
        }
      }
    }
    localStorage.setItem('growth_app_records', JSON.stringify(userRecordsMap));
  }, [userRecordsMap, currentUser, saveToSupabase]);

  useEffect(() => {
    // 保存所有用户的周状态到全局配置表（只有管理员才能写入）
    if (Object.keys(weeklyStates).length > 0) {
      // 只有管理员才能保存全局配置
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

  // 初始化：加载所有用户和全局配置
  useEffect(() => {
    loadAllUsers();
    loadGlobalConfig();
    loadAllUsersData();
    refreshWeeklyStates();
  }, [loadAllUsers, loadGlobalConfig, loadAllUsersData, refreshWeeklyStates]);

  // 强制初始化加载：当 currentUser 存在时，立即执行一次 loadAllUsersData
  useEffect(() => {
    if (currentUser) {
      // 立即加载一次，确保全班人的时长都拉取到 userStatsMap 里
      loadAllUsersData();
    }
  }, [currentUser, loadAllUsersData]);

  // ========== 临时测试数据：给 userStatsMap 塞进 3 个虚拟用户的时长 ==========
  useEffect(() => {
    // 临时测试数据：3 个虚拟用户，时长分别是 1分、5分、10分
    setUserStatsMap(prev => ({
      ...prev,
      'test_user_1': { nianfo: 1, baifo: 0, zenghui: 0, breath: 0 }, // 1分钟
      'test_user_2': { nianfo: 3, baifo: 2, zenghui: 0, breath: 0 }, // 5分钟
      'test_user_3': { nianfo: 5, baifo: 3, zenghui: 2, breath: 0 }, // 10分钟
    }));
  }, []); // 只在组件挂载时执行一次
  // ========== 临时测试数据结束 ==========

  // 全局数据监听：当 currentView 切换时，重新拉取所有用户数据
  useEffect(() => {
    if (currentUser) {
      loadAllUsersData();
    }
  }, [currentView, currentUser, loadAllUsersData]);

  // 初始化：检查 Supabase session 并加载用户数据
 // 初始化：检查 Supabase session 并加载用户数据
 useEffect(() => {
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // ... 保持你原来的 session 处理逻辑 ...
      } else {
        // 【核心修复点】：这里要用 'growth_app_current_user' 才能读到你存的整个人
        const savedUserJson = localStorage.getItem('growth_app_current_user');
        if (savedUserJson) {
          const u = JSON.parse(savedUserJson);
          if (u) {
            setCurrentUser(u);
            // --- 新增：跨天归零逻辑 ---
const todayStr = getBeijingDateString(); // 获取北京时间今天
const lastDate = localStorage.getItem('last_active_date');

if (lastDate && lastDate !== todayStr) {
  // 1. 日期变了，说明过 0 点了。
  // 先把旧的 stats 备份到 history（如果 history 里还没存这一天的话）
  const oldStats = JSON.parse(localStorage.getItem('growth_app_stats') || '{}');
  const currentUserStats = oldStats[u.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
  // 1.5 在清空前，把昨天的总时长存入历史记录，这样 7 天趋势图才会更新
  const totalMins = currentUserStats.nianfo + currentUserStats.baifo + currentUserStats.zenghui + currentUserStats.breath;
  if (totalMins > 0) {
    setUserHistoryMap(prev => ({
      ...prev,
      [u.id]: {
        ...(prev[u.id] || {}),
        [lastDate]: totalMins // 使用旧日期作为 key
      }
    }));
  }
  // 2. 重置当天的功课时长为 0
  setUserStatsMap(prev => ({
    ...prev,
    [u.id]: { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 }
  }));
}
// 3. 更新最后的活跃日期为今天
localStorage.setItem('last_active_date', todayStr);
            await loadUserDataFromSupabase(u.id);
          }
        }
        if (savedUserJson) {
          const u = JSON.parse(savedUserJson);
          if (u && u.id) {
            setCurrentUser(u);
            await loadUserDataFromSupabase(u.id);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    }
  };
  initAuth();
}, []);

  const currentWeekRangeStr = calculateWeekRange(weekShift, 0);

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

  const dailyStats = currentUser ? (userStatsMap[currentUser.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 }) : { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
  const records = currentUser ? (userRecordsMap[currentUser.id] || []) : [];
  const historyStats = currentUser ? (userHistoryMap[currentUser.id] || {}) : {};

  const handleUpdateWeeklyState = (weekRange: string, updates: Partial<UserWeeklyState>) => {
    if (!currentUser) return;
    const key = `${currentUser.id}_${weekRange}`;
    setWeeklyStates(prev => {
        const existing = prev[key] || {
            key,
            userId: currentUser.id,
            userName: currentUser.name,
            weekRange,
            leaveReason: '',
            checkInStatus: '',
            updatedAt: ''
        };
        const updatedState = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        const updated = {
            ...prev,
            [key]: updatedState
        };
        
        // 同步打卡/请假：立即保存到 user_data 表，确保实时写入
        (async () => {
          try {
            // 确保 user_id 是字符串类型，支持 "admin" 等字符串
            const userIdStr = String(currentUser.id);
            
            // 保存当前用户的周状态到 user_data 表
            const { error: userDataError } = await supabase
              .from('user_data')
              .upsert({
                user_id: userIdStr, // TEXT 类型，支持 "admin" 字符串
                key: `weekly_state_${weekRange}`,
                content: updatedState,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,key'
              });
            
            if (userDataError) {
              console.error('Error saving weekly state to user_data:', userDataError);
              // 如果是 UUID 类型错误，提示用户
              if (userDataError.message?.includes('UUID') || userDataError.message?.includes('uuid')) {
                console.error(`UUID 类型错误：请确保数据库 user_id 字段是 TEXT 类型。当前 user_id: ${userIdStr}`);
              }
            } else {
              console.log(`用户 ${currentUser.name} 的周状态已保存到 user_data 表`);
            }
            
            // 同时保存到全局配置（用于管理员后台显示）
            if (currentUser.isAdmin || currentUser.id === 'admin') {
              saveGlobalConfig('weekly_states', updated);
            }
          } catch (err) {
            console.error('Error saving weekly state to user_data:', err);
          }
        })();
        
        return updated;
    });
  };

  const handleAddMinutes = async (type: TimerType, minutes: number) => {
    if (minutes <= 0 || !currentUser) return;
    
    const todayStr = getBeijingDateString();
    
    // 更新本地状态
    setUserStatsMap(prev => {
        const currentStats = prev[currentUser.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
        const key = type === TimerType.NIANFO ? 'nianfo' 
                  : type === TimerType.BAIFO ? 'baifo'
                  : type === TimerType.ZENGHUI ? 'zenghui'
                  : 'breath';
        const updatedStats = {
            ...currentStats,
            [key]: currentStats[key] + minutes
        };
        
        // 保存当天数据到 daily_stats 表
        (async () => {
          try {
            await supabase
              .from('daily_stats')
              .upsert({
                user_id: currentUser.id,
                date: todayStr,
                nianfo: updatedStats.nianfo,
                baifo: updatedStats.baifo,
                zenghui: updatedStats.zenghui,
                breath: updatedStats.breath,
                total_minutes: updatedStats.nianfo + updatedStats.baifo + updatedStats.zenghui + updatedStats.breath,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,date'
              });
          } catch (err) {
            console.error('Error saving daily stats:', err);
          }
        })();
        
        return {
            ...prev,
            [currentUser.id]: updatedStats
        };
    });
    
    setUserHistoryMap(prev => {
        const userHist = prev[currentUser.id] || {};
        const oldVal = userHist[todayStr] || 0;
        return {
            ...prev,
            [currentUser.id]: {
                ...userHist,
                [todayStr]: oldVal + minutes
            }
        };
    });
  };

  // 从 Supabase 加载用户数据
  const loadUserDataFromSupabase = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('key, content')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user data from Supabase:', error);
        return;
      }

      if (data) {
        // 更新各个状态
        data.forEach((row: { key: string; content: any }) => {
          const { key, content } = row;
          
          switch (key) {
            case 'growth_app_stats':
              setUserStatsMap(prev => ({
                ...prev,
                [userId]: content
              }));
              break;
            case 'growth_app_user_history':
              // 只保留最近7天的数据
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const filteredHistory: Record<string, number> = {};
              if (content && typeof content === 'object') {
                Object.entries(content).forEach(([date, minutes]) => {
                  const dateObj = new Date(date);
                  if (dateObj >= sevenDaysAgo) {
                    filteredHistory[date] = minutes as number;
                  }
                });
              }
              setUserHistoryMap(prev => ({
                ...prev,
                [userId]: filteredHistory
              }));
              break;
            case 'growth_app_records':
              // 只保留最多50条记录
              const recordsArray = Array.isArray(content) ? content : [];
              const limitedRecords = recordsArray.slice(0, 50);
              setUserRecordsMap(prev => ({
                ...prev,
                [userId]: limitedRecords
              }));
              break;
            // weekly_states 现在从全局配置加载，不再从用户数据加载
          }
        });
      }
      
      // 从 daily_stats 加载当天的数据，更新到 userStatsMap
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_stats')
        .select('nianfo, baifo, zenghui, breath')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .single();
      
      if (!dailyError && dailyData) {
        setUserStatsMap(prev => ({
          ...prev,
          [userId]: {
            nianfo: dailyData.nianfo || 0,
            baifo: dailyData.baifo || 0,
            zenghui: dailyData.zenghui || 0,
            breath: dailyData.breath || 0,
          }
        }));
      }
     // --- 这里的逻辑：只获取北京时间“昨天”及以前的 7 天数据 ---
  const currentDate = getBeijingDateString(); 
  const todayObj = new Date(currentDate); 
  
  // 1. 计算北京时间的“昨天” (作为查询的终点)
  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(todayObj.getDate() - 1);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
  
  // 2. 计算“昨天的 6 天前” (作为查询的起点，共 7 天)
  const startDateObj = new Date(yesterdayObj);
  startDateObj.setDate(yesterdayObj.getDate() - 6); 
  const startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;

  const { data: historyData, error: historyError } = await supabase
    .from('daily_stats')
    .select('date, total_minutes')
    .eq('user_id', userId)
    .gte('date', startDateStr) // 大于等于起点
    .lte('date', yesterdayStr) // 小于等于昨天（彻底排除今天，解决长高问题）
    .order('date', { ascending: true });
  
  if (!historyError && historyData) {
    const historyMap: Record<string, number> = {};
    historyData.forEach((row: any) => {
      historyMap[row.date] = row.total_minutes || 0;
    });
    setUserHistoryMap(prev => ({
      ...prev,
      [userId]: historyMap
    }));
  }
    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
    }
  };

  const handleLogin = async (user: User) => {
    const isNewUser = !allUsers.find(u => u.id === user.id);
    
    // 如果用户不在列表中，添加到列表
    if (isNewUser) {
      setAllUsers(prev => [...prev, user]);
      // 保存用户信息到 Supabase
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
        
        // 为新用户创建初始化的 stats 记录
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
        
        // 为新用户创建初始化的 weekly_states 记录（通过全局配置）
        const currentWeekRangeStr = calculateWeekRange(0, 0);
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
          // 保存到全局配置
          saveGlobalConfig('weekly_states', updated);
          return updated;
        });
        
        // 更新本地状态
        setUserStatsMap(prev => ({
          ...prev,
          [user.id]: initialStats
        }));
      } catch (err) {
        console.error('Error saving user profile to Supabase:', err);
      }
    } else {
      setAllUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }
    
    setCurrentUser(user);
    localStorage.setItem('growth_app_current_user', JSON.stringify(user));
    
    // 从 Supabase 加载用户数据
    await loadUserDataFromSupabase(user.id);
    
    // 重新加载所有用户列表（确保包含最新注册的用户）
    await loadAllUsers();
    
    // 重新加载所有用户数据（包括功课时长和打卡/请假状态）
    await loadAllUsersData();
    
    // 如果是新用户，确保立即在全局数据中可见
    if (isNewUser) {
      // 延迟一下确保数据已保存
      setTimeout(async () => {
        await loadAllUsers();
        await loadAllUsersData();
      }, 1000);
    }
    
    // 检查是否是管理员登录（账号 管理员 和密码 010101）
    if ((user.name === '管理员' || user.isAdmin === true) && 
        (user.password === '010101' || user.id === 'admin')) {
      setCurrentView(ViewName.ADMIN);
      // 强制初始化保存：管理员登录成功后，立即保存所有全局配置到数据库
      setTimeout(async () => {
        await handleSaveGlobalConfigs();
      }, 500); // 延迟500ms确保状态已更新
    }
  };

  const handleLogout = async () => {
    // 登出 Supabase session
    await supabase.auth.signOut();
    localStorage.removeItem('growth_app_current_user_id');
    setCurrentUser(null);
    setCurrentView(ViewName.HOME);
    setHistory([]);
  };

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

  const handleSaveRecord = (type: string, content: string, colors: any) => {
    if (!currentUser) return;
    
    const userRecs = userRecordsMap[currentUser.id] || [];
    
    // 如果是编辑记录，直接保存
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
    
    // 如果是新记录，检查是否超过50条
    if (userRecs.length >= 50) {
      alert('记录数量已达到上限（50条），请先删除一些记录后再添加。');
      return;
    }
    
    // 添加新记录
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
    // 只有管理员才能保存全局配置
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
        // 保存用户信息到 Supabase
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
  // 1. 强制显示海报：只要 showSplash 是 true，就先看海报
  // 不管有没有登录，都先展示仪式感
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

  // 2. 海报消失后，如果数据还没同步完，等一下
  if (!allUsers || allUsers.length <= 1) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0EEE9] text-[#6D8D9D]">
        正在同步云端数据...
      </div>
    );
  }

  // 3. 登录判断
  if (!currentUser) {
    return <Login onLogin={handleLogin} users={allUsers} authCode={authCode} lang={lang} setLang={setLang} />;
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
        {currentView === ViewName.STATS && <StatsView stats={dailyStats} history={historyStats} lang={lang} user={currentUser} homeQuotes={homeQuotes} allUsersStats={userStatsMap} />}
        {currentView === ViewName.DAILY && (
          <DailyView checkInStatus={checkInStatus} setCheckInStatus={setCheckInStatus} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} currentDateStr={currentWeekRangeStr} onNavigate={navigate} setCourseId={setSelectedCourseId} classVersion={currentUser.classVersion} courses={coursesMap[currentUser.classVersion] || []} onUpdateWeeklyState={handleUpdateWeeklyState} checkInConfig={checkInConfig} lang={lang} />
        )}
        {currentView === ViewName.COURSE_DETAIL && <CourseDetail courseId={selectedCourseId} content={courseContents[currentContentKey] || ''} courses={coursesMap[currentUser.classVersion] || []} lang={lang} />}
        {currentView === ViewName.RECORD && <RecordView onOpenInput={openNewRecordModal} records={records} onDelete={handleDeleteRecord} onEdit={openEditModal} onPin={handlePinRecord} lang={lang} />}
        {currentView === ViewName.ADMIN && (
          <Admin courseContents={courseContents} onUpdateCourseContent={handleUpdateCourseContent} onUpdateCourseStatus={handleUpdateCourseStatus} onUpdateCourseTitle={handleUpdateCourseTitle} allUsers={allUsers} onUpdateUserPermission={handleUpdateUserPermission} coursesMap={coursesMap} onAddCourseWeek={handleAddCourseWeek} onDeleteCourseWeek={handleDeleteCourseWeek} authCode={authCode} setAuthCode={setAuthCode} weeklyStates={weeklyStates} splashQuotes={splashQuotes} setSplashQuotes={setSplashQuotes} homeQuotes={homeQuotes} setHomeQuotes={setHomeQuotes} checkInConfig={checkInConfig} setCheckInConfig={setCheckInConfig} lang={lang} onSaveGlobalConfigs={handleSaveGlobalConfigs} onRefreshUsers={loadAllUsers} onRefreshWeeklyStates={refreshWeeklyStates} />
        )}
      </Layout>
      {currentView === ViewName.RECORD_INPUT && <RecordInputModal onClose={goBack} onSave={handleSaveRecord} initialData={editingRecord} lang={lang} />}
    </>
  );
};

export default App;