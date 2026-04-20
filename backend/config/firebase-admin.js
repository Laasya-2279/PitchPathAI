const admin = require("firebase-admin");

// Note: You must place your service-account.json in this directory
// or specify the path via GOOGLE_APPLICATION_CREDENTIALS env var.
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS) 
  : null;

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pitchpath--ai-default-rtdb.firebaseio.com"
  });
} else if (!admin.apps.length) {
  console.warn("⚠️ Firebase Admin not initialized: Missing service-account.json");
}

const db = admin.apps.length ? admin.database() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
