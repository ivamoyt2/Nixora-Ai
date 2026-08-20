import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Check,
  LayoutGrid,
  Radio,
  Zap,
  BookOpen,
} from 'lucide-react';
import { CaptionStyleConfig } from '../types';
import { CAPTION_PRESETS } from '../data/captionPresets';

interface StyleSelectorProps {
  selectedConfig: CaptionStyleConfig;
  onSelectPreset: (config: CaptionStyleConfig) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedConfig,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'جميع الستايلات', icon: LayoutGrid },
    { id: 'viral', label: '🔥 الشائع والتيك توك (Viral)', icon: Flame },
    { id: 'islamic', label: '🕌 محتوى هادف وقرآني', icon: BookOpen },
    { id: 'podcast', label: '🎙️ بودكاست ومقابلات', icon: Radio },
    { id: 'creative', label: '⚡ إبداعي ونيون (Creative)', icon: Zap },
    { id: 'minimal', label: '✨ هادئ وبسيط (Minimal)', icon: Sparkles },
  ];

  const filteredPresets =
    selectedCategory === 'all'
      ? CAPTION_PRESETS
      : CAPTION_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-blue-400 fill-current" />
            <span>مكتبة تصاميم الكابشن الجاهزة والمشهورة (CapCut & TikTok Presets)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            اختر قالباً جاهزاً من أشهر قوالب صناع المحتوى بضغطة زر واحدة
          </p>
        </div>

        <span className="text-[11px] text-blue-400 font-medium px-2.5 py-0.5 rounded-full bg-blue-600/10 border border-blue-500/30">
          {CAPTION_PRESETS.length} نمط احترافي جاهز
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-black text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isSelected =
            selectedConfig.presetId === preset.id ||
            (selectedConfig.styleType === preset.config.styleType &&
              selectedConfig.fontFamily === preset.config.fontFamily &&
              selectedConfig.primaryColor === preset.config.primaryColor);

          return (
            <button
              key={preset.id}
              id={`preset-card-${preset.id}`}
              type="button"
              onClick={() => onSelectPreset(preset.config)}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl border text-right transition-all group overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/40 shadow-xl shadow-blue-950/50'
                  : 'bg-black border-slate-800 hover:border-blue-900/60 hover:bg-slate-950'
              }`}
            >
              {/* Header inside card */}
              <div className="w-full">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
                    {preset.badge}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <h4
                  className={`text-xs font-bold transition ${
                    isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'
                  }`}
                >
                  {preset.name}
                </h4>

                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 my-2">
                  {preset.description}
                </p>
              </div>

              {/* Dynamic Live Visual Preview Box */}
              <div
                className="w-full pt-2 pb-1.5 px-2 rounded-xl flex items-center justify-center border border-slate-800/80 bg-slate-950 text-center"
                style={{
                  fontFamily: preset.config.fontFamily,
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-md text-xs font-extrabold transition-transform duration-200 group-hover:scale-105"
                  style={{
                    color: preset.config.primaryColor,
                    backgroundColor:
                      preset.config.textTransform === 'box'
                        ? preset.config.backgroundColor
                        : 'transparent',
                    textShadow:
                      preset.config.strokeWidth > 0
                        ? `-${preset.config.strokeWidth}px -${preset.config.strokeWidth}px 0 ${preset.config.strokeColor}, ${preset.config.strokeWidth}px -${preset.config.strokeWidth}px 0 ${preset.config.strokeColor}, -${preset.config.strokeWidth}px ${preset.config.strokeWidth}px 0 ${preset.config.strokeColor}, ${preset.config.strokeWidth}px ${preset.config.strokeWidth}px 0 ${preset.config.strokeColor}`
                        : 'none',
                  }}
                >
                  نص <span style={{ color: preset.config.highlightColor }}>كابشن</span> احترافي
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
