import Tesseract from 'tesseract.js';

export interface ScanResult {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: 'gemini' | 'tesseract';
}

const USER_KEY = 'wwww-gemini-key';

/** Gemini API key: baked in at build time via VITE_GEMINI_API_KEY, or entered by the user in Settings. */
export function getGeminiKey(): string {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return stored;
  } catch {
    /* storage unavailable */
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
}

export function hasGeminiKey(): boolean {
  return getGeminiKey().length > 0;
}

export function setUserGeminiKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(USER_KEY, key.trim());
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Downscale an image file to a JPEG data URL (max 1024px on the long side) for the Gemini request. */
async function fileToJpegBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not read the image');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
}

async function scanWithGemini(file: File, key: string): Promise<Omit<ScanResult, 'source'>> {
  const { base64, mimeType } = await fileToJpegBase64(file);
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Extract the contact details from this business card photo. Return ONLY a JSON object with keys "name", "email", "phone", "company". Use an empty string for any field that is absent. No markdown, no explanation.',
              },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const parsed = JSON.parse(text) as { name?: string; email?: string; phone?: string; company?: string };
  return {
    name: parsed.name ?? '',
    email: parsed.email ?? '',
    phone: parsed.phone ?? '',
    company: parsed.company ?? '',
  };
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/;

export function parseCardText(text: string): Omit<ScanResult, 'source'> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const email = EMAIL_RE.exec(text)?.[0] ?? '';
  const phone = PHONE_RE.exec(text)?.[0] ?? '';
  const skip = /@|www\.|http|\d{3}[-.)\s]\d{3}|tel|fax|email|phone|mobile|address|suite|street|ave|blvd|road|dr\.|ln\.|ct\.|p\.o\. box/i;
  const nameLike = lines.find((l) => {
    if (skip.test(l)) return false;
    const words = l.split(/\s+/).filter((w) => /^[A-Z][a-zA-Z'’-]+$/.test(w));
    return words.length >= 2 && words.length <= 4 && l.length <= 40;
  });
  const companyLike =
    lines.find((l) => /inc\.?|llc|ltd\.?|corp\.?|company|co\.?$/i.test(l) && l !== nameLike) ??
    lines.find((l) => l !== nameLike && l !== email && l !== phone && !skip.test(l) && /^[A-Za-z][A-Za-z0-9 &.'-]+$/.test(l));
  return {
    name: nameLike ?? '',
    email,
    phone,
    company: companyLike ?? '',
  };
}

async function scanWithTesseract(file: File): Promise<Omit<ScanResult, 'source'>> {
  const worker = await Tesseract.createWorker('eng');
  try {
    const { data } = await worker.recognize(file);
    return parseCardText(data.text || '');
  } finally {
    await worker.terminate();
  }
}

/**
 * Scan a business-card photo and extract contact details.
 * Uses Gemini (gemini-3-flash-preview) when a Gemini API key is configured,
 * otherwise falls back to on-device OCR (Tesseract.js) so scanning works with no key.
 */
export async function scanBusinessCard(file: File): Promise<ScanResult> {
  const key = getGeminiKey();
  if (key) {
    try {
      const r = await scanWithGemini(file, key);
      return { ...r, source: 'gemini' };
    } catch (e) {
      console.warn('Gemini scan failed, falling back to on-device OCR', e);
    }
  }
  const r = await scanWithTesseract(file);
  return { ...r, source: 'tesseract' };
}
