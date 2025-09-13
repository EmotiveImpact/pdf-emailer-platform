import React, { useState } from 'react';
import { Mail, Eye, Save, FileText, User, Calendar, Library, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from './RichTextEditor';
import TemplateLibrary from './TemplateLibrary';

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

interface EmailTemplateComponentProps {
  matchedData: MatchedData[];
  onTemplateReady: (template: string) => void;
  isProcessing: boolean;
}

const EmailTemplateComponent: React.FC<EmailTemplateComponentProps> = ({
  matchedData,
  onTemplateReady,
  isProcessing
}) => {
  const [subject, setSubject] = useState('Your New Water Systems Statement');
  const [emailBody, setEmailBody] = useState(`<p>Dear {{customerName}},</p>

<p>Please find attached your New Water Systems statement for account <strong>{{accountNumber}}</strong>.</p>

<p>If you have any questions about your statement, please don't hesitate to contact us.</p>

<p>Thank you for choosing New Water Systems.</p>

<p>Best regards,<br>
New Water Systems Team</p>`);
  const [previewData, setPreviewData] = useState<MatchedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();

  const availableVariables = [
    { name: '{{customerName}}', description: 'Customer\'s full name', icon: User },
    { name: '{{accountNumber}}', description: 'Account number', icon: FileText },
    { name: '{{currentDate}}', description: 'Current date', icon: Calendar },
    { name: '{{companyName}}', description: 'Company name', icon: FileText },
    { name: '{{supportEmail}}', description: 'Support email address', icon: Mail }
  ];

  const matchedFiles = matchedData.filter(m => m.matched);

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = emailBody.substring(0, start) + variable + emailBody.substring(end);
      setEmailBody(newText);
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const cleanCustomerName = (name: string): string => {
    return name
      .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}/g, '') // Remove dates like 12/25/2023, 12-25-23, 12/25
      .replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g, '') // Remove dates like 2023/12/25
      .replace(/\d{1,2}[\/\-]\d{1,2}/g, '') // Remove partial dates like 12/25
      .replace(/\d{4}/g, '') // Remove years like 2025, 2024
      .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\d{0,4}\b/gi, '') // Remove month names with years
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\d{0,4}\b/gi, '') // Remove abbreviated month names with years
      .replace(/[_\-\s]+/g, ' ') // Replace multiple separators with single space
      .trim() || 'Customer';
  };

  const processTemplate = (template: string, data: MatchedData): string => {
    const cleanName = cleanCustomerName(data.customer.customerName);
    return template
      .replace(/\{\{customerName\}\}/g, cleanName)
      .replace(/\{\{accountNumber\}\}/g, data.customer.accountNumber)
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{companyName\}\}/g, 'New Water Systems')
      .replace(/\{\{supportEmail\}\}/g, 'support@newwatersystems.com');
  };

  const previewEmail = () => {
    if (matchedFiles.length === 0) {
      toast({
        title: "No Data Available",
        description: "No matched customer data available for preview",
        variant: "destructive",
      });
      return;
    }

    setPreviewData(matchedFiles[0]);
    setActiveTab('preview');
  };

  // Auto-set preview data when component loads
  React.useEffect(() => {
    if (matchedFiles.length > 0 && !previewData) {
      setPreviewData(matchedFiles[0]);
    }
  }, [matchedFiles, previewData]);

  const saveTemplate = () => {
    if (!subject.trim() || !emailBody.trim()) {
      toast({
        title: "Template Incomplete",
        description: "Please provide both subject and email body",
        variant: "destructive",
      });
      return;
    }

    const fullTemplate = `Subject: ${subject}\n\n${emailBody}`;
    onTemplateReady(fullTemplate);
    
    toast({
      title: "Template Saved",
      description: "Email template is ready for sending",
    });
  };

  const loadDefaultTemplate = () => {
    setSubject('Your New Water Systems Statement');
    setEmailBody(`<p>Dear {{customerName}},</p>

<p>Please find attached your New Water Systems statement for account <strong>{{accountNumber}}</strong>.</p>

<p>If you have any questions about your statement, please don't hesitate to contact us.</p>

<p>Thank you for choosing New Water Systems.</p>

<p>Best regards,<br>
New Water Systems Team</p>`);
  };

  const handleTemplateSelect = (template: any) => {
    setSubject(template.subject);
    setEmailBody(template.content);
    setActiveTab('editor');
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been loaded`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Template Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Professional Email Template
          </CardTitle>
          <CardDescription>
            Create rich, professional email templates for your customers ({matchedFiles.length} recipients)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Template Library
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Rich Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Template Library Tab */}
            <TabsContent value="library" className="space-y-4">
              <TemplateLibrary
                onTemplateSelect={handleTemplateSelect}
                currentTemplate={{ subject, content: emailBody }}
                onSaveTemplate={(template) => {
                  toast({
                    title: "Template Saved",
                    description: `"${template.name}" has been saved to your library`,
                  });
                }}
              />
            </TabsContent>

            {/* Rich Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject line"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <Label>Email Content</Label>
                <RichTextEditor
                  content={emailBody}
                  onChange={setEmailBody}
                  placeholder="Create your professional email content..."
                />
              </div>

              {/* Template Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadDefaultTemplate}>
                  Load Default Template
                </Button>
                <Button variant="outline" onClick={previewEmail}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
                <Button onClick={saveTemplate} disabled={isProcessing}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {matchedFiles.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Email Preview</h4>
                    <div className="flex gap-2">
                      {matchedFiles.slice(0, 3).map((match, index) => (
                        <Button
                          key={index}
                          variant={previewData?.customer.email === match.customer.email ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreviewData(match)}
                        >
                          {match.customer.customerName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {previewData && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="space-y-3">
                        <div className="border-b pb-2">
                          <div className="text-sm text-muted-foreground">To:</div>
                          <div className="font-medium">{previewData.customer.email}</div>
                        </div>

                        <div className="border-b pb-2">
                          <div className="text-sm text-muted-foreground">Subject:</div>
                          <div className="font-medium">{processTemplate(subject, previewData)}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Message:</div>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: processTemplate(emailBody, previewData)
                            }}
                          />
                        </div>

                        <div className="border-t pt-2">
                          <div className="text-sm text-muted-foreground">Attachment:</div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-red-600" />
                            {previewData.pdf.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No customer data available for preview
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>



      {/* Template Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Template Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Recipients:</span>
                <span className="font-medium">{matchedFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subject Length:</span>
                <span className="font-medium">{subject.length} characters</span>
              </div>
              <div className="flex justify-between">
                <span>Body Length:</span>
                <span className="font-medium">{emailBody.length} characters</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Variables Used:</span>
                <span className="font-medium">
                  {availableVariables.filter(v => 
                    subject.includes(v.name) || emailBody.includes(v.name)
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Template Ready:</span>
                <span className={`font-medium ${subject.trim() && emailBody.trim() ? 'text-green-600' : 'text-red-600'}`}>
                  {subject.trim() && emailBody.trim() ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateComponent;
