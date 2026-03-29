/* ============================================================
   CLOUDINARY.JS — User Side (Read-only config)
   Upload logic is in admin-cloudinary.js
   This file stores your Cloudinary cloud name for image URLs
   ============================================================ */

window.CLOUDINARY_CONFIG = {
  cloudName: 'dlcl0dzsf',
  uploadPreset: 'portfolio',
  uploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  }
};

/* ──────────────────────────────────────────
   HELPER: Build a Cloudinary image URL
────────────────────────────────────────── */
window.getCloudinaryUrl = function (publicId, options = {}) {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  const transforms = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
  return `https://res.cloudinary.com/${window.CLOUDINARY_CONFIG.cloudName}/image/upload/${transforms}/${publicId}`;
};

/* ──────────────────────────────────────────
   BASIC UPLOAD (fallback)
────────────────────────────────────────── */
window.uploadToCloudinary = async function (file, folder = 'portfolio') {
  if (!file) throw new Error('No file provided.');

  const config = window.CLOUDINARY_CONFIG;

  if (!config || !config.cloudName) {
    throw new Error('Cloudinary not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(config.uploadUrl(), {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Cloudinary upload failed.');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id
  };
};

console.log("✅ Cloudinary config loaded:", window.CLOUDINARY_CONFIG);