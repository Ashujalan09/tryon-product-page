export interface CropTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface UploadedImage {
  id: string;
  originalUrl: string;
  croppedUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  transform: CropTransform;
}

export const HERO_ASPECT = 800 / 1432;
export const TILE_ASPECT = 3 / 4;

export const DEFAULT_CROP_TRANSFORM: CropTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getSlotAspect(index: number): number {
  return index === 0 ? HERO_ASPECT : TILE_ASPECT;
}

/**
 * Computes percentage dimensions and position of the image inside a container
 * of `frameAspect` (width / height) for a given `CropTransform`.
 */
export function getImageFrameLayout(
  naturalWidth: number,
  naturalHeight: number,
  frameAspect: number,
  transform: CropTransform,
) {
  const safeW = naturalWidth || 1;
  const safeH = naturalHeight || 1;
  const imgAspect = safeW / safeH;

  // At scale = 1, cover fills the frame completely along the tighter axis.
  const baseWidthPct = imgAspect > frameAspect ? (imgAspect / frameAspect) * 100 : 100;
  const baseHeightPct = imgAspect > frameAspect ? 100 : (frameAspect / imgAspect) * 100;

  const scale = clamp(transform.scale, 1, 3);
  const widthPct = baseWidthPct * scale;
  const heightPct = baseHeightPct * scale;

  const maxOffsetXPct = Math.max(0, (widthPct - 100) / 2);
  const maxOffsetYPct = Math.max(0, (heightPct - 100) / 2);

  const offsetX = clamp(transform.offsetX, -1, 1);
  const offsetY = clamp(transform.offsetY, -1, 1);

  const leftPct = (100 - widthPct) / 2 + offsetX * maxOffsetXPct;
  const topPct = (100 - heightPct) / 2 + offsetY * maxOffsetYPct;

  return {
    widthPct,
    heightPct,
    leftPct,
    topPct,
    maxOffsetXPct,
    maxOffsetYPct,
  };
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export async function renderCroppedImage(
  originalUrl: string,
  transform: CropTransform,
  frameAspect: number,
  maxOutputWidth = 1400,
): Promise<string> {
  const img = await loadImageElement(originalUrl);
  const naturalWidth = img.naturalWidth || 1;
  const naturalHeight = img.naturalHeight || 1;

  const outputWidth = Math.min(maxOutputWidth, Math.max(800, naturalWidth));
  const outputHeight = Math.round(outputWidth / frameAspect);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return originalUrl;

  const layout = getImageFrameLayout(naturalWidth, naturalHeight, frameAspect, transform);
  const drawX = (layout.leftPct / 100) * outputWidth;
  const drawY = (layout.topPct / 100) * outputHeight;
  const drawW = (layout.widthPct / 100) * outputWidth;
  const drawH = (layout.heightPct / 100) * outputHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(originalUrl);
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  });
}
