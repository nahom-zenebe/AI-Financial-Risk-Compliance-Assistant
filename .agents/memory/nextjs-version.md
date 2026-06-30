---
name: Next.js version policy
description: Which Next.js versions are installable vs blocked by Replit's CVE security firewall.
---

## Rule
Always install `next@16.2.9` (or higher). Do NOT pin to 14.x or 15.x.

**Why:** Replit's package firewall blocks Next.js 14.2.5, 15.3.4, and likely other 14.x/15.x builds with a "Critical CVE" 403 error. Next.js 16.2.9 passes and installs cleanly.

**How to apply:** When scaffolding a new Next.js project on this repl, use `npm install next@16.2.9 react@^19 react-dom@^19`.
