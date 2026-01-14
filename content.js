// TanvirIDM Pro - Ultimate Content Script
console.log("[TanvirIDM Pro] Content script loaded");

const MEDIA_SELECTORS = ['video', 'audio', 'img'];

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
        width: '280px',
        maxHeight: '400px',
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
        empty.innerText = "No media streams detected yet. Play the video for a few seconds.";
        empty.style.fontSize = '12px';
        empty.style.color = '#94a3b8';
        empty.style.padding = '8px';
        empty.style.textAlign = 'center';
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
    if (data.quality.includes('1080')) color = '#a78bfa'; // Purple for HD
    if (data.type === 'audio') color = '#f472b6'; // Pink for Audio

    btn.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">${icon}</span>
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:12px; font-weight:600; color:${color};">${data.quality}</span>
                <span style="font-size:10px; color:#94a3b8;">${data.ext} • ${data.sizeStr}</span>
            </div>
        </div>
        <div style="font-size:11px; font-weight:700; background:rgba(255,255,255,0.1); padding:4px 8px; rounded:4px;">⬇</div>
    `;

    Object.assign(btn.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 10px',
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
        
        // Send Download Request
        chrome.runtime.sendMessage({
            type: 'DOWNLOAD_MEDIA',
            url: data.url,
            filename: `tanvir_idm_${data.quality.replace(/ /g,'_')}.${data.ext.toLowerCase()}`
        });

        // Feedback
        btn.style.backgroundColor = '#22c55e';
        btn.innerHTML = `<span style="color:white; font-size:12px; font-weight:bold; margin:auto;">Downloading...</span>`;
        setTimeout(() => document.getElementById('tanvir-idm-menu')?.remove(), 1000);
    };

    return btn;
}

// --- MAIN INJECTION LOGIC ---

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

// Observer for dynamic content
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
