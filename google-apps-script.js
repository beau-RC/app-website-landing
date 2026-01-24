/**
 * Google Apps Script Backend for APP Accelerator Application Form
 *
 * IMPORTANT: Data is sent as FormData with JSON in the 'data' field
 */

// Configuration - UPDATE THESE
const SHEET_ID = '1cTa7P3AwABBjoVsgta0GWCKLMV8B-_Dfe2hU3FimtJ8';
const SHEET_NAME = 'Applications';
const UPLOAD_FOLDER_ID = '1I-hqlurRET1Z0-c-aNiaVTZg5B6DvOL5';

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'APP Accelerator API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Parse data from FormData (comes in e.parameter.data)
    let data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createJsonResponse({
        success: false,
        error: 'No data received'
      });
    }

    // Check if this is a file upload request
    if (e.parameter && e.parameter.action === 'upload') {
      return handleFileUpload(data);
    }

    // Otherwise, handle form submission
    return handleFormSubmission(data);

  } catch (error) {
    console.error('Error in doPost:', error);
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Handle form submission - append data to spreadsheet
 */
function handleFormSubmission(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Sheet not found: ' + SHEET_NAME);
    }

    // Map form data to spreadsheet columns
    const row = [
      data.timestamp || new Date().toISOString(),
      data.founderName || '',
      data.pronouns || '',
      data.location || '',
      data.demographics || '',
      data.linkedin || '',
      data.instagram || '',
      data.website || '',
      data.bio || '',
      data.videoIntroUrl || '',
      data.problem || '',
      data.audience || '',
      data.solution || '',
      data.personalMeaning || '',
      data.targetCustomer || '',
      data.pricePoint || '',
      data.researchFindings || '',
      data.earlySignups || '',
      data.prototypeUrl || '',
      data.whyApplying || '',
      data.goals || '',
      data.performingExperience || '',
      data.teamStatus || '',
      data.teamRoles || '',
      data.scheduleCommitment ? 'Yes' : 'No',
      data.supportGaps || '',
      data.sparkVideoUrl || '',
      data.pitchDeckUrl || '',
      data.workSamplesUrl || '',
      data.headshotUrl || '',
      data.email || '',
      data.termsAgreed ? 'Yes' : 'No'
    ];

    // Append the row
    sheet.appendRow(row);

    // Send confirmation email if email is provided
    if (data.email) {
      sendConfirmationEmail(data);
    }

    return createJsonResponse({
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error in handleFormSubmission:', error);
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Handle file upload to Google Drive
 */
function handleFileUpload(data) {
  try {
    const { fileName, mimeType, data: base64Data, folderId } = data;

    // Decode base64 data
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);

    // Get the target folder
    const targetFolderId = folderId || UPLOAD_FOLDER_ID;
    const folder = DriveApp.getFolderById(targetFolderId);

    // Create the file
    const file = folder.createFile(blob);

    // Make the file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return createJsonResponse({
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: file.getName()
    });

  } catch (error) {
    console.error('Error in handleFileUpload:', error);
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Send confirmation email to applicant
 */
function sendConfirmationEmail(data) {
  try {
    const subject = 'APP Accelerator - Application Received';
    const body = `
Hi ${data.founderName},

Thank you for applying to the All People Powered (APP) Accelerator!

We've received your application and our team will review it carefully. We'll be in touch with next steps soon.

Here's a summary of what you submitted:
- Location: ${data.location}
- Venture focus: ${data.solution || 'Not specified'}
- Team status: ${data.teamStatus === 'solo' ? 'Solo Founder' : 'Team'}

If you have any questions in the meantime, feel free to reach out.

Best of luck!

The Co-Founders Team

---
This is an automated confirmation email. Please do not reply directly to this message.
    `;

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw - email failure shouldn't fail the submission
  }
}

/**
 * Create a JSON response
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Initialize the spreadsheet with headers (run once)
 */
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const headers = [
    'Timestamp', 'Founder Name', 'Pronouns', 'Location', 'Demographics',
    'LinkedIn', 'Instagram', 'Website', 'Bio', 'Video Intro URL',
    'Problem', 'Audience', 'Solution', 'Personal Meaning',
    'Target Customer', 'Price Point', 'Research Findings', 'Early Signups', 'Prototype URL',
    'Why Applying', 'Goals', 'Performing Experience',
    'Team Status', 'Team Roles', 'Schedule Commitment', 'Support Gaps',
    'Spark Video URL', 'Pitch Deck URL', 'Work Samples URL', 'Headshot URL',
    'Email', 'Terms Agreed'
  ];

  // Check if headers exist
  const firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    console.log('Sheet initialized with headers');
  } else {
    console.log('Headers already exist');
  }
}

/**
 * Test the setup
 */
function testSetup() {
  console.log('Testing setup...');

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    console.log('✓ Sheet access: OK');
    console.log('  Last row:', sheet.getLastRow());
  } catch (e) {
    console.log('✗ Sheet error:', e.toString());
  }

  try {
    const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    console.log('✓ Folder access: OK');
    console.log('  Folder:', folder.getName());
  } catch (e) {
    console.log('✗ Folder error:', e.toString());
  }
}
