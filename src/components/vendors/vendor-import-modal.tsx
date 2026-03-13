'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type DetectedSource = 'the_knot' | 'wedding_wire' | 'unknown';

function detectSource(url: string): DetectedSource {
  const lower = url.toLowerCase();
  if (lower.includes('theknot.com')) return 'the_knot';
  if (lower.includes('weddingwire.com')) return 'wedding_wire';
  return 'unknown';
}

const sourceLabels: Record<DetectedSource, string> = {
  the_knot: 'The Knot',
  wedding_wire: 'WeddingWire',
  unknown: 'Unknown Source',
};

interface VendorImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManualEntry?: () => void;
}

export function VendorImportModal({
  open,
  onOpenChange,
  onManualEntry,
}: VendorImportModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [detectedSource, setDetectedSource] = useState<DetectedSource | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  function handleUrlChange(value: string) {
    setUrl(value);
    setImported(false);
    if (value.trim().length > 10) {
      setDetectedSource(detectSource(value));
    } else {
      setDetectedSource(null);
    }
  }

  async function handleImport() {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (detectedSource === 'unknown') {
      toast.error('Could not detect vendor source. Please use a link from The Knot or WeddingWire.');
      return;
    }

    setImporting(true);

    try {
      const res = await fetch('/api/vendors/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to import vendor');
        setImporting(false);
        return;
      }

      setImporting(false);
      setImported(true);
      toast.success(`Imported "${data.vendor.name}" successfully!`);
      onOpenChange(false);
      setUrl('');
      setDetectedSource(null);
      setImported(false);
      router.push(`/vendors/${data.vendor.id}`);
    } catch {
      toast.error('Failed to import vendor. Please try again.');
      setImporting(false);
    }
  }

  function handleManualFallback() {
    onOpenChange(false);
    setUrl('');
    setDetectedSource(null);
    setImported(false);
    onManualEntry?.();
  }

  function handleClose(newOpen: boolean) {
    if (!newOpen) {
      setUrl('');
      setDetectedSource(null);
      setImported(false);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-[#8B9F82]" />
            Import Vendor
          </DialogTitle>
          <DialogDescription>
            Paste a vendor listing URL from The Knot or WeddingWire to import their details automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="import-url">Vendor Listing URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#7A7A7A]" />
              <Input
                id="import-url"
                placeholder="https://www.theknot.com/marketplace/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {detectedSource && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                detectedSource === 'unknown'
                  ? 'bg-[#FEF3C7] text-[#D97706]'
                  : 'bg-[#D1FAE5] text-[#047857]'
              }`}
            >
              {detectedSource === 'unknown' ? (
                <AlertCircle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              <span>
                {detectedSource === 'unknown'
                  ? 'Source not recognized. Please use a URL from The Knot or WeddingWire.'
                  : `Detected: ${sourceLabels[detectedSource]}`}
              </span>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleManualFallback}>
            Manual Entry
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !url.trim()}
            className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
          >
            {importing ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
