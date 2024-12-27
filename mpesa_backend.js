const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment"); // For timestamp formatting

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize Firebase
const serviceAccount = require("./C:\Users\HP\Desktop\black\website1-51acf-firebase-adminsdk-zqi2i-003c0c530f.json"); // Replace with your Firebase service account file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://website1-51acf-default-rtdb.asia-southeast1.firebasedatabase.app", // Replace with your Firebase database URL
});
const db = admin.database();

// M-Pesa Config
const mpesaConfig = {
  shortCode: "6009779", // Replace with your business short code
  passkey: "YOUR_PASSKEY", // Replace with your M-Pesa passkey
  consumerKey: "yKa3IamC4IPCmWlxZtncQjERAhk0QgeFQsu7brPyuaeGIE1j", // Replace with your Daraja consumer key
  consumerSecret: "aYcDGRamOdG3jtOxbK7AHSb8QKn9tg8kicvG7QkufMMDwI7PXE8fXDdE2TNTNKCU", // Replace with your Daraja consumer secret
  baseUrl: "https://api.safaricom.co.ke", // Use live URL in production
  callbackUrl: "https://<your-domain>/mpesa/callback", // Replace with your callback URL
};

// Generate Access Token
async function generateAccessToken() {
  const url = `${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(
    `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
  ).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error generating access token:", error.response.data);
    throw error;
  }
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, transactionDesc) {
  const url = `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`;
  const accessToken = await generateAccessToken();
  const timestamp = moment().format("YYYYMMDDHHmmss");
  const password = Buffer.from(
    `${mpesaConfig.shortCode}${mpesaConfig.passkey}${timestamp}`
  ).toString("base64");

  const requestBody = {
    BusinessShortCode: mpesaConfig.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: mpesaConfig.shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: mpesaConfig.callbackUrl,
    AccountReference: "Product Purchase",
    TransactionDesc: transactionDesc,
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error initiating STK Push:", error.response.data);
    throw error;
  }
}

// Handle Payment Callback
app.post("/mpesa/callback", (req, res) => {
  const callbackData = req.body.Body.stkCallback;

  if (callbackData && callbackData.ResultCode === 0) {
    // Successful transaction
    const transactionDetails = {
      MerchantRequestID: callbackData.MerchantRequestID,
      CheckoutRequestID: callbackData.CheckoutRequestID,
      PhoneNumber: callbackData.CallbackMetadata.Item.find(
        (item) => item.Name === "PhoneNumber"
      ).Value,
      Amount: callbackData.CallbackMetadata.Item.find(
        (item) => item.Name === "Amount"
      ).Value,
      TransactionDate: callbackData.CallbackMetadata.Item.find(
        (item) => item.Name === "TransactionDate"
      ).Value,
    };

    // Log to Firebase
    db.ref("transactions")
      .push(transactionDetails)
      .then(() => console.log("Transaction logged in Firebase:", transactionDetails))
      .catch((err) => console.error("Error logging transaction:", err));
  } else {
    console.error("STK Push failed:", callbackData);
  }

  res.sendStatus(200); // Respond to Safaricom
});

// API Endpoint to Request Payment
app.post("/mpesa/request-payment", async (req, res) => {
  const { phoneNumber, amount, transactionDesc } = req.body;

  if (!phoneNumber || !amount || !transactionDesc) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const response = await initiateSTKPush(phoneNumber, amount, transactionDesc);
    res.status(200).json({
      message: "STK Push initiated. Check your phone for the payment prompt.",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to initiate STK Push.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
