# Windows 11 Desktop Widgets Host

A lightweight native **Tauri v2 + React + TypeScript** desktop widget host for Windows 11. It hosts draggable, resizable, transparent, and persistent widgets with a Windows 11-inspired acrylic/glass UI, system tray controls, auto-start integration, and native Rust command hooks.

## Features

- **Tauri Native Windows**: Frameless transparent Tauri windows skip the taskbar and sit persistently on the desktop.
- **Acrylic Glassmorphism**: Tailored accent themes, customizable blur, customizable border radii, and soft shadow controls.
- **Modular Widgets**: Clock, World Clock, Weather, Notes, Sticky Notepad, Todo, System Monitor, Pomodoro, Calculator, Calendar, Quick Links, Mindmap, and Custom Widget (iframe/HTML).
- **Control & Arranging**: Drag & drop, mouse-based resizing, lock layout toggle, snapping to grid.
- **Coordinate Memory**: Unpinning/pinning restores the widget to its precise location.
- **Automatic Recovery**: Offline fallback representations for weather and system statistics, state verification, and storage corruption recovery.
- **System Tray Integration**: Show widgets, hide widgets, open settings, and exit commands available from the system tray.

## Setup & Run

### Prerequisites
- **Node.js 20+**
- **Rust Stable**
- **Microsoft C++ Build Tools & WebView2 Runtime** (Tauri prerequisites)

### 1. Install Dependencies
Run in the `desktop/` directory:

```powershell
npm install
```

### 2. Development (Web UI Only)
To test the interface in the browser:

```powershell
npm run dev
```

### 3. Development (Native Tauri App)
To run the full native application:

```powershell
npm run tauri:dev
```

### 4. Production Build (Frontend)
```powershell
npm run build
```

TypeScript and Vite reuse build data from the repository-level `.cache/` directory. Native release builds also use Cargo incremental compilation, and the GitHub release workflow restores both the frontend cache and `desktop/src-tauri/target` between runs.

### 5. Compile Native Windows Executable
To package the desktop app as an MSI / NSIS installer:

```powershell
npm run tauri:build
```

For a release that can be installed by the in-app updater, provide the Tauri signing key through `TAURI_SIGNING_PRIVATE_KEY` or `TAURI_SIGNING_PRIVATE_KEY_PATH`, set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (use an explicit empty value for a passwordless key), and run:

```powershell
npm run tauri:build:release
```

The release workflow publishes the signed NSIS artifact and `latest.json` to GitHub Releases. The updater checks that feed on application startup and installs updates after the user confirms.

## Project Structure

```text
desktop/
├── src/                  # React Frontend Code
│   ├── components/       # Interface Components
│   │   ├── layout/       # Frame, sidebar, toolbar, inspector
│   │   ├── settings/     # App configurations, themes, snap options
│   │   ├── ui/           # Buttons, checkboxes, sliders
│   │   └── widgets/      # The 13 interactive widgets
│   ├── lib/              # Styling, colors, native hooks
│   ├── store/            # Zustand layout/theme state management
│   └── types/            # TypeScript models
└── src-tauri/            # Native Rust Code
    ├── src/
    │   ├── commands.rs   # Window handling, positioning, startup options
    │   ├── main.rs       # Entrypoint & custom protocol handler
    │   ├── startup.rs    # Auto-start registry integration
    │   └── tray.rs       # System tray definition
    └── tauri.conf.json   # Tauri compilation configuration
```
