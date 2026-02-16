import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Edit2, LogOut, Settings, Eye, EyeOff, Home, Image } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface AdminEditPanelProps {
  onNavigateToPortal?: () => void;
  onNavigateHome?: () => void;
  onAdjustHeroPosition?: (type: 'desktop' | 'mobile') => void;
}

export function AdminEditPanel({ onNavigateToPortal, onNavigateHome, onAdjustHeroPosition }: AdminEditPanelProps) {
  const { isAdmin, user, logout, loading } = useAuth();
  const { isEditMode, setEditMode } = useEditMode();
  const [open, setOpen] = useState(false);

  // Don't show anything while loading or if not admin
  if (loading || !isAdmin) return null;

  return (
    <>
      {/* Floating Admin Tab - Fixed to right side */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="rounded-l-2xl rounded-r-none shadow-2xl bg-secondary hover:bg-secondary/90 text-white px-4 py-3 flex items-center gap-2 transition-all hover:px-5"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide">
                ADMIN EDIT
              </span>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-card rounded-l-2xl border-l-2 border-secondary/20">
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-lg">Admin Panel</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {user?.user_metadata?.name || user?.email}
                  </p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="settings" className="mt-6">
              <TabsList className="w-full bg-muted/50 rounded-xl">
                <TabsTrigger value="settings" className="rounded-lg flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="navigation" className="rounded-lg flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Navigate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-6 mt-6">
                {/* Edit Mode Toggle */}
                <div className="bg-muted/30 rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        {isEditMode ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        Edit Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isEditMode 
                          ? 'Edit buttons are visible on all content' 
                          : 'Edit buttons are hidden'}
                      </p>
                    </div>
                    <Switch
                      checked={isEditMode}
                      onCheckedChange={setEditMode}
                      className="data-[state=checked]:bg-secondary"
                    />
                  </div>
                </div>

                {/* Hero Image Position Controls */}
                {onAdjustHeroPosition && (
                  <>
                    <Button
                      onClick={() => {
                        onAdjustHeroPosition('desktop');
                        setOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start rounded-xl border-secondary/30 hover:bg-secondary/10 hover:border-secondary"
                      size="lg"
                    >
                      <Image className="w-5 h-5 mr-3 text-secondary" />
                      <div className="text-left">
                        <div className="font-medium">Adjust Desktop Hero Image</div>
                        <div className="text-xs text-muted-foreground font-normal">Change position & focal point</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        onAdjustHeroPosition('mobile');
                        setOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start rounded-xl border-secondary/30 hover:bg-secondary/10 hover:border-secondary"
                      size="lg"
                    >
                      <Image className="w-5 h-5 mr-3 text-secondary" />
                      <div className="text-left">
                        <div className="font-medium">Adjust Mobile Hero Image</div>
                        <div className="text-xs text-muted-foreground font-normal">Change position & focal point</div>
                      </div>
                    </Button>
                  </>
                )}

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">How to Edit Content</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Hover over text or images to see edit buttons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Click the edit icon to modify content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Changes are saved automatically to the database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Toggle edit mode off to preview without edit buttons</span>
                    </li>
                  </ul>
                </div>

                {/* Account Info */}
                <div className="bg-muted/30 rounded-2xl p-5 border border-border">
                  <h4 className="text-sm font-medium mb-3">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">Administrator</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  variant="outline"
                  className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </TabsContent>

              <TabsContent value="navigation" className="space-y-4 mt-6">
                {/* Quick Navigation */}
                <div className="bg-muted/30 rounded-2xl p-5 border border-border">
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    {onNavigateHome && (
                      <Button
                        onClick={() => {
                          onNavigateHome();
                          setOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start rounded-xl"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Go to Homepage
                      </Button>
                    )}
                    {onNavigateToPortal && (
                      <Button
                        onClick={() => {
                          onNavigateToPortal();
                          setOpen(false);
                        }}
                        className="w-full justify-start rounded-xl bg-secondary hover:bg-secondary/90"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Open Admin Portal
                      </Button>
                    )}
                  </div>
                </div>

                {/* Help Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">Admin Portal Features</h4>
                  <ul className="text-sm text-amber-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Manage website inquiries and contact forms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Schedule and manage appointments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>View analytics and website statistics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>Upload and manage gallery photos</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

      {/* Global style injection to hide/show edit buttons based on edit mode */}
      {!isEditMode && (
        <style>{`
          .group .opacity-0.group-hover\\:opacity-100 {
            display: none !important;
          }
        `}</style>
      )}
    </>
  );
}