#!/bin/bash
# MASTER FIX - Run this in Figma Make to fix all imports

find components/ui -name "*.tsx" -type f -exec sed -i '' \
  -e 's/@radix-ui\/react-[a-z-]*@[0-9.]*"/@radix-ui\/react-&"/g' \
  -e 's/lucide-react@[0-9.]*"/lucide-react"/g' \
  -e 's/class-variance-authority@[0-9.]*"/class-variance-authority"/g' \
  -e 's/cmdk@[0-9.]*"/cmdk"/g' \
  -e 's/react-day-picker@[0-9.]*"/react-day-picker"/g' \
  -e 's/vaul@[0-9.]*"/vaul"/g' \
  -e 's/input-otp@[0-9.]*"/input-otp"/g' \
  -e 's/embla-carousel-react@[0-9.]*"/embla-carousel-react"/g' \
  -e 's/react-resizable-panels@[0-9.]*"/react-resizable-panels"/g' \
  -e 's/recharts@[0-9.]*"/recharts"/g' \
  -e 's/sonner@[0-9.]*"/sonner"/g' \
  -e 's/react-hook-form@[0-9.]*"/react-hook-form"/g' \
  {} \;

echo "All imports fixed!"
