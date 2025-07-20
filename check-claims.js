// This is a temporary script for debugging custom claims.
const { getAuth } = require('firebase-admin/auth');
const { initializeApp, cert } = require('firebase-admin/app');
const adminSdkConfig = require('./firebase-adminsdk.json');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(adminSdkConfig),
});

async function checkCustomClaims(uid) {
  if (!uid || uid === 'USER_UID_HERE') {
    console.error("ERROR: Please replace 'USER_UID_HERE' in check-claims.js with an actual user UID before running the script.");
    process.exit(1);
  }
  try {
    const user = await getAuth().getUser(uid);
    console.log(`Custom claims for user ${uid}:`, user.customClaims || '{} (no claims set)');
  } catch (error) {
    console.error(`Failed to get user ${uid}:`, error.message);
  }
}

// Replace 'USER_UID_HERE' with the actual UID of the user you want to check.
const uidToCheck = 'USER_UID_HERE'; 

checkCustomClaims(uidToCheck);
