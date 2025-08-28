# Auto-Note

Auto-Note is a Chrome extension that automatically extracts captions from D2L lecture videos and uses AI to generate concise summaries for quick review.

## What It Does

- 🎥 **Automatically detects** video captions on D2L pages
- 📝 **Extracts transcript** with timestamps
- 🤖 **AI-powered summarization** using OpenAI GPT
- 📚 **Structured output** with key points and takeaways
- ⌨️ **Quick access** via Shift+S hotkey

## Features

- **Caption Detection**: Finds and extracts video captions automatically
- **AI Summarization**: Generates concise summaries using OpenAI API
- **Structured Output**: Organizes content into summary, topics, and applications
- **Keyboard Shortcut**: Press Shift+S to open/close the panel
- **Resizable Panel**: Adjust panel width to fit your screen
- **Local Storage**: Saves your API key for convenience

## Installation

### 1. Download Files
- Clone or download this repository
- Ensure you have `manifest.json` and `content.js`

### 2. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the folder containing your extension files
5. The extension should appear in your extensions list

## Setup

### 1. Get OpenAI API Key
- Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Enter API Key
- Click the extension icon or press Shift+S
- Enter your OpenAI API key in the input field
- The key will be saved locally for future use

## How to Use

### Basic Usage
1. **Navigate** to a D2L page with video content
2. **Enable captions** on the video player (CC button)
3. **Press Shift+S** or click the extension icon
4. **Click "Summarize"** to generate AI summary
5. **Review** the generated summary, key topics, and applications

## Supported Platforms

- **D2L (Desire2Learn)** lecture pages
- Any HTML5 video with caption tracks
- Chrome browser (desktop)

## Troubleshooting

### "No captions found"
- Ensure video has captions enabled
- Check that captions are available for the video
- Refresh the page and try again

### API Key Issues
- Verify your API key starts with `sk-`
- Check that you have sufficient OpenAI credits
- Ensure the key is entered correctly

### Panel Not Opening
- Try pressing Shift+S
- Check if the extension is enabled
- Reload the page if needed

---

**Happy learning!** 📚✨ 


