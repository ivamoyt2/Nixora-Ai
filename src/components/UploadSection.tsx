import React, { useRef, useState } from 'react';
import { Upload, Film, FileVideo, AlertCircle, Play, Sparkles } from 'lucide-react';
import { VideoMetadata, VideoType } from '../types';

interface UploadSectionProps {
  onVideoSelected: (file: File, metadata?: VideoMetadata) => void;
  isUploading: boolean;
  progressText?: string;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onVideoSelected,
  isUploading,
  progressText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMsg(null);

    const validExtensions = ['mp4', 'mov', 'webm', 'mkv'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(fileExt) && !file.type.startsWith('video/')) {
      setErrorMsg('صيغة الملف غير مدعومة. يرجى اختيار ملف فيديو بصيغة MP4 أو MOV أو WebM.');
      return;
    }

    if (file.size > 2048 * 1024 * 1024) {
      setErrorMsg('حجم الملف كبير جداً (أكثر من 2 غيغابايت).');
      return;
    }

    const videoElem = document.createElement('video');
    videoElem.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);
    videoElem.src = blobUrl;

    videoElem.onloadedmetadata = () => {
      const width = videoElem.videoWidth || 1080;
      const height = videoElem.videoHeight || 1920;
      const duration = Number(videoElem.duration.toFixed(1)) || 10;
      const isShort = height > width;
      const videoType: VideoType = isShort ? 'short' : 'long';
      const aspectRatio = isShort ? '9:16' : '16:9';

      const metadata: VideoMetadata = {
        name: file.name,
        size: file.size,
        duration,
        width,
        height,
        mimeType: file.type || 'video/mp4',
        aspectRatio,
        videoType,
      };

      URL.revokeObjectURL(blobUrl);
      onVideoSelected(file, metadata);
    };

    videoElem.onerror = () => {
      const metadata: VideoMetadata = {
        name: file.name,
        size: file.size,
        duration: 30,
        width: 1080,
        height: 1920,
        mimeType: file.type || 'video/mp4',
        aspectRatio: '9:16',
        videoType: 'short',
      };
      URL.revokeObjectURL(blobUrl);
      onVideoSelected(file, metadata);
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Generate Sample Video directly in browser for 1-click test
  const handleCreateSampleVideo = async (sampleType: 'short' | 'long') => {
    setErrorMsg(null);
    try {
      const canvas = document.createElement('canvas');
      const width = sampleType === 'short' ? 720 : 1280;
      const height = sampleType === 'short' ? 1280 : 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const dest = audioCtx.createMediaStreamDestination();

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);
      osc1.start();
      osc2.start();

      const videoStream = canvas.captureStream(30);
      const audioTracks = dest.stream.getAudioTracks();
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = 8000;
      const startTime = performance.now();

      const drawFrame = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(1, elapsed / (durationMs / 1000));

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 3;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(elapsed * 0.2);
        for (let i = 0; i < 8; i++) {
          ctx.rotate((Math.PI * 2) / 8);
          ctx.strokeRect(-radius / 2, -radius / 2, radius, radius);
        }
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(width * 0.045)}px 'Cairo', sans-serif`;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillText('فيديو تجريبي - Nexora AI', centerX, centerY - 60);

        ctx.fillStyle = '#38bdf8';
        ctx.font = `${Math.round(width * 0.035)}px 'Cairo', sans-serif`;
        ctx.fillText(sampleType === 'short' ? 'فيديو عمودي (9:16 Reel)' : 'فيديو أفقي (16:9 Wide)', centerX, centerY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${Math.round(width * 0.028)}px 'Cairo', sans-serif`;
        ctx.fillText('تفريغ الكابشن العربي بدقة متناهية', centerX, centerY + 60);

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(50, height - 40, width - 100, 10);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(50, height - 40, (width - 100) * progress, 10);

        if (elapsed < durationMs / 1000) {
          requestAnimationFrame(drawFrame);
        }
      };

      recorder.start();
      requestAnimationFrame(drawFrame);

      setTimeout(() => {
        recorder.stop();
        osc1.stop();
        osc2.stop();
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const file = new File([blob], sampleType === 'short' ? 'Sample_Nexora_Short.webm' : 'Sample_Nexora_Long.webm', {
            type: 'video/webm',
          });

          const metadata: VideoMetadata = {
            name: file.name,
            size: file.size,
            duration: 8,
            width,
            height,
            mimeType: 'video/webm',
            aspectRatio: sampleType === 'short' ? '9:16' : '16:9',
            videoType: sampleType,
          };

          onVideoSelected(file, metadata);
        };
      }, durationMs);
    } catch (e: any) {
      console.error('Error generating sample:', e);
      setErrorMsg('حدث خطأ أثناء إنشاء الفيديو التجريبي: ' + e.message);
    }
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Area */}
      <div
        id="dropzone-video"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 group shadow-2xl ${
          dragActive
            ? 'border-blue-400 bg-blue-950/40 scale-[1.01]'
            : 'border-slate-800 hover:border-blue-500/70 bg-slate-950 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600/20 transition-transform shadow-lg">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              اسحب وأفلت ملف الفيديو هنا أو <span className="text-blue-400 underline underline-offset-4">تصفح من جهازك</span>
            </h3>
            <p className="text-sm text-slate-400">
              يدعم ملفات: <span className="text-slate-300 font-mono">MP4, MOV, WebM, MKV</span> حتى 2 غيغابايت
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-900 w-full max-w-md">
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-blue-400" />
              <span>فيديوهات أفقية 16:9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileVideo className="w-4 h-4 text-cyan-400" />
              <span>Shorts & Reels 9:16</span>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/95 rounded-3xl flex flex-col items-center justify-center p-6 z-20 backdrop-blur-md">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
            <p className="text-white font-bold text-sm">جاري رفع ومعالجة الفيديو في الخادم...</p>
            <p className="text-blue-300 text-xs mt-1 font-mono">
              {progressText || 'استخراج الصوت وتحديد أبعاد ودقة المشاهد'}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-blue-950/80 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>ليس لديك فيديو جاهز؟ يمكنك تجربة عينة فورية بنقرة واحدة:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-sample-short"
            type="button"
            onClick={() => handleCreateSampleVideo('short')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-blue-300 hover:text-white text-xs font-bold border border-blue-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>عينة Reel عمودي</span>
          </button>
          <button
            id="btn-sample-long"
            type="button"
            onClick={() => handleCreateSampleVideo('long')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>عينة فيديو أفقي 16:9</span>
          </button>
        </div>
      </div>
    </div>
  );
};
