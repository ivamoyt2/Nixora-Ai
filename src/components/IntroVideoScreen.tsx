import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Film,
  Zap,
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Scissors,
  Flame,
  AudioWaveform,
  Maximize2,
} from 'lucide-react';
import { NexoraLogo } from './NexoraLogo';

interface IntroVideoScreenProps {
  onComplete: () => void;
}

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [currentScene, setCurrentScene] = useState<number>(0); // 0: 3D Media Mesh, 1: Waveform & Subtitles, 2: Complete Studio
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [wordIdx, setWordIdx] = useState<number>(0);

  // Sound Synth Generator for futuristic sci-fi pulses
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthPulse = (type: 'beep' | 'laser' | 'whoosh') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'whoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext not allowed before user gesture
    }
  };

  // Run 9-second progressive animation sequence matching the uploaded video
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.1; // ~9 seconds total
        if (next >= 100) {
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }

        // Scene triggers (0-33%: Scene 0, 33-66%: Scene 1, 66-100%: Scene 2)
        if (next < 35) {
          if (currentScene !== 0) setCurrentScene(0);
        } else if (next < 70) {
          if (currentScene !== 1) {
            setCurrentScene(1);
            playSynthPulse('laser');
          }
        } else {
          if (currentScene !== 2) {
            setCurrentScene(2);
            playSynthPulse('whoosh');
          }
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentScene, isMuted, onComplete]);

  // Word animation ticker
  useEffect(() => {
    const wInterval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % 5);
    }, 600);
    return () => clearInterval(wInterval);
  }, []);

  const subtitleWords = ['الذكاء', 'الاصطناعي', 'يصنع', 'المونتاج', 'تلقائياً'];

  const scenes = [
    {
      badge: '01 / 3D NEURAL MEDIA MESH',
      title: 'ربط وتجميع وسائطك الخام بالذكاء الاصطناعي',
      desc: 'المستخدم يرفع الصور والفيديوهات والتسجيلات المبعثرة، والنظام يربطها عصبياً بدون ترتيب مسبق',
    },
    {
      badge: '02 / AUDIO WAVEFORM & SUBTITLES',
      title: 'المزامنة الصوتية التلقائية وتفريغ الكابشن',
      desc: 'تحليل الإيقاع والترددات الصوتية وتوليد نصوص عربية متزامنة بالكلمة بدقة 99%',
    },
    {
      badge: '03 / COMPLETE 4K AI STUDIO',
      title: 'استوديو المونتاج المكتمل والتصدير النهائي',
      desc: 'فيديو احترافي مكتمل المشاهد، المؤثرات، الكابشن، وجودة 4K فائقة السرعة',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden animate-fadeIn">
      {/* Background Matrix & Tech Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-black to-black pointer-events-none" />

      {/* Electric Blue ambient background glow circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Futuristic PCB Circuit Lines Overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* TOP BAR */}
      <header className="w-full max-w-5xl flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <NexoraLogo size="md" />
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
            فيديو المنصة // Platform Video
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 transition cursor-pointer"
            title={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Primary Skip / Enter Button */}
          <button
            id="btn-skip-intro"
            type="button"
            onClick={onComplete}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-600/30 border border-blue-400/40 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>دخول المنصة</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CINEMATIC STAGE (MATCHING THE UPLOADED VIDEO) */}
      <main className="w-full max-w-4xl relative z-20 my-auto flex flex-col items-center justify-center">
        <div className="w-full aspect-[16/9] max-h-[65vh] rounded-3xl bg-slate-950/90 border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.25)] overflow-hidden relative flex flex-col justify-between p-4 sm:p-6 backdrop-blur-2xl">
          {/* Subtle Video Watermark */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-[11px] font-mono text-blue-400/80 bg-black/60 px-3 py-1 rounded-full border border-blue-900/50">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            NEXORA AI // NEURAL PIPELINE 4.0
          </div>

          <div className="absolute top-4 right-4 z-20 text-[11px] font-mono text-slate-400 bg-black/60 px-3 py-1 rounded-full border border-slate-800">
            {scenes[currentScene].badge}
          </div>

          {/* ========================================================================= */}
          {/* SCENE 0: FLOATING 3D MEDIA TILES ON TECH CHIP (00:00 - 00:03)               */}
          {/* ========================================================================= */}
          {currentScene === 0 && (
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                  Phase 1: Raw Media Ingestion & Neural Tracing
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  المستخدم يرفع وسائطه المبعثرة دون ترتيب مسبق
                </h3>
              </div>

              {/* 3D Isometric Floating Media Canvas */}
              <div className="relative w-full max-w-xl h-44 sm:h-52 flex items-center justify-center">
                {/* Central AI Scanner */}
                <div className="absolute z-20 w-12 h-12 rounded-full bg-blue-600/30 border border-cyan-400 flex items-center justify-center shadow-[0_0_30px_#38bdf8]">
                  <div className="w-4 h-4 rounded-full bg-cyan-300 animate-ping" />
                </div>

                {/* SVG Laser Beams */}
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

                {/* Realistic Floating Cards */}
                {[
                  {
                    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
                    title: 'جبال وطبيعة',
                    pos: 'top-2 left-6 sm:left-14 rotate-[-6deg]',
                    dur: '0:06',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=400&auto=format&fit=crop&q=80',
                    title: 'مدينة وناطحات سحاب',
                    pos: 'top-2 right-6 sm:right-14 rotate-[5deg]',
                    dur: '0:12',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&auto=format&fit=crop&q=80',
                    title: 'طريق سريع',
                    pos: 'bottom-2 left-8 sm:left-16 rotate-[-3deg]',
                    dur: '0:08',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
                    title: 'فنجان قهوة الصباح',
                    pos: 'bottom-2 right-8 sm:right-16 rotate-[4deg]',
                    dur: '0:05',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
                    title: 'شاطئ وبحر',
                    pos: 'top-1 left-1/2 -translate-x-1/2 rotate-[1deg]',
                    dur: '0:14',
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`absolute ${card.pos} p-1 sm:p-1.5 rounded-xl bg-slate-900 border border-blue-500/50 shadow-2xl backdrop-blur-md transition-transform duration-500 z-10`}
                    style={{
                      transform: `translateY(${Math.sin(idx * 1.4 + progress * 0.2) * 5}px)`,
                    }}
                  >
                    <div className="w-20 sm:w-28 h-12 sm:h-16 rounded-lg overflow-hidden relative border border-blue-900/60">
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
                <span>الذكاء الاصطناعي يحلل اللقطات ويربطها تلقائياً على المسار الزمني</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCENE 1: AUDIO WAVEFORM & AUTOMATIC SUBTITLE MATCHING (00:04 - 00:06)       */}
          {/* ========================================================================= */}
          {currentScene === 1 && (
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
              {/* Top Subtitle Match Banner */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold font-mono shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                <AudioWaveform className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Automatic beat and subtitle matching has arrived</span>
              </div>

              {/* Glowing Sound Wave Visualizer */}
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

              {/* Timeline Sequence Preview */}
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

              {/* Subtitle Highlight Badge */}
              <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-500/40 px-4 py-2 rounded-xl">
                {subtitleWords.map((w, idx) => (
                  <span
                    key={idx}
                    className={`text-sm sm:text-base font-black px-2 py-0.5 rounded-lg transition-all duration-200 ${
                      idx === wordIdx
                        ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50'
                        : 'text-slate-300'
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCENE 2: COMPLETE PROFESSIONAL AI EDITING STUDIO (00:07 - 00:09)           */}
          {/* ========================================================================= */}
          {currentScene === 2 && (
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

          {/* BOTTOM TIMELINE CONTROLS */}
          <div className="relative z-20 pt-3 sm:pt-4 flex flex-col gap-2">
            {/* Timeline scrubber bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 p-0.5 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_10px_#3b82f6] transition-all duration-100"
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
                    setCurrentScene(0);
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
      </main>

      {/* FOOTER CALL TO ACTION */}
      <footer className="w-full max-w-4xl text-center space-y-3 relative z-20">
        <p className="text-xs sm:text-sm text-slate-300 font-medium">
          {scenes[currentScene].desc}
        </p>

        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            onClick={onComplete}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-blue-600/30 border border-blue-400/40 transition transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>ابدأ تجربة Nexora AI الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
