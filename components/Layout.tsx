
import React from 'react';
import { ViewName, User, Language } from '../types';
import { Icons } from './Icons';
import { playSound, TRANSLATIONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  onBack: () => void;
  title?: string;
  user?: User | null;
  onLogout?: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onBack, title, user, onLogout, lang, setLang }) => {
  const t = TRANSLATIONS[lang];
  const isRootTab = [ViewName.HOME, ViewName.TOOLS, ViewName.DAILY, ViewName.RECORD].includes(currentView);

  const getTabClass = (view: ViewName) => {
    const isActive = currentView === view || 
      (view === ViewName.TOOLS && [ViewName.BREATHING, ViewName.TIMER, ViewName.STATS].includes(currentView)) ||
      (view === ViewName.DAILY && [].includes(currentView as never)) || 
      (view === ViewName.RECORD && [ViewName.RECORD_INPUT].includes(currentView));
      
    return isActive ? 'text-primary bg-primary/10' : 'text-textSub hover:bg-gray-100/50';
  };

  const handleNavClick = (view: ViewName) => {
    playSound('light');
    onNavigate(view);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewName, icon: any, label: string }) => (
    <button 
      onClick={() => handleNavClick(view)} 
      className={`flex md:flex-row flex-col items-center md:gap-4 gap-1 p-2 md:px-6 md:py-3 rounded-xl transition-all w-full md:justify-start ${getTabClass(view)}`}
    >
      <Icon size={24} />
      <span className="text-xs md:text-sm font-medium">{label}</span>
    </button>
  );

  const getTitle = () => {
    // If a title prop is passed and it's not empty, use it (could be dynamic)
    // Otherwise map based on view
    switch (currentView) {
      case ViewName.HOME: return t.app.title;
      case ViewName.TOOLS: return t.nav.tools;
      case ViewName.DAILY: return t.nav.daily;
      case ViewName.RECORD: return t.nav.record;
      case ViewName.BREATHING: return t.tools.breathing;
      case ViewName.TIMER: return t.tools.timer.countdown;
      case ViewName.STATS: return t.tools.stats;
      case ViewName.COURSE_DETAIL: return t.daily.courseList; // Or specific title
      case ViewName.ADMIN: return t.nav.admin;
      default: return t.app.title;
    }
  };

  const displayTitle = getTitle();
// 精准屏蔽：念佛、拜佛、一念相续、呼吸跟随页面的标题显示
const isTimerPage = [ViewName.TIMER, ViewName.BREATHING].includes(currentView);
  
  const LangToggle = () => (
      <button 
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        className="text-[10px] font-bold px-2 py-1 rounded-md border border-textSub/30 text-textSub hover:bg-white/50 transition-colors"
      >
          {lang === 'zh' ? 'EN' : '中'}
      </button>
  );

  return (
    <div className="flex h-screen w-full bg-[#E8E6E1] overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Visible on md+) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-cloud h-full border-r border-white/50 p-6 shadow-lg z-20 relative">
        
        {/* Desktop Title (Aligned with Header Content) */}
        {/* Added pl-6 to align with the text content of the nav buttons which have px-6 */}
        <div className="absolute top-8 left-6 pl-6 font-medium text-lg text-textSub tracking-widest select-none">
            {t.app.title}
        </div>

        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 flex flex-col gap-4">
          <nav className="flex flex-col gap-2">
            <NavItem view={ViewName.HOME} icon={Icons.Home} label={t.nav.home} />
            <NavItem view={ViewName.TOOLS} icon={Icons.Tools} label={t.nav.tools} />
            <NavItem view={ViewName.DAILY} icon={Icons.Daily} label={t.nav.daily} />
            <NavItem view={ViewName.RECORD} icon={Icons.Record} label={t.nav.record} />
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6 space-y-4">
             {user?.isAdmin && (
               <button 
                  onClick={() => handleNavClick(ViewName.ADMIN)}
                  className={`w-full text-left px-6 py-2 text-xs font-medium transition-colors ${currentView === ViewName.ADMIN ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
               >
                 {t.nav.admin}
               </button>
             )}
             
             {user && (
                 <button 
                    onClick={() => { playSound('medium'); if(onLogout) onLogout(); }}
                    className="w-full text-left px-6 py-2 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors"
                 >
                    {t.app.logout}
                 </button>
             )}

             {/* Lang Toggle Desktop */}
             <div className="px-6">
                <LangToggle />
             </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative max-w-full md:max-w-none mx-auto w-full md:bg-[#E8E6E1]">
        
        <header className="h-14 px-4 bg-cloud/80 md:bg-transparent backdrop-blur-md sticky top-0 z-20 md:static md:h-20 md:px-0 flex-shrink-0">
          
          {/* Mobile Header Layout */}
          <div className="flex md:hidden items-center justify-between h-full w-full">
            <div className="flex items-center w-1/3 gap-2">
              {!isRootTab ? (
                <button onClick={() => { playSound('light'); onBack(); }} className="p-2 -ml-2 text-primary hover:bg-white/50 rounded-full transition-colors">
                  <Icons.Back size={24} />
                </button>
              ) : (
                  <LangToggle />
              )}
            </div>
            {/* Title Color: text-textSub, Font weight: normal, Letter spacing: 0.2em */}
            <h1 className="text-lg font-normal text-textSub w-1/3 text-center truncate tracking-[0.2em]">
              {!isTimerPage && displayTitle} 
              </h1> 
            <div className="w-1/3 flex justify-end items-center gap-2">
                {user?.isAdmin && (
                   <button 
                     onClick={() => { playSound('medium'); onNavigate(ViewName.ADMIN); }}
                     className="text-xs font-bold text-primary bg-white/50 px-2 py-1 rounded border border-primary/20"
                   >
                     {/* Mobile optimization: Shorten text for Chinese */}
                     {lang === 'zh' ? '管理' : t.nav.admin}
                   </button>
                )}
                {user && (
                    <button onClick={() => { playSound('medium'); if(onLogout) onLogout(); }} className="text-xs text-gray-400 px-2">
                        {/* Mobile optimization: Shorten text for Chinese */}
                        {lang === 'zh' ? '退出' : t.app.logout}
                    </button>
                )}
            </div>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden md:flex w-full max-w-5xl mx-auto px-4 items-center h-full relative">
            {!isRootTab && (
              <button onClick={() => { playSound('light'); onBack(); }} className="mr-4 p-2 -ml-2 text-primary hover:bg-white/50 rounded-full transition-colors">
                <Icons.Back size={24} />
              </button>
            )}
             {user && <div className="ml-auto text-xs text-textSub">{t.app.welcome}, {user.name} ({user.classVersion}{t.app.class})</div>}
          </div>
        </header>

        <main className="flex-1 overflow-hidden pb-24 md:pb-8 relative w-full flex flex-col">
          <div className="max-w-md mx-auto md:max-w-5xl h-full w-full">
            {children}
          </div>
        </main>

     {/* --- MOBILE BOTTOM NAV --- */}
<nav className="md:hidden h-20 bg-cloud border-t border-white/50 fixed bottom-0 w-full z-30 flex safe-area-bottom">
  {[
    { view: ViewName.HOME, icon: Icons.Home, label: t.nav.home },
    { view: ViewName.TOOLS, icon: Icons.Tools, label: t.nav.tools },
    { view: ViewName.DAILY, icon: Icons.Daily, label: t.nav.daily },
    { view: ViewName.RECORD, icon: Icons.Record, label: t.nav.record }
  ].map((item) => (
    <button 
      key={item.view}
      onClick={() => handleNavClick(item.view)} 
      /* w-0 flex-1 是强制等分的关键，justify-center 确保图标在格子里居中 */
      className={`flex-1 w-0 flex flex-col items-center justify-center h-full transition-all ${
        currentView === item.view ? 'text-primary' : 'text-textSub'
      }`}
    >
      <item.icon size={24} />
      <span className="text-[10px] mt-1 font-medium whitespace-nowrap overflow-hidden">
        {item.label}
      </span>
    </button>
  ))}
</nav>

      </div>
    </div>
  );
};

export default Layout;
