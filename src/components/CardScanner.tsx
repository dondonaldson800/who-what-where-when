import { useRef, useState } from 'react';
import { ScanLine, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { scanBusinessCard, hasGeminiKey, type ScanResult } from '@/lib/ocr';

export function CardScanner({ onScanned }: { onScanned: (r: ScanResult) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setScanning(true);
    try {
      const res = await scanBusinessCard(file);
      onScanned(res);
      setScanned(true);
      toast.success(res.source === 'gemini' ? 'Card scanned — check the details' : 'Card scanned on-device — check the details');
    } catch (e) {
      console.error(e);
      toast.error("Couldn't read that card. Try again or type the details.");
    } finally {
      setScanning(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        <button type="button" disabled={scanning} onClick={() => input.current?.click()}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-foreground text-base font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-60">
          {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
          {scanning ? 'Reading card…' : scanned ? 'Rescan card' : 'Scan business card'}
        </button>
        {scanned && !scanning && (
          <button type="button" onClick={() => setScanned(false)} aria-label="Clear scanned card"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-input hover:border-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {hasGeminiKey()
          ? 'Card reading uses Gemini (high accuracy).'
          : 'Card reading uses on-device OCR. Add a Gemini API key in Settings below for better accuracy.'}
      </p>
    </div>
  );
}
