import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw, Terminal, ExternalLink, X, ShieldCheck, Cpu } from 'lucide-react';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface WorkerInfo {
  online: boolean;
  worker?: string;
  ffmpeg?: boolean;
  ffmpegPath?: string;
  url?: string;
  error?: string;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({ isOpen, onClose }) => {
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workerUrl] = useState('http://127.0.0.1:8765');
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/worker-status?url=${encodeURIComponent(workerUrl)}`);
      const data = await res.json();
      setWorkerInfo(data);
    } catch {
      setWorkerInfo({
        online: false,
        url: workerUrl,
        error: 'شغّل Islam View Worker على جهازك أولًا.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

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

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('python worker.py');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6 text-right cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span>حالة Python Local Worker (FFmpeg على Windows)</span>
              </h2>
              <p className="text-xs text-slate-400">
                الاتصال المباشر مع Python Worker المحلي على منفذ 8765
              </p>
            </div>
          </div>
        </div>

        {/* Worker Status Box */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            workerInfo?.online
              ? 'bg-emerald-950/30 border-blue-500/40 text-blue-300'
              : 'bg-red-950/30 border-red-800/50 text-red-300'
          }`}
        >
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            title="فحص الاتصال"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>فحص</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-bold text-sm">
                  {workerInfo?.online ? 'متصل بنجاح (Online)' : 'غير متصل (Offline)'}
                </span>
                {workerInfo?.online ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                {workerUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Offline Warning & Solution */}
        {!workerInfo?.online && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <span>تنبيه:</span>
              <span>شغّل Islam View Worker على جهازك أولًا.</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              لتشغيل الـ Python Worker على جهاز Windows الخاص بك:
            </p>
            <div className="bg-black/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-xs text-blue-400" dir="ltr">
              <button
                onClick={handleCopyCmd}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded transition"
              >
                {copied ? 'تم النسخ!' : 'نسخ'}
              </button>
              <span>python worker.py</span>
            </div>
            <p className="text-[11px] text-slate-400">
              تأكد من أن الـ Python Worker يستمع على <strong className="text-slate-200 font-mono">http://127.0.0.1:8765</strong> ومتصل بـ FFmpeg في <strong className="text-slate-200 font-mono">C:\ffmpeg\bin\ffmpeg.exe</strong>.
            </p>
          </div>
        )}

        {/* Worker Details (If Online) */}
        {workerInfo?.online && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span className="font-semibold text-slate-200">{workerInfo.worker || 'IslamViewWorker'}</span>
              <span>اسم الـ Worker:</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="text-blue-400 font-mono">
                {workerInfo.ffmpeg ? (workerInfo.ffmpegPath || 'C:\\ffmpeg\\bin\\ffmpeg.exe (جاهز)') : 'غير متوفر'}
              </span>
              <span>حالة FFmpeg:</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-mono text-slate-200">8765</span>
              <span>المنفذ المحلي:</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
