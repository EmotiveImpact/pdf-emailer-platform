import React, { useState } from 'react';
import { Clock, Calendar, Send, Pause, Play, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ScheduledEmail {
  id: string;
  scheduledFor: Date;
  recipientCount: number;
  subject: string;
  status: 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  sentCount: number;
  failedCount: number;
}

interface EmailSchedulerProps {
  recipientCount: number;
  onSchedule: (scheduledFor: Date | null) => void;
  onSendNow: () => void;
  isProcessing: boolean;
}

const EmailScheduler: React.FC<EmailSchedulerProps> = ({
  recipientCount,
  onSchedule,
  onSendNow,
  isProcessing
}) => {
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const { toast } = useToast();

  const handleScheduleToggle = (enabled: boolean) => {
    setScheduleEnabled(enabled);
    if (!enabled) {
      onSchedule(null);
    }
  };

  const handleScheduleEmail = () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for scheduling",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast({
        title: "Invalid Date",
        description: "Scheduled time must be in the future",
        variant: "destructive",
      });
      return;
    }

    onSchedule(scheduledDateTime);
    
    // Add to scheduled emails list (in a real app, this would be saved to backend)
    const newScheduledEmail: ScheduledEmail = {
      id: `scheduled-${Date.now()}`,
      scheduledFor: scheduledDateTime,
      recipientCount,
      subject: 'Email Campaign', // This would come from the template
      status: 'scheduled',
      sentCount: 0,
      failedCount: 0
    };

    setScheduledEmails(prev => [...prev, newScheduledEmail]);

    toast({
      title: "Email Scheduled",
      description: `Email will be sent to ${recipientCount} recipients on ${scheduledDateTime.toLocaleString()}`,
    });
  };

  const getStatusBadge = (status: ScheduledEmail['status']) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-700', icon: Clock },
      sending: { color: 'bg-yellow-100 text-yellow-700', icon: Send },
      completed: { color: 'bg-green-100 text-green-700', icon: Send },
      paused: { color: 'bg-gray-100 text-gray-700', icon: Pause },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Scheduling Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Email Scheduling
          </CardTitle>
          <CardDescription>
            Send emails immediately or schedule them for later
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Send Now vs Schedule Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">Schedule for Later</div>
              <div className="text-sm text-muted-foreground">
                Schedule emails to be sent at a specific date and time
              </div>
            </div>
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={handleScheduleToggle}
            />
          </div>

          {/* Immediate Send */}
          {!scheduleEnabled && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Send Immediately</span>
                </div>
                <p className="text-sm text-green-700">
                  Emails will be sent to {recipientCount} recipients right away
                </p>
              </div>
              
              <Button
                onClick={onSendNow}
                disabled={isProcessing || recipientCount === 0}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Send {recipientCount} Emails Now
              </Button>
            </div>
          )}

          {/* Scheduled Send */}
          {scheduleEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              {scheduledDate && scheduledTime && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Scheduled Send</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {recipientCount} emails will be sent on{' '}
                    {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                  </p>
                </div>
              )}

              <Button
                onClick={handleScheduleEmail}
                disabled={isProcessing || !scheduledDate || !scheduledTime || recipientCount === 0}
                className="w-full"
                size="lg"
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule {recipientCount} Emails
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Emails List */}
      {scheduledEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Emails</CardTitle>
            <CardDescription>
              Manage your scheduled email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{email.subject}</span>
                      {getStatusBadge(email.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scheduled for {email.scheduledFor.toLocaleString()} • {email.recipientCount} recipients
                    </div>
                    {email.status === 'completed' && (
                      <div className="text-xs text-green-600 mt-1">
                        Sent: {email.sentCount} • Failed: {email.failedCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {email.status === 'scheduled' && (
                      <>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </>
                    )}
                    {email.status === 'paused' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduling Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Scheduling Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Best times to send: Tuesday-Thursday, 10 AM - 2 PM</li>
                <li>• Avoid Mondays, Fridays, and weekends for business emails</li>
                <li>• Schedule at least 5 minutes in advance</li>
                <li>• Consider your recipients' time zones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailScheduler;
