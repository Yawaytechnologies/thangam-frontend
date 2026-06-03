import { resolveFileUrl } from './file-url';

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function fileUrlFromObject(value: Record<string, unknown>): string {
  const keys = ['url', 'fileUrl', 'file_url', 'downloadUrl', 'download_url', 'pdfUrl', 'pdf_url', 'signedUrl'];
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
}

export function pdfFilename(prefix: string, displayId?: string | null, fallbackId?: string): string {
  const raw = displayId || fallbackId || 'document';
  const clean = raw.replace(/^#/, '').replace(/[^\w.-]+/g, '-');
  return `${prefix}-${clean}.pdf`;
}

export async function downloadResponseFile(data: unknown, contentType: string, filename: string): Promise<void> {
  if (data instanceof Blob) {
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      const text = await data.text();
      const trimmed = text.trim();

      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        triggerDownload(resolveFileUrl(trimmed), filename);
        return;
      }

      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const fileUrl = fileUrlFromObject(parsed);
      if (fileUrl) {
        triggerDownload(resolveFileUrl(fileUrl), filename);
        return;
      }
    }

    const objectUrl = URL.createObjectURL(data);
    triggerDownload(objectUrl, filename);
    URL.revokeObjectURL(objectUrl);
    return;
  }

  if (typeof data === 'string') {
    triggerDownload(resolveFileUrl(data), filename);
    return;
  }

  if (data && typeof data === 'object') {
    const fileUrl = fileUrlFromObject(data as Record<string, unknown>);
    if (fileUrl) {
      triggerDownload(resolveFileUrl(fileUrl), filename);
      return;
    }
  }

  throw new Error('Unsupported download response');
}
