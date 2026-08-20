import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  Film,
  Cpu,
  ShieldCheck,
  Download,
  Terminal,
  MessageSquare,
} from 'lucide-react';
import { AppPage } from '../types';

interface FaqPageProps {
  onNavigate: (page: AppPage) => void;
}

interface FaqItem {
  category: 'all' | 'montage' | 'captions' | 'worker' | 'export' | 'billing';
  question: string;
  answer: string;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleAccordion = (index: number) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter((i) => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  const faqList: FaqItem[] = [
    {
      category: 'captions',
      question: 'كيف يتعرف الذكاء الاصطناعي على الكلمات وتوقيتها بدقة؟',
      answer:
        'نستخدم أحدث نماذج Google Gemini Audio Multimodal، حيث يتم تحليل الترددات الصوتية وتحديد بداية ونهاية كل كلمة بالمللي ثانية، مما يسمح بتطبيق تأثيرات الكلمة النشطة (Word Highlight) بدقة متزامنة مع نبرة الصوت.',
    },
    {
      category: 'captions',
      question: 'ما هي قوالب الكابشن المتاحة وهل تدعم التعديل؟',
      answer:
        'توفر المنصة أكثر من 10 قوالب مصممة خصيصاً للشورتس والريلز مثل: Viral، Neon Blue، Cyberpunk، Minimal Luxury، وComic Pop. يمكنك تعديل الألوان، حجم الخط، الظل، الإطار الخارجي، والموضع بحرية تامة.',
    },
    {
      category: 'montage',
      question: 'كيف أجهز ملفات المونتاج الآلي للتعرف التلقائي؟',
      answer:
        'ببساطة قم بتسمية الصور أو الفيديوهات والأصوات بنفس الرقم في بداية أو نهاية الاسم. مثلاً: 1.png مع 1.mp3، أو image_02.jpg مع voice_02.wav. سيكتشف النظام الأرقام فورياً ويربط كل مادة مع مدة الصوت الخاصة بها.',
    },
    {
      category: 'montage',
      question: 'ما هي الانتقالات وحركات الكاميرا المدعومة؟',
      answer:
        'يدعم محرك المونتاج انتقالات Fade و Slide و Zoom و Ken Burns مع حركات الكاميرا الذكية ومؤثرات المؤثرات الصوتية (Whoosh, Glitch, Cinematic Riser) لتجربة بصرية تجذب انتباه المشاهد.',
    },
    {
      category: 'worker',
      question: 'ما هو الـ Local Worker وكيف يساعدني؟',
      answer:
        'الـ Local Worker هو سكريبت سريع يعمل على جهازك (Windows أو Mac/Linux) يتيح معالجة ورندر الفيديو فائق الدقة 4K مباشرة على كرت الشاشة والمعالج الخاص بك، مما يمنحك سرعة رندر تفوق السحابة مع خصوصية مطلقة لملفاتك.',
    },
    {
      category: 'export',
      question: 'هل يمكنني تنزيل ملفات الترجمة بشكل منفصل (SRT / VTT)؟',
      answer:
        'نعم، بالإضافة إلى حرق الكابشن مباشرة على الفيديو، يمكنك تصدير ملفات الترجمة بصيغتي SRT و VTT لاستخدامها في YouTube Studio أو برامج المونتاج مثل Premiere و DaVinci Resolve و CapCut.',
    },
  ];

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'montage', label: 'المونتاج الآلي' },
    { id: 'captions', label: 'الكابشن والذكاء الاصطناعي' },
    { id: 'worker', label: 'الرندر والـ Worker' },
    { id: 'export', label: 'التصدير والصيغ' },
  ];

  const filteredFaqs = faqList.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold font-mono">
          مركز المساعدة والدعم
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          الأسئلة الشائعة حول <span className="text-blue-400">NEXORA AI</span>
        </h1>
        <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
          كل ما تحتاج معرفته حول كيفية عمل المحرك، دقة الذكاء الاصطناعي، التصدير، واستخدام النظام.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن سؤال أو كلمة مفتاحية..."
          className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-[#090D16] border border-blue-950/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition shadow-lg"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950/70 hover:bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-[#090D16] rounded-3xl border border-blue-950 p-6 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-bold">لم نتمكن من العثور على إجابات تطابق بحثك</p>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو تواصل مع فريق الدعم مباشرة.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#090D16] border border-blue-950/80 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-blue-400 transition cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-900/80 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#090D16] via-slate-950 to-[#090D16] border border-blue-950/80 text-center space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white">هل لديك سؤال آخر؟</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          فريق دعم Nexora AI جاهز للإجابة على جميع استفساراتك الفنية وتقديم المساعدة.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          تواصل مع الدعم الفني
        </button>
      </div>
    </div>
  );
};
