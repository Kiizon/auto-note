# Auto-Note Chrome Extension

A Chrome extension that automatically extracts captions/subtitles from D2L and formats them for easy reading and note-taking.

**Note:** this project was made for personal purposes of learning how to create chrome extensions as well
help learners summarize their lecture for quick reviews.

## Features

- **Automatic Caption Detection**: Finds video caption tracks on TMU's d2l page
- **Caption Parsing**: Converts VTT captions to readable timestamped text
- **Easy Installation**: Simple setup process for Chrome users

## Installation Tutorial

### Step 1: Download the Extension Files

1. Clone or download this repository to your computer
2. Make sure you have these files in a folder:
   - `manifest.json`
   - `content.js`

### Step 2: Load the Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** by toggling the switch in the top-right corner
3. **Click "Load unpacked"** button
4. **Select the folder** containing your extension files (`manifest.json` and `content.js`)
5. **Click "Select Folder"**

✅ **Success!** You should see "Auto-Note" appear in your extensions list.

### Step 3: Verify Installation

- Look for the extension icon in your Chrome toolbar
- If you don't see it, click the puzzle piece icon and pin "Auto-Note"

## How to Use

### Basic Usage

1. **Navigate to lecture webpage** with a video that has captions/subtitles
2. **Make sure captions are enabled** on the video player
3. **Shift + s to open summarizer panel** or click on the auto-note extension icon to open the panel
4. **Press summarize!**  


### "No <track> found" Error in Console
- Make sure the video has captions/subtitles enabled
- Some videos may not have caption tracks available
- Try refreshing the page and enabling captions again

### Extension Not Working
- Check that the extension is enabled in `chrome://extensions/`
- Ensure you're on a page with HTML5 video
- Try disabling and re-enabling the extension

### Console Shows Nothing
- Make sure you're looking at the Console tab in DevTools
- Check that the page has video content with captions
- Try navigating to a different video page

**Happy learning!** 


