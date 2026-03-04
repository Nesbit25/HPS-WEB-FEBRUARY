#!/usr/bin/env python3
"""
Hanemann Plastic Surgery — Case Folder Uploader
================================================
One folder = one case.
Photos inside each folder = that case's before/after images.
Uploads directly to GitHub — no Supabase passthrough.

REQUIRED FOLDER STRUCTURE:
  new_cases/
    Face/
      pt_1086_rhinoplasty/
        before.jpg        →  gallery/Face/pt_1086_rhinoplasty/pt_1086_rhinoplasty_p1_img1.jpg
        after.jpg         →  gallery/Face/pt_1086_rhinoplasty/pt_1086_rhinoplasty_p1_img2.jpg
    Nose/
      pt_1087_nose/
        before.jpg        →  gallery/Nose/pt_1087_nose/pt_1087_nose_p1_img1.jpg
        after.jpg         →  gallery/Nose/pt_1087_nose/pt_1087_nose_p1_img2.jpg
    Breast/
      pt_10_aug/
        front_before.jpg  →  gallery/Breast/pt_10_aug/pt_10_aug_p1_img1.jpg
        front_after.jpg   →  gallery/Breast/pt_10_aug/pt_10_aug_p1_img2.jpg
        side_before.jpg   →  gallery/Breast/pt_10_aug/pt_10_aug_p1_img3.jpg
        side_after.jpg    →  gallery/Breast/pt_10_aug/pt_10_aug_p1_img4.jpg
    Body/
      pt_22_tummy/
        before.jpg        →  gallery/Body/pt_22_tummy/pt_22_tummy_p1_img1.jpg
        after.jpg         →  gallery/Body/pt_22_tummy/pt_22_tummy_p1_img2.jpg

NAMING RULE:
  Odd  img number  = Before
  Even img number  = After
  Each before+after pair = one orientation/view angle

USAGE:
  # Preview only (no upload) — always run this first
  python upload_gallery.py

  # Actually upload
  python upload_gallery.py --upload

  # Point at a different source folder
  python upload_gallery.py --source /path/to/my/cases --upload
"""

import os
import re
import sys
import base64
import json
import time
import argparse
import requests
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────────────────────────
GITHUB_TOKEN   = os.environ.get("GITHUB_TOKEN", "YOUR_TOKEN_HERE")
GITHUB_OWNER   = "Nesbit25"
GITHUB_REPO    = "HPS-WEB-FEBRUARY"
GITHUB_BRANCH  = "main"
GALLERY_ROOT   = "gallery"         # repo root for all gallery images
VALID_CATS     = ["Face", "Nose", "Breast", "Body"]
DEFAULT_SOURCE = "./new_cases"     # local folder — must contain Face/, Breast/, Body/ subfolders
# ─────────────────────────────────────────────────────────────────────────────

API_BASE = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}"
HEADERS  = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept":        "application/vnd.github.v3+json",
    "Content-Type":  "application/json",
}

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

BEFORE_RE = re.compile(r"\b(before|pre|b4)\b", re.IGNORECASE)
AFTER_RE  = re.compile(r"\b(after|post|result)\b", re.IGNORECASE)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_")


def get_file_sha(repo_path: str) -> str | None:
    """Return the blob SHA of an existing repo file (needed to overwrite it)."""
    url = f"{API_BASE}/contents/{repo_path}?ref={GITHUB_BRANCH}"
    r = requests.get(url, headers=HEADERS)
    return r.json().get("sha") if r.status_code == 200 else None


def upload_file(local_path: Path, repo_path: str, retries: int = 3) -> bool:
    """Upload a single file to GitHub via the Contents API."""
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()

    sha = get_file_sha(repo_path)
    payload: dict = {
        "message": f"Gallery upload: {local_path.name}",
        "content": content,
        "branch":  GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha

    url = f"{API_BASE}/contents/{repo_path}"
    for attempt in range(1, retries + 1):
        r = requests.put(url, headers=HEADERS, data=json.dumps(payload))
        if r.status_code in (200, 201):
            return True
        if r.status_code == 409 and attempt < retries:
            # SHA conflict — refresh and retry
            time.sleep(1)
            sha = get_file_sha(repo_path)
            if sha:
                payload["sha"] = sha
        else:
            print(f"\n      ✗  HTTP {r.status_code}: {r.json().get('message', r.text[:120])}")
            return False
    return False


# ─── Core: build the plan for one case folder ─────────────────────────────────

def pair_images(folder: Path) -> list[tuple[Path | None, Path | None]]:
    """
    Return a list of (before_file, after_file) orientation pairs from a folder.

    Priority:
      1. Files with "before"/"after" keywords → pair them by sort order
      2. No keywords → sort alphabetically, interleave odd=before / even=after
      3. Odd count  → last file gets a None partner (will be warned)
    """
    files = sorted(
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in IMG_EXTS
    )
    if not files:
        return []

    before = [f for f in files if BEFORE_RE.search(f.stem)]
    after  = [f for f in files if AFTER_RE.search(f.stem)]
    ambig  = [f for f in files if f not in before and f not in after]

    # If keywords found on at least one side, trust them
    if before or after:
        # Any leftover ambiguous files appended to the shorter side
        for f in ambig:
            if len(before) <= len(after):
                before.append(f)
            else:
                after.append(f)
        before.sort()
        after.sort()
        pairs = list(zip(before, after))
        # Handle uneven counts
        for i in range(len(pairs), max(len(before), len(after))):
            b = before[i] if i < len(before) else None
            a = after[i]  if i < len(after)  else None
            pairs.append((b, a))
        return pairs

    # No keywords — interleave alphabetically
    pairs = []
    for i in range(0, len(ambig), 2):
        b = ambig[i]
        a = ambig[i + 1] if i + 1 < len(ambig) else None
        pairs.append((b, a))
    return pairs


def build_plan(source_dir: Path) -> list[dict]:
    """
    Walk category → case subfolders and build upload plans.

    Expected layout:
      source_dir/
        Face/    {case_slug}/  {images}
        Breast/  {case_slug}/  {images}
        Body/    {case_slug}/  {images}

    Each plan:
      {
        "slug":     "pt_1086_rhinoplasty",
        "category": "Face",
        "folder":   Path,
        "uploads":  [{"local": Path, "repo_path": str, "label": str, "img_num": int}],
        "warnings": [str],
      }
    """
    plans = []

    # Collect case dirs from category subfolders
    case_dirs = []  # list of (category_str, case_path)
    for cat in VALID_CATS:
        cat_dir = source_dir / cat
        if cat_dir.is_dir():
            for case_d in sorted(cat_dir.iterdir()):
                if case_d.is_dir():
                    case_dirs.append((cat, case_d))
        else:
            # Tolerate source_dir that has case dirs directly (no category subfolder) — warn
            pass

    # Fallback: if no category subfolders found, treat everything as uncategorised and warn
    if not case_dirs:
        print(f"\n  ⚠️   No Face/, Breast/, or Body/ subfolders found in {source_dir}.")
        print("      Please organise your cases like:  new_cases/Face/pt_xxx/ …")
        return []

    for category, case_dir in case_dirs:
        slug = slugify(case_dir.name)
        pairs = pair_images(case_dir)
        warnings = []
        uploads = []

        if not pairs:
            warnings.append("No image files found — folder skipped.")
            plans.append({"slug": slug, "category": category, "folder": case_dir, "uploads": [], "warnings": warnings})
            continue

        img_num = 1
        for b_file, a_file in pairs:
            for src, label in [(b_file, "before"), (a_file, "after")]:
                if src is None:
                    warnings.append(f"  ⚠  Unpaired {label} image in orientation {(img_num // 2) + 1}.")
                    img_num += 1
                    continue
                ext = src.suffix.lower().lstrip(".")
                dest_name = f"{slug}_p1_img{img_num}.{ext}"
                # New nested structure: gallery/{category}/{case_slug}/{filename}
                repo_path = f"{GALLERY_ROOT}/{category}/{slug}/{dest_name}"
                uploads.append({
                    "local":     src,
                    "repo_path": repo_path,
                    "label":     label,
                    "img_num":   img_num,
                })
                img_num += 1

        plans.append({
            "slug":     slug,
            "category": category,
            "folder":   case_dir,
            "uploads":  uploads,
            "warnings": warnings,
        })

    return plans


# ─── Display ──────────────────────────────────────────────────────────────────

def print_plan(plans: list[dict]):
    total_files = sum(len(p["uploads"]) for p in plans)
    total_cases = len([p for p in plans if p["uploads"]])
    print(f"\n{'─'*65}")
    print(f"  📋  {total_cases} cases  |  {total_files} files to upload")
    print(f"  📁  Destination: github.com/{GITHUB_OWNER}/{GITHUB_REPO}/{GALLERY_ROOT}/{{category}}/{{case_slug}}/")
    print(f"{'─'*65}\n")

    for p in plans:
        status = "✅" if p["uploads"] else "⚠️ "
        print(f"  {status}  [{p.get('category','?'):6}]  {p['slug']}")
        print(f"      Source:  {p['folder'].parent.name}/{p['folder'].name}")
        for u in p["uploads"]:
            tag = "BEFORE" if u["label"] == "before" else "AFTER "
            print(f"      [{tag}]  {u['local'].name:<35}  →  {Path(u['repo_path']).name}")
        for w in p["warnings"]:
            print(f"      ⚠️  {w}")
        print()


# ─── Interactive review ───────────────────────────────────────────────────────

def interactive_review(plans: list[dict]) -> list[dict]:
    """
    Let the user swap before/after within any case before uploading.
    Returns the (possibly modified) plans list.
    """
    print("\n  Review the plan above.")
    print("  If any before/after assignments look wrong, you can swap them now.")
    print()

    while True:
        ans = input("  Type a case slug to swap its images, or press Enter to continue: ").strip()
        if not ans:
            break

        match = next((p for p in plans if p["slug"] == ans), None)
        if not match:
            print(f"  ✗  No case found with slug '{ans}'. Check spelling.")
            continue

        uploads = match["uploads"]
        print(f"\n  Current order for '{ans}':")
        for i, u in enumerate(uploads):
            print(f"    [{i}]  img{u['img_num']:02d}  {u['label']:6s}  {u['local'].name}")

        swap = input("  Enter two indices to swap (e.g. '0 1'), or Enter to skip: ").strip()
        if swap:
            parts = swap.split()
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                i, j = int(parts[0]), int(parts[1])
                if 0 <= i < len(uploads) and 0 <= j < len(uploads):
                    uploads[i], uploads[j] = uploads[j], uploads[i]
                    # Swap labels too
                    uploads[i]["label"], uploads[j]["label"] = uploads[j]["label"], uploads[i]["label"]
                    # Renumber sequentially
                    for k, u in enumerate(uploads, start=1):
                        u["img_num"] = k
                        ext  = Path(u["repo_path"]).suffix
                        name = f"{match['slug']}_p1_img{k}{ext}"
                        u["repo_path"] = f"{GALLERY_ROOT}/{match['category']}/{match['slug']}/{name}"
                    print("  ✅  Swapped.")
                else:
                    print("  ✗  Invalid indices.")
            else:
                print("  ✗  Enter exactly two numbers.")
        print()

    return plans


# ─── Upload ───────────────────────────────────────────────────────────────────

def run_upload(plans: list[dict]) -> tuple[int, int]:
    total_ok = total_fail = 0
    for p in plans:
        if not p["uploads"]:
            continue
        print(f"\n  📦  [{p.get('category','?')}]  {p['slug']}  ({len(p['uploads'])} files)")
        for u in p["uploads"]:
            tag = "BEFORE" if u["label"] == "before" else "AFTER "
            dest = Path(u["repo_path"]).name
            print(f"      [{tag}]  {u['local'].name}  →  {dest} ...", end="  ", flush=True)
            if upload_file(u["local"], u["repo_path"]):
                print("✓")
                total_ok += 1
            else:
                print("✗")
                total_fail += 1
            time.sleep(0.35)   # stay well inside GitHub's rate limit

    return total_ok, total_fail


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="HPS Gallery Case Uploader")
    parser.add_argument("--source",  default=DEFAULT_SOURCE, help="Folder containing case subfolders")
    parser.add_argument("--upload",  action="store_true",    help="Actually upload (default is preview only)")
    parser.add_argument("--no-review", action="store_true",  help="Skip interactive before/after review")
    args = parser.parse_args()

    # ── Validate env ──────────────────────────────────────────────────────────
    if GITHUB_TOKEN == "YOUR_TOKEN_HERE":
        print("\n❌  GITHUB_TOKEN not set.")
        print("    Either edit the CONFIG section at the top of this script,")
        print("    or run:  GITHUB_TOKEN=ghp_xxxx python upload_gallery.py --upload\n")
        sys.exit(1)

    source = Path(args.source)
    if not source.exists():
        print(f"\n❌  Source folder not found: {source.resolve()}")
        print(f"    Create it and put your case subfolders inside, then re-run.\n")
        sys.exit(1)

    # ── Header ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  Hanemann Plastic Surgery — Case Folder Uploader")
    print("=" * 65)
    print(f"  Repo:    {GITHUB_OWNER}/{GITHUB_REPO}  ({GITHUB_BRANCH})")
    print(f"  Dest:    {GALLERY_ROOT}/{{Face|Breast|Body}}/{{case_slug}}/")
    print(f"  Source:  {source.resolve()}")
    mode = "UPLOAD" if args.upload else "PREVIEW ONLY  (run with --upload to actually push)"
    print(f"  Mode:    {mode}")
    print("=" * 65)

    # ── Build plan ────────────────────────────────────────────────────────────
    plans = build_plan(source)

    if not plans:
        print("\n  No case folders found. Check your --source path.\n")
        sys.exit(0)

    print_plan(plans)

    if not args.upload:
        print("  ──────────────────────────────────────────────────────────")
        print("  This was a PREVIEW. Nothing was uploaded.")
        print("  Run with --upload when you're happy with the assignments.")
        print("  ──────────────────────────────────────────────────────────\n")
        sys.exit(0)

    # ── Interactive review before uploading ───────────────────────────────────
    if not args.no_review:
        plans = interactive_review(plans)

    # ── Confirm ───────────────────────────────────────────────────────────────
    total = sum(len(p["uploads"]) for p in plans)
    ans = input(f"\n  Ready to upload {total} files to GitHub. Confirm? [y/N]: ").strip().lower()
    if ans != "y":
        print("  Cancelled.\n")
        sys.exit(0)

    # ── Upload ────────────────────────────────────────────────────────────────
    ok, fail = run_upload(plans)

    print(f"\n{'─'*65}")
    print(f"  ✅  Uploaded:  {ok}")
    if fail:
        print(f"  ✗   Failed:   {fail}")
    print(f"{'─'*65}\n")

    if ok:
        print("  👉  Next step: open the Gallery admin panel in your browser")
        print("      and click  🔥 Rebuild All Cases")
        print("      This creates a KV record for every case using the new photos.\n")


if __name__ == "__main__":
    main()
