import { useState } from 'react';
import type { ChangeEvent } from 'react';

type Props = {
  /** Called with the selected file when the user picks one */
  onUpload?: (file: File) => void;
  /** Input accept attribute (defaults to images) */
  accept?: string;
  /** Show a small preview image after selection */
  showPreview?: boolean;
};

export default function ImageUploader({ onUpload, accept = 'image/*', showPreview = true }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    if (showPreview) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }

    if (onUpload) onUpload(selected);
  }

  return (
    <div className="space-y-2">
      <input type="file" accept={accept} onChange={handleFileChange} />
      {showPreview && previewUrl && (
        <img src={previewUrl} alt="preview" style={{ maxWidth: 300 }} />
      )}
    </div>
  );
}