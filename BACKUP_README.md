# Capricorn Hub — Pre-Redesign Backup

## What was backed up

- Full snapshot of `shamikhahmed.github.io/` (GitHub Pages Capricorn hub), copied to this folder.
- **Included:** `.git/` (full repo history at backup time), all HTML/CSS/JS/assets, docs, manifests, service worker, etc.
- **Excluded:** `node_modules/` (not required for static site restore; was ~45 MB in source).
- **Extra:** `design-system-backup/capricorn.svg` from `shared/design-system/marks/capricorn.svg`.

## Date / time

**2026-07-02 16:42:55 PKT**

## Context

Backup taken **before** the MotionSites-inspired redesign (Phase 1–2). Use this tree to diff or roll back individual files.

## How to restore

From the parent `Projects` directory:

```bash
# Full overwrite (destructive — review first)
cp -R shamikhahmed.github.io-backup-2026-07-02/* shamikhahmed.github.io/

# Safer: compare first
diff -rq shamikhahmed.github.io-backup-2026-07-02 shamikhahmed.github.io

# Restore a single file
cp shamikhahmed.github.io-backup-2026-07-02/index.html shamikhahmed.github.io/
```

Do not copy `BACKUP_README.md` or `design-system-backup/` into the live hub unless you intend to.

To restore the shared mark:

```bash
cp shamikhahmed.github.io-backup-2026-07-02/design-system-backup/capricorn.svg \
  shared/design-system/marks/capricorn.svg
```

## Git state at backup time (not necessarily pristine)

The hub was on branch `main` tracking `origin/main`. At backup time, **working tree differed from last commit** (redesign work may already be in progress):

| Status | Path |
|--------|------|
| Modified | `css/capricorn-core.css` |
| Modified | `css/capricorn.css` |
| Modified | `index.html` |
| Modified | `js/apps-data.js` |
| Modified | `js/product-page.js` |
| Modified | `js/products-data.js` |
| Modified | `manifest.json` |
| Modified | `solutions.html` |
| Modified | `sw.js` |
| Untracked (new) | `js/cap-demo-mode.js` |
| Untracked (new) | `js/cap-desktop-nav.js` |

For a **pristine** baseline, use `git checkout` / `git show HEAD:path` inside the backed-up `.git` or compare against `origin/main` at a specific commit.

## Backup stats (approx.)

- ~950 files (excluding this README at count time; total includes `.git` objects)
- ~203 MB on disk (includes ~150 MB `.git`, excludes source `node_modules`)
