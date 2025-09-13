import React, { useState, useEffect } from 'react';
import { Save, Folder, FileText, Trash2, Eye, Plus, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

interface TemplateLibraryProps {
  onTemplateSelect: (template: EmailTemplate) => void;
  currentTemplate?: { subject: string; content: string };
  onSaveTemplate?: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
  currentTemplate,
  onSaveTemplate
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<EmailTemplate['category']>('custom');
  const { toast } = useToast();

  // Default templates
  const defaultTemplates: EmailTemplate[] = [
    {
      id: 'billing-statement',
      name: 'Monthly Statement',
      subject: 'Your {{companyName}} Statement - {{currentDate}}',
      content: `<p>Dear {{customerName}},</p>

<p>Please find attached your monthly statement for account <strong>{{accountNumber}}</strong>.</p>

<p>If you have any questions about your statement, please don't hesitate to contact us at {{supportEmail}} or call our customer service line.</p>

<p>Thank you for choosing {{companyName}}.</p>

<p>Best regards,<br>
{{companyName}} Team</p>`,
      category: 'billing',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      useCount: 0
    },
    {
      id: 'payment-reminder',
      name: 'Payment Reminder',
      subject: 'Payment Reminder - Account {{accountNumber}}',
      content: `<p>Dear {{customerName}},</p>

<p>This is a friendly reminder that your payment for account <strong>{{accountNumber}}</strong> is due.</p>

<p>Please find your statement attached for your reference. If you have already made this payment, please disregard this notice.</p>

<p>For questions about your account, please contact us at {{supportEmail}}.</p>

<p>Thank you,<br>
{{companyName}} Billing Department</p>`,
      category: 'reminder',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      useCount: 0
    },
    {
      id: 'welcome-new-customer',
      name: 'Welcome New Customer',
      subject: 'Welcome to {{companyName}}!',
      content: `<p>Dear {{customerName}},</p>

<p>Welcome to {{companyName}}! We're excited to have you as a customer.</p>

<p>Your account number is <strong>{{accountNumber}}</strong>. Please keep this for your records.</p>

<p>Attached you'll find important information about your account and our services.</p>

<p>If you have any questions, please don't hesitate to reach out to us at {{supportEmail}}.</p>

<p>Welcome aboard!</p>

<p>Best regards,<br>
The {{companyName}} Team</p>`,
      category: 'general',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      useCount: 0
    }
  ];

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('emailTemplates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...defaultTemplates, ...parsed]);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates: EmailTemplate[]) => {
    const customTemplates = newTemplates.filter(t => !t.isDefault);
    localStorage.setItem('emailTemplates', JSON.stringify(customTemplates));
    setTemplates(newTemplates);
  };

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'billing', name: 'Billing', count: templates.filter(t => t.category === 'billing').length },
    { id: 'general', name: 'General', count: templates.filter(t => t.category === 'general').length },
    { id: 'reminder', name: 'Reminders', count: templates.filter(t => t.category === 'reminder').length },
    { id: 'custom', name: 'Custom', count: templates.filter(t => t.category === 'custom').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    // Update use count and last used
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, useCount: t.useCount + 1, lastUsed: new Date() }
        : t
    );
    saveTemplates(updatedTemplates);
    onTemplateSelect(template);
    
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied to your email`,
    });
  };

  const handleSaveCurrentTemplate = () => {
    if (!currentTemplate || !newTemplateName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a template name and ensure you have content to save",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: EmailTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      subject: currentTemplate.subject,
      content: currentTemplate.content,
      category: newTemplateCategory,
      createdAt: new Date(),
      useCount: 0
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    
    if (onSaveTemplate) {
      onSaveTemplate(newTemplate);
    }

    setShowSaveDialog(false);
    setNewTemplateName('');
    setNewTemplateCategory('custom');

    toast({
      title: "Template Saved",
      description: `"${newTemplate.name}" has been saved to your template library`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default templates cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);

    toast({
      title: "Template Deleted",
      description: "Template has been removed from your library",
    });
  };

  const getCategoryBadgeColor = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'billing': return 'bg-blue-100 text-blue-700';
      case 'general': return 'bg-green-100 text-green-700';
      case 'reminder': return 'bg-yellow-100 text-yellow-700';
      case 'custom': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Template Library</h3>
          <p className="text-sm text-muted-foreground">
            Choose from pre-built templates or save your own
          </p>
        </div>
        
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button disabled={!currentTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Email Template</DialogTitle>
              <DialogDescription>
                Save your current email template to the library for future use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <select
                  id="template-category"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as EmailTemplate['category'])}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="custom">Custom</option>
                  <option value="billing">Billing</option>
                  <option value="general">General</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveCurrentTemplate} className="flex-1">
                  Save Template
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {template.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <Badge className={`text-xs ${getCategoryBadgeColor(template.category)}`}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Template Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.lastUsed 
                      ? `Used ${template.lastUsed.toLocaleDateString()}`
                      : 'Never used'
                    }
                  </div>
                  <div>
                    {template.useCount} uses
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="flex-1"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Use
                  </Button>
                  {!template.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No templates match your search' : 'No templates in this category'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
