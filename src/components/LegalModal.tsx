import React, { useEffect } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              {isPrivacy ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isPrivacy ? 'سياسة الخصوصية وأمان البيانات' : 'شروط وأحكام الاستخدام'}
              </h3>
              <p className="text-xs text-slate-400">منصة NEXORA AI • آخر تحديث: أغسطس 2026</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed pr-1 flex-1">
          {isPrivacy ? (
            <>
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-blue-500/30 text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>نلتزم في NEXORA AI بعدم تخزين أو بيع أو تدريب النماذج على وسائطك وملفاتك الصوتية إطلاقاً.</span>
              </div>

              <h4 className="font-bold text-white text-sm pt-2">1. جمع البيانات واستخدامها:</h4>
              <p>
                يتم رفع الملفات (الصور، الفيديو، الصوتيات) فقط لغرض معالجة المونتاج وتوليد ملفات الكابشن المتزامنة عبر خوارزميات الذكاء الاصطناعي ومحرك FFmpeg.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">2. المعالجة المحلية الآمنة (Local Worker):</h4>
              <p>
                عند تفعيل ميزة Islam View / NEXORA Local Worker، تتم عمليات الرندر وتوليد ملفات الفيديو مباشرة على جهاز الكمبيوتر الخاص بك، دون الحاجة لرفع الفيديوهات الضخمة عبر السحابة.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">3. خصوصية التفريغ الصوتي (Gemini AI):</h4>
              <p>
                يتم إرسال الملفات الصوتية حصرياً عبر قنوات اتصال مشفرة (HTTPS/TLS) إلى نموذج Google Gemini لاستخراج النصوص العربية مع التوقيتات الدقيقة فقط.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">4. حقوق الملكية الفكرية:</h4>
              <p>
                جميع الفيديوهات والنصوص والمونتاجات التي تقوم بإنشائها عبر NEXORA AI هي ملكية خالصة لك 100% بدون أي قيود تجارية أو حقوق ملكية للمنصة.
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-white text-sm">1. قبول الشروط:</h4>
              <p>
                باستخدامك لمنصة NEXORA AI، فإنك توافق على الالتزام ببنود الاستخدام وسياسة الاستخدام العادل للموارد والخوادم.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">2. الاستخدام العادل والأخلاقي:</h4>
              <p>
                يمنع استخدام المنصة في إنتاج أو تفريغ محتويات تنتهك القوانين، أو تروج لخطاب الكراهية، أو التعدي على حقوق الملكية الفكرية للآخرين.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">3. دقة الذكاء الاصطناعي:</h4>
              <p>
                على الرغم من أن دقة التعرف على الكلام العربي تتجاوز 99%، إلا أن المنصة توفر محرر نصوص تفاعلي متكامل يسمح لك بتعديل أي كلمة أو توقيت قبل الرندر النهائي.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">4. التحديثات والدعم الفني:</h4>
              <p>
                نعمل باستمرار على إضافة ميزات جديدة، خطوط عربية، وقوالب فيروسية لمواكبة أحدث منصات التواصل الاجتماعي (TikTok, Reels, Shorts).
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-blue-600/20"
          >
            فهمت وموافق
          </button>
        </div>
      </div>
    </div>
  );
};

