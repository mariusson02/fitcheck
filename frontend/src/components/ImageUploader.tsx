import type { ChangeEvent } from 'react';

type Props = {
  /** Called with the selected file when the user picks one */
  onUpload?: (file: File) => void;
  /** Input accept attribute (defaults to images) */
  accept?: string;
};

function ImageUploader({ onUpload, accept = 'image/*' }: Props) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (onUpload) onUpload(selected);
  }

  return (
    <div>
      <input type="file" accept={accept} onChange={handleFileChange} />
    </div>
  );
}

export default ImageUploader;