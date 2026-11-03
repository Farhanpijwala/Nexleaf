import React from 'react';
import { useApp, ActivePage } from '../../context/AppContext.tsx';
import {
  Compass,
  LayoutDashboard,
  User as UserIcon,
  FileText,
  HelpCircle,
  Briefcase,
  GitCompare,
  MapPin,
  FolderGit2,
  BookOpen,
  LineChart,
  BotMessageSquare,
  Settings,
  LogOut,
  Flame
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activePage, setActivePage, user, profile, logout } = useApp();

  const navigationItems: Array<{
    id: ActivePage;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText, badge: 'Core' },
    { id: 'career-assessment', label: 'Career Assessment', icon: HelpCircle },
    { id: 'career-matches', label: 'Career Matches', icon: Briefcase },
    { id: 'skill-gap', label: 'Skill Gap', icon: GitCompare },
    { id: 'roadmap', label: 'My Roadmap', icon: MapPin, badge: 'AI' },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'courses', label: 'Learning Resources', icon: BookOpen },
    { id: 'progress', label: 'Progress Tracking', icon: LineChart },
    { id: 'ai-coach', label: 'AI Career Coach', icon: BotMessageSquare, badge: 'Gemini' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">
              NexLeaf
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Career Navigation Platform</p>
          </div>
        </div>
      </div>

      {/* Target Career User Pill */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Target Track</span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Flame className="w-3.5 h-3.5" />
            {profile?.learningStreakDays || 7}d streak
          </span>
        </div>
        <div className="mt-1 font-semibold text-white text-sm truncate">
          {profile?.targetCareer || 'Frontend Developer'}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        {/* User Mini Profile */}
        <div className="pt-2 px-2 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName || 'Alex Sharma'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.education || 'BCA Student'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
