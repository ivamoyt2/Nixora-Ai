import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Layers,
  Flame,
  X,
  AudioWaveform,
} from 'lucide-react';
import { NexoraLogo } from './NexoraLogo';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterSite: () => void;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  isOpen,
  onClose,
  onEnterSite,
}) => {
  const [activeScene, setActiveScene] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(0);

  const scenes = [
    {
      num: '01',
      title: 'ربط وتجميع الوسائط بالذكاء الاصطناعي',
      desc: 'المستخدم يرفع لقطاته المبعثرة، ومحرك Nexora AI يربطها تلقائياً بالليزر الذكي',
      badge: '01 / 3D Neural Media Mesh',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
    {
      num: '02',
      title: 'المزامنة الصوتية وتفريغ الكابشن',
      desc: 'تحليل نبرة الصوت والموجات والكابشن المتزامن على إيقاع الكلام بدقة 99%',
      badge: '02 / Waveform & Auto Subtitles',
      icon: <AudioWaveform className="w-4 h-4 text-cyan-400" />,
    },
    {
      num: '03',
      title: 'استوديو المونتاج المكتمل وتصدير 4K',
      desc: 'محرر فيديو احترافي متكامل مع مسارات متزامنة وتصدير فوري للمنصات',
      badge: '03 / Complete AI Editing Suite',
      icon: <Flame className="w-4 h-4 text-sky-300" />,
    },
  ];

  // Auto progression across 9 seconds
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveScene(0);
          return 0;
        }
        const next = prev + 1.1;
        if (next < 35) setActiveScene(0);
        else if (next < 70) setActiveScene(1);
        else setActiveScene(2);

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  // Caption Word animation
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % 6);
    }, 550);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const captionWords = [
    { text: 'الذكاء' },
    { text: 'الاصطناعي' },
    { text: 'يصنع' },
    { text: 'المونتاج' },
    { text: 'السينمائي' },
    { text: 'بلحظات' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#090D16] border border-blue-500/40 shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-blue-950 bg-black/50">
          <div className="flex items-center gap-3">
            <NexoraLogo size="sm" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>فيديو المنصة</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
                  {scenes[activeScene].badge}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                شاهد كيف تعمل محركات الذكاء الاصطناعي في إنتاج فيديوهات 4K متكاملة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative aspect-[16/9] bg-black border-y border-blue-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
          {/* Subtle Circuit Matrix */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-black to-black pointer-events-none" />
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#1e3a8a25_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a25_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          {/* ========================================================================= */}
          {/* SCENE 0: 3D FLOATING MEDIA TILES (00:00 - 00:03)                          */}
          {/* ========================================================================= */}
          {activeScene === 0 && (
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-3 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>المرحلة 1: تجميع الصور والمقاطع وربطها بالشبكة العصبية</span>
              </div>

              {/* 3D Floating Media Canvas */}
              <div className="relative w-full max-w-xl h-44 sm:h-52 flex items-center justify-center">
                {/* Central Scanner */}
                <div className="absolute z-20 w-12 h-12 rounded-full bg-blue-600/30 border border-cyan-400 flex items-center justify-center shadow-[0_0_30px_#38bdf8]">
                  <div className="w-4 h-4 rounded-full bg-cyan-300 animate-ping" />
                </div>

                {/* Laser Beams */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <line
                    x1="18%"
                    y1="25%"
                    x2="50%"
                    y2="50%"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  <line
                    x1="82%"
                    y1="25%"
                    x2="50%"
                    y2="50%"
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  <line
                    x1="25%"
                    y1="78%"
                    x2="50%"
                    y2="50%"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  <line
                    x1="75%"
                    y1="78%"
                    x2="50%"
                    y2="50%"
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  <line
                    x1="50%"
                    y1="18%"
                    x2="50%"
                    y2="50%"
                    stroke="#60A5FA"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>

                {/* Floating Cards */}
                {[
                  {
                    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
                    title: 'طبيعة وجبال',
                    pos: 'top-2 left-4 sm:left-12 rotate-[-5deg]',
                    dur: '0:06',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=400&auto=format&fit=crop&q=80',
                    title: 'مدينة وناطحات سحاب',
                    pos: 'top-1 right-4 sm:right-12 rotate-[4deg]',
                    dur: '0:12',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&auto=format&fit=crop&q=80',
                    title: 'طريق سريع B-Roll',
                    pos: 'bottom-2 left-6 sm:left-16 rotate-[-2deg]',
                    dur: '0:08',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
                    title: 'قهوة الصباح',
                    pos: 'bottom-3 right-6 sm:right-16 rotate-[5deg]',
                    dur: '0:05',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
                    title: 'شاطئ وبحر',
                    pos: 'top-2 left-1/2 -translate-x-1/2 rotate-[1deg]',
                    dur: '0:15',
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`absolute ${card.pos} p-1 rounded-xl bg-slate-900 border border-blue-500/50 shadow-2xl backdrop-blur-md transition-transform duration-500 z-10`}
                    style={{
                      transform: `translateY(${Math.sin(idx * 1.5 + progress * 0.2) * 5}px)`,
                    }}
                  >
                    <div className="w-20 sm:w-28 h-12 sm:h-16 rounded-lg overflow-hidden relative border border-blue-900/50">
                      <img
                        src={card.img}
                        alt={card.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                        <span className="text-[8px] sm:text-[9px] font-bold text-white truncate">
                          {card.title}
                        </span>
                      </div>
                      <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[7px] text-blue-300 font-mono">
                        {card.dur}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-blue-300 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>الربط العصبي التلقائي بين اللقطات والصور المرفوعة</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCENE 1: WAVEFORM & SUBTITLES (00:04 - 00:06)                              */}
          {/* ========================================================================= */}
          {activeScene === 1 && (
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-3 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold font-mono shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                <AudioWaveform className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Automatic beat and subtitle matching has arrived</span>
              </div>

              {/* Glowing Sound Wave */}
              <div className="w-full max-w-xl h-20 sm:h-24 bg-black/90 border border-blue-500/40 rounded-2xl p-3 flex items-center justify-between gap-1 shadow-[0_0_25px_rgba(37,99,235,0.25)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-pulse pointer-events-none" />

                {Array.from({ length: 42 }).map((_, i) => {
                  const height = Math.max(12, Math.sin(i * 0.45 + progress * 0.4) * 75 + 20);
                  return (
                    <div
                      key={i}
                      className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-blue-600 via-cyan-400 to-white transition-all duration-100"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              {/* Subtitles Bar */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {captionWords.map((w, idx) => (
                  <span
                    key={idx}
                    className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg transition-all duration-200 ${
                      idx === activeWordIdx
                        ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50'
                        : 'bg-black text-slate-300 border border-slate-800'
                    }`}
                  >
                    {w.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCENE 2: COMPLETE STUDIO (00:07 - 00:09)                                  */}
          {/* ========================================================================= */}
          {activeScene === 2 && (
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-3 animate-fadeIn">
              <div className="w-full max-w-2xl bg-black border border-blue-500/50 rounded-2xl p-2.5 sm:p-3.5 space-y-2.5 shadow-[0_0_35px_rgba(37,99,235,0.35)]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-white font-bold">Nexora AI Studio Pro // 4K Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                    تصدير 4K جاهز
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="hidden sm:flex col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-2 flex-col justify-between text-[9px] font-mono">
                    <span className="text-slate-400 font-bold border-b border-slate-900 pb-1">
                      مكتبة المشاهد (AI)
                    </span>
                    <div className="space-y-1">
                      <div className="p-1 rounded bg-blue-950/60 text-blue-300 truncate">
                        ✓ Clip_Office_01
                      </div>
                      <div className="p-1 rounded bg-slate-900 text-slate-400 truncate">
                        ✓ Clip_Skyline_02
                      </div>
                    </div>
                    <span className="text-blue-400 text-[8px]">Auto Synchronized</span>
                  </div>

                  <div className="col-span-12 sm:col-span-6 relative aspect-video rounded-xl overflow-hidden border border-blue-500/40">
                    <img
                      src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80"
                      alt="Final Scene"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-2">
                      <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold text-white self-start">
                        PREVIEW 4K
                      </span>
                      <div className="text-center">
                        <span className="bg-black/90 text-white font-black text-xs px-2.5 py-1 rounded-lg border border-blue-400/60 shadow-lg inline-block">
                          الذكاء الاصطناعي يصنع المستقبل
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-2 flex-col justify-between text-[9px] font-mono">
                    <span className="text-slate-400 font-bold border-b border-slate-900 pb-1">
                      Master Gain & EQ
                    </span>
                    <div className="h-8 bg-black rounded p-1 flex items-end gap-0.5">
                      {[40, 65, 85, 95, 70, 60, 80, 50].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-cyan-400 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-blue-300 font-bold text-[8px]">60 FPS • 4K UHD</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[9px]">
                  <div className="h-5 bg-slate-950 rounded flex gap-1 p-0.5 overflow-hidden border border-slate-800">
                    <div className="w-1/3 bg-blue-600 rounded flex items-center px-1 text-white font-bold">
                      Video_Master
                    </div>
                    <div className="w-1/3 bg-cyan-600 rounded flex items-center px-1 text-white font-bold">
                      Office_Coffee
                    </div>
                    <div className="flex-1 bg-blue-700 rounded flex items-center px-1 text-white font-bold">
                      City_Skyline
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-blue-300 font-bold">
                فيديو نهائي عالي الجودة متوافق مع خوارزميات TikTok, Reels و Shorts
              </p>
            </div>
          )}

          {/* Timeline bar */}
          <div className="relative z-10 pt-3 flex flex-col gap-2">
            <div className="w-full bg-slate-950 rounded-full h-2 p-0.5 border border-slate-900 relative overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_8px_#3b82f6] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>00:0{Math.floor((progress / 100) * 9)} / 00:09</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-blue-400 transition cursor-pointer flex items-center gap-1"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgress(0);
                    setActiveScene(0);
                    setIsPlaying(true);
                  }}
                  className="hover:text-blue-400 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة العرض</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Cards */}
        <div className="p-4 sm:p-5 grid grid-cols-3 gap-2 bg-black/60">
          {scenes.map((stg, index) => {
            const isActive = activeScene === index;
            return (
              <button
                key={stg.num}
                type="button"
                onClick={() => {
                  setActiveScene(index);
                  setProgress(index * 33 + 5);
                }}
                className={`p-2.5 sm:p-3 rounded-2xl text-right transition cursor-pointer flex flex-col justify-between gap-1 border ${
                  isActive
                    ? 'bg-slate-900 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-black border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">{stg.num}</span>
                  <div>{stg.icon}</div>
                </div>
                <div className="text-xs font-bold leading-tight truncate">{stg.title}</div>
              </button>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-blue-950 bg-black/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-300 font-medium text-center sm:text-right">
            {scenes[activeScene].desc}
          </p>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEnterSite();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-105 active:scale-95"
          >
            <span>ابدأ تجربة المنصة مجاناً</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
