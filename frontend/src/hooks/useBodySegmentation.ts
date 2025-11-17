import { useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

/**
 * Hook that loads BodyPix and exposes functions to segment an image File
 * into a transparent PNG (Blob) or a data URL for preview.
 */
function useBodySegmentation() {
  const modelRef = useRef<bodyPix.BodyPix | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function loadModel() {
    if (modelRef.current) return modelRef.current;
    setStatus('loading');
    try {
      // Ensure tf is ready and try to use WebGL backend for better performance when available.
      await tf.ready();
      try {
        // setBackend may fail if backend isn't registered; ignore error and let tf pick a backend
        await tf.setBackend('webgl');
      } catch {
        // fallback — webgl not available or not registered
      }
      // Mobile-friendly defaults — tune multiplier/outputStride for quality/speed
      modelRef.current = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.5,
        quantBytes: 2,
      });
      setStatus('ready');
      return modelRef.current;
    } catch (err) {
      console.error('Failed to load BodyPix model', err);
      setStatus('error');
      throw err;
    }
  }

  async function createImageElementFromFile(file: File, maxWidth = 512): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > maxWidth) {
          const scale = maxWidth / img.naturalWidth;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const scaled = new Image();
          scaled.onload = () => resolve(scaled);
          scaled.onerror = reject;
          scaled.src = canvas.toDataURL('image/png');
        } else {
          resolve(img);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Segment the provided File and return a PNG Blob with transparent background.
   */
  async function segmentFile(file: File, opts?: { maxWidth?: number; segmentationThreshold?: number }): Promise<Blob> {
    setStatus('processing');
    const net = await loadModel();
    const img = await createImageElementFromFile(file, opts?.maxWidth ?? 512);

    const segmentation = await net.segmentPerson(img, {
      internalResolution: 'medium',
      segmentationThreshold: opts?.segmentationThreshold ?? 0.7,
    });

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixelData = imageData.data;
    const mask = segmentation.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0) {
        pixelData[i * 4 + 3] = 0; // alpha = 0 for background
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
    setStatus('ready');
    if (!blob) throw new Error('Failed to create segmented image blob');
    return blob;
  }

  async function segmentFileAsDataUrl(file: File, opts?: { maxWidth?: number; segmentationThreshold?: number }): Promise<string> {
    const blob = await segmentFile(file, opts);
    return await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result));
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  return { status, loadModel, segmentFile, segmentFileAsDataUrl } as const;
}

export default useBodySegmentation;
