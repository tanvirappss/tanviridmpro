# TanvirIDM Pro - Professional Download Manager Extension

A powerful browser extension that accelerates downloads with smart file segmentation and multi-threaded downloading. Features professional YouTube video download support with quality selection.

## 🚀 Features

- **YouTube Integration**: Native download button in YouTube player controls
- **Quality Selection**: Choose from multiple video/audio quality options
- **Smart Detection**: Automatically detects downloadable media on any website
- **Multi-threaded Downloads**: Accelerate downloads with parallel connections
- **Pro Mode**: Unlock unlimited bandwidth and maximum threads
- **Beautiful UI**: Modern glassmorphism design with dark mode support

## 📦 Installation

### For Development/Testing

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/tanviridmpro.git
   cd tanviridmpro
   ```

2. **Load the extension in your browser**
   
   **Chrome/Edge:**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `tanviridmpro` folder

3. **Test the extension**
   - Navigate to YouTube and play any video
   - Look for the download button in the player controls (bottom left)
   - Click it to see available quality options

## 🎬 YouTube Download Guide

### How to Download YouTube Videos

1. **Navigate to any YouTube video**
2. **Wait for the video to start playing** (this allows the extension to detect available streams)
3. **Look for the download button** in the YouTube player controls (bottom left corner)
4. **Click the download button** to open the quality selection menu
5. **Choose your preferred quality**:
   - Video options (1080p, 720p, 480p, etc.)
   - Audio-only options (M4A, WebM)
   - Note: Some options may be "Video Only" or "Audio Only" due to YouTube's DASH streaming
6. **Click on a quality option** to start the download
7. **Check your browser's download folder** for the file

### Troubleshooting YouTube Downloads

**Problem: Download button doesn't appear**
- Solution: Refresh the page and wait for the video to start playing
- Make sure the extension is enabled in your browser

**Problem: No quality options available**
- Solution: Play the video for 5-10 seconds to allow stream detection
- Pause and resume the video to trigger stream loading

**Problem: Download fails**
- Solution: Some videos may be protected by YouTube's DRM
- Try a different quality option
- Check browser console for error messages

## 🛠️ Building for Production

If you want to build the React UI components:

```bash
npm install
npm run build
```

## 📁 Project Structure

```
tanviridmpro/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (network sniffer)
├── content.js            # Content script (UI injection)
├── App.tsx               # React dashboard UI
├── icons/                # Extension icons
└── components/           # React components
```

## 🔧 Technical Details

### How It Works

1. **Network Sniffer**: The background service worker monitors all network requests and captures video/audio streams
2. **YouTube Detection**: Content script detects YouTube pages and injects a native-looking download button
3. **Quality Detection**: Analyzes YouTube's ITAG parameters to determine video quality
4. **Smart Download**: Sanitizes URLs and initiates downloads through Chrome's download API

### Key Technologies

- **Manifest V3**: Modern Chrome extension architecture
- **React + TypeScript**: For the dashboard UI
- **Chrome APIs**: webRequest, downloads, storage, notifications
- **Network Interception**: Captures media streams in real-time

## 🎨 Features Breakdown

### Content Script (`content.js`)
- YouTube-specific player detection
- Native button injection into YouTube controls
- Hover-based buttons for other video sites
- Quality selection menu with glassmorphism design

### Background Script (`background.js`)
- Advanced network request filtering
- YouTube ITAG quality mapping
- Automatic stream deduplication
- Download management with notifications

## 📝 Development Notes

### Adding New Features

1. **To add support for a new video platform**:
   - Add platform detection in `content.js`
   - Create platform-specific button injection logic
   - Update network filtering in `background.js`

2. **To improve quality detection**:
   - Update the `YT_ITAGS` map in `background.js`
   - Modify `getQualityFromUrl()` function

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

**Tanvir Hossain** - Full Stack Developer from Chittagong
- Facebook: [@imtanveeer](https://www.facebook.com/imtanveeer)

## ⚠️ Disclaimer

This extension is for educational purposes. Please respect copyright laws and YouTube's Terms of Service. Only download content you have the right to download.

## 🐛 Known Issues

- Some YouTube videos with DRM protection cannot be downloaded
- DASH streams may provide video-only or audio-only options (requires merging)
- Live streams are not supported

## 🔮 Future Enhancements

- [ ] Automatic video+audio merging for DASH streams
- [ ] Download queue management
- [ ] Speed limiting options
- [ ] Batch download support
- [ ] Integration with more video platforms
