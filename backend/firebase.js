const admin = require('firebase-admin');
const path = require('path');  // Use path module to handle paths properly

// Specify the full path to your service account key
const serviceAccount = require(path.join(__dirname, 'final-web-c625f-firebase-adminsdk-jbfri-80ae4864fc.json')); 

// Initialize Firebase Admin SDK with the service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),  // Provide the credentials
  databaseURL: 'https://final-web-c625f-default-rtdb.firebaseio.com'  // Use the correct Realtime Database URL
});

// Initialize the Firebase Realtime Database
const db = admin.database();

module.exports = { db };
