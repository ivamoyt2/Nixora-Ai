export interface CaptionWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  highlight?: boolean;
}

export interface CaptionCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words: CaptionWord[];
  highlightWordIndex?: number;
}

export type CaptionStyleType =
  | 'viral'
  | 'colorful'
  | 'clean'
  | 'highlight'
  | 'quran_gold'
  | 'neon_cyber'
  | 'podcast_box'
  | 'mrbeast'
  | 'islamic_emerald'
  | 'minimal_luxury'
  | 'comic_pop'
  | 'cinematic'
  | 'fire_energy'
  | 'pastel_soft';

export type ArabicFontFamily =
  | 'Cairo'
  | 'Tajawal'
  | 'Almarai'
  | 'Readex Pro'
  | 'Amiri'
  | 'Alexandria'
  | 'El Messiri'
  | 'Changa'
  | 'Kufam'
  | 'Lemonada'
  | 'Rubik';

export type VideoType = 'short' | 'long';

export type WordAnimationEffect =
  | 'karaoke_highlight' // Active word changes color (e.g. Yellow / Emerald)
  | 'pop_active'        // Active word zooms in + pops
  | 'color_wave'        // Dynamic alternating gradient palette
  | 'box_active'        // Highlighting background pill on active word
  | 'glow_active'       // Glowing aura around active word
  | 'one_word'          // Display single word rapidly (TikTok Rapid)
  | 'classic';          // Classic line subtitle (clean, no word flicker)

export interface CaptionStyleConfig {
  styleType: CaptionStyleType;
  fontFamily: ArabicFontFamily;
  fontSize: number; // in pt / px
  scaleX: number; // 50 to 200% (width scaling)
  scaleY: number; // 50 to 200% (height scaling)
  rotation: number; // -180 to 180 degrees
  positionXPercent: number; // 5% to 95% (50 = centered)
  positionYPercent: number; // 5% to 95% (75 = default bottom)
  letterSpacing: number; // -2 to 10px
  lineHeight: number; // 1.0 to 2.2
  primaryColor: string; // hex
  highlightColor: string; // hex for highlighted words/accents
  secondaryHighlightColor?: string; // hex for multi-color waves
  strokeColor: string;
  strokeWidth: number; // 0 - 8
  backgroundColor: string; // rgba or transparent
  backgroundOpacity: number; // 0 - 100
  wordsPerLine: number; // 2 to 10
  animation: 'pop' | 'bounce' | 'fade' | 'glow' | 'none';
  wordEffect?: WordAnimationEffect; // Dynamic word effect
  textTransform: 'none' | 'shadow' | 'box';
  shadowColor: string;
  shadowBlur: number;
  hasShadow?: boolean; // toggle shadow explicitly
  presetId?: string;
}

export interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
  aspectRatio: string;
  videoType: VideoType;
  exportResolution?: '1080p' | '720p' | '4k';
  exportFps?: '30' | '60';
  exportQuality?: 'high' | 'ultra' | 'balanced';
  exportAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  exportFitMode?: 'contain' | 'cover' | 'stretch' | 'blur_padding';
  customFilename?: string;
}

export interface ProjectInfo {
  id: string;
  createdAt: string;
  videoMetadata?: VideoMetadata;
  captions: CaptionCue[];
  styleConfig: CaptionStyleConfig;
  status: 'idle' | 'uploading' | 'extracting' | 'transcribing' | 'ready' | 'rendering' | 'completed' | 'error';
  renderProgress: number;
  errorMessage?: string;
  finalVideoFilename?: string;
}

export interface TranscriptionResponse {
  success: boolean;
  captions: CaptionCue[];
  language?: string;
  confidence?: number;
  rawText?: string;
  error?: string;
}

export interface RenderResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

// ----------------------------------------------------
// AUTOMATED MONTAGE & VIDEO EDITING SYSTEM TYPES
// ----------------------------------------------------

export type TransitionType =
  | 'none'
  | 'fade'
  | 'crossfade'
  | 'wipeleft'
  | 'wiperight'
  | 'slideleft'
  | 'slideright'
  | 'slideup'
  | 'slidedown'
  | 'circleopen'
  | 'zoomIn'
  | 'zoomOut'
  | 'blur'
  | 'flash'
  | 'dissolve';

export type MotionEffect =
  | 'none'
  | 'auto_cycle'
  | 'kenburns_in'
  | 'kenburns_out'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'subtle_motion'
  | 'subtle_pulse';

export type VisualFilter =
  | 'none'
  | 'warm_spiritual'
  | 'cinematic_dark'
  | 'vintage_quran'
  | 'vivid_gold'
  | 'black_white'
  | 'soft_glow'
  | 'cool_night'
  | 'sharpen'
  | 'blur';

export type OverlayEffect =
  | 'none'
  | 'vignette'
  | 'light_leak'
  | 'particles_dust'
  | 'cinema_bars'
  | 'islamic_frame';

export interface MontagePairItem {
  id: string;
  index: number; // Numerical index e.g., 1 from '1.png' / '01.mp3'
  // Image data
  imageFile?: File;
  imageName?: string;
  imageUrl?: string;
  // Audio data (Voiceover)
  audioFile?: File;
  audioName?: string;
  audioUrl?: string;
  // Optional Custom Sound Effect for this scene (e.g. 01.wav)
  sfxFile?: File;
  sfxName?: string;
  sfxUrl?: string;
  // Timing & Validation
  duration: number; // Exact duration of this segment in seconds (derived from audio)
  startTime: number; // Cumulative start time in seconds
  endTime: number; // Cumulative end time in seconds
  isPaired: boolean; // True if both image & audio are present for this index
  error?: string; // Missing audio / image warning message
  // Per-Clip Editing Controls
  transition?: TransitionType;
  motion?: MotionEffect;
  filter?: VisualFilter;
  sfxTrigger?: string; // e.g. 'whoosh', 'impact', 'page_turn', 'custom'
  captionNote?: string;
}

export interface MontageSettings {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  resolution: '1080p' | '720p' | '4k';
  fps: '30' | '60';
  fitMode: 'contain' | 'cover' | 'fill';
  backgroundColor: string;
  customFilename?: string;
  // Transitions & Effects
  globalTransition: TransitionType;
  transitionDuration: number; // in seconds, e.g. 0.4
  globalMotion: MotionEffect;
  globalFilter: VisualFilter;
  overlay: OverlayEffect;
  // Audio Controls & Ducking
  voiceVolume: number; // 0 to 100 (Default 100)
  bgmVolume: number; // 0 to 100 (Default 15)
  sfxVolume: number; // 0 to 100 (Default 70)
  enableDucking: boolean; // Auto Ducking for BGM & SFX when voice speaks
  audioFadeIn: boolean; // Fade in audio
  audioFadeOut: boolean; // Fade out audio
  autoSfxOnTransition: boolean;
  sfxType: string; // default SFX for transitions (whoosh, impact, etc.)
  bgmTrack?: string;
  bgmFile?: File;
  bgmName?: string;
}

export interface MontageProject {
  id: string;
  pairs: MontagePairItem[];
  totalDuration: number;
  settings: MontageSettings;
  status: 'idle' | 'analyzing' | 'ready' | 'rendering' | 'completed' | 'error';
  progress: number;
  stageText: string;
  errorMessage?: string;
  renderedVideoUrl?: string;
  renderedFilename?: string;
  projectId?: string;
}

// ----------------------------------------------------
// PLATFORM NAVIGATION & USER STATE
// ----------------------------------------------------
export type AppPage =
  | 'home'
  | 'editor'
  | 'projects'
  | 'pricing'
  | 'about'
  | 'faq'
  | 'settings'
  | 'account'
  | 'contact';

export interface SavedProjectRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  type: 'montage' | 'caption';
  videoType: VideoType;
  duration: number;
  thumbnailUrl?: string;
  captionsCount?: number;
  pairsCount?: number;
  status: 'draft' | 'completed' | 'exported';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  avatarUrl?: string;
  createdAt: string;
  rendersCount: number;
  totalRenderedMinutes: number;
}


