import React, { useState, useCallback } from 'react';
import { TestTube, Upload, Play, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePatterns } from '@/hooks/usePatterns';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface TestResult {
  pattern: string;
  matches: string[];
  success: boolean;
  error?: string;
}

export default function PatternTester() {
  const [file, setFile] = useState<File | null>(null);
  const [testPattern, setTestPattern] = useState('');
  const [patternType, setPatternType] = useState<'account' | 'name'>('account');
  const [testText, setTestText] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { patterns } = usePatterns();
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setTestText('');
      setTestResults([]);
      
      // Extract text from PDF
      try {
        setIsProcessing(true);
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Test with first 3 pages
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        
        setTestText(fullText);
        toast({
          title: "PDF Loaded",
          description: `Extracted text from ${Math.min(pdf.numPages, 3)} pages`,
        });
      } catch (error) {
        console.error('Failed to extract text:', error);
        toast({
          title: "Error",
          description: "Failed to extract text from PDF",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const testSinglePattern = (pattern: string, text: string): TestResult => {
    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const value = match[1] || match[0]; // Use capture group if available
        matches.push(value);
        
        // Prevent infinite loops
        if (!regex.global) break;
        if (matches.length > 50) break; // Limit results
      }
      
      return {
        pattern,
        matches: [...new Set(matches)], // Remove duplicates
        success: true
      };
    } catch (error) {
      return {
        pattern,
        matches: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testCustomPattern = () => {
    if (!testPattern.trim() || !testText.trim()) {
      toast({
        title: "Missing Input",
        description: "Please provide both a pattern and test text",
        variant: "destructive",
      });
      return;
    }

    const result = testSinglePattern(testPattern, testText);
    setTestResults([result]);
  };

  const testAllPatterns = () => {
    if (!testText.trim()) {
      toast({
        title: "No Test Text",
        description: "Please upload a PDF or enter test text",
        variant: "destructive",
      });
      return;
    }

    const patternsToTest = patternType === 'account' 
      ? patterns.accountPatterns 
      : patterns.namePatterns;

    const results = patternsToTest.map(pattern => testSinglePattern(pattern, testText));
    setTestResults(results);

    const successCount = results.filter(r => r.success && r.matches.length > 0).length;
    toast({
      title: "Testing Complete",
      description: `${successCount} of ${results.length} patterns found matches`,
    });
  };

  const loadSamplePattern = () => {
    const samplePatterns = {
      account: 'account\\s*nbr[:\\s]+([A-Z]{2,6}\\d{4,12})',
      name: 'customer\\s*name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+)'
    };
    setTestPattern(samplePatterns[patternType]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Pattern Tester
        </CardTitle>
        <CardDescription>
          Test regex patterns against sample documents to validate their accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div>
          <Label htmlFor="test-pdf">Upload Test PDF (Optional)</Label>
          <div className="mt-2">
            <Input
              id="test-pdf"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name}
              {isProcessing && <span className="text-blue-600">Processing...</span>}
            </div>
          )}
        </div>

        {/* Test Text Area */}
        <div>
          <Label htmlFor="test-text">Test Text</Label>
          <Textarea
            id="test-text"
            placeholder="Paste sample text here or upload a PDF above..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        {/* Pattern Testing */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Pattern Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Custom Pattern</h3>
            
            <div>
              <Label htmlFor="pattern-type">Pattern Type</Label>
              <Select value={patternType} onValueChange={(value: 'account' | 'name') => setPatternType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account Number</SelectItem>
                  <SelectItem value="name">Customer Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-pattern">Regex Pattern</Label>
              <div className="flex gap-2">
                <Input
                  id="test-pattern"
                  placeholder="Enter regex pattern..."
                  value={testPattern}
                  onChange={(e) => setTestPattern(e.target.value)}
                  className="font-mono"
                />
                <Button variant="outline" onClick={loadSamplePattern}>
                  Sample
                </Button>
              </div>
            </div>

            <Button onClick={testCustomPattern} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Test Pattern
            </Button>
          </div>

          {/* All Patterns Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test All Saved Patterns</h3>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Test all {patternType} patterns from your library:
              </p>
              <p className="text-sm font-medium">
                {patternType === 'account' 
                  ? `${patterns.accountPatterns.length} account patterns`
                  : `${patterns.namePatterns.length} name patterns`
                }
              </p>
            </div>

            <Button onClick={testAllPatterns} variant="outline" className="w-full">
              <TestTube className="mr-2 h-4 w-4" />
              Test All {patternType === 'account' ? 'Account' : 'Name'} Patterns
            </Button>
          </div>
        </div>

        {/* Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Results</h3>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Card key={index} className={`${result.success ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? `${result.matches.length} matches` : 'Error'}
                          </Badge>
                        </div>
                        
                        <code className="text-xs bg-muted p-2 rounded block mb-2 font-mono break-all">
                          {result.pattern}
                        </code>
                        
                        {result.error && (
                          <p className="text-sm text-red-600 mb-2">{result.error}</p>
                        )}
                      </div>
                    </div>
                    
                    {result.matches.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Matches found:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.matches.slice(0, 10).map((match, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {match}
                            </Badge>
                          ))}
                          {result.matches.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.matches.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
