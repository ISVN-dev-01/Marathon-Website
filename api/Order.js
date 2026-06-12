// api/create-order.js
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  // Allow CORS pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initializes Razorpay with secret environment keys securely stored on Vercel
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, email } = req.body;

    const options = {
      amount: Number(amount) * 100, // Razorpay calculates amounts in smallest currency units (Paise). ₹500 = 50000 paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { runner_email: email }
    };

    const order = await instance.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};