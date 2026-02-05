import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AccentLine, CircleAccent } from './DecorativeElements';
import { EditableText } from './cms/EditableText';
import { useAuth } from '../contexts/AuthContext';
import { useEditMode } from '../contexts/EditModeContext';

interface GalleryOrientation {
  name: string;
  beforeImage?: string;
  afterImage?: string;
}

interface GalleryItem {
  id: number;
  category: string;
  title: string;
  procedure: string;
  journeyNote: string;
  beforeImage?: string;
  afterImage?: string;
  orientations?: GalleryOrientation[];
}

interface GalleryLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: GalleryItem | null;
  onNext: () => void;
  onPrevious: () => void;
  totalImages: number;
  currentIndex: number;
  onEditImage?: (caseId: number, imageType: 'before' | 'after', orientationIndex: number) => void;
}

export function GalleryLightbox({ 
  isOpen, 
  onClose, 
  currentItem,
  onNext, 
  onPrevious, 
  totalImages,
  currentIndex,
  onEditImage
}: GalleryLightboxProps) {
  const { isAdmin } = useAuth();
  const { isEditMode } = useEditMode();
  const [selectedOrientation, setSelectedOrientation] = useState(0);

  // Reset selected orientation when changing cases
  useEffect(() => {
    setSelectedOrientation(0);
  }, [currentItem?.id]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle arrow keys
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleArrowKeys);
    }
    
    return () => {
      document.removeEventListener('keydown', handleArrowKeys);
    };
  }, [isOpen, onNext, onPrevious]);

  if (!currentItem) return null;

  // Build orientations array - support both old format (single before/after) and new format (multiple orientations)
  const orientations: GalleryOrientation[] = currentItem.orientations && currentItem.orientations.length > 0
    ? currentItem.orientations
    : [{
        name: 'front',
        beforeImage: currentItem.beforeImage,
        afterImage: currentItem.afterImage
      }];

  const currentOrientationData = orientations[selectedOrientation] || orientations[0];
  const hasMultipleOrientations = orientations.length > 1;
  const hasJourneyNote = currentItem.journeyNote && currentItem.journeyNote.trim() !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#1a1f2e]/95 backdrop-blur-sm" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed top-6 right-6 z-10 w-12 h-12 rounded-full bg-[#242938]/90 hover:bg-[#242938] flex items-center justify-center transition-all duration-300 hover:scale-110 group shadow-xl border border-[#2d3548]"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6 text-[#faf9f7] group-hover:text-[#c9b896] transition-colors" />
          </button>

          {/* Counter */}
          <div className="fixed top-6 left-6 z-10 px-4 py-2 rounded-full bg-[#242938]/90 backdrop-blur-sm shadow-xl border border-[#2d3548]">
            <span className="text-[#faf9f7]">
              {currentIndex + 1} / {totalImages}
            </span>
          </div>

          {/* Previous button */}
          {totalImages > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="fixed left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#242938]/90 hover:bg-[#242938] flex items-center justify-center transition-all duration-300 hover:scale-110 group shadow-xl border border-[#2d3548]"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-7 h-7 text-[#faf9f7] group-hover:text-[#c9b896] transition-colors" />
            </button>
          )}

          {/* Next button */}
          {totalImages > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="fixed right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#242938]/90 hover:bg-[#242938] flex items-center justify-center transition-all duration-300 hover:scale-110 group shadow-xl border border-[#2d3548]"
              aria-label="Next image"
            >
              <ChevronRight className="w-7 h-7 text-[#faf9f7] group-hover:text-[#c9b896] transition-colors" />
            </button>
          )}

          {/* Content container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative w-full max-w-4xl max-h-[80vh] mx-auto px-6 py-8 my-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentItem.id}-${selectedOrientation}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-[#242938]/95 backdrop-blur-sm border-2 border-[#2d3548] rounded-2xl overflow-hidden shadow-2xl">
                  <CardContent className="p-0">
                    {/* Before & After Images Section with Thumbnails */}
                    <div className="border-b-2 border-[#2d3548]">
                      <div className="flex gap-0">
                        {/* Main Images */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 max-h-[60vh]">
                          {/* Before Image */}
                          <div className="relative h-full bg-gradient-to-br from-[#1a1f2e] to-[#242938] overflow-hidden border-r border-[#2d3548] group/before">
                            {/* Gold accent corner */}
                            <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none z-10">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c9b896] to-transparent"></div>
                              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#c9b896] to-transparent"></div>
                            </div>
                            
                            {/* Edit Button for Admins */}
                            {isAdmin && isEditMode && onEditImage && (
                              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/before:opacity-100 transition-opacity duration-300">
                                <Button
                                  size="sm"
                                  className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e] shadow-xl border-2 border-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditImage(currentItem.id, 'before', selectedOrientation);
                                  }}
                                >
                                  <Crop className="w-4 h-4 mr-1" />
                                  Crop
                                </Button>
                              </div>
                            )}
                            
                            {currentOrientationData.beforeImage ? (
                              <img 
                                src={currentOrientationData.beforeImage} 
                                alt="Before" 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-400 text-xl">Before</span>
                              </div>
                            )}

                            {/* Label overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1f2e]/90 to-transparent py-4">
                              <p className="text-[#faf9f7] text-center uppercase tracking-wider text-base font-medium">Before</p>
                            </div>
                          </div>

                          {/* After Image */}
                          <div className="relative h-full bg-gradient-to-br from-[#1a1f2e] to-[#242938] overflow-hidden group/after">
                            {/* Gold accent corner */}
                            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none z-10">
                              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#c9b896] to-transparent"></div>
                              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-[#c9b896] to-transparent"></div>
                            </div>
                            
                            {/* Edit Button for Admins */}
                            {isAdmin && isEditMode && onEditImage && (
                              <div className="absolute top-4 left-4 z-20 opacity-0 group-hover/after:opacity-100 transition-opacity duration-300">
                                <Button
                                  size="sm"
                                  className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e] shadow-xl border-2 border-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditImage(currentItem.id, 'after', selectedOrientation);
                                  }}
                                >
                                  <Crop className="w-4 h-4 mr-1" />
                                  Crop
                                </Button>
                              </div>
                            )}
                            
                            {currentOrientationData.afterImage ? (
                              <img 
                                src={currentOrientationData.afterImage} 
                                alt="After" 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-400 text-xl">After</span>
                              </div>
                            )}

                            {/* Label overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#c9b896]/90 to-transparent py-4">
                              <p className="text-[#1a1f2e] text-center uppercase tracking-wider text-base font-semibold">After</p>
                            </div>
                          </div>
                        </div>

                        {/* Orientation Thumbnails */}
                        {hasMultipleOrientations && (
                          <div className="w-40 bg-[#1a1f2e]/50 border-l border-[#2d3548] p-3 flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
                            {orientations.map((orientation, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedOrientation(index)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                                  selectedOrientation === index 
                                    ? 'border-[#c9b896] shadow-lg shadow-[#c9b896]/30' 
                                    : 'border-[#2d3548] hover:border-[#c9b896]/50'
                                }`}
                              >
                                {orientation.afterImage ? (
                                  <img 
                                    src={orientation.afterImage} 
                                    alt={orientation.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : orientation.beforeImage ? (
                                  <img 
                                    src={orientation.beforeImage} 
                                    alt={orientation.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full bg-[#242938]">
                                    <span className="text-sm text-gray-500">Pos {index + 1}</span>
                                  </div>
                                )}
                                {/* Selection indicator */}
                                {selectedOrientation === index && (
                                  <div className="absolute inset-0 bg-[#c9b896]/20 pointer-events-none"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Case Info and Journey Notes Section */}
                    <div className="p-12 md:p-16 bg-[#242938]">
                      <div className="text-center mb-10">
                        <CircleAccent size="sm" className="mx-auto mb-4" />
                        <h3 className="mb-3 text-[#faf9f7] text-2xl">{currentItem.title}</h3>
                        <AccentLine className="mb-6 max-w-xs mx-auto" />
                        <div className="inline-block px-6 py-2 rounded-full bg-[#c9b896]/10 border border-[#c9b896]/20">
                          <span className="text-[#c9b896] text-base">{currentItem.procedure}</span>
                        </div>
                      </div>

                      {/* Only show Patient Journey section if there's actual content */}
                      {hasJourneyNote && (
                        <div className="max-w-4xl mx-auto">
                          <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
                              <span className="text-base text-[#c9b896] uppercase tracking-wider">Patient Journey</span>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
                            </div>
                          </div>

                          <div className="relative">
                            {/* Decorative quote mark */}
                            <div className="absolute -left-6 top-0 text-7xl text-[#c9b896]/20">\"</div>
                            
                            <div className="pl-12 pr-12">
                              <EditableText
                                contentKey={`gallery_${currentItem.id}_journey`}
                                defaultValue={currentItem.journeyNote}
                                as="p"
                                className="text-[#faf9f7] leading-relaxed italic text-lg"
                                multiline
                              />
                            </div>
                            
                            {/* Decorative end quote mark */}
                            <div className="absolute -right-6 bottom-0 text-7xl text-[#c9b896]/20">\"</div>
                          </div>

                          <div className="mt-10 pt-8 border-t border-[#2d3548]">
                            <p className="text-gray-400 text-base text-center italic leading-relaxed">
                              Individual results may vary. Consult with Dr. Hanemann to discuss realistic expectations for your specific case.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}