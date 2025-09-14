import React, { useState, useCallback } from 'react';
import { Upload, Search, CheckCircle, AlertCircle, Eye, Save, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePatterns } from '@/hooks/usePatterns';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface DiscoveredPattern {
  type: 'account' | 'name' | 'date' | 'amount' | 'other';
  pattern: string;
  examples: string[];
  confidence: number;
  description: string;
  validated: boolean;
}

interface AnalysisResult {
  text: string;
  patterns: DiscoveredPattern[];
  suggestions: string[];
}

export default function PatternDiscoveryTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedPatterns, setSelectedPatterns] = useState<Set<number>>(new Set());
  const { addAccountPattern, addNamePattern } = usePatterns();
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setAnalysisResult(null);
      setSelectedPatterns(new Set());
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const analyzeDocument = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Analyze first 3 pages
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Discover patterns
      const patterns = discoverPatterns(fullText);
      
      setAnalysisResult({
        text: fullText,
        patterns,
        suggestions: generateSuggestions(patterns)
      });

      toast({
        title: "Analysis Complete",
        description: `Found ${patterns.length} potential patterns`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the PDF document",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const discoverPatterns = (text: string): DiscoveredPattern[] => {
    const patterns: DiscoveredPattern[] = [];

    // Account number patterns
    const accountMatches = [
      ...text.matchAll(/account\s*(?:nbr|number|#)[:\s]+([A-Z0-9]+)/gi),
      ...text.matchAll(/(?:acct|acc)\s*(?:nbr|number|#)[:\s]+([A-Z0-9]+)/gi),
      ...text.matchAll(/(?:^|\s)([A-Z]{2,}[0-9]{3,})/g),
    ];

    if (accountMatches.length > 0) {
      const examples = [...new Set(accountMatches.map(match => match[1]))].slice(0, 5);
      patterns.push({
        type: 'account',
        pattern: 'account\\s*(?:nbr|number|#)[:\\s]+([A-Z0-9]+)',
        examples,
        confidence: 0.9,
        description: 'Account number pattern',
        validated: false
      });
    }

    // Customer name patterns
    const nameMatches = [
      ...text.matchAll(/customer\s*name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi),
      ...text.matchAll(/bill\s*to[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi),
      ...text.matchAll(/name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi),
    ];

    if (nameMatches.length > 0) {
      const examples = [...new Set(nameMatches.map(match => match[1]))].slice(0, 5);
      patterns.push({
        type: 'name',
        pattern: 'customer\\s*name[:\\s]+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+)',
        examples,
        confidence: 0.85,
        description: 'Customer name pattern',
        validated: false
      });
    }

    // Date patterns
    const dateMatches = [
      ...text.matchAll(/(?:date|due)[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/gi),
      ...text.matchAll(/(\d{1,2}\/\d{1,2}\/\d{4})/g),
    ];

    if (dateMatches.length > 0) {
      const examples = [...new Set(dateMatches.map(match => match[1]))].slice(0, 5);
      patterns.push({
        type: 'date',
        pattern: '(?:date|due)[:\\s]+(\\d{1,2}\\/\\d{1,2}\\/\\d{4})',
        examples,
        confidence: 0.8,
        description: 'Date pattern',
        validated: false
      });
    }

    // Amount patterns
    const amountMatches = [
      ...text.matchAll(/(?:amount|total|balance)[:\s]+\$?(\d+\.?\d*)/gi),
      ...text.matchAll(/\$(\d+\.?\d*)/g),
    ];

    if (amountMatches.length > 0) {
      const examples = [...new Set(amountMatches.map(match => match[1]))].slice(0, 5);
      patterns.push({
        type: 'amount',
        pattern: '(?:amount|total|balance)[:\\s]+\\$?(\\d+\\.?\\d*)',
        examples,
        confidence: 0.75,
        description: 'Amount pattern',
        validated: false
      });
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  };

  const generateSuggestions = (patterns: DiscoveredPattern[]): string[] => {
    const suggestions = [];
    
    if (patterns.some(p => p.type === 'account')) {
      suggestions.push("Account number patterns detected - these can be used for PDF splitting");
    }
    
    if (patterns.some(p => p.type === 'name')) {
      suggestions.push("Customer name patterns found - useful for file naming");
    }
    
    if (patterns.length === 0) {
      suggestions.push("No clear patterns detected. Try a different document or adjust the analysis");
    }
    
    return suggestions;
  };

  const togglePatternSelection = (index: number) => {
    const newSelected = new Set(selectedPatterns);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPatterns(newSelected);
  };

  const saveSelectedPatterns = () => {
    if (!analysisResult) return;

    let savedCount = 0;
    selectedPatterns.forEach(index => {
      const pattern = analysisResult.patterns[index];
      if (pattern.type === 'account') {
        addAccountPattern(pattern.pattern);
        savedCount++;
      } else if (pattern.type === 'name') {
        addNamePattern(pattern.pattern);
        savedCount++;
      }
    });

    toast({
      title: "Patterns Saved",
      description: `${savedCount} patterns added to your pattern library`,
    });

    setSelectedPatterns(new Set());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Pattern Discovery
        </CardTitle>
        <CardDescription>
          Upload a sample PDF to automatically discover patterns for account numbers, names, and other fields
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div>
          <Label htmlFor="pattern-discovery-upload">Upload Sample PDF</Label>
          <div className="mt-2">
            <input
              id="pattern-discovery-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('pattern-discovery-upload')?.click()}
              className="w-full h-20 border-dashed"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm">
                  {file ? file.name : 'Click to upload PDF sample'}
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Analyze Button */}
        {file && (
          <Button 
            onClick={analyzeDocument} 
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze for Patterns
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {analysisResult && (
          <Tabs defaultValue="patterns" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patterns">Discovered Patterns</TabsTrigger>
              <TabsTrigger value="preview">Document Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patterns" className="space-y-4">
              {analysisResult.patterns.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {analysisResult.patterns.map((pattern, index) => (
                      <Card key={index} className={`cursor-pointer transition-colors ${
                        selectedPatterns.has(index) ? 'ring-2 ring-primary' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={pattern.type === 'account' ? 'default' : 'secondary'}>
                                  {pattern.type}
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(pattern.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mb-1">{pattern.description}</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {pattern.pattern}
                              </code>
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Examples found:</p>
                                <div className="flex flex-wrap gap-1">
                                  {pattern.examples.map((example, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {example}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant={selectedPatterns.has(index) ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePatternSelection(index)}
                            >
                              {selectedPatterns.has(index) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                "Select"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedPatterns.size > 0 && (
                    <Button onClick={saveSelectedPatterns} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save {selectedPatterns.size} Selected Pattern{selectedPatterns.size !== 1 ? 's' : ''}
                    </Button>
                  )}

                  {analysisResult.suggestions.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Suggestions:</h4>
                      <ul className="text-sm space-y-1">
                        {analysisResult.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns detected in this document.</p>
                  <p className="text-sm">Try uploading a different PDF with clear field labels.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Document Text Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded">
                      {analysisResult.text.slice(0, 2000)}
                      {analysisResult.text.length > 2000 && '...'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
