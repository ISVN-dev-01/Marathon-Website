// ═══════════════════════════════════════════════════════════════
//  api/verify-payment.js
//  Vercel Serverless Function
//
//  What it does:
//    1. Receives the three Razorpay IDs + user data from the browser
//    2. Verifies the payment signature using HMAC-SHA256
//       (this is the critical security step — never skip it)
//    3. If valid, appends a new row to your Google Sheet
//    4. Returns success/failure to the browser
//
//  Environment variables required (set in Vercel Dashboard):
//    RAZORPAY_KEY_SECRET           — your Razorpay secret key
//    GOOGLE_SERVICE_ACCOUNT_EMAIL  — e.g. marathon@your-project.iam.gserviceaccount.com
//    GOOGLE_PRIVATE_KEY            — the private_key from your service account JSON
//    GOOGLE_SHEET_ID               — the long ID from your Google Sheet URL
// ═══════════════════════════════════════════════════════════════

const crypto     = require('crypto');
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userData,            // { name, email, phone, age, gender, city, category, tshirtSize, emergencyContact, amount }
    } = req.body;

    // ── STEP 1: Verify Razorpay signature (CRITICAL security check) ──
    // Razorpay signs the response as:  HMAC_SHA256(order_id + "|" + payment_id, secret)
    const sigBody  = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sigBody)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.error('[verify-payment] Signature mismatch — possible fraud attempt');
      return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // ── STEP 2: Signature is valid — write to Google Sheets ──
    await appendToSheet({
      timestamp:        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      name:             userData.name             || '',
      email:            userData.email            || '',
      phone:            userData.phone            || '',
      age:              userData.age              || '',
      gender:           userData.gender           || '',
      city:             userData.city             || '',
      category:         userData.category         || '',
      tshirtSize:       userData.tshirtSize        || '',
      emergencyContact: userData.emergencyContact || '',
      amount:           `₹${userData.amount}`,
      paymentId:        razorpay_payment_id,
      orderId:          razorpay_order_id,
      status:           'PAID',
    });

    return res.status(200).json({
      success:   true,
      paymentId: razorpay_payment_id,
      message:   'Registration confirmed!',
    });

  } catch (err) {
    console.error('[verify-payment] Error:', err);
    return res.status(500).json({
      error: 'Verification succeeded but data could not be saved. Please screenshot your Payment ID.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  Google Sheets helper
// ─────────────────────────────────────────────────────────────
async function appendToSheet(data) {
  // Authenticate using the service account
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Vercel stores the private key with literal \n — replace back to real newlines
      private_key:  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // The row to insert — order matches the header row you'll create in the sheet
  const rowValues = [[
    data.timestamp,         // Column A
    data.name,              // Column B
    data.email,             // Column C
    data.phone,             // Column D
    data.age,               // Column E
    data.gender,            // Column F
    data.city,              // Column G
    data.category,          // Column H
    data.tshirtSize,        // Column I
    data.emergencyContact,  // Column J
    data.amount,            // Column K
    data.paymentId,         // Column L
    data.orderId,           // Column M
    data.status,            // Column N
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId:   process.env.GOOGLE_SHEET_ID,
    range:           'Sheet1!A:N',        // Sheet name + column range
    valueInputOption:'USER_ENTERED',
    requestBody:     { values: rowValues },
  });
}
