import React, { useState } from 'react';
import {
  Settings2,
  Type,
  Palette,
  Move,
  Maximize2,
  RotateCw,
  Save,
  BookmarkCheck,
  Check,
  Sliders,
  Sparkles,
  Zap,
  Film,
  Smartphone,
  Eye,
  EyeOff,
  Wand2,
} from 'lucide-react';
import {
  CaptionStyleConfig,
  VideoType,
  ArabicFontFamily,
  WordAnimationEffect,
} from '../types';

interface CaptionSettingsPanelProps {
  styleConfig: CaptionStyleConfig;
  videoType: VideoType;
  onChange: (config: CaptionStyleConfig) => void;
}

export const CaptionSettingsPanel: React.FC<CaptionSettingsPanelProps> = ({
  styleConfig,
  videoType,
  onChange,
}) => {
  const [savedPresets, setSavedPresets] = useState<
    Array<{ name: string; config: CaptionStyleConfig }>
  >(() => {
    try {
      const stored = localStorage.getItem('iv_saved_presets_v3');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [presetSavedNotice, setPresetSavedNotice] = useState(false);

  const availableFonts: Array<{
    id: ArabicFontFamily;
    name: string;
    desc: string;
  }> = [
    { id: 'Cairo', name: 'كايرو (Cairo)', desc: 'الأكثر شهرة للريلز وتيك توك' },
    { id: 'Tajawal', name: 'تجوال (Tajawal)', desc: 'أنيق ومريح للقراءة السريعة' },
    { id: 'Almarai', name: 'المراعي (Almarai)', desc: 'واضح ونظيف للفيديوهات الطويلة' },
    { id: 'Readex Pro', name: 'ريديكس برو (Readex)', desc: 'تصميم هندسي حديث' },
    { id: 'Amiri', name: 'أميري (Amiri)', desc: 'ملكي وتراثي للقرآن الكريم' },
    { id: 'Alexandria', name: 'الإسكندرية (Alexandria)', desc: 'عريض وجريء' },
    { id: 'Changa', name: 'تشانجا (Changa)', desc: 'حماسي لليوتيوب' },
    { id: 'El Messiri', name: 'المسيري (El Messiri)', desc: 'سينمائي ناعم' },
    { id: 'Kufam', name: 'كوفام (Kufam)', desc: 'طابع كوفي فني' },
    { id: 'Lemonada', name: 'ليمونادا (Lemonada)', desc: 'مرح للفلوجات' },
    { id: 'Rubik', name: 'روبيك (Rubik)', desc: 'هندسي متوازن وقوي' },
  ];

  const wordEffectOptions: Array<{
    id: WordAnimationEffect;
    name: string;
    desc: string;
    icon: string;
  }> = [
    {
      id: 'karaoke_highlight',
      name: '🎤 الكلمة الملونة المتغيرة (Karaoke Highlight)',
      desc: 'يتغير لون كل كلمة لحظة نطقها إلى اللون المختار المميز مع بقاء بقية النص واضحاً',
      icon: '🎤',
    },
    {
      id: 'pop_active',
      name: '💥 قفزة وتكبير الكلمة (Pop & Zoom Active)',
      desc: 'تكبير ناعم للكلمة الحالية المنطوقة لجذب انتباه المشاهد في الريلز',
      icon: '💥',
    },
    {
      id: 'color_wave',
      name: '🌈 تدرج الألوان المتناوب (Color Wave)',
      desc: 'تناوب تلقائي في ألوان الكلمات لإعطاء حيوية وطاقة عالية للفيديو',
      icon: '🌈',
    },
    {
      id: 'glow_active',
      name: '⚡ توهج نيون للكلمة (Neon Glow Active)',
      desc: 'إشعاع نيون مضيء حول الكلمة الحالية لحظة نطقها',
      icon: '⚡',
    },
    {
      id: 'box_active',
      name: '🏷️ كبسولة خلف الكلمة (Word Box Capsule)',
      desc: 'ظهور شريط أو كبسولة ملونة متباينة خلف الكلمة المنطوقة مباشرة',
      icon: '🏷️',
    },
    {
      id: 'classic',
      name: '✨ كلاسيكي ثابت وهادئ (Classic Clean)',
      desc: 'عرض الأسطر بشكل هادئ ومنسق بدون حركات سريعة (مثالي للفيديوهات الطويلة والوثائقية)',
      icon: '✨',
    },
  ];

  const updateConfig = (patch: Partial<CaptionStyleConfig>) => {
    onChange({
      ...styleConfig,
      ...patch,
    });
  };

  // 1. Smart Auto Preset for Long 16:9 Landscape Videos
  const applyAutoLongPreset = () => {
    updateConfig({
      positionXPercent: 50,
      positionYPercent: 88, // Bottom Center
      fontSize: 24, // Small & clean
      wordsPerLine: 8,
      scaleX: 100,
      scaleY: 100,
      rotation: 0,
      strokeWidth: 1.5,
      strokeColor: '#000000',
      hasShadow: false, // Remove heavy shadow
      shadowBlur: 0,
      wordEffect: 'classic',
      textTransform: styleConfig.backgroundOpacity > 20 ? 'box' : 'none',
    });
  };

  // 2. Smart Auto Preset for Vertical 9:16 Shorts/Reels
  const applyAutoShortsPreset = () => {
    updateConfig({
      positionXPercent: 50,
      positionYPercent: 72, // Center-bottom above TikTok controls
      fontSize: 36, // Punchy & readable
      wordsPerLine: 4,
      scaleX: 100,
      scaleY: 100,
      rotation: 0,
      strokeWidth: 3,
      strokeColor: '#000000',
      hasShadow: false, // Clean without ugly dark blob
      shadowBlur: 0,
      wordEffect: 'karaoke_highlight',
      textTransform: 'none',
    });
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = { name: newPresetName.trim(), config: { ...styleConfig } };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('iv_saved_presets_v3', JSON.stringify(updated));
    setNewPresetName('');
    setPresetSavedNotice(true);
    setTimeout(() => setPresetSavedNotice(false), 2500);
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-6">
      {/* Header & Smart Auto-Placement Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm text-slate-200">
            لوحة إعدادات النصوص والتأثيرات الذكية (Smart Caption Studio)
          </span>
        </div>

        {/* 🌟 ONE-CLICK SMART POSITION & SIZE BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={applyAutoLongPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 hover:border-blue-500/50 transition shadow-sm"
            title="تطبيق تلقائي: تحت بالوسط وصغيرة مناسبة للفيديوهات الطويلة"
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>تنسيق الفيديو الطويل (تحت بالوسط وصغيرة)</span>
          </button>

          <button
            type="button"
            onClick={applyAutoShortsPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-blue-300 text-xs font-bold border border-blue-500/40 transition shadow-sm"
            title="تطبيق تلقائي: حجم مميز وموضع مثالي للشورتس والريلز"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>تنسيق الشورتس والريلز (وسط أسفل)</span>
          </button>
        </div>
      </div>

      {/* 🌟 DYNAMIC WORD HIGHLIGHT & ANIMATION EFFECTS SECTION */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-blue-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-xs text-white">
              تأثيرات الكلمات الديناميكية وحركة النص (Dynamic Word Effects):
            </h4>
          </div>
          <span className="text-[11px] text-blue-400 font-mono">
            {wordEffectOptions.find((e) => e.id === styleConfig.wordEffect)?.name.split(' ')[1] || 'تأثير نشط'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {wordEffectOptions.map((eff) => {
            const isSelected = (styleConfig.wordEffect || 'karaoke_highlight') === eff.id;
            return (
              <button
                key={eff.id}
                type="button"
                onClick={() => updateConfig({ wordEffect: eff.id })}
                className={`p-3 rounded-xl text-right transition border flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-950/80 border-blue-500 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>{eff.name}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{eff.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3 Columns of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {/* Column 1: Dimensions & Sizing */}
        <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>أبعاد وحجم النص (CapCut Dimensions)</span>
            </span>
            <button
              type="button"
              onClick={() =>
                updateConfig({
                  scaleX: 100,
                  scaleY: 100,
                  rotation: 0,
                  fontSize: videoType === 'long' ? 24 : 36,
                })
              }
              className="text-[10px] text-slate-400 hover:text-blue-400 transition"
            >
              إعادة الضبط
            </button>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>حجم الخط:</span>
              <span className="text-blue-400 font-mono font-bold">
                {styleConfig.fontSize}px {styleConfig.fontSize <= 26 ? '(صغير ونظيف)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={72}
              value={styleConfig.fontSize}
              onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>صغير (20px)</span>
              <span>متوسط (34px)</span>
              <span>كبير (50px)</span>
            </div>
          </div>

          {/* Width Scale (ScaleX) */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>عرض النص (Scale X):</span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.scaleX || 100}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              value={styleConfig.scaleX || 100}
              onChange={(e) => updateConfig({ scaleX: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Height Scale (ScaleY) */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>طول وارتفاع النص (Scale Y):</span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.scaleY || 100}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              value={styleConfig.scaleY || 100}
              onChange={(e) => updateConfig({ scaleY: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-blue-400" />
                <span>تدوير النص (Rotation):</span>
              </span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={styleConfig.rotation || 0}
              onChange={(e) => updateConfig({ rotation: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Column 2: Position & Alignment */}
        <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <Move className="w-3.5 h-3.5" />
              <span>الموضع والمحاذاة التلقائية</span>
            </span>
          </div>

          {/* Position Y (الرأسي) */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>الموضع الرأسي (Y):</span>
              <span className="text-blue-400 font-mono font-bold">
                {styleConfig.positionYPercent}% {styleConfig.positionYPercent >= 85 ? '(تحت بالوسط)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={94}
              value={styleConfig.positionYPercent}
              onChange={(e) => updateConfig({ positionYPercent: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>أعلى (15%)</span>
              <span>وسط (50%)</span>
              <span>تحت بالوسط (88%)</span>
            </div>
          </div>

          {/* Position X (الأفقي) */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>الموضع الأفقي (X):</span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.positionXPercent ?? 50}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={styleConfig.positionXPercent ?? 50}
              onChange={(e) => updateConfig({ positionXPercent: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Quick Grid Placement */}
          <div>
            <label className="text-slate-400 block mb-1.5">مواضع سريعة للشاشة:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => updateConfig({ positionXPercent: 50, positionYPercent: 20 })}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] transition"
              >
                أعلى بالوسط
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ positionXPercent: 50, positionYPercent: 50, rotation: 0 })}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] transition"
              >
                وسط الشاشة
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ positionXPercent: 50, positionYPercent: 72 })}
                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-blue-500/50 text-blue-300 text-[10px] transition font-bold"
              >
                شورتس (72%)
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ positionXPercent: 50, positionYPercent: 88 })}
                className="col-span-3 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs transition font-bold flex items-center justify-center gap-1.5"
              >
                <span>تحت بالوسط (88%) - مثالي لليوتيوب والفيديوهات الطويلة</span>
              </button>
            </div>
          </div>

          {/* Words Per Line */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>عدد الكلمات في السطر:</span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.wordsPerLine} كلمات</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={styleConfig.wordsPerLine}
              onChange={(e) => updateConfig({ wordsPerLine: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Column 3: Fonts, Colors, Shadow & Stroke */}
        <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <Type className="w-3.5 h-3.5" />
              <span>الخطوط والألوان والظلال</span>
            </span>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-slate-400 block mb-1">الخط العربي:</label>
            <select
              value={styleConfig.fontFamily}
              onChange={(e) => updateConfig({ fontFamily: e.target.value as ArabicFontFamily })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
              style={{ fontFamily: styleConfig.fontFamily }}
            >
              {availableFonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">لون النص الأساسي:</label>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5">
                <input
                  type="color"
                  value={styleConfig.primaryColor}
                  onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px] text-slate-300">{styleConfig.primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">لون التمييز (Highlight):</label>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5">
                <input
                  type="color"
                  value={styleConfig.highlightColor}
                  onChange={(e) => updateConfig({ highlightColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px] text-slate-300">{styleConfig.highlightColor}</span>
              </div>
            </div>
          </div>

          {/* Stroke Width & Color */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>حدود النص (Stroke):</span>
              <span className="text-blue-400 font-mono font-bold">{styleConfig.strokeWidth}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={6}
                step={0.5}
                value={styleConfig.strokeWidth}
                onChange={(e) => updateConfig({ strokeWidth: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <input
                type="color"
                value={styleConfig.strokeColor || '#000000'}
                onChange={(e) => updateConfig({ strokeColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                title="لون الحدود"
              />
            </div>
          </div>

          {/* 🌟 SHADOW TOGGLE & CONTROLS (وشيل الظل الي ورا الخط) */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>الظل الخلفي (Text Shadow):</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  updateConfig({
                    hasShadow: !styleConfig.hasShadow,
                    shadowBlur: !styleConfig.hasShadow ? 4 : 0,
                  })
                }
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                  styleConfig.hasShadow
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {styleConfig.hasShadow ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{styleConfig.hasShadow ? 'الظل مفعل' : 'بدون ظل (نظيف)'}</span>
              </button>
            </div>

            {styleConfig.hasShadow && (
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>نعومة الظل:</span>
                  <span className="text-blue-400 font-mono">{styleConfig.shadowBlur || 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={styleConfig.shadowBlur || 0}
                  onChange={(e) => updateConfig({ shadowBlur: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Custom Preset Save / Load Bar */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="اسم القالب لحفظه..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ القالب</span>
          </button>
          {presetSavedNotice && (
            <span className="text-blue-400 flex items-center gap-1 text-[11px]">
              <Check className="w-3.5 h-3.5" /> تم الحفظ بنجاح!
            </span>
          )}
        </div>

        {savedPresets.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">قوالبك:</span>
            {savedPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(p.config)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition flex items-center gap-1"
              >
                <BookmarkCheck className="w-3 h-3 text-blue-400" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
