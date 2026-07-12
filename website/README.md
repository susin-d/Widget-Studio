# Widget Studio — Website and Cloud Dashboard

This directory houses the marketing landing page, documentation pages (Features, FAQ, Download), user onboarding flow, authentication, and the web-based interactive canvas dashboard of **Widget Studio**.

It runs entirely in the browser using React, TypeScript, and Tailwind CSS, leveraging Vite as a build tool.

## Features

- **Marketing Landing Page**: Premium, interactive landing page introducing Widget Studio.
- **Onboarding Flow**: Guided tutorial introducing canvas customization.
- **Full Interactive Canvas**: Add, delete, customize, drag, and resize widgets in the browser.
- **User Authentication**: Login/Signup forms and Google OAuth integration.
- **Cloud Synchronization**: Syncs layout states and settings with the FastAPI backend database when authenticated.
- **Tauri Fallbacks**: Automatically falls back to local storage and safe mock behaviors for OS-level actions (such as System Monitor statistics, startup integration, and native tray commands) when running in a generic web browser.

## Getting Started

### 1. Installation
Install project dependencies using `npm`:

```powershell
npm install
```

### 2. Development Mode
Run the local development server:

```powershell
npm run dev
```
The site will run on [http://localhost:5173](http://localhost:5173).

### 3. Production Build
Compile and bundle the project for distribution:

```powershell
npm run build
```
The output assets will be generated in the `dist/` directory.

### 4. Code Quality
Check TypeScript files for errors:

```powershell
npm run lint
```

## Folder Structure

```text
website/
├── src/
│   ├── components/        # UI components (buttons, layout panels, dialogs)
│   │   ├── layout/        # Canvas and page layouts (WidgetFrame, WidgetGallery)
│   │   ├── settings/      # Customizer panels and controls
│   │   ├── ui/            # Primitive UI components
│   │   └── website/       # Landing, Features, FAQ, and Download pages
│   ├── lib/               # Utility functions, colors, and storage logic
│   ├── store/             # Zustand state management (authStore, settingsStore, widgetStore)
│   └── types/             # TS interfaces and type definitions
├── index.html             # Application entry point
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS theme configurations
```
