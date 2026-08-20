import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  User,
  Menu,
  X,
  ArrowLeft,
  Settings,
  FolderKanban,
  HelpCircle,
  Info,
  Mail,
  PlayCircle,
} from 'lucide-react';
import { AppPage, UserProfile } from '../types';
import { NexoraLogo } from './NexoraLogo';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onReset?: () => void;
  onOpenExport?: () => void;
  onOpenAccount: () => void;
  hasProject: boolean;
  hasCaptions?: boolean;
  currentMode?: 'montage' | 'caption';
  onModeChange?: (mode: 'montage' | 'caption') => void;
  onOpenIntroVideo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenExport,
  onOpenAccount,
  hasProject,
  currentMode = 'montage',
  onModeChange,
  onOpenIntroVideo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Load user from localStorage and listen to changes
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem('nexora_ai_current_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('nexora_user_updated', loadUser);
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('nexora_user_updated', loadUser);
    };
  }, []);

  const navLinks: { id: AppPage; label: string }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'editor', label: 'محرر الفيديو' },
    { id: 'projects', label: 'مشاريعي' },
    { id: 'about', label: 'حولنا' },
    { id: 'faq', label: 'الأسئلة الشائعة' },
    { id: 'contact', label: 'تواصل معنا' },
  ];

  const handleLinkClick = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-blue-950/60 bg-black/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 transition group text-right cursor-pointer"
            aria-label="NEXORA AI الرئيسية"
          >
            <NexoraLogo size="md" />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#090D16] p-1.5 rounded-2xl border border-blue-950/70 shadow-inner">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Actions */}
        <div className="flex items-center gap-3">
          {/* Watch Video Button */}
          {onOpenIntroVideo && (
            <button
              type="button"
              onClick={onOpenIntroVideo}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition cursor-pointer shadow-sm"
              title="مشاهدة فيديو المنصة Nexora AI"
            >
              <PlayCircle className="w-4 h-4 text-blue-400" />
              <span>فيديو المنصة</span>
            </button>
          )}

          {/* In Editor Mode: Mode Switcher */}
          {currentPage === 'editor' && onModeChange && (
            <div className="hidden md:flex items-center bg-[#090D16] p-1 rounded-xl border border-blue-950">
              <button
                type="button"
                onClick={() => onModeChange('montage')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentMode === 'montage'
                    ? 'bg-blue-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>المونتاج الآلي</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange('caption')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentMode === 'caption'
                    ? 'bg-blue-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>الكابشن الذكي</span>
              </button>
            </div>
          )}

          {/* Export Button when in Caption editor */}
          {currentPage === 'editor' && hasProject && onOpenExport && currentMode === 'caption' && (
            <button
              id="btn-navbar-export"
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-white shadow-lg shadow-blue-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30"
              title="تصدير الفيديو وتحميله فوراً"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
          )}

          {/* Account / User Button */}
          <button
            type="button"
            onClick={onOpenAccount}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              currentUser
                ? 'bg-[#090D16] hover:bg-slate-900 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-[#090D16] hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-800'
            }`}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-blue-400"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
            )}
            <span className="hidden sm:inline">
              {currentUser ? currentUser.name : 'تسجيل الدخول'}
            </span>
          </button>

          {/* Direct CTA on Non-Editor Pages */}
          {currentPage !== 'editor' && (
            <button
              type="button"
              onClick={() => onNavigate('editor')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30"
            >
              <span>ابدأ الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#090D16] text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-900 bg-black/95 backdrop-blur-2xl p-4 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`p-3 rounded-xl text-xs font-bold text-right transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                      : 'bg-[#090D16] text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
            {onOpenIntroVideo && (
              <button
                onClick={() => {
                  onOpenIntroVideo();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 rounded-xl bg-[#090D16] border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>فيديو المنصة</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              {currentUser ? 'حسابي' : 'تسجيل الدخول'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
