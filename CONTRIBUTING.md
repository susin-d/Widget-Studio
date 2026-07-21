# Contributing to Widget Studio

Thank you for your interest in contributing to **Widget Studio**! We welcome bug reports, feature requests, documentation improvements, and code contributions from the community.

## 📜 Code of Conduct

Please be respectful, constructive, and civil in all issues, pull requests, and discussions.

## 🛠️ Development Setup

Widget Studio is a 100% local-first Windows 11 desktop application:

- `desktop/`: Native Windows app (Tauri v2 + React + TypeScript + Vite)
- `docs/`: Product and custom widget documentation

### Prerequisites

- **Node.js**: v20 or newer
- **Rust & Cargo**: Latest stable (required for desktop app development)
- **Windows 10/11**: Recommended for native overlay testing

### Getting Started

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/Widget-Studio.git
   cd Widget-Studio
   ```

2. **Install & Run App**
   ```bash
   cd desktop
   npm install
   npm run tauri:dev
   ```

## 🧪 Testing & Verification

Before submitting a Pull Request, verify that your changes build cleanly and type-check:

```bash
# In desktop/
npm run build
```

## 🔀 Pull Request Process

1. **Create a Topic Branch**: Branch off `main` (e.g., `git checkout -b feature/awesome-widget`).
2. **Keep Commits Clean**: Write clear, descriptive commit messages.
3. **Update Documentation**: Update relevant docs in `docs/` or `README.md` if adding or changing functionality.
4. **Open a Pull Request**: Provide a detailed summary of what your PR resolves and any screenshots/videos for UI changes.

Thank you for making Widget Studio better! 🚀
