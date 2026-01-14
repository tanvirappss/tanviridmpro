// TanvirIDM Pro - Ultimate Content Script with YouTube Support
console.log("[TanvirIDM Pro] Content script loaded");

const MEDIA_SELECTORS = ['video', 'audio', 'img'];
const DOWNLOADABLE_LINK_EXTS = [
  'mp4', 'mkv', 'webm', 'mov', 'avi',
  'mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg',
  'zip', 'rar', '7z', 'tar', 'gz'
];

// YouTube Detection
const isYouTube = window.location.hostname.includes('youtube.com') || window.location.hostname.includes('youtu.be');
let youtubePlayerReady = false;
let youtubeButtonInjected = false;

function getUrlExtension(url) {
  if (!url) return '';
  try {
    const u = new URL(url, window.location.href);
    const match = u.pathname.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

function isDownloadableLink(el) {
  if (!(el instanceof HTMLAnchorElement)) return false;
  const href = el.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
  const ext = getUrlExtension(href);
  return DOWNLOADABLE_LINK_EXTS.includes(ext) || el.hasAttribute('download');
}

function normalizeExtForFilename(ext, mime, url) {
  let clean = (ext || '').toLowerCase();
  if (clean.includes('/')) clean = '';
  if (clean === 'audio') clean = 'm4a';
  if (clean === 'media') clean = 'mp4';
  if (clean === 'hls') clean = 'm3u8';
  if (!clean && mime) {
    if (mime.includes('mp4')) clean = 'mp4';
    else if (mime.includes('webm')) clean = 'webm';
    else if (mime.includes('audio')) clean = 'm4a';
    else if (mime.includes('zip')) clean = 'zip';
  }
  if (!clean) clean = getUrlExtension(url);
  return clean || 'bin';
}

function safeFilename(name) {
  return (name || '').replace(/[^a-z0-9. \-_]/gi, '_').trim();
}

// Get YouTube video title for better filename
function getYouTubeTitle() {
  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
    document.querySelector('h1.title yt-formatted-string') ||
    document.querySelector('yt-formatted-string.ytd-watch-metadata') ||
    document.querySelector('#title h1');
  return titleElement ? safeFilename(titleElement.textContent.trim()) : 'YouTube_Video';
}

// --- UI GENERATOR FOR MENU ---
function createQualityMenu(x, y, mediaOptions, elementSrc, isImage) {
  // Remove existing menus
  const existing = document.getElementById('tanvir-idm-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'tanvir-idm-menu';

  // Glassmorphism Style
  Object.assign(menu.style, {
    position: 'fixed',
    top: `${y + 10}px`,
    left: `${x}px`,
    zIndex: '2147483647',
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900
    backdropFilter: 'blur(12px)',
    color: 'white',
    borderRadius: '12px',
    padding: '12px',
    width: '320px',
    maxHeight: '500px',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
    fontFamily: "'Inter', system-ui, sans-serif",
    animation: 'tanvirFadeIn 0.2s ease-out'
  });

  // Header
  const header = document.createElement('div');
  header.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-weight:700; font-size:13px; color:#60a5fa;">Select Quality</span>
            <span id="tanvir-close" style="cursor:pointer; opacity:0.6; font-size:18px;">&times;</span>
        </div>
    `;
  menu.appendChild(header);

  // List Container
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '6px';

  // 1. Add the Direct Source (e.g. Image or visible Video src)
  if (elementSrc && !elementSrc.startsWith('blob:')) {
    const item = createMenuItem({
      type: isImage ? 'Image' : 'Source',
      quality: 'Direct Link',
      sizeStr: isImage ? 'Image' : 'Unknown',
      ext: isImage ? 'JPG/PNG' : 'MP4',
      url: elementSrc
    }, true);
    list.appendChild(item);
  }

  // 2. Add Sniffed Options from Background
  if (mediaOptions && mediaOptions.length > 0) {
    mediaOptions.forEach(opt => {
      list.appendChild(createMenuItem(opt, false));
    });
  } else if (!elementSrc || elementSrc.startsWith('blob:')) {
    const empty = document.createElement('div');
    empty.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <div style="font-size:32px; margin-bottom:10px;">🎬</div>
                <div style="font-size:12px; color:#94a3b8; line-height:1.5;">
                    ${isYouTube ? 'Play the video for a few seconds to detect streams...' : 'No media streams detected yet.'}
                </div>
            </div>
        `;
    list.appendChild(empty);
  }

  menu.appendChild(list);
  document.body.appendChild(menu);

  // Close logic
  document.getElementById('tanvir-close').onclick = () => menu.remove();

  // Click outside to close
  setTimeout(() => {
    window.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        window.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  // Animation Style
  const style = document.createElement('style');
  style.innerHTML = `@keyframes tanvirFadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`;
  menu.appendChild(style);
}

function createMenuItem(data, isPrimary) {
  const btn = document.createElement('div');

  // Icon based on type
  let icon = '📄';
  if (data.type === 'video' || data.type === 'Source') icon = '🎬';
  if (data.type === 'audio') icon = '🎵';
  if (data.type === 'Image') icon = '🖼️';

  // Color code
  let color = '#e2e8f0';
  if (data.quality.includes('1080') || data.quality.includes('4K')) color = '#a78bfa'; // Purple for HD
  if (data.quality.includes('720')) color = '#60a5fa'; // Blue for 720p
  if (data.type === 'audio') color = '#f472b6'; // Pink for Audio

  btn.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">${icon}</span>
            <div style="display:flex; flex-direction:column; flex:1;">
                <span style="font-size:12px; font-weight:600; color:${color};">${data.quality}</span>
                <span style="font-size:10px; color:#94a3b8;">${data.ext} • ${data.sizeStr}</span>
            </div>
        </div>
        <div style="font-size:11px; font-weight:700; background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px;">⬇</div>
    `;

  Object.assign(btn.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: isPrimary ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)',
    border: isPrimary ? '1px solid rgba(37, 99, 235, 0.5)' : '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  });

  btn.onmouseenter = () => btn.style.backgroundColor = 'rgba(255,255,255,0.1)';
  btn.onmouseleave = () => btn.style.backgroundColor = isPrimary ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)';

  btn.onclick = (e) => {
    e.stopPropagation();

    // Determine filename
    let filename = `tanvir_idm_${data.quality.replace(/ /g, '_')}.${data.ext.toLowerCase()}`;
    if (isYouTube) {
      const title = getYouTubeTitle();
      filename = `${title}_${data.quality.replace(/ /g, '_')}.${data.ext.toLowerCase()}`;
    }

    // Send Download Request
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_MEDIA',
      url: data.url,
      filename: filename
    });

    // Feedback
    btn.style.backgroundColor = '#22c55e';
    btn.innerHTML = `<span style="color:white; font-size:12px; font-weight:bold; margin:auto;">✓ Downloading...</span>`;
    setTimeout(() => document.getElementById('tanvir-idm-menu')?.remove(), 1000);
  };

  return btn;
}

// --- YOUTUBE-SPECIFIC BUTTON INJECTION ---
function injectYouTubeDownloadButton() {
  if (youtubeButtonInjected) return;

  // Wait for YouTube player controls to be ready
  const controlsContainer = document.querySelector('.ytp-right-controls') ||
    document.querySelector('.ytp-chrome-controls');

  if (!controlsContainer) {
    // Retry after a delay
    setTimeout(injectYouTubeDownloadButton, 500);
    return;
  }

  youtubeButtonInjected = true;
  console.log('[TanvirIDM Pro] Injecting YouTube download button');

  const button = document.createElement('button');
  button.className = 'ytp-button tanvir-yt-download-btn';
  button.setAttribute('aria-label', 'Download with TanvirIDM Pro');
  button.title = 'Download with TanvirIDM Pro';

  button.innerHTML = `
        <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" style="fill: white;">
            <path d="M17 17V3h2v14h3l-4 4-4-4h3z"></path>
            <path d="M28 24v4H8v-4H6v4c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2v-4h-2z"></path>
        </svg>
    `;

  Object.assign(button.style, {
    width: '48px',
    height: '48px',
    padding: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    opacity: '0.9',
    transition: 'opacity 0.2s'
  });

  button.onmouseenter = () => button.style.opacity = '1';
  button.onmouseleave = () => button.style.opacity = '0.9';

  button.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get video element source
    const videoElement = document.querySelector('video.html5-main-video');
    let src = videoElement ? (videoElement.currentSrc || videoElement.src) : '';

    // Fetch Network Options from Background
    chrome.runtime.sendMessage({ type: 'GET_MEDIA_OPTIONS' }, (response) => {
      const rect = button.getBoundingClientRect();
      createQualityMenu(
        rect.left - 250, // Position to the left of the button
        rect.bottom,
        response?.media || [],
        src,
        false
      );
    });
  };

  // Insert at the beginning of controls (before other buttons)
  controlsContainer.insertBefore(button, controlsContainer.firstChild);
}

// --- MAIN INJECTION LOGIC FOR NON-YOUTUBE SITES ---
function injectDownloadButton(element) {
  if (element.getAttribute('data-smartidm-injected')) return;

  // Filter small images
  if (element.tagName.toLowerCase() === 'img') {
    const img = element;
    if ((img.naturalWidth > 0 && img.naturalWidth < 200) || (img.clientWidth > 0 && img.clientWidth < 200)) return;
  }

  element.setAttribute('data-smartidm-injected', 'true');

  const button = document.createElement('div');
  button.className = 'tanvir-idm-btn';
  button.innerHTML = `
    <div style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span style="font-size:11px; font-weight:800; font-family:sans-serif;">Download with TanvirIDMPro</span>
    </div>
  `;

  // Base Style
  Object.assign(button.style, {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: '2147483640',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    opacity: '0',
    transform: 'scale(0.9)',
    transition: 'all 0.2s',
    fontFamily: 'sans-serif'
  });

  // Visibility Logic
  const container = element.parentElement || document.body;
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  container.addEventListener('mouseenter', () => { button.style.opacity = '1'; button.style.transform = 'scale(1)'; });
  container.addEventListener('mouseleave', () => { button.style.opacity = '0'; button.style.transform = 'scale(0.9)'; });

  // Click Handler - OPEN MENU
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Get Element Source (if any)
    let src = '';
    if (element instanceof HTMLMediaElement || element instanceof HTMLImageElement) {
      src = element.currentSrc || element.src;
    }

    // 2. Fetch Network Options from Background
    chrome.runtime.sendMessage({ type: 'GET_MEDIA_OPTIONS' }, (response) => {
      const rect = button.getBoundingClientRect();
      createQualityMenu(
        rect.left,
        rect.bottom,
        response?.media || [],
        src,
        element.tagName.toLowerCase() === 'img'
      );
    });
  });

  container.appendChild(button);
}

// --- INITIALIZATION ---
if (isYouTube) {
  console.log('[TanvirIDM Pro] YouTube detected - using specialized injection');

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(injectYouTubeDownloadButton, 1000);
    });
  } else {
    setTimeout(injectYouTubeDownloadButton, 1000);
  }

  // Re-inject on navigation (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      youtubeButtonInjected = false;
      setTimeout(injectYouTubeDownloadButton, 1500);
    }
  }).observe(document.body, { subtree: true, childList: true });

} else {
  // Standard observer for non-YouTube sites
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n instanceof HTMLElement) {
          if (n.matches && MEDIA_SELECTORS.some(s => n.matches(s))) injectDownloadButton(n);
          n.querySelectorAll(MEDIA_SELECTORS.join(',')).forEach(injectDownloadButton);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll(MEDIA_SELECTORS.join(',')).forEach(injectDownloadButton);
}
