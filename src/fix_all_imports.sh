#!/bin/bash

# Fix All Version Specifiers in UI Components
# This script removes @version from all imports in the components/ui directory

echo "🔧 Fixing all version specifiers..."

# Navigate to your repo
cd ~/HPS-WEB-FEBRUARY  # Adjust this path to where your repo is located

# List of all imports to fix
declare -A imports=(
  ["@radix-ui/react-slot@1.1.2"]="@radix-ui/react-slot"
  ["class-variance-authority@0.7.1"]="class-variance-authority"
  ["@radix-ui/react-dialog@1.1.6"]="@radix-ui/react-dialog"
  ["@radix-ui/react-label@2.1.1"]="@radix-ui/react-label"
  ["@radix-ui/react-select@2.1.6"]="@radix-ui/react-select"
  ["@radix-ui/react-checkbox@1.1.3"]="@radix-ui/react-checkbox"
  ["@radix-ui/react-dropdown-menu@2.1.6"]="@radix-ui/react-dropdown-menu"
  ["@radix-ui/react-popover@1.1.6"]="@radix-ui/react-popover"
  ["@radix-ui/react-radio-group@1.2.3"]="@radix-ui/react-radio-group"
  ["@radix-ui/react-switch@1.1.3"]="@radix-ui/react-switch"
  ["@radix-ui/react-tabs@1.1.3"]="@radix-ui/react-tabs"
  ["@radix-ui/react-tooltip@1.1.7"]="@radix-ui/react-tooltip"
  ["@radix-ui/react-alert-dialog@1.1.6"]="@radix-ui/react-alert-dialog"
  ["@radix-ui/react-aspect-ratio@1.1.1"]="@radix-ui/react-aspect-ratio"
  ["@radix-ui/react-avatar@1.1.3"]="@radix-ui/react-avatar"
  ["@radix-ui/react-collapsible@1.1.3"]="@radix-ui/react-collapsible"
  ["@radix-ui/react-context-menu@2.2.6"]="@radix-ui/react-context-menu"
  ["@radix-ui/react-hover-card@1.1.6"]="@radix-ui/react-hover-card"
  ["@radix-ui/react-menubar@1.1.6"]="@radix-ui/react-menubar"
  ["@radix-ui/react-navigation-menu@1.2.3"]="@radix-ui/react-navigation-menu"
  ["@radix-ui/react-progress@1.1.1"]="@radix-ui/react-progress"
  ["@radix-ui/react-scroll-area@1.2.2"]="@radix-ui/react-scroll-area"
  ["@radix-ui/react-separator@1.1.1"]="@radix-ui/react-separator"
  ["@radix-ui/react-slider@1.2.1"]="@radix-ui/react-slider"
  ["@radix-ui/react-toggle@1.1.1"]="@radix-ui/react-toggle"
  ["@radix-ui/react-toggle-group@1.1.1"]="@radix-ui/react-toggle-group"
  ["cmdk@1.0.4"]="cmdk"
  ["react-day-picker@9.4.3"]="react-day-picker"
  ["vaul@1.1.3"]="vaul"
  ["input-otp@1.4.1"]="input-otp"
  ["embla-carousel-react@8.5.2"]="embla-carousel-react"
  ["react-resizable-panels@2.2.0"]="react-resizable-panels"
  ["recharts@2.15.0"]="recharts"
  ["sonner@1.7.3"]="sonner"
)

# Find all .tsx and .ts files in src/components/ui
find src/components/ui -type f \( -name "*.tsx" -o -name "*.ts" \) | while read file; do
  echo "Processing: $file"
  
  # For each import mapping, do the replacement
  for old in "${!imports[@]}"; do
    new="${imports[$old]}"
    # Use sed to replace (macOS compatible with -i '')
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|\"${old}\"|\"${new}\"|g" "$file"
      sed -i '' "s|'${old}'|'${new}'|g" "$file"
    else
      sed -i "s|\"${old}\"|\"${new}\"|g" "$file"
      sed -i "s|'${old}'|'${new}'|g" "$file"
    fi
  done
done

echo "✅ All version specifiers removed!"
echo ""
echo "📤 Now commit and push:"
echo "   git add src/components/ui/"
echo "   git commit -m 'Fix: Remove all version specifiers from imports'"
echo "   git push origin main"
