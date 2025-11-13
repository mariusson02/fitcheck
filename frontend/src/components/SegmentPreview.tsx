import { useCallback, useState } from 'react';
import ImageUploader from './ImageUploader';
import useBodySegmentation from '../hooks/useBodySegmentation';
import { getPaletteFromCanvas, scorePalette } from '../utils/colorAnalysis';
import '../index.css';

type Props = {
  /** Optional preview size */
  maxPreviewWidth?: number;
};

export default function SegmentPreview({ maxPreviewWidth = 300 }: Props) {
  const { status, loadModel, segmentFileAsDataUrl } = useBodySegmentation();
  const [segmentedDataUrl, setSegmentedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[] | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setSegmentedDataUrl(null);
      try {
        await loadModel();
        const dataUrl = await segmentFileAsDataUrl(file, { maxWidth: 512 });
        setSegmentedDataUrl(dataUrl);

        // Analyze palette from the segmented data URL
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const result = getPaletteFromCanvas(canvas, { paletteSize: 6, sampleStep: 6 });
          const stats = scorePalette(result);
          setPalette(result.palette);
          setScore(stats.score);
        };
        img.src = dataUrl;
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
          <p className="text-3xl font-bold underline">Segmented preview:</p>
          <img src={segmentedDataUrl} alt="segmented preview" style={{ maxWidth: maxPreviewWidth }} />

          {palette && (
            <div className="mt-2">
              <p className="text-sm">Palette:</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {palette.map((c) => (
                  <div key={c} style={{ width: 36, height: 36, background: c, borderRadius: 4, border: '1px solid #ddd' }} title={c} />
                ))}
              </div>
            </div>
          )}

          {score !== null && (
            <p className="text-sm mt-2">Palette score: {score.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
