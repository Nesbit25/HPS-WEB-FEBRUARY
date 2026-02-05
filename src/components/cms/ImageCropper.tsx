import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  aspectRatio?: number; // Optional aspect ratio (e.g., 16/9, 4/3, 1 for square, 9/16 for portrait)
  orientation?: 'landscape' | 'portrait' | 'square'; // Simpler orientation control
}

export function ImageCropper({ 
  open, 
  onOpenChange, 
  imageSrc, 
  onCropComplete,
  aspectRatio,
  orientation
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image when dialog opens
  React.useEffect(() => {
    if (open && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        // Center the image initially
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;
          const imgAspect = img.width / img.height;
          const containerAspect = containerWidth / containerHeight;
          
          let scale = 1;
          if (imgAspect > containerAspect) {
            scale = containerWidth / img.width;
          } else {
            scale = containerHeight / img.height;
          }
          setZoom(scale);
        }
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc]);

  // Redraw canvas whenever zoom, position, or rotation changes
  React.useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [zoom, position, rotation]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!canvas || !img || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Save context state
    ctx.save();

    // Move to center of canvas
    ctx.translate(containerWidth / 2 + position.x, containerHeight / 2 + position.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and draw image centered
    const scaledWidth = img.width * zoom;
    const scaledHeight = img.height * zoom;
    ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

    // Restore context state
    ctx.restore();

    // Calculate crop area based on orientation or aspect ratio
    let cropWidth, cropHeight;
    
    if (aspectRatio) {
      // Use provided aspect ratio - fill as much of the canvas as possible
      if (aspectRatio >= 1) {
        // Landscape or square (width >= height)
        // Fill 90% of height, calculate width based on aspect ratio
        cropHeight = containerHeight * 0.9;
        cropWidth = cropHeight * aspectRatio;
        
        // If width exceeds container, scale down
        if (cropWidth > containerWidth * 0.95) {
          cropWidth = containerWidth * 0.95;
          cropHeight = cropWidth / aspectRatio;
        }
      } else {
        // Portrait (width < height)
        // Fill 90% of height, calculate width based on aspect ratio
        cropHeight = containerHeight * 0.9;
        cropWidth = cropHeight * aspectRatio;
        
        // If width is too small, use at least 40% of container width
        if (cropWidth < containerWidth * 0.4) {
          cropWidth = containerWidth * 0.4;
          cropHeight = cropWidth / aspectRatio;
          
          // If height now exceeds container, scale back down
          if (cropHeight > containerHeight * 0.95) {
            cropHeight = containerHeight * 0.95;
            cropWidth = cropHeight * aspectRatio;
          }
        }
      }
    } else if (orientation === 'portrait') {
      // Portrait: fill almost the entire canvas to match card behavior
      cropWidth = containerWidth * 0.85; // 85% width
      cropHeight = containerHeight * 0.9; // 90% height
    } else if (orientation === 'landscape') {
      // Landscape: wider than tall (e.g., 16:9)
      cropWidth = containerWidth * 0.8; // 80% width
      cropHeight = containerHeight * 0.5; // 50% height
    } else if (orientation === 'square') {
      // Square: equal dimensions
      const size = Math.min(containerWidth, containerHeight) * 0.7;
      cropWidth = size;
      cropHeight = size;
    } else {
      // Default: use 70% of both dimensions
      cropWidth = containerWidth * 0.7;
      cropHeight = containerHeight * 0.7;
    }
    
    const cropX = (containerWidth - cropWidth) / 2;
    const cropY = (containerHeight - cropHeight) / 2;

    // Draw semi-transparent dark overlay over entire canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Clear the crop area (punch a hole in the overlay)
    ctx.clearRect(cropX, cropY, cropWidth, cropHeight);

    // Redraw the image only in the crop area
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropWidth, cropHeight);
    ctx.clip();
    
    ctx.translate(containerWidth / 2 + position.x, containerHeight / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    
    ctx.restore();

    // Draw crop border with luxury gold color
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);
    
    // Draw corner handles
    const handleSize = 20;
    ctx.fillStyle = '#c9b896';
    
    // Top-left
    ctx.fillRect(cropX - 2, cropY - 2, handleSize, 4);
    ctx.fillRect(cropX - 2, cropY - 2, 4, handleSize);
    
    // Top-right
    ctx.fillRect(cropX + cropWidth - handleSize + 2, cropY - 2, handleSize, 4);
    ctx.fillRect(cropX + cropWidth - 2, cropY - 2, 4, handleSize);
    
    // Bottom-left
    ctx.fillRect(cropX - 2, cropY + cropHeight - 2, handleSize, 4);
    ctx.fillRect(cropX - 2, cropY + cropHeight - handleSize + 2, 4, handleSize);
    
    // Bottom-right
    ctx.fillRect(cropX + cropWidth - handleSize + 2, cropY + cropHeight - 2, handleSize, 4);
    ctx.fillRect(cropX + cropWidth - 2, cropY + cropHeight - handleSize + 2, 4, handleSize);
  }, [zoom, position, rotation, aspectRatio, orientation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCrop = async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    if (!canvas || !container || !img) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate crop dimensions using the same logic as drawCanvas (display size)
    let cropWidth, cropHeight;
    
    if (aspectRatio) {
      if (aspectRatio >= 1) {
        cropHeight = containerHeight * 0.9;
        cropWidth = cropHeight * aspectRatio;
        
        if (cropWidth > containerWidth * 0.95) {
          cropWidth = containerWidth * 0.95;
          cropHeight = cropWidth / aspectRatio;
        }
      } else {
        cropHeight = containerHeight * 0.9;
        cropWidth = cropHeight * aspectRatio;
        
        if (cropWidth < containerWidth * 0.4) {
          cropWidth = containerWidth * 0.4;
          cropHeight = cropWidth / aspectRatio;
          
          if (cropHeight > containerHeight * 0.95) {
            cropHeight = containerHeight * 0.95;
            cropWidth = cropHeight * aspectRatio;
          }
        }
      }
    } else if (orientation === 'portrait') {
      cropWidth = containerWidth * 0.85;
      cropHeight = containerHeight * 0.9;
    } else if (orientation === 'landscape') {
      cropWidth = containerWidth * 0.8;
      cropHeight = containerHeight * 0.5;
    } else if (orientation === 'square') {
      const size = Math.min(containerWidth, containerHeight) * 0.7;
      cropWidth = size;
      cropHeight = size;
    } else {
      cropWidth = containerWidth * 0.7;
      cropHeight = containerHeight * 0.7;
    }
    
    const cropX = (containerWidth - cropWidth) / 2;
    const cropY = (containerHeight - cropHeight) / 2;

    // Calculate high resolution output dimensions
    // Use minimum 1600px on the longer side for extra sharpness
    const targetSize = 1600;
    let outputWidth, outputHeight;
    
    if (aspectRatio) {
      if (aspectRatio >= 1) {
        // Landscape
        outputWidth = targetSize;
        outputHeight = targetSize / aspectRatio;
      } else {
        // Portrait
        outputHeight = targetSize;
        outputWidth = targetSize * aspectRatio;
      }
    } else {
      // Use crop dimensions but scale up significantly
      const scaleFactor = Math.max(targetSize / cropWidth, targetSize / cropHeight, 2);
      outputWidth = cropWidth * scaleFactor;
      outputHeight = cropHeight * scaleFactor;
    }

    // Calculate the scale factor from display to output
    const scaleToOutput = outputWidth / cropWidth;

    // Create a high-resolution temporary canvas with the full transformed image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = containerWidth * scaleToOutput;
    tempCanvas.height = containerHeight * scaleToOutput;
    const tempCtx = tempCanvas.getContext('2d', { alpha: false });

    if (!tempCtx) return;

    // Render the entire scene at high resolution
    tempCtx.save();
    tempCtx.translate(
      (containerWidth / 2 + position.x) * scaleToOutput,
      (containerHeight / 2 + position.y) * scaleToOutput
    );
    tempCtx.rotate((rotation * Math.PI) / 180);
    
    const scaledWidth = img.width * zoom * scaleToOutput;
    const scaledHeight = img.height * zoom * scaleToOutput;
    tempCtx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    tempCtx.restore();

    // Create the final cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = outputWidth;
    croppedCanvas.height = outputHeight;
    const croppedCtx = croppedCanvas.getContext('2d', { alpha: false });

    if (!croppedCtx) return;

    // Extract the crop area from the temp canvas
    croppedCtx.drawImage(
      tempCanvas,
      cropX * scaleToOutput,
      cropY * scaleToOutput,
      cropWidth * scaleToOutput,
      cropHeight * scaleToOutput,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Convert to blob with maximum quality
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(blob, croppedUrl);
        onOpenChange(false);
      }
    }, 'image/jpeg', 1.0); // Use 100% quality
  };

  const handleCancel = () => {
    // Reset to defaults
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-[#2d3548] border-[#c9b896]/20">
        <DialogHeader>
          <DialogTitle className="text-white">Crop Image</DialogTitle>
          <DialogDescription className="text-gray-300">
            {aspectRatio 
              ? `Adjust the image to fit the ${aspectRatio === 1 ? 'square' : aspectRatio > 1 ? 'landscape' : 'portrait'} crop area`
              : 'Drag, zoom, and rotate to adjust your image'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="relative w-full h-[500px] bg-[#1a1f2e] border border-[#c9b896]/30 rounded-lg overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
            />
            
            {/* Helper text */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <Move className="w-4 h-4" />
              Drag to reposition
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom
                </label>
                <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white/10 border-[#c9b896]/30 text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Slider
                  value={[zoom]}
                  onValueChange={(values) => setZoom(values[0])}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white/10 border-[#c9b896]/30 text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Rotate Button */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRotate}
                className="flex-1 bg-white/10 border-[#c9b896]/30 text-white hover:bg-white/20"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate 90°
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#c9b896]/20">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-white/10 border-[#c9b896]/30 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCrop}
              className="bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e]"
            >
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}