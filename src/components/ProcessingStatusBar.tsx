import React from 'react';
import { CheckCircle, Upload, Loader2, AlertCircle, Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProcessedFile {
  info: {
    customerName: string;
    accountNumber: string;
    fileName: string;
    pageIndex: number;
  };
  blob: Blob;
}

interface ProcessingStatusBarProps {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  processedFiles: ProcessedFile[];
  errors: string[];
  onProcess: () => void;
  onDownloadAll: () => void;
}

type StatusType = 'idle' | 'ready' | 'processing' | 'complete' | 'error';

export default function ProcessingStatusBar({
  file,
  isProcessing,
  progress,
  processedFiles,
  errors,
  onProcess,
  onDownloadAll
}: ProcessingStatusBarProps) {
  const getStatus = (): StatusType => {
    if (isProcessing) return 'processing';
    if (processedFiles.length > 0) return 'complete';
    if (errors.length > 0 && processedFiles.length === 0) return 'error';
    if (file) return 'ready';
    return 'idle';
  };

  const status = getStatus();

  const statusConfig = {
    idle: {
      icon: Upload,
      title: 'No File Selected',
      description: 'Upload a PDF to get started',
      bgColor: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      showProgress: false
    },
    ready: {
      icon: Play,
      title: 'Ready to Process',
      description: `${file?.name} uploaded successfully`,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      showProgress: false
    },
    processing: {
      icon: Loader2,
      title: 'Processing PDF',
      description: `Extracting data from ${file?.name}...`,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      showProgress: true
    },
    complete: {
      icon: CheckCircle,
      title: 'Processing Complete',
      description: `Successfully processed ${processedFiles.length} pages`,
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      iconColor: 'text-green-600 dark:text-green-400',
      showProgress: false
    },
    error: {
      icon: AlertCircle,
      title: 'Processing Failed',
      description: `${errors.length} errors occurred`,
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      iconColor: 'text-red-600 dark:text-red-400',
      showProgress: false
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={cn(
      "sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      config.bgColor
    )}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-background/50", config.iconColor)}>
              <IconComponent 
                className={cn("h-5 w-5", {
                  "animate-spin": status === 'processing'
                })} 
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-sm">{config.title}</h3>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              
              {config.showProgress && (
                <div className="mt-2 w-64">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'ready' && (
              <Button 
                onClick={onProcess}
                variant="default"
                size="sm"
                className="animate-scale-in"
              >
                <Play className="h-3 w-3 mr-1" />
                Process PDF
              </Button>
            )}
            
            {status === 'complete' && (
              <Button 
                onClick={onDownloadAll}
                variant="default"
                size="sm"
                className="animate-scale-in"
              >
                <Download className="h-3 w-3 mr-1" />
                Download All ({processedFiles.length})
              </Button>
            )}

            {status === 'error' && file && (
              <Button 
                onClick={onProcess}
                variant="outline"
                size="sm"
                className="animate-scale-in"
              >
                <Play className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* Error Summary */}
        {status === 'complete' && errors.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-950/50 rounded-md">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              {errors.length} pages had extraction issues
            </p>
          </div>
        )}
      </div>
    </div>
  );
}