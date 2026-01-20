
import React, { useState, useEffect, useRef } from 'react';
import { User, CourseScheduleMap, CourseContentMap, CourseWeek, CourseStatus, UserWeeklyState, CheckInConfig, Language } from '../types';
import { Icons } from '../components/Icons';
import { TRANSLATIONS, playSound } from '../constants';
import { supabase } from '../src/supabaseClient';

interface AdminProps {
  allUsers: User[];
  onUpdateUserPermission: (userId: string, updates: Partial<User>) => void;
  coursesMap: CourseScheduleMap;
  courseContents: CourseContentMap;
  onUpdateCourseContent: (version: string, id: number, content: string) => void;
  onUpdateCourseStatus: (version: string, id: number, status: CourseStatus) => void;
  onUpdateCourseTitle: (version: string, id: number, title: string) => void;
  onAddCourseWeek: (version: string) => void;
  onDeleteCourseWeek: (version: string, idToDelete: number) => void;
  weeklyStates: Record<string, UserWeeklyState>;
  splashQuotes: string[];
  setSplashQuotes: (quotes: string[]) => void;
  homeQuotes: string[];
  setHomeQuotes: (quotes: string[]) => void;
  checkInConfig: CheckInConfig;
  setCheckInConfig: (config: CheckInConfig) => void;
  lang: Language;
  authCode: string;
  setAuthCode: (code: string) => void;
  onSaveGlobalConfigs: () => Promise<void>;
  onRefreshUsers: () => Promise<void>;
  onRefreshWeeklyStates: () => Promise<void>;
}

const Admin: React.FC<AdminProps> = ({ 
  allUsers, onUpdateUserPermission, coursesMap, courseContents, onUpdateCourseContent, onUpdateCourseStatus, onUpdateCourseTitle, onAddCourseWeek, onDeleteCourseWeek, weeklyStates, splashQuotes, setSplashQuotes, homeQuotes, setHomeQuotes, checkInConfig, setCheckInConfig, lang, authCode, setAuthCode, onSaveGlobalConfigs, onRefreshUsers, onRefreshWeeklyStates
}) => {
  const t = TRANSLATIONS[lang].admin;
  const [activeTab, setActiveTab] = useState<'signups' | 'courses' | 'users' | 'config'>('signups');
  const [toast, setToast] = useState<string | null>(null);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newCheckInsCount, setNewCheckInsCount] = useState(0);
  const lastUsersCountRef = useRef(0);
  const lastWeeklyStatesCountRef = useRef(0);

  // Fix: Explicitly cast Object.values result to UserWeeklyState[] to fix 'unknown' type errors
  const recordsArray = Object.values(weeklyStates) as UserWeeklyState[];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  // 实时同步用户列表和打卡/请假信息
  useEffect(() => {
    const syncData = async () => {
      try {
        await onRefreshUsers();
        await onRefreshWeeklyStates();
      } catch (err) {
        console.error('Error syncing data in Admin:', err);
      }
    };

    // 立即同步一次
    syncData();

    // 每3秒同步一次，确保实时显示最新数据
    const interval = setInterval(syncData, 3000);
    return () => clearInterval(interval);
  }, [onRefreshUsers, onRefreshWeeklyStates]);

  // 检测新用户和新的打卡/请假信息
  useEffect(() => {
    const currentUsersCount = allUsers.length;
    const currentWeeklyStatesCount = recordsArray.length;

    // 检测新用户
    if (lastUsersCountRef.current > 0 && currentUsersCount > lastUsersCountRef.current) {
      const newCount = currentUsersCount - lastUsersCountRef.current;
      setNewUsersCount(prev => prev + newCount);
    }
    lastUsersCountRef.current = currentUsersCount;

    // 检测新的打卡/请假信息（包括新申请和更新）
    if (lastWeeklyStatesCountRef.current > 0) {
      // 检查是否有新的记录或更新的记录（通过比较 updatedAt）
      const newRecords = recordsArray.filter(r => {
        const lastUpdate = new Date(r.updatedAt).getTime();
        const now = Date.now();
        // 如果记录在最近30秒内更新，认为是新申请
        return (now - lastUpdate) < 30000;
      });
      
      if (newRecords.length > 0) {
        setNewCheckInsCount(prev => {
          // 只增加未读的数量
          const unreadCount = newRecords.length;
          return prev + unreadCount;
        });
      }
    }
    lastWeeklyStatesCountRef.current = currentWeeklyStatesCount;
  }, [allUsers.length, recordsArray, recordsArray.length]);

  // 点击标签时清除对应角标
  const handleTabClick = (tab: typeof activeTab) => {
    if (tab === 'users') {
      setNewUsersCount(0);
    } else if (tab === 'signups') {
      setNewCheckInsCount(0);
    }
    setActiveTab(tab);
    playSound('light');
  };
  
  const exportToCSV = () => {
    // Fix: Using the properly typed recordsArray instead of Object.values directly
    if (recordsArray.length === 0) { showToast('暂无数据导出'); return; }
    const headers = ['姓名', '周次', '签到状态', '请假原因', '更新时间'];
    const csvContent = [headers.join(','), ...recordsArray.map(r => [
      r.userName, 
      r.weekRange, 
      r.checkInStatus || '未签到', 
      r.leaveReason || '无', 
      r.updatedAt
    ].join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `学习状态导出.csv`;
    link.click();
    showToast('导出成功');
  };

  const [selectedVer, setSelectedVer] = useState('成长班 1.0');
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const currentWeek = coursesMap[selectedVer]?.[selectedWeekIdx];

  const TabButton = ({ id, label, icon: Icon, badge }: { id: typeof activeTab, label: string, icon: any, badge?: number }) => (
    <button
      onClick={() => handleTabClick(id)}
      className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[11px] md:text-sm font-bold transition-all ${activeTab === id ? 'bg-primary text-white shadow-lg' : 'text-textSub hover:bg-gray-100'}`}
    >
      <span className="hidden md:inline"><Icon size={16} /></span>
      {label}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-cloud/30 animate-fade-in relative overflow-hidden">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2.5 rounded-full z-[100] text-sm shadow-xl flex items-center gap-2"><Icons.Check size={16} className="text-mint" /> {toast}</div>}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-textMain tracking-tight">{t.title}</h2>
        <div className="flex bg-white/60 p-1 rounded-2xl border border-white/50 shadow-sm overflow-x-auto no-scrollbar">
            <TabButton id="signups" label={t.tabs.signups} icon={Icons.Stats} badge={newCheckInsCount} />
            <TabButton id="courses" label={t.tabs.courses} icon={Icons.Daily} />
            <TabButton id="users" label={t.tabs.users} icon={Icons.Check} badge={newUsersCount} />
            <TabButton id="config" label={t.tabs.settings} icon={Icons.Tools} />
        </div>
      </div>

      <div className={`flex-1 transition-all md:bg-white/60 md:backdrop-blur-md md:rounded-[2.5rem] md:p-6 md:shadow-xl md:border md:border-white/60 overflow-y-auto no-scrollbar`}>
        
        {activeTab === 'signups' && (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-primary">{t.tabs.signups}</h3>
                    <button onClick={exportToCSV} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                       <Icons.Plus className="rotate-0" size={12} /> {t.export}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 text-textSub text-[10px] uppercase">
                            <tr>
                                <th className="px-2 py-3">姓名</th>
                                <th className="px-2 py-3">周次</th>
                                <th className="px-2 py-3">签到/请假</th>
                                <th className="px-2 py-3">原因</th>
                                <th className="px-2 py-3">更新时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Fix: Using the properly typed and sorted recordsArray to avoid unknown property errors */}
                            {recordsArray.length > 0 ? [...recordsArray].sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).map(r => (
                                <tr key={r.key} className="bg-white md:bg-transparent hover:bg-white/40 transition-colors">
                                    <td className="px-2 py-4 font-medium whitespace-nowrap">{r.userName}</td>
                                    <td className="px-2 py-4 text-[10px] text-textSub">{r.weekRange}</td>
                                    <td className="px-2 py-4">
                                        {r.leaveReason ? (
                                            <span className="text-[10px] bg-red-100 text-red-500 px-2 py-1 rounded-full font-bold">已请假</span>
                                        ) : (
                                            <span className={`text-[10px] ${r.checkInStatus ? 'bg-mint/20 text-primary' : 'bg-gray-100 text-textSub'} px-2 py-1 rounded-full`}>
                                                {r.checkInStatus || '未签到'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-4 text-[10px] text-textSub truncate max-w-[120px]">{r.leaveReason || '-'}</td>
                                    <td className="px-2 py-4 text-[10px] text-gray-400 font-mono">{new Date(r.updatedAt).toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="py-12 text-center text-textSub text-xs">暂无学习记录数据</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'courses' && (
            <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">
                <div className="w-full md:w-64 space-y-4 shrink-0 flex flex-col">
                    <div className="flex flex-col gap-2">
                        {['成长班 1.0', '感理班 2.0'].map(v => (
                            <button key={v} onClick={() => { setSelectedVer(v); setSelectedWeekIdx(0); }} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${selectedVer === v ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar pb-4">
                        {coursesMap[selectedVer]?.map((w, idx) => (
                            <button 
                                key={w.id} 
                                onClick={() => setSelectedWeekIdx(idx)} 
                                className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${selectedWeekIdx === idx ? 'border-primary bg-primary/5 shadow-sm' : 'bg-white border-transparent hover:border-gray-200'}`}
                            >
                                <div className="font-bold text-xs truncate">第{w.id}周 {w.title}</div>
                                <div className={`text-[10px] mt-1 ${w.status === CourseStatus.IN_PROGRESS ? 'text-primary font-bold' : 'text-textSub'}`}>{w.status}</div>
                            </button>
                        ))}
                        <button onClick={() => onAddCourseWeek(selectedVer)} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 text-xs rounded-xl hover:bg-white transition-colors active:scale-95">
                            {t.addWeek}
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col space-y-4">
                    <div className="bg-white p-5 md:p-6 rounded-2xl space-y-5 shadow-sm h-full flex flex-col border border-white/80">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.courseTitle}</label>
                            <input 
                                type="text" 
                                value={currentWeek?.title || ''} 
                                onChange={(e) => onUpdateCourseTitle(selectedVer, currentWeek?.id || 0, e.target.value)} 
                                className="w-full p-4 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 transition-shadow" 
                                placeholder={t.courseTitlePlaceholder} 
                            />
                        </div>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">课程状态</label>
                                <select 
                                    value={currentWeek?.status || CourseStatus.NOT_STARTED}
                                    onChange={(e) => onUpdateCourseStatus(selectedVer, currentWeek?.id || 0, e.target.value as CourseStatus)}
                                    className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value={CourseStatus.NOT_STARTED}>{CourseStatus.NOT_STARTED}</option>
                                    <option value={CourseStatus.IN_PROGRESS}>{CourseStatus.IN_PROGRESS}</option>
                                    <option value={CourseStatus.ENDED}>{CourseStatus.ENDED}</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => { if(currentWeek && confirm('确定要删除本周课程吗？')) onDeleteCourseWeek(selectedVer, currentWeek.id); }}
                                className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                                删除
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col space-y-1 min-h-[200px]">
                            <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.content}</label>
                            <textarea 
                                value={courseContents[`${selectedVer}-${currentWeek?.id}`] || ''} 
                                onChange={(e) => onUpdateCourseContent(selectedVer, currentWeek?.id || 0, e.target.value)} 
                                className="flex-1 w-full p-5 bg-gray-50 rounded-xl text-sm outline-none resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary/20" 
                                placeholder={t.contentPlaceholder} 
                            />
                        </div>
                        <button onClick={async () => { await onSaveGlobalConfigs(); showToast('修改已保存'); }} className="w-full py-4 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-transform active:scale-[0.98]">
                            保存当前周修改
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary">{t.tabs.users}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allUsers.map(u => {
                        const isSuperAdmin = u.id === 'admin';
                        const isAssistant = u.isAdmin && !isSuperAdmin;

                        return (
                            <div key={u.id} className="p-3 bg-white rounded-xl flex justify-between items-center shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                                <div className="flex flex-col min-w-0 flex-1 pr-2">
                                    <span className="font-bold text-sm text-textMain truncate">{u.name}</span>
                                    <div className="mt-1 flex flex-col gap-1">
                                        <select 
                                            value={u.classVersion}
                                            onChange={(e) => onUpdateUserPermission(u.id, { classVersion: e.target.value })}
                                            className="text-[10px] bg-gray-50 border border-gray-100 px-1 py-0.5 rounded outline-none w-full"
                                        >
                                            <option value="成长班 1.0">成长班 1.0</option>
                                            <option value="感理班 2.0">感理班 2.0</option>
                                        </select>
                                        <div className="flex gap-1">
                                            {isSuperAdmin && <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tight inline-block w-fit">超级管理员</span>}
                                            {isAssistant && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-tight inline-block w-fit">协管员</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button 
                                        onClick={() => { onUpdateUserPermission(u.id, { password: '111111' }); showToast(`${u.name} 密码已重置为 111111`); }} 
                                        className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/5"
                                    >
                                        重置
                                    </button>
                                    {!isSuperAdmin && (
                                        u.isAdmin ? (
                                            <button 
                                                onClick={() => { onUpdateUserPermission(u.id, { isAdmin: false }); showToast(`${u.name} 已取消协管权限`); }}
                                                className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1.5 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"
                                            >
                                                取消协管
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => { onUpdateUserPermission(u.id, { isAdmin: true }); showToast(`${u.name} 已设为协管员`); }}
                                                className="text-[9px] font-bold text-textSub bg-gray-50 px-2 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-100 transition-colors"
                                            >
                                                设为协管
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
{activeTab === 'config' && (
            <div className="space-y-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 左侧栏：系统参数 */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl space-y-5 shadow-sm border border-white/50">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-gray-50 pb-3"><Icons.Tools size={16}/> 系统参数设置</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.authCode}</label>
                                <input value={authCode} onChange={(e) => setAuthCode(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.splash} (每行一条文案)</label>
                                <textarea 
                                    value={splashQuotes.join('\n')} 
                                    onChange={(e) => setSplashQuotes(e.target.value.split('\n').filter(Boolean))} 
                                    className="w-full h-28 bg-gray-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.homeQuotes} (格式: 内容 —— 出处)</label>
                                <textarea 
                                    value={homeQuotes.join('\n')} 
                                    onChange={(e) => setHomeQuotes(e.target.value.split('\n').filter(Boolean))} 
                                    className="w-full h-40 bg-gray-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed" 
                                />
                            </div>
                            <button onClick={async () => { await onSaveGlobalConfigs(); showToast('配置已更新'); }} className="w-full py-4 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
                                保存配置
                            </button>
                        </div>
                    </div>

                    {/* 右侧栏：状态设置 + 位置设置 */}
                    <div className="space-y-6">
                        
                        {/* 🟢 正知正见状态设置 (修复了 Icon 报错) */}
                        <div className="bg-white p-6 rounded-2xl space-y-5 shadow-sm border border-white/50">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-gray-50 pb-3">
                                <Icons.Daily size={16}/> 正知正见状态设置
                            </h3>

                            {/* 状态切换开关 */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">当前修学状态</label>
                                <div className="flex bg-gray-50 p-1 rounded-xl w-full border border-gray-100">
                                    <button
                                        onClick={() => setCheckInConfig({ ...checkInConfig, isVacationMode: false })}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${!checkInConfig.isVacationMode ? 'bg-white text-primary shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        📚 正常上课
                                    </button>
                                    <button
                                        onClick={() => setCheckInConfig({ ...checkInConfig, isVacationMode: true })}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${checkInConfig.isVacationMode ? 'bg-white text-orange-500 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        🏖️ 假期模式
                                    </button>
                                </div>
                            </div>

                            {/* 根据状态显示不同的输入项 */}
                            {!checkInConfig.isVacationMode ? (
                                // 上课模式
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">本周起始日期 (用于周次计算)</label>
                                    <input
                                        type="date"
                                        value={checkInConfig.weekStartDate || ''}
                                        onChange={(e) => setCheckInConfig({ ...checkInConfig, weekStartDate: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 font-mono"
                                    />
                                    <p className="text-[10px] text-gray-400">设置后，所有学员端将以此日期开始打卡。</p>
                                </div>
                            ) : (
                                // 假期模式
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">预计复课说明</label>
                                    <input
                                        type="text"
                                        placeholder="例如：2月15日 (初八)"
                                        value={checkInConfig.resumeDate || ''}
                                        onChange={(e) => setCheckInConfig({ ...checkInConfig, resumeDate: e.target.value })}
                                        className="w-full p-3 bg-orange-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200 text-orange-800 placeholder-orange-300 border border-orange-100"
                                    />
                                    <p className="text-[10px] text-orange-400">假期模式下，学员端将隐藏打卡按钮，仅显示此提示。</p>
                                </div>
                            )}
                            
                            <button onClick={async () => { await onSaveGlobalConfigs(); showToast('修学状态已保存'); }} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
                                保存状态设置
                            </button>
                        </div>

                        {/* 位置设置 */}
                        <div className="bg-white p-6 rounded-2xl space-y-5 shadow-sm border border-white/50">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-gray-50 pb-3"><Icons.Location size={16}/> {t.locationConfig}</h3>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-textMain">开启范围签到限制</span>
                                <input 
                                    type="checkbox" 
                                    checked={checkInConfig.enabled} 
                                    onChange={(e) => setCheckInConfig({...checkInConfig, enabled: e.target.checked})} 
                                    className="w-5 h-5 accent-primary cursor-pointer" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.locName}</label>
                                <input 
                                    value={checkInConfig.locationName || ''} 
                                    onChange={(e) => setCheckInConfig({...checkInConfig, locationName: e.target.value})} 
                                    className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary/20" 
                                    placeholder="输入线下打卡点名称"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-textSub">中心纬度</label>
                                    <input type="number" step="0.000001" value={checkInConfig.latitude} onChange={(e) => setCheckInConfig({...checkInConfig, latitude: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-textSub">中心经度</label>
                                    <input type="number" step="0.000001" value={checkInConfig.longitude} onChange={(e) => setCheckInConfig({...checkInConfig, longitude: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-textSub uppercase tracking-wider">{t.radius}</label>
                                <input type="number" value={checkInConfig.radius} onChange={(e) => setCheckInConfig({...checkInConfig, radius: parseInt(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button 
                                    onClick={() => {
                                        showToast('正在获取位置...');
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            setCheckInConfig({
                                                ...checkInConfig,
                                                latitude: pos.coords.latitude,
                                                longitude: pos.coords.longitude
                                            });
                                            showToast('成功获取坐标');
                                        }, (err) => showToast('获取失败:' + err.message));
                                    }}
                                    className="py-3 bg-gray-100 text-textSub rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                    {t.getLocation}
                                </button>
                                <button onClick={async () => { await onSaveGlobalConfigs(); showToast('定位点已同步'); }} className="py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
                                    保存定位设置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Admin;