import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import { CaptionCue, CaptionStyleConfig, VideoMetadata } from "../src/types";

// Convert standard #RRGGBB or #RRGGBBAA to ASS format &HAABBGGRR
export function hexToAssColor(hex?: string | null, alpha = 0): string {
  if (!hex || typeof hex !== "string") {
    return "&H00FFFFFF";
  }
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length >= 6) {
    const r = clean.slice(0, 2);
    const g = clean.slice(2, 4);
    const b = clean.slice(4, 6);
    const aHex = Math.max(0, Math.min(255, Math.round(alpha * 2.55)))
      .toString(16)
      .padStart(2, "0");
    return `&H${aHex}${b}${g}${r}`.toUpperCase();
  }
  return "&H00FFFFFF";
}

// Convert seconds to ASS timestamp format: H:MM:SS.CC
export function secondsToAssTime(seconds: number): string {
  const sec = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

// Convert seconds to SRT timestamp format: HH:MM:SS,mmm
export function secondsToSrtTime(seconds: number): string {
  const sec = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function extractVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const cmd = `ffprobe -v error -show_entries stream=width,height,duration -show_entries format=duration,size -of json "${videoPath}"`;
    exec(cmd, (err, stdout) => {
      if (err) {
        let size = 1024 * 1024;
        try {
          size = fs.statSync(videoPath).size;
        } catch {}
        return resolve({
          name: path.basename(videoPath),
          size,
          duration: 30,
          width: 1080,
          height: 1920,
          mimeType: "video/mp4",
          aspectRatio: "9:16",
          videoType: "short",
        });
      }

      try {
        const data = JSON.parse(stdout);
        const videoStream = data.streams?.find((s: any) => s.width && s.height) || data.streams?.[0] || {};
        const width = Number(videoStream.width) || 1080;
        const height = Number(videoStream.height) || 1920;
        const duration = Number(videoStream.duration || data.format?.duration) || 0;
        const size = Number(data.format?.size) || fs.statSync(videoPath).size;
        const isShort = height > width;

        resolve({
          name: path.basename(videoPath),
          size,
          duration: Number(duration.toFixed(1)),
          width,
          height,
          mimeType: "video/mp4",
          aspectRatio: isShort ? "9:16" : "16:9",
          videoType: isShort ? "short" : "long",
        });
      } catch {
        let size = 1024 * 1024;
        try {
          size = fs.statSync(videoPath).size;
        } catch {}
        resolve({
          name: path.basename(videoPath),
          size,
          duration: 30,
          width: 1080,
          height: 1920,
          mimeType: "video/mp4",
          aspectRatio: "9:16",
          videoType: "short",
        });
      }
    });
  });
}

export function checkHasAudio(videoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = `ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    exec(cmd, (err, stdout) => {
      if (err) {
        return resolve(true);
      }
      const hasAudio = stdout.toLowerCase().includes("audio");
      resolve(hasAudio);
    });
  });
}

export async function extractAudio(
  videoPath: string,
  outputAudioPath: string
): Promise<{ success: boolean; hasAudio: boolean; error?: string }> {
  const parentDir = path.dirname(outputAudioPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-threads", "0",
      "-i",
      videoPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-ar",
      "16000",
      "-ac",
      "1",
      "-b:a",
      "64k",
      outputAudioPath,
    ]);

    let errorLog = "";
    ffmpeg.stderr.on("data", (data) => {
      errorLog += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 0) {
        return resolve({ success: true, hasAudio: true });
      }

      const wavOutputPath = outputAudioPath.replace(/\.mp3$/, ".wav");
      const fallbackFfmpeg = spawn("ffmpeg", [
        "-y",
        "-threads", "0",
        "-i",
        videoPath,
        "-vn",
        "-c:a",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        wavOutputPath,
      ]);

      let fallbackErr = "";
      fallbackFfmpeg.stderr.on("data", (d) => {
        fallbackErr += d.toString();
      });

      fallbackFfmpeg.on("close", (fCode) => {
        if (fCode === 0 && fs.existsSync(wavOutputPath) && fs.statSync(wavOutputPath).size > 0) {
          return resolve({ success: true, hasAudio: true });
        }

        if (
          errorLog.includes("Output file does not contain any stream") ||
          errorLog.includes("does not contain any audio") ||
          fallbackErr.includes("Output file does not contain any stream")
        ) {
          resolve({
            success: false,
            hasAudio: false,
            error: "هذا الفيديو لا يحتوي على مسار صوتي.",
          });
        } else {
          resolve({
            success: false,
            hasAudio: true,
            error: `فشل استخراج الصوت من الفيديو: ${errorLog.slice(-200)}`,
          });
        }
      });
    });
  });
}

export function generateAssSubtitles(
  captions: CaptionCue[],
  style: CaptionStyleConfig,
  videoWidth: number,
  videoHeight: number,
  outputPath: string
): void {
  // Base scale calculation
  const isLong = videoWidth >= videoHeight;
  const baseFactor = isLong ? videoHeight / 720 : videoHeight / 1080;
  const rawFontSize = style.fontSize || (isLong ? 30 : 48);
  const scaledFontSize = Math.max(22, Math.round(rawFontSize * baseFactor * 1.25));

  const primaryAssColor = hexToAssColor(style.primaryColor || "#FFFFFF", 0);
  const highlightAssColor = hexToAssColor(style.highlightColor || "#FACC15", 0);
  const strokeColor = style.strokeColor || "#000000";
  const strokeAssColor = hexToAssColor(strokeColor, 0);

  const bgOpacity = style.backgroundOpacity ?? 0;
  const backAssColor =
    style.textTransform === "box" && bgOpacity > 5
      ? hexToAssColor(style.backgroundColor || "#000000", 100 - bgOpacity)
      : "&HFF000000"; // 100% transparent when no box

  const posXPercent = style.positionXPercent ?? 50;
  const posYPercent = style.positionYPercent ?? (isLong ? 86 : 74);
  const targetX = Math.round((videoWidth * posXPercent) / 100);
  const targetY = Math.round((videoHeight * posYPercent) / 100);

  const scaleX = style.scaleX || 100;
  const scaleY = style.scaleY || 100;
  const rotation = style.rotation || 0;
  const letterSpacing = style.letterSpacing || 0;

  const strokeWidth = style.strokeWidth ?? (isLong ? 2.5 : 4);
  const outline = Math.max(1, Math.round(strokeWidth * baseFactor * 1.2));

  // Remove shadow if hasShadow is false or blur is 0
  const isShadowActive = style.hasShadow === true && (style.shadowBlur || 0) > 0;
  const shadow = isShadowActive ? Math.max(1, Math.round(baseFactor * 2.5)) : 0;
  const borderStyle = style.textTransform === "box" && bgOpacity > 5 ? 3 : 1;
  const fontFamily = style.fontFamily || "Cairo";

  const baseTransformTag = `{\\an5\\pos(${targetX},${targetY})\\fscx${scaleX}\\fscy${scaleY}\\frz${rotation}\\fsp${letterSpacing}}`;

  const assContent = `[Script Info]
Title: Islam View Caption Studio
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${scaledFontSize},${primaryAssColor},${highlightAssColor},${strokeAssColor},${backAssColor},1,0,0,0,${scaleX},${scaleY},${letterSpacing},${rotation},${borderStyle},${outline},${shadow},5,10,10,10,1
Style: Highlight,${fontFamily},${scaledFontSize},${highlightAssColor},${primaryAssColor},${strokeAssColor},${backAssColor},1,0,0,0,${scaleX},${scaleY},${letterSpacing},${rotation},${borderStyle},${outline},${shadow},5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${captions
  .map((cue) => {
    const startTime = secondsToAssTime(cue.start);
    const endTime = secondsToAssTime(cue.end);

    // 1. Word-by-word active highlight or pop effect
    const hasWordTiming = cue.words && cue.words.length > 0;
    const isWordEffect =
      style.wordEffect === "karaoke_highlight" ||
      style.wordEffect === "pop_active" ||
      style.wordEffect === "box_active" ||
      style.wordEffect === "glow_active" ||
      style.styleType === "highlight" ||
      style.styleType === "viral";

    if (isWordEffect && hasWordTiming) {
      return cue.words
        .map((w, wIdx) => {
          const wStart = secondsToAssTime(w.start);
          const wEnd = secondsToAssTime(w.end);

          const formattedText = cue.words
            .map((wordObj, i) => {
              const isCurrent = i === wIdx;
              const isKeyWord = Boolean(wordObj.highlight);

              if (isCurrent) {
                if (style.wordEffect === "pop_active") {
                  const popScaleX = Math.round(scaleX * 1.22);
                  const popScaleY = Math.round(scaleY * 1.22);
                  return `{\\c${highlightAssColor}\\fscx${popScaleX}\\fscy${popScaleY}}${wordObj.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
                }
                if (style.wordEffect === "glow_active") {
                  return `{\\c${highlightAssColor}\\bord${outline + 2}\\3c${highlightAssColor}}${wordObj.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
                }
                return `{\\c${highlightAssColor}}${wordObj.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
              } else if (isKeyWord && style.styleType === "viral") {
                return `{\\c${highlightAssColor}}${wordObj.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
              }
              return `{\\c${primaryAssColor}}${wordObj.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
            })
            .join(" ");

          return `Dialogue: 0,${wStart},${wEnd},Default,,0,0,0,,${baseTransformTag}${formattedText}`;
        })
        .join("\n");
    }

    if (style.wordEffect === "color_wave" && hasWordTiming) {
      const waveColors = ["&H00F8BD38", "&H0099D334", "&H0015CCFA", "&H00B672F4"];
      const formattedText = cue.words
        .map((w, i) => {
          const c = waveColors[i % waveColors.length];
          return `{\\c${c}}${w.word}{\\r\\fscx${scaleX}\\fscy${scaleY}}`;
        })
        .join(" ");
      return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${baseTransformTag}${formattedText}`;
    }

    // Default Clean / Classic Subtitle
    return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${baseTransformTag}${cue.text}`;
  })
  .join("\n")}
`;

  fs.writeFileSync(outputPath, assContent, "utf-8");
}

export function generateSrtSubtitles(captions: CaptionCue[], outputPath: string): void {
  const srtContent = captions
    .map((cue, index) => {
      const startTime = secondsToSrtTime(cue.start);
      const endTime = secondsToSrtTime(cue.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${cue.text}\n`;
    })
    .join("\n");

  fs.writeFileSync(outputPath, srtContent, "utf-8");
}

export function renderVideoWithCaptions(
  inputVideoPath: string,
  assSubtitlesPath: string,
  srtSubtitlesPath: string,
  outputVideoPath: string,
  videoDuration = 0,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const escapedAssPath = (assSubtitlesPath || "").replace(/\\/g, "/").replace(/:/g, "\\:");
    const escapedSrtPath = (srtSubtitlesPath || "").replace(/\\/g, "/").replace(/:/g, "\\:");

    const vf = `ass='${escapedAssPath}'`;

    const args = [
      "-y",
      "-threads", "0",
      "-i",
      inputVideoPath,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "fastdecode",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      outputVideoPath,
    ];

    const ffmpeg = spawn("ffmpeg", args);
    let errorLog = "";

    ffmpeg.stderr.on("data", (data) => {
      const str = data.toString();
      errorLog += str;

      if (videoDuration > 0 && onProgress) {
        const timeMatch = str.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const progress = Math.min(99, Math.round((currentTime / videoDuration) * 100));
          onProgress(progress);
        }
      }
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputVideoPath)) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        console.warn("ASS filter failed or exited with code " + code + ", trying subtitles= filter fallback...");
        const fallbackArgs = [
          "-y",
          "-threads", "0",
          "-i",
          inputVideoPath,
          "-vf",
          `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'`,
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputVideoPath,
        ];

        const fallbackFfmpeg = spawn("fallbackArgs", fallbackArgs);
        let fallbackErr = "";
        fallbackFfmpeg.stderr.on("data", (d) => {
          fallbackErr += d.toString();
        });

        fallbackFfmpeg.on("close", (fallbackCode) => {
          if (fallbackCode === 0 && fs.existsSync(outputVideoPath)) {
            if (onProgress) onProgress(100);
            resolve();
          } else {
            reject(
              new Error(
                `فشل رندر الفيديو بواسطة FFmpeg: ${errorLog.slice(-300)} | ${fallbackErr.slice(-300)}`
              )
            );
          }
        });
      }
    });
  });
}

export function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve) => {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    exec(cmd, (err, stdout) => {
      if (err) {
        return resolve(3.0);
      }
      const dur = parseFloat(stdout.trim());
      resolve(isNaN(dur) || dur <= 0 ? 3.0 : dur);
    });
  });
}

/**
 * High-Speed Parallel Server-side FFmpeg montage renderer
 */
export async function renderMontageVideo(
  pairs: Array<{ index: number; imagePath: string; audioPath: string; sfxPath?: string; filter?: string; motion?: string; transition?: string }>,
  settings: any,
  outputVideoPath: string,
  tempDir: string,
  bgmPath?: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const aspectRatio = settings?.aspectRatio || "9:16";
  const resChoice = settings?.resolution || "1080p";
  const fitMode = settings?.fitMode || "contain";
  const fps = Number(settings?.fps) || 30;

  let targetW = 1080;
  let targetH = 1920;

  if (aspectRatio === "9:16") {
    if (resChoice === "720p") { targetW = 720; targetH = 1280; }
    else if (resChoice === "4k") { targetW = 2160; targetH = 3840; }
    else { targetW = 1080; targetH = 1920; }
  } else if (aspectRatio === "16:9") {
    if (resChoice === "720p") { targetW = 1280; targetH = 720; }
    else if (resChoice === "4k") { targetW = 3840; targetH = 2160; }
    else { targetW = 1920; targetH = 1080; }
  } else if (aspectRatio === "1:1") {
    if (resChoice === "720p") { targetW = 720; targetH = 720; }
    else if (resChoice === "4k") { targetW = 2160; targetH = 2160; }
    else { targetW = 1080; targetH = 1080; }
  } else if (aspectRatio === "4:5") {
    if (resChoice === "720p") { targetW = 720; targetH = 900; }
    else if (resChoice === "4k") { targetW = 2160; targetH = 2700; }
    else { targetW = 1080; targetH = 1350; }
  }

  // Ensure target dimensions are strictly even integers
  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const globalFilter = settings?.globalFilter || "none";
  const globalMotion = settings?.globalMotion || "kenburns_in";
  const overlay = settings?.overlay || "none";
  const globalTransition = settings?.globalTransition || "fade";
  const transitionDuration = Number(settings?.transitionDuration) || 0.4;

  const voiceVol = (Number(settings?.voiceVolume) || 100) / 100;
  const bgmVol = (Number(settings?.bgmVolume) || 15) / 100;
  const sfxVol = (Number(settings?.sfxVolume) || 70) / 100;
  const enableDucking = settings?.enableDucking !== false;
  const audioFadeIn = settings?.audioFadeIn !== false;
  const audioFadeOut = settings?.audioFadeOut !== false;

  const MOTION_CYCLE = ["zoom_in", "pan_right", "zoom_out", "pan_left", "pan_up", "subtle_motion"];

  let completedCount = 0;

  // Render a single segment
  const renderSingleSegment = async (pair: typeof pairs[0], i: number): Promise<string> => {
    const dur = await getAudioDuration(pair.audioPath);
    const totalFrames = Math.max(2, Math.round(dur * fps));
    const segOutPath = path.join(tempDir, `seg_${pair.index}.mp4`);

    let clipMotion = pair.motion || globalMotion;
    if (clipMotion === "auto_cycle") {
      clipMotion = MOTION_CYCLE[i % MOTION_CYCLE.length];
    }
    const clipFilter = pair.filter || globalFilter;
    const clipTransition = pair.transition || globalTransition;

    // 1. Base Scale & Crop / Pad Filter
    const filters: string[] = [];
    if (fitMode === "cover") {
      filters.push(`scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1`);
    } else if (fitMode === "fill") {
      filters.push(`scale=${targetW}:${targetH},setsar=1`);
    } else {
      // Fit contain with black letterbox padding
      filters.push(`scale=w='min(${targetW},iw*${targetH}/ih)':h='min(${targetH},ih*${targetW}/iw)':force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`);
    }

    // 2. Ken Burns Motion
    if (clipMotion === "zoom_in" || clipMotion === "kenburns_in") {
      filters.push(`zoompan=z='min(zoom+0.0015,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "zoom_out" || clipMotion === "kenburns_out") {
      filters.push(`zoompan=z='if(lte(on,1),1.15,max(1.0,zoom-0.0015))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "pan_left") {
      filters.push(`zoompan=z='1.12':x='if(lte(on,1),(iw-iw/zoom),max(0,x-1.5))':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "pan_right") {
      filters.push(`zoompan=z='1.12':x='if(lte(on,1),0,min(iw-iw/zoom,x+1.5))':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "pan_up") {
      filters.push(`zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,1),(ih-ih/zoom),max(0,y-1.5))':d=${totalFrames}:s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "pan_down") {
      filters.push(`zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,1),0,min(ih-ih/zoom,y+1.5))':d=${totalFrames}:s=${targetW}x${targetH}:fps=${fps}`);
    } else if (clipMotion === "subtle_motion" || clipMotion === "subtle_pulse") {
      filters.push(`zoompan=z='1.03+0.02*sin(2*PI*on/${totalFrames})':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${targetW}x${targetH}:fps=${fps}`);
    }

    // 3. Color Grading / Visual Filters
    if (clipFilter === "warm_spiritual") {
      filters.push("eq=contrast=1.08:saturation=1.2,colorbalance=rs=0.1:gs=0.04:bs=-0.08");
    } else if (clipFilter === "cinematic_dark") {
      filters.push("eq=contrast=1.22:brightness=-0.04:saturation=0.88");
    } else if (clipFilter === "vintage_quran") {
      filters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=contrast=1.1");
    } else if (clipFilter === "vivid_gold") {
      filters.push("eq=contrast=1.15:saturation=1.35,colorbalance=rs=0.08:gs=0.05:bs=-0.05");
    } else if (clipFilter === "black_white") {
      filters.push("hue=s=0,eq=contrast=1.2");
    } else if (clipFilter === "soft_glow") {
      filters.push("gblur=sigma=1.2:steps=1,eq=contrast=1.05:brightness=0.02");
    } else if (clipFilter === "cool_night") {
      filters.push("colorbalance=rs=-0.08:gs=0.02:bs=0.12,eq=contrast=1.1");
    } else if (clipFilter === "sharpen") {
      filters.push("unsharp=5:5:1.0:5:5:0.0");
    } else if (clipFilter === "blur") {
      filters.push("gblur=sigma=2.5:steps=1");
    }

    // 4. Overlays
    if (overlay === "vignette") {
      filters.push("vignette=PI/4");
    } else if (overlay === "cinema_bars") {
      filters.push(`drawbox=x=0:y=0:w=iw:h=ih*0.08:color=black@1:t=fill,drawbox=x=0:y=ih-ih*0.08:w=iw:h=ih*0.08:color=black@1:t=fill`);
    }

    // 5. Transitions
    const tDur = Math.min(transitionDuration, Math.max(0.1, dur * 0.35));
    if (clipTransition === "fade" || clipTransition === "crossfade" || clipTransition === "dissolve") {
      filters.push(`fade=t=in:st=0:d=${tDur.toFixed(2)}`);
      if (i < pairs.length - 1 && dur > tDur * 2) {
        filters.push(`fade=t=out:st=${Math.max(0, dur - tDur).toFixed(2)}:d=${tDur.toFixed(2)}`);
      }
    } else if (clipTransition === "flash") {
      filters.push(`fade=t=in:st=0:d=${Math.min(0.25, dur * 0.2).toFixed(2)}:color=white`);
    } else if (clipTransition === "blur") {
      filters.push(`gblur=sigma='if(lte(t,${tDur.toFixed(2)}),12*(1-t/${tDur.toFixed(2)}),0)'`);
    }

    filters.push("format=yuv420p");
    const fullFilterChain = filters.join(",");

    return new Promise<string>((resolve, reject) => {
      let args: string[] = [];
      if (pair.sfxPath && fs.existsSync(pair.sfxPath)) {
        const filterComplex = `[0:v]${fullFilterChain}[outv];[1:a]volume=${voiceVol.toFixed(2)}[v_aud];[2:a]volume=${sfxVol.toFixed(2)}[s_aud];[v_aud][s_aud]amix=inputs=2:duration=first[outa]`;
        args = [
          "-y",
          "-threads", "0",
          "-loop", "1",
          "-framerate", String(fps),
          "-t", String(dur),
          "-i", pair.imagePath,
          "-i", pair.audioPath,
          "-i", pair.sfxPath,
          "-filter_complex", filterComplex,
          "-map", "[outv]",
          "-map", "[outa]",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "22",
          "-c:a", "aac",
          "-b:a", "192k",
          "-ar", "44100",
          "-ac", "2",
          "-shortest",
          segOutPath,
        ];
      } else {
        const afChain = [`volume=${voiceVol.toFixed(2)}`];
        if (i === 0 && audioFadeIn) afChain.push("afade=t=in:ss=0:d=0.3");
        if (i === pairs.length - 1 && audioFadeOut && dur > 0.8) afChain.push(`afade=t=out:st=${Math.max(0, dur - 0.6).toFixed(2)}:d=0.6`);

        args = [
          "-y",
          "-threads", "0",
          "-loop", "1",
          "-framerate", String(fps),
          "-t", String(dur),
          "-i", pair.imagePath,
          "-i", pair.audioPath,
          "-vf", fullFilterChain,
          "-af", afChain.join(","),
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-tune", "stillimage",
          "-crf", "22",
          "-c:a", "aac",
          "-b:a", "192k",
          "-ar", "44100",
          "-ac", "2",
          "-pix_fmt", "yuv420p",
          "-shortest",
          segOutPath,
        ];
      }

      const ffmpeg = spawn("ffmpeg", args);
      let errStr = "";
      ffmpeg.stderr.on("data", (d) => {
        errStr += d.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0 && fs.existsSync(segOutPath) && fs.statSync(segOutPath).size > 0) {
          completedCount++;
          if (onProgress) {
            onProgress(Math.round((completedCount / (pairs.length + 1)) * 90));
          }
          resolve(segOutPath);
        } else {
          console.error(`Segment render failed for pair ${pair.index}:`, errStr);
          reject(new Error(`فشل إنشاء مقطع المونتاج للزوج ${pair.index}: ${errStr.slice(-300)}`));
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`خطأ تشغيل FFmpeg: ${err.message}`));
      });
    });
  };

  // Run rendering in parallel concurrency pool
  const CONCURRENCY = 4;
  const segmentVideos: string[] = new Array(pairs.length);
  
  const pool = pairs.map((pair, index) => async () => {
    const segPath = await renderSingleSegment(pair, index);
    segmentVideos[index] = segPath;
  });

  // Execute with parallel batching
  for (let i = 0; i < pool.length; i += CONCURRENCY) {
    const batch = pool.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((fn) => fn()));
  }

  // Concat all segments rapidly
  const concatListPath = path.join(tempDir, "concat_list.txt");
  const concatContent = segmentVideos.filter(Boolean).map((s) => `file '${s.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent, "utf-8");

  const tempConcatOut = path.join(tempDir, "temp_concat.mp4");

  await new Promise<void>((resolve, reject) => {
    const args = [
      "-y",
      "-threads", "0",
      "-f", "concat",
      "-safe", "0",
      "-i", concatListPath,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "22",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      tempConcatOut,
    ];

    const ffmpeg = spawn("ffmpeg", args);
    let errStr = "";
    ffmpeg.stderr.on("data", (d) => {
      errStr += d.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && fs.existsSync(tempConcatOut) && fs.statSync(tempConcatOut).size > 0) {
        resolve();
      } else {
        console.error("Concat render failed:", errStr);
        reject(new Error(`فشل دمج ملفات المونتاج: ${errStr.slice(-300)}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`خطأ دمج المقاطع: ${err.message}`));
    });
  });

  // If BGM is provided, mix it with ducking
  if (bgmPath && fs.existsSync(bgmPath)) {
    const duckingFilter = enableDucking
      ? `[1:a]volume=${bgmVol.toFixed(2)}[bgm_low];[0:a][bgm_low]amix=inputs=2:duration=first:dropout_transition=2[aout]`
      : `[1:a]volume=${bgmVol.toFixed(2)}[bgm_aud];[0:a][bgm_aud]amix=inputs=2:duration=first[aout]`;

    await new Promise<void>((resolve, reject) => {
      const args = [
        "-y",
        "-threads", "0",
        "-i", tempConcatOut,
        "-stream_loop", "-1",
        "-i", bgmPath,
        "-filter_complex", duckingFilter,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        outputVideoPath,
      ];

      const ffmpeg = spawn("ffmpeg", args);
      ffmpeg.on("close", (code) => {
        if (code === 0 && fs.existsSync(outputVideoPath) && fs.statSync(outputVideoPath).size > 0) {
          if (onProgress) onProgress(100);
          resolve();
        } else {
          fs.copyFileSync(tempConcatOut, outputVideoPath);
          if (onProgress) onProgress(100);
          resolve();
        }
      });
      ffmpeg.on("error", () => {
        fs.copyFileSync(tempConcatOut, outputVideoPath);
        resolve();
      });
    });
  } else {
    fs.copyFileSync(tempConcatOut, outputVideoPath);
    if (onProgress) onProgress(100);
  }
}
