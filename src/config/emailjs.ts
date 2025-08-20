// EmailJS Configuration
// To set up EmailJS:
// 1. Go to https://www.emailjs.com/
// 2. Create a free account
// 3. Create an email service (Gmail, Outlook, etc.)
// 4. Create an email template 
// 5. Replace the values below with your actual EmailJS credentials

export const EMAILJS_CONFIG = {
  // EmailJS credentials from environment variables
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
};

// Template parameters that will be sent to EmailJS
export interface EmailTemplateParams {
  to_email: string;
  from_name: string;
  subject: string;
  issue_title: string;
  issue_category: string;
  issue_description: string;
  expected_behavior: string;
  actual_behavior: string;
  steps_to_reproduce: string;
  browser_info: string;
  app_state: string;
  report_url: string;
  timestamp: string;
  additional_notes?: string;
}

// EmailJS template structure for reference:
/*
Template Name: task_manager_issue_report

Template Content:
Subject: {{subject}}

Hi {{to_email}},

A new issue has been reported in the Task Manager app.

**Issue Details:**
Title: {{issue_title}}
Category: {{issue_category}}
Timestamp: {{timestamp}}

**Description:**
{{issue_description}}

**Expected Behavior:**
{{expected_behavior}}

**Actual Behavior:**
{{actual_behavior}}

**Steps to Reproduce:**
{{steps_to_reproduce}}

**Browser Information:**
{{browser_info}}

**App State:**
{{app_state}}

**Full Report URL:**
{{report_url}}

{{#additional_notes}}
**Additional Notes:**
{{additional_notes}}
{{/additional_notes}}

Reported by: {{from_name}}

Best regards,
Task Manager Issue Reporter
*/
