import { UIElement } from './xml-parser';

export function drawSoMComposite(originalCanvas: HTMLCanvasElement, elements: UIElement[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = originalCanvas.width;
  canvas.height = originalCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(originalCanvas, 0, 0);

  ctx.font = 'bold 28px Arial';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;

  elements.forEach((el) => {
    const { x, y, w, h } = el.bounds;

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.strokeRect(x, y, w, h);

    const tagSize = 36;
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(x, y, tagSize, tagSize);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(el.id.toString(), x + tagSize / 2, y + tagSize / 2);
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function drawSoMOverlayMask(originalCanvas: HTMLCanvasElement, elements: UIElement[], label?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = originalCanvas.width;
  canvas.height = originalCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 28px Arial';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;

  if (elements.length === 0) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(10, 10, 120, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label || 'SoM:0', 70, 30);
  }

  elements.forEach((el) => {
    const { x, y, w, h } = el.bounds;

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.strokeRect(x, y, w, h);

    const tagSize = 36;
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(x, y, tagSize, tagSize);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(el.id.toString(), x + tagSize / 2, y + tagSize / 2);
  });

  return canvas.toDataURL('image/png');
}
