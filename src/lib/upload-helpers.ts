export function extractEntityId(value: unknown, nestedKeys: string[] = []): string {
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  if (typeof record.id === 'string' && record.id) return record.id;

  const data = record.data;
  if (data && typeof data === 'object') {
    const dataRecord = data as Record<string, unknown>;
    if (typeof dataRecord.id === 'string' && dataRecord.id) return dataRecord.id;

    for (const key of nestedKeys) {
      const nested = dataRecord[key];
      if (nested && typeof nested === 'object') {
        const nestedId = (nested as Record<string, unknown>).id;
        if (typeof nestedId === 'string' && nestedId) return nestedId;
      }
    }
  }

  for (const key of nestedKeys) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const nestedId = (nested as Record<string, unknown>).id;
      if (typeof nestedId === 'string' && nestedId) return nestedId;
    }
  }

  return '';
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta, data] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}
