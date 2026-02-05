# Fix package.json on GitHub

## The Problem
Your package.json has `@vitejs/plugin-react-swc` but vite.config.ts needs `@vitejs/plugin-react`.

## The Solution
Add the missing package to devDependencies.

---

## Update package.json on GitHub:

1. **Go to:** https://github.com/Nesbit25/HPS-WEB-FEBRUARY/blob/main/package.json

2. **Click the pencil icon** to edit

3. **Find the devDependencies section** (around line 51)

4. **Replace the entire devDependencies section** with:

```json
"devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "6.3.5"
}
```

5. **Click "Commit changes"**

---

## What This Adds:

The key additions are:
- ✅ `@vitejs/plugin-react` - Required for vite.config.ts
- ✅ `@types/react` and `@types/react-dom` - TypeScript types
- ✅ `autoprefixer`, `postcss`, `tailwindcss` - CSS tools
- ✅ `typescript` - TypeScript compiler

This removes `@vitejs/plugin-react-swc` and replaces it with the standard `@vitejs/plugin-react`.

---

## After Committing:

Vercel will:
1. ✅ Install the correct plugin
2. ✅ Build successfully
3. ✅ Deploy your site! 🚀
