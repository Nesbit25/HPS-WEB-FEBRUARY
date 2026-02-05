# 🚀 COMPLETE FIX - Remove All Version Specifiers

## ✅ PROGRESS SO FAR:
- button.tsx is fixed!
- Now failing on dialog.tsx
- **42 files total need fixing**

---

## 🔥 FASTEST SOLUTION - Run This Script:

### **Step 1: Download the script**
Save this file from Make: `/fix_all_imports.sh`

### **Step 2: Run it in your repo**

```bash
# Navigate to your repo
cd ~/path/to/HPS-WEB-FEBRUARY

# Make script executable
chmod +x fix_all_imports.sh

# Run it
./fix_all_imports.sh

# Commit and push
git add src/components/ui/
git commit -m "Fix: Remove all version specifiers from imports"
git push origin main
```

---

## 🎯 WHAT THE SCRIPT DOES:

Removes `@version` from all these imports:
- `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
- `class-variance-authority@0.7.1` → `class-variance-authority`
- `@radix-ui/react-dialog@1.1.6` → `@radix-ui/react-dialog`
- `@radix-ui/react-label@2.1.1` → `@radix-ui/react-label`
- `@radix-ui/react-select@2.1.6` → `@radix-ui/react-select`
- ... and 37 more!

---

## 📋 FILES THAT WILL BE FIXED:

All files in `src/components/ui/`:
- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- aspect-ratio.tsx
- avatar.tsx
- badge.tsx
- breadcrumb.tsx
- button.tsx ✅ (already fixed)
- calendar.tsx
- card.tsx
- carousel.tsx
- chart.tsx
- checkbox.tsx
- collapsible.tsx
- command.tsx
- context-menu.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- form.tsx
- hover-card.tsx
- input-otp.tsx
- input.tsx
- label.tsx
- menubar.tsx
- navigation-menu.tsx
- pagination.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- resizable.tsx
- scroll-area.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- skeleton.tsx
- slider.tsx
- sonner.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toast.tsx
- toaster.tsx
- toggle-group.tsx
- toggle.tsx
- tooltip.tsx

---

## ⏱️ ALTERNATIVE: Use the Python Script

If you still have `fix_all_imports.py`, run it:

```bash
cd ~/path/to/HPS-WEB-FEBRUARY
python3 fix_all_imports.py
git add src/components/ui/
git commit -m "Fix: Remove all version specifiers"
git push origin main
```

---

## 🎯 AFTER RUNNING THE SCRIPT:

Vercel will automatically redeploy and your site will be LIVE! 🚀

The build is already working - we just need to fix these import statements!
