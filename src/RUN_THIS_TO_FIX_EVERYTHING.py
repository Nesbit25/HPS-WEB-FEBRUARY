#!/usr/bin/env python3
"""
FINAL FIX SCRIPT - Run this to remove all version specifiers
Then download from Figma Make and push to GitHub
"""

import re
from pathlib import Path

# Map of all packages with version specifiers
FIXES = [
    (r'"@radix-ui/([^"@]+)@[^"]+"', r'"@radix-ui/\1"'),
    (r'"lucide-react@[^"]+"', r'"lucide-react"'),
    (r'"class-variance-authority@[^"]+"', r'"class-variance-authority"'),
    (r'"cmdk@[^"]+"', r'"cmdk"'),
    (r'"react-day-picker@[^"]+"', r'"react-day-picker"'),
    (r'"vaul@[^"]+"', r'"vaul"'),
    (r'"input-otp@[^"]+"', r'"input-otp"'),
    (r'"embla-carousel-react@[^"]+"', r'"embla-carousel-react"'),
    (r'"react-resizable-panels@[^"]+"', r'"react-resizable-panels"'),
    (r'"recharts@[^"]+"', r'"recharts"'),
    (r'"sonner@[^"]+"', r'"sonner"'),
    (r'"next-themes@[^"]+"', r'"next-themes"'),
    # react-hook-form is special - we KEEP the version!
    # (r'"react-hook-form@[^"]+"', r'"react-hook-form"'),
]

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for pattern, replacement in FIXES:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Get UI components directory
    ui_dir = Path(__file__).parent / "components" / "ui"
    
    if not ui_dir.exists():
        print("❌ Error: components/ui not found!")
        print(f"   Looking in: {ui_dir}")
        return
    
    print("🔧 Fixing all version specifiers...")
    print()
    
    fixed = 0
    total = 0
    
    for file in ui_dir.glob("*.tsx"):
        total += 1
        if fix_file(file):
            fixed += 1
            print(f"  ✅ {file.name}")
    
    for file in ui_dir.glob("*.ts"):
        total += 1
        if fix_file(file):
            fixed += 1
            print(f"  ✅ {file.name}")
    
    print()
    print(f"✨ DONE! Fixed {fixed}/{total} files")
    print()
    print("📥 NEXT STEPS:")
    print("   1. Click 'Download Code' in Figma Make")
    print("   2. Extract the ZIP")
    print("   3. Copy files to your GitHub repo")
    print("   4. Run: git add .")
    print("   5. Run: git commit -m 'Fix: Remove version specifiers - FINAL'")
    print("   6. Run: git push origin main")
    print()
    print("🚀 Then Vercel will deploy successfully!")

if __name__ == "__main__":
    main()
