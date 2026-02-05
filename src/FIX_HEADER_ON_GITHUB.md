# Fix Header.tsx on GitHub

## The Problem
Your GitHub repository has an old version of `Header.tsx` that's missing the React imports. This causes the `useState is not defined` error.

## The Solution
Update the file on GitHub with the correct imports.

---

## Step-by-Step Instructions:

### 1. Go to the file on GitHub:
https://github.com/Nesbit25/HPS-WEB-FEBRUARY/blob/main/src/components/Header.tsx

### 2. Click the **pencil icon** (Edit this file)

### 3. Replace the **entire first 7 lines** with these exact imports:

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Facebook, Instagram, Twitter, Phone, Menu, X, MapPin, User, Video } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { Link } from 'react-router';
```

**CRITICAL:** Make sure line 7 says `from 'react-router'` NOT `from 'react-router-dom'`

### 4. Click **"Commit changes"**

### 5. Vercel will automatically redeploy

---

## What These Lines Do:

- **Line 1:** Imports React and hooks (useState, useEffect) - **THIS WAS MISSING!**
- **Line 2-4:** Imports UI components and icons
- **Line 5-6:** Imports app-specific components
- **Line 7:** Imports Link from react-router (not react-router-dom)

---

## Quick Check:

After editing, the top of your `Header.tsx` should look like this:

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Facebook, Instagram, Twitter, Phone, Menu, X, MapPin, User, Video } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { Link } from 'react-router';

// Logo URLs - replace with actual hosted logo URLs
const logoFull = 'https://placehold.co/400x100/1a1f2e/c9b896?text=Hanemann+Plastic+Surgery';
const logoMonogram = 'https://placehold.co/100x100/1a1f2e/c9b896?text=HPS';
const logoMonogramCropped = 'https://placehold.co/80x80/1a1f2e/c9b896?text=HPS';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
}

export function Header({ currentPage, onNavigate, onOpenConsultation }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
```

---

## After Committing:

✅ The `useState is not defined` error will be fixed
✅ Vercel will rebuild automatically
✅ Your site should work!
