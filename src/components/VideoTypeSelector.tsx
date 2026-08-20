import React from 'react';
import { Smartphone, Monitor, Check } from 'lucide-react';
import { VideoType } from '../types';

interface VideoTypeSelectorProps {
  selectedType: VideoType;
  onChange: (type: VideoType) => void;
}

export const VideoTypeSelector: React.FC<VideoTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>نوع الفيديو:</span>
        </label>
        <span className="text-xs text-slate-400">
          يحدد حجم الكابشن الافتراضي والموضع المناسب
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Short Option */}
        <button
          id="btn-select-short"
          type="button"
          onClick={() => onChange('short')}
          className={`relative flex items-center p-3.5 rounded-xl border text-right transition-all ${
            selectedType === 'short'
              ? 'bg-emerald-950/40 border-blue-500 shadow-md shadow-emerald-950/50'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${
              selectedType === 'short'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${selectedType === 'short' ? 'text-white' : 'text-slate-300'}`}>
                Short / Reel (عمودي)
              </span>
              {selectedType === 'short' && (
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-slate-950">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              كابشن كبير، بارز، وسريع الظهور مناسب لتيك توك وريلز
            </p>
          </div>
        </button>

        {/* Long Video Option */}
        <button
          id="btn-select-long"
          type="button"
          onClick={() => onChange('long')}
          className={`relative flex items-center p-3.5 rounded-xl border text-right transition-all ${
            selectedType === 'long'
              ? 'bg-emerald-950/40 border-blue-500 shadow-md shadow-emerald-950/50'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${
              selectedType === 'long'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${selectedType === 'long' ? 'text-white' : 'text-slate-300'}`}>
                فيديو طويل (أفقي)
              </span>
              {selectedType === 'long' && (
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-slate-950">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تصميم كابشن أكثر هدوءاً وتنسيق مريح للمحاضرات واليوتيوب
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
