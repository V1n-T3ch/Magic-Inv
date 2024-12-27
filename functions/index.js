/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.mpesaCallback = functions.https.onRequest((request, response) => {
  const mpesaResponse = request.body;

  // Process the M-Pesa callback data here
  console.log('M-Pesa Callback: ', mpesaResponse);

  // Send a response back to M-Pesa
  response.status(200).send('Callback received');
});

// Remove the unused import to fix the linting error
// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
