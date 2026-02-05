#!/usr/bin/env python3
"""
Comprehensive fix for all version-specific imports in the HPS project.
This script removes @version syntax from all import statements.

Run this script from the root of your GitHub repository:
    python3 fix_all_imports.py
"""

import os
import re

# Map of files to fix and their import replacements
FILES_TO_FIX = {
    'src/components/ui/accordion.tsx': [
        ('@radix-ui/react-accordion@1.2.3', '@radix-ui/react-accordion'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/alert-dialog.tsx': [
        ('@radix-ui/react-alert-dialog@1.1.6', '@radix-ui/react-alert-dialog'),
    ],
    'src/components/ui/alert.tsx': [
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
    ],
    'src/components/ui/aspect-ratio.tsx': [
        ('@radix-ui/react-aspect-ratio@1.1.2', '@radix-ui/react-aspect-ratio'),
    ],
    'src/components/ui/avatar.tsx': [
        ('@radix-ui/react-avatar@1.1.3', '@radix-ui/react-avatar'),
    ],
    'src/components/ui/badge.tsx': [
        ('@radix-ui/react-slot@1.1.2', '@radix-ui/react-slot'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
    ],
    'src/components/ui/breadcrumb.tsx': [
        ('@radix-ui/react-slot@1.1.2', '@radix-ui/react-slot'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/button.tsx': [
        ('@radix-ui/react-slot@1.1.2', '@radix-ui/react-slot'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
    ],
    'src/components/ui/calendar.tsx': [
        ('lucide-react@0.487.0', 'lucide-react'),
        ('react-day-picker@8.10.1', 'react-day-picker'),
    ],
    'src/components/ui/carousel.tsx': [
        ('embla-carousel-react@8.6.0', 'embla-carousel-react'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/chart.tsx': [
        ('recharts@2.15.2', 'recharts'),
    ],
    'src/components/ui/checkbox.tsx': [
        ('@radix-ui/react-checkbox@1.1.4', '@radix-ui/react-checkbox'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/collapsible.tsx': [
        ('@radix-ui/react-collapsible@1.1.3', '@radix-ui/react-collapsible'),
    ],
    'src/components/ui/command.tsx': [
        ('cmdk@1.1.1', 'cmdk'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/context-menu.tsx': [
        ('@radix-ui/react-context-menu@2.2.6', '@radix-ui/react-context-menu'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/dialog.tsx': [
        ('@radix-ui/react-dialog@1.1.6', '@radix-ui/react-dialog'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/drawer.tsx': [
        ('vaul@1.1.2', 'vaul'),
    ],
    'src/components/ui/dropdown-menu.tsx': [
        ('@radix-ui/react-dropdown-menu@2.1.6', '@radix-ui/react-dropdown-menu'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/form.tsx': [
        ('@radix-ui/react-label@2.1.2', '@radix-ui/react-label'),
        ('@radix-ui/react-slot@1.1.2', '@radix-ui/react-slot'),
        ('react-hook-form@7.55.0', 'react-hook-form'),
    ],
    'src/components/ui/hover-card.tsx': [
        ('@radix-ui/react-hover-card@1.1.6', '@radix-ui/react-hover-card'),
    ],
    'src/components/ui/input-otp.tsx': [
        ('input-otp@1.4.2', 'input-otp'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/label.tsx': [
        ('@radix-ui/react-label@2.1.2', '@radix-ui/react-label'),
    ],
    'src/components/ui/menubar.tsx': [
        ('@radix-ui/react-menubar@1.1.6', '@radix-ui/react-menubar'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/navigation-menu.tsx': [
        ('@radix-ui/react-navigation-menu@1.2.5', '@radix-ui/react-navigation-menu'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/pagination.tsx': [
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/popover.tsx': [
        ('@radix-ui/react-popover@1.1.6', '@radix-ui/react-popover'),
    ],
    'src/components/ui/progress.tsx': [
        ('@radix-ui/react-progress@1.1.2', '@radix-ui/react-progress'),
    ],
    'src/components/ui/radio-group.tsx': [
        ('@radix-ui/react-radio-group@1.2.3', '@radix-ui/react-radio-group'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/resizable.tsx': [
        ('lucide-react@0.487.0', 'lucide-react'),
        ('react-resizable-panels@2.1.7', 'react-resizable-panels'),
    ],
    'src/components/ui/scroll-area.tsx': [
        ('@radix-ui/react-scroll-area@1.2.3', '@radix-ui/react-scroll-area'),
    ],
    'src/components/ui/select.tsx': [
        ('@radix-ui/react-select@2.1.6', '@radix-ui/react-select'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/separator.tsx': [
        ('@radix-ui/react-separator@1.1.2', '@radix-ui/react-separator'),
    ],
    'src/components/ui/sheet.tsx': [
        ('@radix-ui/react-dialog@1.1.6', '@radix-ui/react-dialog'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/sidebar.tsx': [
        ('@radix-ui/react-slot@1.1.2', '@radix-ui/react-slot'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
        ('lucide-react@0.487.0', 'lucide-react'),
    ],
    'src/components/ui/slider.tsx': [
        ('@radix-ui/react-slider@1.2.3', '@radix-ui/react-slider'),
    ],
    'src/components/ui/sonner.tsx': [
        ('next-themes@0.4.6', 'next-themes'),
        ('sonner@2.0.3', 'sonner'),
    ],
    'src/components/ui/switch.tsx': [
        ('@radix-ui/react-switch@1.1.3', '@radix-ui/react-switch'),
    ],
    'src/components/ui/tabs.tsx': [
        ('@radix-ui/react-tabs@1.1.3', '@radix-ui/react-tabs'),
    ],
    'src/components/ui/toggle-group.tsx': [
        ('@radix-ui/react-toggle-group@1.1.2', '@radix-ui/react-toggle-group'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
    ],
    'src/components/ui/toggle.tsx': [
        ('@radix-ui/react-toggle@1.1.2', '@radix-ui/react-toggle'),
        ('class-variance-authority@0.7.1', 'class-variance-authority'),
    ],
    'src/components/ui/tooltip.tsx': [
        ('@radix-ui/react-tooltip@1.1.8', '@radix-ui/react-tooltip'),
    ],
}

def fix_file(filepath, replacements):
    """Fix version-specific imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for old, new in replacements:
            content = content.replace(f'"{old}"', f'"{new}"')
            content = content.replace(f"'{old}'", f"'{new}'")
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

def main():
    print("🔧 Fixing all version-specific imports...")
    print("=" * 60)
    
    fixed_count = 0
    skipped_count = 0
    
    for filepath, replacements in FILES_TO_FIX.items():
        if os.path.exists(filepath):
            if fix_file(filepath, replacements):
                print(f"✅ Fixed: {filepath}")
                fixed_count += 1
            else:
                print(f"⏭️  No changes needed: {filepath}")
                skipped_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
            skipped_count += 1
    
    print("=" * 60)
    print(f"✅ Fixed {fixed_count} files")
    print(f"⏭️  Skipped {skipped_count} files")
    print("\n🎉 Done! Now commit and push these changes to GitHub.")

if __name__ == "__main__":
    main()
