import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  createProject,
  getProjectPaths,
  generateFinalFilename,
  cleanupTemporaryFiles,
} from "./server/projectManager";
import {
  extractVideoMetadata,
  extractAudio,
  checkHasAudio,
  generateAssSubtitles,
  generateSrtSubtitles,
  renderVideoWithCaptions,
  renderMontageVideo,
  getAudioDuration,
} from "./server/ffmpegService";
import {
  checkWorkerHealth,
  extractAudioViaWorker,
  renderVideoViaWorker,
  renderMontageViaWorker,
  DEFAULT_LOCAL_WORKER_URL,
} from "./server/workerConfig";
import { transcribeArabicAudio } from "./server/geminiService";
import { CaptionCue, CaptionStyleConfig } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON & forms
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Configure Multer for video and audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawProjectId = (req.headers["x-project-id"] as string) || (req.body?.projectId as string) || `proj_${Date.now()}`;
    const cleanProjectId = rawProjectId.replace(/[^a-zA-Z0-9_-]/g, "_");
    (req as any).projectId = cleanProjectId;
    const paths = createProject(cleanProjectId);
    if (file.fieldname === "audio") {
      cb(null, paths.audioDir);
    } else {
      cb(null, paths.originalDir);
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === "audio") {
      const ext = path.extname(file.originalname).toLowerCase() || ".wav";
      cb(null, `extracted${ext}`);
    } else {
      const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.includes("webm") ? ".webm" : ".mp4");
      const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, "_") || "video";
      cb(null, `${base}_${Date.now()}${ext}`);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2048 * 1024 * 1024 }, // 2GB (2048MB)
  fileFilter: (req, file, cb) => {
    const allowed = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v", ".ts", ".mp3", ".wav", ".aac", ".m4a", ".ogg"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (
      allowed.includes(ext) ||
      (file.mimetype && (file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/"))) ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع ملف فيديو أو صوت صالح."));
    }
  },
});

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & System Status
app.get("/api/system-status", (req, res) => {
  res.json({
    status: "ok",
    appName: "Islam View Caption Studio",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    workerUrl: DEFAULT_LOCAL_WORKER_URL,
    port: PORT,
  });
});

// 1.1 Local Worker Health Check Endpoint (http://127.0.0.1:8765)
app.get("/api/worker-status", async (req, res) => {
  const workerUrl = (req.query.url as string) || DEFAULT_LOCAL_WORKER_URL;
  const status = await checkWorkerHealth(workerUrl);
  res.json(status);
});

// 2. Upload Video & Audio
const uploadFields = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

app.post("/api/upload", (req, res) => {
  uploadFields(req, res, async (err: any) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({
        error:
          err.code === "LIMIT_FILE_SIZE"
            ? "حجم ملف الفيديو كبير جداً (الحد الأقصى 2 غيغابايت)."
            : err.message || "فشل استقبال ملف الفيديو.",
      });
    }

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const videoFile = files?.["video"]?.[0];
      const audioFile = files?.["audio"]?.[0];

      if (!videoFile && !audioFile) {
        return res.status(400).json({ error: "لم يتم استلام أي ملف فيديو أو صوت." });
      }

      const projectId = (req as any).projectId || `proj_${Date.now()}`;
      const paths = getProjectPaths(projectId);

      // Parse metadata from request body if available
      let metadata: any = null;
      if (req.body?.metadata) {
        try {
          metadata = typeof req.body.metadata === "string" ? JSON.parse(req.body.metadata) : req.body.metadata;
        } catch {}
      }

      // Check if Python Local Worker is online
      const workerStatus = await checkWorkerHealth();
      let hasAudio = true;

      // Handle video file if provided
      if (videoFile) {
        const videoPath = videoFile.path;
        if (!metadata) {
          metadata = await extractVideoMetadata(videoPath);
        }

        // If audio wasn't uploaded separately, extract it from the video
        if (!audioFile) {
          const audioExtractedPath = path.join(paths.audioDir, "extracted.mp3");
          let extractRes: { success: boolean; hasAudio: boolean; error?: string };

          if (workerStatus.online) {
            console.log(`[Upload] Using Python Local Worker at ${workerStatus.url} for audio extraction...`);
            extractRes = await extractAudioViaWorker(videoPath, audioExtractedPath, workerStatus.url);
          } else {
            console.log(`[Upload] Python Local Worker offline, using local server FFmpeg...`);
            extractRes = await extractAudio(videoPath, audioExtractedPath);
          }
          hasAudio = extractRes.hasAudio;
        }
      } else if (audioFile) {
        // Audio uploaded directly (fast client-side extraction)
        hasAudio = true;
        if (!metadata) {
          metadata = {
            name: audioFile.originalname,
            size: audioFile.size,
            duration: 30,
            width: 1080,
            height: 1920,
            mimeType: "video/mp4",
            aspectRatio: "9:16",
            videoType: "short",
          };
        }
      }

      res.json({
        success: true,
        projectId,
        metadata: {
          ...metadata,
          hasAudio,
          name: videoFile?.originalname || metadata?.name || "video.mp4",
          size: videoFile?.size || metadata?.size || 0,
        },
        workerUsed: workerStatus.online,
        videoUrl: videoFile ? `/api/projects/${projectId}/video` : undefined,
      });
    } catch (error: any) {
      console.error("Upload process error:", error);
      res.status(500).json({
        error: error.message || "حدث خطأ أثناء رفع ومعالجة الفيديو.",
      });
    }
  });
});

// 3. Transcribe & Generate Captions with Gemini AI
const handleTranscription = async (req: express.Request, res: express.Response) => {
  try {
    const rawProjectId = (req.headers["x-project-id"] as string) || (req.body?.projectId as string) || (req as any).projectId || `proj_${Date.now()}`;
    const projectId = rawProjectId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const videoType = (req.body?.videoType as "short" | "long") || "short";

    const paths = getProjectPaths(projectId);

    // If an audio file was uploaded in this request via multipart
    let audioFilePath: string | undefined = undefined;
    const reqFiles = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedAudio = reqFiles?.["audio"]?.[0] || (req.file?.fieldname === "audio" ? req.file : undefined);

    if (uploadedAudio && fs.existsSync(uploadedAudio.path) && fs.statSync(uploadedAudio.path).size > 0) {
      audioFilePath = uploadedAudio.path;
    } else if (paths.audioPath && fs.existsSync(paths.audioPath) && fs.statSync(paths.audioPath).size > 0) {
      audioFilePath = paths.audioPath;
    } else if (paths.originalVideoPath && fs.existsSync(paths.originalVideoPath)) {
      // Fast extraction from original video
      const targetAudio = path.join(paths.audioDir, "extracted.mp3");
      const extractResult = await extractAudio(paths.originalVideoPath, targetAudio);
      if (extractResult.hasAudio && fs.existsSync(targetAudio)) {
        audioFilePath = targetAudio;
      }
    }

    // If still no audio file, check montage directory
    if (!audioFilePath && paths.montageVideoPath && fs.existsSync(paths.montageVideoPath)) {
      const targetAudio = path.join(paths.audioDir, "extracted.mp3");
      const extractResult = await extractAudio(paths.montageVideoPath, targetAudio);
      if (extractResult.hasAudio && fs.existsSync(targetAudio)) {
        audioFilePath = targetAudio;
      }
    }

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      // Return starter cues gracefully rather than failing
      console.warn(`[Transcription] No audio file found for project ${projectId}. Returning starter cues.`);
      const starterResult = await transcribeArabicAudio("", videoType).catch(() => ({
        captions: [
          {
            id: `cue_1_${Date.now()}`,
            start: 0.0,
            end: 2.5,
            text: "السلام عليكم ورحمة الله وبركاته",
            words: [
              { word: "السلام", start: 0.0, end: 0.5 },
              { word: "عليكم", start: 0.5, end: 1.0 },
              { word: "ورحمة", start: 1.0, end: 1.5 },
              { word: "الله", start: 1.5, end: 2.0 },
              { word: "وبركاته", start: 2.0, end: 2.5 },
            ],
          },
        ],
        rawText: "السلام عليكم ورحمة الله وبركاته",
        fallbackUsed: true,
      }));

      fs.writeFileSync(paths.captionsJsonPath, JSON.stringify(starterResult.captions, null, 2), "utf-8");
      return res.json({
        success: true,
        projectId,
        captions: starterResult.captions,
        rawText: starterResult.rawText,
        fallbackUsed: true,
      });
    }

    console.log(`[Gemini] Starting Arabic speech recognition for project ${projectId} using audio: ${audioFilePath}`);
    const result = await transcribeArabicAudio(audioFilePath, videoType);

    // Save captions to captions.json
    fs.writeFileSync(paths.captionsJsonPath, JSON.stringify(result.captions, null, 2), "utf-8");

    res.json({
      success: true,
      projectId,
      captions: result.captions,
      rawText: result.rawText,
      fallbackUsed: result.fallbackUsed || false,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({
      error: error.message || "حدث خطأ أثناء تفريغ الكابشن بالذكاء الاصطناعي.",
    });
  }
};

app.post("/api/transcribe", (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      console.warn("Multer transcribe upload warning:", err);
    }
    handleTranscription(req, res);
  });
});

app.post("/api/generate-captions", (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      console.warn("Multer generate-captions upload warning:", err);
    }
    handleTranscription(req, res);
  });
});

// 4. Save Modified Captions
app.post("/api/save-captions", (req, res) => {
  try {
    const { projectId, captions } = req.body;
    if (!projectId || !captions) {
      return res.status(400).json({ error: "البيانات غير مكتملة." });
    }

    const paths = getProjectPaths(projectId);
    fs.writeFileSync(paths.captionsJsonPath, JSON.stringify(captions, null, 2), "utf-8");

    res.json({ success: true, message: "تم حفظ الكابشن بنجاح." });
  } catch (error: any) {
    console.error("Save captions error:", error);
    res.status(500).json({ error: error.message || "فشل حفظ الكابشن." });
  }
});

// 5. Render Video with Subtitles
app.post("/api/render-video", async (req, res) => {
  try {
    const { projectId, captions, styleConfig, metadata, customFilename } = req.body;
    if (!projectId || !captions || !styleConfig) {
      return res.status(400).json({ error: "بيانات الرندر غير مكتملة." });
    }

    const paths = getProjectPaths(projectId);
    if (!paths.originalVideoPath || !fs.existsSync(paths.originalVideoPath)) {
      return res.status(404).json({ error: "ملف الفيديو الأصلي غير موجود." });
    }

    const videoWidth = metadata?.width || 1080;
    const videoHeight = metadata?.height || 1920;
    const videoDuration = metadata?.duration;

    // Generate ASS and SRT subtitle files
    generateAssSubtitles(
      captions,
      styleConfig,
      videoWidth,
      videoHeight,
      paths.subtitlesAssPath
    );
    generateSrtSubtitles(captions, paths.subtitlesSrtPath);

    // Sanitize and determine output filename
    let cleanCustomName = (customFilename || metadata?.customFilename || "").trim();
    if (cleanCustomName) {
      cleanCustomName = cleanCustomName.replace(/[\\/:*?"<>|]/g, "_");
      if (!cleanCustomName.toLowerCase().endsWith(".mp4")) {
        cleanCustomName += ".mp4";
      }
    }
    const outputFilename = cleanCustomName || generateFinalFilename();
    const finalVideoPath = path.join(paths.finalDir, outputFilename);

    console.log(`[Render] Starting render for project ${projectId} -> ${outputFilename}`);

    // Check Python Local Worker status
    const workerStatus = await checkWorkerHealth();
    let renderSucceeded = false;
    let renderError = "";

    if (workerStatus.online) {
      console.log(`[Render] Using Python Local Worker at ${workerStatus.url}...`);
      try {
        await renderVideoViaWorker(
          paths.originalVideoPath,
          paths.subtitlesAssPath,
          paths.subtitlesSrtPath,
          finalVideoPath,
          metadata,
          workerStatus.url
        );
        renderSucceeded = true;
      } catch (wErr: any) {
        console.warn(`[Render] Python Worker render failed, attempting local fallback:`, wErr.message);
        renderError = wErr.message;
      }
    }

    // If worker was not online or worker render failed, try server-side FFmpeg
    if (!renderSucceeded) {
      try {
        console.log(`[Render] Running server-side FFmpeg fallback...`);
        await renderVideoWithCaptions(
          paths.originalVideoPath,
          paths.subtitlesAssPath,
          paths.subtitlesSrtPath,
          finalVideoPath,
          videoDuration
        );
        renderSucceeded = true;
      } catch (srvErr: any) {
        console.error(`[Render] Server FFmpeg also failed:`, srvErr.message);
        if (!workerStatus.online) {
          throw new Error("شغّل Islam View Worker على جهازك أولًا.");
        }
        throw new Error(renderError || srvErr.message || "فشل رندر الفيديو بواسطة FFmpeg.");
      }
    }

    // Verify rendered video exists and has size > 0
    if (!fs.existsSync(finalVideoPath) || fs.statSync(finalVideoPath).size === 0) {
      throw new Error("لم يتم إنشاء ملف الفيديو النهائي بنجاح. شغّل Islam View Worker على جهازك أولًا.");
    }

    // Clean up temporary files in renderDir after rendering
    cleanupTemporaryFiles(projectId);

    res.json({
      success: true,
      filename: outputFilename,
      workerUsed: workerStatus.online,
      finalVideoUrl: `/api/projects/${projectId}/final-video`,
      downloadUrl: `/api/download/${projectId}?filename=${encodeURIComponent(outputFilename)}`,
    });
  } catch (error: any) {
    console.error("Render error:", error);
    res.status(500).json({
      error: error.message || "حدث خطأ أثناء رندر الفيديو.",
    });
  }
});

// 6. Stream Original Video
app.get("/api/projects/:projectId/video", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!paths.originalVideoPath || !fs.existsSync(paths.originalVideoPath)) {
    return res.status(404).send("الفيديو غير موجود.");
  }

  const stat = fs.statSync(paths.originalVideoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(paths.originalVideoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(paths.originalVideoPath).pipe(res);
  }
});

// 7. Stream Final Rendered Video
app.get("/api/projects/:projectId/final-video", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!paths.finalVideoPath || !fs.existsSync(paths.finalVideoPath)) {
    return res.status(404).send("الفيديو النهائي غير موجود.");
  }

  const stat = fs.statSync(paths.finalVideoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(paths.finalVideoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(paths.finalVideoPath).pipe(res);
  }
});

// 8. Download Final Video
app.get("/api/download/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!paths.finalVideoPath || !fs.existsSync(paths.finalVideoPath)) {
    return res.status(404).json({ error: "الفيديو النهائي غير متوفر للتحميل." });
  }

  let filename = (req.query.filename as string) || path.basename(paths.finalVideoPath);
  if (!filename.toLowerCase().endsWith('.mp4')) filename += '.mp4';
  res.download(paths.finalVideoPath, filename);
});

// 9. Download SRT file
app.get("/api/download-srt/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!fs.existsSync(paths.subtitlesSrtPath)) {
    return res.status(404).json({ error: "ملف الترجمة SRT غير موجود." });
  }

  let filename = (req.query.filename as string) || `IslamView_Captions_${projectId}`;
  const baseName = filename.replace(/\.(srt|mp4|ass|txt|json)$/i, '');
  res.download(paths.subtitlesSrtPath, `${baseName}.srt`);
});

// 10. Download ASS file (Full styles & fonts)
app.get("/api/download-ass/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!fs.existsSync(paths.subtitlesAssPath)) {
    return res.status(404).json({ error: "ملف الترجمة ASS غير موجود." });
  }

  let filename = (req.query.filename as string) || `IslamView_Captions_${projectId}`;
  const baseName = filename.replace(/\.(srt|mp4|ass|txt|json)$/i, '');
  res.download(paths.subtitlesAssPath, `${baseName}.ass`);
});

// 11. Download JSON captions
app.get("/api/download-json/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!fs.existsSync(paths.captionsJsonPath)) {
    return res.status(404).json({ error: "ملف الكابشن JSON غير موجود." });
  }

  let filename = (req.query.filename as string) || `IslamView_Captions_${projectId}`;
  const baseName = filename.replace(/\.(srt|mp4|ass|txt|json)$/i, '');
  res.download(paths.captionsJsonPath, `${baseName}.json`);
});

// 12. Download Plain TXT transcript
app.get("/api/download-txt/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  if (!fs.existsSync(paths.captionsJsonPath)) {
    return res.status(404).json({ error: "بيانات النص غير متوفرة." });
  }

  try {
    const raw = fs.readFileSync(paths.captionsJsonPath, "utf-8");
    const json = JSON.parse(raw);
    const cues = json.captions || [];
    const fullText = cues.map((c: any) => c.text).join("\n");
    let filename = (req.query.filename as string) || `IslamView_Transcript_${projectId}`;
    const baseName = filename.replace(/\.(srt|mp4|ass|txt|json)$/i, '');
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(baseName)}_Transcript.txt"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(fullText);
  } catch (e: any) {
    res.status(500).json({ error: "فشل استخراج ملف النص." });
  }
});

// ----------------------------------------------------
// AUTOMATED MONTAGE SYSTEM API ENDPOINTS
// ----------------------------------------------------

const montageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawProjectId = (req.headers["x-project-id"] as string) || (req.body?.projectId as string) || `proj_montage_${Date.now()}`;
    const cleanProjectId = rawProjectId.replace(/[^a-zA-Z0-9_-]/g, "_");
    (req as any).projectId = cleanProjectId;
    const paths = createProject(cleanProjectId);
    const rawDir = path.join(paths.montageDir, "raw");
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }
    cb(null, rawDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${cleanName}_${Date.now()}${ext}`);
  },
});

const montageUpload = multer({
  storage: montageStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB per file
});

function extractNumberFromFilename(filename: string): number {
  const base = path.basename(filename, path.extname(filename));
  const match = base.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// 13. Montage: Render Automated Sequential Image + Audio Montage
const handleMontageRender: express.RequestHandler = (req, res) => {
  montageUpload.any()(req, res, async (uploadErr: any) => {
    if (uploadErr) {
      console.error("Multer montage upload error:", uploadErr);
      return res.status(400).json({
        error:
          uploadErr.code === "LIMIT_FILE_SIZE"
            ? "حجم الملفات المرفوعة كبير جداً."
            : uploadErr.message || "فشل استقبال ملفات المونتاج.",
      });
    }

    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "لم يتم استلام أي ملفات للمونتاج." });
      }

      const projectId = (req as any).projectId || `proj_montage_${Date.now()}`;
      const paths = getProjectPaths(projectId);

      // Parse settings
      let settings: any = {
        aspectRatio: "9:16",
        resolution: "1080p",
        fps: 30,
      };
      if (req.body?.settings) {
        try {
          settings = typeof req.body.settings === "string" ? JSON.parse(req.body.settings) : req.body.settings;
        } catch {}
      }

      // Classify files into images, audios, SFX, and BGM with their extracted numerical indices
      const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".bmp"];
      const audioExtensions = [".mp3", ".wav", ".aac", ".m4a", ".ogg", ".flac"];

      const imagesByIndex = new Map<number, Express.Multer.File>();
      const audiosByIndex = new Map<number, Express.Multer.File>();
      const sfxByIndex = new Map<number, Express.Multer.File>();
      let bgmFile: Express.Multer.File | undefined = undefined;

      for (const f of files) {
        const ext = path.extname(f.originalname).toLowerCase();
        const fieldLower = f.fieldname.toLowerCase();
        const origLower = f.originalname.toLowerCase();

        // Check if BGM
        if (fieldLower.includes("bgm") || origLower.includes("bgm") || origLower.includes("music") || origLower.includes("nasheed")) {
          bgmFile = f;
          continue;
        }

        // Check if SFX
        if (fieldLower.startsWith("sfx_") || origLower.startsWith("sfx") || origLower.includes("effect")) {
          let sfxIdx = extractNumberFromFilename(f.fieldname);
          if (sfxIdx === 0) sfxIdx = extractNumberFromFilename(f.originalname);
          if (sfxIdx > 0) {
            sfxByIndex.set(sfxIdx, f);
            continue;
          }
        }

        let idx = extractNumberFromFilename(f.fieldname);
        if (idx === 0) {
          idx = extractNumberFromFilename(f.originalname);
        }

        if (imageExtensions.includes(ext) || f.mimetype.startsWith("image/")) {
          if (idx > 0) {
            imagesByIndex.set(idx, f);
          }
        } else if (audioExtensions.includes(ext) || f.mimetype.startsWith("audio/")) {
          if (idx > 0) {
            audiosByIndex.set(idx, f);
          }
        }
      }

      // Find all matching indices (where both image and audio exist)
      const matchingIndices = Array.from(imagesByIndex.keys())
        .filter((idx) => audiosByIndex.has(idx))
        .sort((a, b) => a - b);

      // Detect unpaired files to provide informative error/warning
      const missingAudioIndices = Array.from(imagesByIndex.keys()).filter((idx) => !audiosByIndex.has(idx));
      const missingImageIndices = Array.from(audiosByIndex.keys()).filter((idx) => !imagesByIndex.has(idx));

      if (matchingIndices.length === 0) {
        let missingDetails = "";
        if (missingAudioIndices.length > 0) {
          missingDetails += ` الصور ذات الأرقام (${missingAudioIndices.join(", ")}) ليس لها ملف صوتي مطابق.`;
        }
        if (missingImageIndices.length > 0) {
          missingDetails += ` الأصوات ذات الأرقام (${missingImageIndices.join(", ")}) ليس لها ملف صورة مطابق.`;
        }
        return res.status(400).json({
          error: `لم يتم العثور على أزواج صور وأصوات متطابقة في الأرقام (مثال: 1.png مع 1.mp3).${missingDetails}`,
        });
      }

      console.log(`[Montage] Found ${matchingIndices.length} matched pairs: ${matchingIndices.join(", ")}`);

      const pairsMeta = Array.isArray(settings?.pairsMeta) ? settings.pairsMeta : [];
      const pairs = matchingIndices.map((idx) => {
        const meta = pairsMeta.find((p: any) => p.index === idx) || {};
        const customSfx = sfxByIndex.get(idx);
        return {
          index: idx,
          imagePath: imagesByIndex.get(idx)!.path,
          audioPath: audiosByIndex.get(idx)!.path,
          sfxPath: customSfx?.path,
          filter: meta.filter,
          motion: meta.motion,
          transition: meta.transition,
        };
      });

      // Output file path
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
      
      let cleanMontageCustom = (settings?.customFilename || "").trim().replace(/[\\/:*?"<>|]/g, "_");
      if (cleanMontageCustom && !cleanMontageCustom.toLowerCase().endsWith(".mp4")) {
        cleanMontageCustom += ".mp4";
      }
      const outputFilename = cleanMontageCustom || `IslamView_Montage_${timestamp}.mp4`;
      const finalMontageVideoPath = path.join(paths.montageDir, outputFilename);

      // Check Python Local Worker
      const workerStatus = await checkWorkerHealth();
      let renderSucceeded = false;
      let renderError = "";

      if (workerStatus.online) {
        console.log(`[Montage] Rendering via Python Local Worker at ${workerStatus.url}...`);
        try {
          await renderMontageViaWorker(pairs, settings, finalMontageVideoPath, bgmFile?.path, workerStatus.url);
          renderSucceeded = true;
        } catch (wErr: any) {
          console.warn(`[Montage] Worker render failed, falling back to server:`, wErr.message);
          renderError = wErr.message;
        }
      }

      if (!renderSucceeded) {
        try {
          console.log(`[Montage] Running server-side FFmpeg montage assembly...`);
          const tempMontageDir = path.join(paths.montageDir, "temp");
          if (!fs.existsSync(tempMontageDir)) {
            fs.mkdirSync(tempMontageDir, { recursive: true });
          }
          await renderMontageVideo(pairs, settings, finalMontageVideoPath, tempMontageDir, bgmFile?.path);
          renderSucceeded = true;
        } catch (srvErr: any) {
          console.error(`[Montage] Server FFmpeg failed:`, srvErr.message);
          if (!workerStatus.online) {
            throw new Error(srvErr.message || "شغّل Islam View Worker على جهازك أولًا.");
          }
          throw new Error(renderError || srvErr.message || "فشل رندر المونتاج بواسطة FFmpeg.");
        }
      }

      // Verify final MP4 exists and has size > 0
      if (!fs.existsSync(finalMontageVideoPath) || fs.statSync(finalMontageVideoPath).size === 0) {
        throw new Error("لم يتم إنشاء ملف فيديو المونتاج بنجاح أو حجمه 0 بايت. شغّل Islam View Worker على جهازك أولًا.");
      }

      // Also automatically copy to originalDir so it is ready for Caption Studio
      const originalMontageCopy = path.join(paths.originalDir, outputFilename);
      fs.copyFileSync(finalMontageVideoPath, originalMontageCopy);

      // Extract metadata
      const metadata = await extractVideoMetadata(finalMontageVideoPath);

      // Extract combined audio for instant captioning
      const combinedAudioPath = path.join(paths.audioDir, "extracted.mp3");
      if (workerStatus.online) {
        await extractAudioViaWorker(finalMontageVideoPath, combinedAudioPath, workerStatus.url).catch(() => {});
      } else {
        await extractAudio(finalMontageVideoPath, combinedAudioPath).catch(() => {});
      }

      res.json({
        success: true,
        projectId,
        filename: outputFilename,
        workerUsed: workerStatus.online,
        pairsCount: pairs.length,
        duration: metadata.duration,
        metadata,
        videoUrl: `/api/projects/${projectId}/montage-video`,
        downloadUrl: `/api/download-montage/${projectId}`,
        hasUnpairedWarnings: missingAudioIndices.length > 0 || missingImageIndices.length > 0,
        missingAudioIndices,
        missingImageIndices,
      });
    } catch (error: any) {
      console.error("Montage render error:", error);
      res.status(500).json({
        error: error.message || "حدث خطأ أثناء رندر المونتاج.",
      });
    }
  });
};

app.post("/api/montage/render", handleMontageRender);
app.post("/api/render-montage", handleMontageRender);

// 14. Stream Montage Video
app.get("/api/projects/:projectId/montage-video", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  const videoPath = paths.montageVideoPath || paths.originalVideoPath;
  if (!videoPath || !fs.existsSync(videoPath)) {
    return res.status(404).send("فيديو المونتاج غير موجود.");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// 15. Download Montage Video
app.get("/api/download-montage/:projectId", (req, res) => {
  const { projectId } = req.params;
  const paths = getProjectPaths(projectId);

  const videoPath = paths.montageVideoPath || paths.originalVideoPath;
  if (!videoPath || !fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "فيديو المونتاج غير متوفر للتحميل." });
  }

  const filename = path.basename(videoPath);
  res.download(videoPath, filename);
});

// ----------------------------------------------------
// GLOBAL ERROR HANDLER (Returns JSON instead of HTML)
// ----------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error Handler:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || "حدث خطأ غير متوقع في الخادم.",
  });
});

// ----------------------------------------------------
// VITE SPA MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Islam View Caption Studio Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
