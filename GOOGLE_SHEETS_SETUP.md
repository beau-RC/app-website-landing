# Google Sheets Integration Setup Guide

This guide will walk you through connecting your form to Google Sheets to automatically store form submissions.

## Overview

Your form is already configured to work with Google Sheets. You just need to:
1. Create a Google Sheet
2. Set up a Google Apps Script
3. Deploy the script as a web app
4. Update the configuration in your form

---

## Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "APP Accelerator Applications"
4. **Copy the Sheet ID from the URL:**
   - The URL will look like: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy the part between `/d/` and `/edit` - this is your Sheet ID
   - Save this for Step 3

**Important:** The sheet can remain **private** - you do NOT need to share it publicly. The Apps Script will access it using your permissions when it runs.

---

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any default code in the editor
3. Open the file `google-apps-script.js` from your project
4. Copy the **entire contents** of that file
5. Paste it into the Apps Script editor
6. **Update the configuration at the top:**
   - Replace `'YOUR_GOOGLE_SHEET_ID'` with your actual Sheet ID from Step 1
   - Replace `'YOUR_DRIVE_FOLDER_ID'` with your Google Drive folder ID (see Step 2a below)

### Step 2a: Get Your Google Drive Folder ID (Optional - for file uploads)

If you want to store uploaded files:

1. Create a folder in Google Drive (or use an existing one)
2. Open the folder
3. Copy the Folder ID from the URL:
   - URL looks like: `https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE`
   - Copy the part after `/folders/`
4. Paste this into the `UPLOAD_FOLDER_ID` constant in the Apps Script

---

## Step 3: Initialize the Sheet Headers

1. In the Apps Script editor, find the function `initializeSheet()` at the bottom
2. Click the function dropdown at the top and select `initializeSheet`
3. Click the **Run** button (▶️)
4. Authorize the script when prompted:
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Your Project Name] (unsafe)"
   - Click "Allow"
5. Check the execution log - you should see "Sheet initialized with headers"
6. Go back to your Google Sheet - you should see the column headers in row 1

---

## Step 4: Deploy as Web App

1. In Apps Script, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description:** "APP Accelerator Form Handler" (or any name)
   - **Execute as:** Me (your email address)
   - **Who has access:** Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
   Save this URL - you'll need it in Step 5

---

## Step 5: Update Your Form Configuration

1. Open `app.js` in your project
2. Find the `CONFIG` object at the top (around line 9)
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'` with the Web App URL from Step 4
4. If you set up file uploads, also update:
   - `GOOGLE_CLIENT_ID` (optional - only needed for OAuth file uploads)
   - `DRIVE_FOLDER_ID` with your folder ID from Step 2a

Example:
```javascript
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby.../exec',
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID', // Optional
    DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j', // Your folder ID
    // ... rest of config
};
```

---

## Step 6: Test the Connection

1. Open your form in a browser
2. Fill out a test submission
3. Submit the form
4. Check your Google Sheet - you should see a new row with your test data
5. If it works, delete the test row from your sheet

---

## Troubleshooting

### Form submissions aren't appearing in the sheet

1. **Check the browser console** (F12 → Console tab) for errors
2. **Verify the Web App URL** in `app.js` matches your deployment URL
3. **Check Apps Script execution logs:**
   - Go to Apps Script → Executions (clock icon)
   - Look for any errors in recent executions
4. **Verify sheet permissions:**
   - Make sure the sheet is accessible
   - Try running `testSetup()` function in Apps Script to verify access

### "Sheet not found" error

1. Make sure the sheet tab is named exactly **"Applications"** (case-sensitive)
2. Or update `SHEET_NAME` in `google-apps-script.js` to match your sheet name

### CORS errors

- Make sure your Web App deployment has "Who has access" set to **Anyone**
- Try redeploying the web app

### File uploads not working

- File uploads require additional OAuth setup
- For now, the form will still submit text data even if file uploads fail
- You can skip file uploads by leaving `DRIVE_FOLDER_ID` as the placeholder

---

## Column Headers Reference

Your sheet should have these columns in order:

1. Timestamp
2. Founder Name
3. Pronouns
4. Location
5. Demographics
6. LinkedIn
7. Instagram
8. Website
9. Bio
10. Video Intro URL
11. Problem
12. Audience
13. Solution
14. Personal Meaning
15. Target Customer
16. Price Point
17. Research Findings
18. Early Signups
19. Prototype URL
20. Why Applying
21. Goals
22. Performing Experience
23. Team Status
24. Team Roles
25. Schedule Commitment
26. Support Gaps
27. Spark Video URL
28. Pitch Deck URL
29. Work Samples URL
30. Headshot URL
31. Email
32. Terms Agreed

---

## Security Notes

- **Sheet Privacy:** Your Google Sheet can remain **private** - it does NOT need to be shared publicly. The Apps Script accesses it using YOUR permissions (since it runs "Execute as: Me"), so the sheet stays secure.
- **Web App URL:** The Web App URL is public - anyone with the URL can submit data to your form. Consider adding validation or rate limiting in the Apps Script if needed.
- **File Uploads:** File uploads are stored in a Google Drive folder - adjust sharing permissions as needed for that folder.
- **Email Confirmations:** Email confirmations are sent automatically if an email is provided.

---

## Need Help?

If you encounter issues:
1. Check the Apps Script execution logs
2. Check the browser console for JavaScript errors
3. Verify all IDs and URLs are correctly copied (no extra spaces)
4. Make sure you've authorized all required permissions
