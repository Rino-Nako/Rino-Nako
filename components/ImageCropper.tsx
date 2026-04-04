import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants
  const CROP_SIZE = 250; // 250x250 crop box

  // Initialize zoom to fit image
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerWidth = 350; // approx container width
    const containerHeight = 300;
    
    // Initial scale to fit the image nicely
    const scaleX = containerWidth / img.naturalWidth;
    const scaleY = containerHeight / img.naturalHeight;
    const initialScale = Math.min(scaleX, scaleY, 1); // Don't zoom in if image is small
    
    // But we want it to cover the crop area at least
    const minScaleToCover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    
    setZoom(Math.max(initialScale, minScaleToCover));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    
    const displayedWidth = naturalWidth * zoom;
    const displayedHeight = naturalHeight * zoom;

    // Center of crop box is (CROP_SIZE/2, CROP_SIZE/2)
    // The image center is shifted by `position` from the crop box center.
    // We want to find where the top-left of the image is relative to the top-left of the canvas (crop box).
    
    // Canvas Center = Image Center - Position
    // Image TopLeft = Image Center - (Width/2, Height/2)
    
    // Let's rethink coordinate system relative to the container center.
    // Container center is (W/2, H/2).
    // Crop box is centered in container.
    // Image is centered in container + position.
    
    // We want to draw onto a canvas of size CROP_SIZE.
    // The canvas represents the area inside the crop box.
    // The center of the canvas (CROP_SIZE/2, CROP_SIZE/2) corresponds to the center of the crop box in the UI.
    // The center of the image in the UI is at (CropBoxCenter + position).
    
    // So in the canvas coordinate system:
    // Image Center X = CROP_SIZE/2 + position.x
    // Image Center Y = CROP_SIZE/2 + position.y
    
    const imgCenterX = CROP_SIZE / 2 + position.x;
    const imgCenterY = CROP_SIZE / 2 + position.y;
    
    const drawX = imgCenterX - displayedWidth / 2;
    const drawY = imgCenterY - displayedHeight / 2;

    ctx.drawImage(image, drawX, drawY, displayedWidth, displayedHeight);

    const dataUrl = canvas.toDataURL('image/png');
    onCrop(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-[95%] max-w-[450px] flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">编辑头像</h3>
            <p className="text-xs text-gray-500 mt-0.5">拖动移动，滑动缩放</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <div 
          className="relative w-full h-[350px] bg-gray-100 rounded-xl overflow-hidden cursor-move touch-none flex items-center justify-center select-none border border-gray-200"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          ref={containerRef}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />

          {/* Image Layer */}
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: dragging ? 'none' : 'transform 0.1s ease-out' 
            }}
            className="origin-center flex items-center justify-center will-change-transform"
          >
             <img 
               ref={imageRef}
               src={imageSrc} 
               alt="Crop target" 
               className="max-w-none pointer-events-none"
               draggable={false}
               onLoad={onImageLoad}
             />
          </div>
          
          {/* Overlay Mask */}
          <div className="absolute inset-0 pointer-events-none">
             {/* Dark overlay with hole */}
             <div 
               className="absolute inset-0 bg-black/50"
               style={{ 
                 maskImage: `radial-gradient(circle ${CROP_SIZE/2}px at center, transparent 99%, black 100%)`,
                 WebkitMaskImage: `radial-gradient(circle ${CROP_SIZE/2}px at center, transparent 99%, black 100%)`
               }}
             />
             
             {/* Crop Box Border */}
             <div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/80 rounded-full pointer-events-none shadow-sm"
               style={{ width: CROP_SIZE, height: CROP_SIZE }}
             >
               {/* Center Crosshair (Optional) */}
               <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white/50 -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white/50 -translate-x-1/2 -translate-y-1/2"></div>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-2">
          <ZoomOut size={18} className="text-gray-400 shrink-0"/>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.05" 
            value={zoom} 
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-black h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 transition-colors"
          />
          <ZoomIn size={18} className="text-gray-400 shrink-0"/>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleCrop}
            className="px-5 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl transition-all shadow-lg shadow-black/20 flex items-center gap-2 active:scale-95"
          >
            <Check size={18} strokeWidth={2.5}/>
            确认裁剪
          </button>
        </div>
        
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} className="hidden" />
      </div>
    </div>
  );
}