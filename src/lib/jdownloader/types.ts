/**
 * JDownloader API Types
 * Based on MyJDownloader API documentation
 */

// Connection types
export interface JDDevice {
  id: string;
  name: string;
  type: string;
}

export interface JDSession {
  sessionToken: string;
  regainToken: string;
  serverEncryptionToken: Buffer;
  deviceEncryptionToken: Buffer;
}

// Link Grabber types
export interface AddLinksQuery {
  assignJobID?: boolean;
  autoExtract?: boolean;
  autostart?: boolean;
  dataURLs?: string[];
  deepDecrypt?: boolean;
  destinationFolder?: string;
  downloadPassword?: string;
  extractPassword?: string;
  links: string;
  overwritePackagizerRules?: boolean;
  packageName?: string;
  priority?: Priority;
  sourceUrl?: string;
}

export interface LinkCollectingJob {
  id: number;
}

export interface CrawledLinkQuery {
  availability?: boolean;
  bytesTotal?: boolean;
  comment?: boolean;
  enabled?: boolean;
  host?: boolean;
  jobUUIDs?: number[];
  maxResults?: number;
  packageUUIDs?: number[];
  password?: boolean;
  priority?: boolean;
  startAt?: number;
  status?: boolean;
  url?: boolean;
  variantID?: boolean;
  variantIcon?: boolean;
  variantName?: boolean;
  variants?: boolean;
}

export interface CrawledLink {
  availability: AvailableLinkState;
  bytesTotal: number;
  comment?: string;
  downloadPassword?: string;
  enabled: boolean;
  host: string;
  name: string;
  packageUUID: number;
  priority: Priority;
  url: string;
  uuid: number;
  variant?: LinkVariant;
  variants?: boolean;
}

export interface CrawledPackageQuery {
  availableOfflineCount?: boolean;
  availableOnlineCount?: boolean;
  availableTempUnknownCount?: boolean;
  availableUnknownCount?: boolean;
  bytesTotal?: boolean;
  childCount?: boolean;
  comment?: boolean;
  enabled?: boolean;
  hosts?: boolean;
  maxResults?: number;
  packageUUIDs?: number[];
  priority?: boolean;
  saveTo?: boolean;
  startAt?: number;
  status?: boolean;
}

export interface CrawledPackage {
  bytesTotal: number;
  childCount: number;
  comment?: string;
  downloadPassword?: string;
  enabled: boolean;
  hosts: string[];
  name: string;
  offlineCount: number;
  onlineCount: number;
  priority: Priority;
  saveTo: string;
  tempUnknownCount: number;
  unknownCount: number;
  uuid: number;
}

// Download types
export interface LinkQuery {
  addedDate?: boolean;
  bytesLoaded?: boolean;
  bytesTotal?: boolean;
  comment?: boolean;
  enabled?: boolean;
  eta?: boolean;
  extractionStatus?: boolean;
  finished?: boolean;
  finishedDate?: boolean;
  host?: boolean;
  jobUUIDs?: number[];
  maxResults?: number;
  packageUUIDs?: number[];
  password?: boolean;
  priority?: boolean;
  running?: boolean;
  skipped?: boolean;
  speed?: boolean;
  startAt?: number;
  status?: boolean;
  url?: boolean;
}

export interface DownloadLink {
  addedDate?: number;
  bytesLoaded: number;
  bytesTotal: number;
  comment?: string;
  downloadPassword?: string;
  enabled: boolean;
  eta?: number;
  extractionStatus?: string;
  finished: boolean;
  finishedDate?: number;
  host: string;
  name: string;
  packageUUID: number;
  priority: Priority;
  running: boolean;
  skipped: boolean;
  speed?: number;
  status?: string;
  statusIconKey?: string;
  url?: string;
  uuid: number;
}

export interface PackageQuery {
  bytesLoaded?: boolean;
  bytesTotal?: boolean;
  childCount?: boolean;
  comment?: boolean;
  enabled?: boolean;
  eta?: boolean;
  finished?: boolean;
  hosts?: boolean;
  maxResults?: number;
  packageUUIDs?: number[];
  priority?: boolean;
  running?: boolean;
  saveTo?: boolean;
  speed?: boolean;
  startAt?: number;
  status?: boolean;
}

export interface FilePackage {
  activeTask?: string;
  bytesLoaded: number;
  bytesTotal: number;
  childCount: number;
  comment?: string;
  downloadPassword?: string;
  enabled: boolean;
  eta?: number;
  finished: boolean;
  hosts: string[];
  name: string;
  priority: Priority;
  running: boolean;
  saveTo: string;
  speed?: number;
  status?: string;
  statusIconKey?: string;
  uuid: number;
}

// Link variants (for YouTube quality selection)
export interface LinkVariant {
  iconKey: string;
  id: string;
  name: string;
}

// Enums
export type AvailableLinkState = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'TEMP_UNKNOWN';

export type Priority = 'HIGHEST' | 'HIGHER' | 'HIGH' | 'DEFAULT' | 'LOW' | 'LOWER' | 'LOWEST';

export type DownloadControllerState = 
  | 'IDLE'
  | 'RUNNING'
  | 'PAUSE'
  | 'STOPPING'
  | 'STOPPING_DOWNLOADS';

// API Response types
export interface JDApiError {
  src: 'MYJD' | 'DEVICE';
  type: string;
  data?: unknown;
}

// Event subscription types
export interface SubscriptionResponse {
  exclusions: string[];
  maxKeepalive: number;
  maxPolltimeout: number;
  subscribed: boolean;
  subscriptionid: number;
  subscriptions: string[];
}

