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
    updateUI();

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
}

function collapseApplication() {
    applicationContent.classList.remove('expanded');
    applyToggle.classList.remove('expanded');
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
