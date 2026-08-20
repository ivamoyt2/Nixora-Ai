import React, { useEffect } from 'react';
import { X, Terminal, Download, CheckCircle, Cpu, HardDrive, Play, FolderTree } from 'lucide-react';

interface WindowsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsGuideModal: React.FC<WindowsGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Close on Escape key press
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                دليل تشغيل NEXORA AI / Islam View على نظام Windows
              </h2>
              <p className="text-xs text-slate-400">
                كيفية تثبيت FFmpeg وتشغيل المعالجة الكاملة محلياً على جهازك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          {/* Step 1: FFmpeg installation on Windows */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
              <span>تثبيت FFmpeg على Windows بخطوة واحدة:</span>
            </h3>
            <p>
              أسهل طريقة لتثبيت FFmpeg على نظام ويندوز هي فتح موجه الأوامر (PowerShell) كمسؤول وكتابة:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-blue-300 flex items-center justify-between">
              <code>winget install Gyan.FFmpeg</code>
              <span className="text-[10px] text-slate-500">أو choco install ffmpeg</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              بعد التثبيت، افتح نافذة Terminal جديدة وتأكد بكتابة <code className="text-blue-300 font-mono">ffmpeg -version</code>.
            </p>
          </div>

          {/* Step 2: Running Node.js project locally */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
              <span>تشغيل التطبيق محلياً:</span>
            </h3>
            <p>1. تأكد من تثبيت Node.js (الإصدار 18 فما فوق).</p>
            <p>2. ضع مفتاح Gemini الخاص بك في ملف <code className="text-blue-300 font-mono">.env</code>:</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
              GEMINI_API_KEY="مفتاح_جيميني_الخاص_بك"
            </div>
            <p>3. شغّل الأوامر التالية في مجلد المشروع:</p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-blue-300 space-y-1">
              <div>npm install</div>
              <div>npm run dev</div>
            </div>
            <p>ثم افتح المتصفح على <code className="text-blue-300 font-mono">http://localhost:3000</code>.</p>
          </div>

          {/* Step 3: Windows Python Local Worker on port 8765 */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-blue-500/30">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">3</span>
              <span>تشغيل Python Local Worker على Windows (المنفذ 8765):</span>
            </h3>
            <p>
              يقوم الـ Python Worker بربط التطبيق مباشرة بـ FFmpeg على جهازك (<code className="text-blue-300 font-mono">C:\ffmpeg\bin\ffmpeg.exe</code>).
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-blue-300 space-y-1">
              <div>python worker.py</div>
            </div>
            <p className="text-slate-400 text-[11px]">
              تأكد من استماع الـ Worker على <strong className="text-slate-200 font-mono">http://127.0.0.1:8765</strong>.
            </p>
          </div>

          {/* Step 4: Project Architecture */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">4</span>
              <span>هيكل المجلدات المنظم لكل مشروع:</span>
            </h3>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-400 text-[11px] space-y-1">
              <div>projects_data/{"{projectId}"}/</div>
              <div className="mr-3">├── original/       (الفيديو الأصلي المرفوع)</div>
              <div className="mr-3">├── audio/          (ملف الصوت المستخرج بدقة 16kHz)</div>
              <div className="mr-3">├── captions/       (ملفات captions.json و subtitles.ass و srt)</div>
              <div className="mr-3">├── render/         (الملفات المؤقتة أثناء المعالجة)</div>
              <div className="mr-3">└── final/          (الفيديو النهائي المحروق بصيغة IslamView_Captioned_*.mp4)</div>
            </div>
          </div>

          {/* Step 5: Testing with short video first */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">5</span>
              <span>كيفية التجربة بفيديو قصير أولاً:</span>
            </h3>
            <p>
              ننصح بالبدء بمقطع قصير (10 إلى 30 ثانية) أو النقر على زر <strong>"عينة Short عمودي"</strong> المتاح في واجهة الرفع لتجربة كامل دورة العمل: استخراج الصوت ← التعرف الذكي على الكلام العربي ← المعاينة المتزامنة ← رندر وحرق الفيديو في ثوانٍ معدودة.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold text-xs transition"
          >
            فهمت، حسناً
          </button>
        </div>
      </div>
    </div>
  );
};
