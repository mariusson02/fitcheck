import { useCallback, useState } from 'react';
import ImageUploader from './ImageUploader';
import useBodySegmentation from '../hooks/useBodySegmentation';

type Props = {
  /** Optional preview size */
  maxPreviewWidth?: number;
};

export default function SegmentPreview({ maxPreviewWidth = 300 }: Props) {
  const { status, loadModel, segmentFileAsDataUrl } = useBodySegmentation();
  const [segmentedDataUrl, setSegmentedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setSegmentedDataUrl(null);
      try {
        await loadModel();
        const dataUrl = await segmentFileAsDataUrl(file, { maxWidth: 512 });
        setSegmentedDataUrl(dataUrl);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? 'Segmentation failed');
      }
    },
    [loadModel, segmentFileAsDataUrl]
  );

  return (
    <div className="space-y-3">
      <p className="text-sm">Model status: {status}</p>
      <ImageUploader onUpload={handleUpload} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {segmentedDataUrl && (
        <div>
          <p className="text-sm">Segmented preview:</p>
          <img src={segmentedDataUrl} alt="segmented preview" style={{ maxWidth: maxPreviewWidth }} />
        </div>
      )}
    </div>
  );
}
