import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  FileText,
  Settings,
  Mail
} from 'lucide-react';
import { 
  createIssueReport, 
  detectSilentFailures, 
  generateGitHubIssueUrl, 
  saveIssueReport,
  getSavedIssueReports,
  clearSavedIssueReports,
  type IssueReport,
  type AppState
} from '../../utils/issueReporting';
import { useApp } from '../../context/useApp';
import { sendIssueReportEmail, initializeEmailJS, isEmailJSConfigured } from '../../services/emailService';

interface IssueReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialTitle?: string;
  initialDescription?: string;
}

export function IssueReportingModal({ 
  isOpen, 
  onClose, 
  initialCategory = 'other',
  initialTitle = '',
  initialDescription = ''
}: IssueReportingModalProps) {
  const { state } = useApp();
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState<string[]>(['']);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [detectedIssues, setDetectedIssues] = useState<Array<{
    type: 'silent-failure';
    category: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<IssueReport | null>(null);
  const [savedReports, setSavedReports] = useState<IssueReport[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Get current page from URL
  const getCurrentPage = (): string => {
    const path = window.location.pathname;
    if (path === '/') return 'dashboard';
    if (path === '/tasks') return 'tasks';
    if (path === '/projects') return 'projects';
    if (path === '/goals') return 'goals';
    if (path === '/analytics') return 'analytics';
    if (path === '/settings') return 'settings';
    return 'unknown';
  };

  // Initialize EmailJS and detect silent failures on component mount
  useEffect(() => {
    if (isOpen) {
      // Initialize EmailJS
      initializeEmailJS();
      
      const currentPage = getCurrentPage();
      const appState: AppState = {
        tasks: state.tasks,
        projects: state.projects,
        goals: state.goals,
        authentication: state.authentication,
        searchQuery: state.searchQuery,
        selectedProject: state.selectedProject,
        selectedPriority: state.selectedPriority,
        userSettings: state.userSettings
      };
      
      const issues = detectSilentFailures(appState, currentPage);
      setDetectedIssues(issues);
      
      // Load saved reports
      setSavedReports(getSavedIssueReports());
      
      // Clear email status when modal opens
      setEmailStatus({ type: null, message: '' });
    }
  }, [isOpen, state]);

  const addStep = () => {
    setStepsToReproduce([...stepsToReproduce, '']);
  };

  const removeStep = (index: number) => {
    if (stepsToReproduce.length > 1) {
      setStepsToReproduce(stepsToReproduce.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...stepsToReproduce];
    newSteps[index] = value;
    setStepsToReproduce(newSteps);
  };

  const generateReport = () => {
    setIsGenerating(true);
    
    try {
      const currentPage = getCurrentPage();
      const appState: AppState = {
        tasks: state.tasks,
        projects: state.projects,
        goals: state.goals,
        authentication: state.authentication,
        searchQuery: state.searchQuery,
        selectedProject: state.selectedProject,
        selectedPriority: state.selectedPriority,
        userSettings: state.userSettings
      };

      const report = createIssueReport({
        type: 'user-reported',
        category,
        title: title || 'User-reported issue',
        description: description || 'No description provided',
        expectedBehavior,
        actualBehavior,
        stepsToReproduce: stepsToReproduce.filter(step => step.trim() !== ''),
        appState,
        currentPage,
        additionalNotes: additionalNotes || undefined
      });

      setGeneratedReport(report);
      saveIssueReport(report);
      setSavedReports(getSavedIssueReports());
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReportToClipboard = () => {
    if (generatedReport) {
      const url = generateGitHubIssueUrl(generatedReport);
      navigator.clipboard.writeText(url);
    }
  };

  const openGitHubIssue = () => {
    if (generatedReport) {
      const url = generateGitHubIssueUrl(generatedReport);
      window.open(url, '_blank');
    }
  };

  const sendReportViaEmail = async () => {
    if (!generatedReport) return;
    
    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: '' });
    
    try {
      if (!isEmailJSConfigured()) {
        // Fallback to mailto if EmailJS is not configured
        const url = generateGitHubIssueUrl(generatedReport);
        const subject = encodeURIComponent(`Task Manager Issue Report: ${generatedReport.title}`);
        const body = encodeURIComponent(`Hi Phil,\n\nI've encountered an issue with the Task Manager app. Here's the detailed report:\n\n${url}\n\nThanks!`);
        const mailtoUrl = `mailto:phil@informedcrew.com?subject=${subject}&body=${body}`;
        
        window.open(mailtoUrl);
        setEmailStatus({
          type: 'success',
          message: 'Email client opened. If no email client opened, please copy the report URL and email it manually.'
        });
        return;
      }
      
      // Use EmailJS to send the email
      const result = await sendIssueReportEmail(generatedReport);
      
      if (result.success) {
        setEmailStatus({
          type: 'success',
          message: result.message
        });
      } else {
        setEmailStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      setEmailStatus({
        type: 'error',
        message: 'Failed to send email. Please try copying the report URL instead.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const clearAllReports = () => {
    clearSavedIssueReports();
    setSavedReports([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bug className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-semibold text-stone-100">Report an Issue</h2>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Detected Issues */}
          {detectedIssues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-stone-100 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Potential Issues Detected
              </h3>
              <div className="space-y-3">
                {detectedIssues.map((issue, index) => (
                  <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-300 mb-1">{issue.title}</h4>
                        <p className="text-xs text-yellow-200">{issue.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            issue.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                            issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {issue.severity} severity
                          </span>
                          <span className="text-xs text-stone-400">{issue.category}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setCategory(issue.category);
                          setTitle(issue.title);
                          setDescription(issue.description);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Form */}
          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-stone-200 mb-2">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="task-visibility">Task Visibility</option>
                <option value="authentication">Authentication</option>
                <option value="data-persistence">Data Persistence</option>
                <option value="ui-rendering">UI Rendering</option>
                <option value="performance">Performance</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-stone-200 mb-2">
                Issue Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-stone-200 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of what happened"
                rows={3}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Expected vs Actual Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Expected Behavior
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should have happened?"
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Actual Behavior
                </label>
                <textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happened?"
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-medium text-stone-200 mb-2">
                Steps to Reproduce
              </label>
              <div className="space-y-2">
                {stepsToReproduce.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-stone-400 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {stepsToReproduce.length > 1 && (
                      <Button
                        onClick={() => removeStep(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button onClick={addStep} variant="ghost" size="sm">
                  Add Step
                </Button>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-200 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information that might be helpful"
                rows={2}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Generate Report Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="px-8"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Issue Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated Report */}
          {generatedReport && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-medium text-green-300">Report Generated Successfully!</h3>
              </div>
              <p className="text-sm text-green-200 mb-4">
                Your issue report has been created with detailed context. You can now send it via email or copy the report for later use.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={sendReportViaEmail} 
                  variant="secondary" 
                  size="sm"
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {isSendingEmail ? 'Sending...' : 'Send via Email'}
                </Button>
                <Button onClick={copyReportToClipboard} variant="ghost" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Report URL
                </Button>
                <Button 
                  onClick={openGitHubIssue} 
                  variant="ghost" 
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub Issue (Disabled)
                </Button>
              </div>
              
              {/* Email Status */}
              {emailStatus.type && (
                <div className={`mt-3 p-3 rounded-lg border ${
                  emailStatus.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <p className="text-sm">{emailStatus.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Saved Reports */}
          {savedReports.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-stone-100 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Saved Reports ({savedReports.length})
                </h3>
                <Button onClick={clearAllReports} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  Clear All
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedReports.map((report) => (
                  <div key={report.id} className="p-3 bg-stone-700/50 border border-stone-600 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-stone-200">{report.title}</h4>
                        <p className="text-xs text-stone-400">{new Date(report.timestamp).toLocaleString()}</p>
                        <span className="text-xs text-stone-500">{report.category}</span>
                      </div>
                      <Button
                        onClick={() => {
                          const url = generateGitHubIssueUrl(report);
                          window.open(url, '_blank');
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
