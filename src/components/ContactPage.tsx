import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Globe,
  Headphones,
} from 'lucide-react';
import { SocialLinks } from './SocialLinks';
import { AppPage } from '../types';

interface ContactPageProps {
  onNavigate: (page: AppPage) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'support' | 'feature' | 'business' | 'other'>('support');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          دائماً في خدمتك
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          تواصل مع فريق <span className="text-blue-400">NEXORA AI</span>
        </h1>
        <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
          هل لديك استفسار تقني، اقتراح ميزة جديدة، أو ترغب في شراكة أعمال؟ نحن هنا للإجابة في أسرع وقت.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Contact Information & Channels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-[#090D16] border border-blue-950/80 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-blue-400" />
              <span>معلومات التواصل المباشر</span>
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">البريد الإلكتروني للدعم</span>
                  <a
                    href="mailto:support@nexora.ai"
                    className="text-white hover:text-blue-400 font-mono font-bold transition"
                  >
                    support@nexora.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">أوقات الاستجابة</span>
                  <span className="text-white font-medium">خلال 24 ساعة كحد أقصى</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">تابعنا وتواصل عبر حساباتنا:</span>
              <SocialLinks variant="compact" />
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-8 rounded-3xl bg-[#090D16] border border-blue-950/80 shadow-xl relative overflow-hidden">
            {submittedSuccess ? (
              <div className="py-12 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">تم إرسال رسالتك بنجاح!</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  شكراً لتواصلك معنا. سيقوم أحد مسؤولي الدعم الفني بمراجعة رسالتك والرد عليك عبر البريد في أقرب وقت.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span>أرسل لنا رسالة</span>
                </h2>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-300">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسمك الكريم"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-300">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300">نوع الاستفسار</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="support">دعم فني ومساعدة في التحرير</option>
                    <option value="feature">اقتراح ميزة أو قالب جديد</option>
                    <option value="business">شراكة أعمال أو استفسار تجاري</option>
                    <option value="other">استفسار عام</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300">نص الرسالة *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب تفاصيل استفسارك هنا..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال الرسالة الآن</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
