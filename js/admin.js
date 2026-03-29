/* ============================================================
   ADMIN.JS — Admin Panel Main Logic
   Handles: Tab switching, Profile/Contact/Social forms
   Works with: admin-firebase.js, admin-cloudinary.js
   ============================================================ */

/* ──────────────────────────────────────────
   DOM READY
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSidebar();
});

/* ──────────────────────────────────────────
   1. TAB SWITCHING
────────────────────────────────────────── */
function initTabs() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;

      // Update active link
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show matching tab
      tabContents.forEach(tab => tab.classList.remove('active'));
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add('active');

      // Close sidebar on mobile
      closeSidebar();
    });
  });
}

/* ──────────────────────────────────────────
   2. SIDEBAR MOBILE
────────────────────────────────────────── */
function initSidebar() {
  // Handled via onclick attributes in HTML + these functions
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

/* ──────────────────────────────────────────
   3. TOAST NOTIFICATIONS
────────────────────────────────────────── */
let toastTimer;

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  toastMsg.textContent = message;
  toast.className = 'toast' + (isError ? ' error' : '');

  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* ──────────────────────────────────────────
   4. PROFILE SECTION
────────────────────────────────────────── */

// Called from admin-firebase.js after profile loads
window.populateProfileForm = function (data) {
  if (!data) return;
  const nameInput = document.getElementById('adminName');
  const bioInput = document.getElementById('adminBio');
  const locInput = document.getElementById('adminLocation');
  const imgPreview = document.getElementById('profileImagePreview');

  if (nameInput) nameInput.value = data.name || '';
  if (bioInput) bioInput.value = data.bio || '';
  if (locInput) locInput.value = data.location || '';
  if (imgPreview && data.imageUrl) {
    imgPreview.src = data.imageUrl;
  }
};

// Preview image before upload
function previewProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate
  if (!file.type.startsWith('image/')) {
    showToast('❌ Please select an image file.', true);
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('❌ Image must be under 5MB.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('profileImagePreview');
    if (preview) preview.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Save profile to Firebase
async function saveProfile() {
  const name = document.getElementById('adminName')?.value.trim();
  const bio = document.getElementById('adminBio')?.value.trim();
  const location = document.getElementById('adminLocation')?.value.trim();
  const imageFile = document.getElementById('profileImageInput')?.files[0];

  if (!name) {
    showToast('❌ Name cannot be empty.', true);
    return;
  }

  const btn = document.querySelector('[onclick="saveProfile()"]');
  const btnText = document.getElementById('saveProfileBtnText');
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Saving...';

  try {
    let imageUrl = null;

    if (imageFile) {
      // Show upload progress
      const progressWrap = document.getElementById('profileUploadProgress');
      const progressFill = document.getElementById('profileProgressFill');
      const statusText = document.getElementById('profileUploadStatus');

      if (progressWrap) progressWrap.style.display = 'block';

      // Animate progress bar (indeterminate style)
      let prog = 0;
      const progInterval = setInterval(() => {
        prog = Math.min(prog + 10, 85);
        if (progressFill) progressFill.style.width = prog + '%';
      }, 200);

      try {
        const result = await window.uploadToCloudinary(imageFile, 'profile');
        imageUrl = result.url;
        clearInterval(progInterval);
        if (progressFill) progressFill.style.width = '100%';
        if (statusText) statusText.textContent = 'Upload complete!';
      } catch (uploadErr) {
        clearInterval(progInterval);
        if (progressWrap) progressWrap.style.display = 'none';
        showToast('❌ Image upload failed: ' + uploadErr.message, true);
        return;
      }
    }

    // Build data object
    const profileData = { name, bio, location };
    if (imageUrl) profileData.imageUrl = imageUrl;

    // Save to Firestore (defined in admin-firebase.js)
    await window.adminSaveProfile(profileData);

    showToast('✅ Profile saved successfully!');
  } catch (err) {
    showToast('❌ Error: ' + err.message, true);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Save Profile';
  }
}

/* ──────────────────────────────────────────
   5. CONTACT SECTION
────────────────────────────────────────── */

// Called from admin-firebase.js after contact loads
window.populateContactForm = function (data) {
  if (!data) return;
  const emailEl = document.getElementById('adminEmail2');
  const phoneEl = document.getElementById('adminPhone');
  const waEl = document.getElementById('adminWhatsapp');

  if (emailEl) emailEl.value = data.email || '';
  if (phoneEl) phoneEl.value = data.phone || '';
  if (waEl) waEl.value = data.whatsapp || '';
};

async function saveContact() {
  const email = document.getElementById('adminEmail2')?.value.trim();
  const phone = document.getElementById('adminPhone')?.value.trim();
  const whatsapp = document.getElementById('adminWhatsapp')?.value.trim();

  if (!email) {
    showToast('❌ Email cannot be empty.', true);
    return;
  }

  const btn = document.querySelector('[onclick="saveContact()"]');
  if (btn) btn.disabled = true;

  try {
    const contactData = { email };
    if (phone) contactData.phone = phone;
    if (whatsapp) contactData.whatsapp = whatsapp;

    await window.adminSaveContact(contactData);
    showToast('✅ Contact info saved!');
  } catch (err) {
    showToast('❌ Error: ' + err.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ──────────────────────────────────────────
   6. SOCIAL LINKS SECTION
────────────────────────────────────────── */
let socialIconFile = null; // Holds the selected icon file

function previewSocialIcon(event) {
  socialIconFile = event.target.files[0];
  if (!socialIconFile) return;

  const previewWrap = document.getElementById('socialIconPreviewWrap');
  const preview = document.getElementById('socialIconPreview');
  const nameEl = document.getElementById('socialIconName');

  const reader = new FileReader();
  reader.onload = (e) => {
    if (preview) preview.src = e.target.result;
    if (nameEl) nameEl.textContent = socialIconFile.name;
    if (previewWrap) previewWrap.style.display = 'flex';
  };
  reader.readAsDataURL(socialIconFile);
}

async function addSocialLink() {
  const name = document.getElementById('newSocialName')?.value.trim();
  const url = document.getElementById('newSocialUrl')?.value.trim();

  if (!name || !url) {
    showToast('❌ Name and URL are required.', true);
    return;
  }

  if (!url.startsWith('http')) {
    showToast('❌ URL must start with https://', true);
    return;
  }

  const btn = document.querySelector('[onclick="addSocialLink()"]');
  if (btn) btn.disabled = true;

  try {
    let iconUrl = `https://via.placeholder.com/52x52/1a1a2e/00ffc8?text=${name[0]}`;

    if (socialIconFile) {
      const progressWrap = document.getElementById('socialUploadProgress');
      const progressFill = document.getElementById('socialProgressFill');
      const statusText = document.getElementById('socialUploadStatus');

      if (progressWrap) progressWrap.style.display = 'block';

      let prog = 0;
      const progInt = setInterval(() => {
        prog = Math.min(prog + 12, 85);
        if (progressFill) progressFill.style.width = prog + '%';
      }, 200);

      try {
        const result = await window.uploadToCloudinary(socialIconFile, 'socials');
        iconUrl = result.url;
        clearInterval(progInt);
        if (progressFill) progressFill.style.width = '100%';
        if (statusText) statusText.textContent = 'Upload done!';
      } catch (uploadErr) {
        clearInterval(progInt);
        if (progressWrap) progressWrap.style.display = 'none';
        showToast('❌ Icon upload failed: ' + uploadErr.message, true);
        return;
      }
    }

    // Get current count for ordering
    const currentList = document.querySelectorAll('.social-list-item');
    const order = currentList.length;

    await window.adminAddSocial({ name, url, iconUrl, order });

    // Reset form
    document.getElementById('newSocialName').value = '';
    document.getElementById('newSocialUrl').value = '';
    document.getElementById('newSocialIcon').value = '';
    socialIconFile = null;
    const previewWrap = document.getElementById('socialIconPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    const progressWrap = document.getElementById('socialUploadProgress');
    if (progressWrap) progressWrap.style.display = 'none';

    showToast('✅ Social link added!');

    // Reload list
    await window.adminLoadSocials();

  } catch (err) {
    showToast('❌ Error: ' + err.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteSocial(id) {
  if (!confirm('Delete this social link?')) return;
  try {
    await window.adminDeleteSocial(id);
    showToast('✅ Deleted!');
    await window.adminLoadSocials();
  } catch (err) {
    showToast('❌ Error: ' + err.message, true);
  }
}

// Render social links list in admin
window.renderAdminSocials = function (links) {
  const listEl = document.getElementById('socialLinksList');
  if (!listEl) return;

  // Update social count stat
  const countEl = document.getElementById('adminSocialCount');
  if (countEl) countEl.textContent = links.length;

  if (links.length === 0) {
    listEl.innerHTML = `
      <p style="color:var(--text-muted);font-size:0.875rem;padding:16px 0;">
        No social links yet. Add your first one above!
      </p>`;
    return;
  }

  listEl.innerHTML = '';

  links.forEach(link => {
    const item = document.createElement('div');
    item.className = 'social-list-item';
    item.innerHTML = `
      <img
        src="${link.iconUrl}"
        alt="${link.name}"
        class="social-list-icon"
        onerror="this.src='https://via.placeholder.com/42x42/1a1a2e/00ffc8?text=${link.name[0]}'"
      />
      <div class="social-list-info">
        <p class="social-list-name">${link.name}</p>
        <p class="social-list-url">${link.url}</p>
      </div>
      <div class="social-list-actions">
        <a href="${link.url}" target="_blank" class="btn btn-outline btn-sm" title="Visit">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <button class="btn btn-danger btn-sm" onclick="deleteSocial('${link.id}')" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    listEl.appendChild(item);
  });
};

/* ──────────────────────────────────────────
   7. LOGOUT
────────────────────────────────────────── */
async function handleLogout() {
  try {
    await firebase.auth().signOut();
    window.location.href = 'admin-login.html';
  } catch (err) {
    showToast('❌ Logout failed: ' + err.message, true);
  }
}
