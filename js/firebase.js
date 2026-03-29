/* ============================================================
   FIREBASE.JS — User Side Firebase Logic
   Loads: Profile, Contact Info, Social Links, Visitor Counter
   ============================================================
   🔴 SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use existing)
   3. Enable Firestore Database (Start in test mode for now)
   4. Enable Authentication → Email/Password
   5. Go to Project Settings → Your Apps → Add Web App
   6. Copy the firebaseConfig object below and replace the placeholder values
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

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  console.log("✅ Firebase connected successfully.");
} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  showFirebaseError();
}

/* ──────────────────────────────────────────
   LOAD ALL DATA on page ready
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (!db) return;

  await Promise.all([
    loadProfile(),
    loadContact(),
    loadSocialLinks(),
    handleVisitorCounter()
  ]);
});

/* ──────────────────────────────────────────
   1. LOAD PROFILE DATA
────────────────────────────────────────── */
async function loadProfile() {
  try {
    const doc = await db.collection('site').doc('profile').get();

    if (doc.exists) {
      const data = doc.data();
      // Call script.js render function
      if (typeof window.renderProfile === 'function') {
        window.renderProfile(data);
      }
    } else {
      console.warn("⚠️ Profile document not found in Firestore.");
      if (typeof window.renderProfile === 'function') {
        window.renderProfile({
          name: 'Your Name',
          bio: 'Add your bio from the admin panel.',
          location: '',
          imageUrl: null
        });
      }
    }
  } catch (err) {
    console.error("❌ loadProfile error:", err.message);
  }
}

/* ──────────────────────────────────────────
   2. LOAD CONTACT DATA
────────────────────────────────────────── */
async function loadContact() {
  try {
    const doc = await db.collection('site').doc('contact').get();

    if (doc.exists) {
      const data = doc.data();
      if (typeof window.renderContact === 'function') {
        window.renderContact(data);
      }
    } else {
      console.warn("⚠️ Contact document not found.");
    }
  } catch (err) {
    console.error("❌ loadContact error:", err.message);
  }
}

/* ──────────────────────────────────────────
   3. LOAD SOCIAL LINKS
────────────────────────────────────────── */
async function loadSocialLinks() {
  try {
    const snapshot = await db
      .collection('socials')
      .orderBy('order', 'asc')
      .get();

    const links = [];
    snapshot.forEach(doc => {
      links.push({ id: doc.id, ...doc.data() });
    });

    if (typeof window.renderSocialLinks === 'function') {
      window.renderSocialLinks(links);
    }
  } catch (err) {
    // Fallback without order field
    try {
      const snapshot = await db.collection('socials').get();
      const links = [];
      snapshot.forEach(doc => {
        links.push({ id: doc.id, ...doc.data() });
      });
      if (typeof window.renderSocialLinks === 'function') {
        window.renderSocialLinks(links);
      }
    } catch (e) {
      console.error("❌ loadSocialLinks error:", e.message);
      if (typeof window.renderSocialLinks === 'function') {
        window.renderSocialLinks([]);
      }
    }
  }
}

/* ──────────────────────────────────────────
   4. VISITOR COUNTER
   - Uses Firestore transaction to safely increment
   - Tracks via sessionStorage so refresh doesn't double-count
────────────────────────────────────────── */
async function handleVisitorCounter() {
  try {
    const counterRef = db.collection('site').doc('stats');

    // Only count once per browser session
    const alreadyCounted = sessionStorage.getItem('visit_counted');

    if (!alreadyCounted) {
      // Increment using Firestore transaction
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        if (!doc.exists) {
          transaction.set(counterRef, { visitors: 1 });
        } else {
          const newCount = (doc.data().visitors || 0) + 1;
          transaction.update(counterRef, { visitors: newCount });
        }
      });
      sessionStorage.setItem('visit_counted', 'true');
    }

    // Now read the current count and display it
    const doc = await counterRef.get();
    const count = doc.exists ? (doc.data().visitors || 0) : 0;

    if (typeof window.animateCounter === 'function') {
      window.animateCounter(count);
    }

  } catch (err) {
    console.error("❌ Visitor counter error:", err.message);
    const el = document.getElementById('visitorCount');
    if (el) el.textContent = '---';
  }
}

/* ──────────────────────────────────────────
   FIREBASE ERROR NOTICE
────────────────────────────────────────── */
function showFirebaseError() {
  console.warn("⚠️ Firebase not configured. Please update firebaseConfig in js/firebase.js");
  // Show placeholder data so UI doesn't break
  setTimeout(() => {
    if (typeof window.renderProfile === 'function') {
      window.renderProfile({
        name: '⚙️ Setup Required',
        bio: 'Please configure Firebase in js/firebase.js to load your data.',
        location: '',
        imageUrl: null
      });
    }
    if (typeof window.renderSocialLinks === 'function') {
      window.renderSocialLinks([]);
    }
    const el = document.getElementById('visitorCount');
    if (el) el.textContent = '0';
  }, 500);
}
