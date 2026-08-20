import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Shield,
} from 'lucide-react';
import { AppPage } from '../types';

interface PricingPageProps {
  onStartNow: () => void;
  onNavigate: (page: AppPage) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onStartNow }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      id: 'free',
      name: 'البداية المجانية (Starter)',
      tagline: 'مثالي لتجربة المنصة واستكشاف الميزات الأساسية',
      priceMonthly: '0',
      priceYearly: '0',
      period: 'مجاناً للأبد',
      badge: null,
      isPopular: false,
      buttonText: 'ابدأ مجاناً الآن',
      features: [
        'تفريغ كابشن عربي حتى 10 دقائق شهرياً',
        'مونتاج آلي بالملفات المرقمة حتى 15 مشهداً',
        'دقة تصدير 720p HD و 1080p FHD',
        'مكتبة قوالب الكابشن الأساسية (5 قوالب)',
        'تأثيرات الانتقال الكلاسيكية (Fade & Slide)',
        'دعم تشغيل Python Local Worker على جهازك',
        'تصدير بدون قيود عبر المتصفح',
      ],
      notIncluded: [
        'رندر فائق السرعة بدقة 4K UHD 60FPS',
        'مكتبة المؤثرات الصوتية والسينمائية الكاملة',
        'أولوية معالجة الصوت بالذكاء الاصطناعي في السحابة',
      ],
    },
    {
      id: 'pro',
      name: 'المحترف (Pro Creator)',
      tagline: 'الخيار الأفضل لصناع المحتوى واليوتيوبرز ومسوقي الريلز',
      priceMonthly: '19',
      priceYearly: '15',
      period: 'شهرياً / يُدفع سنوياً',
      badge: '🔥 الأكثر طلباً',
      isPopular: true,
      buttonText: 'ترقية إلى PRO',
      features: [
        'تفريغ كابشن ذكي غير محدود بدقة Gemini 2.5',
        'مونتاج آلي غير محدود لأي عدد من المشاهد والأصوات',
        'تصدير فائق الدقة 1080p FHD و 4K UHD بسرعة خيالية',
        'كافة قوالب الكابشن الفيروسية الـ 10+ (Karaoke & Glow)',
        'مكتبة المؤثرات الصوتية السينمائية التلقائية (SFX Suite)',
        'حركات كين بيرنز المتقدمة وفلاتر الألوان الاحترافية',
        'تنزيل ملفات الترجمة (.ass, .srt, .vtt) بضغطة زر',
        'أولوية قصوى لمعالجة الخوادم وسرعة الرندر',
        'دعم فني مخصص عبر Discord والبريد الإلكتروني',
      ],
      notIncluded: [],
    },
    {
      id: 'enterprise',
      name: 'استوديو الشركات (Enterprise Studio)',
      tagline: 'لوكالات الإنتاج والشركات وفرق العمل متعددة الحسابات',
      priceMonthly: '49',
      priceYearly: '39',
      period: 'شهرياً / يُدفع سنوياً',
      badge: '👑 للشركات والفرق',
      isPopular: false,
      buttonText: 'تواصل مع المبيعات',
      features: [
        'كل مزايا باقة Pro Creator غير محدودة',
        'إمكانية ربط حتى 5 مستخدمين في حساب واحد',
        'خوادم رندر مخصصة Dedicated GPU Servers',
        'تخصيص قوالب خطوط وعلامات مائية خاصة بالبراند',
        'API مخصص لأتمتة المونتاج وربطه مع أنظمة الشركة',
        'اتفاقية مستوى الخدمة SLA 99.9%',
        'مدير حساب مخصص وتدريب لفريق العمل',
      ],
      notIncluded: [],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <span className="px-3.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          خطط أسعار مرنة وشفافة
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          استثمر في تسريع إنتاج محتواك الفيروسي
        </h1>
        <p className="text-xs sm:text-base text-slate-400 leading-relaxed">
          اختر الخطة المناسبة لحجم أعمالك. ابدأ مجاناً وقم بالترقية عند حاجتك لميزات متقدمة ورندر فائق السرعة.
        </p>

        {/* Monthly / Yearly Switch */}
        <div className="flex items-center justify-center pt-2">
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              دفع شهري
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>دفع سنوي</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black text-cyan-300 text-[10px] font-black border border-cyan-500/30">
                خصم 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {plans.map((plan) => {
          const currentPrice =
            billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 transition relative shadow-2xl ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-black border-2 border-blue-500 shadow-blue-900/30 ring-1 ring-blue-500/50'
                  : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-600/40">
                  {plan.badge}
                </div>
              )}

              {/* Plan Top Header */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 py-2 border-y border-slate-800/80">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    ${currentPrice}
                  </span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    المزايا المشمولة:
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                      >
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <ul className="space-y-1.5 pt-2 opacity-50">
                      {plan.notIncluded.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-500 line-through"
                        >
                          <span className="w-4 text-center shrink-0">-</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={onStartNow}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white shadow-blue-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'
                }`}
              >
                {plan.isPopular && <Sparkles className="w-4 h-4" />}
                <span>{plan.buttonText}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-blue-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">ضمان استرداد الأموال لمدة 14 يوماً</h4>
            <p className="text-xs text-slate-400">
              إذا لم تكن راضياً عن جودة الكابشن أو سرعة الرندر، يمكنك طلب استرداد كامل بدون شروط.
            </p>
          </div>
        </div>

        <button
          onClick={onStartNow}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-blue-600/30 transition"
        >
          تجربة المحرر مجاناً الآن
        </button>
      </div>
    </div>
  );
};
