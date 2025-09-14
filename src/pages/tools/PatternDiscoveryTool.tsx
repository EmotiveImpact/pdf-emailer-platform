import React from 'react';
import { ArrowLeft, Sparkles, FileText, Search, TestTube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PatternDiscovery from '@/components/PatternDiscovery';
import PatternManager from '@/components/PatternManager';
import PatternTester from '@/components/PatternTester';

export default function PatternDiscoveryPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Smart Pattern Discovery</h1>
          <p className="text-muted-foreground">
            Automatically discover and save patterns from your PDF documents
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              Upload Sample
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload a representative PDF document to analyze its structure and content patterns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-green-500" />
              Smart Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced algorithms analyze the document to identify account numbers, names, dates, and other patterns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Save Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review and save discovered patterns to your library for use in the PDF splitter tool.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <PatternDiscovery />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <PatternTester />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Pattern Library Management</h2>
            <PatternManager />
          </div>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Learn how to use the Smart Pattern Discovery tool effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">📄 Best Practices for Sample Documents</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use a typical, well-formatted PDF from your collection</li>
                <li>• Ensure the document contains clear field labels</li>
                <li>• Choose documents with consistent formatting</li>
                <li>• Multi-page documents work best for comprehensive analysis</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🎯 Pattern Types Detected</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Account Numbers:</strong> Customer account identifiers</li>
                <li>• <strong>Customer Names:</strong> Individual or business names</li>
                <li>• <strong>Dates:</strong> Bill dates, due dates, service periods</li>
                <li>• <strong>Amounts:</strong> Billing amounts, balances, totals</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-blue-800">
              After discovering patterns, test them with the PDF Splitter tool to ensure they work correctly 
              with your document collection. You can always refine patterns manually if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
