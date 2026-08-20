// Web Audio Synthesizer for high-fidelity Sound Effects (SFX) and Ambient Music
// Works completely offline, zero network dependencies, instant zero-latency playback

class SfxSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. Whoosh / Swoosh - Fast dynamic transition whoosh
  public playWhoosh(volume = 0.6, pitchMod = 1.0) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 0.45;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish shaped noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.25;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter sweep (rising then falling)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.0, now);
      filter.frequency.setValueAtTime(200 * pitchMod, now);
      filter.frequency.exponentialRampToValueAtTime(1800 * pitchMod, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(280 * pitchMod, now + duration);

      // Gain Envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 2. Cinematic Bass Hit / Impact Boom
  public playImpact(volume = 0.7) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 1.4;

      // Sub oscillator
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(18, now + duration);

      // Punch oscillator (mid thump)
      const punch = ctx.createOscillator();
      punch.type = 'triangle';
      punch.frequency.setValueAtTime(160, now);
      punch.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      punch.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      punch.start(now);
      osc.stop(now + duration);
      punch.stop(now + duration);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 3. Cinematic Riser / Tension Build
  public playRiser(volume = 0.5) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 1.5;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + duration);
      filter.Q.setValueAtTime(5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 4. Page Turn / Quran Parchment Flip
  public playPageTurn(volume = 0.6) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 0.35;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.12));
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 5. Celestial / Spiritual Crystal Chime (528 Hz Solfeggio / Harmonic)
  public playCrystalChime(volume = 0.6) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 2.2;

      const freqs = [528, 1056, 1584, 2112];
      const gains = [0.6, 0.3, 0.15, 0.08];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.8, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      masterGain.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(gains[idx], now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * (1 - idx * 0.15));

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 6. Camera Click / Shutter Flash
  public playCameraClick(volume = 0.6) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Click 1 (Mirror up)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(volume * 0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Click 2 (Shutter close)
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(900, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.12);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(volume * 0.7, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.14);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 7. Heartbeat Reverence Pulse
  public playHeartbeat(volume = 0.7) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const playThump = (time: number, freq: number, intensity: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(25, time + 0.18);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(intensity * volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.23);
      };

      // Lub - Dub
      playThump(now, 75, 0.9);
      playThump(now + 0.16, 60, 0.65);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // 8. Rain & Nature Ambient Burst
  public playRainBurst(volume = 0.5) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 1.2;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {
      console.warn('SFX audio error:', e);
    }
  }

  // Master trigger by sound effect ID
  public triggerSfx(type: string, volume = 0.6) {
    switch (type) {
      case 'whoosh':
      case 'whoosh_fast':
        this.playWhoosh(volume, 1.2);
        break;
      case 'whoosh_deep':
        this.playWhoosh(volume, 0.7);
        break;
      case 'impact':
      case 'cinematic_boom':
        this.playImpact(volume);
        break;
      case 'riser':
        this.playRiser(volume);
        break;
      case 'page_turn':
        this.playPageTurn(volume);
        break;
      case 'crystal_chime':
      case 'spiritual_bell':
        this.playCrystalChime(volume);
        break;
      case 'camera_click':
        this.playCameraClick(volume);
        break;
      case 'heartbeat':
        this.playHeartbeat(volume);
        break;
      case 'rain_nature':
        this.playRainBurst(volume);
        break;
      default:
        this.playWhoosh(volume);
    }
  }
}

export const sfxSynthesizer = new SfxSynthesizer();

export interface SfxCatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'transitions' | 'cinematic' | 'spiritual' | 'ambient' | 'nature';
  icon: string;
  description: string;
}

export const SFX_CATALOG: SfxCatalogItem[] = [
  {
    id: 'whoosh',
    nameAr: 'ووش انتقال سينمائي',
    nameEn: 'Cinematic Whoosh',
    category: 'transitions',
    icon: 'Wind',
    description: 'صوت هواء سريع وانتقال ديناميكي مشهور في الريلز',
  },
  {
    id: 'whoosh_deep',
    nameAr: 'ووش عميق ثقيل',
    nameEn: 'Deep Bass Whoosh',
    category: 'transitions',
    icon: 'Disc',
    description: 'انتقال منخفض النبرة للمشاهد المهيبة والقوية',
  },
  {
    id: 'impact',
    nameAr: 'ضربة باس سينمائية',
    nameEn: 'Cinematic Impact Sub',
    category: 'cinematic',
    icon: 'Zap',
    description: 'ضربة قوية وباس عميق للأحداث البارزة والعناوين',
  },
  {
    id: 'riser',
    nameAr: 'تصاعد تشويقي (Riser)',
    nameEn: 'Dramatic Tension Riser',
    category: 'cinematic',
    icon: 'TrendingUp',
    description: 'تصاعد تدريجي مشوق قبل الانتقال للنقطة التالية',
  },
  {
    id: 'page_turn',
    nameAr: 'تقليب صفحة مصحف/كتاب',
    nameEn: 'Crisp Page Turn',
    category: 'spiritual',
    icon: 'BookOpen',
    description: 'صوت تقليب ورق ناعم مناسب للقصص والآيات والكتب',
  },
  {
    id: 'crystal_chime',
    nameAr: 'رنين بلوري روحاني (528Hz)',
    nameEn: 'Celestial Crystal Chime',
    category: 'spiritual',
    icon: 'Sparkles',
    description: 'رنين بلوري هادئ وتردد شجي يعكس الخشوع والسكينة',
  },
  {
    id: 'camera_click',
    nameAr: 'التقاط كاميرا وفلاش',
    nameEn: 'Camera Shutter Click',
    category: 'ambient',
    icon: 'Camera',
    description: 'صوت التقاط صور ولحظات وثائقية',
  },
  {
    id: 'heartbeat',
    nameAr: 'نبضات قلب وخشوع',
    nameEn: 'Heartbeat Reverence',
    category: 'cinematic',
    icon: 'Heart',
    description: 'نبضات قلب دافئة للأجواء المؤثرة والمواعظ',
  },
  {
    id: 'rain_nature',
    nameAr: 'نسيم مطر وطبيعة',
    nameEn: 'Nature Rain Ambience',
    category: 'nature',
    icon: 'CloudRain',
    description: 'صوت رذاذ مطر هادئ ونسيم إسلامي لطيف',
  },
];
