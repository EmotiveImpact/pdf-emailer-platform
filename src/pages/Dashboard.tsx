import React from 'react';
import { FileText, Mail, ArrowRight, Clock, CheckCircle, Users, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const tools = [
    {
      id: 'pdf-splitter',
      title: 'PDF Splitter',
      description: 'Split multi-page PDF bill statements by customer account information',
      icon: FileText,
      path: '/tools/pdf-splitter',
      status: 'active',
      features: [
        'Automatic account detection',
        'Custom naming patterns',
        'Bulk processing',
        'ZIP download support'
      ],
      lastUsed: '2 hours ago',
      totalProcessed: '1,247 files'
    },
    {
      id: 'email-distribution',
      title: 'Email Distribution',
      description: 'Send personalized emails with PDF attachments to customers',
      icon: Mail,
      path: '/tools/email-distribution',
      status: 'active',
      features: [
        'Bulk email sending',
        'Custom email templates',
        'Account matching',
        'Delivery tracking'
      ],
      lastUsed: 'Never',
      totalProcessed: '0 emails sent'
    }
  ];

  const recentActivity = [
    {
      action: 'PDF Split',
      details: 'Processed 45 customer statements',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      action: 'Pattern Update',
      details: 'Updated account number patterns',
      time: '1 day ago',
      status: 'completed'
    },
    {
      action: 'Bulk Download',
      details: 'Downloaded ZIP with 32 files',
      time: '2 days ago',
      status: 'completed'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'coming-soon':
        return <Badge className="bg-yellow-100 text-yellow-700">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Business Tools Platform
          </h1>
        </div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Welcome back, Lisa! Your comprehensive toolkit for New Water Systems operations.
          </p>
          <p className="text-sm text-blue-600 font-medium">
            Streamline your workflow with our integrated business tools
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = tool.status === 'active';
          
          return (
            <Card key={tool.id} className={`relative ${!isActive ? 'opacity-75' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tool.title}
                        {getStatusBadge(tool.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tool.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats or Status */}
                {isActive ? (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Last used: {tool.lastUsed}</span>
                    <span>{tool.totalProcessed}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estimated release: {tool.estimatedRelease}</span>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  {isActive ? (
                    <Button asChild className="w-full">
                      <Link to={tool.path}>
                        Open Tool
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest actions across all tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/tools/pdf-splitter" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Split New PDFs</div>
                  <div className="text-xs text-muted-foreground">Process bill statements</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/tools/email-distribution" className="flex flex-col items-center gap-2">
                <Mail className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Send Customer Emails</div>
                  <div className="text-xs text-muted-foreground">Email with attachments</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
