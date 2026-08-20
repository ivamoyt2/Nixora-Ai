import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("مفتاح GEMINI_API_KEY غير متوفر في متغيرات البيئة.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

export interface RawCaptionCue {
  id?: string;
  start: number;
  end: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

// Ordered candidate models by highest availability and speed
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
];

async function generateContentWithRetryAndFallback(ai: GoogleGenAI, requestPayload: any) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini AI] Calling model "${model}" (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          ...requestPayload,
          model,
        });
        if (response && (response.text || response.candidates)) {
          console.log(`[Gemini AI] Model "${model}" responded successfully.`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err.message || "");
        const isTransient =
          err.status === 503 ||
          err.status === 429 ||
          err.status === 500 ||
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("fetch failed");

        console.warn(`[Gemini AI] Model "${model}" failed (attempt ${attempt}): ${msg}`);

        if (isTransient) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 800));
        } else {
          break;
        }
      }
    }
  }

  // If API completely failed, return null so we can provide starter fallback cues gracefully
  console.warn(`[Gemini AI] All models failed. Falling back to starter template cues.`);
  return null;
}

export async function transcribeArabicAudio(
  audioFilePath: string,
  videoType: "short" | "long" = "short"
): Promise<{ captions: RawCaptionCue[]; rawText: string; fallbackUsed?: boolean }> {
  const defaultStarterCues: RawCaptionCue[] = [
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
    {
      id: `cue_2_${Date.now()}`,
      start: 2.6,
      end: 5.2,
      text: "مرحباً بكم في إسلام فيو",
      words: [
        { word: "مرحباً", start: 2.6, end: 3.2 },
        { word: "بكم", start: 3.2, end: 3.8 },
        { word: "في", start: 3.8, end: 4.4 },
        { word: "إسلام", start: 4.4, end: 4.8 },
        { word: "فيو", start: 4.8, end: 5.2 },
      ],
    },
    {
      id: `cue_3_${Date.now()}`,
      start: 5.3,
      end: 8.0,
      text: "كابشن عربي احترافي وتأثيرات بصرية مميزة",
      words: [
        { word: "كابشن", start: 5.3, end: 5.8 },
        { word: "عربي", start: 5.8, end: 6.3 },
        { word: "احترافي", start: 6.3, end: 6.8 },
        { word: "وتأثيرات", start: 6.8, end: 7.4 },
        { word: "مميزة", start: 7.4, end: 8.0 },
      ],
    },
  ];

  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    return {
      captions: defaultStarterCues,
      rawText: defaultStarterCues.map((c) => c.text).join(" "),
      fallbackUsed: true,
    };
  }

  let ai: GoogleGenAI;
  try {
    ai = getAiClient();
  } catch (err: any) {
    console.warn("[Gemini AI] Client initialization warning:", err.message);
    return {
      captions: defaultStarterCues,
      rawText: defaultStarterCues.map((c) => c.text).join(" "),
      fallbackUsed: true,
    };
  }

  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString("base64");
  const ext = path.extname(audioFilePath).toLowerCase();
  const mimeType = ext === ".wav" ? "audio/wav" : ext === ".ogg" ? "audio/ogg" : "audio/mp3";

  const systemInstruction = `أنت خبير ومحرك ذكاء اصطناعي فائق الدقة متخصص في التعرف على الصوت وتفريغ الكلام العربي الصوتي (Automatic Speech Recognition & Word-Level Timestamping) لصناعة كابشن احترافي بأعلى معايير CapCut و Viral Shorts.

القواعد الصارمة للتفريغ وضبط التوقيت:
1. استمع للصوت العربي واستخرج كل الكلمات المنطوقة بدقة إملائية متقنة (قرآن كريم، أحاديث، فصحى، عاميات خليجية، مصرية، شامية، مغاربية).
2. تقسيم المقاطع (Cues):
   - لفيديوهات الشورتس والريلز (${videoType === "short" ? "شورتس عمودي" : "فيديو طويل"}): اجعل كل سطر قصيراً وديناميكياً (${videoType === "short" ? "2 إلى 4 كلمات فقط لكل سطر" : "5 إلى 8 كلمات لكل سطر"}) لتسهيل القراءة السريعة وزيادة تفاعل المشاهد.
3. دقة التوقيتات بالثواني (start & end):
   - حدد بدقة متناهية بداية ونهاية كل جملة (مثال: 1.25 إلى 3.40).
   - لا تجعل الفواصل الصامتة بين الجمل تسبب فراغات طويلة.
4. توقيت كل كلمة بالثانية الدقيقة (Word-Level Timing):
   - لكل كلمة في المصفوفة words: حدد توقيت start و end بالثواني الحقيقية التي نطق فيها المتحدث تلك الكلمة، مع وضع highlight: true على الكلمات المحورية أو ذات النبرة القوية (مثل: الله، رسول، نجاح، سر، انتبه، عظيم، فوز، حق، الخ).
5. أعد النتيجة بتنسيق JSON حصراً بدون أي شروح خارج الـ JSON:
{
  "cues": [
    {
      "start": 0.0,
      "end": 1.8,
      "text": "السلام عليكم ورحمة الله",
      "words": [
        { "word": "السلام", "start": 0.0, "end": 0.45, "highlight": false },
        { "word": "عليكم", "start": 0.45, "end": 0.9, "highlight": false },
        { "word": "ورحمة", "start": 0.9, "end": 1.35, "highlight": false },
        { "word": "الله", "start": 1.35, "end": 1.8, "highlight": true }
      ]
    }
  ]
}`;

  const prompt = `استمع للملف الصوتي المرفق واستخرج الكابشن العربي الاحترافي مع توقيت كل كلمة بدقة عالية بتنسيق JSON:`;

  const response = await generateContentWithRetryAndFallback(ai, {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const responseText = response?.text || "";
  let parsed: { cues: RawCaptionCue[] } = { cues: [] };

  if (responseText) {
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    }
  }

  // If no speech detected in audio or silent audio, provide clean structured starter cues
  if (!parsed.cues || !Array.isArray(parsed.cues) || parsed.cues.length === 0) {
    console.log("[Gemini AI] No speech in audio or silent sample. Providing starter editable cues.");
    const defaultStarterCues: RawCaptionCue[] = [
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
      {
        id: `cue_2_${Date.now()}`,
        start: 2.6,
        end: 5.2,
        text: "مرحباً بكم في إسلام فيو",
        words: [
          { word: "مرحباً", start: 2.6, end: 3.2 },
          { word: "بكم", start: 3.2, end: 3.8 },
          { word: "في", start: 3.8, end: 4.4 },
          { word: "إسلام", start: 4.4, end: 4.8 },
          { word: "فيو", start: 4.8, end: 5.2 },
        ],
      },
      {
        id: `cue_3_${Date.now()}`,
        start: 5.3,
        end: 8.0,
        text: "كابشن عربي احترافي وتأثيرات بصرية مميزة",
        words: [
          { word: "كابشن", start: 5.3, end: 5.8 },
          { word: "عربي", start: 5.8, end: 6.3 },
          { word: "احترافي", start: 6.3, end: 6.8 },
          { word: "وتأثيرات", start: 6.8, end: 7.4 },
          { word: "مميزة", start: 7.4, end: 8.0 },
        ],
      },
    ];

    return {
      captions: defaultStarterCues,
      rawText: defaultStarterCues.map((c) => c.text).join(" "),
      fallbackUsed: true,
    };
  }

  // Normalize and ensure each cue has words and IDs
  const normalizedCaptions: RawCaptionCue[] = parsed.cues.map((cue, index) => {
    const start = typeof cue.start === "number" ? Math.max(0, cue.start) : 0;
    const end = typeof cue.end === "number" ? Math.max(start + 0.3, cue.end) : start + 2;
    const text = (cue.text || "").trim();

    let words = cue.words;
    if (!words || !Array.isArray(words) || words.length === 0) {
      const splitWords = text.split(/\s+/).filter(Boolean);
      const totalWords = splitWords.length;
      const durationPerWord = totalWords > 0 ? (end - start) / totalWords : 0.5;
      words = splitWords.map((w, wIdx) => ({
        word: w,
        start: Number((start + wIdx * durationPerWord).toFixed(2)),
        end: Number((start + (wIdx + 1) * durationPerWord).toFixed(2)),
      }));
    }

    return {
      id: cue.id || `cue_${index + 1}_${Date.now()}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text,
      words: words.map((w: any) => ({
        word: (w.word || "").trim(),
        start: Number(Number(w.start).toFixed(2)),
        end: Number(Number(w.end).toFixed(2)),
        highlight: Boolean(w.highlight),
      })),
    };
  });

  const rawText = normalizedCaptions.map((c) => c.text).join(" ");

  return {
    captions: normalizedCaptions,
    rawText,
    fallbackUsed: false,
  };
}
