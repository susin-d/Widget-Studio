# Custom Widget Guide

Widget Studio allows users and developers to create, test, and publish custom widgets directly inside the application.

## 🛠️ Accessing the Builder

1. Open **Dev tools** from the sidebar navigation.
2. Select **Create a custom widget**.

---

## 🎨 1. Builder Modes

### Visual Builder
Assemble widgets visually using interactive UI blocks:
- **Layout**: Container, Row
- **Content**: Heading, Text
- **Actions**: Button, Link
- **Media**: Remote HTTP(S) Image
- **Spacing**: Spacer

### Code Editor
For complete flexibility, switch to **Code mode** to write raw **HTML**, **CSS**, and **JavaScript**. Code mode gives full control over styles and DOM manipulation inside the widget container.

---

## 🔒 2. Security Sandbox & Permission Model

Custom widgets execute inside a sandboxed `<iframe>` (`sandbox="allow-scripts"`). Custom code cannot access window globals or Tauri internals directly.

To use system capabilities, use the `WidgetStudio.request` API:

```javascript
WidgetStudio.request("notifications", {
  title: "Pomodoro Timer",
  body: "Time for a 5-minute break!"
});
```

### Supported Capabilities & Permissions

| Permission Name | Description |
| --- | --- |
| `network` | Perform HTTPS requests to external APIs. |
| `clipboard` | Copy text data to system clipboard. |
| `notifications` | Send desktop system notifications. |
| `openExternal` | Open approved HTTP(S) links in the system default browser. |

Permissions prompt the user for authorization on first use.

---

## 💾 3. Persistence & Export

Custom widgets are saved inside your local workspace configuration state. You can export and share your widgets via **Import & Export** in JSON format across machines.
