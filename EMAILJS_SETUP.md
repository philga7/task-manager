# EmailJS Setup Instructions

## 🚀 Getting Started with EmailJS

EmailJS allows you to send emails directly from the browser without needing a backend server. Perfect for issue reporting!

## 📋 Step-by-Step Setup

### 1. Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create an Email Service
1. In your EmailJS dashboard, go to **"Email Services"**
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended for personal use)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Custom SMTP** (for business emails)
4. Follow the setup instructions for your chosen provider
5. **Note down your Service ID** (e.g., `service_abc123`)

### 3. Create an Email Template
1. Go to **"Email Templates"** in your dashboard
2. Click **"Create New Template"**
3. Use this template structure:

#### Template Name: `task_manager_issue_report`

#### Template Content:
```
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
```

4. **Note down your Template ID** (e.g., `template_xyz789`)

### 4. Get Your Public Key
1. Go to **"Account"** in your dashboard
2. Find your **"Public Key"** (e.g., `abc123xyz`)

### 5. Set Environment Variables
Create a `.env` file in your project root with your EmailJS credentials:

```bash
VITE_EMAILJS_PUBLIC_KEY=your_actual_public_key_here
VITE_EMAILJS_SERVICE_ID=your_actual_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_actual_template_id_here
```

**Important**: Never commit your `.env` file to version control. The `.env` file should be in your `.gitignore`.

## 🧪 Testing

### Test EmailJS Configuration
You can test your setup using the browser console:

1. Open your app in the browser
2. Open developer tools (F12)
3. Go to Console tab
4. Run this code:

```javascript
import { testEmailJSConfiguration } from './src/services/emailService';
testEmailJSConfiguration().then(result => console.log(result));
```

### Test Issue Reporting
1. Open the app
2. Go to Settings
3. Click "Report an Issue"
4. Fill out a test issue report
5. Click "Generate Issue Report"
6. Click "Send via Email"
7. Check phil@informedcrew.com for the email

## 📧 Email Template Variables

The following variables are automatically populated:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Recipient email | phil@informedcrew.com |
| `{{from_name}}` | Reporter name | Task Manager User |
| `{{subject}}` | Email subject | Task Manager Issue Report: Safari login issue |
| `{{issue_title}}` | Issue title | Safari users cannot see tasks |
| `{{issue_category}}` | Issue category | task-visibility |
| `{{issue_description}}` | Issue description | User provided description |
| `{{expected_behavior}}` | What should happen | Tasks should be visible |
| `{{actual_behavior}}` | What actually happens | No tasks displayed |
| `{{steps_to_reproduce}}` | Steps to reproduce | 1. Open Safari\n2. Login\n3. Check tasks |
| `{{browser_info}}` | Browser details | Browser: Safari 17.0, Mobile: No, etc. |
| `{{app_state}}` | App state info | Authenticated: Yes, Tasks: 0, etc. |
| `{{report_url}}` | GitHub issue URL | Full GitHub issue URL with details |
| `{{timestamp}}` | When reported | 8/20/2025, 2:37:43 PM |
| `{{additional_notes}}` | Extra notes | Optional user notes |

## 🔒 Security Notes

- Your EmailJS credentials are **client-side only**
- The free tier has usage limits (200 emails/month)
- Consider upgrading for production use
- Never expose your private keys (only public key is used)

## 🚨 Fallback Behavior

If EmailJS is not configured, the app will:
1. Fall back to `mailto:` links
2. Show instructions for manual email sending
3. Still provide the full report URL for copying

## 📊 Free Tier Limits

EmailJS free tier includes:
- **200 emails per month**
- **1 Email service**
- **Unlimited templates**
- **Basic analytics**

For production, consider upgrading to a paid plan for higher limits and better reliability.

## 🚀 Vercel Deployment

### Setting Environment Variables in Vercel:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables:**

   | Variable Name | Value | Environment |
   |---------------|-------|-------------|
   | `VITE_EMAILJS_PUBLIC_KEY` | `your_public_key` | Production, Preview, Development |
   | `VITE_EMAILJS_SERVICE_ID` | `your_service_id` | Production, Preview, Development |
   | `VITE_EMAILJS_TEMPLATE_ID` | `your_template_id` | Production, Preview, Development |

4. **Redeploy your application** after adding the environment variables

### Local Development:
Create a `.env` file in your project root:
```bash
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"EmailJS is not configured" error**
   - Check that all environment variables are set correctly
   - Ensure no placeholder values remain in `.env` or Vercel settings

2. **Emails not sending**
   - Verify your email service is properly connected
   - Check your EmailJS dashboard for error logs
   - Test with a simple template first

3. **Template variables not working**
   - Ensure template uses exact variable names (case-sensitive)
   - Check template syntax (use `{{variable}}` format)
   - Test template in EmailJS dashboard

4. **Rate limiting**
   - Free tier limits to 200 emails/month
   - Consider upgrading for higher limits

## 📞 Support

If you encounter issues:
1. Check EmailJS documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
2. Review EmailJS dashboard logs
3. Test with minimal template first
4. Contact EmailJS support if needed

---

**Note**: Remember to keep your EmailJS credentials secure and never commit them to public repositories!
