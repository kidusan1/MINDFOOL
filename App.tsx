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
  { id: 'u1', name: '张三', password: '111111', classVersion: '成长班 1.0', isAdmin: false },
  { id: 'u2', name: '李四', password: '111111', classVersion: '成长班 1.0', isAdmin: false },
  { id: 'u3', name: '王五', password: '111111', classVersion: '感理班 2.0', isAdmin: false },
  { id: 'u4', name: '周六', password: '111111', classVersion: '感理班 2.0', isAdmin: false },
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
  const saveToSupabase = useCallback(async (userId: string, keyName: string, content: any) => {
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          key_name: keyName,
          content: content,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,key_name'
        });
      
      if (error) {
        console.error(`Error saving ${keyName} to Supabase:`, error);
      }
    } catch (err) {
      console.error(`Error saving ${keyName} to Supabase:`, err);
    }
  }, []);

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
  
  // currentUser 需要在所有使用它的 useEffect 之前定义
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  useEffect(() => { localStorage.setItem('growth_app_auth_code', JSON.stringify(authCode)); }, [authCode]);
  useEffect(() => { localStorage.setItem('growth_app_splash_quotes', JSON.stringify(splashQuotes)); }, [splashQuotes]);
  useEffect(() => { localStorage.setItem('growth_app_home_quotes', JSON.stringify(homeQuotes)); }, [homeQuotes]);
  
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
        saveToSupabase(currentUser.id, 'growth_app_user_history', userHistory);
      }
    }
    localStorage.setItem('growth_app_user_history', JSON.stringify(userHistoryMap));
  }, [userHistoryMap, currentUser, saveToSupabase]);

  useEffect(() => {
    if (currentUser?.id) {
      const userRecords = userRecordsMap[currentUser.id];
      if (userRecords) {
        saveToSupabase(currentUser.id, 'growth_app_records', userRecords);
      }
    }
    localStorage.setItem('growth_app_records', JSON.stringify(userRecordsMap));
  }, [userRecordsMap, currentUser, saveToSupabase]);

  useEffect(() => {
    if (currentUser?.id) {
      // 过滤出当前用户的周状态
      const userWeeklyStates = Object.entries(weeklyStates)
        .filter(([key]) => key.startsWith(`${currentUser.id}_`))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, UserWeeklyState>);
      
      if (Object.keys(userWeeklyStates).length > 0) {
        saveToSupabase(currentUser.id, 'growth_app_weekly_states', userWeeklyStates);
      }
    }
    localStorage.setItem('growth_app_weekly_states', JSON.stringify(weeklyStates));
  }, [weeklyStates, currentUser, saveToSupabase]);

  useEffect(() => { localStorage.setItem('growth_app_courses_map', JSON.stringify(coursesMap)); }, [coursesMap]);
  useEffect(() => { localStorage.setItem('growth_app_course_content', JSON.stringify(courseContents)); }, [courseContents]);
  useEffect(() => { localStorage.setItem('growth_app_week_shift', JSON.stringify(weekShift)); }, [weekShift]);
  useEffect(() => { localStorage.setItem('growth_app_checkin_config', JSON.stringify(checkInConfig)); }, [checkInConfig]);
  useEffect(() => { localStorage.setItem('growth_app_lang', JSON.stringify(lang)); }, [lang]);

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

  // 初始化：检查 Supabase session 并加载用户数据
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 检查 Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          const user: User = {
            id: session.user.id,
            name: metadata.name || '',
            classVersion: metadata.classVersion || '成长班 1.0',
            isAdmin: metadata.isAdmin || false,
          };
          
          setCurrentUser(user);
          localStorage.setItem('growth_app_current_user_id', user.id);
          
          // 从 Supabase 加载用户数据
          await loadUserDataFromSupabase(user.id);
        } else {
          // 如果没有 session，尝试从 localStorage 恢复（兼容旧版本）
          const savedUserId = localStorage.getItem('growth_app_current_user_id');
          if (savedUserId) {
            const u = allUsers.find(user => user.id === savedUserId);
            if (u) {
              setCurrentUser(u);
              if (!userStatsMap[u.id]) {
                setUserStatsMap(prev => ({ ...prev, [u.id]: { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 } }));
              }
              if (!userRecordsMap[u.id]) {
                setUserRecordsMap(prev => ({ ...prev, [u.id]: [] }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // 失败时回退到 localStorage
        const savedUserId = localStorage.getItem('growth_app_current_user_id');
        if (savedUserId) {
          const u = allUsers.find(user => user.id === savedUserId);
          if (u) {
            setCurrentUser(u);
          }
        }
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
        return {
            ...prev,
            [key]: {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString()
            }
        };
    });
  };

  const handleAddMinutes = (type: TimerType, minutes: number) => {
    if (minutes <= 0 || !currentUser) return;
    setUserStatsMap(prev => {
        const currentStats = prev[currentUser.id] || { nianfo: 0, baifo: 0, zenghui: 0, breath: 0 };
        const key = type === TimerType.NIANFO ? 'nianfo' 
                  : type === TimerType.BAIFO ? 'baifo'
                  : type === TimerType.ZENGHUI ? 'zenghui'
                  : 'breath';
        return {
            ...prev,
            [currentUser.id]: {
                ...currentStats,
                [key]: currentStats[key] + minutes
            }
        };
    });
    const todayStr = new Date().toISOString().split('T')[0];
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
        .select('key_name, content')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user data from Supabase:', error);
        return;
      }

      if (data) {
        // 更新各个状态
        data.forEach((row: { key_name: string; content: any }) => {
          const { key_name, content } = row;
          
          switch (key_name) {
            case 'growth_app_stats':
              setUserStatsMap(prev => ({
                ...prev,
                [userId]: content
              }));
              break;
            case 'growth_app_user_history':
              setUserHistoryMap(prev => ({
                ...prev,
                [userId]: content
              }));
              break;
            case 'growth_app_records':
              setUserRecordsMap(prev => ({
                ...prev,
                [userId]: content
              }));
              break;
            case 'growth_app_weekly_states':
              setWeeklyStates(prev => ({
                ...prev,
                ...content
              }));
              break;
          }
        });
      }
    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
    }
  };

  const handleLogin = async (user: User) => {
    if (!allUsers.find(u => u.id === user.id)) setAllUsers(prev => [...prev, user]);
    else setAllUsers(prev => prev.map(u => u.id === user.id ? user : u));
    setCurrentUser(user);
    localStorage.setItem('growth_app_current_user_id', user.id);
    
    // 从 Supabase 加载用户数据
    await loadUserDataFromSupabase(user.id);
    
    // 检查是否是管理员登录（账号 admin 和密码 010101）
    // 支持多种情况：name === 'admin' 或 name === '管理员'，或者 isAdmin === true
    if ((user.name === 'admin' || user.name === '管理员' || user.isAdmin === true) && 
        (user.password === '010101' || user.id === 'admin')) {
      setCurrentView(ViewName.ADMIN);
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
    setUserRecordsMap(prev => {
        const userRecs = prev[currentUser.id] || [];
        let updatedRecs;
        if (editingRecord) {
            updatedRecs = userRecs.map(r => r.id === editingRecord.id ? { ...r, type, content, color: colors.color, bgColor: colors.bgColor, textColor: colors.textColor } : r);
        } else {
            const newRecord: GrowthRecord = { id: Date.now(), type, content, time: '刚刚', color: colors.color, bgColor: colors.bgColor, textColor: colors.textColor, isPinned: false };
            updatedRecs = [newRecord, ...userRecs];
        }
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
  const openNewRecordModal = () => { setEditingRecord(null); setHistory(prev => [...prev, ViewName.RECORD]); setCurrentView(ViewName.RECORD_INPUT); };
  
  const handleUpdateCourseContent = (version: string, id: number, content: string) => setCourseContents(prev => ({ ...prev, [`${version}-${id}`]: content }));
  const handleUpdateCourseStatus = (version: string, id: number, status: CourseStatus) => setCoursesMap(prev => ({ ...prev, [version]: (prev[version] || []).map(c => c.id === id ? { ...c, status } : c) }));
  const handleUpdateCourseTitle = (version: string, id: number, title: string) => setCoursesMap(prev => ({ ...prev, [version]: (prev[version] || []).map(c => c.id === id ? { ...c, title } : c) }));
  const handleAddCourseWeek = (version: string) => setCoursesMap(prev => {
      const list = prev[version] || [];
      const nextId = list.length + 1;
      return { ...prev, [version]: [...list, { id: nextId, title: `${version.includes('成长班') ? '成长班' : '感理班'} 第${nextId}周: (新课程)`, status: CourseStatus.NOT_STARTED }] };
  });
  const handleDeleteCourseWeek = (version: string, idToDelete: number) => setCoursesMap(prev => ({ ...prev, [version]: (prev[version] || []).filter(c => c.id !== idToDelete) }));
  const handleUpdateUserPermission = (userId: string, updates: Partial<User>) => setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

  if (showSplash) return <Splash onFinish={() => setShowSplash(false)} quotes={lang === 'en' ? SPLASH_QUOTES_EN : splashQuotes} />;
  if (!currentUser) return <Login onLogin={handleLogin} users={allUsers} authCode={authCode} lang={lang} setLang={setLang} />;

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
        {currentView === ViewName.STATS && <StatsView stats={dailyStats} history={historyStats} lang={lang} user={currentUser} homeQuotes={homeQuotes} />}
        {currentView === ViewName.DAILY && (
          <DailyView checkInStatus={checkInStatus} setCheckInStatus={setCheckInStatus} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} currentDateStr={currentWeekRangeStr} onNavigate={navigate} setCourseId={setSelectedCourseId} classVersion={currentUser.classVersion} courses={coursesMap[currentUser.classVersion] || []} onUpdateWeeklyState={handleUpdateWeeklyState} checkInConfig={checkInConfig} lang={lang} />
        )}
        {currentView === ViewName.COURSE_DETAIL && <CourseDetail courseId={selectedCourseId} content={courseContents[currentContentKey] || ''} courses={coursesMap[currentUser.classVersion] || []} lang={lang} />}
        {currentView === ViewName.RECORD && <RecordView onOpenInput={openNewRecordModal} records={records} onDelete={handleDeleteRecord} onEdit={openEditModal} onPin={handlePinRecord} lang={lang} />}
        {currentView === ViewName.ADMIN && (
          <Admin courseContents={courseContents} onUpdateCourseContent={handleUpdateCourseContent} onUpdateCourseStatus={handleUpdateCourseStatus} onUpdateCourseTitle={handleUpdateCourseTitle} allUsers={allUsers} onUpdateUserPermission={handleUpdateUserPermission} coursesMap={coursesMap} onAddCourseWeek={handleAddCourseWeek} onDeleteCourseWeek={handleDeleteCourseWeek} authCode={authCode} setAuthCode={setAuthCode} weeklyStates={weeklyStates} splashQuotes={splashQuotes} setSplashQuotes={setSplashQuotes} homeQuotes={homeQuotes} setHomeQuotes={setHomeQuotes} checkInConfig={checkInConfig} setCheckInConfig={setCheckInConfig} lang={lang} />
        )}
      </Layout>
      {currentView === ViewName.RECORD_INPUT && <RecordInputModal onClose={goBack} onSave={handleSaveRecord} initialData={editingRecord} lang={lang} />}
    </>
  );
};

export default App;