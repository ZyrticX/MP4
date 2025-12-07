/**
 * MyJDownloader API Client
 * 
 * Handles authentication and communication with JDownloader through MyJDownloader cloud API
 */

import {
  createLoginSecret,
  createDeviceSecret,
  updateEncryptionToken,
  encrypt,
  decrypt,
  createSignature,
  generateRequestId
} from './crypto.js';

import type {
  JDDevice,
  JDSession,
  AddLinksQuery,
  LinkCollectingJob,
  CrawledLinkQuery,
  CrawledLink,
  CrawledPackageQuery,
  CrawledPackage,
  LinkQuery,
  DownloadLink,
  PackageQuery,
  FilePackage,
  LinkVariant,
  DownloadControllerState,
  JDApiError
} from './types.js';

const API_ENDPOINT = 'https://api.jdownloader.org';

export class JDownloaderClient {
  private email: string;
  private password: string;
  private session: JDSession | null = null;
  private currentDevice: JDDevice | null = null;
  
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  /**
   * Connect to MyJDownloader and authenticate
   */
  async connect(): Promise<void> {
    const loginSecret = createLoginSecret(this.email, this.password);
    const deviceSecret = createDeviceSecret(this.email, this.password);
    
    const rid = generateRequestId();
    const query = `/my/connect?email=${encodeURIComponent(this.email.toLowerCase())}&appkey=myjdapi&rid=${rid}`;
    const signature = createSignature(query, loginSecret);
    
    const response = await fetch(`${API_ENDPOINT}${query}&signature=${signature}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('MyJDownloader API error:', errorText);
      throw new Error(`Connection failed: HTTP ${response.status}`);
    }
    
    const responseText = await response.text();
    
    let data: { sessiontoken: string; regaintoken: string };
    try {
      // First try to parse as plain JSON
      data = JSON.parse(responseText);
    } catch {
      // Response is encrypted - decrypt it
      try {
        console.log('Attempting to decrypt response...');
        const decrypted = decrypt(responseText, loginSecret);
        console.log('Decrypted response:', decrypted.substring(0, 100));
        
        if (!decrypted || decrypted.length === 0) {
          throw new Error('Decryption returned empty string');
        }
        
        data = JSON.parse(decrypted);
        console.log('Successfully parsed decrypted response');
      } catch (decryptError) {
        console.error('Decryption failed:', decryptError);
        console.error('Encrypted response:', responseText.substring(0, 200));
        console.error('Login secret (hex):', loginSecret.toString('hex').substring(0, 32) + '...');
        throw new Error(`Decryption failed: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
      }
    }
    
    // Update encryption tokens with server response
    console.log('connect - sessiontoken from server:', data.sessiontoken);
    console.log('connect - loginSecret (hex):', loginSecret.toString('hex'));
    
    const serverEncryptionToken = updateEncryptionToken(loginSecret, data.sessiontoken);
    const deviceEncryptionToken = updateEncryptionToken(deviceSecret, data.sessiontoken);
    
    console.log('connect - serverEncryptionToken (hex):', serverEncryptionToken.toString('hex'));
    console.log('connect - deviceEncryptionToken (hex):', deviceEncryptionToken.toString('hex'));
    
    this.session = {
      sessionToken: data.sessiontoken,
      regainToken: data.regaintoken,
      serverEncryptionToken,
      deviceEncryptionToken
    };
    
    console.log('✅ Session established successfully');
  }

  /**
   * Disconnect from MyJDownloader
   */
  async disconnect(): Promise<void> {
    if (!this.session) return;
    
    await this.callServer('/my/disconnect');
    this.session = null;
    this.currentDevice = null;
  }

  /**
   * List all connected JDownloader devices
   */
  async listDevices(): Promise<JDDevice[]> {
    const response = await this.callServer('/my/listdevices');
    return response.list || [];
  }

  /**
   * Select a device to communicate with
   */
  async selectDevice(deviceName?: string): Promise<JDDevice> {
    const devices = await this.listDevices();
    
    if (devices.length === 0) {
      throw new Error('No JDownloader devices found. Make sure JDownloader is running and connected to MyJDownloader.');
    }
    
    if (deviceName) {
      const device = devices.find(d => d.name === deviceName);
      if (!device) {
        throw new Error(`Device "${deviceName}" not found. Available devices: ${devices.map(d => d.name).join(', ')}`);
      }
      this.currentDevice = device;
    } else {
      // Select first available device
      this.currentDevice = devices[0];
    }
    
    return this.currentDevice;
  }

  /**
   * Add links to LinkGrabber
   */
  async addLinks(query: AddLinksQuery): Promise<LinkCollectingJob> {
    return this.callDevice('/linkgrabberv2/addLinks', [query]);
  }

  /**
   * Check if LinkGrabber is still crawling/analyzing links
   */
  async isCollecting(): Promise<boolean> {
    return this.callDevice('/linkgrabberv2/isCollecting');
  }

  /**
   * Abort link collection
   */
  async abortLinkCollection(jobId?: number): Promise<boolean> {
    if (jobId !== undefined) {
      return this.callDevice('/linkgrabberv2/abort', [jobId]);
    }
    return this.callDevice('/linkgrabberv2/abort');
  }

  /**
   * Query crawled links in LinkGrabber
   */
  async queryCrawledLinks(query?: CrawledLinkQuery): Promise<CrawledLink[]> {
    return this.callDevice('/linkgrabberv2/queryLinks', [query || {}]);
  }

  /**
   * Query crawled packages in LinkGrabber
   */
  async queryCrawledPackages(query?: CrawledPackageQuery): Promise<CrawledPackage[]> {
    return this.callDevice('/linkgrabberv2/queryPackages', [query || {}]);
  }

  /**
   * Get available variants (quality options) for a link
   */
  async getVariants(linkId: number): Promise<LinkVariant[]> {
    return this.callDevice('/linkgrabberv2/getVariants', [linkId]);
  }

  /**
   * Set variant (quality) for a link
   */
  async setVariant(linkId: number, variantId: string): Promise<void> {
    return this.callDevice('/linkgrabberv2/setVariant', [linkId, variantId]);
  }

  /**
   * Move links from LinkGrabber to Download list
   */
  async moveToDownloadList(linkIds: number[], packageIds: number[]): Promise<void> {
    return this.callDevice('/linkgrabberv2/moveToDownloadlist', [linkIds, packageIds]);
  }

  /**
   * Clear all links from LinkGrabber
   */
  async clearLinkGrabber(): Promise<boolean> {
    return this.callDevice('/linkgrabberv2/clearList');
  }

  /**
   * Remove specific links from LinkGrabber
   */
  async removeLinksFromGrabber(linkIds: number[], packageIds: number[]): Promise<void> {
    return this.callDevice('/linkgrabberv2/removeLinks', [linkIds, packageIds]);
  }

  // ============ Download Controller Methods ============

  /**
   * Start downloads
   */
  async startDownloads(): Promise<boolean> {
    return this.callDevice('/downloadcontroller/start');
  }

  /**
   * Stop downloads
   */
  async stopDownloads(): Promise<boolean> {
    return this.callDevice('/downloadcontroller/stop');
  }

  /**
   * Pause/Resume downloads
   */
  async pauseDownloads(pause: boolean): Promise<boolean> {
    return this.callDevice('/downloadcontroller/pause', [pause]);
  }

  /**
   * Get current download controller state
   */
  async getDownloadState(): Promise<DownloadControllerState> {
    return this.callDevice('/downloadcontroller/getCurrentState');
  }

  /**
   * Get download speed in bytes per second
   */
  async getSpeed(): Promise<number> {
    return this.callDevice('/downloadcontroller/getSpeedInBps');
  }

  /**
   * Force download specific links
   */
  async forceDownload(linkIds: number[], packageIds: number[]): Promise<boolean> {
    return this.callDevice('/downloadsV2/forceDownload', [linkIds, packageIds]);
  }

  // ============ Downloads V2 Methods ============

  /**
   * Query download links
   */
  async queryDownloadLinks(query?: LinkQuery): Promise<DownloadLink[]> {
    return this.callDevice('/downloadsV2/queryLinks', [query || {}]);
  }

  /**
   * Query download packages
   */
  async queryDownloadPackages(query?: PackageQuery): Promise<FilePackage[]> {
    return this.callDevice('/downloadsV2/queryPackages', [query || {}]);
  }

  /**
   * Get package count in downloads
   */
  async getDownloadPackageCount(): Promise<number> {
    return this.callDevice('/downloadsV2/packageCount');
  }

  /**
   * Remove links from downloads
   */
  async removeDownloadLinks(linkIds: number[], packageIds: number[]): Promise<void> {
    return this.callDevice('/downloadsV2/removeLinks', [linkIds, packageIds]);
  }

  /**
   * Set download directory for packages
   */
  async setDownloadDirectory(directory: string, packageIds: number[]): Promise<void> {
    return this.callDevice('/downloadsV2/setDownloadDirectory', [directory, packageIds]);
  }

  /**
   * Rename a link
   */
  async renameLink(linkId: number, newName: string): Promise<void> {
    return this.callDevice('/downloadsV2/renameLink', [linkId, newName]);
  }

  /**
   * Rename a package
   */
  async renamePackage(packageId: number, newName: string): Promise<void> {
    return this.callDevice('/downloadsV2/renamePackage', [packageId, newName]);
  }

  // ============ System Methods ============

  /**
   * Get JDownloader version
   */
  async getVersion(): Promise<number> {
    return this.callDevice('/jd/version');
  }

  /**
   * Get uptime in milliseconds
   */
  async getUptime(): Promise<number> {
    return this.callDevice('/jd/uptime');
  }

  /**
   * Ping device to check if it's responsive
   */
  async ping(): Promise<boolean> {
    return this.callDevice('/device/ping');
  }

  // ============ Private Methods ============

  /**
   * Make an API call to the server (not device)
   * Uses GET for server API calls per MyJDownloader spec
   * Includes sessiontoken in query string
   */
  private async callServer(path: string, params?: unknown[]): Promise<any> {
    if (!this.session) {
      throw new Error('Not connected. Call connect() first.');
    }
    
    const rid = generateRequestId();
    
    // Build query string WITH sessiontoken - this is required for server calls!
    const queryForSignature = `${path}?rid=${rid}&sessiontoken=${this.session.sessionToken}`;
    const signature = createSignature(queryForSignature, this.session.serverEncryptionToken);
    const url = `${API_ENDPOINT}${path}?rid=${rid}&sessiontoken=${this.session.sessionToken}&signature=${signature}`;
    
    console.log('callServer - Making GET request to:', url);
    
    const response = await fetch(url, {
      method: 'GET'
    });
    
    console.log('callServer - response status:', response.status);
    
    // Read response body once
    const responseText = await response.text();
    console.log('callServer - response body (first 200 chars):', responseText.substring(0, 200));
    
    if (!response.ok) {
      // Try to parse error response
      let errorData: JDApiError;
      try {
        // Error responses are usually plain JSON
        errorData = JSON.parse(responseText) as JDApiError;
      } catch {
        throw new Error(`API error: HTTP ${response.status} - ${responseText}`);
      }
      throw new Error(`API error: ${errorData.type}`);
    }
    
    // Success response is encrypted - decrypt it
    try {
      const decrypted = decrypt(responseText, this.session.serverEncryptionToken);
      console.log('callServer - decrypted response:', decrypted.substring(0, 200));
      return JSON.parse(decrypted);
    } catch (e) {
      // Fallback to plain JSON
      console.log('callServer - decryption failed, trying plain JSON');
      return JSON.parse(responseText);
    }
  }

  /**
   * Make an API call to a specific device
   * 
   * MyJDownloader Device API Flow:
   * 1. Build device path: /t_{sessionToken}_{deviceId}{action}
   * 2. Sign the full device path with deviceEncryptionToken
   * 3. Encrypt the request body with deviceEncryptionToken
   * 4. POST to: {API_ENDPOINT}/t_{sessionToken}_{deviceId}{action}?signature={sig}
   */
  private async callDevice(action: string, params?: unknown[]): Promise<any> {
    if (!this.session) {
      throw new Error('Not connected. Call connect() first.');
    }
    
    if (!this.currentDevice) {
      throw new Error('No device selected. Call selectDevice() first.');
    }
    
    const rid = generateRequestId();
    
    // Build the full device path (this is what gets signed)
    const devicePath = `/t_${this.session.sessionToken}_${this.currentDevice.id}${action}`;
    
    // Sign the full device path
    const signature = createSignature(devicePath, this.session.deviceEncryptionToken);
    
    console.log('callDevice - devicePath for signature:', devicePath);
    console.log('callDevice - signature:', signature);
    
    // Build the request body
    // IMPORTANT: The 'url' field MUST include the signature to match the HTTP URL
    // JDownloader validates that body.url matches the HTTP request URL
    const requestData = {
      url: `${action}?signature=${signature}`,  // Must match HTTP URL
      params: params || [],
      rid,
      apiVer: 1
    };
    
    const requestJson = JSON.stringify(requestData);
    console.log('callDevice - action:', action);
    console.log('callDevice - params:', JSON.stringify(params));
    console.log('callDevice - requestData (full):', requestJson);
    console.log('callDevice - requestData length:', requestJson.length);
    
    // Encrypt the request body
    const encryptedRequest = encrypt(requestJson, this.session.deviceEncryptionToken);
    console.log('callDevice - encrypted request length:', encryptedRequest.length);
    console.log('callDevice - encrypted request (first 100):', encryptedRequest.substring(0, 100));
    
    // Send POST request to the device endpoint
    const fullUrl = `${API_ENDPOINT}${devicePath}?signature=${signature}`;
    console.log('callDevice - fullUrl:', fullUrl);
    console.log('callDevice - fullUrl length:', fullUrl.length);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/aesjson-jd; charset=utf-8'
      },
      body: encryptedRequest
    });
    
    console.log('callDevice - response status:', response.status);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.log('callDevice - error response (raw):', responseText.substring(0, 300));
      
      let errorData: JDApiError | undefined;
      let errorMessage = `HTTP ${response.status}`;
      
      // Try multiple ways to parse the error
      // 1. Try plain JSON first (error responses are often unencrypted)
      try {
        errorData = JSON.parse(responseText) as JDApiError;
        console.log('callDevice - parsed error (plain JSON):', JSON.stringify(errorData));
      } catch {
        // 2. Try to decrypt the error response
        try {
          const decryptedError = decrypt(responseText, this.session.deviceEncryptionToken);
          console.log('callDevice - decrypted error:', decryptedError);
          errorData = JSON.parse(decryptedError) as JDApiError;
        } catch (decryptErr) {
          console.log('callDevice - failed to decrypt/parse error:', decryptErr);
          errorMessage += ` - ${responseText.substring(0, 100)}`;
        }
      }
      
      if (errorData) {
        console.log('callDevice - error type:', errorData.type, 'src:', errorData.src);
        if (errorData.data) {
          console.log('callDevice - error data:', JSON.stringify(errorData.data));
        }
        throw new Error(`Device API error: ${errorData.type} (src: ${errorData.src})`);
      }
      throw new Error(`Device API error: ${errorMessage}`);
    }
    
    // Decrypt and parse successful response
    const encryptedResponse = await response.text();
    
    if (!encryptedResponse) {
      return null;
    }
    
    try {
      const decryptedResponse = decrypt(encryptedResponse, this.session.deviceEncryptionToken);
      console.log('callDevice - decrypted response:', decryptedResponse.substring(0, 200));
      const parsed = JSON.parse(decryptedResponse);
      
      // Verify rid matches
      if (parsed.rid && parsed.rid !== rid) {
        console.warn('callDevice - rid mismatch:', { expected: rid, received: parsed.rid });
      }
      
      return parsed.data;
    } catch (decryptError) {
      // Response might be plain JSON
      console.log('callDevice - trying to parse as plain JSON');
      try {
        return JSON.parse(encryptedResponse);
      } catch {
        console.error('callDevice - failed to parse response:', encryptedResponse.substring(0, 100));
        throw decryptError;
      }
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.session !== null;
  }

  /**
   * Get current device info
   */
  getCurrentDevice(): JDDevice | null {
    return this.currentDevice;
  }
}




