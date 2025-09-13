import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processPDF } from '@/lib/pdfProcessor';
import PatternManager from '@/components/PatternManager';
import ProcessingStatusBar from '@/components/ProcessingStatusBar';
import DownloadManager from '@/components/DownloadManager';
import { usePatterns } from '@/hooks/usePatterns';

interface ExtractedInfo {
  customerName: string;
  accountNumber: string;
  fileName: string;
  pageIndex: number;
}

interface ProcessedFile {
  info: ExtractedInfo;
  blob: Blob;
}

const PDFSplitterTool = () => {
  const { patterns } = usePatterns();
  const [file, setFile] = useState<File | null>(null);
  const [monthYear, setMonthYear] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setProcessedFiles([]);
      setErrors([]);
      toast({
        title: "PDF Uploaded",
        description: `${uploadedFile.name} is ready for processing`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setProcessedFiles([]);
      setErrors([]);
      toast({
        title: "PDF Uploaded",
        description: `${droppedFile.name} is ready for processing`,
      });
    }
  }, [toast]);

  const processPDFFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setErrors([]);

    try {
      // Combine patterns with | separator for multiple pattern support
      const combinedAccountPattern = patterns.accountPatterns.join('|');
      const combinedNamePattern = patterns.namePatterns.join('|');
      
      const result = await processPDF(
        file,
        combinedAccountPattern,
        combinedNamePattern,
        monthYear,
        (progress) => setProgress(progress)
      );

      setProcessedFiles(result.files);
      setErrors(result.errors);

      if (result.files.length > 0) {
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${result.files.length} pages`,
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: "Some Issues Found",
          description: `${result.errors.length} pages had extraction issues`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingleFile = (processedFile: ProcessedFile) => {
    const url = URL.createObjectURL(processedFile.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = processedFile.info.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Processing Status Bar */}
      <ProcessingStatusBar
        file={file}
        isProcessing={isProcessing}
        progress={progress}
        processedFiles={processedFiles}
        errors={errors}
        onProcess={processPDFFile}
        onDownloadAll={() => {}} // Placeholder - downloads now handled by DownloadManager
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          PDF Account Splitter
        </h1>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Automatically split PDFs and name files by customer account information.
          </p>
          <p className="text-sm text-blue-600 font-medium">
            Optimized for New Water Systems bill statement processing
          </p>
        </div>
      </div>

      <PatternManager />

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload PDF Bill Statements
          </CardTitle>
          <CardDescription>
            Upload your New Water Systems multi-page PDF bill statements to automatically split them by customer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Drop your PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
              </div>
            )}
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>File Naming Configuration</CardTitle>
          <CardDescription>
            Set optional month/year for consistent file naming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month-year">Month/Year (optional)</Label>
            <Input
              id="month-year"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              placeholder="May 2025"
            />
            <p className="text-xs text-muted-foreground">
              Will be included in filename: AccountNumber_CustomerName_MonthYear.pdf
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      {file && (
        <div className="flex justify-center">
          <Button
            onClick={processPDFFile}
            disabled={isProcessing}
            variant={isProcessing ? "processing" : "hero"}
            size="lg"
            className="min-w-48"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Split PDF"
            )}
          </Button>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing pages...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {(processedFiles.length > 0 || errors.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Download Manager */}
            {processedFiles.length > 0 && (
              <div className="space-y-4">
                <DownloadManager
                  files={processedFiles}
                  disabled={isProcessing}
                  monthYear={monthYear}
                />

                <div className="space-y-2">
                  <h4 className="font-medium text-success">
                    Successfully Processed ({processedFiles.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                  {processedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{file.info.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.info.customerName} • {file.info.accountNumber}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSingleFile(file)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Issues Found ({errors.length})
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFSplitterTool;
