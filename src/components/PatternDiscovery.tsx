import React, { useState, useCallback } from 'react';
import { Upload, Search, Save, Eye, Lightbulb, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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
  type: 'account' | 'name' | 'address' | 'date' | 'currency' | 'field_label';
  pattern: string;
  description: string;
  examples: string[];
  confidence: number;
  frequency: number;
}

interface AnalysisResult {
  text: string;
  patterns: DiscoveredPattern[];
  suggestions: string[];
}

export default function PatternDiscovery() {
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

  const analyzePatterns = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Analyze first 5 pages
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Discover patterns
      const discoveredPatterns = discoverPatterns(fullText);
      const suggestions = generateSuggestions(fullText, discoveredPatterns);

      setAnalysisResult({
        text: fullText,
        patterns: discoveredPatterns,
        suggestions
      });

      toast({
        title: "Analysis Complete",
        description: `Found ${discoveredPatterns.length} potential patterns`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the PDF file",
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
      { regex: /\b[A-Z]{2,6}\d{4,8}\b/g, desc: "Alphanumeric account codes" },
      { regex: /\b\d{6,12}\b/g, desc: "Numeric account numbers" },
      { regex: /account\s*(?:number|nbr|#)[:\s]+([A-Z0-9]+)/gi, desc: "Labeled account numbers" },
    ];

    accountMatches.forEach(({ regex, desc }) => {
      const matches = Array.from(text.matchAll(regex));
      if (matches.length > 0) {
        const examples = [...new Set(matches.map(m => m[0] || m[1]).slice(0, 5))];
        patterns.push({
          type: 'account',
          pattern: regex.source,
          description: desc,
          examples,
          confidence: Math.min(matches.length / 10, 1),
          frequency: matches.length
        });
      }
    });

    // Name patterns
    const nameMatches = [
      { regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, desc: "First Last names" },
      { regex: /\b[A-Z][a-z]+\s*&\s*[A-Z][a-z]+\s+[A-Z][a-z]+/g, desc: "Couple names" },
      { regex: /(?:customer|name|bill\s*to)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, desc: "Labeled customer names" },
    ];

    nameMatches.forEach(({ regex, desc }) => {
      const matches = Array.from(text.matchAll(regex));
      if (matches.length > 0) {
        const examples = [...new Set(matches.map(m => m[0] || m[1]).slice(0, 5))];
        patterns.push({
          type: 'name',
          pattern: regex.source,
          description: desc,
          examples,
          confidence: Math.min(matches.length / 5, 1),
          frequency: matches.length
        });
      }
    });

    // Date patterns
    const dateMatches = [
      { regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, desc: "MM/DD/YYYY dates" },
      { regex: /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, desc: "MM-DD-YYYY dates" },
      { regex: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, desc: "Month DD, YYYY dates" },
    ];

    dateMatches.forEach(({ regex, desc }) => {
      const matches = Array.from(text.matchAll(regex));
      if (matches.length > 0) {
        const examples = [...new Set(matches.map(m => m[0]).slice(0, 3))];
        patterns.push({
          type: 'date',
          pattern: regex.source,
          description: desc,
          examples,
          confidence: Math.min(matches.length / 3, 1),
          frequency: matches.length
        });
      }
    });

    // Currency patterns
    const currencyMatches = [
      { regex: /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, desc: "Dollar amounts" },
      { regex: /\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g, desc: "Decimal amounts" },
    ];

    currencyMatches.forEach(({ regex, desc }) => {
      const matches = Array.from(text.matchAll(regex));
      if (matches.length > 0) {
        const examples = [...new Set(matches.map(m => m[0]).slice(0, 3))];
        patterns.push({
          type: 'currency',
          pattern: regex.source,
          description: desc,
          examples,
          confidence: Math.min(matches.length / 5, 1),
          frequency: matches.length
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  };

  const generateSuggestions = (text: string, patterns: DiscoveredPattern[]): string[] => {
    const suggestions: string[] = [];

    // Analyze text structure
    if (text.includes('Customer Name:') || text.includes('customer name:')) {
      suggestions.push("Document uses 'Customer Name:' labels - patterns can target this structure");
    }
    
    if (text.includes('Account') || text.includes('account')) {
      suggestions.push("Document contains account references - look for consistent numbering patterns");
    }

    if (patterns.filter(p => p.type === 'account').length > 1) {
      suggestions.push("Multiple account number formats detected - consider creating separate patterns for each");
    }

    if (patterns.filter(p => p.type === 'name').length > 1) {
      suggestions.push("Various name formats found - patterns should handle different name structures");
    }

    return suggestions;
  };

  const togglePatternSelection = (index: number) => {
    const newSelection = new Set(selectedPatterns);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedPatterns(newSelection);
  };

  const saveSelectedPatterns = () => {
    if (!analysisResult || selectedPatterns.size === 0) return;

    let savedCount = 0;
    let skippedCount = 0;

    selectedPatterns.forEach(index => {
      const pattern = analysisResult.patterns[index];
      if (pattern.type === 'account') {
        addAccountPattern(pattern.pattern);
        savedCount++;
      } else if (pattern.type === 'name') {
        addNamePattern(pattern.pattern);
        savedCount++;
      } else {
        skippedCount++;
      }
    });

    const message = savedCount > 0
      ? `${savedCount} patterns added to your pattern library`
      : "No saveable patterns selected";

    if (skippedCount > 0) {
      toast({
        title: "Patterns Saved",
        description: `${message}. ${skippedCount} patterns skipped (only account and name patterns can be saved).`,
      });
    } else {
      toast({
        title: "Patterns Saved",
        description: message,
      });
    }

    setSelectedPatterns(new Set());
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'account': return '🔢';
      case 'name': return '👤';
      case 'date': return '📅';
      case 'currency': return '💰';
      case 'address': return '📍';
      case 'field_label': return '🏷️';
      default: return '📄';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Pattern Discovery Tool
        </CardTitle>
        <CardDescription>
          Upload a sample PDF to automatically analyze and discover data patterns for account numbers, names, and other fields using advanced pattern recognition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div>
          <Label htmlFor="pattern-pdf">Upload Sample PDF</Label>
          <div className="mt-2">
            <Input
              id="pattern-pdf"
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
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {file && (
          <Button 
            onClick={analyzePatterns} 
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Analyzing PDF...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Discover Patterns
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {analysisResult && (
          <Tabs defaultValue="patterns" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patterns">Discovered Patterns</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patterns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Found {analysisResult.patterns.length} patterns</h3>
                {selectedPatterns.size > 0 && (
                  <Button onClick={saveSelectedPatterns}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Selected ({selectedPatterns.size})
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {analysisResult.patterns.map((pattern, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-colors ${
                      selectedPatterns.has(index) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => togglePatternSelection(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getTypeIcon(pattern.type)}</span>
                            <Badge variant="outline" className="capitalize">
                              {pattern.type}
                            </Badge>
                            <Badge className={getConfidenceColor(pattern.confidence)}>
                              {Math.round(pattern.confidence * 100)}% confidence
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ({pattern.frequency} matches)
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium mb-2">{pattern.description}</p>
                          
                          <code className="text-xs bg-muted p-2 rounded block mb-2 font-mono">
                            {pattern.pattern}
                          </code>
                          
                          <div className="flex flex-wrap gap-1">
                            {pattern.examples.map((example, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {selectedPatterns.has(index) ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-muted rounded" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="suggestions" className="space-y-4">
              <h3 className="text-lg font-medium">Analysis Suggestions</h3>
              <div className="space-y-2">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
