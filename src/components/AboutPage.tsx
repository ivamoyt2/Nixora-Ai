import React from 'react';
import {
  Sparkles,
  Film,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  Target,
  Code2,
  Terminal,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import { AppPage } from '../types';

interface AboutPageProps {
  onStartNow: () => void;
  onNavigate: (page: AppPage) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onStartNow, onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          رؤيتنا ورسالتنا
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          حول منصة <span className="text-blue-400">NEXORA AI</span>
        </h1>
        <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
          نحن نبني الجيل القادم من أدوات المونتاج وتفريغ المحتوى العربي لتمكين كل صانع محتوى من تحويل أفكاره إلى فيديوهات فيروسية بأعلى المعايير العالمية.
        </p>
      </div>

      {/* Story & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-[#090D16] border border-blue-950/80 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">الرسالة: تمكين المحتوى العربي</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            لطالما عانى صناع المحتوى في العالم العربي من ضعف دعم الأدوات العالمية للغة العربية وتشكيل الكلمات وتوقيتات الخطوط. جاءت منصة NEXORA AI لسد هذه الفجوة بدمج أقوى نماذج الذكاء الاصطناعي مع خطوط عربية فائقة الوضوح ومحركات رندر محلية متطورة.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#090D16] border border-blue-950/80 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">السرعة الفائقة والخصوصية التامة</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            نؤمن بأن وقت المبدع أثمن من أن يضيع في انتظار الرفع والتحميل. لذلك طورنا معمارية هجينة تجمع بين السحابة الذكية لتفريغ الصوت، والـ Local Worker لمعالجة وحرق الفيديو مباشرة على عتاد المستخدم بدون قيود.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-3xl font-black text-white">قيمنا الأساسية</h2>
          <p className="text-xs sm:text-sm text-slate-400">المبادئ التي تقود كل قرار نتخذه في تصميم المنصة</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#090D16] border border-blue-950/70 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">الدقة المتناهية</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              توقيت الكلمة بالمللي ثانية ومطابقة نبرة الصوت لضمان أفضل تجربة تفاعلية للمشاهد.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#090D16] border border-blue-950/70 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">احترام خصوصية المستخدم</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ملفاتك وفيديوهاتك ملكك بالكامل، لا يتم تخزين المواد بعد معالجتها وتصديرها.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#090D16] border border-blue-950/70 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">سهولة الاستخدام</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              واجهة واضحة بدون تعقيدات برامج المونتاج التقليدية، لتصل إلى النتيجة بنقرات معدودة.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#090D16] to-slate-950 border border-blue-500/30 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white">انضم إلى آلاف المبدعين اليوم</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          جرّب قوة الذكاء الاصطناعي في تحرير وتفريغ الفيديو باللغة العربية واكتشف الفرق بنفسك.
        </p>
        <button
          type="button"
          onClick={onStartNow}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition transform hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>ابدأ مجاناً</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
