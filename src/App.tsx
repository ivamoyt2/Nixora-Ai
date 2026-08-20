import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProjectsPage } from './components/ProjectsPage';
import { PricingPage } from './components/PricingPage';
import { AboutPage } from './components/AboutPage';
import { FaqPage } from './components/FaqPage';
import { SettingsPage } from './components/SettingsPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AccountModal } from './components/AccountModal';
import { IntroVideoModal } from './components/IntroVideoModal';

// Existing Studio Components
import { UploadSection } from './components/UploadSection';
import { VideoTypeSelector } from './components/VideoTypeSelector';
import { StyleSelector } from './components/StyleSelector';
import { VideoPreviewPlayer } from './components/VideoPreviewPlayer';
import { CaptionEditor } from './components/CaptionEditor';
import { CaptionSettingsPanel } from './components/CaptionSettingsPanel';
import { RenderSection } from './components/RenderSection';
import { WindowsGuideModal } from './components/WindowsGuideModal';
import { WorkerModal } from './components/WorkerModal';
import { ExportModal } from './components/ExportModal';
import { MontageStudio } from './components/MontageStudio';
import { DEFAULT_STYLE_PRESETS } from './constants/presets';
import { extractAudioInBrowser } from './utils/audioExtractor';
import {
  CaptionCue,
  CaptionStyleConfig,
  CaptionStyleType,
  ProjectInfo,
  VideoMetadata,
  VideoType,
  AppPage,
} from './types';
import {
  Sparkles,
  Play,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Film,
  RotateCcw,
  Sliders,
  Download,
  ArrowLeft,
  Crown,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);

  // Project & Video States (Caption Studio)
  const [projectId, setProjectId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Configuration States
  const [selectedVideoType, setSelectedVideoType] = useState<VideoType>('short');
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyleType>('viral');
  const [styleConfig, setStyleConfig] = useState<CaptionStyleConfig>(
    DEFAULT_STYLE_PRESETS.viral.short
  );

  // Captions & Playback
  const [captions, setCaptions] = useState<CaptionCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // UI Status
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgressText, setTranscribeProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [finalFilename, setFinalFilename] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor');
  const [activeMode, setActiveMode] = useState<'montage' | 'caption'>('montage');
  const [workerOnline, setWorkerOnline] = useState<boolean>(false);

  // Check query params to open intro video automatically if requested
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('intro') === 'true' || params.get('video') === 'true') {
        setIsIntroModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll Local Worker status
  const checkWorkerStatus = async () => {
    try {
      const res = await fetch('/api/worker-status');
      const data = await res.json();
      setWorkerOnline(!!data.online);
    } catch {
      setWorkerOnline(false);
    }
  };

  useEffect(() => {
    checkWorkerStatus();
    const interval = setInterval(checkWorkerStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handler to smoothly transfer rendered Montage video to Caption Studio
  const handleMontageToCaption = async (
    montageVideoUrl: string,
    montageProjId: string,
    meta: VideoMetadata
  ) => {
    setProjectId(montageProjId);
    setVideoUrl(montageVideoUrl);
    setMetadata(meta);
    setSelectedVideoType(meta.videoType);
    setStyleConfig(DEFAULT_STYLE_PRESETS[selectedStyle][meta.videoType]);
    setCaptions([]);
    setFinalVideoUrl(null);
    setFinalFilename(null);
    setActiveMode('caption');
    setCurrentPage('editor');

    // Auto-transcribe the audio from the montage video
    try {
      setIsTranscribing(true);
      setTranscribeProgressText('جاري استخراج الصوت من فيديو المونتاج...');

      // Fast audio extraction in browser with instant fallback
      let audioBlob: Blob | null = null;
      try {
        const response = await fetch(montageVideoUrl);
        const blob = await response.blob();
        const file = new File([blob], 'montage_output.mp4', { type: 'video/mp4' });
        setTranscribeProgressText('استخراج مسار الصوت ناصع النقاء...');
        audioBlob = await extractAudioInBrowser(file);
      } catch (extractErr) {
        console.warn('Browser audio extraction skipped, using server:', extractErr);
      }

      setTranscribeProgressText('الذكاء الاصطناعي يستمع ويكتب الكلمات بالتوقيت الدقيق...');
      const formData = new FormData();
      if (audioBlob) {
        formData.append('audio', audioBlob, 'audio.wav');
      }
      formData.append('projectId', montageProjId);
      formData.append('videoType', meta.videoType || 'short');

      const transRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transRes.ok) {
        throw new Error('تعذر تفريغ الصوت تلقائياً');
      }

      const transData = await transRes.json();
      if (transData.captions && transData.captions.length > 0) {
        setCaptions(transData.captions);
        saveProjectToStorage(montageProjId, montageVideoUrl, meta, transData.captions);
      }
    } catch (err: any) {
      console.warn('Auto-transcribe skipped or error:', err);
    } finally {
      setIsTranscribing(false);
      setTranscribeProgressText('');
    }
  };

  // Helper to save project into localStorage
  const saveProjectToStorage = (
    pId: string,
    vUrl: string,
    meta: VideoMetadata,
    caps: CaptionCue[]
  ) => {
    try {
      const existingStr = localStorage.getItem('nexora_ai_projects') || '[]';
      const existing: ProjectInfo[] = JSON.parse(existingStr);
      const updated = existing.filter((p) => p.id !== pId);

      const newProj: ProjectInfo = {
        id: pId,
        createdAt: new Date().toISOString(),
        videoMetadata: meta,
        captions: caps,
        styleConfig: styleConfig,
        status: 'ready',
        renderProgress: 100,
      };

      updated.unshift(newProj);
      localStorage.setItem('nexora_ai_projects', JSON.stringify(updated.slice(0, 30)));
    } catch {
      // ignore
    }
  };

  // Upload Video Flow (Caption Studio direct upload)
  const handleUploadVideo = async (file: File, meta: VideoMetadata) => {
    setIsUploading(true);
    setErrorMsg(null);
    setVideoFile(file);
    setMetadata(meta);
    setSelectedVideoType(meta.videoType);
    setStyleConfig(DEFAULT_STYLE_PRESETS[selectedStyle][meta.videoType]);
    setCaptions([]);
    setFinalVideoUrl(null);
    setFinalFilename(null);

    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('فشل رفع الفيديو إلى الخادم');
      const data = await res.json();
      setProjectId(data.projectId);

      await handleTranscribe(data.projectId, file);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الرفع والتحليل');
    } finally {
      setIsUploading(false);
    }
  };

  // Transcribe Flow
  const handleTranscribe = async (pId: string, file: File) => {
    setIsTranscribing(true);
    setTranscribeProgressText('استخراج الصوت بدقة فائقة...');
    setErrorMsg(null);

    try {
      const audioBlob = await extractAudioInBrowser(file);
      setTranscribeProgressText('الذكاء الاصطناعي يستمع ويكتب الكلمات بالتوقيت الدقيق...');

      const formData = new FormData();
      if (audioBlob) {
        formData.append('audio', audioBlob, 'audio.wav');
      }
      formData.append('projectId', pId);
      formData.append('videoType', selectedVideoType || 'short');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل التعرف على الكلمات وتوقيتها');
      }

      const data = await res.json();
      setCaptions(data.captions);

      if (metadata && videoUrl) {
        saveProjectToStorage(pId, videoUrl, metadata, data.captions);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر استخراج الكلمات بدقة');
    } finally {
      setIsTranscribing(false);
      setTranscribeProgressText('');
    }
  };

  const handleVideoTypeChange = (newType: VideoType) => {
    setSelectedVideoType(newType);
    setStyleConfig(DEFAULT_STYLE_PRESETS[selectedStyle][newType]);
  };

  // Reset project
  const handleReset = () => {
    if (window.confirm('هل تريد بدء مشروع جديد ومسح التعديلات الحالية؟')) {
      setProjectId(null);
      setVideoFile(null);
      setVideoUrl(null);
      setMetadata(null);
      setCaptions([]);
      setFinalVideoUrl(null);
      setFinalFilename(null);
      setErrorMsg(null);
    }
  };

  const handleOpenLegal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setIsLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReset={handleReset}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenIntroVideo={() => setIsIntroModalOpen(true)}
        hasProject={!!videoUrl}
        hasCaptions={captions.length > 0}
        currentMode={activeMode}
        onModeChange={setActiveMode}
      />

      {/* Dynamic Main Body based on currentPage */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert Message */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-center justify-between shadow-lg shadow-red-950/40 animate-fadeIn">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs bg-red-900/60 hover:bg-red-800 px-3 py-1.5 rounded-xl text-red-200 transition font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* 1. LANDING PAGE */}
        {currentPage === 'home' && (
          <LandingPage
            onStartNow={() => {
              setCurrentPage('editor');
              setActiveMode('montage');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenMode={(mode) => {
              setCurrentPage('editor');
              setActiveMode(mode);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenIntroModal={() => setIsIntroModalOpen(true)}
          />
        )}

        {/* 2. PROJECTS PAGE */}
        {currentPage === 'projects' && (
          <ProjectsPage
            onOpenNewMontage={() => {
              setCurrentPage('editor');
              setActiveMode('montage');
            }}
            onOpenNewCaption={() => {
              setCurrentPage('editor');
              setActiveMode('caption');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {/* 3. PRICING PAGE */}
        {currentPage === 'pricing' && (
          <PricingPage
            onStartNow={() => {
              setCurrentPage('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {/* 4. ABOUT PAGE */}
        {currentPage === 'about' && (
          <AboutPage
            onStartNow={() => {
              setCurrentPage('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {/* 5. FAQ PAGE */}
        {currentPage === 'faq' && (
          <FaqPage onNavigate={setCurrentPage} />
        )}

        {/* 6. SETTINGS PAGE */}
        {currentPage === 'settings' && (
          <SettingsPage
            workerOnline={workerOnline}
            onCheckWorker={checkWorkerStatus}
            onOpenWorkerGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* 7. CONTACT PAGE */}
        {currentPage === 'contact' && (
          <ContactPage onNavigate={setCurrentPage} />
        )}

        {/* 8. EDITOR PAGE (Full Montage Studio & Caption Studio) */}
        {currentPage === 'editor' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Mode Switcher Bar in Editor */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#090D16] border border-blue-950/80 p-4 sm:p-5 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  {activeMode === 'montage' ? (
                    <Film className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>
                      {activeMode === 'montage'
                        ? 'استوديو المونتاج الآلي'
                        : 'استوديو الكابشن وتوليد الترجمة الذكية'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black">
                      AI Powered
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    {activeMode === 'montage'
                      ? 'ارفع المشاهد المرقمة والأصوات للتركيب التلقائي، ثم أرسلها إلى استوديو الكابشن بضغطة زر.'
                      : 'تحليل دقيق لنبرات الصوت العربي مع قوالب كابشن فيروسية وتأثيرات كين بيرنز.'}
                  </p>
                </div>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center bg-black p-1.5 rounded-2xl border border-blue-950 self-stretch sm:self-auto justify-center">
                <button
                  type="button"
                  onClick={() => setActiveMode('montage')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMode === 'montage'
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>1. المونتاج الآلي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('caption')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMode === 'caption'
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>2. استوديو الكابشن</span>
                </button>
              </div>
            </div>

            {/* MODE 1: AUTOMATIC MONTAGE STUDIO */}
            {activeMode === 'montage' && (
              <MontageStudio
                onSendToCaptionStudio={handleMontageToCaption}
                onOpenWorkerModal={() => setIsWorkerModalOpen(true)}
                workerOnline={workerOnline}
                onCheckWorker={checkWorkerStatus}
              />
            )}

            {/* MODE 2: CAPTION STUDIO */}
            {activeMode === 'caption' && (
              <>
                {/* STEP 1: Upload or Loading State */}
                {!videoUrl ? (
                  <UploadSection
                    onVideoSelected={handleUploadVideo}
                    isUploading={isUploading || isTranscribing}
                    uploadProgress={isTranscribing ? 70 : 0}
                  />
                ) : (
                  /* STEP 2: Main Video Editor Workspace */
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top Action Bar when video is loaded */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#090D16] p-3 sm:p-4 rounded-2xl border border-blue-950">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          {videoFile?.name || 'فيديو المونتاج الجاهز'}
                        </div>
                        {metadata && (
                          <div className="text-xs text-slate-400 font-mono hidden sm:block">
                            ({metadata.duration}s • {metadata.aspectRatio} • {metadata.videoType})
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Re-transcribe Audio Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (projectId && videoFile) {
                              handleTranscribe(projectId, videoFile);
                            }
                          }}
                          disabled={isTranscribing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer border border-slate-800"
                          title="إعادة استماع وتحليل الكلمات بالذكاء الاصطناعي"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${isTranscribing ? 'animate-spin' : ''}`}
                          />
                          <span>{isTranscribing ? 'جاري التحليل...' : 'إعادة استماع'}</span>
                        </button>

                        {/* Export Button */}
                        <button
                          id="btn-quick-export"
                          type="button"
                          onClick={() => setIsExportModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-blue-400/30"
                          title="تصدير الفيديو بكابشن وحركات مدمجة"
                        >
                          <Download className="w-4 h-4 stroke-[2.5]" />
                          <span>تصدير الفيديو</span>
                        </button>

                        {/* Reset / Change Video Button */}
                        <button
                          type="button"
                          onClick={handleReset}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-900/60 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <span>تغيير الفيديو</span>
                        </button>
                      </div>
                    </div>

                    {/* Transcribing Overlay Banner */}
                    {isTranscribing && (
                      <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/40 flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                        <Sparkles className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                        <span className="text-xs text-blue-200 font-medium">
                          {transcribeProgressText ||
                            'الذكاء الاصطناعي يحلل الكلمات ويحدد توقيتها بالمللي ثانية...'}
                        </span>
                      </div>
                    )}

                    {/* Video Type & Style Selectors */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 bg-[#090D16] rounded-2xl border border-blue-950 p-5 shadow-lg">
                        <VideoTypeSelector
                          selectedType={selectedVideoType}
                          onChange={handleVideoTypeChange}
                        />
                      </div>

                      <div className="lg:col-span-2 bg-[#090D16] rounded-2xl border border-blue-950 p-5 shadow-lg">
                        <StyleSelector
                          selectedConfig={styleConfig}
                          onSelectPreset={(newConfig) => {
                            setStyleConfig(newConfig);
                            setSelectedStyle(newConfig.styleType);
                          }}
                        />
                      </div>
                    </div>

                    {/* Main Interactive Studio Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left/Main Column: Video Preview Player */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                            <Play className="w-4 h-4 text-blue-400 fill-current" />
                            <span>المعاينة التفاعلية الحية</span>
                          </span>
                          <span className="text-[11px] text-blue-400 font-mono font-medium">
                            4K Dynamic Engine
                          </span>
                        </div>

                        <VideoPreviewPlayer
                          videoUrl={videoUrl}
                          captions={captions}
                          styleConfig={styleConfig}
                          metadata={metadata || undefined}
                          currentTime={currentTime}
                          onTimeUpdate={setCurrentTime}
                          onUpdateStyleConfig={(patch) =>
                            setStyleConfig((prev) => ({ ...prev, ...patch }))
                          }
                        />
                      </div>

                      {/* Right Column: Tabs */}
                      <div className="lg:col-span-7 space-y-4">
                        {/* Tabs switcher */}
                        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                          <button
                            id="tab-editor"
                            type="button"
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              activeTab === 'editor'
                                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                                : 'bg-[#090D16] text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>محرر النصوص والتوقيت ({captions.length})</span>
                          </button>

                          <button
                            id="tab-settings"
                            type="button"
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              activeTab === 'settings'
                                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                                : 'bg-[#090D16] text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Sliders className="w-4 h-4" />
                            <span>تأثيرات الكلمات والأبعاد والظلال</span>
                          </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'editor' ? (
                          <CaptionEditor
                            captions={captions}
                            currentTime={currentTime}
                            videoDuration={metadata?.duration || 15}
                            onSeek={setCurrentTime}
                            onCaptionsChange={(newCaps) => {
                              setCaptions(newCaps);
                              if (projectId && videoUrl && metadata) {
                                saveProjectToStorage(projectId, videoUrl, metadata, newCaps);
                              }
                            }}
                            onUpdateCaptions={(newCaps) => {
                              setCaptions(newCaps);
                              if (projectId && videoUrl && metadata) {
                                saveProjectToStorage(projectId, videoUrl, metadata, newCaps);
                              }
                            }}
                          />
                        ) : (
                          <CaptionSettingsPanel
                            config={styleConfig}
                            onChange={(updated) => setStyleConfig(updated)}
                            videoType={selectedVideoType}
                          />
                        )}
                      </div>
                    </div>

                    {/* Render Section */}
                    {captions.length > 0 && (
                      <RenderSection
                        projectId={projectId}
                        captions={captions}
                        styleConfig={styleConfig}
                        metadata={metadata || undefined}
                        onRenderComplete={(url, filename) => {
                          setFinalVideoUrl(url);
                          setFinalFilename(filename);
                        }}
                        finalVideoUrl={finalVideoUrl || undefined}
                        finalFilename={finalFilename || undefined}
                        onOpenWorkerModal={() => setIsWorkerModalOpen(true)}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLegal={handleOpenLegal}
      />

      {/* 🌟 INTRO / HERO VIDEO MODAL */}
      <IntroVideoModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        onEnterSite={() => {
          setIsIntroModalOpen(false);
          setCurrentPage('editor');
          setActiveMode('montage');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 🌟 EXPORT MODAL */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projectId={projectId}
        videoUrl={videoUrl}
        captions={captions}
        styleConfig={styleConfig}
        metadata={metadata || undefined}
        finalVideoUrl={finalVideoUrl}
        finalFilename={finalFilename}
        onRenderComplete={(url, filename) => {
          setFinalVideoUrl(url);
          setFinalFilename(filename);
        }}
        onOpenWorkerModal={() => setIsWorkerModalOpen(true)}
      />

      {/* Windows Local Guide Modal */}
      <WindowsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Local Worker Status & Connect Modal */}
      <WorkerModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
      />

      {/* Account / Sign In Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onNavigate={(page) => {
          setIsAccountModalOpen(false);
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Legal & Privacy Policy Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
}
