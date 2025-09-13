/**
 * Browser detection and optimization utilities for New Water Systems PDF Splitter
 * Handles browser-specific download limitations and optimizations
 */

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  version: string;
  isMobile: boolean;
  downloadLimitations: {
    maxConcurrentDownloads: number;
    requiresDelay: boolean;
    delayMs: number;
    supportsZip: boolean;
    requiresUserInteraction: boolean;
  };
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
  
  let name: BrowserInfo['name'] = 'unknown';
  let version = '';
  
  // Chrome detection
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    name = 'chrome';
    const match = userAgent.match(/chrome\/(\d+)/);
    version = match ? match[1] : '';
  }
  // Edge detection
  else if (userAgent.includes('edg')) {
    name = 'edge';
    const match = userAgent.match(/edg\/(\d+)/);
    version = match ? match[1] : '';
  }
  // Firefox detection
  else if (userAgent.includes('firefox')) {
    name = 'firefox';
    const match = userAgent.match(/firefox\/(\d+)/);
    version = match ? match[1] : '';
  }
  // Safari detection
  else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    name = 'safari';
    const match = userAgent.match(/version\/(\d+)/);
    version = match ? match[1] : '';
  }
  
  // Browser-specific download limitations
  const downloadLimitations = {
    chrome: {
      maxConcurrentDownloads: 10, // Chrome's security limit
      requiresDelay: true,
      delayMs: 100,
      supportsZip: true,
      requiresUserInteraction: true
    },
    firefox: {
      maxConcurrentDownloads: 20,
      requiresDelay: true,
      delayMs: 50,
      supportsZip: true,
      requiresUserInteraction: false
    },
    safari: {
      maxConcurrentDownloads: 1, // Safari is very restrictive
      requiresDelay: true,
      delayMs: 500,
      supportsZip: true,
      requiresUserInteraction: true
    },
    edge: {
      maxConcurrentDownloads: 15,
      requiresDelay: true,
      delayMs: 75,
      supportsZip: true,
      requiresUserInteraction: false
    },
    unknown: {
      maxConcurrentDownloads: 5,
      requiresDelay: true,
      delayMs: 200,
      supportsZip: true,
      requiresUserInteraction: true
    }
  };
  
  return {
    name,
    version,
    isMobile,
    downloadLimitations: downloadLimitations[name]
  };
}

export function createOptimizedDownloader(browserInfo: BrowserInfo) {
  return {
    // Sequential download with browser-specific optimizations
    async downloadSequentially(files: Array<{blob: Blob, filename: string}>, onProgress?: (current: number, total: number) => void) {
      const { maxConcurrentDownloads, requiresDelay, delayMs } = browserInfo.downloadLimitations;
      
      for (let i = 0; i < files.length; i += maxConcurrentDownloads) {
        const batch = files.slice(i, i + maxConcurrentDownloads);
        
        // Process batch
        await Promise.all(batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          if (requiresDelay && globalIndex > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          await this.downloadSingleFile(file.blob, file.filename);
          
          if (onProgress) {
            onProgress(globalIndex + 1, files.length);
          }
        }));
        
        // Delay between batches for browser stability
        if (i + maxConcurrentDownloads < files.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs * 2));
        }
      }
    },
    
    // Single file download with browser-specific handling
    async downloadSingleFile(blob: Blob, filename: string): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          // Safari-specific handling
          if (browserInfo.name === 'safari') {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          }
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup with delay for browser processing
          setTimeout(() => {
            URL.revokeObjectURL(url);
            resolve();
          }, browserInfo.name === 'safari' ? 1000 : 100);
          
        } catch (error) {
          reject(error);
        }
      });
    },
    
    // Create ZIP with chunked processing to prevent memory issues
    async createChunkedZip(files: Array<{blob: Blob, filename: string}>, zipName: string): Promise<Blob> {
      // Dynamic import of JSZip to reduce bundle size
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Process files in chunks to prevent memory crashes
      const chunkSize = browserInfo.name === 'safari' ? 5 : 10;
      
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        
        for (const file of chunk) {
          const arrayBuffer = await file.blob.arrayBuffer();
          zip.file(file.filename, arrayBuffer);
        }
        
        // Allow garbage collection between chunks
        if (i + chunkSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Generate ZIP with compression optimized for browser
      const compressionLevel = browserInfo.name === 'safari' ? 1 : 6;
      return await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel }
      });
    }
  };
}
