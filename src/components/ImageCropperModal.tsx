import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxWidth = 1024
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Calculate scaling to ensure we don't exceed maxWidth
  let scale = 1;
  const targetWidth = Math.min(maxWidth, pixelCrop.width);
  scale = targetWidth / pixelCrop.width;

  canvas.width = Math.floor(pixelCrop.width * scale);
  canvas.height = Math.floor(pixelCrop.height * scale);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/jpeg', 0.6);
}

export function ImageCropperModal({ imageSrc, onCropComplete, onCancel, aspectRatio = 16 / 9 }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, aspectRatio === 1 ? 256 : 1024);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-app-card rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-app-border flex justify-between items-center bg-white">
          <h3 className="font-bold text-lg">Adjust Image</h3>
          <button onClick={onCancel} className="text-app-muted hover:text-black">✕</button>
        </div>
        
        <div className="relative flex-1 bg-gray-900 min-h-[400px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 bg-white border-t border-app-border">
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm font-medium text-app-muted">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-lg font-bold text-app-muted hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2 rounded-lg font-bold bg-app-primary text-white hover:bg-app-primary/90 disabled:opacity-50"
            >
              {isProcessing ? 'Saving...' : 'Save Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
