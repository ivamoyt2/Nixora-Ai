import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Film,
  FileCode,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Copy,
  Check,
  Zap,
  Layers,
  Smartphone,
  Monitor,
  Square,
  Ratio,
  Edit3,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { CaptionCue, CaptionStyleConfig, VideoMetadata } from '../types';
import { LOCAL_WORKER_URL } from './RenderSection';
import { renderVideoInBrowser } from '../utils/browserVideoRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  videoUrl?: string | null;
  captions: CaptionCue[];
  styleConfig: CaptionStyleConfig;
  metadata?: VideoMetadata;
  finalVideoUrl?: string | null;
  finalFilename?: string | null;
  onRenderComplete: (finalUrl: string, filename: string) => void;
  onOpenWorkerModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  videoUrl,
  captions,
  styleConfig,
  metadata,
  finalVideoUrl,
  finalFilename,
  onRenderComplete,
  onOpenWorkerModal,
}) => {
  const [activeExportTab, setActiveExportTab] = useState<'video' | 'subtitles'>('video');

  // Video Name Prompt / State
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
  const [fps, setFps] = useState<'30' | '60'>('30');
  const [quality, setQuality] = useState<'high' | 'ultra' | 'balanced'>('high');

  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [localDownloadUrl, setLocalDownloadUrl] = useState<string | null>(null);
  const [localDownloadName, setLocalDownloadName] = useState<string | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRendering) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isRendering]);

  if (!isOpen) return null;

  // Clean filename helper
  const getCleanFilename = (): string => {
    let clean = (videoTitle || '').trim().replace(/[\\/:*?"<>|]/g, '_');
    if (!clean) clean = `IslamView_Video_${Date.now()}`;
    return clean.toLowerCase().endsWith('.mp4') ? clean : `${clean}.mp4`;
  };

  // Dimensions descriptive text
  const getDimensionsText = () => {
    if (aspectRatio === '9:16') {
      if (resolution === '4k') return '2160 × 3840 بكسل (4K شورتس وريلز)';
      if (resolution === '720p') return '720 × 1280 بكسل (HD شورتس سريع)';
      return '1080 × 1920 بكسل (Full HD شورتس وريلز وتيك توك)';
    }
    if (aspectRatio === '16:9') {
      if (resolution === '4k') return '3840 × 2160 بكسل (4K يوتيوب وشاشات)';
      if (resolution === '720p') return '1280 × 720 بكسل (HD يوتيوب خفيف)';
      return '1920 × 1080 بكسل (Full HD يوتيوب وفيسبوك عريض)';
    }
    if (aspectRatio === '1:1') {
      if (resolution === '4k') return '2160 × 2160 بكسل (4K مربع)';
      if (resolution === '720p') return '720 × 720 بكسل (HD مربع)';
      return '1080 × 1080 بكسل (Full HD مربع إنستغرام)';
    }
    if (aspectRatio === '4:5') {
      if (resolution === '4k') return '2160 × 2700 بكسل (4K عمودي)';
      if (resolution === '720p') return '720 × 900 بكسل (HD عمودي)';
      return '1080 × 1350 بكسل (Full HD منشورات عمودية)';
    }
    return `الأبعاد الأصلية للفيديو (${metadata?.width || 1080} × ${metadata?.height || 1920})`;
  };

  // 1-CLICK EXPORT HANDLER
  const handleStartExport = async () => {
    if (!projectId && !videoUrl) {
      setErrorMsg('يرجى رفع فيديو وتوليد الكابشن أولاً.');
      return;
    }

    if (captions.length === 0) {
      setErrorMsg('لا توجد أسطر كابشن لتصديرها.');
      return;
    }

    const exportFilename = getCleanFilename();

    setIsRendering(true);
    setErrorMsg(null);
    setProgress(10);
    setStageText(`جاري تجهيز محرك الرندر وتصدير الفيديو باسم: ${exportFilename}...`);

    const updatedMetadata: VideoMetadata = {
      name: exportFilename,
      size: metadata?.size || 0,
      duration: metadata?.duration || 10,
      width: metadata?.width || (aspectRatio === '16:9' ? 1920 : 1080),
      height: metadata?.height || (aspectRatio === '16:9' ? 1080 : 1920),
      mimeType: 'video/mp4',
      aspectRatio: aspectRatio === 'original' ? metadata?.aspectRatio || '9:16' : aspectRatio,
      videoType: aspectRatio === '16:9' ? 'long' : 'short',
      exportResolution: resolution,
      exportFps: fps,
      exportQuality: quality,
      exportAspectRatio: aspectRatio,
      exportFitMode: fitMode,
      customFilename: exportFilename,
    };

    // Attempt 1: Fast Server / FFmpeg Worker
    let serverSucceeded = false;
    try {
      if (projectId) {
        setStageText('جاري معالجة الفيديو بحرق الكابشن وضبط المقاسات بدقة عالية...');
        let currentProgress = 15;
        progressTimerRef.current = setInterval(() => {
          currentProgress += 5;
          if (currentProgress < 90) {
            setProgress(currentProgress);
            setStageText(`جاري حرق النصوص وتنسيق الخط العربي (${currentProgress}%)...`);
          }
        }, 500);

        const response = await fetch('/api/render-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            captions,
            styleConfig,
            customFilename: exportFilename,
            metadata: updatedMetadata,
            workerUrl: LOCAL_WORKER_URL,
          }),
        });

        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        const data = await response.json();
        if (response.ok && data.success && data.finalVideoUrl) {
          serverSucceeded = true;
          setProgress(100);
          setStageText('تم التصدير بنجاح!');
          setLocalDownloadUrl(data.finalVideoUrl);
          const fname = data.filename || exportFilename;
          setLocalDownloadName(fname);
          onRenderComplete(data.finalVideoUrl, fname);

          // Auto trigger download
          const link = document.createElement('a');
          link.href = data.finalVideoUrl;
          link.download = fname;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsRendering(false);
          return;
        }
      }
    } catch (serverErr) {
      console.warn('Backend renderer fallback to browser canvas engine:', serverErr);
    }

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    // Attempt 2: Direct High-Speed In-Browser Video & Audio Burner (100% Reliable, Zero Setup)
    try {
      setStageText('جاري الرندر المباشر وحرق النصوص وتطبيق الحجم المختار...');
      const videoSrc = videoUrl || `/api/video-stream/${projectId}`;
      const result = await renderVideoInBrowser(
        videoSrc,
        captions,
        styleConfig,
        updatedMetadata,
        (prog, stage) => {
          setProgress(prog);
          setStageText(stage);
        }
      );

      setProgress(100);
      setStageText('اكتمل التصدير بنجاح!');
      setLocalDownloadUrl(result.url);
      const fname = result.filename || exportFilename;
      setLocalDownloadName(fname);
      onRenderComplete(result.url, fname);

      // Trigger instant download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (browserErr: any) {
      console.error('Browser export error:', browserErr);
      setErrorMsg(browserErr.message || 'حدث خطأ أثناء تصدير الفيديو. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyLink = () => {
    const url = localDownloadUrl || finalVideoUrl;
    if (url) {
      const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyTranscript = () => {
    const text = captions.map((c) => c.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  const effectiveDownloadUrl = localDownloadUrl || finalVideoUrl;
  const effectiveFilename = localDownloadName || finalFilename || getCleanFilename();
  const baseNameWithoutExt = effectiveFilename.replace(/\.mp4$/i, '');

  return (
    <div
      id="modal-export"
      onClick={() => {
        if (!isRendering) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border-2 border-blue-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-blue-600/20">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>تصدير وتسمية الفيديو (Export Studio)</span>
                <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  MP4 فوري
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                حدد اسم الفيديو، عدل الأبعاد والأحجام، وحمل الفيديو مباشرة مع الكابشن
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveExportTab('video')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeExportTab === 'video'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>تصدير فيديو MP4 وتعديل المقاسات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveExportTab('subtitles')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeExportTab === 'subtitles'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>ملفات الترجمة (SRT / ASS / TXT)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {activeExportTab === 'video' ? (
            /* VIDEO EXPORT SECTION */
            <div className="space-y-5">
              {/* 🌟 1. VIDEO NAME PROMPT & INPUT (طلب اسم الفيديو قبل التصدير والتحميل) */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-4 rounded-2xl border-2 border-blue-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-blue-300 font-bold flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    <span>اسم ملف الفيديو قبل التصدير والتحميل (Video Name):</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    .MP4
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="اكتب اسم الفيديو هنا (مثال: تلاوة_خاشعة_سورة_الكهف)"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm outline-none transition shadow-inner placeholder-slate-500"
                    dir="auto"
                  />
                </div>

                {/* Suggested Quick Titles */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">اقتراحات سريعة:</span>
                  {[
                    'شورتس_اسلامي_مؤثر',
                    'تلاوة_خاشعة',
                    'حكمة_اليوم',
                    'ريلز_انستغرام',
                    'بودكاست_ديني',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setVideoTitle(sug)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-emerald-900/40 text-slate-300 hover:text-blue-300 border border-slate-700 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🌟 2. VIDEO SIZES & DIMENSIONS CUSTOMIZATION (تعديل أحجام وأبعاد الفيديوهات) */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>تعديل أحجام وأبعاد وتنسيق الفيديو (Video Sizes & Format):</span>
                  </span>
                  <span className="text-[11px] text-blue-400 font-mono">
                    {getDimensionsText()}
                  </span>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="text-slate-300 block mb-2 font-semibold">
                    1. مقاس ونسبة العرض إلى الارتفاع (Aspect Ratio):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 9:16 Shorts */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        aspectRatio === '9:16'
                          ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-blue-400" />
                      <span className="text-xs">9:16 عمودي</span>
                      <span className="text-[10px] text-slate-400">شورتس • ريلز • تيك توك</span>
                    </button>

                    {/* 16:9 Landscape */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        aspectRatio === '16:9'
                          ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Monitor className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs">16:9 عريض</span>
                      <span className="text-[10px] text-slate-400">يوتيوب • فيسبوك • شاشات</span>
                    </button>

                    {/* 1:1 Square */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio('1:1')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        aspectRatio === '1:1'
                          ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Square className="w-5 h-5 text-amber-400" />
                      <span className="text-xs">1:1 مربع</span>
                      <span className="text-[10px] text-slate-400">إنستغرام • فيسبوك بوست</span>
                    </button>

                    {/* 4:5 Feed */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio('4:5')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        aspectRatio === '4:5'
                          ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Ratio className="w-5 h-5 text-purple-400" />
                      <span className="text-xs">4:5 عمودي متوسط</span>
                      <span className="text-[10px] text-slate-400">منشورات انستغرام</span>
                    </button>
                  </div>
                </div>

                {/* Resolution, Fit Mode & FPS Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Resolution Quality */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">دقة التصدير (Resolution):</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
                    >
                      <option value="1080p">1080p FHD (الأفضل والموصى به)</option>
                      <option value="720p">720p HD (سريع وأصغر حجماً)</option>
                      <option value="4k">4K Ultra HD (أعلى وضوح ونقاء)</option>
                    </select>
                  </div>

                  {/* Fit Mode */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">طريقة ملاءمة الفيديو (Fit):</label>
                    <select
                      value={fitMode}
                      onChange={(e) => setFitMode(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
                    >
                      <option value="contain">إبقاء الإطار بالكامل (Contain)</option>
                      <option value="cover">ملء الشاشة مع القص (Cover / Crop)</option>
                      <option value="blur_padding">خلفية مموهة ذكية (Blur Background)</option>
                    </select>
                  </div>

                  {/* Frame Rate */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">معدل الإطارات (FPS):</label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-blue-500"
                    >
                      <option value="30">30 إطار/ثانية (افتراضي قياسي)</option>
                      <option value="60">60 إطار/ثانية (نعومة فائقة)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Progress Bar when rendering */}
              {isRendering && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-3 text-center animate-fadeIn">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400 animate-spin" />
                      <span>{stageText}</span>
                    </span>
                    <span className="text-blue-400 font-mono text-sm">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Ready Video Result Box */}
              {effectiveDownloadUrl && !isRendering && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-blue-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      <span>الفيديو جاهز للتحميل باسم: <code className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded">{effectiveFilename}</code></span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>

                  <a
                    id="btn-modal-download-rendered"
                    href={effectiveDownloadUrl}
                    download={effectiveFilename}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition transform hover:scale-[1.01]"
                  >
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>تحميل الفيديو ({effectiveFilename})</span>
                  </a>
                </div>
              )}

              {/* 🌟 1-CLICK INSTANT EXPORT BUTTON */}
              <button
                type="button"
                id="btn-start-export-now"
                disabled={isRendering || captions.length === 0}
                onClick={handleStartExport}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                  isRendering
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-blue-600/20 active:scale-95'
                }`}
              >
                {isRendering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    <span>جاري التصدير وتطبيق الأبعاد ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {effectiveDownloadUrl
                        ? `إعادة تصدير وتحميل الفيديو (${getCleanFilename()})`
                        : `تصدير وتحميل الفيديو الآن (${getCleanFilename()})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* SUBTITLES & TRANSCRIPTS TAB */
            <div className="space-y-4">
              <p className="text-slate-300">
                تحميل ملفات الترجمة والتوقيت بالاسم المخصص <code className="text-blue-400 font-mono">{baseNameWithoutExt}</code>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* SRT Download */}
                <a
                  href={`/api/download-srt/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                  download={`${baseNameWithoutExt}.srt`}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                      SRT
                    </div>
                    <div>
                      <h5 className="font-bold text-white group-hover:text-cyan-300">ملف الترجمة المعياري SRT</h5>
                      <p className="text-[11px] text-slate-400">متوافق مع كل برامج المونتاج ويوتيوب</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                </a>

                {/* ASS Download */}
                <a
                  href={`/api/download-ass/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                  download={`${baseNameWithoutExt}.ass`}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                      ASS
                    </div>
                    <div>
                      <h5 className="font-bold text-white group-hover:text-blue-300">ملف الترجمة المنسق ASS</h5>
                      <p className="text-[11px] text-slate-400">يشمل الخطوط والألوان والمواضع</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                </a>

                {/* TXT Download */}
                <a
                  href={`/api/download-txt/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                  download={`${baseNameWithoutExt}_Transcript.txt`}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                      TXT
                    </div>
                    <div>
                      <h5 className="font-bold text-white group-hover:text-amber-300">ملف النص الكامل TXT</h5>
                      <p className="text-[11px] text-slate-400">النص المكتوب كفقرات للقراءة</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                </a>

                {/* JSON Download */}
                <a
                  href={`/api/download-json/${projectId}?filename=${encodeURIComponent(baseNameWithoutExt)}`}
                  download={`${baseNameWithoutExt}_Captions.json`}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                      JSON
                    </div>
                    <div>
                      <h5 className="font-bold text-white group-hover:text-purple-300">ملف التوقيت JSON</h5>
                      <p className="text-[11px] text-slate-400">توقيت الكلمات بدقة أجزاء الثانية</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                </a>
              </div>

              {/* Quick Copy Transcript Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  {copiedTranscript ? (
                    <>
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>تم نسخ النص بالكامل إلى الحافظة!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>نسخ النص المكتوب كاملاً (Copy Full Transcript)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {captions.length} سطر كابشن • {aspectRatio} • {resolution}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
