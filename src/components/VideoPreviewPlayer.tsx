import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Move,
  Type,
  Plus,
  Minus,
  Maximize2,
  Sparkles,
  RotateCw,
  Sliders,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize2,
  Film,
  Smartphone,
} from 'lucide-react';
import { CaptionCue, CaptionStyleConfig, VideoMetadata } from '../types';

interface VideoPreviewPlayerProps {
  videoUrl: string;
  captions: CaptionCue[];
  styleConfig: CaptionStyleConfig;
  metadata?: VideoMetadata;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPositionChange?: (percentY: number) => void;
  onPositionXChange?: (percentX: number) => void;
  onScaleChange?: (scaleX: number, scaleY: number) => void;
  onRotationChange?: (rotation: number) => void;
  onFontSizeChange?: (fontSize: number) => void;
  onUpdateStyleConfig?: (patch: Partial<CaptionStyleConfig>) => void;
}

type DragMode =
  | 'none'
  | 'move'
  | 'scale_corner'
  | 'scale_width'
  | 'scale_height'
  | 'rotate';

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  videoUrl,
  captions,
  styleConfig,
  metadata,
  currentTime,
  onTimeUpdate,
  onPositionChange,
  onPositionXChange,
  onScaleChange,
  onRotationChange,
  onFontSizeChange,
  onUpdateStyleConfig,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captionBoxRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialCenter, setInitialCenter] = useState({ x: 0, y: 0 });
  const [initialDist, setInitialDist] = useState(1);
  const [initialAngle, setInitialAngle] = useState(0);
  const [initialConfig, setInitialConfig] = useState({
    posX: styleConfig.positionXPercent ?? 50,
    posY: styleConfig.positionYPercent ?? (metadata?.videoType === 'long' ? 88 : 72),
    scaleX: styleConfig.scaleX || 100,
    scaleY: styleConfig.scaleY || 100,
    fontSize: styleConfig.fontSize || (metadata?.videoType === 'long' ? 24 : 36),
    rotation: styleConfig.rotation || 0,
  });

  const [showSnapGuideX, setShowSnapGuideX] = useState(false);
  const [showSnapGuideY, setShowSnapGuideY] = useState(false);
  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [touchPinchDist, setTouchPinchDist] = useState<number | null>(null);

  // Sync external currentTime
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.4) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || metadata?.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      onTimeUpdate(val);
    }
  };

  // Find active cue
  const activeCue = captions.find(
    (cue) => currentTime >= cue.start && currentTime <= cue.end
  ) || (captions.length > 0 ? captions[0] : null);

  // Universal updater helper
  const updateStyle = useCallback(
    (patch: Partial<CaptionStyleConfig>) => {
      if (onUpdateStyleConfig) {
        onUpdateStyleConfig(patch);
      } else {
        if (patch.positionYPercent !== undefined && onPositionChange) {
          onPositionChange(patch.positionYPercent);
        }
        if (patch.positionXPercent !== undefined && onPositionXChange) {
          onPositionXChange(patch.positionXPercent);
        }
        if (patch.fontSize !== undefined && onFontSizeChange) {
          onFontSizeChange(patch.fontSize);
        }
        if ((patch.scaleX !== undefined || patch.scaleY !== undefined) && onScaleChange) {
          onScaleChange(
            patch.scaleX || styleConfig.scaleX || 100,
            patch.scaleY || styleConfig.scaleY || 100
          );
        }
        if (patch.rotation !== undefined && onRotationChange) {
          onRotationChange(patch.rotation);
        }
      }
    },
    [
      onUpdateStyleConfig,
      onPositionChange,
      onPositionXChange,
      onFontSizeChange,
      onScaleChange,
      onRotationChange,
      styleConfig.scaleX,
      styleConfig.scaleY,
    ]
  );

  const captureBoxCenter = () => {
    if (captionBoxRef.current) {
      const r = captionBoxRef.current.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: 0, y: 0 };
  };

  // 1. Move
  const handleStartMove = (clientX: number, clientY: number) => {
    setDragMode('move');
    setDragStartPos({ x: clientX, y: clientY });
    setInitialConfig({
      posX: styleConfig.positionXPercent ?? 50,
      posY: styleConfig.positionYPercent ?? (metadata?.videoType === 'long' ? 86 : 74),
      scaleX: styleConfig.scaleX || 100,
      scaleY: styleConfig.scaleY || 100,
      fontSize: styleConfig.fontSize || 48,
      rotation: styleConfig.rotation || 0,
    });
  };

  // 2. Corner Scale
  const handleStartCornerScale = (clientX: number, clientY: number) => {
    const center = captureBoxCenter();
    setInitialCenter(center);
    const dist = Math.hypot(clientX - center.x, clientY - center.y);
    setInitialDist(Math.max(10, dist));
    setDragMode('scale_corner');
    setDragStartPos({ x: clientX, y: clientY });
    setInitialConfig({
      posX: styleConfig.positionXPercent ?? 50,
      posY: styleConfig.positionYPercent ?? 74,
      scaleX: styleConfig.scaleX || 100,
      scaleY: styleConfig.scaleY || 100,
      fontSize: styleConfig.fontSize || 48,
      rotation: styleConfig.rotation || 0,
    });
  };

  // 3. Width Scale
  const handleStartWidthScale = (clientX: number, clientY: number) => {
    setDragMode('scale_width');
    setDragStartPos({ x: clientX, y: clientY });
    setInitialConfig({
      posX: styleConfig.positionXPercent ?? 50,
      posY: styleConfig.positionYPercent ?? 74,
      scaleX: styleConfig.scaleX || 100,
      scaleY: styleConfig.scaleY || 100,
      fontSize: styleConfig.fontSize || 48,
      rotation: styleConfig.rotation || 0,
    });
  };

  // 4. Height Scale
  const handleStartHeightScale = (clientX: number, clientY: number) => {
    setDragMode('scale_height');
    setDragStartPos({ x: clientX, y: clientY });
    setInitialConfig({
      posX: styleConfig.positionXPercent ?? 50,
      posY: styleConfig.positionYPercent ?? 74,
      scaleX: styleConfig.scaleX || 100,
      scaleY: styleConfig.scaleY || 100,
      fontSize: styleConfig.fontSize || 48,
      rotation: styleConfig.rotation || 0,
    });
  };

  // 5. Rotate
  const handleStartRotate = (clientX: number, clientY: number) => {
    const center = captureBoxCenter();
    setInitialCenter(center);
    const angle = Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
    setInitialAngle(angle);
    setDragMode('rotate');
    setDragStartPos({ x: clientX, y: clientY });
    setInitialConfig({
      posX: styleConfig.positionXPercent ?? 50,
      posY: styleConfig.positionYPercent ?? 74,
      scaleX: styleConfig.scaleX || 100,
      scaleY: styleConfig.scaleY || 100,
      fontSize: styleConfig.fontSize || 48,
      rotation: styleConfig.rotation || 0,
    });
  };

  const handleDragProcess = (clientX: number, clientY: number) => {
    if (dragMode === 'none' || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = clientX - dragStartPos.x;
    const deltaY = clientY - dragStartPos.y;

    if (dragMode === 'move') {
      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      let newX = Math.round(initialConfig.posX + deltaPercentX);
      let newY = Math.round(initialConfig.posY + deltaPercentY);

      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      if (Math.abs(newX - 50) <= 2) {
        newX = 50;
        setShowSnapGuideX(true);
      } else {
        setShowSnapGuideX(false);
      }

      if (Math.abs(newY - 50) <= 2) {
        newY = 50;
        setShowSnapGuideY(true);
      } else {
        setShowSnapGuideY(false);
      }

      updateStyle({ positionXPercent: newX, positionYPercent: newY });
    } else if (dragMode === 'scale_corner') {
      const currentDist = Math.hypot(clientX - initialCenter.x, clientY - initialCenter.y);
      const ratio = currentDist / initialDist;
      const newFontSize = Math.max(16, Math.min(84, Math.round(initialConfig.fontSize * ratio)));
      updateStyle({ fontSize: newFontSize });
    } else if (dragMode === 'scale_width') {
      const factor = Math.round((deltaX / rect.width) * 200);
      const newScaleX = Math.max(50, Math.min(220, initialConfig.scaleX + factor));
      updateStyle({ scaleX: newScaleX });
    } else if (dragMode === 'scale_height') {
      const factor = Math.round((deltaY / rect.height) * 200);
      const newScaleY = Math.max(50, Math.min(220, initialConfig.scaleY + factor));
      updateStyle({ scaleY: newScaleY });
    } else if (dragMode === 'rotate') {
      const currentAngle = Math.atan2(clientY - initialCenter.y, clientX - initialCenter.x) * (180 / Math.PI);
      let deltaAngle = Math.round(currentAngle - initialAngle);
      let newRot = Math.round(initialConfig.rotation + deltaAngle);
      while (newRot > 180) newRot -= 360;
      while (newRot < -180) newRot += 360;
      if (Math.abs(newRot) <= 2) newRot = 0;
      updateStyle({ rotation: Math.max(-60, Math.min(60, newRot)) });
    }
  };

  const handleEndDrag = () => {
    setDragMode('none');
    setShowSnapGuideX(false);
    setShowSnapGuideY(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragProcess(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchPinchDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = newDist / touchPinchDist;
      const newFontSize = Math.max(
        16,
        Math.min(84, Math.round((styleConfig.fontSize || 36) * ratio))
      );
      updateStyle({ fontSize: newFontSize });
      setTouchPinchDist(newDist);
    } else if (e.touches.length === 1 && dragMode !== 'none') {
      handleDragProcess(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setTouchPinchDist(null);
    handleEndDrag();
  };

  const handleWheelCaption = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 2 : -2;
    const newSize = Math.max(16, Math.min(84, (styleConfig.fontSize || 36) + delta));
    updateStyle({ fontSize: newSize });
  };

  const stepFontSize = (delta: number) => {
    const newSize = Math.max(16, Math.min(84, (styleConfig.fontSize || 36) + delta));
    updateStyle({ fontSize: newSize });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLong = metadata?.videoType === 'long';
  const posX = styleConfig.positionXPercent ?? 50;
  const posY = styleConfig.positionYPercent ?? (isLong ? 86 : 74);
  const scaleX = (styleConfig.scaleX || 100) / 100;
  const scaleY = (styleConfig.scaleY || 100) / 100;
  const rotation = styleConfig.rotation || 0;
  const fontSize = styleConfig.fontSize || (isLong ? 30 : 48);

  // Dynamic shadow calculation: crisp subtle depth without dark muddy blobs
  const isShadowEnabled =
    styleConfig.hasShadow === true &&
    (styleConfig.shadowBlur || 0) > 0;

  const shadowCss = isShadowEnabled
    ? `0 2px ${styleConfig.shadowBlur || 4}px ${styleConfig.shadowColor || 'rgba(0,0,0,0.85)'}`
    : 'none';

  // Dynamic solid 8-directional stroke calculation for razor-sharp outline
  const strokeWidth = styleConfig.strokeWidth ?? (isLong ? 2.5 : 4);
  const s = strokeWidth;
  const strokeColor = styleConfig.strokeColor || '#000000';
  const strokeCss =
    strokeWidth > 0
      ? `${s}px 0 0 ${strokeColor}, -${s}px 0 0 ${strokeColor}, 0 ${s}px 0 ${strokeColor}, 0 -${s}px 0 ${strokeColor}, ${s * 0.72}px ${s * 0.72}px 0 ${strokeColor}, -${s * 0.72}px ${s * 0.72}px 0 ${strokeColor}, ${s * 0.72}px -${s * 0.72}px 0 ${strokeColor}, -${s * 0.72}px -${s * 0.72}px 0 ${strokeColor}`
      : 'none';

  const isShort =
    metadata?.videoType === 'short' ||
    (metadata?.height || 1080) > (metadata?.width || 1920);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEndDrag}
      onMouseLeave={handleEndDrag}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center select-none"
    >
      {/* CAPCUT FLOATING QUICK HUD BAR */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 z-30 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Quick Font Size Buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => stepFontSize(-2)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="تصغير الخط"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-[11px] font-bold text-amber-400 px-1.5">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => stepFontSize(2)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="تكبير الخط"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Auto Position Pills */}
          <button
            type="button"
            onClick={() =>
              updateStyle({
                positionXPercent: 50,
                positionYPercent: 86,
                fontSize: 30,
                hasShadow: false,
                strokeWidth: 2.5,
              })
            }
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1 ${
              posY >= 84
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="تحت بالوسط ومقروءة (فيديو طويل)"
          >
            <Film className="w-3 h-3" />
            <span>طويل 86%</span>
          </button>

          <button
            type="button"
            onClick={() =>
              updateStyle({
                positionXPercent: 50,
                positionYPercent: 74,
                fontSize: 48,
                hasShadow: false,
                strokeWidth: 4,
              })
            }
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1 ${
              posY < 84
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="شورتس وريلز واضحة وكبيرة (74%)"
          >
            <Smartphone className="w-3 h-3" />
            <span>شورتس 74%</span>
          </button>

          <span className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded text-cyan-400 border border-slate-800 hidden md:inline-block">
            X:{posX}% Y:{posY}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Center */}
          <button
            type="button"
            onClick={() => updateStyle({ positionXPercent: 50, positionYPercent: isLong ? 88 : 72, rotation: 0 })}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition text-[11px] flex items-center gap-1"
            title="توسيط"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">توسيط</span>
          </button>

          {/* Quick Reset */}
          <button
            type="button"
            onClick={() =>
              updateStyle({
                scaleX: 100,
                scaleY: 100,
                rotation: 0,
                fontSize: isLong ? 24 : 36,
                hasShadow: false,
              })
            }
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition text-[11px] flex items-center gap-1"
            title="إعادة ضبط"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Sliders Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className={`p-1.5 rounded-lg transition text-[11px] flex items-center gap-1 ${
              isControlsExpanded
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="أشرطة التحكم"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QUICK SLIDERS DRAWER */}
      {isControlsExpanded && (
        <div className="w-full bg-slate-950/95 border-b border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 z-30 text-[11px] animate-fadeIn">
          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>العرض (Scale X):</span>
              <span className="text-cyan-400 font-bold">{styleConfig.scaleX || 100}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              value={styleConfig.scaleX || 100}
              onChange={(e) => updateStyle({ scaleX: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>الطول (Scale Y):</span>
              <span className="text-cyan-400 font-bold">{styleConfig.scaleY || 100}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              value={styleConfig.scaleY || 100}
              onChange={(e) => updateStyle({ scaleY: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>الموضع الرأسي (Y):</span>
              <span className="text-blue-400 font-bold">{posY}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={94}
              value={posY}
              onChange={(e) => updateStyle({ positionYPercent: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>تدوير النص:</span>
              <span className="text-purple-400 font-bold">{rotation}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={rotation}
              onChange={(e) => updateStyle({ rotation: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* VIDEO CANVAS & INTERACTIVE CAPCUT OVERLAY STAGE */}
      <div
        className={`relative w-full flex items-center justify-center bg-black overflow-hidden ${
          isShort ? 'aspect-[9/16] max-h-[580px]' : 'aspect-video max-h-[440px]'
        }`}
        onTouchStart={handleTouchStart}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* SNAPPING GUIDELINES */}
        {showSnapGuideX && (
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] border-l border-dashed border-cyan-300 z-20 pointer-events-none" />
        )}
        {showSnapGuideY && (
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] border-t border-dashed border-cyan-300 z-20 pointer-events-none" />
        )}

        {/* CAPCUT 2D INTERACTIVE BOUNDING BOX */}
        {activeCue && (
          <div
            ref={captionBoxRef}
            id="capcut-transform-box"
            onMouseEnter={() => setIsBoxHovered(true)}
            onMouseLeave={() => setIsBoxHovered(false)}
            onWheel={handleWheelCaption}
            className="absolute z-20 group transition-all duration-75"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'center center',
            }}
          >
            {/* CAPCUT BOUNDING FRAME */}
            <div
              className={`relative p-2 rounded-xl transition-all ${
                isBoxHovered || dragMode !== 'none'
                  ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/50 bg-blue-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'ring-1 ring-emerald-500/20'
              }`}
            >
              {/* TOP ROTATION PIN */}
              {(isBoxHovered || dragMode === 'rotate') && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-30">
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartRotate(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartRotate(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="w-6 h-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-xl border-2 border-white transform transition hover:scale-110 active:scale-95"
                    title="اسحب لتدوير النص"
                  >
                    <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="w-0.5 h-2.5 bg-emerald-400" />
                </div>
              )}

              {/* 4 CAPCUT CORNER HANDLES */}
              {(isBoxHovered || dragMode === 'scale_corner') && (
                <>
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] cursor-nwse-resize z-30 hover:scale-125 transition"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] cursor-nesw-resize z-30 hover:scale-125 transition"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] cursor-nesw-resize z-30 hover:scale-125 transition"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartCornerScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] cursor-nwse-resize z-30 hover:scale-125 transition"
                  />
                </>
              )}

              {/* 2 HORIZONTAL WIDTH HANDLES */}
              {(isBoxHovered || dragMode === 'scale_width') && (
                <>
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartWidthScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartWidthScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-2 h-7 bg-cyan-400 border border-white rounded-full shadow-[0_0_6px_rgba(34,211,238,0.7)] cursor-ew-resize z-30 hover:scale-125 transition"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartWidthScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartWidthScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-2 h-7 bg-cyan-400 border border-white rounded-full shadow-[0_0_6px_rgba(34,211,238,0.7)] cursor-ew-resize z-30 hover:scale-125 transition"
                  />
                </>
              )}

              {/* 2 VERTICAL HEIGHT HANDLES */}
              {(isBoxHovered || dragMode === 'scale_height') && (
                <>
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartHeightScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartHeightScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-2 w-7 bg-cyan-400 border border-white rounded-full shadow-[0_0_6px_rgba(34,211,238,0.7)] cursor-ns-resize z-30 hover:scale-125 transition"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartHeightScale(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartHeightScale(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-2 w-7 bg-cyan-400 border border-white rounded-full shadow-[0_0_6px_rgba(34,211,238,0.7)] cursor-ns-resize z-30 hover:scale-125 transition"
                  />
                </>
              )}

              {/* CENTER DRAG BODY */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleStartMove(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleStartMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                className="cursor-move text-center font-black px-3 py-1.5 rounded-xl select-none max-w-[90vw] sm:max-w-[480px] transition-transform"
                style={{
                  fontFamily: styleConfig.fontFamily || 'Cairo',
                  fontSize: `${fontSize}px`,
                  fontWeight: 900,
                  lineHeight: styleConfig.lineHeight || 1.35,
                  letterSpacing: `${styleConfig.letterSpacing || 0}px`,
                  color: styleConfig.primaryColor,
                  backgroundColor:
                    styleConfig.textTransform === 'box' && styleConfig.backgroundOpacity > 10
                      ? styleConfig.backgroundColor
                      : 'transparent',
                  textShadow:
                    isShadowEnabled && strokeWidth > 0
                      ? `${strokeCss}, ${shadowCss}`
                      : strokeWidth > 0
                      ? strokeCss
                      : isShadowEnabled
                      ? shadowCss
                      : 'none',
                }}
              >
                {/* Word by word rendering with dynamic word effects */}
                {activeCue.words && activeCue.words.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    {activeCue.words.map((w, idx) => {
                      const isWordActive =
                        currentTime >= w.start && currentTime <= w.end;
                      const isViralHighlighted =
                        styleConfig.styleType === 'viral' && (idx % 2 === 1 || w.highlight);
                      const isHighlighted = isWordActive || isViralHighlighted;

                      // Dynamic color cycle for 'color_wave'
                      const waveColors = ['#38BDF8', '#34D399', '#FACC15', '#F472B6', '#A78BFA'];
                      const wordWaveColor = waveColors[idx % waveColors.length];

                      let wordColor = styleConfig.primaryColor;
                      if (styleConfig.wordEffect === 'color_wave') {
                        wordColor = isWordActive ? '#FFFFFF' : wordWaveColor;
                      } else if (isHighlighted) {
                        wordColor = styleConfig.highlightColor || '#FACC15';
                      }

                      // Dynamic scaling for pop_active
                      const isPopping = isWordActive && styleConfig.wordEffect === 'pop_active';
                      const isGlowing = isWordActive && styleConfig.wordEffect === 'glow_active';
                      const isBoxed = isWordActive && styleConfig.wordEffect === 'box_active';

                      return (
                        <span
                          key={idx}
                          className="inline-block transition-all duration-100 rounded px-1"
                          style={{
                            color: isBoxed ? '#000000' : wordColor,
                            backgroundColor: isBoxed ? (styleConfig.highlightColor || '#FACC15') : 'transparent',
                            transform: isPopping ? 'scale(1.22) translateY(-2px)' : isWordActive ? 'scale(1.08)' : 'scale(1)',
                            fontWeight: isWordActive ? 900 : 800,
                            textShadow: isGlowing
                              ? `0 0 14px ${styleConfig.highlightColor || '#38BDF8'}`
                              : undefined,
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="block leading-relaxed">{activeCue.text}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIDEO BOTTOM TIMELINE CONTROLS */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md p-3 border-t border-slate-800 flex flex-col gap-2 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <span className="text-[11px] font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline text-[11px]">
              {isLong ? 'مضبوط تلقائياً للفيديو الطويل (تحت بالوسط)' : 'مضبوط تلقائياً للشورتس والريلز'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
