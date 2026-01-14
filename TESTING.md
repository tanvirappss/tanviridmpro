# 🧪 Quick Testing Guide

## Load the Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select this folder: `c:\Users\admin\Documents\GitHub\tanviridmpro`
5. The extension should now appear in your extensions list

## Test on YouTube

### Step 1: Navigate to YouTube
- Go to https://youtube.com
- Open any video (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)

### Step 2: Verify Button Appears
- Look at the **bottom left** of the video player controls
- You should see a **download button** (download icon) next to the play button
- The button should look native to YouTube's interface

### Step 3: Detect Quality Options
- **Play the video** for 5-10 seconds (this allows stream detection)
- Click the **download button**
- A quality menu should appear with options like:
  - 1080p Video
  - 720p Video
  - 480p Video
  - Audio options

### Step 4: Download a Video
- Click on any quality option
- The button should show "✓ Downloading..."
- A browser notification should appear
- Check your Downloads folder for the file
- Filename should include the video title

## Troubleshooting

### Button doesn't appear?
- Refresh the page (F5)
- Make sure the extension is enabled
- Check browser console for errors (F12 → Console tab)

### No quality options?
- Play the video for longer (10-15 seconds)
- Pause and resume the video
- Try a different video

### Download fails?
- Some videos may be DRM-protected
- Try a different quality option
- Check if the video is age-restricted or private

## Test on Other Sites

The extension also works on other video sites:

1. Visit any site with a video (e.g., Vimeo, Dailymotion)
2. Hover over the video
3. A download button should appear in the top-left corner
4. Click it to see available options

## Success Criteria

✅ Download button appears on YouTube player
✅ Quality menu shows multiple options
✅ Downloads start successfully
✅ Filenames include video title
✅ Browser notifications work
✅ Works on other video sites too
