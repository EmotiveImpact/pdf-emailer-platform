import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Clock, Mail, Settings, Calendar, TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmailScheduler from './EmailScheduler';
import { getEmailConfig, saveEmailConfig, isConfigValid } from '@/lib/emailConfig';

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

interface EmailResult {
  customer: CustomerData;
  success: boolean;
  error?: string;
}

interface EmailSendingComponentProps {
  matchedData: MatchedData[];
  emailTemplate: string;
  onSendingComplete: () => void;
  isProcessing: boolean;
  onProgressUpdate: (progress: number) => void;
}

const EmailSendingComponent: React.FC<EmailSendingComponentProps> = ({
  matchedData,
  emailTemplate,
  onSendingComplete,
  isProcessing,
  onProgressUpdate
}) => {
  // Load configuration from storage on component mount
  const [mailgunDomain, setMailgunDomain] = useState('');
  const [mailgunApiKey, setMailgunApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('statements@newwaterbill.com');
  const [fromName, setFromName] = useState('New Water Systems, Inc.');
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [currentlySending, setCurrentlySending] = useState('');
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [showConfig, setShowConfig] = useState(true);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('test');
  const [configValid, setConfigValid] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const { toast } = useToast();

  // Load configuration on component mount
  useEffect(() => {
    const config = getEmailConfig();
    setMailgunDomain(config.mailgunDomain);
    setMailgunApiKey(config.mailgunApiKey);
    setFromEmail(config.fromEmail);
    setFromName(config.fromName);
    setConfigValid(isConfigValid(config));
  }, []);

  // Save configuration when values change
  useEffect(() => {
    const config = {
      mailgunDomain,
      mailgunApiKey,
      fromEmail,
      fromName
    };
    saveEmailConfig(config);
    setConfigValid(isConfigValid(config));
  }, [mailgunDomain, mailgunApiKey, fromEmail, fromName]);

  const matchedFiles = matchedData.filter(m => m.matched);

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

  const processTemplate = (template: string, data: MatchedData): { subject: string; body: string } => {
    const lines = template.split('\n');
    const subjectLine = lines.find(line => line.startsWith('Subject:'));
    const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : 'Your Statement';
    const body = lines.slice(lines.findIndex(line => line.startsWith('Subject:')) + 1).join('\n').trim();

    const cleanName = cleanCustomerName(data.customer.customerName);

    // Get current month and year (e.g., "October 2025")
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const processedSubject = subject
      .replace(/\{\{customerName\}\}/g, cleanName)
      .replace(/\{\{accountNumber\}\}/g, data.customer.accountNumber)
      .replace(/\{\{currentMonth\}\}/g, currentMonth)
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString());

    const processedBody = body
      .replace(/\{\{customerName\}\}/g, cleanName)
      .replace(/\{\{accountNumber\}\}/g, data.customer.accountNumber)
      .replace(/\{\{currentMonth\}\}/g, currentMonth)
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString());

    return { subject: processedSubject, body: processedBody };
  };

  const sendSingleEmail = async (matchData: MatchedData): Promise<EmailResult> => {
    const { subject, body } = processTemplate(emailTemplate, matchData);
    
    // Create FormData for Mailgun API
    const formData = new FormData();
    formData.append('from', `${fromName} <${fromEmail}>`);
    formData.append('to', matchData.customer.email);
    formData.append('subject', subject);
    formData.append('html', body);
    
    // Attach PDF
    formData.append('attachment', matchData.pdf.blob, matchData.pdf.name);

    try {
      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return {
        customer: matchData.customer,
        success: true
      };
    } catch (error) {
      return {
        customer: matchData.customer,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid test email address",
        variant: "destructive",
      });
      return;
    }

    if (!mailgunDomain || !mailgunApiKey) {
      toast({
        title: "Configuration Required",
        description: "Please provide Mailgun domain and API key",
        variant: "destructive",
      });
      return;
    }

    if (matchedFiles.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please complete the previous steps to have sample data for testing",
        variant: "destructive",
      });
      return;
    }

    setIsTestSending(true);

    try {
      // Use the first matched file as sample data for the test
      const sampleData = matchedFiles[0];
      const { subject, body } = processTemplate(emailTemplate, sampleData);

      // Create FormData for Mailgun API
      const formData = new FormData();
      formData.append('from', `${fromName} <${fromEmail}>`);
      formData.append('to', testEmail);
      formData.append('subject', `[TEST] ${subject}`);
      formData.append('html', `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">🧪 TEST EMAIL</h3>
          <p style="color: #856404; margin: 0; font-size: 14px;">
            This is a test email to preview the format and content.
            The actual emails sent to customers will not include this notice.
          </p>
        </div>
        ${body}
      `);

      // Attach the sample PDF
      formData.append('attachment', sampleData.pdf.blob, sampleData.pdf.name);

      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: "Test Email Sent!",
        description: `Test email sent successfully to ${testEmail}`,
      });

    } catch (error) {
      toast({
        title: "Test Email Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsTestSending(false);
    }
  };

  const sendAllEmails = async () => {
    if (!mailgunDomain || !mailgunApiKey) {
      toast({
        title: "Configuration Required",
        description: "Please provide Mailgun domain and API key",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setEmailResults([]);
    
    const results: EmailResult[] = [];
    const total = matchedFiles.length;

    for (let i = 0; i < matchedFiles.length; i++) {
      const matchData = matchedFiles[i];
      setCurrentlySending(cleanCustomerName(matchData.customer.customerName));
      
      const result = await sendSingleEmail(matchData);
      results.push(result);
      
      const progress = ((i + 1) / total) * 100;
      setSendingProgress(progress);
      onProgressUpdate(progress);
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setEmailResults(results);
    setCurrentlySending('');
    setIsSending(false);
    onSendingComplete();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    toast({
      title: "Email Sending Complete",
      description: `${successful} emails sent successfully, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default"
    });
  };

  const testConfiguration = async () => {
    if (!mailgunDomain || !mailgunApiKey) {
      toast({
        title: "Configuration Required",
        description: "Please provide Mailgun domain and API key",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}`, {
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
        }
      });

      if (response.ok) {
        toast({
          title: "Configuration Valid",
          description: "Mailgun configuration is working correctly",
        });
      } else {
        toast({
          title: "Configuration Error",
          description: "Invalid Mailgun domain or API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to Mailgun API",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Email Sending Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Professional Email Delivery
          </CardTitle>
          <CardDescription>
            Send or schedule personalized emails with PDF attachments to {matchedFiles.length} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="test" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Email
              </TabsTrigger>
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Emails
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            {/* Test Email Tab */}
            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Test Email Preview
                  </CardTitle>
                  <CardDescription>
                    Send a test email to preview the format and content before sending to all customers.
                    The test will use sample data from your first matched customer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {matchedFiles.length > 0 ? (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Sample Data Preview:</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p><strong>Customer:</strong> {cleanCustomerName(matchedFiles[0].customer.customerName)}</p>
                          <p><strong>Account:</strong> {matchedFiles[0].customer.accountNumber}</p>
                          <p><strong>PDF:</strong> {matchedFiles[0].pdf.name}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="testEmail">Test Email Address</Label>
                        <Input
                          id="testEmail"
                          type="email"
                          placeholder="your-email@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your email address to receive a test email with the sample data above.
                        </p>
                      </div>

                      <Button
                        onClick={sendTestEmail}
                        disabled={isTestSending || !testEmail || !mailgunDomain || !mailgunApiKey}
                        className="w-full"
                        size="lg"
                      >
                        {isTestSending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-pulse" />
                            Sending Test Email...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4 mr-2" />
                            Send Test Email
                          </>
                        )}
                      </Button>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Note:</strong> The test email will include a clear "TEST EMAIL" banner
                          and use the subject prefix "[TEST]" to distinguish it from actual customer emails.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No Sample Data Available</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete the previous steps (upload files, import customers, match data)
                        to enable test email functionality.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Send Emails Tab */}
            <TabsContent value="send" className="space-y-6">
              {/* Sending Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{matchedFiles.length}</div>
                  <div className="text-sm text-muted-foreground">Ready to Send</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {emailResults.filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sent Successfully</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {emailResults.filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {/* Sending Progress */}
              {isSending && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Sending emails...</span>
                    <span>{Math.round(sendingProgress)}%</span>
                  </div>
                  <Progress value={sendingProgress} />
                  {currentlySending && (
                    <p className="text-sm text-muted-foreground">
                      Currently sending to: {currentlySending}
                    </p>
                  )}
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={sendAllEmails}
                disabled={isSending || isProcessing || matchedFiles.length === 0 || !mailgunDomain || !mailgunApiKey}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-pulse" />
                    Sending Emails...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send All Emails Now
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <EmailScheduler
                recipientCount={matchedFiles.length}
                onSchedule={setScheduledFor}
                onSendNow={() => {
                  setActiveTab('send');
                  sendAllEmails();
                }}
                isProcessing={isSending || isProcessing}
              />
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-6">
              {/* Configuration Status */}
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                {configValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Configuration Valid</p>
                      <p className="text-sm text-green-600">Email settings are properly configured and ready to use.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">Configuration Required</p>
                      <p className="text-sm text-amber-600">Please update your Mailgun credentials below.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mailgun-domain">Mailgun Domain</Label>
                  <Input
                    id="mailgun-domain"
                    value={mailgunDomain}
                    onChange={(e) => setMailgunDomain(e.target.value)}
                    placeholder="mg.yourdomain.com"
                    className={mailgunDomain && mailgunDomain !== 'mg.yourdomain.com' ? 'border-green-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground">Your verified Mailgun domain</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailgun-api-key">Mailgun API Key</Label>
                  <Input
                    id="mailgun-api-key"
                    type="password"
                    value={mailgunApiKey}
                    onChange={(e) => setMailgunApiKey(e.target.value)}
                    placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className={mailgunApiKey && mailgunApiKey !== 'key-your-api-key-here' ? 'border-green-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground">Your Mailgun API key (starts with 'key-')</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="statements@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">Sender email address</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                  <p className="text-xs text-muted-foreground">Display name for emails</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={testConfiguration} disabled={!configValid}>
                  Test Configuration
                </Button>
                <Button
                  onClick={() => setActiveTab('send')}
                  disabled={!configValid}
                  className={configValid ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {configValid ? 'Configuration Complete' : 'Complete Configuration First'}
                </Button>
              </div>

              {/* Configuration Help */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-2">Need Help Setting Up Mailgun?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sign up at <a href="https://mailgun.com" target="_blank" rel="noopener noreferrer" className="underline">mailgun.com</a></li>
                  <li>• Verify your domain in the Mailgun dashboard</li>
                  <li>• Copy your domain and API key from the Mailgun dashboard</li>
                  <li>• Your configuration is automatically saved</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>



      {/* Sending Results */}
      {emailResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sending Results</CardTitle>
            <CardDescription>
              Detailed results for each email sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {emailResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{cleanCustomerName(result.customer.customerName)}</p>
                      <p className="text-xs text-muted-foreground">{result.customer.email}</p>
                      {result.error && (
                        <p className="text-xs text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {result.success ? 'Sent' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailSendingComponent;
