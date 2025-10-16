import React, { useState, useEffect } from 'react';
import { Settings, Mail, Key, Globe, User, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig, saveEmailConfig, isConfigValid, resetEmailConfig, EmailConfig } from '@/lib/emailConfig';

const EmailSettings: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig>({
    mailgunDomain: '',
    mailgunApiKey: '',
    fromEmail: '',
    fromName: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load configuration on component mount
  useEffect(() => {
    const savedConfig = getEmailConfig();
    setConfig(savedConfig);
    setIsValid(isConfigValid(savedConfig));
  }, []);

  // Check validity when config changes
  useEffect(() => {
    setIsValid(isConfigValid(config));
  }, [config]);

  const handleConfigChange = (field: keyof EmailConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!isValid) {
      toast({
        title: "Invalid Configuration",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      saveEmailConfig(config);
      setHasChanges(false);
      toast({
        title: "Settings Saved Successfully",
        description: "Your email configuration has been saved and will be used for all email distributions",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save email configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    resetEmailConfig();
    const defaultConfig = getEmailConfig();
    setConfig(defaultConfig);
    setHasChanges(true);
    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset to default values",
    });
  };

  const getStatusIcon = () => {
    if (isValid) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (isValid) {
      return <Badge className="bg-green-100 text-green-700">Configuration Valid</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Configuration Required</Badge>;
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Email Settings
            {getStatusIcon()}
          </h1>
          <p className="text-gray-600 mt-2">
            Configure your email settings for the Email Distribution tool. These settings will be used for all email campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Current Status Overview */}
      <Card className={`border-2 ${isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <div className="font-semibold">
                  {isValid ? 'Email Configuration Ready' : 'Email Configuration Required'}
                </div>
                <div className="text-sm text-gray-600">
                  {isValid 
                    ? 'Your email settings are configured and ready for use in the Email Distribution tool'
                    : 'Please complete the configuration below to enable email sending'
                  }
                </div>
              </div>
            </div>
            {isValid && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Ready to send emails</div>
                <div className="text-xs text-gray-500">All settings validated</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sender Information
          </CardTitle>
          <CardDescription>
            Configure who the emails will appear to be sent from. This information will be visible to recipients.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                From Name
              </Label>
              <Input
                id="fromName"
                value={config.fromName}
                onChange={(e) => handleConfigChange('fromName', e.target.value)}
                placeholder="e.g., New Water Systems, Inc."
              />
              <div className="text-xs text-gray-500">
                The company or person name that will appear in the email
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                From Email Address
              </Label>
              <Input
                id="fromEmail"
                type="email"
                value={config.fromEmail}
                onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                placeholder="e.g., statement@newwaterbills.com"
              />
              <div className="text-xs text-gray-500">
                The email address that emails will be sent from
              </div>
            </div>
          </div>
          
          {/* Email Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2 font-medium">Email Preview:</div>
            <div className="font-mono text-sm bg-white p-3 rounded border">
              From: {config.fromName || '[From Name]'} &lt;{config.fromEmail || '[from-email@domain.com]'}&gt;
            </div>
            <div className="text-xs text-gray-500 mt-2">
              This is how your emails will appear to recipients
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mailgun Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Mailgun Configuration
          </CardTitle>
          <CardDescription>
            Your Mailgun domain and API key for sending emails. Get these from your Mailgun dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mailgunDomain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Mailgun Domain
            </Label>
            <Input
              id="mailgunDomain"
              value={config.mailgunDomain}
              onChange={(e) => handleConfigChange('mailgunDomain', e.target.value)}
              placeholder="e.g., newwaterbill.com"
            />
            <div className="text-xs text-gray-500">
              Your verified domain in Mailgun (without 'mg.' prefix)
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mailgunApiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Mailgun API Key
            </Label>
            <div className="relative">
              <Input
                id="mailgunApiKey"
                type={showApiKey ? "text" : "password"}
                value={config.mailgunApiKey}
                onChange={(e) => handleConfigChange('mailgunApiKey', e.target.value)}
                placeholder="key-your-mailgun-api-key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Your private API key from Mailgun (starts with 'key-')
            </div>
          </div>

          {/* Mailgun Setup Help */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800 font-medium mb-2">Need help setting up Mailgun?</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>1. Sign up at <a href="https://mailgun.com" target="_blank" rel="noopener noreferrer" className="underline">mailgun.com</a></div>
              <div>2. Verify your domain in the Mailgun dashboard</div>
              <div>3. Copy your domain and API key from the dashboard</div>
              <div>4. Enter them in the fields above</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="outline"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
          
          {!isValid && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>Configuration Incomplete:</strong> Please complete all fields above to enable email sending in the Email Distribution tool.
              </div>
            </div>
          )}

          {isValid && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Ready to Go:</strong> Your email configuration is complete and will be automatically used in the Email Distribution tool.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;
