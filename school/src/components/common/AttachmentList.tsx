import { Paperclip, Download } from 'lucide-react';
import type { MockAttachment } from '@/types';
import { useToast } from '@/hooks/useToast';

/** Renders mock attachment links. Downloads are simulated with a toast. */
export function AttachmentList({ attachments }: { attachments: MockAttachment[] }) {
  const toast = useToast();
  if (!attachments.length) return null;
  return (
    <ul className="space-y-1.5">
      {attachments.map((att) => (
        <li key={att.id}>
          <button
            type="button"
            onClick={() => toast(`Simulated download: ${att.name}`, 'info')}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="flex-1 truncate">{att.name}</span>
            <span className="text-xs text-slate-400">{att.sizeKb} KB</span>
            <Download className="h-4 w-4 text-slate-400" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
