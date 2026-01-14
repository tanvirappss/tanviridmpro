// Popup script for TanvirIDM Pro extension

document.addEventListener('DOMContentLoaded', function () {
    loadDownloads();

    // Listen for download updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'DOWNLOAD_UPDATE') {
            loadDownloads();
        }
    });
});

function loadDownloads() {
    chrome.storage.local.get(['downloads'], function (result) {
        const downloads = result.downloads || [];
        displayDownloads(downloads);
    });
}

function displayDownloads(downloads) {
    const container = document.getElementById('downloadsList');

    if (downloads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
                <p>No active downloads</p>
                <p style="font-size: 10px; margin-top: 8px;">Click on any downloadable link to start</p>
            </div>
        `;
        return;
    }

    container.innerHTML = downloads.map(download => `
        <div class="download-item">
            <div class="download-name">${download.filename || 'Unknown file'}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${download.progress || 0}%"></div>
            </div>
            <div class="download-info">
                <span>${formatBytes(download.downloaded || 0)} / ${formatBytes(download.size || 0)}</span>
                <span>${download.status || 'Downloading'}</span>
            </div>
        </div>
    `).join('');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
