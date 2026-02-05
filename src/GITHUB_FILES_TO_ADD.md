# Files to Add to GitHub Repository

You need to create these two files in your GitHub repository root:

## 1. package.json

Create a file named `package.json` in the root directory with this content:

```json
{
  "name": "hanemann-plastic-surgery",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@supabase/supabase-js": "^2.49.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.487.0",
    "motion": "^12.0.0",
    "react-day-picker": "^8.10.1",
    "react-hook-form": "^7.55.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "sonner": "^2.0.3",
    "tailwind-merge": "^2.7.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.3.5"
  }
}
```

## 2. vite.config.ts (Updated)

Make sure your `vite.config.ts` looks like this:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

## 3. How to Add These Files

### Via GitHub Web Interface:

1. **Add package.json:**
   - Go to https://github.com/Nesbit25/HPS-WEB-FEBRUARY
   - Click "Add file" → "Create new file"
   - Name it `package.json`
   - Paste the JSON content above
   - Click "Commit changes"

2. **Update vite.config.ts:**
   - Go to https://github.com/Nesbit25/HPS-WEB-FEBRUARY/blob/main/vite.config.ts
   - Click the pencil icon to edit
   - Replace with the TypeScript content above
   - Click "Commit changes"

### Via Git Command Line:

```bash
# In your local repository
# Create package.json (paste the content)
nano package.json

# Update vite.config.ts (paste the content)
nano vite.config.ts

# Commit and push
git add package.json vite.config.ts
git commit -m "Add package.json and update vite.config with React plugin"
git push origin main
```

## What This Fixes

1. **package.json**: Tells npm which packages to install, so all the `@radix-ui/*` and other dependencies are available
2. **vite.config.ts**: Properly configures Vite with the React plugin for JSX/TSX transformation

After adding these files, Vercel will:
1. Install all dependencies from package.json
2. Use Vite to build your app
3. Successfully resolve all imports without the `@version` syntax

## Important Note

The versioned imports in your components (like `@radix-ui/react-slot@1.1.2`) will still work because npm will install the correct versions from `package.json`, and the import resolver will strip the version numbers automatically.
