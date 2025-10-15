import React, { useState, useEffect } from 'react';
import { Mail, Save, Eye, Plus, Settings, Star, Trash2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/email/RichTextEditor';
import TemplateLibrary from '@/components/email/TemplateLibrary';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'billing' | 'general' | 'reminder' | 'custom';
  isDefault?: boolean;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

const TemplateManager: React.FC = () => {
  const [subject, setSubject] = useState('Your New Water Systems Statement');
  const [emailBody, setEmailBody] = useState(`Dear {{customerName}},<br>
<br>
Please find attached your {{currentMonth}} statement for account {{accountNumber}}.<br>
<br>
Pay your New Water Systems bill now at:<br>
http://www.newwaterbill.com/<br>
<br>
Thank you,<br>
New Water Systems, Inc.`);
  const [activeTab, setActiveTab] = useState('editor');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  // Sample data for preview
  const sampleData = {
    customerName: 'John Smith',
    accountNumber: 'NWS-12345',
    currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    currentDate: new Date().toLocaleDateString(),
    companyName: 'New Water Systems',
    supportEmail: 'support@newwatersystems.com'
  };

  // Load templates and default template on component mount
  useEffect(() => {
    loadTemplates();
    loadDefaultTemplate();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('emailTemplates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadDefaultTemplate = () => {
    try {
      const defaultTemplate = localStorage.getItem('defaultEmailTemplate');
      if (defaultTemplate) {
        const parsed = JSON.parse(defaultTemplate);
        setSubject(parsed.subject);
        setEmailBody(parsed.content);
      } else {
        // If no default template exists, save the current one as default
        const newDefaultTemplate = {
          subject: 'Your New Water Systems Statement',
          content: `Dear {{customerName}},<br>
<br>
Please find attached your {{currentMonth}} statement for account {{accountNumber}}.<br>
<br>
Pay your New Water Systems bill now at:<br>
http://www.newwaterbill.com/<br>
<br>
Thank you,<br>
New Water Systems, Inc.`,
          version: '2.1',
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('defaultEmailTemplate', JSON.stringify(newDefaultTemplate));
      }
    } catch (error) {
      console.error('Error loading default template:', error);
    }
  };

  const saveDefaultTemplate = () => {
    try {
      const defaultTemplate = {
        subject,
        content: emailBody,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('defaultEmailTemplate', JSON.stringify(defaultTemplate));
      
      toast({
        title: "Default Template Saved",
        description: "This template will now load by default in the Email Distribution tool",
      });
    } catch (error) {
      console.error('Error saving default template:', error);
      toast({
        title: "Error",
        description: "Failed to save default template",
        variant: "destructive",
      });
    }
  };

  const processTemplate = (template: string): string => {
    return template
      .replace(/\{\{customerName\}\}/g, sampleData.customerName)
      .replace(/\{\{accountNumber\}\}/g, sampleData.accountNumber)
      .replace(/\{\{currentDate\}\}/g, sampleData.currentDate)
      .replace(/\{\{companyName\}\}/g, sampleData.companyName)
      .replace(/\{\{supportEmail\}\}/g, sampleData.supportEmail);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject);
    setEmailBody(template.content);
    setEditingTemplate(template);
    setActiveTab('editor');
    toast({
      title: "Template Loaded",
      description: `"${template.name}" template has been loaded for editing`,
    });
  };

  const saveCurrentTemplate = (templateName: string, category: EmailTemplate['category']) => {
    if (!templateName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a template name",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: EmailTemplate = {
      id: editingTemplate?.id || `template-${Date.now()}`,
      name: templateName.trim(),
      subject,
      content: emailBody,
      category,
      createdAt: editingTemplate?.createdAt || new Date(),
      useCount: editingTemplate?.useCount || 0
    };

    try {
      const updatedTemplates = editingTemplate 
        ? templates.map(t => t.id === editingTemplate.id ? newTemplate : t)
        : [...templates, newTemplate];
      
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
      setEditingTemplate(newTemplate);
      
      toast({
        title: editingTemplate ? "Template Updated" : "Template Saved",
        description: `"${templateName}" has been ${editingTemplate ? 'updated' : 'saved'} to your library`,
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const createNewTemplate = () => {
    setSubject('');
    setEmailBody('<p>Dear {{customerName}},</p>\n\n<p>Your content here...</p>\n\n<p>Best regards,<br>New Water Systems Team</p>');
    setEditingTemplate(null);
    setIsCreatingNew(true);
    setActiveTab('editor');
  };

  const resetToDefault = () => {
    setSubject('Your New Water Systems Statement');
    setEmailBody(`<p>Dear {{customerName}},</p>

<p>Please find attached your New Water Systems statement for account <strong>{{accountNumber}}</strong>.</p>

<p>If you have any questions about your statement, please don't hesitate to contact us.</p>

<p>Thank you for choosing New Water Systems.</p>

<p>Best regards,<br>
New Water Systems Team</p>`);
    setEditingTemplate(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Template Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Create, edit, and manage your email templates. Set default templates for the Email Distribution tool.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
          <Button onClick={saveDefaultTemplate} variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Save as Default
          </Button>
        </div>
      </div>

      {/* Current Template Info */}
      {(editingTemplate || isCreatingNew) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {isCreatingNew ? 'Creating New Template' : `Editing: ${editingTemplate?.name}`}
                </span>
              </div>
              <Button onClick={resetToDefault} variant="ghost" size="sm">
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Template Editor
          </CardTitle>
          <CardDescription>
            Create and edit professional email templates with rich formatting and dynamic variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Template Library
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
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
                  saveCurrentTemplate(template.name, template.category);
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

              {/* Quick Save Options */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={saveDefaultTemplate} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save as Default Template
                </Button>
                <Button 
                  onClick={() => setActiveTab('preview')} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Template
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Email Preview (with sample data)</h3>
                <div className="bg-white p-6 rounded border shadow-sm">
                  <div className="border-b pb-4 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>From:</strong> New Water Systems, Inc. &lt;statements@newwaterbill.com&gt;
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>To:</strong> {sampleData.customerName} &lt;customer@example.com&gt;
                    </div>
                    <div className="text-lg font-semibold mt-2">
                      <strong>Subject:</strong> {processTemplate(subject)}
                    </div>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: processTemplate(emailBody) }}
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Sample Data Used:</strong> Customer Name: {sampleData.customerName}, 
                Account: {sampleData.accountNumber}, Date: {sampleData.currentDate}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateManager;
