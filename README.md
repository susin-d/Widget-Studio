# Widget Studio

Widget Studio is a premium, modular, and highly customizable desktop widget host for Windows 11, paired with a cloud-synchronized web dashboard. Built using **Tauri v2, React, TypeScript, Zustand, and Tailwind CSS**, it is backed by a **FastAPI + PostgreSQL** sync server supporting secure email/password registration and Google OAuth.

The application allows users to create transparent, interactive, and beautifully animated desktop widgets (clocks, weather, system monitors, notes, mindmaps, and more) that sit directly on the desktop surface, persist their states, snap to grids, and synchronize dynamically to the cloud.

---

## 📂 Repository Structure

This is a monorepo consisting of three main modules:

```text
widget/
├── desktop/       # Native Windows 11 desktop application host (Tauri v2 + React)
├── website/       # Marketing landing page & cloud-based dashboard (Vite + React)
├── server/        # Synchronizing API backend (FastAPI + PostgreSQL)
└── assets/        # Static visual assets and icons
```

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    subgraph Native Client (desktop)
        Tauri[Tauri v2 / Rust Host] <--> ReactDesktop[React App / Zustand]
        ReactDesktop <--> LocalStorage[Local layout.json]
    end

    subgraph Web Client (website)
        ReactWeb[React App / Zustand] <--> BrowserStorage[localStorage fallback]
    end

    subgraph Backend Server (server)
        FastAPI[FastAPI API] <--> PG[(PostgreSQL Database)]
    end

    ReactDesktop <-->|JWT Layout Sync / Deep Link OAuth| FastAPI
    ReactWeb <-->|JWT Layout Sync / Web OAuth| FastAPI
    FastAPI <-->|Google OAuth Flow| Google[Google Identity Provider]
```

### Module Responsibilities

1. **`desktop/`**: Operates as a native Windows application. It runs frameless, transparent Tauri windows (`widget-<uuid>`) that skip the taskbar, sit always-on-top or pinned on the desktop, and auto-restore themselves when the desktop is revealed (e.g. using the Windows three-finger swipe).
2. **`website/`**: Served as a browser app. It hosts the public marketing presence, product FAQ, download links, and an in-browser dashboard preview. When logged in, it acts as a layout editor and retrieves configurations from the backend.
3. **`server/`**: A REST API built with FastAPI. It handles password-based authentication, Google OAuth authorization flow, and stores/syncs the widget layouts in a PostgreSQL database.

---

## 🎨 Design System & Visuals

Widget Studio features a Windows 11-inspired glassmorphism look:
- **Acrylic Surfaces**: Dynamic backdrop blur, soft reflections, border highlights, and variable shadow levels.
- **Accent Themes**: Six premium built-in color palettes (Berry Pop, Citrus Splash, Ocean Candy, Lavender Dream, Mint Sorbet, Midnight Neon) with light and dark mode flexibility.
- **Micro-Animations**: Fluid transitions powered by Framer Motion.
- **Responsive Layout**: Sidebars, widgets, control bar, and inspector adapt smoothly across canvas resolutions.

---

## ⚙️ Core Application Features

- **Draggable & Resizable Canvas**: Drag, drop, and manually resize widgets with the mouse. Clean grid-snapping (12px intervals) allows tidy alignment.
- **Window Locking & Pinning**: Pin a widget to place it as an independent native window on the desktop. Lock positions to prevent accidental shifts.
- **Coord Memory**: Unpinning/pinning restores the widget back to its previous position on the canvas canvas seamlessly.
- **Zero Terminal Popups**: Native CLI hooks and process creation are structured cleanly to avoid terminal flickers or popping windows during background runs.

---

## 🧩 Widget Catalog

Widget Studio comes with **13 built-in widgets**:

| Widget Name | Description | Key Features |
|---|---|---|
| 🕒 **Clock** | Analog/digital hybrid clock | Custom time formats, seconds toggling, dynamic sizes |
| 🌐 **World Clock** | Time tracker for different time zones | Multiple timezone cards, clean visual indicator |
| 🌤️ **Weather** | Offline-safe local weather monitor | Temp, weather condition icons, fallback graphics |
| 📝 **Notes** | Simple scratchpad note-taker | Auto-saving text area with customized font sizing |
| 📌 **Sticky Notepad** | Virtual Windows-style sticky notes | Per-note styling, background coloring, list tags |
| ✅ **Todo** | Interactive checklist builder | Add, check, filter, delete, and progress indicator |
| 📈 **System Monitor** | Native memory and CPU metrics | Visual line charts for CPU/RAM usage (Tauri native) |
| 🍅 **Pomodoro** | Time management focus timer | Custom intervals, alerts, visual progress circle |
| 🧮 **Calculator** | Full-featured workspace calculator | Keypad inputs, history tape, standard operators |
| 📅 **Calendar** | Monthly date viewer and planner | Full month grid, interactive day highlights, current day indicator |
| 🔗 **Quick Links** | Grid of bookmark icons | Custom web URL targets, icons, label naming |
| 🧠 **Mindmap** | Node-based interactive brainstorming tree | Add/delete branches, auto-layouts, custom connections |
| 🌐 **Custom Widget** | iframe / HTML embed workspace | Embed videos, maps, custom websites, or custom CSS code |

---

## 🚀 Setup & Execution Guide

### Creating a custom widget

Open **Dev tools** in Widget Studio for the visual/code builder, live sandbox preview, permissions guide, and publishing flow. See the full [custom widget guide](docs/custom-widget-guide.md) for block behavior, the `WidgetStudio.request(...)` API, and troubleshooting.

Ensure you have **Node.js 20+**, **Rust stable**, **Python 3.9+**, and **PostgreSQL** installed.

### 1. Launching the Backend Server

Navigate to the `server/` directory, set up your Python virtual environment, install requirements, and set up your config:

```powershell
# Set up environment
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create .env config
copy .env.example .env  # Or create one manually with DATABASE_URL, SECRET_KEY, and Google OAuth credentials

# Start FastAPI
python -m uvicorn server.main:app --reload --port 8000
```
*API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Launching the Website

Navigate to the `website/` directory, install dependencies, and spin up the web development server:

```powershell
cd website
npm install
npm run dev
```
*Website runs at [http://localhost:5173](http://localhost:5173).*

### 3. Launching the Desktop Client

Navigate to the `desktop/` directory, install dependencies, and run in Tauri developer mode:

```powershell
cd desktop
npm install
npm run tauri:dev
```

---

## 🔒 Authentication & Synchronization Workflow

When a user initiates Google Sign-In:
1. **Desktop / Website** triggers OAuth request to the FastAPI Server: `/api/auth/google`.
2. **Server** redirects user to the Google Login consent page.
3. User completes login; Google redirects back to server callback `/api/auth/google/callback` with authorization code.
4. **Server** exchanges code for a profile, stores user in db, generates a JWT session token, and opens deep-link `widget-studio://auth?token=...` or redirects back to the website.
5. **Desktop application** registers the custom protocol (`widget-studio://`) and absorbs the JWT to hydrate state and begin bi-directional synchronization.
# Widget-Studio
# Widget-Studio
