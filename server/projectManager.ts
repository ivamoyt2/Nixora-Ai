import fs from "fs";
import path from "path";

export interface ProjectPaths {
  projectDir: string;
  originalDir: string;
  audioDir: string;
  captionsDir: string;
  renderDir: string;
  finalDir: string;
  montageDir: string;
  originalVideoPath?: string;
  audioPath?: string;
  captionsJsonPath: string;
  subtitlesAssPath: string;
  subtitlesSrtPath: string;
  finalVideoPath?: string;
  montageVideoPath?: string;
}

const BASE_PROJECTS_DIR = path.join(process.cwd(), "projects_data");

// Ensure base dir exists
if (!fs.existsSync(BASE_PROJECTS_DIR)) {
  fs.mkdirSync(BASE_PROJECTS_DIR, { recursive: true });
}

export function createProject(projectId: string): ProjectPaths {
  const projectDir = path.join(BASE_PROJECTS_DIR, projectId);
  const originalDir = path.join(projectDir, "original");
  const audioDir = path.join(projectDir, "audio");
  const captionsDir = path.join(projectDir, "captions");
  const renderDir = path.join(projectDir, "render");
  const finalDir = path.join(projectDir, "final");
  const montageDir = path.join(projectDir, "montage");

  [projectDir, originalDir, audioDir, captionsDir, renderDir, finalDir, montageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return {
    projectDir,
    originalDir,
    audioDir,
    captionsDir,
    renderDir,
    finalDir,
    montageDir,
    captionsJsonPath: path.join(captionsDir, "captions.json"),
    subtitlesAssPath: path.join(captionsDir, "subtitles.ass"),
    subtitlesSrtPath: path.join(captionsDir, "subtitles.srt"),
  };
}

export function getProjectPaths(projectId: string): ProjectPaths {
  const projectDir = path.join(BASE_PROJECTS_DIR, projectId);
  const originalDir = path.join(projectDir, "original");
  const audioDir = path.join(projectDir, "audio");
  const captionsDir = path.join(projectDir, "captions");
  const renderDir = path.join(projectDir, "render");
  const finalDir = path.join(projectDir, "final");
  const montageDir = path.join(projectDir, "montage");

  // Ensure directories exist
  [projectDir, originalDir, audioDir, captionsDir, renderDir, finalDir, montageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
  });

  let originalVideoPath: string | undefined;
  if (fs.existsSync(originalDir)) {
    const files = fs
      .readdirSync(originalDir)
      .filter((f) => !f.startsWith(".") && fs.statSync(path.join(originalDir, f)).size > 0);
    if (files.length > 0) {
      files.sort((a, b) => {
        const statA = fs.statSync(path.join(originalDir, a));
        const statB = fs.statSync(path.join(originalDir, b));
        return statB.mtimeMs - statA.mtimeMs;
      });
      originalVideoPath = path.join(originalDir, files[0]);
    }
  }

  let audioPath: string | undefined;
  if (fs.existsSync(audioDir)) {
    const files = fs
      .readdirSync(audioDir)
      .filter((f) => !f.startsWith(".") && fs.statSync(path.join(audioDir, f)).size > 0);
    const validAudio = files.find((f) =>
      f.endsWith(".mp3") || f.endsWith(".wav") || f.endsWith(".aac") || f.endsWith(".m4a") || f.endsWith(".ogg")
    );
    if (validAudio) {
      audioPath = path.join(audioDir, validAudio);
    } else if (files.length > 0) {
      audioPath = path.join(audioDir, files[0]);
    }
  }

  let finalVideoPath: string | undefined;
  if (fs.existsSync(finalDir)) {
    const files = fs
      .readdirSync(finalDir)
      .filter((f) => !f.startsWith(".") && (f.endsWith(".mp4") || f.endsWith(".webm")) && fs.statSync(path.join(finalDir, f)).size > 0);
    if (files.length > 0) {
      files.sort((a, b) => {
        const statA = fs.statSync(path.join(finalDir, a));
        const statB = fs.statSync(path.join(finalDir, b));
        return statB.mtimeMs - statA.mtimeMs;
      });
      finalVideoPath = path.join(finalDir, files[0]);
    }
  }

  let montageVideoPath: string | undefined;
  if (fs.existsSync(montageDir)) {
    const files = fs
      .readdirSync(montageDir)
      .filter((f) => !f.startsWith(".") && (f.endsWith(".mp4") || f.endsWith(".webm")) && fs.statSync(path.join(montageDir, f)).size > 0);
    if (files.length > 0) {
      files.sort((a, b) => {
        const statA = fs.statSync(path.join(montageDir, a));
        const statB = fs.statSync(path.join(montageDir, b));
        return statB.mtimeMs - statA.mtimeMs;
      });
      montageVideoPath = path.join(montageDir, files[0]);
    }
  }

  return {
    projectDir,
    originalDir,
    audioDir,
    captionsDir,
    renderDir,
    finalDir,
    montageDir,
    originalVideoPath,
    audioPath,
    captionsJsonPath: path.join(captionsDir, "captions.json"),
    subtitlesAssPath: path.join(captionsDir, "subtitles.ass"),
    subtitlesSrtPath: path.join(captionsDir, "subtitles.srt"),
    finalVideoPath,
    montageVideoPath,
  };
}

export function generateFinalFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `IslamView_Captioned_${year}-${month}-${day}_${hours}-${minutes}.mp4`;
}

export function cleanupTemporaryFiles(projectId: string): void {
  try {
    const paths = getProjectPaths(projectId);
    if (fs.existsSync(paths.renderDir)) {
      const renderFiles = fs.readdirSync(paths.renderDir);
      for (const file of renderFiles) {
        fs.unlinkSync(path.join(paths.renderDir, file));
      }
    }
  } catch (err) {
    console.warn("Cleanup warning for project", projectId, err);
  }
}
