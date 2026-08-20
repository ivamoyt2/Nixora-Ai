import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Upload,
  Play,
  Pause,
  Trash2,
  Download,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  FileImage,
  FileAudio,
  Cpu,
  Monitor,
  Smartphone,
  ChevronRight,
  Sliders,
  Check,
  Edit3,
  Square,
  Ratio,
  Volume2,
  VolumeX,
  Music,
  Zap,
  Wind,
  Eye,
  Palette,
  Move,
  Wand2,
  Plus,
  RotateCcw,
  Maximize2,
  Sun,
  Moon,
  Disc,
  TrendingUp,
  BookOpen,
  Camera,
  Heart,
  CloudRain,
} from 'lucide-react';
import {
  MontagePairItem,
  MontageSettings,
  VideoMetadata,
  TransitionType,
  MotionEffect,
  VisualFilter,
  OverlayEffect,
} from '../types';
import { sfxSynthesizer, SFX_CATALOG, SfxCatalogItem } from '../utils/sfxGenerator';

interface MontageStudioProps {
  onSendToCaptionStudio: (videoUrl: string, projectId: string, metadata: VideoMetadata) => void;
  onOpenWorkerModal: () => void;
  workerOnline: boolean;
  onCheckWorker: () => void;
}

type MontageTab = 'timeline' | 'transitions' | 'sfx' | 'motion_filters' | 'preview';

export const MontageStudio: React.FC<MontageStudioProps> = ({
  onSendToCaptionStudio,
  onOpenWorkerModal,
  workerOnline,
  onCheckWorker,
}) => {
  const [activeTab, setActiveTab] = useState<MontageTab>('timeline');
  const [pairs, setPairs] = useState<MontagePairItem[]>([]);
  const [unpairedImages, setUnpairedImages] = useState<File[]>([]);
  const [unpairedAudios, setUnpairedAudios] = useState<File[]>([]);

  // Studio Settings
  const [settings, setSettings] = useState<MontageSettings>({
    aspectRatio: '9:16',
    resolution: '1080p',
    fps: '30',
    fitMode: 'contain',
    backgroundColor: '#000000',
    customFilename: `فيديو_مونتاج_${Date.now().toString().slice(-4)}`,
    // Transitions
    globalTransition: 'fade',
    transitionDuration: 0.5,
    // Motion & Visuals
    globalMotion: 'kenburns_in',
    globalFilter: 'warm_spiritual',
    overlay: 'vignette',
    // Audio & SFX
    autoSfxOnTransition: true,
    sfxType: 'whoosh',
    sfxVolume: 75,
    bgmVolume: 15,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rendered Output State
  const [renderedResult, setRenderedResult] = useState<{
    projectId: string;
    videoUrl: string;
    downloadUrl: string;
    filename: string;
    duration: number;
    metadata: VideoMetadata;
  } | null>(null);

  // Audio Playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Interactive Sequence Previewer State
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewCurrentIndex, setPreviewCurrentIndex] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewIntervalRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);

  // Extract integer number from filename (e.g., '01.png' -> 1, '1.mp3' -> 1, 'img_02.jpg' -> 2)
  const extractIndex = (filename: string): number => {
    const cleanName = filename.split('.')[0] || filename;
    const match = cleanName.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Measure audio file duration via Web Audio / HTMLAudioElement
  const getAudioFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        URL.revokeObjectURL(url);
        resolve(isNaN(d) || d <= 0 ? 3.0 : Number(d.toFixed(2)));
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(3.0);
      };
    });
  };

  // Process uploaded files and build paired list
  const handleFilesUpload = async (incomingFiles: FileList | File[]) => {
    const fileArray = Array.from(incomingFiles);
    if (fileArray.length === 0) return;

    setErrorMessage(null);
    setStageText('جاري قراءة الملفات واكتشاف الأرقام...');

    const images: File[] = [];
    const audios: File[] = [];

    fileArray.forEach((f) => {
      const ext = f.name.toLowerCase().split('.').pop() || '';
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) || f.type.startsWith('image/')) {
        images.push(f);
      } else if (['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(ext) || f.type.startsWith('audio/')) {
        audios.push(f);
      }
    });

    // Map by index
    const imageMap = new Map<number, File>();
    const audioMap = new Map<number, File>();
    const strayImages: File[] = [];
    const strayAudios: File[] = [];

    images.forEach((img) => {
      const idx = extractIndex(img.name);
      if (idx > 0) {
        imageMap.set(idx, img);
      } else {
        strayImages.push(img);
      }
    });

    audios.forEach((aud) => {
      const idx = extractIndex(aud.name);
      if (idx > 0) {
        audioMap.set(idx, aud);
      } else {
        strayAudios.push(aud);
      }
    });

    // Combine existing pairs with new ones
    const allIndices = Array.from(new Set([...Array.from(imageMap.keys()), ...Array.from(audioMap.keys())])).sort(
      (a, b) => a - b
    );

    const newPairs: MontagePairItem[] = [];
    let currentCumulativeTime = 0;

    for (const idx of allIndices) {
      const img = imageMap.get(idx);
      const aud = audioMap.get(idx);

      let duration = 3.0;
      if (aud) {
        duration = await getAudioFileDuration(aud);
      }

      const isPaired = !!(img && aud);
      let error = undefined;
      if (!img) error = `الصورة رقم ${idx} مفقودة (مثال: ${idx}.png)`;
      if (!aud) error = `الصوت رقم ${idx} مفقود (مثال: ${idx}.mp3)`;

      newPairs.push({
        id: `pair_${idx}_${Date.now()}`,
        index: idx,
        imageFile: img,
        imageName: img ? img.name : undefined,
        imageUrl: img ? URL.createObjectURL(img) : undefined,
        audioFile: aud,
        audioName: aud ? aud.name : undefined,
        audioUrl: aud ? URL.createObjectURL(aud) : undefined,
        duration,
        startTime: currentCumulativeTime,
        endTime: currentCumulativeTime + duration,
        isPaired,
        error,
        transition: settings.globalTransition,
        motion: settings.globalMotion,
        filter: settings.globalFilter,
        sfxTrigger: settings.sfxType,
      });

      if (isPaired) {
        currentCumulativeTime += duration;
      }
    }

    setPairs(newPairs);
    setUnpairedImages(strayImages);
    setUnpairedAudios(strayAudios);
    setStageText('');
  };

  // Recalculate timeline timestamps
  const recalculateTimelines = (pairList: MontagePairItem[]) => {
    let current = 0;
    return pairList.map((p) => {
      const dur = p.duration || 3.0;
      const st = current;
      const et = current + dur;
      if (p.isPaired) {
        current = et;
      }
      return {
        ...p,
        startTime: st,
        endTime: et,
      };
    });
  };

  // Move Pair Up or Down
  const handleMovePair = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= pairs.length) return;

    const updated = [...pairs];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIdx];
    updated[targetIdx] = temp;

    setPairs(recalculateTimelines(updated));
  };

  // Single audio playback preview
  const handleAudioPlayPause = (pairId: string, audioUrl: string) => {
    if (playingAudioId === pairId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.play();
      setPlayingAudioId(pairId);
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // Remove a specific pair
  const handleRemovePair = (indexToRemove: number) => {
    const filtered = pairs.filter((p) => p.index !== indexToRemove);
    setPairs(recalculateTimelines(filtered));
  };

  // Clear all
  const handleClearAll = () => {
    pairs.forEach((p) => {
      if (p.imageUrl) URL.revokeObjectURL(p.imageUrl);
      if (p.audioUrl) URL.revokeObjectURL(p.audioUrl);
    });
    setPairs([]);
    setUnpairedImages([]);
    setUnpairedAudios([]);
    setRenderedResult(null);
    stopSequencePreview();
  };

  // Play sound effect test
  const handleTestSfx = (sfxId: string) => {
    sfxSynthesizer.triggerSfx(sfxId, (settings.sfxVolume || 75) / 100);
  };

  // ----------------------------------------------------
  // INTERACTIVE SEQUENCE PREVIEWER (معاينة حية للمونتاج)
  // ----------------------------------------------------
  const startSequencePreview = (startIndex = 0) => {
    const validPairs = pairs.filter((p) => p.isPaired);
    if (validPairs.length === 0) return;

    setPreviewPlaying(true);
    setPreviewCurrentIndex(startIndex);

    playPairSegment(startIndex, validPairs);
  };

  const playPairSegment = (index: number, validPairs: MontagePairItem[]) => {
    if (index >= validPairs.length) {
      stopSequencePreview();
      return;
    }

    setPreviewCurrentIndex(index);
    const pair = validPairs[index];

    // Trigger transition sound effect on clip entry!
    if (settings.autoSfxOnTransition && index > 0) {
      const sfxToPlay = pair.sfxTrigger || settings.sfxType || 'whoosh';
      sfxSynthesizer.triggerSfx(sfxToPlay, (settings.sfxVolume || 75) / 100);
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    if (pair.audioUrl) {
      const audio = new Audio(pair.audioUrl);
      previewAudioRef.current = audio;
      audio.play().catch(() => {});

      audio.onended = () => {
        playPairSegment(index + 1, validPairs);
      };
    } else {
      setTimeout(() => {
        playPairSegment(index + 1, validPairs);
      }, (pair.duration || 3) * 1000);
    }
  };

  const stopSequencePreview = () => {
    setPreviewPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
    }
  };

  // Helper to optimize large images in browser to avoid Rate/Payload Exceeded limits on uploads
  const optimizeImageForUpload = async (file: File, maxDim = 1920): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    // Skip resize for reasonable file sizes (< 1.5MB) to make process instantaneous
    if (file.size < 1.5 * 1024 * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w <= maxDim && h <= maxDim) {
          return resolve(file);
        }
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w / 2) * 2;
        canvas.height = Math.round(h / 2) * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const extName = file.name.replace(/\.[^/.]+$/, '.jpg');
              const optimized = new File([blob], extName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimized);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  // ----------------------------------------------------
  // RENDER MONTAGE VIDEO VIA SERVER / WORKER
  // ----------------------------------------------------
  const handleStartMontage = async () => {
    const validPairs = pairs.filter((p) => p.isPaired);
    if (validPairs.length === 0) {
      setErrorMessage('لا يوجد أزواج متطابقة من الصور والأصوات للبدء.');
      return;
    }

    stopSequencePreview();
    setIsProcessing(true);
    setProgress(5);
    setStageText('جاري تحسين وتجهيز الصور لسرعة المعالجة...');
    setErrorMessage(null);
    setRenderedResult(null);

    try {
      // 1. Client-side lightweight parallel image optimization
      const optimizedPairs = await Promise.all(
        validPairs.map(async (pair) => {
          let optImg = pair.imageFile;
          if (pair.imageFile) {
            optImg = await optimizeImageForUpload(pair.imageFile, 1920);
          }
          return {
            index: pair.index,
            imageFile: optImg,
            audioFile: pair.audioFile,
            pair,
          };
        })
      );

      setStageText('جاري رفع الصور والأصوات وبدء الرندر المتوازي...');
      setProgress(25);

      const formData = new FormData();
      optimizedPairs.forEach(({ imageFile, audioFile }) => {
        if (imageFile) formData.append('images', imageFile);
        if (audioFile) formData.append('audios', audioFile);
      });

      if (settings.bgmFile) {
        formData.append('bgm', settings.bgmFile);
      }

      formData.append(
        'settings',
        JSON.stringify({
          ...settings,
          customFilename: settings.customFilename || `فيديو_مونتاج_${Date.now()}`,
          pairsMeta: validPairs.map((p) => ({
            index: p.index,
            transition: p.transition || settings.globalTransition,
            motion: p.motion || settings.globalMotion,
            filter: p.filter || settings.globalFilter,
            sfxTrigger: p.sfxTrigger || settings.sfxType,
          })),
        })
      );

      setProgress(40);
      setStageText('جاري معالجة وربط المقاطع وتطبيق الانتقالات عبر FFmpeg...');

      let response: Response;
      try {
        response = await fetch('/api/render-montage', {
          method: 'POST',
          body: formData,
        });
      } catch (netErr: any) {
        throw new Error(
          netErr.message?.includes('Failed to fetch')
            ? 'تعذر الاتصال بالخادم أو تم قطع الاتصال. يرجى تشغيل Islam View Worker أو المحاولة مرة أخرى.'
            : netErr.message || 'خطأ في الاتصال بالخادم.'
        );
      }

      setProgress(80);
      setStageText('جاري تجميع الفيديو النهائي واستخراج البيانات...');

      const responseText = await response.text();
      let result: any = null;

      if (responseText.includes('Rate exceeded') || response.status === 429) {
        throw new Error(
          'تم تجاوز حد معدل نقل البيانات في الخادم السحابي. يرجى تشغيل Islam View Worker على جهازك لتنفيذ المونتاج الفوري بدون أي قيود، أو الانتظار بضع ثوانٍ وإعادة المحاولة.'
        );
      }

      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse server response:', responseText);
        throw new Error(
          responseText.includes('<html') || !responseText.trim()
            ? `استجاب الخادم برمز (${response.status}). يرجى التأكد من تشغيل Islam View Worker أو مراجعة الملفات.`
            : responseText.slice(0, 250)
        );
      }

      if (!response.ok || !result || !result.success) {
        throw new Error(result?.error || 'فشل رندر المونتاج.');
      }

      setProgress(100);
      setStageText('تم اكتمال المونتاج بنجاح!');
      setIsProcessing(false);

      setRenderedResult({
        projectId: result.projectId,
        videoUrl: result.videoUrl,
        downloadUrl: result.downloadUrl,
        filename: result.filename,
        duration: result.duration,
        metadata: result.metadata,
      });
    } catch (err: any) {
      console.error('Montage render error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة المونتاج.');
    }
  };

  const matchedCount = pairs.filter((p) => p.isPaired).length;
  const missingCount = pairs.filter((p) => !p.isPaired).length;
  const totalCalculatedDuration = pairs
    .filter((p) => p.isPaired)
    .reduce((acc, p) => acc + (p.duration || 0), 0);

  // Helper CSS for Visual Filters
  const getFilterCss = (filterType: VisualFilter) => {
    switch (filterType) {
      case 'warm_spiritual':
        return 'sepia(20%) saturate(130%) contrast(105%)';
      case 'cinematic_dark':
        return 'contrast(125%) brightness(92%) saturate(90%)';
      case 'vintage_quran':
        return 'sepia(45%) contrast(110%) brightness(95%)';
      case 'vivid_gold':
        return 'saturate(150%) contrast(115%) hue-rotate(5deg)';
      case 'black_white':
        return 'grayscale(100%) contrast(120%)';
      case 'soft_glow':
        return 'contrast(105%) brightness(108%) blur(0.3px)';
      case 'cool_night':
        return 'hue-rotate(180deg) saturate(90%) contrast(110%)';
      default:
        return 'none';
    }
  };

  const activePreviewPair = pairs.filter((p) => p.isPaired)[previewCurrentIndex];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Studio Header & Worker Status Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#090D16] border border-blue-950 p-5 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-slate-950">
              <Film className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              استوديو المونتاج والمؤثرات الانتقالية (Montage & SFX Studio)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            اصنع فيديوهات احترافية تلقائيًا مع انتقالات بصرية، مؤثرات صوتية سينمائية (SFX)، حركات كين بيرنز، وموسيقى خلفية روحانية.
          </p>
        </div>

        {/* Worker & Engine Status */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={onOpenWorkerModal}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              workerOnline
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 hover:bg-blue-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{workerOnline ? 'Python Worker متصل (رندر فائق السرعة)' : 'ربط Islam View Worker'}</span>
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-bold">تنبيه أثناء معالجة المونتاج:</div>
            <p className="text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STUDIO TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-blue-950">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
              : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>المخطط الزمني والملفات ({pairs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'transitions'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
              : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>الانتقالات البصرية (Transitions)</span>
        </button>

        <button
          onClick={() => setActiveTab('sfx')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'sfx'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
              : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>المؤثرات الصوتية (SFX & Sounds)</span>
        </button>

        <button
          onClick={() => setActiveTab('motion_filters')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'motion_filters'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
              : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>حركات كين بيرنز وفلاتر الألوان</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
              : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>معاينة حية للمونتاج (Live Preview)</span>
        </button>
      </div>

      {/* TAB 1: TIMELINE & MAIN SETTINGS */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* UPLOAD DROPZONE */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-blue-950/80 hover:border-blue-500/80 bg-[#090D16] hover:bg-[#090D16] rounded-3xl p-8 sm:p-10 text-center transition flex flex-col items-center justify-center space-y-4 shadow-lg group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
              />

              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  اسحب وأفلت مجلد أو ملفات الصور والأصوات هنا
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يقوم النظام بربط الملفات تلقائياً حسب الأرقام المكتوبة في أسمائها (مثلاً: <code className="font-mono text-blue-400">1.png</code> مع <code className="font-mono text-blue-400">1.mp3</code>).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-blue-950/80 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" />
                  <span>صور PNG, JPG, WEBP</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-blue-950/80 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-amber-400" />
                  <span>أصوات MP3, WAV, AAC</span>
                </span>
              </div>
            </div>

            {/* QUICK STATS BAR */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#090D16] border border-blue-950 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[11px] text-slate-400">المقاطع المتطابقة</span>
                <div className="text-lg font-black text-blue-400 font-mono">{matchedCount}</div>
              </div>
              <div className="bg-[#090D16] border border-blue-950 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[11px] text-slate-400">إجمالي مدة المونتاج</span>
                <div className="text-lg font-black text-amber-300 font-mono">{totalCalculatedDuration.toFixed(1)}s</div>
              </div>
              <div className="bg-[#090D16] border border-blue-950 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[11px] text-slate-400">الانتقال التلقائي</span>
                <div className="text-lg font-black text-sky-300 font-mono capitalize">{settings.globalTransition}</div>
              </div>
            </div>
          </div>

          {/* RENDER SETTINGS PANEL */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-blue-950 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>إعدادات إخراج الفيديو والتصدير</span>
                </h3>
                {pairs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تفريغ</span>
                  </button>
                )}
              </div>

              {/* Custom Video Name Input */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-blue-950">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>اسم ملف فيديو المونتاج:</span>
                </label>
                <input
                  type="text"
                  value={settings.customFilename || ''}
                  onChange={(e) => setSettings({ ...settings, customFilename: e.target.value })}
                  placeholder="اكتب اسم الفيديو (مثال: قصة_أصحاب_الكهف)"
                  className="w-full bg-slate-900 border border-blue-950/80 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:border-blue-400"
                  dir="auto"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">أبعاد ومقاس الفيديو (Aspect Ratio):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, aspectRatio: '9:16' })}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      settings.aspectRatio === '9:16'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-blue-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">9:16 عمودي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, aspectRatio: '16:9' })}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      settings.aspectRatio === '16:9'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-blue-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">16:9 أفقي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, aspectRatio: '1:1' })}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      settings.aspectRatio === '1:1'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-blue-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">1:1 مربع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, aspectRatio: '4:5' })}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      settings.aspectRatio === '4:5'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-blue-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Ratio className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">4:5 منشور</span>
                  </button>
                </div>
              </div>

              {/* Resolution, Fit Mode & FPS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">الدقة:</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="w-full bg-slate-950 border border-blue-950 text-slate-200 text-xs rounded-xl p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1080p">1080p FHD</option>
                    <option value="720p">720p HD</option>
                    <option value="4k">4K UHD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">الملاءمة:</label>
                  <select
                    value={settings.fitMode}
                    onChange={(e) => setSettings({ ...settings, fitMode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-blue-950 text-slate-200 text-xs rounded-xl p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="contain">إبقاء الصورة كاملة</option>
                    <option value="cover">ملء الشاشة مع القص</option>
                    <option value="fill">تمديد الإطار</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">الإطارات:</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: e.target.value as any })}
                    className="w-full bg-slate-950 border border-blue-950 text-slate-200 text-xs rounded-xl p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Render Button */}
            <div className="pt-3">
              <button
                onClick={handleStartMontage}
                disabled={isProcessing || matchedCount === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري المونتاج عبر FFmpeg...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>بدء المونتاج التلقائي عبر FFmpeg</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSITIONS STUDIO (الانتقالات البصرية) */}
      {activeTab === 'transitions' && (
        <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-950 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>مكتبة الانتقالات البصرية بين المشاهد (Visual Transitions)</span>
              </h2>
              <p className="text-xs text-slate-400">
                اختر نوع الانتقال الافتراضي بين جميع المشاهد أو عدّل مدة الانتقال بالثواني.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-blue-950 text-xs">
              <span className="text-slate-400">مدة الانتقال:</span>
              <span className="font-bold text-blue-400 font-mono">{settings.transitionDuration}s</span>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.1"
                value={settings.transitionDuration}
                onChange={(e) => setSettings({ ...settings, transitionDuration: parseFloat(e.target.value) })}
                className="w-24 accent-emerald-500"
              />
            </div>
          </div>

          {/* Transition Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { id: 'fade', name: 'تلاشي ناعم', nameEn: 'Smooth Crossfade', desc: 'مزج تدريجي كلاسيكي سلس', icon: '✨' },
              { id: 'crossfade', name: 'تداخل سينمائي', nameEn: 'Cinematic Dissolve', desc: 'تداخل احترافي ناعم', icon: '🌌' },
              { id: 'wipeleft', name: 'مسح لليسار', nameEn: 'Wipe Left', desc: 'حركة مسح أفقية ديناميكية', icon: '⬅️' },
              { id: 'wiperight', name: 'مسح لليمين', nameEn: 'Wipe Right', desc: 'حركة مسح أفقية لليمين', icon: '➡️' },
              { id: 'slideleft', name: 'انزلاق سينمائي', nameEn: 'Slide Left', desc: 'دخول المشهد التالي من الجانب', icon: '⏩' },
              { id: 'zoomIn', name: 'زوم وتكبير', nameEn: 'Zoom In Transition', desc: 'اندفاع بصري مشوق', icon: '🔍' },
              { id: 'zoomOut', name: 'زوم للخارج', nameEn: 'Zoom Out Cut', desc: 'تراجع بصري أنيق', icon: '🔎' },
              { id: 'flash', name: 'فلاش أبيض', nameEn: 'White Flash Glitch', desc: 'وميض ضوئي خاطف وسريع', icon: '⚡' },
              { id: 'circleopen', name: 'فتحة دائرية', nameEn: 'Iris Circle', desc: 'انتقال دائري كلاسيكي جذاب', icon: '🔘' },
              { id: 'none', name: 'قص مباشر بدون انتقال', nameEn: 'Hard Cut', desc: 'انتقال فوري مباشر', icon: '✂️' },
            ].map((tr) => (
              <button
                key={tr.id}
                onClick={() => setSettings({ ...settings, globalTransition: tr.id as any })}
                className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-2 group ${
                  settings.globalTransition === tr.id
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-600/10 ring-1 ring-emerald-500'
                    : 'bg-slate-950/70 border-blue-950 text-slate-300 hover:border-blue-950/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{tr.icon}</span>
                  {settings.globalTransition === tr.id && (
                    <span className="p-1 rounded-full bg-blue-600 text-white font-black shadow-md shadow-blue-600/30">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{tr.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{tr.nameEn}</div>
                  <p className="text-[10px] text-slate-500 mt-1">{tr.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOUND EFFECTS (SFX) & BACKGROUND MUSIC */}
      {activeTab === 'sfx' && (
        <div className="space-y-6">
          {/* SFX CONTROLS & AUTO-TRIGGER SETTING */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-950 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <span>مكتبة المؤثرات الصوتية والسينمائية (SFX Suite)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  توليد أصوات سينمائية عالية النقاء مباشرة في المتصفح وتضمينها مع الانتقالات والمشاهد.
                </p>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-blue-950 text-xs">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">مستوى صوت SFX:</span>
                <span className="font-bold text-blue-400 font-mono">{settings.sfxVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={(e) => setSettings({ ...settings, sfxVolume: parseInt(e.target.value, 10) })}
                  className="w-24 accent-emerald-500"
                />
              </div>
            </div>

            {/* Auto Trigger Toggle */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-blue-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">تشغيل مؤثر صوتي تلقائي عند كل انتقال (Auto Transition SFX)</div>
                  <div className="text-[11px] text-slate-400">
                    يعطي الفيديو إيقاعاً سريعاً وجذاباً مثل فيديوهات الريلز والشورتس الاحترافية.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, autoSfxOnTransition: !settings.autoSfxOnTransition })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  settings.autoSfxOnTransition
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 shadow-md shadow-blue-600/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.autoSfxOnTransition ? 'مفعل ✓' : 'معطل'}
              </button>
            </div>

            {/* SFX CATALOG CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SFX_CATALOG.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    settings.sfxType === item.id
                      ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-950/70 border-blue-950 text-slate-300 hover:border-blue-950/80'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{item.nameAr}</span>
                      {settings.sfxType === item.id && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 text-[9px] font-bold">
                          المحدد
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{item.nameEn}</div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTestSfx(item.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                      title="تجربة الاستماع للمؤثر الصوتي"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, sfxType: item.id })}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition ${
                        settings.sfxType === item.id
                          ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {settings.sfxType === item.id ? 'معتمد' : 'اختيار'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BACKGROUND MUSIC & AMBIENCE (خلفيات صوتية ومستويات الصوت والدكنج) */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-blue-950 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">الخلفية الصوتية وتنسيق مستويات الصوت (Audio Mixing & Ducking)</h3>
              </div>
            </div>

            {/* Volume Mixers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-blue-950">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">صوت التعليق الصوتي:</span>
                  <span className="font-bold text-blue-400 font-mono">{settings.voiceVolume ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={settings.voiceVolume ?? 100}
                  onChange={(e) => setSettings({ ...settings, voiceVolume: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">صوت الموسيقى الخلفية:</span>
                  <span className="font-bold text-sky-400 font-mono">{settings.bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.bgmVolume}
                  onChange={(e) => setSettings({ ...settings, bgmVolume: parseInt(e.target.value, 10) })}
                  className="w-full accent-teal-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">صوت المؤثرات SFX:</span>
                  <span className="font-bold text-amber-400 font-mono">{settings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={(e) => setSettings({ ...settings, sfxVolume: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Audio Ducking & Fades Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-blue-950 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">الخفوت التلقائي للموسيقى (Audio Ducking)</div>
                  <div className="text-[10px] text-slate-400">خفوت صوت الخلفية تلقائياً أثناء كلام المعلق</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enableDucking: settings.enableDucking === false ? true : false })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    settings.enableDucking !== false
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.enableDucking !== false ? 'مفعل ✓' : 'معطل'}
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-blue-950 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">تلاشي الصوت بالبداية والنهاية (Fade In/Out)</div>
                  <div className="text-[10px] text-slate-400">دخول وخروج صوتي سينمائي سلس وناعم</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, audioFadeIn: !settings.audioFadeIn, audioFadeOut: !settings.audioFadeOut })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    settings.audioFadeIn !== false
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.audioFadeIn !== false ? 'مفعل ✓' : 'معطل'}
                </button>
              </div>
            </div>

            {/* BGM Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, bgmTrack: 'none' })}
                className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
                  !settings.bgmTrack || settings.bgmTrack === 'none'
                    ? 'bg-sky-500/20 border-sky-500 text-white'
                    : 'bg-slate-950 border-blue-950 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">بدون خلفية صوتية</div>
                  <div className="text-[10px] text-slate-500">التعليق الصوتي فقط</div>
                </div>
                {(!settings.bgmTrack || settings.bgmTrack === 'none') && <Check className="w-4 h-4 text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, bgmTrack: 'spiritual_pad' })}
                className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
                  settings.bgmTrack === 'spiritual_pad'
                    ? 'bg-sky-500/20 border-sky-500 text-white'
                    : 'bg-slate-950 border-blue-950 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">أجواء روحانية هادئة (Spiritual Drone)</div>
                  <div className="text-[10px] text-slate-500">نغمات وتدرج صوتي هادئ</div>
                </div>
                {settings.bgmTrack === 'spiritual_pad' && <Check className="w-4 h-4 text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => bgmInputRef.current?.click()}
                className="p-3.5 rounded-2xl border border-dashed border-blue-950/80 hover:border-sky-500 bg-slate-950 text-right transition flex items-center justify-between"
              >
                <input
                  ref={bgmInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      setSettings({ ...settings, bgmFile: f, bgmName: f.name, bgmTrack: 'custom' });
                    }
                  }}
                />
                <div>
                  <div className="text-xs font-bold text-sky-300">
                    {settings.bgmName ? `🎵 ${settings.bgmName}` : '+ رفع ملف صوتي مخصص'}
                  </div>
                  <div className="text-[10px] text-slate-500">MP3 / WAV للموسيقى الخلفية</div>
                </div>
                <Upload className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MOTION & COLOR FILTERS (كين بيرنز والألوان) */}
      {activeTab === 'motion_filters' && (
        <div className="space-y-6">
          {/* KEN BURNS MOTION */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-blue-950 pb-3">
              <Move className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">حركة الصور التلقائية (Ken Burns & Motion Engine)</h3>
                <p className="text-xs text-slate-400">تحريك الصور الثابتة بزوم ناعم وتأثير سينمائي لمنع ثبات المشهد.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {[
                { id: 'zoom_in', name: 'تكبير Zoom In', en: 'Ken Burns In', icon: '🔍' },
                { id: 'zoom_out', name: 'تصغير Zoom Out', en: 'Ken Burns Out', icon: '🔎' },
                { id: 'pan_left', name: 'تحريك لليسار', en: 'Pan Left', icon: '⬅️' },
                { id: 'pan_right', name: 'تحريك لليمين', en: 'Pan Right', icon: '➡️' },
                { id: 'pan_up', name: 'تحريك للأعلى', en: 'Pan Up', icon: '⬆️' },
                { id: 'pan_down', name: 'تحريك للأسفل', en: 'Pan Down', icon: '⬇️' },
                { id: 'subtle_motion', name: 'حركة بسيطة هادئة', en: 'Subtle Motion', icon: '💓' },
                { id: 'auto_cycle', name: 'حركة دورية ذكية', en: 'Smart Auto Cycle', icon: '🔄' },
                { id: 'none', name: 'ثابت', en: 'Static', icon: '⏹️' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, globalMotion: m.id as any })}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    settings.globalMotion === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-md'
                      : 'bg-slate-950 border-blue-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-xs">{m.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{m.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* COLOR GRADING & FILTERS */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-blue-950 pb-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">فلاتر وتعديل الألوان السينمائية (Color Grading)</h3>
                <p className="text-xs text-slate-400">إعطاء الفيديو طابعاً روحانياً وتاريخياً أو درامياً متناسقاً.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'warm_spiritual', name: 'دفء إسلامي ذهبي', desc: 'ألوان دافئة مريحة للعين', bg: 'from-amber-950/60 to-yellow-900/40' },
                { id: 'cinematic_dark', name: 'سينمائي درامي داكن', desc: 'تباين عالي وألوان عميقة', bg: 'from-slate-950 to-zinc-900' },
                { id: 'vintage_quran', name: 'عتيق تراثي (سيبيا)', desc: 'طابع صفحات المصاحف القديمة', bg: 'from-amber-900/40 to-stone-900/60' },
                { id: 'vivid_gold', name: 'إشراق وحيوية', desc: 'ألوان مشبعة وساطعة', bg: 'from-yellow-950/50 to-amber-800/40' },
                { id: 'black_white', name: 'أبيض وأسود فاخر', desc: 'طابع وثائقي كلاسيكي', bg: 'from-zinc-900 to-black' },
                { id: 'soft_glow', name: 'توهج ناعم حالم', desc: 'نعومة روحانية هادئة', bg: 'from-purple-950/40 to-slate-900' },
                { id: 'cool_night', name: 'أجواء ليلية باردة', desc: 'درجات زرقاء هادئة', bg: 'from-cyan-950/50 to-blue-900/30' },
                { id: 'sharpen', name: 'زيادة حدة التفاصيل', desc: 'وضوح فائق للتفاصيل', bg: 'from-emerald-950/50 to-teal-900/30' },
                { id: 'blur', name: 'تغبيش سينمائي ناعم', desc: 'طمس ضبابي ناعم', bg: 'from-indigo-950/50 to-slate-900' },
                { id: 'none', name: 'طبيعي (بدون فلتر)', desc: 'ألوان الصور الأصلية', bg: 'from-slate-900 to-slate-950' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, globalFilter: f.id as any })}
                  className={`p-4 rounded-2xl border text-right transition bg-gradient-to-br ${f.bg} ${
                    settings.globalFilter === f.id
                      ? 'border-purple-500 ring-1 ring-purple-500 text-white'
                      : 'border-blue-950 text-slate-300 hover:border-blue-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{f.name}</span>
                    {settings.globalFilter === f.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* OVERLAYS & BORDERS */}
          <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-blue-950 pb-3">
              <Wand2 className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">المؤثرات والإطارات السينمائية (Cinematic Overlays)</h3>
                <p className="text-xs text-slate-400">تعتيم الحواف والأشرطة السينمائية 2.35:1.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'vignette', name: 'تعتيم الحواف (Vignette)', desc: 'تركيز النظر في المنتصف' },
                { id: 'cinema_bars', name: 'شريط سينمائي Letterbox', desc: 'أشرطة سوداء سينمائية' },
                { id: 'none', name: 'بدون إطار إضافي', desc: 'إطار شاشة كامل' },
              ].map((ov) => (
                <button
                  key={ov.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, overlay: ov.id as any })}
                  className={`p-3 rounded-2xl border text-right transition ${
                    settings.overlay === ov.id
                      ? 'bg-sky-500/20 border-sky-500 text-white font-bold'
                      : 'bg-slate-950 border-blue-950 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">{ov.name}</div>
                  <div className="text-[10px] text-slate-500">{ov.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE INTERACTIVE PREVIEW (معاينة حية للمونتاج والانتقالات) */}
      {activeTab === 'preview' && (
        <div className="bg-[#090D16] border border-blue-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-950 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <span>المعاينة الحية التفاعلية للمونتاج (Live Sequence Player)</span>
              </h2>
              <p className="text-xs text-slate-400">
                شاهد المشاهد وانتقال الصور وتزامن الأصوات ومؤثرات SFX في مشغل المتصفح الحي.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (previewPlaying) stopSequencePreview();
                  else startSequencePreview(0);
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  previewPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-emerald-400 text-slate-950 shadow-blue-600/20'
                }`}
              >
                {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{previewPlaying ? 'إيقاف المعاينة' : 'تشغيل المونتاج التفاعلي بالكامل'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Player Screen */}
          <div className="max-w-md mx-auto aspect-[9/16] max-h-[480px] bg-black rounded-3xl overflow-hidden border-2 border-blue-950 shadow-2xl relative flex items-center justify-center">
            {activePreviewPair?.imageUrl ? (
              <img
                src={activePreviewPair.imageUrl}
                alt={`Scene ${activePreviewPair.index}`}
                style={{ filter: getFilterCss(settings.globalFilter) }}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  previewPlaying && settings.globalMotion === 'kenburns_in'
                    ? 'scale-110'
                    : previewPlaying && settings.globalMotion === 'kenburns_out'
                    ? 'scale-95'
                    : 'scale-100'
                }`}
              />
            ) : (
              <div className="text-center p-6 text-slate-500 space-y-2">
                <Film className="w-12 h-12 mx-auto opacity-30 text-blue-400" />
                <p className="text-xs">ارفع صوراً وأصواتاً للبدء في المعاينة الحية.</p>
              </div>
            )}

            {/* Overlays on Preview */}
            {settings.overlay === 'vignette' && (
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />
            )}
            {settings.overlay === 'cinema_bars' && (
              <>
                <div className="absolute top-0 left-0 right-0 h-10 bg-black pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-black pointer-events-none" />
              </>
            )}

            {/* Current Clip Badge Overlay */}
            {activePreviewPair && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-mono text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  مقطع #{activePreviewPair.index} ({previewCurrentIndex + 1}/{pairs.filter((p) => p.isPaired).length})
                </span>
              </div>
            )}
          </div>

          {/* Timeline Navigation Dots */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto overflow-x-auto py-2">
            {pairs
              .filter((p) => p.isPaired)
              .map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startSequencePreview(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition ${
                    previewCurrentIndex === idx
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 scale-110 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {p.index}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* SECTION: RENDER PROGRESS INDICATOR */}
      {isProcessing && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-white">
            <span className="flex items-center gap-2 text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{stageText}</span>
            </span>
            <span className="font-mono text-blue-400">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-blue-950">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300 shadow-md"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            يقوم FFmpeg الآن بربط كل صورة مع صوتها وتطبيق الانتقالات ({settings.globalTransition}) والمؤثرات البصرية وتجميع الفيديو.
          </p>
        </div>
      )}

      {/* SECTION: RENDERED RESULT PREVIEW & ACTIONS */}
      {renderedResult && !isProcessing && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-950 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم إنجاز المونتاج بالانتقالات والمؤثرات بنجاح!</span>
              </div>
              <h2 className="text-xl font-black text-white">معاينة وتصدير الفيديو النهائي</h2>
              <p className="text-xs text-slate-400">
                الملف: <span className="font-mono text-slate-200">{renderedResult.filename}</span> (المدة: {renderedResult.duration}s)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={renderedResult.downloadUrl}
                download={renderedResult.filename}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-blue-950/80 transition shadow-md"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>تحميل MP4 مباشرة</span>
              </a>

              <button
                onClick={() =>
                  onSendToCaptionStudio(
                    renderedResult.videoUrl,
                    renderedResult.projectId,
                    renderedResult.metadata
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>إرسال إلى استوديو الكابشن (توليد النصوص والترجمة بالذكاء الاصطناعي)</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>

          {/* Video Player */}
          <div className="max-w-md mx-auto aspect-[9/16] max-h-[500px] bg-black rounded-3xl overflow-hidden border border-blue-950 shadow-2xl relative">
            <video
              src={renderedResult.videoUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* SECTION: STORYBOARD & PAIRED TIMELINE LIST */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>مخطط المشاهد والتسلسل الزمني للمونتاج (Storyboard Timeline)</span>
            </h3>
            <p className="text-xs text-slate-400">
              يمكنك تخصيص الانتقال، الحركة (Ken Burns)، والمؤثر الصوتي لكل لقطة بشكل مستقل.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pairs.length} مقاطع مسجلة
          </span>
        </div>

        {pairs.length === 0 ? (
          <div className="bg-slate-900/40 border border-blue-950 rounded-3xl p-12 text-center text-slate-500 space-y-2">
            <Film className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-medium">لم يتم رفع أي ملفات بعد.</p>
            <p className="text-xs text-slate-500">
              ارفع صوراً وأصواتاً مثل <code className="font-mono text-slate-400">1.png</code> و <code className="font-mono text-slate-400">1.mp3</code> للبدء.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pairs.map((pair, idx) => (
              <div
                key={pair.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  pair.isPaired
                    ? 'bg-[#090D16] border-blue-950 hover:border-blue-500/50 shadow-lg'
                    : 'bg-red-950/20 border-red-800/50'
                }`}
              >
                {/* Card Header: Index & Controls */}
                <div className="flex items-center justify-between border-b border-blue-950/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-blue-400 text-xs font-mono font-bold flex items-center justify-center border border-blue-950/80">
                      #{pair.index}
                    </span>
                    <span className="text-xs font-bold text-white">المقطع #{pair.index}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Up/Down */}
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMovePair(idx, 'up')}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition"
                      title="تحريك لأعلى"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === pairs.length - 1}
                      onClick={() => handleMovePair(idx, 'down')}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition"
                      title="تحريك لأسفل"
                    >
                      ▼
                    </button>

                    <button
                      onClick={() => handleRemovePair(pair.index)}
                      className="p-1 text-slate-500 hover:text-red-400 transition ml-1"
                      title="حذف هذا المقطع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Image & Audio Details */}
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 rounded-2xl bg-slate-950 border border-blue-950 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {pair.imageUrl ? (
                      <img
                        src={pair.imageUrl}
                        alt={pair.imageName}
                        style={{ filter: getFilterCss(pair.filter || settings.globalFilter) }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-red-400">
                        <FileImage className="w-6 h-6 mx-auto opacity-50" />
                        <span className="text-[9px] block mt-1">بدون صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Audio & Info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="space-y-0.5 text-xs">
                      <div className="font-semibold text-slate-200 truncate" title={pair.imageName || 'بدون صورة'}>
                        🖼️ {pair.imageName || <span className="text-red-400">الصورة مفقودة ({pair.index}.png)</span>}
                      </div>
                      <div className="font-semibold text-slate-200 truncate" title={pair.audioName || 'بدون صوت'}>
                        🎵 {pair.audioName || <span className="text-red-400">الصوت مفقود ({pair.index}.mp3)</span>}
                      </div>
                    </div>

                    {/* Duration & Playback */}
                    {pair.audioUrl && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAudioPlayPause(pair.id, pair.audioUrl!)}
                          className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs flex items-center gap-1.5 transition"
                        >
                          {playingAudioId === pair.id ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          <span className="text-[11px] font-mono">{pair.duration}s</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

            {/* Motion & Filter Selectors in Storyboard Card */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-950/80">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Move className="w-3 h-3 text-amber-400" />
                      <span>حركة الصورة:</span>
                    </label>
                    <select
                      value={pair.motion || settings.globalMotion}
                      onChange={(e) => {
                        const val = e.target.value as MotionEffect;
                        const updated = pairs.map((p) => (p.index === pair.index ? { ...p, motion: val } : p));
                        setPairs(updated);
                      }}
                      className="w-full bg-slate-950 border border-blue-950 text-slate-300 text-[11px] rounded-xl p-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="zoom_in">🔍 Zoom In (تكبير)</option>
                      <option value="zoom_out">🔎 Zoom Out (تصغير)</option>
                      <option value="pan_left">⬅️ Pan Left (تحريك يسار)</option>
                      <option value="pan_right">➡️ Pan Right (تحريك يمين)</option>
                      <option value="pan_up">⬆️ Pan Up (تحريك للأعلى)</option>
                      <option value="pan_down">⬇️ Pan Down (تحريك للأسفل)</option>
                      <option value="subtle_motion">💓 حركة سينمائية هادئة</option>
                      <option value="auto_cycle">🔄 حركة دورية ذكية</option>
                      <option value="none">⏹️ ثابت (Static)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-purple-400" />
                      <span>فلتر الألوان:</span>
                    </label>
                    <select
                      value={pair.filter || settings.globalFilter}
                      onChange={(e) => {
                        const val = e.target.value as VisualFilter;
                        const updated = pairs.map((p) => (p.index === pair.index ? { ...p, filter: val } : p));
                        setPairs(updated);
                      }}
                      className="w-full bg-slate-950 border border-blue-950 text-slate-300 text-[11px] rounded-xl p-1.5 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="warm_spiritual">دفء إسلامي ذهبي</option>
                      <option value="cinematic_dark">سينمائي درامي</option>
                      <option value="vintage_quran">عتيق تراثي (سيبيا)</option>
                      <option value="vivid_gold">إشراق وحيوية</option>
                      <option value="black_white">أبيض وأسود فاخر</option>
                      <option value="soft_glow">توهج ناعم حالم</option>
                      <option value="cool_night">أجواء ليلية باردة</option>
                      <option value="sharpen">زيادة حدة التفاصيل (Sharpen)</option>
                      <option value="blur">تغبيش ناعم (Blur)</option>
                      <option value="none">طبيعي (بدون فلتر)</option>
                    </select>
                  </div>
                </div>

                {/* Per-Clip Transition & SFX Selectors */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-950/80">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>الانتقال:</span>
                    </label>
                    <select
                      value={pair.transition || settings.globalTransition}
                      onChange={(e) => {
                        const val = e.target.value as TransitionType;
                        const updated = pairs.map((p) => (p.index === pair.index ? { ...p, transition: val } : p));
                        setPairs(updated);
                      }}
                      className="w-full bg-slate-950 border border-blue-950 text-slate-300 text-[11px] rounded-xl p-1.5 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="fade">تلاشي ناعم (Fade)</option>
                      <option value="crossfade">تداخل (Crossfade)</option>
                      <option value="wipeleft">مسح لليسار (Wipe)</option>
                      <option value="slideleft">انزلاق (Slide)</option>
                      <option value="zoomIn">زوم (Zoom In)</option>
                      <option value="flash">فلاش أبيض (Flash)</option>
                      <option value="blur">تلاشي بتغبيش (Blur)</option>
                      <option value="circleopen">دائري (Iris)</option>
                      <option value="none">قص مباشر (Cut)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-sky-400" />
                      <span>مؤثر SFX:</span>
                    </label>
                    <select
                      value={pair.sfxTrigger || settings.sfxType}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = pairs.map((p) => (p.index === pair.index ? { ...p, sfxTrigger: val } : p));
                        setPairs(updated);
                      }}
                      className="w-full bg-slate-950 border border-blue-950 text-slate-300 text-[11px] rounded-xl p-1.5 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="whoosh">ووش سينمائي</option>
                      <option value="whoosh_deep">ووش عميق</option>
                      <option value="impact">ضربة باس سينمائية</option>
                      <option value="riser">تصاعد تشويقي</option>
                      <option value="page_turn">تقليب صفحة مصحف</option>
                      <option value="crystal_chime">رنين بلوري روحاني</option>
                      <option value="camera_click">التقاط كاميرا</option>
                      <option value="heartbeat">نبضات قلب</option>
                      <option value="rain_nature">رذاذ مطر ونسيم</option>
                      <option value="none">بدون صوت انتقال</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Range Footer */}
                <div className="bg-slate-950/70 p-2 rounded-xl text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>التوقيت في الفيديو:</span>
                  <span className="text-blue-400 font-bold">
                    {pair.startTime.toFixed(1)}s → {pair.endTime.toFixed(1)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
