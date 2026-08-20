import { CaptionCue, CaptionStyleConfig, VideoMetadata } from '../types';

export interface RenderProgressCallback {
  (progress: number, stage: string): void;
}

/**
 * High-performance In-Browser Video Subtitle Burner
 * Uses HTML5 Canvas + AudioContext + MediaRecorder to bake subtitles directly in any browser
 * 100% reliable, zero backend worker required.
 */
export async function renderVideoInBrowser(
  videoSourceUrl: string,
  captions: CaptionCue[],
  styleConfig: CaptionStyleConfig,
  metadata?: VideoMetadata,
  onProgress?: RenderProgressCallback
): Promise<{ blob: Blob; url: string; filename: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      if (onProgress) onProgress(5, 'جاري تحضير محرك الرندر المباشر...');

      // 1. Create hidden video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoSourceUrl;
      video.muted = false;
      video.playsInline = true;
      video.preload = 'auto';

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('فشل تحميل الفيديو في المتصفح.'));
      });

      const videoDuration = video.duration || metadata?.duration || 10;

      // 1. Calculate Target Dimensions according to aspect ratio and resolution
      const exportAspect = metadata?.exportAspectRatio || (metadata?.videoType === 'long' ? '16:9' : '9:16');
      const exportRes = metadata?.exportResolution || '1080p';
      const fitMode = metadata?.exportFitMode || 'contain';

      let targetWidth = 1080;
      let targetHeight = 1920;

      if (exportAspect === '9:16') {
        if (exportRes === '4k') { targetWidth = 2160; targetHeight = 3840; }
        else if (exportRes === '720p') { targetWidth = 720; targetHeight = 1280; }
        else { targetWidth = 1080; targetHeight = 1920; }
      } else if (exportAspect === '16:9') {
        if (exportRes === '4k') { targetWidth = 3840; targetHeight = 2160; }
        else if (exportRes === '720p') { targetWidth = 1280; targetHeight = 720; }
        else { targetWidth = 1920; targetHeight = 1080; }
      } else if (exportAspect === '1:1') {
        if (exportRes === '4k') { targetWidth = 2160; targetHeight = 2160; }
        else if (exportRes === '720p') { targetWidth = 720; targetHeight = 720; }
        else { targetWidth = 1080; targetHeight = 1080; }
      } else if (exportAspect === '4:5') {
        if (exportRes === '4k') { targetWidth = 2160; targetHeight = 2700; }
        else if (exportRes === '720p') { targetWidth = 720; targetHeight = 900; }
        else { targetWidth = 1080; targetHeight = 1350; }
      } else {
        // Original aspect ratio
        const origW = video.videoWidth || metadata?.width || 1080;
        const origH = video.videoHeight || metadata?.height || 1920;
        const scale = exportRes === '4k' ? 2 : exportRes === '720p' ? 0.666 : 1;
        targetWidth = Math.round(origW * scale);
        targetHeight = Math.round(origH * scale);
      }

      // 2. Setup Canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('متصفحك لا يدعم تسريع الرسوميات 2D Canvas.');
      }

      if (onProgress) onProgress(15, 'جاري تهيئة مسارات الصوت والصورة...');

      // 3. Audio setup
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      let audioContext: AudioContext | null = null;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          const audioSource = audioContext.createMediaElementSource(video);
          audioDestination = audioContext.createMediaStreamDestination();
          audioSource.connect(audioDestination);
          audioSource.connect(audioContext.destination);
        }
      } catch (audioErr) {
        console.warn('AudioContext capture not supported or restricted:', audioErr);
      }

      // 4. Setup MediaRecorder
      const canvasStream = canvas.captureStream(30);
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        const audioTrack = audioDestination.stream.getAudioTracks()[0];
        canvasStream.addTrack(audioTrack);
      }

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(canvasStream, recorderOptions);
      const recordedChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(() => {});
        }
        const outputBlob = new Blob(recordedChunks, { type: mimeType || 'video/mp4' });
        const outputUrl = URL.createObjectURL(outputBlob);

        // Sanitize and construct custom filename
        let cleanCustomName = (metadata?.customFilename || '').trim();
        if (cleanCustomName) {
          cleanCustomName = cleanCustomName.replace(/[\\/:*?"<>|]/g, '_');
          if (!cleanCustomName.toLowerCase().endsWith('.mp4')) {
            cleanCustomName += '.mp4';
          }
        } else {
          cleanCustomName = `IslamView_${metadata?.videoType || 'video'}_${Date.now()}.mp4`;
        }

        if (onProgress) onProgress(100, 'اكتمل التصدير بنجاح!');
        resolve({ blob: outputBlob, url: outputUrl, filename: cleanCustomName });
      };

      // 5. Draw Frame function
      const renderFrame = () => {
        if (video.paused || video.ended) return;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const vW = video.videoWidth || targetWidth;
        const vH = video.videoHeight || targetHeight;

        if (fitMode === 'cover') {
          // Fill whole screen, crop overflow
          const vAspect = vW / vH;
          const cAspect = targetWidth / targetHeight;
          let drawW = targetWidth;
          let drawH = targetHeight;
          let drawX = 0;
          let drawY = 0;

          if (vAspect > cAspect) {
            drawH = targetHeight;
            drawW = targetHeight * vAspect;
            drawX = (targetWidth - drawW) / 2;
          } else {
            drawW = targetWidth;
            drawH = targetWidth / vAspect;
            drawY = (targetHeight - drawH) / 2;
          }
          ctx.drawImage(video, drawX, drawY, drawW, drawH);
        } else if (fitMode === 'blur_padding') {
          // Blurred background + contained foreground
          ctx.save();
          ctx.filter = 'blur(20px) brightness(0.7)';
          ctx.drawImage(video, -20, -20, targetWidth + 40, targetHeight + 40);
          ctx.restore();

          const vAspect = vW / vH;
          const cAspect = targetWidth / targetHeight;
          let drawW = targetWidth;
          let drawH = targetHeight;
          let drawX = 0;
          let drawY = 0;

          if (vAspect > cAspect) {
            drawW = targetWidth;
            drawH = targetWidth / vAspect;
            drawY = (targetHeight - drawH) / 2;
          } else {
            drawH = targetHeight;
            drawW = targetHeight * vAspect;
            drawX = (targetWidth - drawW) / 2;
          }
          ctx.drawImage(video, drawX, drawY, drawW, drawH);
        } else {
          // Standard contain with letterbox
          const vAspect = vW / vH;
          const cAspect = targetWidth / targetHeight;
          let drawW = targetWidth;
          let drawH = targetHeight;
          let drawX = 0;
          let drawY = 0;

          if (vAspect > cAspect) {
            drawW = targetWidth;
            drawH = targetWidth / vAspect;
            drawY = (targetHeight - drawH) / 2;
          } else {
            drawH = targetHeight;
            drawW = targetHeight * vAspect;
            drawX = (targetWidth - drawW) / 2;
          }
          ctx.drawImage(video, drawX, drawY, drawW, drawH);
        }

        const currentTime = video.currentTime;
        const currentProgress = Math.min(95, Math.round((currentTime / videoDuration) * 80) + 15);
        if (onProgress) {
          onProgress(
            currentProgress,
            `جاري حرق وتصدير الإطارات (${Math.round(currentTime)}ث / ${Math.round(videoDuration)}ث)...`
          );
        }

        // Find active cue
        const activeCue = captions.find(
          (c) => currentTime >= c.start && currentTime <= c.end
        );

        if (activeCue) {
          drawCaptionOnCanvas(ctx, activeCue, currentTime, styleConfig, targetWidth, targetHeight);
        }

        requestAnimationFrame(renderFrame);
      };

      // 6. Start Recording
      recorder.start(100);
      video.currentTime = 0;
      await video.play();
      renderFrame();

      video.onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      video.onerror = (err) => {
        if (recorder.state === 'recording') recorder.stop();
        reject(new Error('حدث خطأ أثناء تشغيل الفيديو ورسم الإطارات.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Canvas Caption Drawing Engine with Full Arabic & Word Highlight Effects
 */
function drawCaptionOnCanvas(
  ctx: CanvasRenderingContext2D,
  cue: CaptionCue,
  currentTime: number,
  style: CaptionStyleConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  // Position calculation
  const isLong = canvasWidth >= canvasHeight;
  const posXPercent = style.positionXPercent ?? 50;
  const posYPercent = style.positionYPercent ?? (isLong ? 86 : 74);
  const centerX = (posXPercent / 100) * canvasWidth;
  const centerY = (posYPercent / 100) * canvasHeight;

  const scaleX = (style.scaleX || 100) / 100;
  const scaleY = (style.scaleY || 100) / 100;
  const rotationRad = ((style.rotation || 0) * Math.PI) / 180;

  // Scale font size proportionally for canvas resolution with bolder Arabic weight
  const scaleFactor = canvasWidth / (isLong ? 1280 : 720);
  const defaultFontSize = isLong ? 30 : 48;
  const fontSize = Math.round((style.fontSize || defaultFontSize) * scaleFactor);

  ctx.translate(centerX, centerY);
  if (rotationRad !== 0) ctx.rotate(rotationRad);
  ctx.scale(scaleX, scaleY);

  ctx.font = `900 ${fontSize}px "${style.fontFamily || 'Cairo'}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  const text = cue.text;
  const words = cue.words && cue.words.length > 0 ? cue.words : [{ word: text, start: cue.start, end: cue.end }];

  // Measure text width for background box
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const boxPaddingX = fontSize * 0.45;
  const boxPaddingY = fontSize * 0.25;
  const boxWidth = textWidth + boxPaddingX * 2;
  const boxHeight = fontSize * (style.lineHeight || 1.35) + boxPaddingY * 2;

  // Background Box
  if (style.textTransform === 'box' && style.backgroundOpacity > 5) {
    ctx.fillStyle = style.backgroundColor || `rgba(0, 0, 0, ${(style.backgroundOpacity / 100).toFixed(2)})`;
    const radius = Math.min(12 * scaleFactor, boxHeight / 4);
    roundRect(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, radius);
    ctx.fill();
  }

  // Text Shadow (Only if enabled)
  const isShadowEnabled = style.hasShadow !== false && (style.shadowBlur || 0) > 0;
  if (isShadowEnabled) {
    ctx.shadowColor = style.shadowColor || 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.min(16, (style.shadowBlur || 4) * scaleFactor);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * scaleFactor;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Stroke / Outline
  const strokeWidth = (style.strokeWidth ?? (isLong ? 2.5 : 4)) * scaleFactor;
  if (strokeWidth > 0) {
    ctx.strokeStyle = style.strokeColor || '#000000';
    ctx.lineWidth = strokeWidth * 2;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
  }

  // Word-by-word drawing
  const totalWords = words.length;
  if (totalWords <= 1 || style.wordEffect === 'classic') {
    // Single block render
    if (strokeWidth > 0) {
      ctx.strokeText(text, 0, 0);
    }
    ctx.fillStyle = style.primaryColor || '#FFFFFF';
    ctx.fillText(text, 0, 0);
  } else {
    // Word by word layout
    // Compute positions of each word in RTL
    let currentX = textWidth / 2;

    for (let i = 0; i < totalWords; i++) {
      const w = words[i];
      const isWordActive = currentTime >= w.start && currentTime <= w.end;
      const isViralHigh = style.styleType === 'viral' && (i % 2 === 1 || w.highlight);
      const isHighlighted = isWordActive || isViralHigh;

      const wordWidth = ctx.measureText(w.word).width;
      const spaceWidth = ctx.measureText(' ').width;
      const wordCenterX = currentX - wordWidth / 2;

      ctx.save();
      ctx.translate(wordCenterX, 0);

      // Pop / Bounce active word animation
      if (isWordActive && style.wordEffect === 'pop_active') {
        ctx.scale(1.15, 1.15);
      }

      // Word Box Capsule
      if (isWordActive && style.wordEffect === 'box_active') {
        ctx.fillStyle = style.highlightColor || '#FACC15';
        roundRect(ctx, -wordWidth / 2 - 6, -fontSize * 0.6, wordWidth + 12, fontSize * 1.2, 6);
        ctx.fill();
      }

      // Stroke
      if (strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor || '#000000';
        ctx.strokeText(w.word, 0, 0);
      }

      // Word Fill Color
      if (isHighlighted) {
        ctx.fillStyle = isWordActive && style.wordEffect === 'box_active' ? '#000000' : style.highlightColor || '#FACC15';
      } else {
        ctx.fillStyle = style.primaryColor || '#FFFFFF';
      }

      ctx.fillText(w.word, 0, 0);
      ctx.restore();

      currentX -= wordWidth + spaceWidth;
    }
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
