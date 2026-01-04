
import React, { useState, useRef } from 'react';
import { Icons } from '../components/Icons';
import { CheckInType, GrowthRecord, ViewName, LeaveState, CourseWeek, CourseStatus, UserWeeklyState, CheckInConfig, Language } from '../types';
import { playSound, TRANSLATIONS } from '../constants';

// ==========================================
// PART 1: DAILY VIEW
// ==========================================

interface DailyProps {
  checkInStatus: CheckInType;
  setCheckInStatus: (status: CheckInType) => void;
  currentWeek: LeaveState;
  setCurrentWeek: (state: LeaveState) => void;
  currentDateStr: string;
  onNavigate: (view: ViewName, params?: any) => void;
  setCourseId: (id: number) => void;
  classVersion?: string;
  courses?: CourseWeek[];
  onUpdateWeeklyState: (weekRange: string, updates: Partial<UserWeeklyState>) => void;
  checkInConfig?: CheckInConfig;
  lang: Language;
}

// Helper to calculate distance in meters (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

export const DailyView: React.FC<DailyProps> = ({ 
  checkInStatus, 
  setCheckInStatus, 
  currentWeek,
  setCurrentWeek,
  currentDateStr,
  onNavigate,
  setCourseId,
  classVersion = '1.0',
  courses = [],
  onUpdateWeeklyState,
  checkInConfig,
  lang
}) => {
  const t = TRANSLATIONS[lang].daily;
  const tApp = TRANSLATIONS[lang].app;
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  
  // Revoke Leave State
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

  const canCheckIn = !currentWeek.hasLeft;

  const handleOfflineCheckIn = () => {
    playSound('confirm');
    if (!canCheckIn) return;
    if (checkInStatus !== CheckInType.NONE) return;
    
    setIsLocating(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('设备不支持定位');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
          setIsLocating(false);
          
          // Check Location Restriction if enabled
          if (checkInConfig && checkInConfig.enabled) {
              const distance = calculateDistance(
                  position.coords.latitude,
                  position.coords.longitude,
                  checkInConfig.latitude,
                  checkInConfig.longitude
              );
              
              if (distance > checkInConfig.radius) {
                  setGeoError(`距离 ${checkInConfig.locationName || '共修点'} 太远 (当前:${Math.round(distance)}m, 限制:${checkInConfig.radius}m)`);
                  return;
              }
          }

          // Success
          setCheckInStatus(CheckInType.OFFLINE);
          onUpdateWeeklyState(currentDateStr, { checkInStatus: '线下签到' });
          playSound('confirm');
      },
      (error) => {
        setIsLocating(false);
        setGeoError('无法获取位置: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOnlineCheckIn = () => {
      playSound('confirm');
      if (!canCheckIn) return;
      setCheckInStatus(CheckInType.ONLINE);
      onUpdateWeeklyState(currentDateStr, { checkInStatus: '线上打卡' });
  }

  const handleSubmitLeave = () => {
    playSound('confirm');
    if (!leaveReason.trim()) return;
    setCurrentWeek({ ...currentWeek, hasLeft: true, leaveReason: leaveReason });
    onUpdateWeeklyState(currentDateStr, { leaveReason: leaveReason, checkInStatus: '' });
    setCheckInStatus(CheckInType.NONE); 
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const handleRevokeLeave = () => {
      playSound('confirm');
      // Reset State
      setCurrentWeek({ ...currentWeek, hasLeft: false, leaveReason: '', hasRevokedLeave: true });
      onUpdateWeeklyState(currentDateStr, { leaveReason: '', checkInStatus: '', hasRevokedLeave: true });
      setIsRevokeModalOpen(false);
  };

  const renderCurrentWeekCard = () => {
      const data = currentWeek;
      return (
        <div className={`bg-cloud rounded-2xl p-4 shadow-sm border border-white/50 w-full mb-4`}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-textSub font-medium">{t.weekStatus}</h3>
                    <span className="text-xs text-textSub bg-bgMain px-2 py-0.5 rounded-full">{currentDateStr}</span>
                </div>
            </div>

            {data.hasLeft ? (
                <div className="bg-red-50 rounded-xl p-4 flex flex-row items-center justify-between text-textSub relative border border-red-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-red-500 flex items-center gap-1">
                            <Icons.Cancel size={16} /> {t.leave}
                        </span>
                        <span className="text-xs mt-1 text-red-400">{t.leaveReason}: {data.leaveReason}</span>
                    </div>
                    
                    {/* Revoke Button - Only show if haven't revoked before */}
                    {!data.hasRevokedLeave && (
                         <button 
                            onClick={() => {
                                playSound('light');
                                setIsRevokeModalOpen(true);
                            }}
                            className="text-xs bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors shadow-sm ml-2"
                        >
                            {t.revokeLeave}
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white/50 rounded-xl p-4 flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                            <Icons.Check size={16} /> {t.normal}
                        </span>
                        <span className="text-xs mt-1 text-textSub">{t.checkInHint}</span>
                    </div>
                    <button 
                        onClick={() => { 
                            playSound('medium');
                            setIsLeaveModalOpen(true); 
                            setLeaveReason(''); 
                        }}
                        className="text-xs text-textSub bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {t.wantLeave}
                    </button>
                </div>
            )}
        </div>
      );
  };

  const CheckInSection = () => (
    <div className={`bg-cloud rounded-2xl p-4 shadow-sm border border-white/50 w-full mb-4 transition-opacity ${currentWeek.hasLeft ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-textSub font-medium">{t.checkIn}</h3>
            {checkInStatus !== CheckInType.NONE && (
                <button onClick={() => {
                    playSound('light');
                    setCheckInStatus(CheckInType.NONE);
                    onUpdateWeeklyState(currentDateStr, { checkInStatus: '' });
                }} className="text-xs text-red-400 flex items-center gap-1">
                <Icons.Cancel size={12} /> {tApp.cancel}
                </button>
            )}
        </div>

        {checkInStatus === CheckInType.NONE ? (
            <div className="flex gap-3">
                <button 
                    onClick={handleOfflineCheckIn}
                    disabled={isLocating || !canCheckIn}
                    className="flex-1 py-3 rounded-xl bg-secondary/20 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary/30 transition-colors disabled:opacity-50 disabled:grayscale"
                >
                    {isLocating ? <span className="animate-pulse">{t.locating}</span> : <><Icons.Location size={16} /> {t.offlineCheckIn}</>}
                </button>
                <button 
                    onClick={handleOnlineCheckIn}
                    disabled={!canCheckIn}
                    className="flex-1 py-3 rounded-xl bg-bgMain text-textSub text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t.onlineCheckIn}
                </button>
            </div>
        ) : (
            <div className="py-3 bg-mint/20 rounded-xl flex items-center justify-center gap-2 text-primary">
                <Icons.Check size={18} className="text-mint" />
                <span className="font-medium text-sm">
                    {checkInStatus === CheckInType.OFFLINE ? t.successOffline : t.successOnline}
                </span>
            </div>
        )}
        
        {geoError && <p className="text-xs text-red-400 mt-2 text-center">{geoError}</p>}
        {currentWeek.hasLeft && <p className="text-[10px] text-red-500 font-medium mt-2 text-center">{t.alreadyLeft}</p>}
    </div>
  );

  const renderCourses = () => (
    <>
        {courses.length === 0 && <p className="text-center text-xs text-textSub py-8">暂无课程</p>}
        {courses.map((course) => {
            let statusText = course.status || CourseStatus.NOT_STARTED;
         // 1. 设置默认颜色：让“未开始”和“已结束”默认都显示为浅灰色
let statusColor = 'text-gray-400'; 
let titleColor = 'text-gray-400'; 

// 2. 只有“进行中”的时候，才点亮颜色
if (course.status === CourseStatus.IN_PROGRESS) {
    statusColor = 'text-primary font-bold';
    titleColor = 'text-primary font-medium';
} 
// 注意：这里删除了原有的 CourseStatus.ENDED 判断，
// 这样“已结束”和“未开始”就会统一使用上面定义的 text-gray-400 颜色。

            return (
                <div 
                    key={course.id} 
                    onClick={() => { 
                        playSound('medium');
                        setCourseId(course.id); 
                        onNavigate(ViewName.COURSE_DETAIL); 
                    }}
                    className="bg-cloud p-3 rounded-xl border border-white/50 flex items-start gap-3 active:scale-[0.99] transition-transform cursor-pointer hover:shadow-md"
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        course.status === CourseStatus.IN_PROGRESS ? 'bg-primary text-white' : 'bg-bgMain text-textSub'
                    }`}>
                    {course.id}
                    </div>
                    <div className="flex-1">
                        <h4 className={`text-sm leading-tight ${titleColor}`}>{course.title}</h4>
                        <p className={`text-[10px] mt-1 ${statusColor}`}>{statusText}</p>
                    </div>
                    <Icons.Back className="rotate-180 text-gray-300" size={16} />
                </div>
            );
        })}
        <p className="text-center text-[10px] text-gray-400 pt-4 pb-2">{t.courseHint}</p>
    </>
  );

  return (
      <>
        <div className="hidden md:flex h-full gap-8 p-4 overflow-hidden">
            <div className="shrink-0 w-1/2 flex flex-col justify-center overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                    {renderCurrentWeekCard()}
                    <CheckInSection />
                </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="px-1 py-2 shrink-0 bg-[#E8E6E1] z-10 flex items-center justify-between">
                    <h3 className="text-textSub font-medium">{t.courseList}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{classVersion}{tApp.class}</span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-6">
                    {renderCourses()}
                </div>
            </div>
        </div>

        <div className="flex md:hidden flex-col h-full p-4 overflow-hidden">
            <div className="shrink-0 z-20 bg-[#E8E6E1] pb-2">
                {renderCurrentWeekCard()}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <CheckInSection />
                <div className="sticky top-0 z-10 bg-[#E8E6E1] py-2 flex items-center justify-between border-b border-gray-200/50 mb-2 mt-4">
                    <h3 className="text-textSub font-medium">{t.courseList}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{classVersion}{tApp.class}</span>
                </div>
                <div className="space-y-2 pb-6">
                    {renderCourses()}
                </div>
            </div>
        </div>

        {isLeaveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                <div className="bg-cloud w-full max-w-xs rounded-2xl p-5 shadow-xl animate-fade-in border border-white">
                    <h3 className="font-medium mb-4">{t.leaveReason}</h3>
                    <textarea 
                        className="w-full h-24 bg-bgMain rounded-lg p-3 text-sm resize-none mb-4 focus:outline-none"
                        placeholder={t.leaveInputPlaceholder}
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => { playSound('light'); setIsLeaveModalOpen(false); }} className="flex-1 py-2 rounded-lg bg-gray-200 text-textSub text-sm">{tApp.cancel}</button>
                        <button onClick={handleSubmitLeave} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm">{tApp.submit}</button>
                    </div>
                </div>
            </div>
        )}

        {isRevokeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                <div className="bg-cloud w-full max-w-xs rounded-2xl p-6 shadow-xl animate-fade-in border border-white text-center">
                    <div className="mb-4 text-primary bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                        <Icons.Check size={24} />
                    </div>
                    <h3 className="font-bold text-textMain mb-2">{t.revokeLeaveConfirmTitle}</h3>
                    <p className="text-sm text-textSub mb-6 leading-relaxed">
                        {t.revokeLeaveConfirmContent}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => { playSound('light'); setIsRevokeModalOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-gray-200 text-textSub text-sm font-medium">{tApp.cancel}</button>
                        <button onClick={handleRevokeLeave} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-md shadow-primary/20">{tApp.confirm}</button>
                    </div>
                </div>
            </div>
        )}
      </>
  );
};

// ==========================================
// PART 2: RECORD VIEW
// ==========================================

interface RecordViewProps {
  onOpenInput: () => void;
  records: GrowthRecord[];
  onDelete: (id: number) => void;
  onEdit: (rec: GrowthRecord) => void;
  onPin: (id: number) => void;
  lang: Language;
}

// Rebuilt Item Component
const RecordItem: React.FC<{
    rec: GrowthRecord;
    onDelete: (id: number) => void;
    onEdit: (rec: GrowthRecord) => void;
    onPin: (id: number) => void;
    lang: Language;
}> = ({ rec, onDelete, onEdit, onPin, lang }) => {
    // --- State ---
    const [offset, setOffset] = useState(0); 
    const [isSwiping, setIsSwiping] = useState(false);
    
    // --- Refs ---
    const startX = useRef(0);
    const startY = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);
    
    const t = TRANSLATIONS[lang].record;

    // --- Configuration ---
    const DELETE_THRESHOLD = -80; 
    const PIN_TRIGGER_THRESHOLD = 100; 

    // --- Touch Handlers (Mobile Only) ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.innerWidth >= 768) return; 
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX.current;
        const diffY = currentY - startY.current;

        if (Math.abs(diffY) > Math.abs(diffX)) {
            return; 
        }

        if (e.cancelable) e.preventDefault();
        const newOffset = Math.max(-120, Math.min(150, diffX));
        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;
        setIsSwiping(false);

        if (offset > PIN_TRIGGER_THRESHOLD) {
            playSound('confirm');
            onPin(rec.id);
            setOffset(0); 
        } else if (offset < DELETE_THRESHOLD + 20) { 
            playSound('light');
            setOffset(DELETE_THRESHOLD);
        } else {
            setOffset(0);
        }
    };

    // Card Colors (Harmonious Palette Logic)
    const isPinned = rec.isPinned;
    // UPDATED: Pinned background now matches 'Offline Check-in' color (Primary)
    const cardBgColor = isPinned ? '#6D8D9D' : rec.bgColor;
    const textColor = isPinned ? '#FFFFFF' : rec.textColor;
    const timeColor = isPinned ? 'rgba(255,255,255,0.8)' : '#999999';
    
    // Badge Style
    // UPDATED: When pinned, reuse the record's specific background and text color (like the add button)
    // This creates differentiation and consistency. 
    // The bgColors are pale (e.g. #F0F5F1), which contrast well against the #6D8D9D card background.
    const badgeStyle = isPinned 
        ? { backgroundColor: rec.bgColor, color: rec.textColor, borderColor: 'transparent', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
        : { backgroundColor: 'rgba(255,255,255,0.6)', color: '#666666', borderColor: 'transparent' };

    // Translation of Record Type (Static mapping for old records might fail, but new ones work if we store keys. 
    // However, existing data stores string content. We'll map display label if it matches known types)
    let displayType = rec.type;
    if (rec.type === '每日一善') displayType = t.types.good;
    if (rec.type === '感理平衡') displayType = t.types.balance;
    if (rec.type === '懈怠/掉举') displayType = t.types.sloth;

    return (
        <div className="relative mb-4 select-none h-auto">
            {/* Background Actions */}
            <div className="absolute inset-0 z-0 flex items-center justify-between rounded-2xl overflow-hidden">
                {/* Pin Action */}
                <div className={`h-full flex items-center pl-4 transition-opacity duration-300 ${offset > 20 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-1 text-primary font-bold">
                        <Icons.Check size={20} />
                        <span className="text-xs">{rec.isPinned ? t.unpin : t.pin}</span>
                    </div>
                </div>

                {/* Delete Action */}
                <div className="h-full flex items-center pr-2 justify-end w-1/2 ml-auto">
                    <button 
                        className={`w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 shadow-sm active:scale-90 transition-transform ${offset < -20 ? 'opacity-100' : 'opacity-0'}`}
                        onTouchEnd={(e) => e.stopPropagation()} 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); 
                            playSound('confirm');
                            onDelete(rec.id);
                        }}
                    >
                        <Icons.Cancel size={22} />
                    </button>
                </div>
            </div>

            {/* Foreground Card */}
            <div 
                ref={itemRef}
                className={`relative z-10 rounded-2xl p-4 shadow-sm border border-white/60 group transition-transform duration-300 ease-out`}
                style={{ 
                    backgroundColor: cardBgColor,
                    transform: `translateX(${offset}px)`,
                    border: rec.isPinned ? '1px solid #E5E5E5' : '1px solid rgba(255,255,255,0.5)'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (offset !== 0) {
                        setOffset(0); 
                        playSound('light');
                    } else {
                        playSound('medium');
                        onEdit(rec); 
                    }
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <span 
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm transition-colors"
                        style={badgeStyle}
                    >
                        {displayType}
                    </span>
                    
                    <div className="hidden md:flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity pl-4 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); playSound('confirm'); onPin(rec.id); }} 
                            className={`hover:scale-110 transition-transform ${rec.isPinned ? 'text-white' : 'text-gray-300 hover:text-primary'}`}
                            title={rec.isPinned ? t.unpin : t.pin}
                        >
                            {rec.isPinned ? <Icons.Check size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-current"></div>}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); playSound('confirm'); onDelete(rec.id); }} 
                            className={`hover:scale-110 transition-transform ${rec.isPinned ? 'text-white/70 hover:text-white' : 'text-gray-300 hover:text-red-400'}`}
                            title={TRANSLATIONS[lang].app.delete}
                        >
                            <Icons.Cancel size={18} />
                        </button>
                    </div>
                </div>
                
                <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3 select-text" style={{ color: textColor }}>
                    {rec.content}
                </p>
                
                <div className="text-[10px] text-right" style={{ color: timeColor }}>
                    {rec.time}
                </div>
            </div>
        </div>
    );
};

export const RecordView: React.FC<RecordViewProps> = ({ onOpenInput, records, onDelete, onEdit, onPin, lang }) => {
  const t = TRANSLATIONS[lang].record;
  const sortedRecords = [...records].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.id - a.id;
  });

  const isMaxRecords = records.length >= 50;

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-4 pb-24 md:pb-6 relative">
       {isMaxRecords && (
         <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
           {lang === 'zh' ? '记录数量已达到上限（50条），请先删除一些记录后再添加。' : 'Record limit reached (50). Please delete some records before adding new ones.'}
         </div>
       )}
       <button 
         onClick={() => { 
           if (isMaxRecords) {
             alert(lang === 'zh' ? '记录数量已达到上限（50条），请先删除一些记录后再添加。' : 'Record limit reached (50). Please delete some records before adding new ones.');
             return;
           }
           playSound('confirm'); 
           onOpenInput(); 
         }}
         className={`fixed bottom-40 md:bottom-12 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40 active:scale-95 transition-transform ${
           isMaxRecords 
             ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
             : 'bg-primary text-white hover:bg-primary/90'
         }`}
       >
         <Icons.Plus size={32} />
       </button>

       {sortedRecords.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-textSub">
               <Icons.Record size={48} className="mb-4 opacity-20" />
               <p className="text-sm">{t.empty}</p>
           </div>
       ) : (
           <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start content-start">
                   {sortedRecords.map((rec) => (
                       <RecordItem 
                           key={rec.id} 
                           rec={rec} 
                           onDelete={onDelete} 
                           onEdit={onEdit} 
                           onPin={onPin} 
                           lang={lang}
                       />
                   ))}
               </div>
               
               {/* Mobile Hint for Records > 0 */}
               <p className="text-center text-[10px] text-gray-400 pt-4 pb-2 md:hidden">
                   {t.swipeHint}
               </p>
           </>
       )}
    </div>
  );
};

// ==========================================
// PART 3: RECORD INPUT MODAL
// ==========================================

interface RecordInputModalProps {
  onClose: () => void;
  onSave: (type: string, content: string, colors: { color: string, bgColor: string, textColor: string }) => void;
  initialData?: GrowthRecord | null;
  lang: Language;
}

// HARMONIOUS ZEN PALETTE (Revised with red-ish theme for Sloth)
const RECORD_TYPES = [
    { label: '每日一善', color: '#8FB397', bg: '#F0F5F1', text: '#2F3E32' }, // Muted Sage
    { label: '感理平衡', color: '#7D9DAB', bg: '#EFF4F6', text: '#2C3940' }, // Muted Fog Blue
    { label: '懈怠/掉举', color: '#B97A7A', bg: '#F8F1F1', text: '#4A3535' }  // Soft Muted Red (High transparency feel)
];

export const RecordInputModal: React.FC<RecordInputModalProps> = ({ onClose, onSave, initialData, lang }) => {
  const t = TRANSLATIONS[lang].record;
  const tApp = TRANSLATIONS[lang].app;
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedType, setSelectedType] = useState(
      initialData ? RECORD_TYPES.find(t => t.label === initialData.type) || RECORD_TYPES[0] : RECORD_TYPES[0]
  );

  // Translate Labels for display
  const getDisplayLabel = (label: string) => {
      if (label === '每日一善') return t.types.good;
      if (label === '感理平衡') return t.types.balance;
      if (label === '懈怠/掉举') return t.types.sloth;
      return label;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-6 animate-fade-in">
        <div className="bg-cloud w-full md:max-w-xl h-[80vh] md:h-auto md:rounded-3xl rounded-t-3xl p-6 shadow-2xl flex flex-col border border-white">
            
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-textMain">{initialData ? t.editRecord : t.newRecord}</h3>
                <button onClick={() => { playSound('light'); onClose(); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-textSub">
                    <Icons.Cancel size={20} />
                </button>
            </div>

            {/* Revised Type Selector: No borders, use shadow depth */}
            <div className="flex gap-4 mb-4 overflow-x-auto no-scrollbar py-3 px-1">
                {RECORD_TYPES.map((t) => {
                    const isSelected = selectedType.label === t.label;
                    return (
                        <button
                            key={t.label}
                            onClick={() => { playSound('light'); setSelectedType(t); }}
                            className={`px-4 py-3 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 ${
                                isSelected 
                                ? 'shadow-inner scale-95 opacity-100' // Selected: Pressed in, fully opaque
                                : 'shadow-sm hover:shadow-md scale-100 opacity-60 hover:opacity-100' // Unselected: Floating, slightly transparent
                            }`}
                            style={{ 
                                backgroundColor: t.bg, 
                                color: t.text,
                            }}
                        >
                            {getDisplayLabel(t.label)}
                        </button>
                    )
                })}
            </div>

            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full bg-white/50 rounded-2xl p-4 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mb-6 shadow-sm"
                placeholder={t.placeholder}
                style={{ color: selectedType.text }}
            />

            <button 
                onClick={() => {
                    if (!content.trim()) return;
                    playSound('confirm');
                    onSave(selectedType.label, content, {
                        color: selectedType.color,
                        bgColor: selectedType.bg,
                        textColor: selectedType.text
                    });
                }}
                className="w-full py-4 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
                {tApp.save}
            </button>
        </div>
    </div>
  );
};
