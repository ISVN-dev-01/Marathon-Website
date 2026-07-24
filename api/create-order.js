// ═══════════════════════════════════════════════════════════════
//  api/create-order.js
//  Vercel Serverless Function
//
//  What it does:
//    1. Receives {amount, currency, receipt, notes} from the browser
//    2. Creates a Razorpay order using the SECRET key (server-side only)
//    3. Returns the order ID and the PUBLIC Key ID to the browser
//
//  Environment variables required (set in Vercel Dashboard):
//    RAZORPAY_KEY_ID      — your public key  (e.g. rzp_test_xxxxxxxxxxxx)
//    RAZORPAY_KEY_SECRET  — your secret key  (NEVER expose this in frontend)
// ═══════════════════════════════════════════════════════════════

const Razorpay = require('razorpay');

// Initialise Razorpay with server-side keys
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = async function handler(req, res) {
  // ── CORS headers (needed for browser fetch calls) ──
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create the order. Razorpay expects amount in PAISE (₹1 = 100 paise)
    const order = await razorpay.orders.create({
        amount:   Math.round(amount) * 10000000,   // ⚠️ TEMPORARY: Hardcoded to 100 paise (₹1) for live testing
        currency,
        receipt:  receipt || `ym_${Date.now()}`,
        notes,
  });  

    // Return the order details + PUBLIC key ID to the browser
    // The Key ID is safe to send — it is not a secret
    return res.status(200).json({
      id:       order.id,          // e.g. order_XXXXXXXXXXXXXXXX
      amount:   order.amount,      // in paise
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,   // public — safe for frontend
    });

  } catch (err) {
    console.error('[create-order] Razorpay error:', err);
    return res.status(500).json({
      error: 'Failed to create payment order. Please try again.',
    });
  }
};
