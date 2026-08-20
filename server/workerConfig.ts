import fs from "fs";
import path from "path";

// Centralized Python Local Worker URL Configuration
export const DEFAULT_LOCAL_WORKER_URL =
  process.env.LOCAL_WORKER_URL || "http://127.0.0.1:8765";

export interface WorkerStatus {
  online: boolean;
  worker?: string;
  ffmpeg?: boolean;
  ffmpegPath?: string;
  status?: string;
  url: string;
  error?: string;
}

/**
 * Check if the Python Local Worker (http://127.0.0.1:8765) is running and reachable on Windows.
 */
// Cache worker health check to avoid repeated network latency
let cachedWorkerHealth: { result: WorkerStatus; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000;

export async function checkWorkerHealth(
  workerUrl = DEFAULT_LOCAL_WORKER_URL,
  forceFresh = false
): Promise<WorkerStatus> {
  const cleanUrl = workerUrl.replace(/\/+$/, "");
  const now = Date.now();

  if (!forceFresh && cachedWorkerHealth && now - cachedWorkerHealth.timestamp < CACHE_TTL_MS && cachedWorkerHealth.result.url === cleanUrl) {
    return cachedWorkerHealth.result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400); // 400ms max for local probe

    let res: Response;
    try {
      res = await fetch(`${cleanUrl}/health`, { signal: controller.signal });
    } catch {
      try {
        res = await fetch(`${cleanUrl}/status`, { signal: controller.signal });
      } catch {
        res = await fetch(`${cleanUrl}/`, { signal: controller.signal });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const result: WorkerStatus = {
        online: true,
        status: data.status || "online",
        worker: data.worker || "IslamViewWorker",
        ffmpeg: data.ffmpeg ?? true,
        ffmpegPath: data.ffmpegPath || "C:\\ffmpeg\\bin\\ffmpeg.exe",
        url: cleanUrl,
      };
      cachedWorkerHealth = { result, timestamp: now };
      return result;
    } else {
      const result: WorkerStatus = {
        online: false,
        url: cleanUrl,
        error: `استجاب Python Worker بحالة غير صحيحة: ${res.status}`,
      };
      cachedWorkerHealth = { result, timestamp: now };
      return result;
    }
  } catch {
    const result: WorkerStatus = {
      online: false,
      url: cleanUrl,
      error: "شغّل Islam View Worker على جهازك أولًا.",
    };
    cachedWorkerHealth = { result, timestamp: now };
    return result;
  }
}

/**
 * Send video to the Python Local Worker on Windows to extract audio using C:\ffmpeg\bin\ffmpeg.exe.
 */
export async function extractAudioViaWorker(
  videoPath: string,
  outputAudioPath: string,
  workerUrl = DEFAULT_LOCAL_WORKER_URL
): Promise<{ success: boolean; hasAudio: boolean; error?: string }> {
  const cleanUrl = workerUrl.replace(/\/+$/, "");
  const health = await checkWorkerHealth(cleanUrl);

  if (!health.online) {
    return {
      success: false,
      hasAudio: false,
      error: "شغّل Islam View Worker على جهازك أولًا.",
    };
  }

  try {
    const videoBuffer = fs.readFileSync(videoPath);
    const videoBlob = new Blob([videoBuffer]);
    const formData = new FormData();
    formData.append("video", videoBlob, path.basename(videoPath));
    formData.append("file", videoBlob, path.basename(videoPath)); // FastAPI compatibility

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/extract-audio`, {
        method: "POST",
        body: formData,
      });
    } catch {
      response = await fetch(`${cleanUrl}/audio/extract`, {
        method: "POST",
        body: formData,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error || json.detail || errText;
      } catch {}

      if (parsedErr.includes("لا يحتوي على مسار صوتي") || response.status === 422) {
        return {
          success: false,
          hasAudio: false,
          error: "هذا الفيديو لا يحتوي على مسار صوتي.",
        };
      }

      throw new Error(`فشل استخراج الصوت عبر Python Local Worker: ${parsedErr}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    if (audioBuffer.length === 0) {
      return {
        success: false,
        hasAudio: false,
        error: "هذا الفيديو لا يحتوي على مسار صوتي.",
      };
    }

    // Ensure output directory exists
    const parentDir = path.dirname(outputAudioPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(outputAudioPath, audioBuffer);

    return {
      success: true,
      hasAudio: true,
    };
  } catch (err: any) {
    console.error("[PythonWorker] Audio extraction error:", err);
    return {
      success: false,
      hasAudio: true,
      error: err.message || "شغّل Islam View Worker على جهازك أولًا.",
    };
  }
}

/**
 * Send video and subtitle files to the Python Local Worker on Windows to burn captions using C:\ffmpeg\bin\ffmpeg.exe.
 */
export async function renderVideoViaWorker(
  videoPath: string,
  assPath: string,
  srtPath: string,
  outputVideoPath: string,
  metadata?: any,
  workerUrl = DEFAULT_LOCAL_WORKER_URL
): Promise<{ success: boolean; error?: string }> {
  const cleanUrl = workerUrl.replace(/\/+$/, "");
  const health = await checkWorkerHealth(cleanUrl);

  if (!health.online) {
    throw new Error("شغّل Islam View Worker على جهازك أولًا.");
  }

  try {
    const videoBuffer = fs.readFileSync(videoPath);
    const assContent = fs.readFileSync(assPath, "utf-8");
    const srtContent = fs.existsSync(srtPath) ? fs.readFileSync(srtPath, "utf-8") : "";

    const formData = new FormData();
    const videoBlob = new Blob([videoBuffer]);
    formData.append("video", videoBlob, path.basename(videoPath));
    formData.append("file", videoBlob, path.basename(videoPath)); // FastAPI compatibility

    // Support multiple field conventions used in Python workers (FastAPI / Flask)
    formData.append("subtitlesAss", assContent);
    formData.append("subtitles_ass", assContent);
    formData.append("subtitlesSrt", srtContent);
    formData.append("subtitles_srt", srtContent);

    // Also attach as virtual files for endpoints expecting UploadFile
    formData.append("ass_file", new Blob([assContent], { type: "text/plain" }), "subtitles.ass");
    if (srtContent) {
      formData.append("srt_file", new Blob([srtContent], { type: "text/plain" }), "subtitles.srt");
    }

    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    console.log(`[PythonWorker] Sending render request to ${cleanUrl}/render...`);

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/render`, {
        method: "POST",
        body: formData,
      });
    } catch {
      response = await fetch(`${cleanUrl}/render-video`, {
        method: "POST",
        body: formData,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error || json.detail || errText;
      } catch {}
      throw new Error(`فشل رندر الفيديو بواسطة FFmpeg على Python Worker: ${parsedErr}`);
    }

    const videoArrayBuffer = await response.arrayBuffer();
    const renderedVideoBuffer = Buffer.from(videoArrayBuffer);

    if (renderedVideoBuffer.length === 0) {
      throw new Error("استلم التطبيق ملف فيديو فارغ من Python Worker.");
    }

    // Ensure parent final directory exists
    const parentDir = path.dirname(outputVideoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(outputVideoPath, renderedVideoBuffer);

    // Verify file exists on disk and has valid size
    if (!fs.existsSync(outputVideoPath) || fs.statSync(outputVideoPath).size === 0) {
      throw new Error("فشل حفظ ملف الفيديو الناتج من Python Worker.");
    }

    console.log(`[PythonWorker] Successfully received and verified rendered video (${(renderedVideoBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    return { success: true };
  } catch (err: any) {
    console.error("[PythonWorker] Render error:", err);
    throw new Error(err.message || "شغّل Islam View Worker على جهازك أولًا.");
  }
}

/**
 * Send numbered image and audio pairs to the Python Local Worker on Windows to render the automated montage video.
 */
export async function renderMontageViaWorker(
  pairs: Array<{ index: number; imagePath: string; audioPath: string; sfxPath?: string }>,
  settings: any,
  outputVideoPath: string,
  bgmPath?: string,
  workerUrl = DEFAULT_LOCAL_WORKER_URL
): Promise<{ success: boolean; error?: string }> {
  const cleanUrl = workerUrl.replace(/\/+$/, "");
  const health = await checkWorkerHealth(cleanUrl);

  if (!health.online) {
    throw new Error("شغّل Islam View Worker على جهازك أولًا.");
  }

  try {
    const formData = new FormData();
    formData.append("settings", JSON.stringify(settings || {}));

    for (const pair of pairs) {
      if (fs.existsSync(pair.imagePath) && fs.existsSync(pair.audioPath)) {
        const imgBuffer = fs.readFileSync(pair.imagePath);
        const audBuffer = fs.readFileSync(pair.audioPath);

        const imgBlob = new Blob([imgBuffer]);
        const audBlob = new Blob([audBuffer]);

        formData.append(`image_${pair.index}`, imgBlob, path.basename(pair.imagePath));
        formData.append(`audio_${pair.index}`, audBlob, path.basename(pair.audioPath));

        if (pair.sfxPath && fs.existsSync(pair.sfxPath)) {
          const sfxBuffer = fs.readFileSync(pair.sfxPath);
          const sfxBlob = new Blob([sfxBuffer]);
          formData.append(`sfx_${pair.index}`, sfxBlob, path.basename(pair.sfxPath));
        }
      }
    }

    if (bgmPath && fs.existsSync(bgmPath)) {
      const bgmBuffer = fs.readFileSync(bgmPath);
      const bgmBlob = new Blob([bgmBuffer]);
      formData.append("bgm", bgmBlob, path.basename(bgmPath));
    }

    console.log(`[PythonWorker] Sending montage render request for ${pairs.length} pairs to ${cleanUrl}/montage...`);

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/montage`, {
        method: "POST",
        body: formData,
      });
    } catch {
      response = await fetch(`${cleanUrl}/render-montage`, {
        method: "POST",
        body: formData,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error || json.detail || errText;
      } catch {}
      throw new Error(`فشل مونتاج الفيديو بواسطة FFmpeg على Python Worker: ${parsedErr}`);
    }

    const videoArrayBuffer = await response.arrayBuffer();
    const renderedVideoBuffer = Buffer.from(videoArrayBuffer);

    if (renderedVideoBuffer.length === 0) {
      throw new Error("استلم التطبيق ملف فيديو فارغ من Python Worker.");
    }

    const parentDir = path.dirname(outputVideoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(outputVideoPath, renderedVideoBuffer);

    if (!fs.existsSync(outputVideoPath) || fs.statSync(outputVideoPath).size === 0) {
      throw new Error("فشل حفظ ملف الفيديو الناتج من Python Worker.");
    }

    console.log(`[PythonWorker] Montage Video Rendered Successfully (${(renderedVideoBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    return { success: true };
  } catch (err: any) {
    console.error("[PythonWorker] Montage error:", err);
    throw new Error(err.message || "شغّل Islam View Worker على جهازك أولًا.");
  }
}
