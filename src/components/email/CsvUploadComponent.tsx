import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface CustomerData {
  accountNumber: string;
  email: string;
  customerName: string;
}

interface CsvUploadComponentProps {
  onDataParsed: (data: CustomerData[]) => void;
  isProcessing: boolean;
  pdfFiles?: PDFFile[];
}

const CsvUploadComponent: React.FC<CsvUploadComponentProps> = ({ onDataParsed, isProcessing, pdfFiles = [] }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CustomerData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setErrors([]);
    setParsedData([]);
    toast({
      title: "CSV File Uploaded",
      description: `${file.name} is ready for parsing`,
    });
  }, [toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setErrors([]);
    setParsedData([]);
    toast({
      title: "CSV File Uploaded",
      description: `${file.name} is ready for parsing`,
    });
  }, [toast]);

  const parseCSV = async () => {
    if (!uploadedFile) return;

    setIsParsing(true);
    setErrors([]);

    try {
      const text = await uploadedFile.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[];
          const parsedCustomers: CustomerData[] = [];
          const parseErrors: string[] = [];

          console.log('CSV Parsing Debug:', {
            totalRows: data.length,
            firstRow: data[0],
            allColumns: data[0] ? Object.keys(data[0]) : [],
            rawText: text.substring(0, 500) + '...'
          });

          // Check for required columns
          const firstRow = data[0];
          if (!firstRow) {
            parseErrors.push('CSV file appears to be empty or invalid');
            setErrors(parseErrors);
            setIsParsing(false);
            return;
          }

          const availableColumns = Object.keys(firstRow);
          console.log('Available columns:', availableColumns);

          // More flexible column detection using the same logic as data extraction
          const hasAccountNumber = availableColumns.some(col =>
            col.toLowerCase().includes('account') && col.toLowerCase().includes('number')
          ) || availableColumns.some(col =>
            ['accountnumber', 'account_number', 'accountno'].includes(col.toLowerCase().replace(/\s/g, ''))
          );

          const hasEmail = availableColumns.some(col =>
            col.toLowerCase().includes('email') || col.toLowerCase().includes('mail')
          );

          const hasCustomerName = availableColumns.some(col =>
            (col.toLowerCase().includes('customer') && col.toLowerCase().includes('name')) ||
            col.toLowerCase().includes('name')
          );

          console.log('Column detection:', {
            hasAccountNumber,
            hasEmail,
            hasCustomerName,
            accountNumberCol: availableColumns.find(col =>
              col.toLowerCase().includes('account')
            ),
            emailCol: availableColumns.find(col =>
              col.toLowerCase().includes('email') || col.toLowerCase().includes('mail')
            ),
            nameCol: availableColumns.find(col =>
              col.toLowerCase().includes('name')
            )
          });

          if (!hasAccountNumber || !hasEmail || !hasCustomerName) {
            parseErrors.push(`CSV must contain columns: Account Number, Email, Customer Name (or similar variations)`);
            parseErrors.push(`Available columns: ${availableColumns.join(', ')}`);
            parseErrors.push(`Try renaming your columns to: Account Number, Email, Customer Name`);
            setErrors(parseErrors);
            setIsParsing(false);
            return;
          }

          data.forEach((row, index) => {
            try {
              // More flexible column name detection
              const accountNumber = row.accountNumber || row.account_number || row['Account Number'] || 
                                  row['account number'] || row['AccountNumber'] || row['ACCOUNT_NUMBER'] || '';
              const email = row.email || row.Email || row.email_address || 
                          row['Email Address'] || row['email address'] || row['EMAIL'] || '';
              const customerName = row.customerName || row.customer_name || row['Customer Name'] || 
                                 row['customer name'] || row.name || row.Name || row['NAME'] || 
                                 row['CustomerName'] || row['CUSTOMER_NAME'] || '';

              console.log(`Row ${index + 2}:`, {
                accountNumber: accountNumber.trim(),
                email: email.trim(),
                customerName: customerName.trim(),
                rawRow: row
              });

              if (!accountNumber.trim()) {
                parseErrors.push(`Row ${index + 2}: Missing account number`);
                return;
              }

              if (!email.trim()) {
                parseErrors.push(`Row ${index + 2}: Missing email address`);
                return;
              }

              if (!validateEmail(email.trim())) {
                parseErrors.push(`Row ${index + 2}: Invalid email format: ${email}`);
                return;
              }

              if (!customerName.trim()) {
                parseErrors.push(`Row ${index + 2}: Missing customer name`);
                return;
              }

              parsedCustomers.push({
                accountNumber: accountNumber.trim(),
                email: email.trim().toLowerCase(),
                customerName: customerName.trim()
              });

            } catch (error) {
              parseErrors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });

          setParsedData(parsedCustomers);
          setErrors(parseErrors);

          if (parsedCustomers.length > 0) {
            onDataParsed(parsedCustomers);
            toast({
              title: "CSV Parsed Successfully",
              description: `Imported ${parsedCustomers.length} customer records`,
            });
          }

          if (parseErrors.length > 0) {
            toast({
              title: "Some Issues Found",
              description: `${parseErrors.length} rows had parsing issues`,
              variant: "destructive",
            });
          }

          setIsParsing(false);
        },
        error: (error) => {
          setErrors([`Failed to parse CSV: ${error.message}`]);
          setIsParsing(false);
          toast({
            title: "Parsing Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      });

    } catch (error) {
      setErrors([`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setIsParsing(false);
      toast({
        title: "File Read Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Account Number', 'Email', 'Customer Name'],
      ['FBNWSTX123456', 'john.smith@email.com', 'John Smith'],
      ['FBNWSTX789012', 'mary.johnson@email.com', 'Mary Johnson'],
      ['FBNWSTX345678', 'bob.wilson@email.com', 'Bob Wilson']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_customer_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSampleCSVFromPDFs = () => {
    if (pdfFiles.length === 0) {
      toast({
        title: "No PDF Files",
        description: "Please upload PDF files first in the previous step",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content based on PDF files
    const csvHeaders = ['Account Number', 'Email', 'Customer Name'];
    const csvRows = pdfFiles.map(pdf => [
      pdf.accountNumber,
      'customer@email.com', // Placeholder email
      pdf.customerName
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Sample CSV Generated",
      description: `Downloaded CSV with ${pdfFiles.length} customer records. Update the email addresses and upload it back.`,
    });
  };

  const removeFile = () => {
    setUploadedFile(null);
    setParsedData([]);
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Customer Data CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing customer email addresses and account numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Required columns: Account Number, Email, Customer Name
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                <Download className="h-3 w-3 mr-2" />
                Sample CSV
              </Button>
              {pdfFiles.length > 0 && (
                <Button variant="outline" size="sm" onClick={generateSampleCSVFromPDFs}>
                  <Download className="h-3 w-3 mr-2" />
                  Generate from PDFs
                </Button>
              )}
            </div>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
          </div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Uploaded File */}
          {uploadedFile && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded File</h4>
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{uploadedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(uploadedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={removeFile}
                  disabled={isParsing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <Button
                onClick={parseCSV}
                disabled={isParsing || isProcessing}
                className="w-full"
              >
                {isParsing ? (
                  <>
                    <FileText className="h-4 w-4 mr-2 animate-pulse" />
                    Parsing CSV...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Parse Customer Data
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Data Results */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Customer Data ({parsedData.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedData.slice(0, 10).map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium">{customer.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.accountNumber} • {customer.email}
                    </p>
                  </div>
                </div>
              ))}
              {parsedData.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... and {parsedData.length - 10} more records
                </p>
              )}
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
              Parsing Issues ({errors.length})
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

export default CsvUploadComponent;
