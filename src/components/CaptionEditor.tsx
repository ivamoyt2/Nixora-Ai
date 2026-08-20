import React, { useState } from 'react';
import { Plus, Trash2, Play, Search, FileText, Sparkles, Check, X } from 'lucide-react';
import { CaptionCue } from '../types';

interface CaptionEditorProps {
  captions: CaptionCue[];
  currentTime: number;
  videoDuration?: number;
  onCaptionsChange?: (captions: CaptionCue[]) => void;
  onUpdateCaptions?: (captions: CaptionCue[]) => void;
  onSeek: (time: number) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  captions,
  currentTime,
  videoDuration = 15,
  onCaptionsChange,
  onUpdateCaptions,
  onSeek,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptText, setScriptText] = useState('');

  const triggerChange = (newCaptions: CaptionCue[]) => {
    if (typeof onCaptionsChange === 'function') {
      onCaptionsChange(newCaptions);
    }
    if (typeof onUpdateCaptions === 'function') {
      onUpdateCaptions(newCaptions);
    }
  };

  // Update a specific cue
  const handleUpdateText = (id: string, newText: string) => {
    const updated = captions.map((cue) => {
      if (cue.id === id) {
        const splitWords = newText.trim().split(/\s+/).filter(Boolean);
        const totalWords = splitWords.length;
        const durationPerWord = totalWords > 0 ? (cue.end - cue.start) / totalWords : 0.5;

        const newWords = splitWords.map((w, idx) => ({
          word: w,
          start: Number((cue.start + idx * durationPerWord).toFixed(2)),
          end: Number((cue.start + (idx + 1) * durationPerWord).toFixed(2)),
        }));

        return {
          ...cue,
          text: newText,
          words: newWords,
        };
      }
      return cue;
    });
    triggerChange(updated);
  };

  // Adjust timing
  const handleAdjustTiming = (id: string, field: 'start' | 'end', delta: number) => {
    const updated = captions.map((cue) => {
      if (cue.id === id) {
        let newStart = cue.start;
        let newEnd = cue.end;

        if (field === 'start') {
          newStart = Math.max(0, Number((cue.start + delta).toFixed(2)));
          if (newStart >= newEnd) newEnd = newStart + 0.5;
        } else {
          newEnd = Math.max(newStart + 0.2, Number((cue.end + delta).toFixed(2)));
        }

        return {
          ...cue,
          start: newStart,
          end: newEnd,
        };
      }
      return cue;
    });
    triggerChange(updated);
  };

  // Delete cue
  const handleDeleteCue = (id: string) => {
    triggerChange(captions.filter((c) => c.id !== id));
  };

  // Add new cue after current
  const handleAddCue = (afterIndex: number) => {
    const prevCue = captions[afterIndex];
    const newStart = prevCue ? Number((prevCue.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 2.0).toFixed(2));

    const newCue: CaptionCue = {
      id: `cue_${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: 'نص كابشن جديد',
      words: [
        { word: 'نص', start: newStart, end: Number((newStart + 0.6).toFixed(2)) },
        { word: 'كابشن', start: Number((newStart + 0.6).toFixed(2)), end: Number((newStart + 1.3).toFixed(2)) },
        { word: 'جديد', start: Number((newStart + 1.3).toFixed(2)), end: newEnd },
      ],
    };

    const newCaptions = [...captions];
    if (afterIndex >= 0 && afterIndex < captions.length) {
      newCaptions.splice(afterIndex + 1, 0, newCue);
    } else {
      newCaptions.push(newCue);
    }
    triggerChange(newCaptions);
  };

  // Auto distribute full script
  const handleApplyScript = () => {
    const lines = scriptText
      .split(/[\n.،؛!؟]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const totalDuration = Math.max(videoDuration || 10, lines.length * 2.5);
    const durationPerLine = totalDuration / lines.length;

    const newCues: CaptionCue[] = lines.map((line, idx) => {
      const start = Number((idx * durationPerLine).toFixed(2));
      const end = Number(((idx + 1) * durationPerLine - 0.1).toFixed(2));
      const words = line.split(/\s+/).filter(Boolean);
      const perWord = words.length > 0 ? (end - start) / words.length : 0.5;

      return {
        id: `cue_${Date.now()}_${idx}`,
        start,
        end,
        text: line,
        words: words.map((w, wIdx) => ({
          word: w,
          start: Number((start + wIdx * perWord).toFixed(2)),
          end: Number((start + (wIdx + 1) * perWord).toFixed(2)),
        })),
      };
    });

    triggerChange(newCues);
    setIsScriptModalOpen(false);
    setScriptText('');
  };

  // Filtered captions
  const filtered = captions.filter((c) =>
    c.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick Action 1: Toggle word highlight on click
  const handleToggleWordHighlight = (cueId: string, wordIdx: number) => {
    const updated = captions.map((c) => {
      if (c.id === cueId && c.words && c.words[wordIdx]) {
        const newWords = [...c.words];
        newWords[wordIdx] = {
          ...newWords[wordIdx],
          highlight: !newWords[wordIdx].highlight,
        };
        return { ...c, words: newWords };
      }
      return c;
    });
    triggerChange(updated);
  };

  // Quick Action 2: Auto Clean extra punctuation and spaces
  const handleAutoCleanText = () => {
    const cleaned = captions.map((c) => {
      const cleanText = c.text.replace(/[\s\t]+/g, ' ').trim();
      return { ...c, text: cleanText };
    });
    triggerChange(cleaned);
  };

  // Quick Action 3: Split long sentences into 2-3 word bite-sized viral shorts
  const handleSmartShorten = () => {
    const newCaptions: CaptionCue[] = [];
    captions.forEach((c) => {
      if (c.words && c.words.length > 4) {
        const midPoint = Math.ceil(c.words.length / 2);
        const firstHalf = c.words.slice(0, midPoint);
        const secondHalf = c.words.slice(midPoint);

        const firstStart = c.start;
        const firstEnd = firstHalf[firstHalf.length - 1].end;
        const secondStart = secondHalf[0].start;
        const secondEnd = c.end;

        newCaptions.push({
          id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          start: firstStart,
          end: firstEnd,
          text: firstHalf.map((w) => w.word).join(' '),
          words: firstHalf,
        });

        newCaptions.push({
          id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          start: secondStart,
          end: secondEnd,
          text: secondHalf.map((w) => w.word).join(' '),
          words: secondHalf,
        });
      } else {
        newCaptions.push(c);
      }
    });
    triggerChange(newCaptions);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-200">محرر الكابشنات والتوقيتات</span>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-mono">
            {captions.length} سطر
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSmartShorten}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-blue-300 text-[11px] font-semibold transition border border-blue-500/30"
            title="تقسيم الجمل الطويلة لكابشنات شورتس سريعة وجذابة"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>تقسيم سريع للشورتس</span>
          </button>

          <button
            type="button"
            onClick={handleAutoCleanText}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition border border-slate-700"
            title="تنظيف المسافات الزائدة"
          >
            <Check className="w-3 h-3 text-slate-400" />
            <span>تنظيف النص</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScriptModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition border border-slate-700"
            title="لصق نص وتوزيعه تلقائياً"
          >
            <FileText className="w-3 h-3 text-blue-400" />
            <span>لصق نص</span>
          </button>

          {/* Search */}
          <div className="relative w-32 sm:w-40">
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-[11px] bg-slate-950/80 border border-slate-700/80 rounded-lg pl-2 pr-6 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Caption List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1 max-h-[460px] custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-3">
            <p>لا توجد كابشنات حالياً أو لم تطابق البحث.</p>
            <button
              type="button"
              onClick={() => handleAddCue(-1)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول كابشن</span>
            </button>
          </div>
        ) : (
          filtered.map((cue, index) => {
            const isActive = currentTime >= cue.start && currentTime <= cue.end;

            return (
              <div
                key={cue.id}
                id={`cue-item-${cue.id}`}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-950/40 border-blue-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {/* Timestamp badges */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSeek(cue.start)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 hover:text-slate-950 text-slate-300 text-[11px] font-mono transition"
                      title="انتقال للفيديو عند هذا التوقيت"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{cue.start.toFixed(2)}s</span>
                    </button>
                    <span className="text-slate-500 text-xs">←</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 text-[11px] font-mono">
                      {cue.end.toFixed(2)}s
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({(cue.end - cue.start).toFixed(1)} ث)
                    </span>
                  </div>

                  {/* Timing adjustments & Delete */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-400">
                      <button
                        onClick={() => handleAdjustTiming(cue.id, 'start', -0.2)}
                        className="px-1 hover:text-white"
                        title="تقديم البداية 0.2 ث"
                      >
                        -
                      </button>
                      <span className="px-1 text-slate-300">بدء</span>
                      <button
                        onClick={() => handleAdjustTiming(cue.id, 'start', 0.2)}
                        className="px-1 hover:text-white"
                        title="تأخير البداية 0.2 ث"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteCue(cue.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                      title="حذف هذا الكابشن"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editable Arabic Text */}
                <div className="relative">
                  <textarea
                    rows={2}
                    value={cue.text}
                    onChange={(e) => handleUpdateText(cue.id, e.target.value)}
                    dir="rtl"
                    className="w-full bg-slate-900/90 text-sm font-semibold text-slate-100 border border-slate-700/60 rounded-lg p-2 focus:outline-none focus:border-blue-500 leading-relaxed resize-none font-['Cairo']"
                    placeholder="نص الكابشن العربي..."
                  />
                </div>

                {/* Words breakdown for Highlight style */}
                {cue.words && cue.words.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-400 ml-1">توقيت وإبراز الكلمات:</span>
                    {cue.words.map((w, wIdx) => {
                      const isWordActive =
                        currentTime >= w.start && currentTime <= w.end;
                      const isHighlighted = Boolean(w.highlight);

                      return (
                        <div
                          key={wIdx}
                          className="flex items-center group/word rounded border border-slate-700/60 overflow-hidden"
                        >
                          <span
                            onClick={() => onSeek(w.start)}
                            className={`px-1.5 py-0.5 cursor-pointer transition ${
                              isWordActive
                                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold scale-105'
                                : isHighlighted
                                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                            }`}
                            title={`${w.start}s - ${w.end}s (انقر للانتقال في الفيديو)`}
                          >
                            {w.word}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleWordHighlight(cue.id, wIdx)}
                            className={`px-1 py-0.5 text-[9px] transition ${
                              isHighlighted
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-500 hover:text-amber-400'
                            }`}
                            title={isHighlighted ? 'إلغاء تمييز الكلمة' : 'تمييز ولفت الانتباه لهذه الكلمة (Highlight)'}
                          >
                            ★
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleAddCue(captions.length - 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة كابشن جديد</span>
        </button>

        <span className="text-[11px] text-slate-400">
          انقر على أي كابشن لمشاهدته في الفيديو مباشرة
        </span>
      </div>

      {/* Script Import Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">لصق نص وتوزيعه تلقائياً</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              الصق النص العربي (آيات قرآنية، أحاديث، شعر، أو نص مخصص)، وسيقوم المحرر بتقسيمه وتوزيعه بالتساوي على طول الفيديو مع توقيت كل كلمة:
            </p>

            <textarea
              rows={6}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              dir="rtl"
              placeholder="الصق النص هنا... مثلاً:&#10;بسم الله الرحمن الرحيم&#10;الحمد لله رب العالمين&#10;الرحمن الرحيم"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none font-['Cairo']"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyScript}
                disabled={!scriptText.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تطبيق وتقسيم الكابشن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
