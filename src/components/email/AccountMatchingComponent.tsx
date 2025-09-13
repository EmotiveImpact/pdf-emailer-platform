import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertCircle, RefreshCw, FileText, Mail, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PDFFile {
  name: string;
  accountNumber: string;
  customerName: string;
  blob: Blob;
}

interface CustomerData {
  accountNumber: string;
  email: string;
  customerName: string;
}

interface MatchedData {
  pdf: PDFFile;
  customer: CustomerData;
  matched: boolean;
}

interface AccountMatchingComponentProps {
  pdfFiles: PDFFile[];
  customerData: CustomerData[];
  onMatchingComplete: (matches: MatchedData[]) => void;
  isProcessing: boolean;
}

const AccountMatchingComponent: React.FC<AccountMatchingComponentProps> = ({
  pdfFiles,
  customerData,
  onMatchingComplete,
  isProcessing
}) => {
  const [matchedData, setMatchedData] = useState<MatchedData[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchStats, setMatchStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0
  });
  const { toast } = useToast();

  const performMatching = () => {
    setIsMatching(true);
    
    console.log('Starting account matching...');
    console.log('PDF Files:', pdfFiles.map(pdf => ({
      name: pdf.name,
      accountNumber: pdf.accountNumber,
      customerName: pdf.customerName
    })));
    console.log('Customer Data:', customerData.map(customer => ({
      accountNumber: customer.accountNumber,
      email: customer.email,
      customerName: customer.customerName
    })));
    
    // Create a map of customer data by account number for faster lookup
    const customerMap = new Map<string, CustomerData>();
    customerData.forEach(customer => {
      const normalizedAccountNumber = customer.accountNumber.toLowerCase().trim();
      customerMap.set(normalizedAccountNumber, customer);
      console.log(`Added customer to map: ${normalizedAccountNumber} -> ${customer.email}`);
    });

    const matches: MatchedData[] = [];
    
    pdfFiles.forEach(pdf => {
      const normalizedPdfAccountNumber = pdf.accountNumber.toLowerCase().trim();
      const customer = customerMap.get(normalizedPdfAccountNumber);
      
      console.log(`Matching PDF: ${pdf.name}`);
      console.log(`  PDF Account Number: "${pdf.accountNumber}" -> normalized: "${normalizedPdfAccountNumber}"`);
      console.log(`  Looking for customer with account: "${normalizedPdfAccountNumber}"`);
      console.log(`  Found customer:`, customer);
      
      matches.push({
        pdf,
        customer: customer || {
          accountNumber: pdf.accountNumber,
          email: '',
          customerName: pdf.customerName
        },
        matched: !!customer
      });
    });

    const stats = {
      total: matches.length,
      matched: matches.filter(m => m.matched).length,
      unmatched: matches.filter(m => !m.matched).length
    };

    console.log('Matching results:', {
      total: stats.total,
      matched: stats.matched,
      unmatched: stats.unmatched,
      matches: matches.map(m => ({
        pdfName: m.pdf.name,
        pdfAccount: m.pdf.accountNumber,
        customerEmail: m.customer.email,
        matched: m.matched
      }))
    });

    setMatchedData(matches);
    setMatchStats(stats);
    onMatchingComplete(matches);
    setIsMatching(false);

    toast({
      title: "Matching Complete",
      description: `${stats.matched} of ${stats.total} PDFs matched with customer data`,
      variant: stats.unmatched > 0 ? "destructive" : "default"
    });
  };

  // Auto-perform matching when data is available
  useEffect(() => {
    if (pdfFiles.length > 0 && customerData.length > 0 && matchedData.length === 0) {
      performMatching();
    }
  }, [pdfFiles, customerData]);

  const getMatchStatusBadge = (matched: boolean) => {
    return matched ? (
      <Badge className="bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Matched
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        No Match
      </Badge>
    );
  };


  return (
    <div className="space-y-6">
      {/* Matching Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Account Matching
          </CardTitle>
          <CardDescription>
            Automatically match PDF files with customer email addresses using account numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pdfFiles.length}</div>
              <div className="text-sm text-muted-foreground">PDF Files</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{customerData.length}</div>
              <div className="text-sm text-muted-foreground">Customer Records</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{matchStats.matched}</div>
              <div className="text-sm text-muted-foreground">Matches Found</div>
            </div>
          </div>

          {/* Matching Results Summary */}
          {matchedData.length > 0 && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Matching Results</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={performMatching}
                  disabled={isMatching || isProcessing}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Re-match
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{matchStats.matched} Successfully Matched</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span>{matchStats.unmatched} Unmatched</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {matchedData.length === 0 && (
            <Button
              onClick={performMatching}
              disabled={isMatching || isProcessing || pdfFiles.length === 0 || customerData.length === 0}
              className="w-full"
            >
              {isMatching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Matching Accounts...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Match Accounts
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Matching Results */}
      {matchedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Details</CardTitle>
            <CardDescription>
              Review the matching results and verify accuracy before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {matchedData.map((match, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    match.matched ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* PDF Info */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{match.pdf.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Account: {match.pdf.accountNumber} • PDF Customer: {match.pdf.customerName}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      {match.matched ? (
                        <div className="flex items-center gap-2 ml-6">
                          <Mail className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm text-green-700">{match.customer.email}</p>
                            <p className="text-xs text-green-600">
                              CSV Customer: {match.customer.customerName}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-6">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <p className="text-sm text-red-700">
                            No customer record found for account {match.pdf.accountNumber}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="ml-4">
                      {getMatchStatusBadge(match.matched)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Actions */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {matchStats.matched > 0 ? (
                    <span className="text-green-600">
                      ✓ Ready to proceed with {matchStats.matched} matched files
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ⚠ No matches found - check your data and try again
                    </span>
                  )}
                </div>
                
                {matchStats.unmatched > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {matchStats.unmatched} files will be skipped
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched Files Warning */}
      {matchStats.unmatched > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Unmatched Files Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-3">
              <p>
                <strong>{matchStats.unmatched} PDF files</strong> could not be matched with customer email addresses.
              </p>
              <p>
                These files will be skipped during email sending. To include them:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that account numbers in your CSV match those in the PDF filenames</li>
                <li>Verify the CSV contains all necessary customer records</li>
                <li>Account number matching is case-insensitive</li>
              </ul>
              
              <div className="pt-3 border-t border-yellow-300">
                <p className="mb-2 font-medium">Quick Fix:</p>
                <p className="text-xs">
                  Go back to the "Import Customer Data" step and use the "Generate from PDFs" button to create a CSV with all your PDF account numbers. Just add the email addresses and upload it back.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccountMatchingComponent;
