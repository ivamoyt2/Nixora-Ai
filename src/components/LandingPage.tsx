import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Play,
  Pause,
  Wand2,
  Sliders,
  ChevronDown,
  Layers,
  Flame,
  Volume2,
  Video,
} from 'lucide-react';
import { AppPage } from '../types';
import { SocialLinks } from './SocialLinks';
import { HeroVideoPlayer } from './HeroVideoPlayer';

interface LandingPageProps {
  onStartNow: () => void;
  onOpenMode: (mode: 'montage' | 'caption') => void;
  onNavigate: (page: AppPage) => void;
  onOpenIntroModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartNow,
  onOpenMode,
  onNavigate,
  onOpenIntroModal,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const features = [
    {
      icon: <Film className="w-6 h-6 text-blue-400" />,
      title: 'مونتاج سينمائي آلي',
      description:
        'ادمج الفيديوهات والصور والتعليقات الصوتية أوتوماتيكياً مع انتقالات حركية ومؤثرات صوتية (SFX) تجذب المشاهد من اللحظة الأولى.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-sky-400" />,
      title: 'تفريغ الكابشن العربي بدقة 99%',
      description:
        'نماذج ذكاء اصطناعي متطورة تتعرف على الفصحى وجميع اللهجات العربية وتستخرج الكلمات بتوقيت دقيق بالمللي ثانية.',
    },
    {
      icon: <Flame className="w-6 h-6 text-blue-500" />,
      title: 'قوالب وحركات فيروسية',
      description:
        'أكثر من 10 قوالب كابشن جاهزة بأسلوب MrBeast و Viral Glow مع تمييز الكلمات باللون والاهتزاز وحرق النصوص على الفيديو.',
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-300" />,
      title: 'تصدير فوري بجودة 4K',
      description:
        'معالجة فائقة السرعة وإخراج الفيديو بأعلى دقة ووضوح بدون أي علامات مائية إجبارية ليكون جاهزاً للنشر المباشر.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'ارفع ملفاتك الخام',
      desc: 'اختر صورك وملف الصوت، أو ارفع فيديو خام يريد الذكاء الاصطناعي قصه وإضافة الكابشن عليه.',
    },
    {
      num: '02',
      title: 'الذكاء الاصطناعي يتولى المونتاج',
      desc: 'يقوم النظام بتحليل الصوت، قص المشاهد، تركيب الانتقالات والمؤثرات واستخراج النصوص تلقائياً.',
    },
    {
      num: '03',
      title: 'حمّل وانشر فوراً',
      desc: 'صدّر الفيديو النهائي بدقة 1080p أو 4K جاهزاً لمنصات تيك توك، ريلز، وشورتس بأقل مجهود.',
    },
  ];

  const faqs = [
    {
      q: 'ما هي منصة NEXORA AI؟',
      a: 'NEXORA AI هي منصة ذكاء اصطناعي رائدة تتيح لصناع المحتوى تحويل المواد الخام إلى فيديوهات احترافية مكتملة المونتاج مع تفريغ النصوص العربية المتزامنة بالكلمة وحرق الكابشن الفيروسي.',
    },
    {
      q: 'هل يدعم الذكاء الاصطناعي اللهجات العربية المختلفة؟',
      a: 'نعم، المنصة تدعم اللغة العربية الفصحى بالإضافة إلى اللهجات الخليجية، المصرية، الشامية، والمغربية بدقة عالية بالاعتماد على أحدث نماذج الذكاء الاصطناعي.',
    },
    {
      q: 'هل يمكنني تعديل الكلمات والألوان وحجم الخط بعد التفريغ؟',
      a: 'نعم بالتأكيد. يوفر محرر NEXORA AI إمكانية تعديل أي كلمة أو توقيتها وتغيير ألوان التمييز ونوع الخط العربي وموضع الكابشن بحرية تامة.',
    },
    {
      q: 'هل الفيديوهات المُنتجة خالية من العلامات المائية؟',
      a: 'نعم، جميع الفيديوهات التي يتم إنتاجها عبر NEXORA AI تكون ملكاً لصانع المحتوى بالكامل وبدون علامات مائية إجبارية.',
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (Black & Electric Blue Palette)          */}
      {/* ======================================================== */}
      <section className="relative pt-8 sm:pt-14 text-center space-y-8">
        {/* Ambient background electric blue glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[850px] h-[360px] bg-gradient-to-tr from-blue-600/20 via-sky-500/10 to-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1120] border border-blue-500/30 text-blue-300 text-xs font-bold shadow-lg shadow-blue-500/10 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>منصة الذكاء الاصطناعي لتحويل الفيديوهات الخام إلى محتوى جاهز</span>
        </div>

        {/* Headline */}
        <div className="max-w-4xl mx-auto space-y-4 px-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2]">
            حوّل فيديوهاتك الخام إلى محتوى احترافي <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              تلقائياً بقوة الذكاء الاصطناعي
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            ارفع ملفاتك الخام، ودع Nexora AI يتولى المونتاج، قص الحشو، تركيب الانتقالات السينمائية وتفريغ الكابشن العربي المتزامن في ثوانٍ معدودة.
          </p>
        </div>

        {/* Single Primary CTA + Watch Intro Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 px-4">
          <button
            id="hero-btn-start"
            type="button"
            onClick={onStartNow}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-base shadow-xl shadow-blue-600/30 transition duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Zap className="w-5 h-5" />
            <span>ابدأ مجاناً الآن</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>

          {onOpenIntroModal ? (
            <button
              type="button"
              onClick={onOpenIntroModal}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0B1120] hover:bg-slate-900 text-blue-300 hover:text-white font-bold text-sm border border-blue-900/60 hover:border-blue-500/50 transition flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-current text-blue-400" />
              <span>شاهد فيديو المنصة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0B1120] hover:bg-slate-900 text-slate-200 hover:text-white font-bold text-sm border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <span>شاهد كيف يعمل</span>
            </button>
          )}
        </div>

        {/* Hero Video Player (Seamless Loop Experience) */}
        <div className="pt-6 max-w-4xl mx-auto px-4">
          <HeroVideoPlayer onStartNow={onStartNow} onOpenIntroModal={onOpenIntroModal} />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CORE CAPABILITIES (4 Black & Electric Blue CARDS)     */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            كل ما تحتاجه لإنتاج محتوى فيديو سريع واحترافي
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            أدوات ذكية متطورة صُممت خصيصاً لتبسيط صناعة المحتوى واختصار ساعات المونتاج الطويلة في خطوات بسيطة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-3xl bg-[#0B1120]/90 border border-blue-950/70 hover:border-blue-500/40 transition duration-300 space-y-4 shadow-xl backdrop-blur-sm group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:border-blue-500/40 transition">
                {feat.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition">
                {feat.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS (3 LINEAR STEPS)                         */}
      {/* ======================================================== */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
            خطوات بسيطة وسريعة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            كيف يعمل Nexora AI؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            ثلاث خطوات فقط تفصلك عن تحويل أفكارك وموادك الخام إلى فيديو عالي الجودة جاهز للنشر الفوري.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-[#0B1120] border border-blue-950/80 space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition shadow-lg"
            >
              <div className="text-3xl font-black text-blue-500/20 font-mono group-hover:text-blue-400/40 transition">
                {step.num}
              </div>
              <h4 className="text-base font-bold text-white">{step.title}</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. OFFICIAL SOCIAL CHANNELS SECTION                      */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0B1120] via-slate-950 to-[#070A12] border border-blue-900/40 shadow-2xl space-y-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
              قنواتنا ومجتمعنا
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              تابع Nexora AI على منصات التواصل
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              شاهد شروحات حصرية، نصائح لصناع المحتوى، وأحدث تحديثات المنصة على قنواتنا الرسمية.
            </p>
          </div>

          <div className="relative z-10">
            <SocialLinks variant="cards" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FREQUENTLY ASKED QUESTIONS (ACCORDION)                */}
      {/* ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            الأسئلة الشائعة
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إجابات واضحة عن كل ما يخص منصة NEXORA AI وكيفية استخدامها.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#0B1120] border border-blue-950/70 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-blue-400 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-900/80 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FINAL BOTTOM CTA BANNER                                */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0B1120] to-slate-950 border border-blue-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              جاهز لتجربة أسرع مونتاج بالذكاء الاصطناعي؟
            </h2>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
              ابدأ الآن بإنشاء أول فيديو احترافي مجاناً خلال ثوانٍ معدودة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onStartNow}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>ابدأ استخدام المحرر فوراً</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
