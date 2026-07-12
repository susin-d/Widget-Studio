# Custom widget guide

Widget Studio lets you create a custom widget without leaving the app. Open **Dev tools** and choose **Create a custom widget**.

## 1. Choose a builder mode

Use **Visual builder** when you want to assemble a widget from supported blocks:

- Container and Row for layout
- Heading and Text for content
- Button and Link for interactions
- Image for remote HTTP(S) images
- Spacer for controlled whitespace

Select a container before adding a block to place the new block inside it. Select a block to edit its text, dimensions, colors, spacing, and action. Use the structure controls to move or delete blocks.

Use **Code** when you need custom behavior. The editor accepts HTML, CSS, and JavaScript. Code mode becomes authoritative for the current draft; switching back to Visual builder restores the last visual layout and discards code-only changes after confirmation.

## 2. Preview and publish

The preview is rendered in the same sandbox used by the published widget. Validation errors appear below the preview, and runtime errors appear inside the preview. Drafts are saved locally while you work.

Click **Publish widget** to add a new custom widget or update the widget being edited. Published source is stored in the existing workspace layout and is included in the existing local/cloud synchronization and JSON export flows.

On desktop, open the widget from the canvas or active-widget list and choose **Edit in builder** or **Open overlay**. The website can preview and sync the widget but cannot create a Windows desktop overlay.

## 3. Protected APIs

Custom code runs in an iframe with `sandbox="allow-scripts"`. It cannot call Tauri commands or access the parent application directly. Protected capabilities prompt the user on first use.

```js
WidgetStudio.request("notifications", {
  title: "Widget Studio",
  body: "Hello from my widget"
});
```

Available capabilities:

- `network`: HTTPS requests only; credentials are omitted.
- `clipboard`: copy text to the system clipboard.
- `notifications`: create a desktop notification after browser approval.
- `openExternal`: open an HTTP(S) URL in the default browser.

Requests can fail when the user denies permission or when a URL does not meet the capability restriction. Handle them as promises:

```js
WidgetStudio.request("openExternal", { url: "https://example.com" })
  .catch((error) => console.error(error));
```

## Troubleshooting

- **JavaScript error:** Check the JavaScript panel for syntax errors. The preview reports the error before publishing.
- **Button does nothing:** Confirm that the button action is not set to “No action” and that the requested capability was approved.
- **Image is blank:** Use an HTTP(S) image URL. JavaScript URLs and unsupported schemes are rejected.
- **Widget disappeared after reload:** Publish the draft; drafts are local recovery data and are not workspace widgets until published.
- **Permission prompt appears again:** Use **Reset permissions** in the widget inspector to intentionally clear the saved decisions.
