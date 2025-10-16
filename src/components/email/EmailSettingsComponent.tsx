import React, { useState, useEffect } from 'react';
import { Settings, Mail, Key, Globe, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig, saveEmailConfig, isConfigValid, EmailConfig } from '@/lib/emailConfig';

interface EmailSettingsComponentProps {
  onSettingsConfirmed: () => void;
  isProcessing: boolean;
  recipientCount: number;
}

const EmailSettingsComponent: React.FC<EmailSettingsComponentProps> = ({
  onSettingsConfirmed,
  isProcessing,
  recipientCount
}) => {
  const [config, setConfig] = useState<EmailConfig>({
    mailgunDomain: '',
    mailgunApiKey: '',
    fromEmail: '',
    fromName: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
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

  const saveSettings = () => {
    if (!isValid) {
      toast({
        title: "Invalid Configuration",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    try {
      saveEmailConfig(config);
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Email configuration has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save email configuration",
        variant: "destructive",
      });
    }
  };

  const confirmAndProceed = () => {
    if (!isValid) {
      toast({
        title: "Invalid Configuration",
        description: "Please configure valid email settings before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (hasChanges) {
      saveSettings();
    }

    onSettingsConfirmed();
  };

  const resetToDefaults = () => {
    const defaultConfig = getEmailConfig();
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const getStatusIcon = () => {
    if (isValid) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (isValid) {
      return <Badge className="bg-green-100 text-green-700">Ready to Send</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Configuration Required</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Settings Configuration
            {getStatusIcon()}
          </CardTitle>
          <CardDescription>
            Review and configure your email settings before sending to {recipientCount} recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-sm text-gray-600">
                {isValid ? 'All settings configured correctly' : 'Please complete configuration'}
              </span>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sender Information
          </CardTitle>
          <CardDescription>
            Configure who the emails will appear to be sent from
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                From Email
              </Label>
              <Input
                id="fromEmail"
                type="email"
                value={config.fromEmail}
                onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                placeholder="e.g., statement@newwaterbill.com"
              />
            </div>
          </div>
          
          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">Email Preview:</div>
            <div className="font-medium">
              From: {config.fromName || 'Your Company'} &lt;{config.fromEmail || 'email@domain.com'}&gt;
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
            Your Mailgun domain and API key for sending emails
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
          </div>

          {/* Configuration Status */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Current Status:</strong> {isValid ? 'Configuration is valid and ready' : 'Configuration incomplete or invalid'}
            </div>
            {!isValid && (
              <div className="text-xs text-blue-600 mt-1">
                Please ensure all fields are filled with valid values
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={saveSettings}
              variant="outline"
              disabled={!hasChanges || isProcessing}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Save Settings
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="ghost"
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              Reset to Defaults
            </Button>
            
            <Button
              onClick={confirmAndProceed}
              disabled={!isValid || isProcessing}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Settings & Continue
            </Button>
          </div>
          
          {!isValid && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <strong>Action Required:</strong> Please complete the email configuration above before proceeding to send emails.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettingsComponent;
