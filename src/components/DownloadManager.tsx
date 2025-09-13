import React, { useState, useCallback } from 'react';
import { Package, Download, Pause, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { detectBrowser, createOptimizedDownloader } from '@/lib/browserUtils';

interface ProcessedFile {
  info: {
    customerName: string;
    accountNumber: string;
    fileName: string;
    pageIndex: number;
  };
  blob: Blob;
}

interface DownloadManagerProps {
  files: ProcessedFile[];
  disabled?: boolean;
  monthYear?: string; // For custom ZIP naming
}

type DownloadState = 'idle' | 'downloading' | 'paused' | 'completed' | 'error';

export default function DownloadManager({ files, disabled = false, monthYear = '' }: DownloadManagerProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();
  
  const browserInfo = detectBrowser();
  const downloader = createOptimizedDownloader(browserInfo);

  // Generate custom ZIP name based on account pattern and date
  const generateZipName = useCallback(() => {
    if (files.length === 0) return 'new-water-systems-statements.zip';

    // Extract account number from first file to get the prefix pattern
    const firstAccountNumber = files[0]?.info?.accountNumber || '';

    // Get first 7 characters of account number (e.g., "FBNWSTX123456" -> "FBNWSTX")
    const accountPrefix = firstAccountNumber.substring(0, 7).toUpperCase();

    // Format the month/year for better readability
    let formattedDate = monthYear;
    if (monthYear) {
      // Handle different input formats:
      // "Jan_2024" -> "Jan2024"
      // "January 2024" -> "January2024"
      // "01_2024" -> "Jan2024"
      formattedDate = monthYear
        .replace(/_/g, '')
        .replace(/\s+/g, '')
        .replace(/^01/, 'Jan')
        .replace(/^02/, 'Feb')
        .replace(/^03/, 'Mar')
        .replace(/^04/, 'Apr')
        .replace(/^05/, 'May')
        .replace(/^06/, 'Jun')
        .replace(/^07/, 'Jul')
        .replace(/^08/, 'Aug')
        .replace(/^09/, 'Sep')
        .replace(/^10/, 'Oct')
        .replace(/^11/, 'Nov')
        .replace(/^12/, 'Dec');
    }

    // Create custom ZIP name: FBNWSTX_July2025.zip
    if (accountPrefix && formattedDate) {
      const zipName = `${accountPrefix}_${formattedDate}.zip`;
      console.log(`Custom ZIP name generated: ${zipName} (from account: ${firstAccountNumber}, date: ${monthYear})`);
      return zipName;
    }

    // Fallback to default name
    console.log('Using default ZIP name (no account prefix or date found)');
    return 'new-water-systems-statements.zip';
  }, [files, monthYear]);

  const handleZipDownload = useCallback(async () => {
    if (files.length === 0) return;
    
    setDownloadState('downloading');
    setProgress(0);
    setCurrentFile('Creating ZIP file...');
    
    try {
      const zipFiles = files.map(file => ({
        blob: file.blob,
        filename: file.info.fileName
      }));

      // Generate custom ZIP name
      const customZipName = generateZipName();
      console.log('Generated ZIP name:', customZipName);

      // Create ZIP with progress tracking
      const zipBlob = await downloader.createChunkedZip(zipFiles, customZipName);

      setProgress(90);
      setCurrentFile('Preparing download...');

      // Download the ZIP file with custom name
      await downloader.downloadSingleFile(zipBlob, customZipName);
      
      setProgress(100);
      setDownloadState('completed');
      
      toast({
        title: "ZIP Download Complete",
        description: `Successfully downloaded ${files.length} files in ZIP format`,
      });
      
      // Reset after delay
      setTimeout(() => {
        setDownloadState('idle');
        setProgress(0);
        setCurrentFile('');
      }, 3000);
      
    } catch (error) {
      setDownloadState('error');
      toast({
        title: "ZIP Download Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [files, downloader, toast]);

  const handleIndividualDownload = useCallback(async () => {
    if (files.length === 0) return;
    
    setDownloadState('downloading');
    setProgress(0);
    setIsPaused(false);
    
    try {
      const downloadFiles = files.map(file => ({
        blob: file.blob,
        filename: file.info.fileName
      }));
      
      await downloader.downloadSequentially(downloadFiles, (current, total) => {
        if (!isPaused) {
          setProgress((current / total) * 100);
          setCurrentFile(`Downloading ${current} of ${total}: ${downloadFiles[current - 1]?.filename || ''}`);
        }
      });
      
      setDownloadState('completed');
      toast({
        title: "Individual Downloads Complete",
        description: `Successfully downloaded ${files.length} files individually`,
      });
      
      // Reset after delay
      setTimeout(() => {
        setDownloadState('idle');
        setProgress(0);
        setCurrentFile('');
      }, 3000);
      
    } catch (error) {
      setDownloadState('error');
      toast({
        title: "Individual Downloads Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [files, downloader, toast, isPaused]);

  const handlePauseResume = useCallback(() => {
    setIsPaused(!isPaused);
    if (isPaused) {
      setCurrentFile(currentFile.replace('(Paused)', ''));
    } else {
      setCurrentFile(currentFile + ' (Paused)');
    }
  }, [isPaused, currentFile]);

  const getBrowserOptimizationMessage = () => {
    switch (browserInfo.name) {
      case 'chrome':
        return `Chrome detected: Downloads optimized for ${browserInfo.downloadLimitations.maxConcurrentDownloads} file limit`;
      case 'safari':
        return 'Safari detected: Using enhanced blob handling for reliable downloads';
      case 'firefox':
        return 'Firefox detected: Optimized concurrent download handling';
      case 'edge':
        return 'Edge detected: Enhanced download processing enabled';
      default:
        return 'Browser optimizations applied for reliable downloads';
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Browser optimization info */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        {getBrowserOptimizationMessage()}
      </div>
      
      {/* Download buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleZipDownload}
          disabled={disabled || downloadState === 'downloading'}
          variant="default"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Package className="h-4 w-4 mr-2" />
          Download as ZIP File
        </Button>
        
        <Button
          onClick={handleIndividualDownload}
          disabled={disabled || downloadState === 'downloading'}
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Files Individually
        </Button>
        
        {downloadState === 'downloading' && (
          <Button
            onClick={handlePauseResume}
            variant="outline"
            size="sm"
          >
            {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
      </div>
      
      {/* Progress indicator */}
      {downloadState === 'downloading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{currentFile}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Status messages */}
      {downloadState === 'completed' && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Download completed successfully!
        </div>
      )}
      
      {downloadState === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          Download failed. Please try again.
        </div>
      )}
    </div>
  );
}
