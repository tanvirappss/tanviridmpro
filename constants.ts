import { DownloadItem, DownloadStatus, AppSettings } from './types';

export const MOCK_DOWNLOADS: DownloadItem[] = [
  {
    id: '1',
    filename: 'ubuntu-22.04.3-desktop-amd64.iso',
    url: 'https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso',
    size: 4928307200,
    downloaded: 2464153600,
    speed: 15728640, // 15 MB/s
    progress: 50,
    status: DownloadStatus.Downloading,
    dateAdded: Date.now(),
    type: 'archive',
    eta: 156,
    threads: 16
  },
  {
    id: '2',
    filename: 'big_buck_bunny_4k.mp4',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    size: 884650000,
    downloaded: 884650000,
    speed: 0,
    progress: 100,
    status: DownloadStatus.Completed,
    dateAdded: Date.now() - 3600000,
    type: 'video',
    eta: 0,
    threads: 8
  },
  {
    id: '3',
    filename: 'React_Documentation.pdf',
    url: 'https://react.dev/docs.pdf',
    size: 15400000,
    downloaded: 15400000,
    speed: 0,
    progress: 100,
    status: DownloadStatus.Completed,
    dateAdded: Date.now() - 7200000,
    type: 'document',
    eta: 0,
    threads: 4
  },
  {
    id: '4',
    filename: 'Game_Installer_v2.exe',
    url: 'https://game-store.com/installer.exe',
    size: 52428800,
    downloaded: 1048576,
    speed: 51200,
    progress: 2,
    status: DownloadStatus.Paused,
    dateAdded: Date.now() - 10000,
    type: 'other',
    eta: 999,
    threads: 8
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  maxConcurrentDownloads: 10, // Increased for Pro
  maxThreadsPerDownload: 16, // Increased default threads for Pro experience
  autoCapture: true,
  downloadPath: '~/Downloads/TanvirIDM',
  fileTypeFilters: ['mp4', 'mkv', 'mp3', 'zip', 'iso', 'pdf', 'exe', 'msi'],
  proMode: true // Enabled by default
};