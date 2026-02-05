# Fix button.tsx Imports on GitHub

## The Problem
The button.tsx file has version-specific imports that only work in Make's environment:
```tsx
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";
```

Standard npm/Vercel builds don't support the `@version` syntax in imports.

---

## The Fix

**File:** `src/components/ui/button.tsx`  
**Location:** https://github.com/Nesbit25/HPS-WEB-FEBRUARY/blob/main/src/components/ui/button.tsx

### Change lines 2-3 from:
```tsx
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";
```

### To:
```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
```

---

## Quick Steps:

1. Go to: https://github.com/Nesbit25/HPS-WEB-FEBRUARY/blob/main/src/components/ui/button.tsx
2. Click the pencil icon to edit
3. On line 2, change `"@radix-ui/react-slot@1.1.2"` to `"@radix-ui/react-slot"`
4. On line 3, change `"class-variance-authority@0.7.1"` to `"class-variance-authority"`
5. Commit changes with message: "Fix: Remove version specifiers from imports"

This will allow Vercel to properly resolve these packages! 🚀
