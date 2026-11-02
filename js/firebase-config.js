/**
 * firebase-config.js — OPTIONAL anonymous game logging (see docs/FIREBASE.md).
 *
 * Leave FIREBASE_CONFIG as `null` and the app never contacts Firebase.
 * To switch logging on, paste your Firebase *web app* config here. These values
 * are NOT secrets (they ship to every browser by design): what protects your data
 * are the Firestore security rules in firebase/firestore.rules.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBvW_9Wq5A30SeDZE_bqZHZqUoF6yFFJT0',
  authDomain: 'komikan-1231f.firebaseapp.com',
  projectId: 'komikan-1231f',
  storageBucket: 'komikan-1231f.firebasestorage.app',
  messagingSenderId: '51355037138',
  appId: '1:51355037138:web:b5bd036f4301b9e8f6ac0b',
};

/** The only Google account allowed to read the data (must match firebase/firestore.rules). */
export const ADMIN_EMAIL = 'hermanelgueta@gmail.com';

/** Pinned Firebase JS SDK (loaded lazily from Google's CDN only when logging is on). */
export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
