---
name: Full-stack port split
description: Port assignment for the two-service architecture in this project.
---

## Rule
- **FastAPI backend**: port 8000, workflow type "console"
- **Next.js frontend**: port 5000, workflow type "webview"
- **API proxy**: `next.config.ts` rewrites `source: "/api/:path*"` → `destination: "http://localhost:8000/api/:path*"`

**Why:** Replit webview only serves port 5000. Backend on 8000 avoids collision. All browser API calls go through the Next.js server (same origin), which proxies to the backend — no CORS needed.

**How to apply:** When restarting or reconfiguring, always keep backend on 8000 (console) and frontend on 5000 (webview).
