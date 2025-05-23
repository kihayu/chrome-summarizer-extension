# 📝 Article Summarizer Chrome Extension

A Chrome extension that summarizes articles on device using Gemini Nano.

## ⚠️ Important Note

**The Summarizer API is not yet generally available and requires:**

- Chrome 138 or newer (expected release: Jun 18, 2025)
- Registration to the [Early Preview Program](https://developer.chrome.com/docs/ai/built-in#early-preview)
  - If enrolled in EEP, Summarize API is also available in stable Chrome

This API is currently in preview, which means it may change before the stable release. The Summarizer API has been available for early preview since August 2024.

## ✨ Features

- Built with [Bun](https://bun.sh)
- Written in TypeScript
- Real-time updates with watch mode
- Local summarization using Gemini Nano
- Summarization length selection

## 🔧 Installation

To install dependencies:

```bash
bun install
```

## 👨‍💻 Development

To build the extension once:

```bash
bun run build
```

To watch for changes and build automatically:

```bash
bun run dev
```

This will create a `dist` directory containing the built extension.

## 🔌 Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` directory
4. The extension icon should appear in your browser toolbar

## 📁 Project Structure

- `public/` - Static files like manifest.json, HTML, CSS, and images
- `src/scripts/` - TypeScript source files
- `bundler.ts` - Build script that compiles TypeScript and bundles assets
- `dist/` - Output directory for the built extension

## 🧩 How It Works

1. Detects when you're reading an article
2. Uses Gemini Nano to create a summary locally on your device
3. Displays a summary in the given length
4. Keeps your data private - all processing happens on your machine
