import React, { useState } from 'react';
import { Mail, ArrowLeft, Upload, FileText, Users, Send, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ZipUploadComponent from '@/components/email/ZipUploadComponent';
import CsvUploadComponent from '@/components/email/CsvUploadComponent';
import AccountMatchingComponent from '@/components/email/AccountMatchingComponent';
import EmailTemplateComponent from '@/components/email/EmailTemplateComponent';
import EmailSendingComponent from '@/components/email/EmailSendingComponent';

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

type WorkflowStep = 'upload-zip' | 'upload-csv' | 'match-data' | 'email-template' | 'send-emails';

const EmailDistributionTool = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload-zip');
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [matchedData, setMatchedData] = useState<MatchedData[]>([]);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { id: 'upload-zip', title: 'Upload ZIP Files', icon: Upload, description: 'Upload ZIP files containing PDF statements' },
    { id: 'upload-csv', title: 'Import Customer Data', icon: FileText, description: 'Upload CSV with customer emails and account numbers' },
    { id: 'match-data', title: 'Match & Verify', icon: Users, description: 'Match PDFs to customers by account number' },
    { id: 'email-template', title: 'Email Template', icon: Mail, description: 'Create personalized email template' },
    { id: 'send-emails', title: 'Send Emails', icon: Send, description: 'Send emails with PDF attachments' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const canProceedToStep = (stepId: WorkflowStep): boolean => {
    switch (stepId) {
      case 'upload-csv': return pdfFiles.length > 0;
      case 'match-data': return pdfFiles.length > 0 && customerData.length > 0;
      case 'email-template': return matchedData.length > 0;
      case 'send-emails': return matchedData.length > 0 && emailTemplate.trim() !== '';
      default: return true;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Email Distribution Tool
          </h1>
        </div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Send personalized emails with PDF attachments to your customers automatically.
          </p>
          <Badge className="bg-green-100 text-green-700">Now Available</Badge>
        </div>
      </div>

      {/* Enhanced Progress Steps */}
      <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                Workflow Progress
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Follow these steps to send personalized emails to your customers
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-700">
                {Math.round((getCurrentStepIndex() / (steps.length - 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Enhanced Progress Bar */}
          <div className="mb-8">
            <Progress 
              value={(getCurrentStepIndex() / (steps.length - 1)) * 100} 
              className="h-3 bg-gray-100"
            />
          </div>

          {/* Enhanced Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id as WorkflowStep);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              const isUpcoming = status === 'upcoming';

              return (
                <div
                  key={step.id}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
                    ${isCompleted 
                      ? 'bg-green-50 border-green-200 shadow-sm' 
                      : isCurrent 
                        ? 'bg-blue-50 border-blue-300 shadow-md scale-105' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => {
                    if (canProceedToStep(step.id as WorkflowStep)) {
                      setCurrentStep(step.id as WorkflowStep);
                    }
                  }}
                >
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isCompleted 
                        ? 'bg-green-600 text-white' 
                        : isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-400 text-gray-700'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <Icon className={`
                      h-6 w-6
                      ${isCompleted 
                        ? 'text-green-700' 
                        : isCurrent 
                          ? 'text-blue-700' 
                          : 'text-gray-500'
                      }
                    `} />
                  </div>

                  {/* Step Content */}
                  <div className="space-y-2">
                    <h3 className={`
                      font-semibold text-sm
                      ${isCompleted 
                        ? 'text-green-700' 
                        : isCurrent 
                          ? 'text-blue-700' 
                          : 'text-gray-700'
                      }
                    `}>
                      {step.title}
                    </h3>
                    <p className={`
                      text-xs leading-relaxed
                      ${isCompleted 
                        ? 'text-green-600' 
                        : isCurrent 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }
                    `}>
                      {step.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3">
                    {isCompleted && (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        ✓ Completed
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        → Current Step
                      </Badge>
                    )}
                    {isUpcoming && (
                      <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                        Upcoming
                      </Badge>
                    )}
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className={`
                      absolute top-1/2 -right-2 w-4 h-0.5 transform -translate-y-1/2
                      ${isCompleted ? 'bg-green-400' : 'bg-gray-400'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {pdfFiles.length}
              </div>
              <div className="text-sm text-gray-600">PDF Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {customerData.length}
              </div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                {matchedData.filter(m => m.matched).length}
              </div>
              <div className="text-sm text-gray-600">Matched</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === 'upload-zip' && (
          <ZipUploadComponent
            onFilesExtracted={(files) => {
              setPdfFiles(files);
              if (files.length > 0) {
                setCurrentStep('upload-csv');
              }
            }}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'upload-csv' && (
          <CsvUploadComponent
            onDataParsed={(data) => {
              setCustomerData(data);
              if (data.length > 0) {
                setCurrentStep('match-data');
              }
            }}
            isProcessing={isProcessing}
            pdfFiles={pdfFiles}
          />
        )}

        {currentStep === 'match-data' && (
          <AccountMatchingComponent
            pdfFiles={pdfFiles}
            customerData={customerData}
            onMatchingComplete={(matches) => {
              setMatchedData(matches);
              if (matches.length > 0) {
                setCurrentStep('email-template');
              }
            }}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'email-template' && (
          <EmailTemplateComponent
            matchedData={matchedData}
            onTemplateReady={(template) => {
              setEmailTemplate(template);
              if (template.trim() !== '') {
                setCurrentStep('send-emails');
              }
            }}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'send-emails' && (
          <EmailSendingComponent
            matchedData={matchedData}
            emailTemplate={emailTemplate}
            onSendingComplete={() => {
              // Reset or show completion
              setProgress(100);
            }}
            isProcessing={isProcessing}
            onProgressUpdate={setProgress}
          />
        )}
      </div>

      {/* Enhanced Navigation Controls */}
      <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const currentIndex = getCurrentStepIndex();
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id as WorkflowStep);
                }
              }}
              disabled={getCurrentStepIndex() === 0}
              className="w-full sm:w-auto"
            >
              ← Previous Step
            </Button>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Step {getCurrentStepIndex() + 1} of {steps.length}</span>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="font-medium">{steps[getCurrentStepIndex()]?.title}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  // Reset workflow
                  setCurrentStep('upload-zip');
                  setPdfFiles([]);
                  setCustomerData([]);
                  setMatchedData([]);
                  setEmailTemplate('');
                  setProgress(0);
                }}
                className="flex-1 sm:flex-none"
              >
                🔄 Reset
              </Button>

              <Button
                size="lg"
                onClick={() => {
                  const currentIndex = getCurrentStepIndex();
                  if (currentIndex < steps.length - 1) {
                    const nextStep = steps[currentIndex + 1].id as WorkflowStep;
                    if (canProceedToStep(nextStep)) {
                      setCurrentStep(nextStep);
                    }
                  }
                }}
                disabled={getCurrentStepIndex() === steps.length - 1 || !canProceedToStep(steps[getCurrentStepIndex() + 1]?.id as WorkflowStep)}
                className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-800"
              >
                Next Step →
              </Button>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold text-green-700">{pdfFiles.length}</div>
                <div className="text-xs text-gray-600">PDF Files</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-700">{customerData.length}</div>
                <div className="text-xs text-gray-600">Customers</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-purple-700">{matchedData.filter(m => m.matched).length}</div>
                <div className="text-xs text-gray-600">Matched</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-orange-700">{emailTemplate ? '✓' : '○'}</div>
                <div className="text-xs text-gray-600">Template</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailDistributionTool;
