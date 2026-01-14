// TanvirIDM Pro - The Brain (Service Worker)

// Store ALL detected media for each tab.
// Structure: { tabId: Map<url, MediaInfo> }
const tabMediaCollections = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "download-with-smartidm",
        title: "Download with TanvirIDM Pro",
        contexts: ["link", "image", "video", "audio"]
    });
});

// Helper: Format bytes to MB/KB
function formatSize(bytes) {
    if (!bytes || isNaN(bytes) || bytes === 0) return 'Stream';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Helper: Detailed YouTube ITAG Map
const YT_ITAGS = {
    // Video + Audio (Standard)
    '18': '360p (MP4)',
    '22': '720p (MP4)',
    '37': '1080p (MP4)',
    '38': '4K (MP4)',
    '43': '360p (WebM)',

    // Video Only (DASH - High Quality)
    '137': '1080p Video (No Audio)',
    '248': '1080p Video (No Audio)',
    '299': '1080p60 Video (No Audio)',
    '136': '720p Video (No Audio)',
    '247': '720p Video (No Audio)',
    '298': '720p60 Video (No Audio)',
    '135': '480p Video (No Audio)',
    '134': '360p Video (No Audio)',
    '133': '240p Video (No Audio)',
    '160': '144p Video (No Audio)',
    '278': '144p (WebM)',
    '313': '4K Video (2160p)',
    '271': '1440p Video',

    // Audio Only
    '140': 'Audio (M4A - 128k)',
    '141': 'Audio (M4A - 256k)',
    '251': 'Audio (WebM - High)',
    '250': 'Audio (WebM - Med)',
    '249': 'Audio (WebM - Low)'
};

function getQualityFromUrl(url, type) {
    try {
        const u = new URL(url);

        // 1. YouTube Logic
        if (url.includes('googlevideo.com') || u.searchParams.has('itag')) {
            const itag = u.searchParams.get('itag');
            if (YT_ITAGS[itag]) return YT_ITAGS[itag];

            // Fallback if ITAG not found in map but exists
            if (itag) return `YouTube Stream (Tag ${itag})`;
        }

        // 2. Generic Logic
        if (type.includes('audio')) return 'Audio Stream';
        if (url.includes('1080')) return '1080p HD';
        if (url.includes('720')) return '720p HD';
        if (url.includes('480')) return '480p SD';
        if (url.includes('360')) return '360p SD';

        return 'Standard Quality';
    } catch (e) { return 'Unknown Quality'; }
}

// 1. ADVANCED NETWORK SNIFFER (COLLECTOR MODE)
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.tabId === -1) return;

        const headers = details.responseHeaders;
        const contentType = headers.find(h => h.name.toLowerCase() === 'content-type')?.value.toLowerCase() || '';
        const contentLength = headers.find(h => h.name.toLowerCase() === 'content-length')?.value || 0;
        const size = parseInt(contentLength);
        const url = details.url;

        // --- DETECTION LOGIC ---

        // 1. Is it YouTube? (Treat specially)
        const isYouTube = url.includes('googlevideo.com');

        // 2. Generic Checks
        const isVideo = contentType.includes('video/') || url.match(/\.(mp4|mkv|webm|flv|mov|avi)($|\?)/i);
        const isAudio = contentType.includes('audio/') || url.match(/\.(mp3|wav|aac|m4a)($|\?)/i);
        const isStream = contentType.includes('mpegurl') || url.includes('.m3u8') || url.includes('.mpd');

        // --- FILTER LOGIC ---
        // If YouTube: Accept EVERYTHING that looks like media, ignore size (chunks are small).
        // If Other: Enforce size limit to avoid tracking pixels/icons.
        let isValid = false;

        if (isYouTube) {
            // YouTube usually has 'mime=video/...' in query params or content-type
            if (url.includes('mime=video') || url.includes('mime=audio') || isVideo || isAudio) {
                isValid = true;
            }
        } else {
            // Standard Site Rules
            if (isStream) isValid = true;
            else if (isVideo && size > 100 * 1024) isValid = true; // > 100KB
            else if (isAudio && size > 50 * 1024) isValid = true;  // > 50KB
        }

        if (isValid) {
            if (!tabMediaCollections[details.tabId]) {
                tabMediaCollections[details.tabId] = new Map();
            }

            const qualityLabel = getQualityFromUrl(url, isYouTube ? (url.includes('mime=audio') ? 'audio' : 'video') : contentType);

            // Determine pretty extension
            let ext = 'MEDIA';
            if (isYouTube) {
                if (url.includes('mime=video/mp4')) ext = 'MP4';
                else if (url.includes('mime=video/webm')) ext = 'WEBM';
                else if (url.includes('mime=audio/mp4')) ext = 'M4A';
                else if (url.includes('mime=audio/webm')) ext = 'WEBM';
                else if (url.includes('mime=audio')) ext = 'AUDIO';
            } else {
                if (contentType.includes('mp4')) ext = 'MP4';
                else if (contentType.includes('webm')) ext = 'WEBM';
                else if (contentType.includes('mpegurl')) ext = 'HLS';
                else if (contentType.includes('audio')) ext = 'MP3';
            }

            const item = {
                url: url,
                type: (qualityLabel.includes('Audio') || isAudio) ? 'audio' : 'video',
                mime: contentType,
                size: size,
                sizeStr: formatSize(size),
                ext: ext,
                quality: qualityLabel,
                timestamp: Date.now()
            };

            // Use Quality+Type as key to avoid duplicates of the same stream chunk
            // For YouTube, we want to keep the latest URL for each quality level
            const key = isYouTube ? qualityLabel : url;

            tabMediaCollections[details.tabId].set(key, item);

            console.log(`[TanvirIDM] Captured: ${qualityLabel} (${ext}) - Size: ${formatSize(size)}`);
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

// 2. MESSAGE HANDLER
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_MEDIA_OPTIONS') {
        const tabId = sender.tab ? sender.tab.id : -1;
        const collection = tabMediaCollections[tabId];

        let mediaList = [];
        if (collection) {
            // Convert Map values to array
            mediaList = Array.from(collection.values());

            // Sort: Video > Audio, then by quality (higher first)
            mediaList.sort((a, b) => {
                // Videos before audio
                if (a.type !== b.type) return a.type === 'video' ? -1 : 1;

                // Extract resolution numbers for proper sorting
                const getResolution = (quality) => {
                    const match = quality.match(/(\d+)p/);
                    return match ? parseInt(match[1]) : 0;
                };

                const resA = getResolution(a.quality);
                const resB = getResolution(b.quality);

                if (resA !== resB) return resB - resA; // Higher resolution first

                // If same resolution, sort by quality label alphabetically
                return a.quality.localeCompare(b.quality);
            });
        }

        console.log(`[TanvirIDM] Sending ${mediaList.length} media options to content script`);
        sendResponse({ media: mediaList });
    }

    else if (message.type === 'DOWNLOAD_MEDIA') {
        // Sanitize YouTube URLs (remove range param to download full file)
        let dlUrl = message.url;
        if (dlUrl.includes('googlevideo.com')) {
            try {
                const u = new URL(dlUrl);
                // Remove range parameters that limit download to chunks
                u.searchParams.delete('range');
                u.searchParams.delete('rn');
                u.searchParams.delete('rbuf');
                dlUrl = u.toString();
            } catch (e) {
                console.error('[TanvirIDM] Error sanitizing URL:', e);
            }
        }

        console.log(`[TanvirIDM] Starting download: ${message.filename}`);
        startDownload(dlUrl, message.filename);
    }
    return true;
});

// 3. DOWNLOADER
function startDownload(url, forcedFilename) {
    if (!url) {
        console.error('[TanvirIDM] No URL provided for download');
        return;
    }

    // Basic filename fallback
    let filename = forcedFilename;
    if (!filename) {
        filename = `tanvir_idm_${Date.now()}.mp4`;
    }
    filename = filename.replace(/[^a-z0-9. \-_]/gi, '_');

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false,
        conflictAction: 'uniquify'
    }, (id) => {
        if (chrome.runtime.lastError) {
            console.error('[TanvirIDM] Download failed:', chrome.runtime.lastError);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'TanvirIDM Pro - Download Failed',
                message: 'Browser blocked the download. This may be due to CORS restrictions or the file format.'
            });
        } else {
            console.log(`[TanvirIDM] Download started successfully with ID: ${id}`);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'TanvirIDM Pro - Download Started',
                message: `Downloading: ${filename}`
            });
        }
    });
}

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabMediaCollections[tabId]) {
        console.log(`[TanvirIDM] Cleaning up media collection for closed tab ${tabId}`);
        delete tabMediaCollections[tabId];
    }
});

// Clean up old entries periodically (older than 10 minutes)
setInterval(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    Object.keys(tabMediaCollections).forEach(tabId => {
        const collection = tabMediaCollections[tabId];
        if (collection) {
            collection.forEach((item, key) => {
                if (now - item.timestamp > maxAge) {
                    collection.delete(key);
                }
            });
        }
    });
}, 60000); // Run every minute