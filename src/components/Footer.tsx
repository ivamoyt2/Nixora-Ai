import React from 'react';
import { ShieldCheck, FileText, Mail, Globe } from 'lucide-react';
import { SocialLinks } from './SocialLinks';
import { AppPage } from '../types';
import { NexoraLogo } from './NexoraLogo';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenLegal,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-blue-950/70 bg-black text-slate-400 relative overflow-hidden mt-20">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 space-y-12">
        {/* TOP ROW: BRAND & QUICK LINKS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-900">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <NexoraLogo size="lg" />

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              منصة الذكاء الاصطناعي لتحويل الفيديوهات الخام إلى فيديوهات جاهزة للمشاركة بشكل تلقائي، مع تفريغ الكابشن العربي بدقة 99% وحرق النصوص الفيروسية المتزامنة.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Column 1: Studio */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                استوديو الفيديو
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    الرئيسية
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('editor')}
                    className="hover:text-blue-400 transition cursor-pointer text-slate-300 font-semibold"
                  >
                    محرر الفيديو الذكي
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('projects')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    مشاريعي
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                المنصة والمساعدة
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    حول Nexora AI
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('faq')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    الأسئلة الشائعة
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    تواصل معنا
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                القانونية والخصوصية
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegal('terms')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    شروط الاستخدام
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegal('privacy')}
                    className="hover:text-blue-400 transition cursor-pointer"
                  >
                    سياسة الخصوصية
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: OFFICIAL SOCIAL CHANNELS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-900">
          <div className="text-xs text-slate-400 text-center sm:text-right">
            <span className="font-bold text-white block">قنواتنا الرسمية:</span>
            <span>تابعنا للحصول على التحديثات والنصائح التقنية اليومية</span>
          </div>

          <div>
            <SocialLinks variant="compact" />
          </div>
        </div>

        {/* BOTTOM ROW: COPYRIGHT */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {currentYear} <span className="font-bold text-white">NEXORA AI</span>. جميع الحقوق محفوظة.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-blue-400">
            <span>Powered by Next-Gen AI Video Pipeline</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
