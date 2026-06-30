---
name: App Router route groups
description: How Next.js App Router (group) folders affect URL structure — key gotcha for this project.
---

## Rule
Route groups `(group)` are invisible in the URL. To serve `/dashboard`, you need `app/(group)/dashboard/page.tsx`, NOT `app/(group)/page.tsx`.

**Why:** `app/(dashboard)/page.tsx` maps to `/`, not `/dashboard`. The project uses:
- `app/(auth)/login/page.tsx` → `/login`
- `app/(dashboard)/dashboard/page.tsx` → `/dashboard`
- `app/(dashboard)/dashboard/documents/page.tsx` → `/dashboard/documents`

**How to apply:** Always add an explicit named subfolder inside route groups when you want a named URL segment.
