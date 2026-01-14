export enum DownloadStatus {
  Downloading = 'Downloading',
  Paused = 'Paused',
  Completed = 'Completed',
  Error = 'Error',
  Queued = 'Queued'
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  size: number; // in bytes
  downloaded: number; // in bytes
  speed: number; // bytes per second
  progress: number; // 0-100
  status: DownloadStatus;
  dateAdded: number;
  type: 'video' | 'audio' | 'document' | 'image' | 'archive' | 'other';
  eta: number; // seconds remaining
  threads: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  maxConcurrentDownloads: number;
  maxThreadsPerDownload: number;
  autoCapture: boolean;
  downloadPath: string;
  fileTypeFilters: string[];
  proMode: boolean;
}

export enum ViewMode {
  Dashboard = 'Dashboard',
  Popup = 'Popup' // Simulates the extension popup view
}