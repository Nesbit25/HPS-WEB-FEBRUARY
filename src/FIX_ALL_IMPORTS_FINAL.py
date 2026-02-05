#!/usr/bin/env python3
"""
EMERGENCY FIX - Remove ALL version specifiers from imports
This fixes the Vercel build issue once and for all
"""

import os
import re
from pathlib import Path

# All version-specific imports that need to be fixed
REPLACEMENTS = {
    # Radix UI
    r'"@radix-ui/react-accordion@[\d\.]+"': '"@radix-ui/react-accordion"',
    r'"@radix-ui/react-alert-dialog@[\d\.]+"': '"@radix-ui/react-alert-dialog"',
    r'"@radix-ui/react-aspect-ratio@[\d\.]+"': '"@radix-ui/react-aspect-ratio"',
    r'"@radix-ui/react-avatar@[\d\.]+"': '"@radix-ui/react-avatar"',
    r'"@radix-ui/react-checkbox@[\d\.]+"': '"@radix-ui/react-checkbox"',
    r'"@radix-ui/react-collapsible@[\d\.]+"': '"@radix-ui/react-collapsible"',
    r'"@radix-ui/react-context-menu@[\d\.]+"': '"@radix-ui/react-context-menu"',
    r'"@radix-ui/react-dialog@[\d\.]+"': '"@radix-ui/react-dialog"',
    r'"@radix-ui/react-dropdown-menu@[\d\.]+"': '"@radix-ui/react-dropdown-menu"',
    r'"@radix-ui/react-hover-card@[\d\.]+"': '"@radix-ui/react-hover-card"',
    r'"@radix-ui/react-label@[\d\.]+"': '"@radix-ui/react-label"',
    r'"@radix-ui/react-menubar@[\d\.]+"': '"@radix-ui/react-menubar"',
    r'"@radix-ui/react-navigation-menu@[\d\.]+"': '"@radix-ui/react-navigation-menu"',
    r'"@radix-ui/react-popover@[\d\.]+"': '"@radix-ui/react-popover"',
    r'"@radix-ui/react-progress@[\d\.]+"': '"@radix-ui/react-progress"',
    r'"@radix-ui/react-radio-group@[\d\.]+"': '"@radix-ui/react-radio-group"',
    r'"@radix-ui/react-scroll-area@[\d\.]+"': '"@radix-ui/react-scroll-area"',
    r'"@radix-ui/react-select@[\d\.]+"': '"@radix-ui/react-select"',
    r'"@radix-ui/react-separator@[\d\.]+"': '"@radix-ui/react-separator"',
    r'"@radix-ui/react-slider@[\d\.]+"': '"@radix-ui/react-slider"',
    r'"@radix-ui/react-slot@[\d\.]+"': '"@radix-ui/react-slot"',
    r'"@radix-ui/react-switch@[\d\.]+"': '"@radix-ui/react-switch"',
    r'"@radix-ui/react-tabs@[\d\.]+"': '"@radix-ui/react-tabs"',
    r'"@radix-ui/react-toggle@[\d\.]+"': '"@radix-ui/react-toggle"',
    r'"@radix-ui/react-toggle-group@[\d\.]+"': '"@radix-ui/react-toggle-group"',
    r'"@radix-ui/react-tooltip@[\d\.]+"': '"@radix-ui/react-tooltip"',
    
    # Other packages
    r'"class-variance-authority@[\d\.]+"': '"class-variance-authority"',
    r'"lucide-react@[\d\.]+"': '"lucide-react"',
    r'"cmdk@[\d\.]+"': '"cmdk"',
    r'"react-day-picker@[\d\.]+"': '"react-day-picker"',
    r'"vaul@[\d\.]+"': '"vaul"',
    r'"input-otp@[\d\.]+"': '"input-otp"',
    r'"embla-carousel-react@[\d\.]+"': '"embla-carousel-react"',
    r'"react-resizable-panels@[\d\.]+"': '"react-resizable-panels"',
    r'"recharts@[\d\.]+"': '"recharts"',
    r'"sonner@[\d\.]+"': '"sonner"',
}

def fix_file(filepath):
    """Fix version specifiers in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Apply all replacements
    for pattern, replacement in REPLACEMENTS.items():
        content = re.sub(pattern, replacement, content)
    
    # Only write if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Get the script's directory
    script_dir = Path(__file__).parent
    components_dir = script_dir / "components" / "ui"
    
    if not components_dir.exists():
        print(f"❌ ERROR: Directory not found: {components_dir}")
        print(f"   Make sure you're running this from the Figma Make project root!")
        return
    
    print("🔧 Fixing version specifiers in UI components...")
    print(f"📁 Directory: {components_dir}")
    print()
    
    fixed_count = 0
    total_count = 0
    
    # Process all .tsx and .ts files
    for filepath in components_dir.glob("*.tsx"):
        total_count += 1
        if fix_file(filepath):
            fixed_count += 1
            print(f"  ✅ Fixed: {filepath.name}")
    
    for filepath in components_dir.glob("*.ts"):
        total_count += 1
        if fix_file(filepath):
            fixed_count += 1
            print(f"  ✅ Fixed: {filepath.name}")
    
    print()
    print(f"✨ DONE! Fixed {fixed_count} out of {total_count} files")
    print()
    print("📤 Now download and push to GitHub:")
    print("   1. Click 'Download Code' in Figma Make")
    print("   2. Extract the ZIP")
    print("   3. Copy the files to your Git repo")
    print("   4. Run: git add .")
    print("   5. Run: git commit -m 'Fix: Remove all version specifiers'")
    print("   6. Run: git push origin main")
    print()
    print("🚀 Vercel will then deploy successfully!")

if __name__ == "__main__":
    main()
