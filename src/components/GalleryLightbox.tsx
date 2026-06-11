import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Upload, Trash2 } from 'lucide-react';
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
  /** Admin-only: remove a view entirely. The lightbox shows a Remove button
      next to the view picker; the consumer is responsible for confirmation
      and the actual delete. */
  onRemoveOrientation?: (caseId: number, orientationIndex: number) => void;
  defaultOrientation?: number;
}

export function GalleryLightbox({
  isOpen,
  onClose,
  currentItem,
  onNext,
  onPrevious,
  totalImages,
  currentIndex,
  onEditImage,
  onRemoveOrientation,
  defaultOrientation = 0,
}: GalleryLightboxProps) {
  const { isAdmin } = useAuth();
  const { isEditMode } = useEditMode();
  const [selectedOrientation, setSelectedOrientation] = useState(defaultOrientation);

  // Reset selected orientation when changing cases
  useEffect(() => {
    setSelectedOrientation(defaultOrientation);
  }, [currentItem?.id, defaultOrientation]);

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
                            
                            {/* Edit Button for Admins — always visible in edit
                                mode (was hover-only, easy to miss). Tells the
                                admin exactly which view they're replacing. */}
                            {isAdmin && isEditMode && onEditImage && (
                              <div className="absolute top-3 right-3 z-20">
                                <Button
                                  size="sm"
                                  className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e] shadow-xl border-2 border-white text-xs font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditImage(currentItem.id, 'before', selectedOrientation);
                                  }}
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  Replace Before · View {selectedOrientation + 1}
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
                            
                            {/* Edit Button for Admins — always visible in edit mode */}
                            {isAdmin && isEditMode && onEditImage && (
                              <div className="absolute top-3 left-3 z-20">
                                <Button
                                  size="sm"
                                  className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e] shadow-xl border-2 border-white text-xs font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditImage(currentItem.id, 'after', selectedOrientation);
                                  }}
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  Replace After · View {selectedOrientation + 1}
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

                        {/* Orientation Thumbnails — also the per-view selector
                            for admins, since the Replace buttons above operate
                            on whichever view is selected here. */}
                        {hasMultipleOrientations && (
                          <div className="w-44 bg-[#1a1f2e]/60 border-l border-[#2d3548] p-3 flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
                            <p className="text-[10px] uppercase tracking-widest text-[#c9b896] font-semibold pb-1 border-b border-[#2d3548] mb-1">
                              {isAdmin && isEditMode ? 'Pick view to edit' : 'Views'}
                            </p>
                            {orientations.map((orientation, index) => {
                              const isActive = selectedOrientation === index;
                              const viewLabel = orientation.name
                                ? orientation.name
                                : `View ${index + 1}`;
                              return (
                                <button
                                  key={index}
                                  onClick={() => setSelectedOrientation(index)}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] text-left ${
                                    isActive
                                      ? 'border-[#c9b896] shadow-lg shadow-[#c9b896]/30'
                                      : 'border-[#2d3548] hover:border-[#c9b896]/50'
                                  }`}
                                >
                                  <div className="aspect-square relative">
                                    {orientation.afterImage ? (
                                      <img
                                        src={orientation.afterImage}
                                        alt={viewLabel}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : orientation.beforeImage ? (
                                      <img
                                        src={orientation.beforeImage}
                                        alt={viewLabel}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full bg-[#242938]">
                                        <span className="text-sm text-gray-500">View {index + 1}</span>
                                      </div>
                                    )}
                                    {/* Selection indicator */}
                                    {isActive && (
                                      <div className="absolute inset-0 bg-[#c9b896]/20 pointer-events-none"></div>
                                    )}
                                  </div>
                                  <div className={`px-2 py-1 text-[10px] uppercase tracking-wider font-semibold ${
                                    isActive ? 'bg-[#c9b896] text-[#1a1f2e]' : 'bg-[#242938] text-gray-400'
                                  }`}>
                                    View {index + 1}{orientation.name ? ` · ${orientation.name}` : ''}
                                  </div>
                                </button>
                              );
                            })}
                            {isAdmin && isEditMode && (
                              <p className="text-[9px] text-gray-500 leading-relaxed mt-1 pt-2 border-t border-[#2d3548]">
                                Selecting a view here changes what the
                                <span className="text-[#c9b896]"> Replace</span> buttons
                                act on.
                              </p>
                            )}
                            {isAdmin && isEditMode && onRemoveOrientation && orientations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Hand off to the parent for confirmation + the
                                  // actual delete. After the request resolves, the
                                  // parent updates galleryItems; we drop selection
                                  // back to view 0 so we never sit on a stale index.
                                  if (!currentItem) return;
                                  setSelectedOrientation(0);
                                  onRemoveOrientation(currentItem.id, selectedOrientation);
                                }}
                                className="mt-2 flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-md bg-red-900/30 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-white text-[10px] uppercase tracking-wider font-semibold transition-colors"
                                title={`Remove View ${selectedOrientation + 1} from this case`}
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove View {selectedOrientation + 1}
                              </button>
                            )}
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