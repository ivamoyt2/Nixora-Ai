import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Play,
  Pause,
  Layers,
  Cpu,
  Scissors,
  Flame,
  CheckCircle2,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  AudioWaveform,
} from 'lucide-react';

interface HeroVideoPlayerProps {
  onStartNow?: () => void;
  onOpenIntroModal?: () => void;
}

export const HeroVideoPlayer: React.FC<HeroVideoPlayerProps> = ({
  onStartNow,
  onOpenIntroModal,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeScene, setActiveScene] = useState<number>(0); // 0: 3D Media Mesh, 1: Waveform & Subtitles, 2: Complete Studio
  const [progress, setProgress] = useState<number>(0);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(0);

  const scenes = [
    {
      id: 'mesh',
      title: 'ربط الوسائط بالذكاء الاصطناعي',
      subtitle: 'تجميع وتوصيل الصور والمشاهد الخام',
      badge: '01 / 3D Neural Media Mesh',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      id: 'waveform',
      title: 'المزامنة الصوتية وتفريغ الكابشن',
      subtitle: 'تحليل نبرة الصوت والموجات والكابشن التلقائي',
      badge: '02 / Waveform & Auto Subtitles',
      icon: <AudioWaveform className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      id: 'studio',
      title: 'استوديو المونتاج المكتمل والتصدير',
      subtitle: 'محرر فيديو متكامل مع مسارات وجاهزية 4K',
      badge: '03 / Complete AI Editing Suite',
      icon: <Flame className="w-3.5 h-3.5 text-sky-300" />,
    },
  ];

  // 9-Second Timeline playback loop (0-33%: Scene 1, 33-66%: Scene 2, 66-100%: Scene 3)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveScene(0);
          return 0;
        }
        const next = prev + 1.1; // ~9s duration
        if (next < 35) setActiveScene(0);
        else if (next < 70) setActiveScene(1);
        else setActiveScene(2);

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Caption Word Switcher in scene 2
  useEffect(() => {
    if (!isPlaying) return;
    const wordInterval = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % 6);
    }, 550);
    return () => clearInterval(wordInterval);
  }, [isPlaying]);

  const captionWords = [
    { text: 'الذكاء' },
    { text: 'الاصطناعي' },
    { text: 'يصنع' },
    { text: 'المونتاج' },
    { text: 'السينمائي' },
    { text: 'بلحظات' },
  ];

  return (
    <div className="relative rounded-3xl bg-[#090D16] border border-blue-950/90 p-3 sm:p-5 shadow-[0_0_50px_rgba(37,99,235,0.2)] overflow-hidden backdrop-blur-xl group hover:border-blue-500/50 transition duration-500">
      {/* Top Video Player Bar with "فيديو المنصة" */}
      <div className="flex items-center justify-between pb-3.5 border-b border-blue-950 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-300 mr-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-bold text-white">فيديو المنصة:</span>
            <span className="text-slate-400 font-mono">Nexora_AI_Platform_Workflow.mp4</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold">
            {scenes[activeScene].badge}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-black text-slate-400 text-[10px] font-mono border border-slate-800">
            4K UHD • 60 FPS
          </span>
          {onOpenIntroModal && (
            <button
              type="button"
              onClick={onOpenIntroModal}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="تكبير فيديو المنصة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-black border border-blue-900/50 overflow-hidden flex flex-col justify-between p-3 sm:p-6 select-none shadow-inner">
        {/* Futuristic PCB Circuit Matrix Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#1e3a8a25_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a25_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ========================================================================= */}
        {/* SCENE 1: FLOATING 3D MEDIA TILES CONNECTED WITH LASER BEAMS (00:00 - 00:03) */}
        {/* ========================================================================= */}
        {activeScene === 0 && (
          <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-3 animate-fadeIn">
            {/* Top Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>المرحلة 1: تجميع الصور والفيديوهات وربطها بالشبكة العصبية</span>
            </div>

            {/* 3D Isometric Floating Media Canvas */}
            <div className="relative w-full max-w-xl h-44 sm:h-52 flex items-center justify-center perspective-[1000px]">
              {/* Central Glowing AI Scanner Node */}
              <div className="absolute z-20 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/80 flex items-center justify-center shadow-[0_0_25px_#3b82f6]">
                <div className="w-3 h-3 rounded-full bg-cyan-300 animate-ping" />
              </div>

              {/* Neural Connection Particle Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1="18%"
                  y1="30%"
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
                  x1="30%"
                  y1="75%"
                  x2="50%"
                  y2="50%"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <line
                  x1="70%"
                  y1="75%"
                  x2="50%"
                  y2="50%"
                  stroke="#818CF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <line
                  x1="50%"
                  y1="20%"
                  x2="50%"
                  y2="50%"
                  stroke="#60A5FA"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Floating Cards with exact matching thumbnails */}
              {[
                {
                  img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
                  title: 'جبال وطبيعة',
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
                  title: 'فنجان قهوة الصباح',
                  pos: 'bottom-3 right-6 sm:right-16 rotate-[5deg]',
                  dur: '0:05',
                },
                {
                  img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
                  title: 'شاطئ وخليج ساحلي',
                  pos: 'top-2 left-1/2 -translate-x-1/2 rotate-[1deg]',
                  dur: '0:15',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className={`absolute ${card.pos} p-1 sm:p-1.5 rounded-xl bg-slate-900/90 border border-blue-500/50 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:scale-110 z-10`}
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

            <p className="text-xs text-slate-400 font-medium">
              الخوارزمية تحلل المشاهد وتربطها تلقائياً بالمسارات المناسبة دون أي ترتيب يدوي
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 2: MULTI-TRACK WAVEFORM & AUTOMATIC SUBTITLE MATCHING (00:04 - 00:06) */}
        {/* ========================================================================= */}
        {activeScene === 1 && (
          <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
            {/* Top Subtitle Match Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold font-mono shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <AudioWaveform className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Automatic beat and subtitle matching has arrived</span>
            </div>

            {/* Glowing High-Frequency Sound Wave Visualizer */}
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

            {/* Timeline Multi-track Preview */}
            <div className="w-full max-w-xl bg-slate-950 border border-blue-900/60 rounded-xl p-2.5 space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-900">
                <span className="text-blue-400 font-bold">AI Sequence [00:04:00]</span>
                <span className="text-slate-500">00:00:07:00 • 00:00:13:00 • 00:00:17:00</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1/4 h-5 bg-blue-600/80 rounded flex items-center px-1.5 text-white font-bold truncate">
                  Mountain_Broll
                </div>
                <div className="w-1/4 h-5 bg-sky-600/80 rounded flex items-center px-1.5 text-white font-bold truncate">
                  Skyline_City
                </div>
                <div className="w-1/4 h-5 bg-blue-700/80 rounded flex items-center px-1.5 text-white font-bold truncate">
                  Coffee_Desk
                </div>
                <div className="flex-1 h-5 bg-cyan-600/80 rounded flex items-center px-1.5 text-white font-bold truncate">
                  Highway_Pan
                </div>
              </div>
            </div>

            {/* Dynamic Arabic Captions Bar */}
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
        {/* SCENE 3: COMPLETE PROFESSIONAL AI EDITING STUDIO (00:07 - 00:09)           */}
        {/* ========================================================================= */}
        {activeScene === 2 && (
          <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-3 animate-fadeIn">
            {/* Complete Video Studio UI Layout */}
            <div className="w-full max-w-2xl bg-black border border-blue-500/50 rounded-2xl p-2.5 sm:p-3.5 space-y-2.5 shadow-[0_0_35px_rgba(37,99,235,0.35)]">
              {/* Studio Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-white font-bold">Nexora AI Studio Pro // 4K Active</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                  تصدير 4K جاهز
                </span>
              </div>

              {/* Central Monitor & Side Controls */}
              <div className="grid grid-cols-12 gap-2">
                {/* Left Mini Media Bin */}
                <div className="hidden sm:flex col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-2 flex-col justify-between text-[9px] font-mono space-y-1">
                  <span className="text-slate-400 font-bold border-b border-slate-900 pb-1">
                    مكتبة المشاهد (AI)
                  </span>
                  <div className="space-y-1">
                    <div className="p-1 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 truncate">
                      ✓ Clip_Office_01
                    </div>
                    <div className="p-1 rounded bg-slate-900 text-slate-400 truncate">
                      ✓ Clip_Skyline_02
                    </div>
                    <div className="p-1 rounded bg-slate-900 text-slate-400 truncate">
                      ✓ SFX_Whoosh_Pro
                    </div>
                  </div>
                  <span className="text-blue-400 text-[8px]">Auto Synchronized</span>
                </div>

                {/* Center Video Viewport (Office Businessman Scene) */}
                <div className="col-span-12 sm:col-span-6 relative aspect-video rounded-xl overflow-hidden border border-blue-500/40 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80"
                    alt="Final Scene"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-white/90">
                      <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                        PREVIEW 4K
                      </span>
                      <span>00:00:08:24</span>
                    </div>

                    {/* Arabic Burned-in Caption Overlay */}
                    <div className="text-center">
                      <span className="bg-black/90 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-lg border border-blue-400/60 shadow-lg inline-block">
                        الذكاء الاصطناعي يصنع المستقبل
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Audio EQ / Master Gain Inspector */}
                <div className="hidden sm:flex col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-2 flex-col justify-between text-[9px] font-mono space-y-1">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold border-b border-slate-900 pb-1 block">
                      Master Gain & EQ
                    </span>
                    <div className="h-10 bg-black rounded p-1 flex items-end gap-0.5">
                      {[40, 65, 85, 95, 70, 60, 80, 50].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-cyan-400 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-0.5 text-[8px] text-slate-400">
                    <div className="flex justify-between">
                      <span>FPS:</span>
                      <span className="text-blue-300 font-bold">60.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Codec:</span>
                      <span className="text-blue-300 font-bold">H.264 / AAC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Multi-track Editor Bar */}
              <div className="space-y-1 font-mono text-[9px]">
                <div className="h-5 bg-slate-950 rounded flex gap-1 p-0.5 overflow-hidden border border-slate-800">
                  <div className="w-1/4 bg-blue-600 rounded flex items-center px-1 text-white font-bold">
                    Video_Master
                  </div>
                  <div className="w-1/3 bg-cyan-600 rounded flex items-center px-1 text-white font-bold">
                    Office_Coffee
                  </div>
                  <div className="flex-1 bg-blue-700 rounded flex items-center px-1 text-white font-bold">
                    City_Skyline
                  </div>
                </div>
                <div className="h-4 bg-slate-950 rounded p-0.5 border border-slate-800">
                  <div className="w-full h-full bg-indigo-600/80 rounded flex items-center px-1.5 text-indigo-200">
                    Podcast_AI_master.wav [Enhanced Vocal]
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-blue-300 font-bold">
              فيديو نهائي عالي الجودة متوافق مع خوارزميات TikTok, Reels و Shorts
            </p>
          </div>
        )}

        {/* Bottom Playback HUD & Controls */}
        <div className="relative z-10 pt-3 sm:pt-4 flex flex-col gap-2">
          {/* Progress Timeline Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 p-0.5 border border-slate-900 relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_8px_#3b82f6] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Interactive Stepper Navigation (3 Phases Matching Video) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
            {scenes.map((stg, index) => {
              const isActive = activeScene === index;
              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => {
                    setActiveScene(index);
                    setProgress(index * 33 + 5);
                  }}
                  className={`p-2 rounded-xl text-right transition cursor-pointer flex flex-col justify-between gap-0.5 border ${
                    isActive
                      ? 'bg-slate-900 border-blue-500/70 text-white shadow-md shadow-blue-600/20'
                      : 'bg-black/70 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono font-bold">0{index + 1}</div>
                    <div>{stg.icon}</div>
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold truncate leading-tight">
                    {stg.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Play / Pause Control */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-black/80 hover:bg-slate-900 text-slate-300 hover:text-blue-400 border border-slate-800 text-xs transition cursor-pointer backdrop-blur-md z-20 shadow-lg"
          title={isPlaying ? 'إيقاف الفيديو مؤقتاً' : 'تشغيل فيديو المنصة'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
