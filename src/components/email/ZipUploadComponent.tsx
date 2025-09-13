import React, { useState, useCallback } from 'react';
import { Upload, FileArchive, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

interface PDFFile {
  name: string;
  accountNumber: string;
  customerName: string;
  blob: Blob;
}

interface ZipUploadComponentProps {
  onFilesExtracted: (files: PDFFile[]) => void;
  isProcessing: boolean;
}

const ZipUploadComponent: React.FC<ZipUploadComponentProps> = ({ onFilesExtracted, isProcessing }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedFiles, setExtractedFiles] = useState<PDFFile[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Extract account number and customer name from filename
  const parseFilename = (filename: string): { accountNumber: string; customerName: string } => {
    console.log(`Parsing filename: ${filename}`);
    
    const nameWithoutExt = filename.replace('.pdf', '').replace('.PDF', '');
    console.log(`Name without extension: ${nameWithoutExt}`);
    
    // Try different parsing strategies
    let accountNumber = '';
    let customerName = '';
    
    // Strategy 1: Look for account number pattern (SMNWSTX##, FBNWSTX##, etc.)
    const accountNumberMatch = nameWithoutExt.match(/([A-Z]{2,6}[A-Z0-9]{2,8})/);
    if (accountNumberMatch) {
      accountNumber = accountNumberMatch[1];
      // Remove the account number from the string to get the customer name
      const remaining = nameWithoutExt.replace(accountNumber, '').trim();
      // Clean up separators and get the name part (remove any date patterns)
      customerName = remaining
        .replace(/[_\-\s]+/g, ' ')
        .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '') // Remove dates like 12/25/2023 or 12-25-23
        .replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g, '') // Remove dates like 2023/12/25
        .replace(/\d{1,2}[\/\-]\d{1,2}/g, '') // Remove partial dates like 12/25
        .trim() || 'Unknown';
    }
    // Strategy 2: Underscore separated (AccountNumber_CustomerName_MonthYear.pdf)
    else if (nameWithoutExt.includes('_')) {
      const parts = nameWithoutExt.split('_');
      console.log(`Underscore parts:`, parts);
      
      if (parts.length >= 2) {
        // Check if first part looks like an account number
        if (/^[A-Z]{2,6}[A-Z0-9]{2,8}$/.test(parts[0])) {
          accountNumber = parts[0];
          customerName = parts[1];
        } else {
          // Maybe it's CustomerName_AccountNumber format
          accountNumber = parts[1];
          customerName = parts[0];
        }
      }
    }
    // Strategy 3: Space separated (AccountNumber CustomerName MonthYear.pdf)
    else if (nameWithoutExt.includes(' ')) {
      const parts = nameWithoutExt.split(' ');
      console.log(`Space parts:`, parts);
      
      // Look for account number pattern in the parts
      for (let i = 0; i < parts.length; i++) {
        if (/^[A-Z]{2,6}[A-Z0-9]{2,8}$/.test(parts[i])) {
          accountNumber = parts[i];
          // Join the other parts as customer name, excluding dates
          const nameParts = parts.filter((part, index) => 
            index !== i && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}$/.test(part)
          );
          customerName = nameParts.join(' ').trim() || 'Unknown';
          break;
        }
      }
      
      // If no account number found, assume first part is account number
      if (!accountNumber && parts.length >= 2) {
        accountNumber = parts[0];
        customerName = parts[1];
      }
    }
    // Strategy 4: Dash separated (AccountNumber-CustomerName-MonthYear.pdf)
    else if (nameWithoutExt.includes('-')) {
      const parts = nameWithoutExt.split('-');
      console.log(`Dash parts:`, parts);
      
      // Look for account number pattern in the parts
      for (let i = 0; i < parts.length; i++) {
        if (/^[A-Z]{2,6}[A-Z0-9]{2,8}$/.test(parts[i])) {
          accountNumber = parts[i];
          // Join the other parts as customer name, excluding dates
          const nameParts = parts.filter((part, index) => 
            index !== i && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}$/.test(part)
          );
          customerName = nameParts.join(' ').trim() || 'Unknown';
          break;
        }
      }
      
      // If no account number found, assume first part is account number
      if (!accountNumber && parts.length >= 2) {
        accountNumber = parts[0];
        customerName = parts[1];
      }
    }
    // Strategy 5: Just the filename as account number (if it looks like an account number)
    else {
      // Check if the filename looks like an account number (alphanumeric, reasonable length)
      if (nameWithoutExt.length >= 3 && nameWithoutExt.length <= 20 && /^[A-Za-z0-9]+$/.test(nameWithoutExt)) {
        accountNumber = nameWithoutExt;
        customerName = 'Unknown';
      } else {
        accountNumber = nameWithoutExt;
        customerName = 'Unknown';
      }
    }
    
    const result = {
      accountNumber: accountNumber || 'Unknown',
      customerName: customerName || 'Unknown'
    };
    
    console.log(`Parsed result:`, result);
    return result;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
    
    if (zipFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please upload ZIP files only",
        variant: "destructive",
      });
      return;
    }

    setUploadedFiles(zipFiles);
    setErrors([]);
    toast({
      title: "ZIP Files Uploaded",
      description: `${zipFiles.length} ZIP file(s) ready for extraction`,
    });
  }, [toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
    
    if (zipFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please upload ZIP files only",
        variant: "destructive",
      });
      return;
    }

    setUploadedFiles(zipFiles);
    setErrors([]);
    toast({
      title: "ZIP Files Uploaded",
      description: `${zipFiles.length} ZIP file(s) ready for extraction`,
    });
  }, [toast]);

  const extractZipFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsExtracting(true);
    setExtractionProgress(0);
    setErrors([]);
    
    const allExtractedFiles: PDFFile[] = [];
    const extractionErrors: string[] = [];

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setExtractionProgress((i / uploadedFiles.length) * 50);

        try {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);
          
          const pdfFiles = Object.keys(zipContent.files).filter(filename => 
            filename.toLowerCase().endsWith('.pdf') && !zipContent.files[filename].dir
          );

          for (let j = 0; j < pdfFiles.length; j++) {
            const filename = pdfFiles[j];
            const zipFile = zipContent.files[filename];
            
            try {
              const blob = await zipFile.async('blob');
              const { accountNumber, customerName } = parseFilename(filename);
              
              allExtractedFiles.push({
                name: filename,
                accountNumber,
                customerName,
                blob
              });
            } catch (error) {
              extractionErrors.push(`Failed to extract ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          if (pdfFiles.length === 0) {
            extractionErrors.push(`No PDF files found in ${file.name}`);
          }

        } catch (error) {
          extractionErrors.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setExtractionProgress(100);
      setExtractedFiles(allExtractedFiles);
      setErrors(extractionErrors);

      if (allExtractedFiles.length > 0) {
        onFilesExtracted(allExtractedFiles);
        toast({
          title: "Extraction Complete",
          description: `Successfully extracted ${allExtractedFiles.length} PDF files`,
        });
      }

      if (extractionErrors.length > 0) {
        toast({
          title: "Some Issues Found",
          description: `${extractionErrors.length} files had extraction issues`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0) {
      setExtractedFiles([]);
      setErrors([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload ZIP Files
          </CardTitle>
          <CardDescription>
            Upload ZIP files containing the PDF statements from the PDF Splitter tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('zip-upload')?.click()}
          >
            <FileArchive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Drop ZIP files here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports multiple ZIP files</p>
          </div>
          <input
            id="zip-upload"
            type="file"
            accept=".zip"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      disabled={isExtracting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={extractZipFiles}
                disabled={isExtracting || isProcessing}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <FileText className="h-4 w-4 mr-2 animate-pulse" />
                    Extracting PDFs...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Extract PDF Files
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Extraction Progress */}
          {isExtracting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Extracting files...</span>
                <span>{Math.round(extractionProgress)}%</span>
              </div>
              <Progress value={extractionProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Files Results */}
      {extractedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Extracted PDF Files ({extractedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {extractedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Account: {file.accountNumber} • Customer: {file.customerName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Extraction Issues ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZipUploadComponent;
