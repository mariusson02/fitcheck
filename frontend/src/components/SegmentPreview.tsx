import { useCallback, useState } from 'react';
import ImageUploader from './ImageUploader';
import useBodySegmentation from '../hooks/useBodySegmentation';
import { getPaletteFromCanvas, scorePalette } from '../utils/colorAnalysis';

function SegmentPreview() {
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
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Segmentation failed');
      }
    },
    [loadModel, segmentFileAsDataUrl]
  );

  return (
    <main className="main-content">
      <div className="site-container">
        <div className="site-card">
          <div className="card-inner">
            <div className="content-width">
              <div className="segment-preview">
                <h2 className="accent">Segment & Preview</h2>
                <p className="muted">Model status: {status}</p>
                <ImageUploader onUpload={handleUpload} />

      {error && <p className="muted error">{error}</p>}

      {segmentedDataUrl && (
        <div>
          <p className="section-title">Segmented preview:</p>
          <img src={segmentedDataUrl} alt="segmented preview" className="preview-image" />

          {palette && (
            <div className="mt-2">
              <p className="muted">Palette:</p>
              <div className="palette">
                {palette.map((c) => (
                  <div key={c} className="palette-swatch" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
          )}

          {score !== null && (
            <p className="muted mt-2">Palette score: {score.toFixed(2)}</p>
          )}
        </div>
      )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SegmentPreview;
