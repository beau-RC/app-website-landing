/**
 * APP Accelerator Application Form
 * Handles multi-step form navigation, validation, file uploads, and Google integration
 */

// ================================
// Configuration
// ================================
const CONFIG = {
    // Google Apps Script Web App URL (replace after deployment)
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzGcKnZBK9-4eAjN7XP2nc3vF0wuK20aJ9dTQwmXvDuZ6XOVyrVffSLj0l3ZXIY6NvE/exec',

    // Google OAuth Client ID (replace with your own)
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',

    // Google Drive folder ID for uploads (replace with your own)
    DRIVE_FOLDER_ID: '1I-hqlurRET1Z0-c-aNiaVTZg5B6DvOL5',

    // Local storage key for form data
    STORAGE_KEY: 'app_accelerator_form_data',

    // Total number of steps
    TOTAL_STEPS: 3
};

// ================================
// State Management
// ================================
let currentStep = 1;
let formData = {};
let uploadedFiles = {};

// ================================
// DOM Elements
// ================================
const form = document.getElementById('applicationForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressFill = document.getElementById('progressFill');
const successMessage = document.getElementById('successMessage');
const saveDraftBtn = document.getElementById('saveDraftBtn');

// ================================
// DOM Elements (Toggle)
// ================================
const applyToggle = document.getElementById('applyToggle');
const applicationContent = document.getElementById('applicationContent');

// ================================
// Initialization
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    initializeFileUploads();
    initializeTeamToggle();
    initializeApplyToggle();
    initializeFAQ();
    updateUI();
    initializeDraftFeature();
    checkForDraftRestore();

    // Event listeners
    prevBtn.addEventListener('click', goToPrevStep);
    nextBtn.addEventListener('click', goToNextStep);
    form.addEventListener('submit', handleSubmit);

    // Save data on input changes
    form.addEventListener('input', debounce(saveFormData, 500));
    form.addEventListener('change', debounce(saveFormData, 500));
});

// ================================
// Apply Toggle (Collapsible)
// ================================
function initializeApplyToggle() {
    applyToggle.addEventListener('click', toggleApplication);

    // Check if there's saved data - if so, expand the form
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        expandApplication();
    }

    // Make hero CTA buttons scroll AND open the form
    const heroCTAs = document.querySelectorAll('a.btn-pitch-cta[href="#application"]');
    heroCTAs.forEach(cta => {
        cta.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToAndOpenForm();
        });
    });

    // Make benefit cards scroll AND open the form
    const benefitCards = document.querySelectorAll('.benefit-card');
    benefitCards.forEach(card => {
        card.addEventListener('click', () => {
            scrollToAndOpenForm();
        });
    });
}

function scrollToAndOpenForm() {
    // Scroll to the application section
    const target = document.getElementById('application');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
    // Expand the form after a short delay (to let scroll start)
    setTimeout(() => {
        expandApplication();
    }, 300);
}

function toggleApplication() {
    if (applicationContent.classList.contains('expanded')) {
        collapseApplication();
    } else {
        expandApplication();
    }
}

function expandApplication() {
    applicationContent.classList.add('expanded');
    applyToggle.classList.add('expanded');
    var floatBtn = document.getElementById('float-tickets');
    if (floatBtn) floatBtn.classList.add('form-open');
}

function collapseApplication() {
    applicationContent.classList.remove('expanded');
    applyToggle.classList.remove('expanded');
    var floatBtn = document.getElementById('float-tickets');
    if (floatBtn) floatBtn.classList.remove('form-open');
}

// ================================
// FAQ Toggle
// ================================
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Toggle the clicked item
            item.classList.toggle('expanded');
        });
    });
}

// ================================
// Navigation Functions
// ================================
function goToNextStep() {
    if (validateCurrentStep()) {
        if (currentStep < CONFIG.TOTAL_STEPS) {
            currentStep++;
            updateUI();
            scrollToTop();
        }
    }
}

function goToPrevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
        scrollToTop();
    }
}

function goToStep(step) {
    if (step >= 1 && step <= CONFIG.TOTAL_STEPS) {
        currentStep = step;
        updateUI();
    }
}

function scrollToTop() {
    const applicationSection = document.querySelector('.application');
    if (applicationSection) {
        applicationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ================================
// UI Updates
// ================================
function updateUI() {
    // Ensure currentStep is valid
    if (currentStep < 1 || currentStep > CONFIG.TOTAL_STEPS) {
        currentStep = 1;
    }

    // Update form steps visibility
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const activeStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (activeStep) {
        activeStep.classList.add('active');
    }

    // Update progress bar
    const progress = (currentStep / CONFIG.TOTAL_STEPS) * 100;
    progressFill.style.width = `${progress}%`;

    // Update step indicators
    document.querySelectorAll('.progress-steps .step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });

    // Update navigation buttons
    prevBtn.style.display = currentStep === 1 ? 'none' : 'block';

    if (currentStep === CONFIG.TOTAL_STEPS) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// ================================
// Validation
// ================================
function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepEl.querySelectorAll('[required]');
    let isValid = true;

    // Clear previous errors
    currentStepEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    currentStepEl.querySelectorAll('.error-message').forEach(el => el.remove());

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Special validation for file uploads on Step 3 (Uploads)
    if (currentStep === 3) {
        const videoIntroUrl = document.getElementById('videoIntroUrl').value;
        const videoIntroInput = document.getElementById('videoIntro');
        if (!videoIntroUrl && !videoIntroInput.files.length) {
            showFieldError(videoIntroInput.closest('.file-upload-zone'), 'Video introduction is required');
            isValid = false;
        }

        const headshotUrl = document.getElementById('headshotUrl').value;
        const headshotInput = document.getElementById('headshot');
        if (!headshotUrl && !headshotInput.files.length) {
            showFieldError(headshotInput.closest('.file-upload-zone'), 'Headshot is required');
            isValid = false;
        }
    }

    return isValid;
}

function validateField(field) {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();

    if (field.required && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }

    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }

    if (field.type === 'url' && value && !isValidUrl(value)) {
        showFieldError(field, 'Please enter a valid URL');
        return false;
    }

    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    field.parentNode.appendChild(errorEl);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ================================
// File Upload Handling
// ================================
function initializeFileUploads() {
    const uploadZones = document.querySelectorAll('.file-upload-zone');

    uploadZones.forEach(zone => {
        const input = zone.querySelector('.file-input');
        const preview = zone.querySelector('.upload-preview');
        const fieldName = zone.dataset.field;

        // Drag and drop events
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');

            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                handleFileSelect(input, zone, preview, fieldName);
            }
        });

        // File input change
        input.addEventListener('change', () => {
            handleFileSelect(input, zone, preview, fieldName);
        });
    });
}

function handleFileSelect(input, zone, preview, fieldName) {
    const file = input.files[0];

    if (!file) return;

    // Store file reference
    uploadedFiles[fieldName] = file;

    // Update UI
    zone.classList.add('has-file');
    preview.innerHTML = '';

    if (file.type.startsWith('image/')) {
        // Show image preview
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
    }

    // Show file name and remove button
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-name';
    fileInfo.innerHTML = `
        <span>${truncateFileName(file.name, 30)}</span>
        <button type="button" class="remove-file" onclick="removeFile('${fieldName}')">×</button>
    `;
    preview.appendChild(fileInfo);

    // Save to form data
    saveFormData();
}

function removeFile(fieldName) {
    delete uploadedFiles[fieldName];

    const zone = document.querySelector(`.file-upload-zone[data-field="${fieldName}"]`);
    const input = zone.querySelector('.file-input');
    const preview = zone.querySelector('.upload-preview');
    const urlInput = document.getElementById(`${fieldName}Url`);

    input.value = '';
    preview.innerHTML = '';
    zone.classList.remove('has-file');
    if (urlInput) urlInput.value = '';

    saveFormData();
}

function truncateFileName(name, maxLength) {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.length - ext.length - 1);
    return nameWithoutExt.slice(0, maxLength - ext.length - 4) + '...' + ext;
}

// ================================
// Team Toggle
// ================================
function initializeTeamToggle() {
    const teamRadios = document.querySelectorAll('input[name="teamStatus"]');
    const teamRolesGroup = document.querySelector('.team-roles-group');
    const teamRolesInput = document.getElementById('teamRoles');

    teamRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'team' && radio.checked) {
                teamRolesGroup.style.display = 'block';
                teamRolesInput.required = true;
            } else {
                teamRolesGroup.style.display = 'none';
                teamRolesInput.required = false;
            }
        });
    });
}

// ================================
// Local Storage Persistence
// ================================
function saveFormData() {
    const formDataObj = new FormData(form);
    const data = {};

    formDataObj.forEach((value, key) => {
        if (data[key]) {
            // Handle multiple values (checkboxes)
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    });

    // Save file names (not actual files)
    data._uploadedFileNames = {};
    Object.keys(uploadedFiles).forEach(key => {
        data._uploadedFileNames[key] = uploadedFiles[key].name;
    });

    data._currentStep = currentStep;

    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadSavedData() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!saved) return;

        const data = JSON.parse(saved);

        // Restore form fields
        Object.keys(data).forEach(key => {
            if (key.startsWith('_')) return;

            const field = form.elements[key];
            if (!field) return;

            if (field.type === 'checkbox') {
                if (Array.isArray(data[key])) {
                    // Multiple checkboxes with same name
                    document.querySelectorAll(`input[name="${key}"]`).forEach(cb => {
                        cb.checked = data[key].includes(cb.value);
                    });
                } else {
                    field.checked = data[key] === 'on' || data[key] === true;
                }
            } else if (field.type === 'radio') {
                document.querySelectorAll(`input[name="${key}"]`).forEach(radio => {
                    radio.checked = radio.value === data[key];
                });
            } else if (field.tagName === 'SELECT') {
                field.value = data[key];
            } else if (field.type === 'file') {
                // Skip file inputs - cannot set value programmatically
                return;
            } else {
                field.value = data[key];
            }
        });

        // Restore current step (cap to valid range)
        if (data._currentStep) {
            currentStep = Math.min(data._currentStep, CONFIG.TOTAL_STEPS);
        }

        // Show saved file names (user will need to re-upload)
        if (data._uploadedFileNames) {
            Object.keys(data._uploadedFileNames).forEach(fieldName => {
                const zone = document.querySelector(`.file-upload-zone[data-field="${fieldName}"]`);
                if (zone) {
                    const preview = zone.querySelector('.upload-preview');
                    preview.innerHTML = `
                        <div class="file-name" style="opacity: 0.6;">
                            <span>Previously: ${data._uploadedFileNames[fieldName]} (re-upload needed)</span>
                        </div>
                    `;
                }
            });
        }

        // Trigger team toggle if needed
        const teamRadio = document.querySelector('input[name="teamStatus"]:checked');
        if (teamRadio) {
            teamRadio.dispatchEvent(new Event('change'));
        }

    } catch (e) {
        console.warn('Could not load saved data:', e);
    }
}

function clearSavedData() {
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    } catch (e) {
        console.warn('Could not clear localStorage:', e);
    }
}

// ================================
// Form Submission
// ================================
async function handleSubmit(e) {
    e.preventDefault();
    console.log('Form submit triggered');

    if (!validateCurrentStep()) {
        console.log('Validation failed');
        return;
    }
    console.log('Validation passed, proceeding with submission');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.classList.add('loading');

    try {
        // First, upload files to Google Drive (if configured)
        // Note: File uploads may fail due to CORS when using file:// protocol
        // This is okay - we'll still submit the form data
        try {
            await uploadFilesToDrive();
        } catch (uploadError) {
            console.warn('File uploads failed (this is okay if using file:// protocol):', uploadError);
            // Continue with form submission even if uploads fail
        }

        // Collect all form data
        const formDataObj = collectFormData();

        // Submit to Google Apps Script
        await submitToGoogleSheets(formDataObj);

        // Show success message
        showSuccess();

        // Clear saved data
        clearSavedData();

    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your application. Please try again or contact support.');

        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        submitBtn.classList.remove('loading');
    }
}

function collectFormData() {
    const formDataObj = new FormData(form);
    const data = {
        timestamp: new Date().toISOString()
    };

    // Convert FormData to object
    formDataObj.forEach((value, key) => {
        if (key === 'demographics') {
            // Collect all checked demographics
            if (!data[key]) data[key] = [];
            data[key].push(value);
        } else {
            data[key] = value;
        }
    });

    // Convert demographics array to string
    if (Array.isArray(data.demographics)) {
        data.demographics = data.demographics.join(', ');
    }

    // Add file URLs
    const fileFields = ['videoIntro', 'pitchDeck', 'headshot'];
    fileFields.forEach(field => {
        const urlInput = document.getElementById(`${field}Url`);
        if (urlInput && urlInput.value) {
            data[`${field}Url`] = urlInput.value;
        }
    });

    return data;
}

// ================================
// Google Drive Upload
// ================================
async function uploadFilesToDrive() {
    // Skip if no Google Script URL configured
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('Google Drive upload skipped - Apps Script not configured');
        return;
    }

    const fileFields = ['videoIntro', 'pitchDeck', 'headshot'];

    for (const fieldName of fileFields) {
        if (uploadedFiles[fieldName]) {
            try {
                const url = await uploadFileToDrive(uploadedFiles[fieldName], fieldName);
                const urlInput = document.getElementById(`${fieldName}Url`);
                if (urlInput) {
                    urlInput.value = url;
                }
            } catch (error) {
                console.error(`Error uploading ${fieldName}:`, error);
            }
        }
    }
}

async function uploadFileToDrive(file, fieldName) {
    // This is a placeholder for Google Drive upload
    // In production, you would implement Google OAuth and Drive API
    // For now, we'll use a simple approach via the Apps Script

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64 = e.target.result.split(',')[1];

                // Use FormData for Google Apps Script compatibility
                const formData = new FormData();
                formData.append('data', JSON.stringify({
                    fileName: `${fieldName}_${Date.now()}_${file.name}`,
                    mimeType: file.type,
                    data: base64,
                    folderId: CONFIG.DRIVE_FOLDER_ID
                }));

                const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=upload', {
                    method: 'POST',
                    body: formData
                });

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    reject(new Error('Invalid response from server'));
                    return;
                }
                if (result.success) {
                    resolve(result.fileUrl);
                } else {
                    reject(new Error(result.error || 'Upload failed'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// ================================
// Google Sheets Submission
// ================================
async function submitToGoogleSheets(data) {
    // Skip if not configured
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('Submission skipped - Google Apps Script not configured');
        console.log('Form data that would be submitted:', data);
        return;
    }

    console.log('Submitting to Google Sheets:', CONFIG.GOOGLE_SCRIPT_URL);
    console.log('Data being submitted:', data);

    try {
        // Use FormData - Google Apps Script requires form-encoded data
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const responseText = await response.text();
        console.log('Response text:', responseText);

        // Parse JSON response
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            // If we can't parse JSON but got a 200-ish response, assume success
            if (response.ok || response.status === 0) {
                console.log('Could not parse response as JSON, assuming success');
                return { success: true };
            }
            throw new Error('Invalid response from server');
        }

        if (!result.success) {
            throw new Error(result.error || 'Submission failed');
        }

        return result;
    } catch (error) {
        console.error('Error in submitToGoogleSheets:', error);
        throw error;
    }
}

// ================================
// Success State
// ================================
function showSuccess() {
    form.style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    applyToggle.style.display = 'none';
    successMessage.style.display = 'block';
    applicationContent.classList.add('expanded');
    scrollToTop();
}

// ================================
// Utility Functions
// ================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ================================
// Save Draft Feature
// ================================
function initializeDraftFeature() {
    const draftModal = document.getElementById('draftModal');
    const draftModalClose = document.getElementById('draftModalClose');
    const draftCancelBtn = document.getElementById('draftCancelBtn');
    const draftCloseBtn = document.getElementById('draftCloseBtn');
    const draftConfirmBtn = document.getElementById('draftConfirmBtn');
    const draftEmailInput = document.getElementById('draftEmail');
    const draftDismissBanner = document.getElementById('draftDismissBanner');

    // Save Draft button opens modal
    saveDraftBtn.addEventListener('click', openDraftModal);

    // Modal close handlers
    draftModalClose.addEventListener('click', closeDraftModal);
    draftCancelBtn.addEventListener('click', closeDraftModal);
    draftCloseBtn.addEventListener('click', closeDraftModal);

    // Close on overlay click
    draftModal.addEventListener('click', (e) => {
        if (e.target === draftModal) closeDraftModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && draftModal.style.display !== 'none') {
            closeDraftModal();
        }
    });

    // Confirm save
    draftConfirmBtn.addEventListener('click', handleSaveDraft);

    // Allow Enter key in email input to confirm
    draftEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveDraft();
        }
    });

    // Dismiss restored banner
    if (draftDismissBanner) {
        draftDismissBanner.addEventListener('click', () => {
            document.getElementById('draftRestoredBanner').style.display = 'none';
        });
    }
}

function openDraftModal() {
    const draftModal = document.getElementById('draftModal');
    const draftModalForm = document.getElementById('draftModalForm');
    const draftModalSuccess = document.getElementById('draftModalSuccess');
    const draftError = document.getElementById('draftError');
    const draftConfirmBtn = document.getElementById('draftConfirmBtn');
    const draftEmailInput = document.getElementById('draftEmail');

    // Pre-fill email if user already entered it on step 1
    const emailField = document.getElementById('email');
    if (emailField && emailField.value) {
        draftEmailInput.value = emailField.value;
    }

    // Reset modal to form state
    draftModalForm.style.display = 'block';
    draftModalSuccess.style.display = 'none';
    draftError.style.display = 'none';
    draftConfirmBtn.disabled = false;
    draftConfirmBtn.textContent = 'Save & Send Link';

    // Show modal
    draftModal.style.display = 'flex';

    // Focus email input
    setTimeout(() => draftEmailInput.focus(), 100);
}

function closeDraftModal() {
    document.getElementById('draftModal').style.display = 'none';
}

async function handleSaveDraft() {
    const draftEmailInput = document.getElementById('draftEmail');
    const draftError = document.getElementById('draftError');
    const draftConfirmBtn = document.getElementById('draftConfirmBtn');
    const draftModalForm = document.getElementById('draftModalForm');
    const draftModalSuccess = document.getElementById('draftModalSuccess');

    const email = draftEmailInput.value.trim();

    // Validate email
    if (!email) {
        showDraftError('Please enter your email address.');
        return;
    }
    if (!isValidEmail(email)) {
        showDraftError('Please enter a valid email address.');
        return;
    }

    // Show loading state
    draftConfirmBtn.disabled = true;
    draftConfirmBtn.textContent = 'Saving...';
    draftError.style.display = 'none';

    try {
        // Gather all current form data
        const currentFormData = {};
        const formDataObj = new FormData(form);

        formDataObj.forEach((value, key) => {
            if (currentFormData[key]) {
                if (!Array.isArray(currentFormData[key])) {
                    currentFormData[key] = [currentFormData[key]];
                }
                currentFormData[key].push(value);
            } else {
                currentFormData[key] = value;
            }
        });

        // Collect file URLs if any files have already been uploaded
        const fileUrls = {};
        ['videoIntro', 'pitchDeck', 'headshot'].forEach(field => {
            const urlInput = document.getElementById(field + 'Url');
            if (urlInput && urlInput.value) {
                fileUrls[field] = urlInput.value;
            }
        });

        // Also save file names for display on restore
        const fileNames = {};
        Object.keys(uploadedFiles).forEach(key => {
            fileNames[key] = uploadedFiles[key].name;
        });
        currentFormData._uploadedFileNames = fileNames;

        // Build the payload
        const payload = {
            email: email,
            formData: currentFormData,
            currentStep: currentStep,
            fileUrls: fileUrls
        };

        // Send to backend
        const postData = new FormData();
        postData.append('data', JSON.stringify(payload));

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=saveDraft', {
            method: 'POST',
            body: postData
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid response from server');
        }

        if (!result.success) {
            throw new Error(result.error || 'Failed to save draft');
        }

        // Show success state
        draftModalForm.style.display = 'none';
        draftModalSuccess.style.display = 'block';

    } catch (error) {
        console.error('Error saving draft:', error);
        showDraftError('Something went wrong. Please try again.');
        draftConfirmBtn.disabled = false;
        draftConfirmBtn.textContent = 'Save & Send Link';
    }
}

function showDraftError(message) {
    const draftError = document.getElementById('draftError');
    draftError.textContent = message;
    draftError.style.display = 'block';
}

// ================================
// Draft Restoration (from email link)
// ================================
async function checkForDraftRestore() {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');

    if (!draftId) return;

    try {
        // Fetch draft data from backend
        const response = await fetch(
            CONFIG.GOOGLE_SCRIPT_URL + '?action=loadDraft&draftId=' + encodeURIComponent(draftId)
        );

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Could not parse draft response');
            return;
        }

        if (!result.success) {
            alert(result.error || 'Could not load your saved draft.');
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        // Merge file URLs into form data for restoration
        const draftFormData = result.formData || {};
        const fileUrls = result.fileUrls || {};

        // Preserve current step
        draftFormData._currentStep = result.currentStep || 1;

        // Save to localStorage so existing loadSavedData() handles restoration
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(draftFormData));

        // Reload saved data using the existing function
        loadSavedData();

        // Restore file URL hidden inputs (loadSavedData skips hidden inputs)
        Object.keys(fileUrls).forEach(field => {
            const urlInput = document.getElementById(field + 'Url');
            if (urlInput) {
                urlInput.value = fileUrls[field];
                // Update the upload zone to show "already uploaded"
                const zone = document.querySelector('.file-upload-zone[data-field="' + field + '"]');
                if (zone) {
                    const preview = zone.querySelector('.upload-preview');
                    zone.classList.add('has-file');
                    if (preview) {
                        preview.innerHTML =
                            '<div class="file-name">' +
                            '<span>Previously uploaded (ready)</span>' +
                            '</div>';
                    }
                }
            }
        });

        // Update UI to correct step
        updateUI();

        // Expand the application form
        expandApplication();

        // Show the restored banner
        document.getElementById('draftRestoredBanner').style.display = 'block';

        // Scroll to the form
        setTimeout(() => scrollToAndOpenForm(), 300);

        // Clean up the URL (remove ?draft= parameter)
        window.history.replaceState({}, '', window.location.pathname);

    } catch (error) {
        console.error('Error loading draft:', error);
    }
}

// ============================================================
//  Spotlight Storyteller — scroll-driven animation
// ============================================================
(function () {
    const inner = document.querySelector('.storyteller-inner');
    if (!inner) return;

    const chapters = Array.from(document.querySelectorAll('.storyteller-chapter'));
    const navFills = Array.from(document.querySelectorAll('.storyteller-nav-fill'));
    const N = chapters.length;

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function mapRange(v, a, b, c, d) {
        return c + (d - c) * clamp((v - a) / (b - a), 0, 1);
    }

    // getTarget() returns -0.12 → 0 while the hero is still scrolling off screen
    // (rect.top > 0 = section not yet pinned), then 0 → 1 through the sticky phase.
    // This lets chapter 01 start animating the moment any black is visible.
    function getTarget() {
        const rect = inner.getBoundingClientRect();
        const total = inner.offsetHeight - window.innerHeight;
        if (rect.top > 0) {
            return mapRange(rect.top, window.innerHeight, 0, -0.12, 0);
        }
        return clamp(-rect.top / total, 0, 1);
    }

    // Init from current scroll position so hard-refresh mid-page looks correct
    let target = getTarget();
    let current = target;
    let rafId = null;

    function render() {
        current += (target - current) * 0.08; // spring smoothing
        const p = current;

        chapters.forEach(function (chapter, i) {
            const isEven = i % 2 === 0;
            const s = i / N,  e = (i + 1) / N;
            // Chapter 01: enter spans the approach (-0.12) through early sticky (0.02).
            // Chapters 02 & 03: standard timing relative to their scroll band.
            const tE0 = i === 0 ? -0.12 : s;
            const tE1 = i === 0 ?  0.02 : s + 0.4 / N;
            const iE0 = i === 0 ? -0.06 : s + 0.3 / N;
            const iE1 = i === 0 ?  0.05 : s + 0.7 / N;
            const x0  = e - 0.15 / N, x1  = e;

            // Text
            let tx = p < tE1
                ? mapRange(p, tE0, tE1, isEven ? -200 : 200, 0)
                : mapRange(p, x0,  x1,  0, isEven ? -100 : 100);
            let to = p < tE1
                ? mapRange(p, tE0, tE1, 0, 1)
                : mapRange(p, x0,  x1,  1, 0);

            // Image
            let ix = p < iE1
                ? mapRange(p, iE0, iE1, isEven ? 200 : -200, 0)
                : mapRange(p, x0,  x1,  0, isEven ? 100 : -100);
            let io = p < iE1
                ? mapRange(p, iE0, iE1, 0, 1)
                : mapRange(p, x0,  x1,  1, 0);
            let isc = p < iE1
                ? mapRange(p, iE0, iE1, 0.9, 1)
                : 1;

            const textEl  = chapter.querySelector('.chapter-text');
            const imageEl = chapter.querySelector('.chapter-image');

            chapter.style.opacity = Math.max(to, io);
            textEl.style.transform  = 'translateX(' + tx + 'px)';
            textEl.style.opacity    = to;
            imageEl.style.transform = 'translateX(' + ix + 'px) scale(' + isc + ')';
            imageEl.style.opacity   = io;

            // Nav fill
            if (navFills[i]) {
                const pct = clamp((p - s) / (e - s), 0, 1);
                navFills[i].style.transform = 'scaleY(' + pct + ')';
            }
        });

        if (Math.abs(current - target) > 0.0001) {
            rafId = requestAnimationFrame(render);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('scroll', function () {
        target = getTarget();
        if (!rafId) rafId = requestAnimationFrame(render);
    }, { passive: true });

    render(); // initial state
}());

// ============================================================
//  Top 10 Finalists — scroll-driven TV reveal + text cards
//  Slide 0  : opacity cross-fade (TV turning on)
//  Slides 1–9: clip-path wipe, top-to-bottom pixel reveal
//  Text cards: opacity fade, in sync with their paired TV slide
// ============================================================
(function () {
    const inner  = document.querySelector('.finalists-inner');
    if (!inner) return;

    const blank  = document.querySelector('.finalists-tv-blank');
    const slides = Array.from(document.querySelectorAll('.finalists-tv-slide'));
    const cards  = Array.from(document.querySelectorAll('.finalist-card'));
    const N      = slides.length; // 10

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function mapRange(v, a, b, c, d) {
        return c + (d - c) * clamp((v - a) / (b - a), 0, 1);
    }

    function getTarget() {
        const rect  = inner.getBoundingClientRect();
        const total = inner.offsetHeight - window.innerHeight;
        return clamp(-rect.top / total, 0, 1);
    }

    // Slides 1–9 are hidden via clip-path (not opacity) so
    // they don't block slides beneath them while waiting.
    slides.forEach(function (slide, i) {
        if (i > 0) {
            slide.style.opacity  = '1';
            slide.style.clipPath = 'inset(0 0 100% 0)';
        }
    });

    let target  = getTarget();
    let current = target;
    let rafId   = null;

    // buf: fraction of each segment used as dwell padding on each side.
    // 0.02 = 20% dwell | 60% transition | 20% dwell per segment.
    const buf = 0.02;

    function render() {
        current += (target - current) * 0.07;
        const p = current;

        // --- TV slides ---
        slides.forEach(function (slide, i) {
            const segStart = i / N;
            const segEnd   = (i + 1) / N;

            if (i === 0) {
                // GrioTime: opacity cross-fade (TV turning on)
                slide.style.opacity = mapRange(p, segStart + buf, segEnd - buf, 0, 1);
            } else {
                // Finnie → Style-MyCrown: wipe from top to bottom.
                const pct = mapRange(p, segStart + buf, segEnd - buf, 100, 0);
                slide.style.clipPath = 'inset(0 0 ' + pct.toFixed(3) + '% 0)';
            }
        });

        // Blank fades out in sync with slide 0 fading in.
        blank.style.opacity = mapRange(p, buf, 1 / N - buf, 1, 0);

        // --- Text cards ---
        // Card i fades IN with its TV slide, stays visible through the dwell,
        // then fades OUT as the next TV slide comes in.
        cards.forEach(function (card, i) {
            const fadeInStart  = i / N + buf;
            const fadeInEnd    = (i + 1) / N - buf;
            const fadeOutStart = (i + 1) / N + buf;
            const fadeOutEnd   = (i + 2) / N - buf;
            var opacity;
            if (i === N - 1) {
                // Last card: fade in and stay.
                opacity = mapRange(p, fadeInStart, fadeInEnd, 0, 1);
            } else if (p <= fadeInStart) {
                opacity = 0;
            } else if (p <= fadeInEnd) {
                opacity = mapRange(p, fadeInStart, fadeInEnd, 0, 1);
            } else if (p <= fadeOutStart) {
                opacity = 1;
            } else {
                opacity = mapRange(p, fadeOutStart, fadeOutEnd, 1, 0);
            }
            card.style.opacity = opacity;
        });

        if (Math.abs(current - target) > 0.0001) {
            rafId = requestAnimationFrame(render);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('scroll', function () {
        target = getTarget();
        if (!rafId) rafId = requestAnimationFrame(render);
    }, { passive: true });

    render(); // paint initial state
}());

// ============================================================
//  Hackathon photo carousel
// ============================================================
(function () {
    const carousel = document.querySelector('.hackathon-carousel');
    if (!carousel) return;

    const track  = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dots   = Array.from(carousel.querySelectorAll('.carousel-dot'));
    const prev   = carousel.querySelector('.carousel-btn-prev');
    const next   = carousel.querySelector('.carousel-btn-next');
    const total  = slides.length;
    let current  = 0;
    let timer;

    function goTo(index) {
        current = (index + total) % total;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    function startAuto() {
        timer = setInterval(function () { goTo(current + 1); }, 4000);
    }

    function resetAuto() {
        clearInterval(timer);
        startAuto();
    }

    prev.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    next.addEventListener('click', function () { goTo(current + 1); resetAuto(); });
    dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { goTo(i); resetAuto(); });
    });

    goTo(0);
    startAuto();
}());
