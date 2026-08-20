#!/usr/bin/env python3
"""
Islam View Caption & Montage Studio — Python Local Worker
=========================================================
Port: 8765 (http://127.0.0.1:8765)
FFmpeg Path: C:\\ffmpeg\\bin\\ffmpeg.exe (or system PATH)

Provides high-speed local processing for:
1. Automated image + audio montage based on numerical filename indexing (1.png + 1.mp3 -> 2.png + 2.mp3).
2. Audio extraction for AI transcription.
3. Subtitle burning with ASS / SRT libass filters.
"""

import os
import sys
import json
import shutil
import tempfile
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
import cgi

PORT = 8765

def find_ffmpeg_executable():
    """Detect FFmpeg executable prioritizing C:\\ffmpeg\\bin\\ffmpeg.exe"""
    candidates = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\ffmpeg.exe",
        shutil.which("ffmpeg.exe"),
        shutil.which("ffmpeg")
    ]
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return "ffmpeg"

def find_ffprobe_executable():
    """Detect FFprobe executable prioritizing C:\\ffmpeg\\bin\\ffprobe.exe"""
    candidates = [
        r"C:\ffmpeg\bin\ffprobe.exe",
        r"C:\Program Files\ffmpeg\bin\ffprobe.exe",
        r"C:\ffmpeg\ffprobe.exe",
        shutil.which("ffprobe.exe"),
        shutil.which("ffprobe")
    ]
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return "ffprobe"

FFMPEG_BIN = find_ffmpeg_executable()
FFPROBE_BIN = find_ffprobe_executable()

def get_media_duration(file_path):
    """Get accurate duration in seconds using ffprobe or fallback"""
    try:
        cmd = [
            FFPROBE_BIN,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(result.stdout.strip())
    except Exception:
        return 0.0

class IslamViewWorkerHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self._send_cors_headers()
        if self.path in ["/", "/health", "/status"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {
                "status": "online",
                "worker": "IslamViewWorker",
                "ffmpeg": True,
                "ffmpegPath": FFMPEG_BIN,
                "ffprobePath": FFPROBE_BIN,
                "version": "2.0.0",
                "supportedFeatures": ["extract-audio", "render-captions", "auto-montage"]
            }
            self.wfile.write(json.dumps(resp).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        clean_path = self.path.split("?")[0]

        if clean_path in ["/extract-audio", "/audio/extract"]:
            self.handle_extract_audio()
        elif clean_path in ["/render", "/render-video"]:
            self.handle_render_subtitles()
        elif clean_path in ["/montage", "/render-montage"]:
            self.handle_render_montage()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_extract_audio(self):
        """Extract audio from video file to 16kHz MP3"""
        temp_dir = tempfile.mkdtemp(prefix="iv_extract_")
        try:
            ctype, pdict = cgi.parse_header(self.headers.get("content-type"))
            if ctype != "multipart/form-data":
                self.send_error(400, "Expected multipart/form-data")
                return

            pdict["boundary"] = bytes(pdict["boundary"], "utf-8")
            pdict["CONTENT-LENGTH"] = int(self.headers.get("content-length", 0))
            fields = cgi.parse_multipart(self.rfile, pdict)

            video_data = None
            for key in ["video", "file"]:
                if key in fields and len(fields[key]) > 0:
                    video_data = fields[key][0]
                    break

            if not video_data:
                self.send_error(400, "No video file provided in form-data")
                return

            in_video_path = os.path.join(temp_dir, "input_video.mp4")
            out_audio_path = os.path.join(temp_dir, "extracted.mp3")

            with open(in_video_path, "wb") as f:
                f.write(video_data)

            cmd = [
                FFMPEG_BIN, "-y",
                "-threads", "0",
                "-i", in_video_path,
                "-vn",
                "-acodec", "libmp3lame",
                "-ar", "16000",
                "-ac", "1",
                "-b:a", "64k",
                out_audio_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            if res.returncode != 0 or not os.path.exists(out_audio_path) or os.path.getsize(out_audio_path) == 0:
                self.send_response(422)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "هذا الفيديو لا يحتوي على مسار صوتي أو فشل استخراج الصوت."}).encode("utf-8"))
                return

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(os.path.getsize(out_audio_path)))
            self.end_headers()

            with open(out_audio_path, "rb") as f:
                shutil.copyfileobj(f, self.wfile)

        except Exception as e:
            self.send_response(500)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def handle_render_subtitles(self):
        """Burn ASS/SRT subtitles into input video using FFmpeg"""
        temp_dir = tempfile.mkdtemp(prefix="iv_burn_")
        try:
            ctype, pdict = cgi.parse_header(self.headers.get("content-type"))
            if ctype != "multipart/form-data":
                self.send_error(400, "Expected multipart/form-data")
                return

            pdict["boundary"] = bytes(pdict["boundary"], "utf-8")
            pdict["CONTENT-LENGTH"] = int(self.headers.get("content-length", 0))
            fields = cgi.parse_multipart(self.rfile, pdict)

            video_data = None
            for key in ["video", "file"]:
                if key in fields and len(fields[key]) > 0:
                    video_data = fields[key][0]
                    break

            if not video_data:
                self.send_error(400, "No video file provided")
                return

            ass_text = ""
            for key in ["subtitlesAss", "subtitles_ass", "ass_file"]:
                if key in fields and len(fields[key]) > 0:
                    val = fields[key][0]
                    ass_text = val.decode("utf-8", errors="ignore") if isinstance(val, bytes) else str(val)
                    break

            in_video_path = os.path.join(temp_dir, "input.mp4")
            sub_ass_path = os.path.join(temp_dir, "subtitles.ass")
            out_video_path = os.path.join(temp_dir, "rendered.mp4")

            with open(in_video_path, "wb") as f:
                f.write(video_data)

            with open(sub_ass_path, "w", encoding="utf-8") as f:
                f.write(ass_text)

            # Format path for FFmpeg filter on Windows
            escaped_ass = sub_ass_path.replace("\\", "/").replace(":", "\\:")
            vf = f"ass='{escaped_ass}'"

            cmd = [
                FFMPEG_BIN, "-y",
                "-threads", "0",
                "-i", in_video_path,
                "-vf", vf,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                out_video_path
            ]

            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode != 0 or not os.path.exists(out_video_path) or os.path.getsize(out_video_path) == 0:
                raise RuntimeError(f"FFmpeg render failed: {res.stderr.decode('utf-8', errors='ignore')[-300:]}")

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(os.path.getsize(out_video_path)))
            self.end_headers()

            with open(out_video_path, "rb") as f:
                shutil.copyfileobj(f, self.wfile)

        except Exception as e:
            self.send_response(500)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def handle_render_montage(self):
        """
        Automated Montage Engine:
        Pairs image_i with audio_i according to index (1.png + 1.mp3, 2.png + 2.mp3, etc.)
        Duration of each image = exact duration of audio_i.
        Applies smooth Ken Burns camera motions, visual filters, transitions, custom SFX, BGM, and Audio Ducking.
        Concatenates all segments into final MP4 video.
        """
        temp_dir = tempfile.mkdtemp(prefix="iv_montage_")
        try:
            ctype, pdict = cgi.parse_header(self.headers.get("content-type"))
            if ctype != "multipart/form-data":
                self.send_error(400, "Expected multipart/form-data")
                return

            pdict["boundary"] = bytes(pdict["boundary"], "utf-8")
            pdict["CONTENT-LENGTH"] = int(self.headers.get("content-length", 0))
            fields = cgi.parse_multipart(self.rfile, pdict)

            # Extract settings
            settings_raw = fields.get("settings", [b"{}"])[0]
            settings_str = settings_raw.decode("utf-8", errors="ignore") if isinstance(settings_raw, bytes) else str(settings_raw)
            try:
                settings = json.loads(settings_str)
            except Exception:
                settings = {}

            aspect_ratio = settings.get("aspectRatio", "9:16")
            res_choice = settings.get("resolution", "1080p")
            fit_mode = settings.get("fitMode", "contain")
            fps = int(settings.get("fps", 30))

            target_w = 1080
            target_h = 1920

            if aspect_ratio == "9:16":
                if res_choice == "720p": target_w, target_h = 720, 1280
                elif res_choice == "4k": target_w, target_h = 2160, 3840
                else: target_w, target_h = 1080, 1920
            elif aspect_ratio == "16:9":
                if res_choice == "720p": target_w, target_h = 1280, 720
                elif res_choice == "4k": target_w, target_h = 3840, 2160
                else: target_w, target_h = 1920, 1080
            elif aspect_ratio == "1:1":
                if res_choice == "720p": target_w, target_h = 720, 720
                elif res_choice == "4k": target_w, target_h = 2160, 2160
                else: target_w, target_h = 1080, 1080
            elif aspect_ratio == "4:5":
                if res_choice == "720p": target_w, target_h = 720, 900
                elif res_choice == "4k": target_w, target_h = 2160, 2700
                else: target_w, target_h = 1080, 1350

            # Ensure strictly even dimensions
            target_w = int(round(target_w / 2) * 2)
            target_h = int(round(target_h / 2) * 2)

            # Audio volume and ducking settings
            voice_vol = float(settings.get("voiceVolume", 100)) / 100.0
            bgm_vol = float(settings.get("bgmVolume", 15)) / 100.0
            sfx_vol = float(settings.get("sfxVolume", 70)) / 100.0
            enable_ducking = bool(settings.get("enableDucking", True))
            audio_fade_in = bool(settings.get("audioFadeIn", True))
            audio_fade_out = bool(settings.get("audioFadeOut", True))

            # Discover image, audio, and optional SFX files from fields
            image_keys = sorted([k for k in fields.keys() if k.startswith("image_") or k.startswith("image")])
            audio_keys = sorted([k for k in fields.keys() if k.startswith("audio_") or k.startswith("audio")])
            sfx_keys = sorted([k for k in fields.keys() if k.startswith("sfx_")])

            import re
            def extract_num(text):
                match = re.search(r"(\d+)", text)
                return int(match.group(1)) if match else 0

            indexed_images = {}
            for k in image_keys:
                idx = extract_num(k)
                if idx > 0 and len(fields[k]) > 0:
                    indexed_images[idx] = fields[k][0]

            indexed_audios = {}
            for k in audio_keys:
                idx = extract_num(k)
                if idx > 0 and len(fields[k]) > 0:
                    indexed_audios[idx] = fields[k][0]

            indexed_sfx = {}
            for k in sfx_keys:
                idx = extract_num(k)
                if idx > 0 and len(fields[k]) > 0:
                    indexed_sfx[idx] = fields[k][0]

            # Check for background music (BGM)
            bgm_data = None
            for bgm_k in ["bgm", "bgm_file", "background_music"]:
                if bgm_k in fields and len(fields[bgm_k]) > 0:
                    bgm_data = fields[bgm_k][0]
                    break

            all_indices = sorted(list(set(indexed_images.keys()).intersection(set(indexed_audios.keys()))))

            if not all_indices:
                raise ValueError("لم يتم العثور على أزواج صور وأصوات متطابقة في الأرقام (مثال: 1.png مع 1.mp3).")

            print(f"[IslamViewWorker] Starting Advanced Montage Assembly for {len(all_indices)} pairs: {all_indices}")

            pairs_meta = settings.get("pairsMeta", [])
            pairs_meta_map = {p.get("index"): p for p in pairs_meta if isinstance(p, dict)}

            # Available camera motions for auto_cycle
            MOTION_CYCLE = ["zoom_in", "pan_right", "zoom_out", "pan_left", "pan_up", "subtle_motion"]

            def render_segment_worker(idx_and_order):
                order_i, idx = idx_and_order
                img_data = indexed_images[idx]
                aud_data = indexed_audios[idx]
                sfx_data = indexed_sfx.get(idx)

                img_path = os.path.join(temp_dir, f"img_{idx}.png")
                aud_path = os.path.join(temp_dir, f"aud_{idx}.mp3")
                sfx_path = os.path.join(temp_dir, f"sfx_{idx}.wav") if sfx_data else None
                seg_out_path = os.path.join(temp_dir, f"seg_{idx}.mp4")

                with open(img_path, "wb") as f:
                    f.write(img_data)
                with open(aud_path, "wb") as f:
                    f.write(aud_data)
                if sfx_data and sfx_path:
                    with open(sfx_path, "wb") as f:
                        f.write(sfx_data)

                # Get exact duration of the audio
                dur = get_media_duration(aud_path)
                if dur <= 0.1:
                    dur = 3.0

                total_frames = max(2, int(dur * fps))

                # Per-clip motion and filter settings
                clip_meta = pairs_meta_map.get(idx, {})
                clip_motion = clip_meta.get("motion") or settings.get("globalMotion", "kenburns_in")
                clip_filter = clip_meta.get("filter") or settings.get("globalFilter", "warm_spiritual")
                clip_trans = clip_meta.get("transition") or settings.get("globalTransition", "fade")

                if clip_motion == "auto_cycle":
                    clip_motion = MOTION_CYCLE[order_i % len(MOTION_CYCLE)]

                # Build Video Filters Chain
                filter_chain = []

                # 1. Base Scale according to fitMode
                if fit_mode == "cover":
                    filter_chain.append(f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},setsar=1")
                elif fit_mode == "fill":
                    filter_chain.append(f"scale={target_w}:{target_h},setsar=1")
                else:
                    filter_chain.append(
                        f"scale=w='min({target_w},iw*{target_h}/ih)':h='min({target_h},ih*{target_w}/iw)':force_original_aspect_ratio=decrease,"
                        f"pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1"
                    )

                # 2. Smooth Ken Burns Camera Motion
                if clip_motion in ["zoom_in", "kenburns_in"]:
                    filter_chain.append(f"zoompan=z='min(zoom+0.0015,1.15)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={target_w}x{target_h}:fps={fps}")
                elif clip_motion in ["zoom_out", "kenburns_out"]:
                    filter_chain.append(f"zoompan=z='if(lte(on,1),1.15,max(1.0,zoom-0.0015))':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={target_w}x{target_h}:fps={fps}")
                elif clip_motion == "pan_left":
                    filter_chain.append(f"zoompan=z='1.12':x='if(lte(on,1),(iw-iw/zoom),max(0,x-1.5))':y='ih/2-(ih/zoom/2)':d={total_frames}:s={target_w}x{target_h}:fps={fps}")
                elif clip_motion == "pan_right":
                    filter_chain.append(f"zoompan=z='1.12':x='if(lte(on,1),0,min(iw-iw/zoom,x+1.5))':y='ih/2-(ih/zoom/2)':d={total_frames}:s={target_w}x{target_h}:fps={fps}")
                elif clip_motion == "pan_up":
                    filter_chain.append(f"zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,1),(ih-ih/zoom),max(0,y-1.5))':d={total_frames}:s={target_w}x{target_h}:fps={fps}")
                elif clip_motion == "pan_down":
                    filter_chain.append(f"zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,1),0,min(ih-ih/zoom,y+1.5))':d={total_frames}:s={target_w}x{target_h}:fps={fps}")
                elif clip_motion in ["subtle_motion", "subtle_pulse"]:
                    filter_chain.append(f"zoompan=z='1.03+0.02*sin(2*PI*on/{total_frames})':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={target_w}x{target_h}:fps={fps}")

                # 3. Visual Color Grading & Filters
                if clip_filter == "warm_spiritual":
                    filter_chain.append("eq=contrast=1.08:saturation=1.2,colorbalance=rs=0.1:gs=0.04:bs=-0.08")
                elif clip_filter == "cinematic_dark":
                    filter_chain.append("eq=contrast=1.22:brightness=-0.04:saturation=0.88")
                elif clip_filter == "vintage_quran":
                    filter_chain.append("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=contrast=1.1")
                elif clip_filter == "vivid_gold":
                    filter_chain.append("eq=contrast=1.15:saturation=1.35,colorbalance=rs=0.08:gs=0.05:bs=-0.05")
                elif clip_filter == "black_white":
                    filter_chain.append("hue=s=0,eq=contrast=1.2")
                elif clip_filter == "soft_glow":
                    filter_chain.append("gblur=sigma=1.2:steps=1,eq=contrast=1.05:brightness=0.02")
                elif clip_filter == "cool_night":
                    filter_chain.append("colorbalance=rs=-0.08:gs=0.02:bs=0.12,eq=contrast=1.1")
                elif clip_filter == "sharpen":
                    filter_chain.append("unsharp=5:5:1.0:5:5:0.0")
                elif clip_filter == "blur":
                    filter_chain.append("gblur=sigma=2.5:steps=1")

                # 4. Overlays
                overlay = settings.get("overlay", "none")
                if overlay == "vignette":
                    filter_chain.append("vignette=PI/4")
                elif overlay == "cinema_bars":
                    filter_chain.append(f"drawbox=x=0:y=0:w=iw:h=ih*0.08:color=black@1:t=fill,drawbox=x=0:y=ih-ih*0.08:w=iw:h=ih*0.08:color=black@1:t=fill")

                # 5. Transitions
                t_dur = min(float(settings.get("transitionDuration", 0.4)), max(0.1, dur * 0.35))
                if clip_trans in ("fade", "crossfade", "dissolve"):
                    filter_chain.append(f"fade=t=in:st=0:d={t_dur:.2f}")
                    if order_i < len(all_indices) - 1 and dur > t_dur * 2:
                        filter_chain.append(f"fade=t=out:st={max(0, dur - t_dur):.2f}:d={t_dur:.2f}")
                elif clip_trans == "flash":
                    filter_chain.append(f"fade=t=in:st=0:d={min(0.25, dur * 0.2):.2f}:color=white")
                elif clip_trans == "blur":
                    filter_chain.append(f"gblur=sigma='if(lte(t,{t_dur:.2f}),12*(1-t/{t_dur:.2f}),0)'")

                filter_chain.append("format=yuv420p")
                full_vf_str = ",".join(filter_chain)

                # Audio Filter Chain & Mixing
                # Inputs: 0: Image, 1: Main Audio (Voice), [Optional 2: Scene SFX]
                cmd_inputs = [
                    "-loop", "1",
                    "-framerate", str(fps),
                    "-t", str(dur),
                    "-i", img_path,
                    "-i", aud_path
                ]

                if sfx_path and os.path.exists(sfx_path):
                    cmd_inputs.extend(["-i", sfx_path])
                    filter_complex = f"[0:v]{full_vf_str}[outv];[1:a]volume={voice_vol:.2f}[v_aud];[2:a]volume={sfx_vol:.2f}[s_aud];[v_aud][s_aud]amix=inputs=2:duration=first[outa]"
                    cmd_seg = [
                        FFMPEG_BIN, "-y",
                        "-threads", "0",
                        *cmd_inputs,
                        "-filter_complex", filter_complex,
                        "-map", "[outv]",
                        "-map", "[outa]",
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-crf", "20",
                        "-c:a", "aac",
                        "-b:a", "192k",
                        "-ar", "44100",
                        "-ac", "2",
                        "-shortest",
                        seg_out_path
                    ]
                else:
                    # Single voice track with volume and optional clip-edge fading
                    af_chain = [f"volume={voice_vol:.2f}"]
                    if order_i == 0 and audio_fade_in:
                        af_chain.append("afade=t=in:ss=0:d=0.3")
                    if order_i == len(all_indices) - 1 and audio_fade_out and dur > 0.8:
                        af_chain.append(f"afade=t=out:st={max(0, dur - 0.6):.2f}:d=0.6")

                    cmd_seg = [
                        FFMPEG_BIN, "-y",
                        "-threads", "0",
                        *cmd_inputs,
                        "-vf", full_vf_str,
                        "-af", ",".join(af_chain),
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-tune", "stillimage",
                        "-crf", "20",
                        "-c:a", "aac",
                        "-b:a", "192k",
                        "-ar", "44100",
                        "-ac", "2",
                        "-shortest",
                        seg_out_path
                    ]

                res = subprocess.run(cmd_seg, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode != 0 or not os.path.exists(seg_out_path) or os.path.getsize(seg_out_path) == 0:
                    err_msg = res.stderr.decode("utf-8", errors="ignore")[-300:]
                    raise RuntimeError(f"فشل توليد مقطع المونتاج للزوج رقم {idx}: {err_msg}")

                print(f"[IslamViewWorker] Rendered segment {idx} ({dur:.2f}s, Motion: {clip_motion}, Filter: {clip_filter})")
                return (order_i, seg_out_path)

            # Process all segments in parallel using ThreadPoolExecutor
            max_workers = min(8, max(2, (os.cpu_count() or 4)))
            segment_results = [None] * len(all_indices)

            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(render_segment_worker, (i, idx)) for i, idx in enumerate(all_indices)]
                for future in as_completed(futures):
                    order_i, seg_path = future.result()
                    segment_results[order_i] = seg_path

            segment_videos = [s for s in segment_results if s]

            # Concatenate all segment videos
            concat_list_path = os.path.join(temp_dir, "concat_list.txt")
            with open(concat_list_path, "w", encoding="utf-8") as f:
                for seg in segment_videos:
                    safe_seg = seg.replace("\\", "/")
                    f.write(f"file '{safe_seg}'\n")

            temp_concat_video = os.path.join(temp_dir, "temp_concat.mp4")

            cmd_concat = [
                FFMPEG_BIN, "-y",
                "-threads", "0",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_list_path,
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "20",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                temp_concat_video
            ]

            res_cat = subprocess.run(cmd_concat, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res_cat.returncode != 0 or not os.path.exists(temp_concat_video) or os.path.getsize(temp_concat_video) == 0:
                # Fallback: concat filter
                filter_inputs = []
                filter_complex_parts = []
                for i, seg in enumerate(segment_videos):
                    filter_inputs.extend(["-i", seg])
                    filter_complex_parts.append(f"[{i}:v][{i}:a]")
                filter_complex_str = "".join(filter_complex_parts) + f"concat=n={len(segment_videos)}:v=1:a=1[outv][outa]"

                cmd_complex = [
                    FFMPEG_BIN, "-y",
                    "-threads", "0",
                    *filter_inputs,
                    "-filter_complex", filter_complex_str,
                    "-map", "[outv]",
                    "-map", "[outa]",
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    temp_concat_video
                ]
                res_comp = subprocess.run(cmd_complex, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res_comp.returncode != 0 or not os.path.exists(temp_concat_video) or os.path.getsize(temp_concat_video) == 0:
                    raise RuntimeError(f"فشل دمج مقاطع المونتاج النهائية: {res_comp.stderr.decode('utf-8', errors='ignore')[-300:]}")

            final_montage_path = os.path.join(temp_dir, "final_montage.mp4")

            # If Background Music (BGM) is attached, mix it with Audio Ducking
            if bgm_data:
                bgm_path = os.path.join(temp_dir, "bgm.mp3")
                with open(bgm_path, "wb") as f:
                    f.write(bgm_data)

                total_montage_dur = get_media_duration(temp_concat_video)

                # Mix BGM with automatic Ducking so voice remains clear
                if enable_ducking:
                    ducking_filter = (
                        f"[1:a]volume={bgm_vol:.2f}[bgm_low];"
                        f"[0:a][bgm_low]amix=inputs=2:duration=first:dropout_transition=2[aout]"
                    )
                else:
                    ducking_filter = (
                        f"[1:a]volume={bgm_vol:.2f}[bgm_aud];"
                        f"[0:a][bgm_aud]amix=inputs=2:duration=first[aout]"
                    )

                cmd_bgm = [
                    FFMPEG_BIN, "-y",
                    "-threads", "0",
                    "-i", temp_concat_video,
                    "-stream_loop", "-1",
                    "-i", bgm_path,
                    "-filter_complex", ducking_filter,
                    "-map", "0:v",
                    "-map", "[aout]",
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-shortest",
                    final_montage_path
                ]

                res_bgm = subprocess.run(cmd_bgm, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res_bgm.returncode != 0 or not os.path.exists(final_montage_path) or os.path.getsize(final_montage_path) == 0:
                    print(f"[IslamViewWorker] BGM mix failed, keeping pure voiceover video.")
                    shutil.copyfile(temp_concat_video, final_montage_path)
            else:
                shutil.copyfile(temp_concat_video, final_montage_path)

            final_size = os.path.getsize(final_montage_path)
            print(f"[IslamViewWorker] Montage Video Rendered Successfully! Size: {final_size / (1024*1024):.2f} MB")

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(final_size))
            self.end_headers()

            with open(final_montage_path, "rb") as f:
                shutil.copyfileobj(f, self.wfile)

        except Exception as e:
            print(f"[IslamViewWorker] Montage Error: {e}", file=sys.stderr)
            self.send_response(500)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

def run_server():
    print("=" * 60)
    print("  Islam View Caption & Montage Studio — Python Local Worker")
    print("=" * 60)
    print(f"[*] FFmpeg Path detected : {FFMPEG_BIN}")
    print(f"[*] FFprobe Path detected: {FFPROBE_BIN}")
    print(f"[*] Listening on address : http://127.0.0.1:{PORT}")
    print("=" * 60)
    server = HTTPServer(("127.0.0.1", PORT), IslamViewWorkerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping Islam View Local Worker...")
        server.server_close()

if __name__ == "__main__":
    run_server()
