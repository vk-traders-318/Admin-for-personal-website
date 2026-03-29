/* ============================================================
   ADMIN-CLOUDINARY.JS — Admin Panel Cloudinary Upload Logic
   This extends the base cloudinary.js with admin-specific helpers
   ============================================================
   🔴 SETUP:
   Make sure js/cloudinary.js has been loaded BEFORE this file.
   Set your cloudName and uploadPreset in js/cloudinary.js
   ============================================================ */

/* ──────────────────────────────────────────
   UPLOAD WITH PROGRESS CALLBACK
   More advanced version of uploadToCloudinary
   that supports real progress updates via XHR
────────────────────────────────────────── */
window.uploadToCloudinaryWithProgress = function (
  file,
  folder = 'portfolio',
  onProgress = null
) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided.'));
    }

    const config = window.CLOUDINARY_CONFIG;

    // ✅ FIXED CONDITION
    if (!config || !config.cloudName) {
      return reject(new Error('Cloudinary is not configured. Please update js/cloudinary.js'));
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Only image files are allowed.'));
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return reject(new Error('File size must be under 5MB.'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format
          });
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload. Check your internet connection.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled.'));
    });

    xhr.open('POST', config.uploadUrl());
    xhr.send(formData);
  });
};

/* ──────────────────────────────────────────
   OVERRIDE: uploadToCloudinary to use XHR version
   so admin gets progress bars by default
────────────────────────────────────────── */
window.uploadToCloudinary = async function (file, folder = 'portfolio') {
  return window.uploadToCloudinaryWithProgress(file, folder, null);
};

/* ──────────────────────────────────────────
   HELPER: Validate image file before upload
────────────────────────────────────────── */
window.validateImageFile = function (file) {
  const errors = [];

  if (!file) {
    errors.push('No file selected.');
    return errors;
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported. Use PNG, JPG, WEBP, or GIF.');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
  }

  return errors;
};

/* ──────────────────────────────────────────
   HELPER: Format file size for display
────────────────────────────────────────── */
window.formatFileSize = function (bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

console.log("✅ Admin Cloudinary module loaded.");