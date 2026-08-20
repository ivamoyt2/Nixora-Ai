import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileText,
  Copy,
  Check,
  Cpu,
  Sparkles,
  Sliders,
  Smartphone,
  Monitor,
  Square,
  Ratio,
  Edit3,
} from 'lucide-react';
import { CaptionCue, CaptionStyleConfig, VideoMetadata } from '../types';

export const LOCAL_WORKER_URL = 'http://127.0.0.1:8765';

interface RenderSectionProps {
  projectId: string | null;
  captions: CaptionCue[];
  styleConfig: CaptionStyleConfig;
  metadata?: VideoMetadata;
  finalVideoUrl?: string | null;
  finalFilename?: string | null;
  onRenderComplete: (finalUrl: string, filename: string) => void;
  onOpenWorkerModal?: () => void;
}

export const RenderSection: React.FC<RenderSectionProps> = ({
  projectId,
  captions,
  styleConfig,
  metadata,
  finalVideoUrl,
  finalFilename,
  onRenderComplete,
  onOpenWorkerModal,
}) => {
  const [workerOnline, setWorkerOnline] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Video Name State
  const [videoTitle, setVideoTitle] = useState(() => {
    if (metadata?.customFilename) {
      return metadata.customFilename.replace(/\.mp4$/i, '');
    }
    if (metadata?.name) {
      const cleanBase = metadata.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '');
      return cleanBase ? `فيديو_${cleanBase}` : `فيديو_إسلام_فيو_${Date.now().toString().slice(-4)}`;
    }
    return `فيديو_إسلام_فيو_${Date.now().toString().slice(-4)}`;
  });

  // Video Dimensions & Size Settings
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5' | 'original'>(() => {
    if (metadata?.exportAspectRatio) return metadata.exportAspectRatio;
    return metadata?.videoType === 'long' ? '16:9' : '9:16';
  });
  const [resolution, setResolution] = useState<'1080p' | '720p' | '4k'>('1080p');
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'blur_padding'>('contain');

  // Check Python Local Worker status on mount and periodically
  const checkWorker = async () => {
    try {
      const res = await fetch('/api/worker-status');
      const data = await res.json();
      setWorkerOnline(!!data.online);
    } catch {
      setWorkerOnline(false);
    }
  };

  useEffect(() => {
    checkWorker();
    const interval = setInterval(checkWorker, 6000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const getCleanFilename = (): string => {
    let clean = (videoTitle || '').trim().replace(/[\\/:*?"<>|]/g, '_');
    if (!clean) clean = `IslamView_Video_${Date.now()}`;
    return clean.toLowerCase().endsWith('.mp4') ? clean : `${clean}.mp4`;
  };

  const handleStartRender = async () => {
    if (!projectId) {
      setErrorMsg('يرجى رفع فيديو وتوليد الكابشن أولاً.');
      return;
    }

    if (captions.length === 0) {
      setErrorMsg('لا توجد أسطر كابشن للرندر.');
      return;
    }

    const exportFilename = getCleanFilename();

    setIsRendering(true);
    setErrorMsg(null);
    setProgress(8);
    setStageText(`جاري إنشاء ملفات الكابشن ASS وتجهيز استدعاء Python Local Worker باسم: ${exportFilename}...`);

    let currentProgress = 8;
    progressTimerRef.current = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 2;
      if (currentProgress < 30) {
        setStageText(`جاري إرسال البيانات إلى Python Worker (${LOCAL_WORKER_URL}/render)...`);
      } else if (currentProgress < 70) {
        setStageText('يقوم FFmpeg الآن بحرق الكابشن العربي المتزامن في الفيديو (H.264 / libass)...');
      } else if (currentProgress < 92) {
        setStageText('جاري معالجة الإطارات المتبقية وتطبيق الأبعاد المختارة...');
      } else {
        currentProgress = 92;
        setStageText('بانتظار استلام ملف الفيديو النهائي والتحقق من سلامة الحجم...');
      }
      setProgress(Math.min(currentProgress, 92));
    }, 600);

    try {
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          captions,
          styleConfig,
          customFilename: exportFilename,
          metadata: {
            ...metadata,
            exportResolution: resolution,
            exportAspectRatio: aspectRatio,
            exportFitMode: fitMode,
            customFilename: exportFilename,
          },
          workerUrl: LOCAL_WORKER_URL,
        }),
      });

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('فشل قراءة استجابة الخادم أثناء الرندر.');
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'فشل رندر الفيديو بواسطة FFmpeg. تأكد من تشغيل Python Worker على جهازك.'
        );
      }

      if (!data.finalVideoUrl) {
        throw new Error('لم يتم إنشاء ملف الفيديو النهائي بنجاح.');
      }

      setProgress(100);
      setStageText('اكتمل حرق الكابشن واستلام الفيديو النهائي بنجاح!');
      const fname = data.filename || exportFilename;
      onRenderComplete(data.finalVideoUrl, fname);
    } catch (err: any) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      console.error('Render error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء رندر الفيديو.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyLink = () => {
    if (finalVideoUrl) {
      const fullUrl = window.location.origin + finalVideoUrl;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const effectiveDownloadName = finalFilename || getCleanFilename();
  const baseNameWithoutExt = effectiveDownloadName.replace(/\.mp4$/i, '');

  return (
    <div id="render-and-download-hub" className="space-y-6">
      {/* Action / Trigger Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                <span>رندر وحرق الكابشن في الفيديو النهائي</span>
              </h3>

              {/* Python Worker Badge */}
              <div
                onClick={onOpenWorkerModal}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border transition ${
                  workerOnline
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="انقر لعرض تفاصيل Python Worker"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    workerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{workerOnline ? 'Python Worker متصل' : 'Python Worker في انتظار التشغيل'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              يتم إرسال طلب الرندر إلى Python Local Worker على{' '}
              <code className="text-blue-300 font-mono">{LOCAL_WORKER_URL}/render</code> لحرق الكابشن بـ FFmpeg
            </p>
          </div>

          <button
            id="btn-render-video"
            type="button"
            disabled={isRendering || captions.length === 0}
            onClick={handleStartRender}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
              isRendering
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-blue-600/20 active:scale-95'
            }`}
          >
            {isRendering ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>جاري الرندر ({progress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{finalVideoUrl ? 'إعادة الرندر بتحديثات جديدة' : 'بدء الرندر وتوليد النتيجة (POST /render)'}</span>
              </>
            )}
          </button>
        </div>

        {/* 🌟 1. VIDEO NAME PROMPT BEFORE RENDER / EXPORT */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-blue-300 font-bold flex items-center gap-1.5 text-xs">
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span>اسم ملف الفيديو قبل الرندر والتصدير:</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-700">
              .MP4
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="اكتب اسم ملف الفيديو هنا..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm outline-none transition"
              dir="auto"
            />
          </div>

          {/* 🌟 2. VIDEO SIZES & RESOLUTION CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            {/* Aspect Ratio */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">المقاس والأبعاد:</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
              >
                <option value="9:16">📱 9:16 (شورتس / ريلز / تيك توك)</option>
                <option value="16:9">🖥️ 16:9 (يوتيوب / فيسبوك أفقي)</option>
                <option value="1:1">🔲 1:1 (مربع إنستغرام)</option>
                <option value="4:5">🖼️ 4:5 (منشورات عمودية)</option>
                <option value="original">📐 الأبعاد الأصلية للفيديو</option>
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">الدقة وجودة البكسل:</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
              >
                <option value="1080p">1080p Full HD (موصى به)</option>
                <option value="720p">720p HD (سريع وخفيف)</option>
                <option value="4k">4K Ultra HD (أعلى دقة)</option>
              </select>
            </div>

            {/* Fit Mode */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">الملاءمة والقص:</label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
              >
                <option value="contain">إبقاء الإطار بالكامل (Contain)</option>
                <option value="cover">ملء الشاشة بالقص (Cover)</option>
                <option value="blur_padding">خلفية مموهة ذكية (Blur Background)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rendering Progress Details */}
        {isRendering && (
          <div className="p-6 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-4 text-center animate-fadeIn">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400 animate-spin" />
                <span>{stageText}</span>
              </span>
              <span className="text-blue-400 font-mono text-sm">{progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> مسار Python Worker: {LOCAL_WORKER_URL}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> دقة {resolution} • أبعاد {aspectRatio}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> دمج ملفات ASS وترميز الخطوط العربية
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {onOpenWorkerModal && (
                <button
                  type="button"
                  onClick={onOpenWorkerModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition text-[11px]"
                >
                  دليل تشغيل Worker
                </button>
              )}
              <button
                type="button"
                onClick={handleStartRender}
                className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold transition text-[11px]"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED DOWNLOAD CENTER (مركز تحميل وتصدير النتيجة) */}
      {finalVideoUrl && !isRendering && (
        <div
          id="final-download-center"
          className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border-2 border-blue-500/60 space-y-6 shadow-2xl animate-fadeIn"
        >
          {/* Header of Download Hub */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>مركز تحميل النتيجة النهائية</span>
                  <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/40">
                    جاهز للتحميل
                  </span>
                </h4>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{effectiveDownloadName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                title="نسخ رابط الفيديو المباشر"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>

          {/* Rendered Video Player Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 max-w-xl mx-auto flex items-center justify-center shadow-2xl">
            <video
              src={finalVideoUrl}
              controls
              playsInline
              className="w-full max-h-[420px] object-contain"
            />
          </div>

          {/* PRIMARY DOWNLOAD BUTTON */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <a
              id="btn-download-video-main"
              href={`/api/download/${projectId}?filename=${encodeURIComponent(effectiveDownloadName)}`}
              download={effectiveDownloadName}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.02] active:scale-95"
            >
              <Download className="w-6 h-6 stroke-[2.5]" />
              <span>تحميل الفيديو ({effectiveDownloadName})</span>
            </a>
            <p className="text-xs text-slate-400 text-center">
              ملف الفيديو بدقة عالية جاهز للنشر على تيك توك، ريلز، يوتيوب شورتس، ومواقع التواصل.
            </p>
          </div>

          {/* SECONDARY EXPORT FORMATS (ASS / SRT / JSON / TXT) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>تحميل ملفات الترجمة والتنسيقات الإضافية:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* ASS File Download */}
              <a
                id="btn-download-ass"
                href={`/api/download-ass/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                download={`${baseNameWithoutExt}.ass`}
                className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                    ASS
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block group-hover:text-blue-300">ملف ASS</span>
                    <span className="text-[10px] text-slate-400">الألوان والخطوط</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              </a>

              {/* SRT File Download */}
              <a
                id="btn-download-srt"
                href={`/api/download-srt/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                download={`${baseNameWithoutExt}.srt`}
                className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                    SRT
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block group-hover:text-cyan-300">ملف SRT</span>
                    <span className="text-[10px] text-slate-400">لبرامج المونتاج</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
              </a>

              {/* JSON Captions Download */}
              <a
                id="btn-download-json"
                href={`/api/download-json/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                download={`${baseNameWithoutExt}.json`}
                className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                    JSON
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block group-hover:text-purple-300">ملف JSON</span>
                    <span className="text-[10px] text-slate-400">توقيت الكلمات</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
              </a>

              {/* TXT Download */}
              <a
                id="btn-download-txt"
                href={`/api/download-txt/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                download={`${baseNameWithoutExt}_Transcript.txt`}
                className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                    TXT
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block group-hover:text-amber-300">نص TXT</span>
                    <span className="text-[10px] text-slate-400">فقرات كاملة</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
