import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Sparkles,
  X,
  LogOut,
  Film,
  Crown,
  CreditCard,
} from 'lucide-react';
import { UserProfile, AppPage } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: AppPage) => void;
}

const USER_STORAGE_KEY = 'nexora_ai_current_user';

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        name: name.trim() || email.split('@')[0] || 'صانع محتوى',
        email: email || 'creator@nexora.ai',
        plan: 'pro',
        createdAt: 'أغسطس 2026',
        rendersCount: 14,
        totalRenderedMinutes: 48,
      };

      setCurrentUser(user);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {}
      setIsLoading(false);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user: UserProfile = {
        id: `user_google_${Date.now()}`,
        name: 'مستخدم Google',
        email: 'creator.google@gmail.com',
        plan: 'pro',
        createdAt: 'أغسطس 2026',
        rendersCount: 8,
        totalRenderedMinutes: 26,
      };
      setCurrentUser(user);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {}
      setIsLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-950 border border-blue-950/80 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto cursor-default"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGGED IN VIEW */}
        {currentUser ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 text-[10px] font-black border border-blue-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>PRO PLAN</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono" dir="ltr">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Account Usage Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-black border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400">الفيديوهات المنتجة</span>
                <div className="text-xl font-black text-blue-400 font-mono">
                  {currentUser.rendersCount}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400">دقائق الرندر المستهلكة</span>
                <div className="text-xl font-black text-cyan-300 font-mono">
                  {currentUser.totalRenderedMinutes}m
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigate('projects');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer border border-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  <span>عرض مشاريعي السابقة</span>
                </span>
                <span>←</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('pricing');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer border border-slate-800"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>إدارة الخطة والفواتير</span>
                </span>
                <span>←</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / SIGNUP VIEW */
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 mb-3">
                N
              </div>
              <h3 className="text-xl font-black text-white">
                {activeTab === 'signin' ? 'تسجيل الدخول إلى NEXORA' : 'إنشاء حساب جديد'}
              </h3>
              <p className="text-xs text-slate-400">
                استمتع بحفظ المشاريع، ورندر فائق السرعة، ومزامنة إعداداتك.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-black p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>متابعة باستخدام Google</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex-1 h-px bg-slate-800" />
              <span>أو بالبريد الإلكتروني</span>
              <span className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              {activeTab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">الاسم:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full bg-black border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  dir="ltr"
                  className="w-full bg-black border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">كلمة المرور:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className="w-full bg-black border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>جاري المتابعة...</span>
                ) : (
                  <span>{activeTab === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
