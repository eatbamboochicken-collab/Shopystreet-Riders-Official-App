# Shopystreet Riders

Universal courier execution and delivery network Progressive Web App (PWA).

Shopystreet Riders is a shared courier execution platform powering deliveries for Bamboo Chicken Select, Shopystreet SEND, Long Live Harare, and partner merchants.

---

## 1. Project Architecture

Shopystreet Riders is intentionally structured as a **static HTML, CSS, and vanilla JavaScript Progressive Web App**.

```
[ Rider Browser / PWA Client ]
            │
            │ HTTPS (Bearer Token Auth)
            ▼
[ Cloudflare Worker API ]
  (shopystreet-delivery-api.warstreett.workers.dev)
            │
            │ D1 Binding (DB)
            ▼
[ Cloudflare D1 Database ]
  (shopystreet-delivery-db)
```

- **Frontend Tech**: Static HTML5, modern CSS3 (Sky Blue & Deep Ink design system), Vanilla JavaScript (ES2022), Web App Manifest, Service Worker.
- **Framework-free**: No React, Next.js, Vue, Angular, or unnecessary bundling overhead. Deployable directly as raw static assets.
- **Security Boundary**: The browser client **never** connects directly to D1 and contains zero database credentials. The Cloudflare Worker enforces authentication, state machine validation, and atomic job claims.

---

## 2. File Hierarchy & Source of Truth

The canonical source of truth for all frontend code is the `public/` directory:

```
shopystreet-riders/
├── public/                     # CANONICAL STATIC FRONTEND ASSETS
│   ├── index.html              # Single-page PWA shell and screens
│   ├── manifest.webmanifest    # W3C Web App Manifest (PWA)
│   ├── manifest.json           # Compatibility manifest mirror
│   ├── sw.js                   # Service Worker (offline shell & network bypass)
│   │
│   ├── css/
│   │   └── app.css             # Sky Blue & Deep Ink design system styles
│   │
│   ├── js/
│   │   └── app.js              # Vanilla JS application & state engine
│   │
│   └── icons/                  # PWA icon assets
│       ├── icon-192.png        # Standard 192x192 icon
│       ├── icon-512.png        # Standard 512x512 icon
│       ├── icon-maskable-512.png # Maskable 512x512 icon for Android
│       ├── apple-touch-icon.png# iOS touch icon
│       └── icon.svg            # Vector brand icon
│
├── tests/                      # AUTOMATED ARCHITECTURE & PWA AUDIT
│   └── architecture-audit.test.mjs # Native Node.js test suite
│
├── server.ts                   # Local development server & runner
├── package.json                # Project dependencies and test scripts
└── README.md                   # System documentation
```

---

## 3. Production Deployment Model

```
GITHUB (Source of Truth repository)
   ↓
CLOUDFLARE PAGES / WORKER ASSETS (Live Hosting)
   └── Serves static files from: public/
```

- **Source Control**: GitHub is the single authoritative source of truth for version history.
- **Live Hosting**: Cloudflare hosts the static output from `public/`.
- **Backend API**: Cloudflare Worker at `https://shopystreet-delivery-api.warstreett.workers.dev`.

---

## 4. PWA Foundation

- **Web App Manifest**: Standard `/manifest.webmanifest` defining standalone display, theme color (`#070D18`), orientation, and full icon set.
- **Service Worker**: `/sw.js` implements a cache-first/stale-while-revalidate strategy for the app shell, with explicit network-only bypass for all `/api/` and Worker API requests.
- **Installability**: Native browser `beforeinstallprompt` support and custom install action banner.

---

## 5. Development & Testing

- **Local Dev Server**:
  ```bash
  npm run dev
  ```
  Runs `server.ts` on port 3000, serving `public/` and providing local API endpoints.

- **Run Architecture & PWA Audit Tests**:
  ```bash
  npm test
  ```
  Executes the automated architecture test suite (`node --test tests/*.test.mjs`).
