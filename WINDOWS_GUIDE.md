# Islam View Caption Studio — دليل تشغيل Python Local Worker على Windows

استوديو متكامل لتفريغ الكلام العربي وتوليد الكابشن المتزامن بدقة عالية وحرقه في الفيديو النهائي باستخدام Gemini AI و Python Local Worker المتصل بـ FFmpeg على Windows.

---

## 1. بنية النظام والـ Python Local Worker

يعمل التطبيق عبر ربط مباشر مع **Python Local Worker** على جهاز Windows:

- **عنوان الـ Worker**: `http://127.0.0.1:8765`
- **محرك FFmpeg على Windows**: `C:\ffmpeg\bin\ffmpeg.exe`
- **فحص الاتصال (`GET /health` أو `GET /`)**:
  ```json
  {"status": "online", "worker": "IslamViewWorker", "ffmpeg": true}
  ```

---

## 2. خطوات تشغيل الـ Python Worker على Windows

1. تأكد من تثبيت FFmpeg في المسار `C:\ffmpeg\bin\ffmpeg.exe` (أو وجوده في مسار الـ PATH).
2. شغّل الـ Python Worker الخاص بك:
   ```cmd
   python worker.py
   ```
   أو إذا كنت تستخدم FastAPI / Uvicorn:
   ```cmd
   uvicorn worker:app --host 127.0.0.1 --port 8765
   ```
3. عند فتح التطبيق، سيتحقق تلقائيًا من وجود الـ Worker المباشر ويعرض علامة الاتصال الخضراء 🟢.

---

## 3. مسارات التواصل (HTTP Endpoints) بين التطبيق و Python Worker

| المسار | الطريقة | الوصف | البيانات المرسلة | الاستجابة |
| :--- | :--- | :--- | :--- | :--- |
| `/health` أو `/` | `GET` | فحص صحة الـ Worker واتصال FFmpeg | لا يوجد | JSON به حالة `online` و `ffmpeg: true` |
| `/extract-audio` | `POST` | استخراج الصوت من الفيديو بدقة 16kHz أحادي | `FormData` يحتوي على ملف الفيديو `video` | ملف الصوت MP3 بصيغة بايتات دفقية |
| `/render` | `POST` | حرق الكابشن ASS/SRT في الفيديو النهائي | `FormData` يحتوي على `video` و `subtitlesAss` و `subtitlesSrt` | ملف الفيديو النهائي MP4 المحروق |

---

## 4. مخطط تدفق العمليات (Full Processing Workflow)

```
[ المتصفح / Web UI ]
       │
       ▼ (1. رفع الفيديو)
[ تطبيق Express + Vite ] (Port 3000)
       │
       ▼ (2. طلب استخراج الصوت POST /extract-audio)
[ Python Local Worker ] (http://127.0.0.1:8765)
       │
       ▼ (3. تنفيذ C:\ffmpeg\bin\ffmpeg.exe)
[ استخراج الصوت 16kHz MP3 وإرجاعه للتطبيق ]
       │
       ▼ (4. استدعاء Gemini AI لتفريغ الكلام العربي وتوقيت الكلمات)
[ Gemini 3.7 Flash ]
       │
       ▼ (5. إنشاء وتخصيص كابشن ASS المتزامن)
[ محرر الكابشن في الواجهة ]
       │
       ▼ (6. طلب الرندر POST /render)
[ Python Local Worker ] (http://127.0.0.1:8765)
       │
       ▼ (7. حرق الكابشن عبر C:\ffmpeg\bin\ffmpeg.exe مع libass)
[ إرجاع الفيديو النهائي MP4 والتحقق من حجمه الفعلي ]
       │
       ▼ (8. تمكين زر التحميل والمعاينة)
[ تنزيل الفيديو النهائي IslamView_Captioned_*.mp4 ]
```
