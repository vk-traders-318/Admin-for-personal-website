/* ============================================================
   ADMIN-FIREBASE.JS — Admin Panel Firebase Logic
   Handles: Auth guard, Profile/Contact/Social CRUD, Stats
   ============================================================
   🔴 SETUP: Same firebaseConfig as js/firebase.js
   Copy your config below.
   ============================================================ */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAc5Vs0NDIeERx4R7jv-ZMhDzb0xob3bNM",
  authDomain: "portfolio-social-4ce3a.firebaseapp.com",
  projectId: "portfolio-social-4ce3a",
  storageBucket: "portfolio-social-4ce3a.firebasestorage.app",
  messagingSenderId: "224911396049",
  appId: "1:224911396049:web:337b7e5cc0abbbcebb89f0",
  measurementId: "G-D3WL5Q6ZF0"
};


/* ──────────────────────────────────────────
   INITIALIZE FIREBASE
────────────────────────────────────────── */
let db;
let auth;

try {
  // Check if already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("✅ Admin Firebase connected.");
} catch (err) {
  console.error("❌ Admin Firebase init failed:", err.message);
}

/* ──────────────────────────────────────────
   AUTH GUARD
   - admin.html: redirect to login if not authenticated
   - admin-login.html: redirect to admin if already logged in
────────────────────────────────────────── */
const currentPage = window.location.pathname;

firebase.auth().onAuthStateChanged((user) => {
  const isAdminPage = currentPage.includes('admin.html');
  const isLoginPage = currentPage.includes('admin-login.html');

  if (isAdminPage) {
    if (!user) {
      // Not logged in → go to login
      window.location.href = 'admin-login.html';
    } else {
      // Logged in → load admin data
      const emailEl = document.getElementById('adminEmail');
      if (emailEl) emailEl.textContent = user.email;
      loadAdminData();
    }
  }

  if (isLoginPage) {
    if (user) {
      // Already logged in → go to admin
      window.location.href = 'admin.html';
    }
  }
});

/* ──────────────────────────────────────────
   LOAD ALL ADMIN DATA
────────────────────────────────────────── */
async function loadAdminData() {
  if (!db) return;
  await Promise.all([
    adminLoadProfile(),
    adminLoadContact(),
    adminLoadSocials(),
    adminLoadStats()
  ]);
}

/* ──────────────────────────────────────────
   1. PROFILE — Load
────────────────────────────────────────── */
async function adminLoadProfile() {
  try {
    const doc = await db.collection('site').doc('profile').get();
    if (doc.exists) {
      if (typeof window.populateProfileForm === 'function') {
        window.populateProfileForm(doc.data());
      }
    }
  } catch (err) {
    console.error("❌ adminLoadProfile:", err.message);
  }
}

/* ──────────────────────────────────────────
   2. PROFILE — Save
────────────────────────────────────────── */
window.adminSaveProfile = async function (data) {
  if (!db) throw new Error('Firebase not connected.');
  await db.collection('site').doc('profile').set(data, { merge: true });
};

/* ──────────────────────────────────────────
   3. CONTACT — Load
────────────────────────────────────────── */
async function adminLoadContact() {
  try {
    const doc = await db.collection('site').doc('contact').get();
    if (doc.exists) {
      if (typeof window.populateContactForm === 'function') {
        window.populateContactForm(doc.data());
      }
    }
  } catch (err) {
    console.error("❌ adminLoadContact:", err.message);
  }
}

/* ──────────────────────────────────────────
   4. CONTACT — Save
────────────────────────────────────────── */
window.adminSaveContact = async function (data) {
  if (!db) throw new Error('Firebase not connected.');
  await db.collection('site').doc('contact').set(data, { merge: true });
};

/* ──────────────────────────────────────────
   5. SOCIAL LINKS — Load
────────────────────────────────────────── */
window.adminLoadSocials = async function () {
  try {
    let snapshot;
    try {
      snapshot = await db.collection('socials').orderBy('order', 'asc').get();
    } catch {
      snapshot = await db.collection('socials').get();
    }

    const links = [];
    snapshot.forEach(doc => {
      links.push({ id: doc.id, ...doc.data() });
    });

    if (typeof window.renderAdminSocials === 'function') {
      window.renderAdminSocials(links);
    }

    return links;
  } catch (err) {
    console.error("❌ adminLoadSocials:", err.message);
    return [];
  }
};

/* ──────────────────────────────────────────
   6. SOCIAL LINKS — Add
────────────────────────────────────────── */
window.adminAddSocial = async function (data) {
  if (!db) throw new Error('Firebase not connected.');
  await db.collection('socials').add({
    name: data.name,
    url: data.url,
    iconUrl: data.iconUrl,
    order: data.order || 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

/* ──────────────────────────────────────────
   7. SOCIAL LINKS — Delete
────────────────────────────────────────── */
window.adminDeleteSocial = async function (id) {
  if (!db) throw new Error('Firebase not connected.');
  await db.collection('socials').doc(id).delete();
};

/* ──────────────────────────────────────────
   8. STATS — Load visitor count
────────────────────────────────────────── */
async function adminLoadStats() {
  try {
    const doc = await db.collection('site').doc('stats').get();
    const count = doc.exists ? (doc.data().visitors || 0) : 0;

    const el = document.getElementById('adminVisitorCount');
    if (el) el.textContent = count.toLocaleString();
  } catch (err) {
    console.error("❌ adminLoadStats:", err.message);
    const el = document.getElementById('adminVisitorCount');
    if (el) el.textContent = '—';
  }
}

/* ──────────────────────────────────────────
   FIRESTORE SECURITY RULES (copy to Firebase Console)
   ──────────────────────────────────────────
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Public read for profile, contact, socials, stats
       match /site/{doc} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /socials/{doc} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ──────────────────────────────────────────
   HOW TO CREATE ADMIN USER:
   1. Firebase Console → Authentication → Users
   2. Add User → Enter your email & password
   3. Use those credentials to log in at admin-login.html
   ────────────────────────────────────────── */
