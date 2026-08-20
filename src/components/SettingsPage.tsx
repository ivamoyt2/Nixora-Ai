import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Type,
  Video,
  Volume2,
  Check,
  Save,
  RotateCcw,
  Shield,
  Sparkles,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { ArabicFontFamily, VideoType, CaptionStyleType } from '../types';

interface SettingsPageProps {
  workerOnline: boolean;
  onCheckWorker: () => void;
  onOpenWorkerGuide: () => void;
}

const SETTINGS_STORAGE_KEY = 'nexora_ai_platform_settings';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  workerOnline,
  onCheckWorker,
  onOpenWorkerGuide,
}) => {
  const [defaultVideoType, setDefaultVideoType] = useState<VideoType>('short');
  const [defaultFont, setDefaultFont] = useState<ArabicFontFamily>('Cairo');
  const [defaultStyle, setDefaultStyle] = useState<CaptionStyleType>('viral');
  const [defaultResolution, setDefaultResolution] = useState<'1080p' | '720p' | '4k'>('1080p');
  const [defaultFps, setDefaultFps] = useState<'30' | '60'>('30');
  const [autoSfxEnabled, setAutoSfxEnabled] = useState<boolean>(true);
  const [workerUrl, setWorkerUrl] = useState<string>('http://localhost:8000');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.defaultVideoType) setDefaultVideoType(parsed.defaultVideoType);
        if (parsed.defaultFont) setDefaultFont(parsed.defaultFont);
        if (parsed.defaultStyle) setDefaultStyle(parsed.defaultStyle);
        if (parsed.defaultResolution) setDefaultResolution(parsed.defaultResolution);
        if (parsed.defaultFps) setDefaultFps(parsed.defaultFps);
        if (parsed.autoSfxEnabled !== undefined) setAutoSfxEnabled(parsed.autoSfxEnabled);
        if (parsed.workerUrl) setWorkerUrl(parsed.workerUrl);
      }
    } catch {}
  }, []);

  const handleSaveSettings = () => {
    const payload = {
      defaultVideoType,
      defaultFont,
      defaultStyle,
      defaultResolution,
      defaultFps,
      autoSfxEnabled,
      workerUrl,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {}
  };

  const handleResetDefaults = () => {
    setDefaultVideoType('short');
    setDefaultFont('Cairo');
    setDefaultStyle('viral');
    setDefaultResolution('1080p');
    setDefaultFps('30');
    setAutoSfxEnabled(true);
    setWorkerUrl('http://localhost:8000');
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearCache = () => {
    if (window.confirm('هل تريد مسح ذاكرة التخزين المؤقتة والمشاريع المحلية؟')) {
      localStorage.removeItem('nexora_ai_saved_projects');
      alert('تم مسح الذاكرة المؤقتة بنجاح.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إعدادات المنصة والاستوديو (Settings)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            تخصيص الإعدادات الافتراضية للفيديوهات، الخطوط العربية، ومسار محرك FFmpeg.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-blue-600/20 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>تم الحفظ بنجاح!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التفضيلات</span>
            </>
          )}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* Section 1: Video & Caption Defaults */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Video className="w-4 h-4 text-blue-400" />
            <span>تفضيلات الفيديو والكابشن الافتراضية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Video Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                نوع الفيديو الافتراضي عند الفتح:
              </label>
              <select
                value={defaultVideoType}
                onChange={(e) => setDefaultVideoType(e.target.value as VideoType)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="short">9:16 عمودي (Shorts, Reels, TikTok)</option>
                <option value="long">16:9 أفقي (YouTube, Facebook Videos)</option>
              </select>
            </div>

            {/* Default Arabic Font */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                الخط العربي الافتراضي للكابشن:
              </label>
              <select
                value={defaultFont}
                onChange={(e) => setDefaultFont(e.target.value as ArabicFontFamily)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="Cairo">خط كايرو (Cairo - عريض وقوي)</option>
                <option value="Tajawal">خط تجوال (Tajawal - حديث وعصري)</option>
                <option value="Almarai">خط المراعي (Almarai - نقي ومقروء)</option>
                <option value="El Messiri">خط المسيري (El Messiri - روحاني سينمائي)</option>
                <option value="Amiri">خط أميري (Amiri - كلاسيكي)</option>
                <option value="Kufam">خط كوفام (Kufam - كوفي مميز)</option>
                <option value="Lemonada">خط ليمونادا (Lemonada - ترفيهي)</option>
                <option value="Rubik">خط روبيك (Rubik - ثقيل)</option>
              </select>
            </div>

            {/* Default Resolution */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                دقة التصدير الافتراضية:
              </label>
              <select
                value={defaultResolution}
                onChange={(e) => setDefaultResolution(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1080p">1080p Full HD (موصى به لجميع المنصات)</option>
                <option value="720p">720p HD (حجم ملف صغير)</option>
                <option value="4k">4K Ultra HD (أقصى دقة سينمائية)</option>
              </select>
            </div>

            {/* Default FPS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                معدل الإطارات (FPS):
              </label>
              <select
                value={defaultFps}
                onChange={(e) => setDefaultFps(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="30">30 FPS (قياسي ومناسب للريلز)</option>
                <option value="60">60 FPS (سلاسة فائقة وحركات ناعمة)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: FFmpeg Local Worker Integration */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>إعدادات اتصال FFmpeg Local Worker</span>
            </h3>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                workerOnline
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  workerOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{workerOnline ? 'متصل بنجاح' : 'غير متصل'}</span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                عنوان خدمة العامل المحلي (Local Worker URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workerUrl}
                  onChange={(e) => setWorkerUrl(e.target.value)}
                  dir="ltr"
                  className="flex-1 bg-slate-950 border border-slate-800 font-mono text-xs rounded-xl p-2.5 text-blue-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={onCheckWorker}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فحص الاتصال</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>هل تواجه مشكلة في تشغيل الـ Worker؟</span>
              <button
                onClick={onOpenWorkerGuide}
                className="text-blue-400 hover:text-blue-300 font-bold underline"
              >
                فتح دليل تثبيت وتشغيل FFmpeg على جهازك ←
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Cache & Storage */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>إدارة التخزين والذاكرة المؤقتة</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200">
                مسح المشاريع المحلية وإعادة ضبط المصنع
              </div>
              <p className="text-[11px] text-slate-400">
                يؤدي هذا إلى تفريغ سجل المشاريع المؤقتة واستعادة التفضيلات الافتراضية.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                استعادة الإعدادات الأصلية
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-3.5 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold transition"
              >
                مسح الذاكرة المؤقتة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
