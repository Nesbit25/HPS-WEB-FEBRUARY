// Image optimization utilities for gallery uploads
// This module handles image metadata and preparation

/**
 * Analyzes image and returns content type
 */
export function getImageContentType(imageBuffer: Uint8Array): string {
  // Check magic bytes for image type
  if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
    return 'image/png';
  }
  if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
    return 'image/webp';
  }
  // Default to JPEG
  return 'image/jpeg';
}

/**
 * Simple pass-through optimization that relies on Supabase's built-in transformation
 * We'll use Supabase's image transformation API at request time instead of pre-processing
 */
export async function optimizeImage(
  imageBuffer: Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{ data: Uint8Array; contentType: string }> {
  // For now, we'll rely on Supabase's transformation API
  // Just return the original image with proper content type
  const contentType = getImageContentType(imageBuffer);
  
  return { 
    data: imageBuffer, 
    contentType 
  };
}

/**
 * Gets Supabase transformation URL for optimized delivery
 * Supabase supports query parameters for image transformation
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'origin';
  } = {}
): string {
  const params = new URLSearchParams();
  
  if (options.width) {
    params.append('width', options.width.toString());
  }
  if (options.height) {
    params.append('height', options.height.toString());
  }
  if (options.quality) {
    params.append('quality', options.quality.toString());
  }
  if (options.format) {
    params.append('format', options.format);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
