# Razorpay + Google Sheets Integration Guide
## Yendada Marathon 2026

This guide walks you through every step to wire up live payments and
automatic runner registration data collection.

---

## Project folder structure after this setup

```
your-vercel-project/
├── index.html              ← your existing website (no folder change)
├── package.json            ← NEW  (copy from this download)
├── api/
│   ├── create-order.js     ← NEW  (copy from this download)
│   └── verify-payment.js   ← NEW  (copy from this download)
└── .gitignore              ← NEW  (prevents secrets leaking to GitHub)
```

---

## PHASE 1 — Razorpay Account Setup

### 1.1  Create your account
1. Go to https://razorpay.com and click "Sign Up".
2. Enter your business/personal details and verify your email.
3. Complete the KYC form (PAN card, bank account details).
   ⚠️  KYC is required for live payments. Test mode works immediately without KYC.

### 1.2  Get your API keys
1. Log into the Razorpay Dashboard.
2. Go to: Settings → API Keys → Generate Key (Test Mode first).
3. You will see TWO values — copy BOTH and save them somewhere safe:
   - **Key ID**      — looks like: `rzp_test_AbCdEfGhIjKlMn`  ← NOT a secret, used in frontend
   - **Key Secret**  — looks like: `aBcDeFgHiJkLmNoPqRsTuVwX`  ← SECRET, never share or put in HTML

### 1.3  Test vs Live mode
- Use **Test mode** first (prefix `rzp_test_`). No real money moves.
- Switch to **Live mode** after KYC approval (prefix `rzp_live_`).
- Test card you can use: `4111 1111 1111 1111`  /  any future date  /  any CVV  /  OTP: `1234`

---

## PHASE 2 — Google Sheets + Google Cloud Setup

### 2.1  Create your Google Sheet
1. Go to https://sheets.google.com and create a new spreadsheet.
2. Name it: "Yendada Marathon 2026 — Registrations"
3. In Row 1, add these column headers exactly:
   A: Timestamp
   B: Name
   C: Email
   D: Phone
   E: Age
   F: Gender
   G: City
   H: Category
   I: T-Shirt Size
   J: Emergency Contact
   K: Amount (₹)
   L: Payment ID
   M: Order ID
   N: Status
4. Copy the Sheet ID from the URL:
   https://docs.google.com/spreadsheets/d/ **THIS-LONG-ID** /edit
   Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

### 2.2  Enable Google Sheets API
1. Go to https://console.cloud.google.com
2. Create a new project (or select an existing one).
   Suggested name: `yendada-marathon`
3. In the search bar, type "Google Sheets API" → click it → click "Enable".

### 2.3  Create a Service Account
A service account is like a robot Google account that your server uses to write to the sheet.

1. In Google Cloud Console: IAM & Admin → Service Accounts → "+ Create Service Account"
2. Name:        `marathon-sheets-writer`
3. Description: `Writes runner registrations to Google Sheets`
4. Click "Create and Continue" → skip role assignment → click "Done"
5. Click the service account you just created → go to "Keys" tab
6. "Add Key" → "Create new key" → JSON → "Create"
7. A JSON file downloads automatically. KEEP IT SAFE. It contains:
   - `client_email`  — looks like: `marathon-sheets-writer@yendada-marathon.iam.gserviceaccount.com`
   - `private_key`   — a long string starting with `-----BEGIN RSA PRIVATE KEY-----`

### 2.4  Share the Google Sheet with the service account
1. Open your Google Sheet.
2. Click "Share" (top right).
3. Paste the `client_email` from the JSON file into the share box.
4. Set permission to: **Editor**
5. Uncheck "Notify people" → click "Share".

The service account can now write to your sheet.

---

## PHASE 3 — Add the files to your project

### 3.1  Add package.json to your project root
Copy the `package.json` file from this download into the ROOT of your
Vercel project (same folder as `index.html`).

### 3.2  Create the api/ folder and add the two functions
In the ROOT of your Vercel project, create a folder called `api`.
Copy these two files into it:
- `api/create-order.js`
- `api/verify-payment.js`

### 3.3  Create a .gitignore file (IMPORTANT — prevents secrets leaking)
Create a file called `.gitignore` at the project root with this content:

```
.env.local
.env
node_modules/
*.json.key
service-account*.json
```

---

## PHASE 4 — Set Environment Variables on Vercel

This is where you securely store your API keys.
⚠️  NEVER put these values directly into your HTML or JS files.

### 4.1  Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your marathon project.
3. Go to: Settings → Environment Variables

### 4.2  Add these 5 variables one by one:

| Variable Name                  | Value                                           | Example |
|--------------------------------|-------------------------------------------------|---------|
| `RAZORPAY_KEY_ID`              | Your Razorpay Key ID                            | `rzp_test_AbCdEfGh...` |
| `RAZORPAY_KEY_SECRET`          | Your Razorpay Key Secret                        | `aBcDeFgH...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key file           | `marathon-sheets-writer@...iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY`           | `private_key` from the JSON key file            | `-----BEGIN RSA PRIVATE KEY-----\nMIIE...` |
| `GOOGLE_SHEET_ID`              | The long ID from your Google Sheet URL          | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqp...` |

### 4.3  Special instructions for GOOGLE_PRIVATE_KEY
When you open the downloaded JSON file, find the `private_key` field.
It looks like this:
```
"private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...long string...\n-----END RSA PRIVATE KEY-----\n"
```
Copy ONLY the value between the outer quotes (including the `-----BEGIN` and `-----END` lines).
Paste it as-is into Vercel. Vercel handles the `\n` newline escaping automatically.

### 4.4  Select environments
For each variable, check all three boxes: Production, Preview, Development.

### 4.5  Redeploy
After adding all variables, go to Deployments → click the three dots on your
latest deployment → "Redeploy". This applies the new env vars.

---

## PHASE 5 — Update index.html (payment flow changes)

Open your `index.html` and make two changes:

### 5.1  Add the Razorpay checkout script (in <head>)
Add this line anywhere in the `<head>` section of index.html:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 5.2  Add a spinner animation style (in your existing <style> block)
Add this CSS inside your existing `<style>` tag:
```css
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }
```

### 5.3  Replace the submitPayment() function
In your existing `<script>` section at the bottom of index.html,
find the `function submitPayment()` function and replace the ENTIRE function
with the code below.

⚠️  Copy everything between the === markers below:

=== REPLACE submitPayment() WITH THIS ===

async function submitPayment() {
  document.getElementById('err-tc').classList.remove('show');
  if (!document.getElementById('f-tc').checked) {
    document.getElementById('err-tc').classList.add('show');
    return;
  }

  const payBtn = document.querySelector('#step3 .btn-modal-primary');
  const origBtnHTML = payBtn.innerHTML;

  // Show loading state
  payBtn.disabled = true;
  payBtn.innerHTML = `<span class="spin"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg></span>&nbsp;Processing…`;

  // Collect user data from the form
  const userData = {
    name:             document.getElementById('f-name').value.trim(),
    email:            document.getElementById('f-email').value.trim(),
    phone:            document.getElementById('f-phone').value.trim(),
    age:              document.getElementById('f-age').value,
    gender:           document.getElementById('f-gender').value,
    city:             document.getElementById('f-city').value.trim(),
    category:         selectedCategory,
    tshirtSize:       selectedSize,
    emergencyContact: document.getElementById('f-emg').value.trim(),
    amount:           parseInt((selectedCategoryFee || '0').replace(/[^0-9]/g, ''), 10),
  };

  function resetBtn() {
    payBtn.disabled = false;
    payBtn.innerHTML = origBtnHTML;
  }

  try {
    // ── Step 1: Ask the server to create a Razorpay order ──
    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   userData.amount,
        currency: 'INR',
        receipt:  'ym_' + Date.now(),
        notes: {
          name:     userData.name,
          email:    userData.email,
          category: userData.category,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      throw new Error(err.error || 'Could not create order');
    }
    const order = await orderRes.json();

    // ── Step 2: Open Razorpay Checkout ──
    const rzpOptions = {
      key:         order.key_id,          // Public key from server
      amount:      order.amount,          // In paise
      currency:    order.currency,
      name:        'Yendada Marathon 2026',
      description: userData.category,
      image:       '',                    // Optional: URL to your logo
      order_id:    order.id,
      prefill: {
        name:    userData.name,
        email:   userData.email,
        contact: userData.phone,
      },
      notes: {
        category:    userData.category,
        tshirt_size: userData.tshirtSize,
        city:        userData.city,
      },
      theme: { color: '#E05C1A' },

      // ── Called automatically by Razorpay on successful payment ──
      handler: async function(response) {
        try {
          // ── Step 3: Verify payment on the server + write to Google Sheets ──
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userData,
            }),
          });

          const result = await verifyRes.json();

          if (!verifyRes.ok || !result.success) {
            throw new Error(result.error || 'Verification failed');
          }

          // ── Step 4: Show success screen ──
          document.getElementById('step3').classList.add('hidden');
          document.getElementById('step4').classList.remove('hidden');
          updateStepIndicators(4);
          modalBox.scrollTop = 0;

          // Populate success card
          const confNum = 'YM2026-' + response.razorpay_payment_id.slice(-6).toUpperCase();
          document.getElementById('succ-conf').textContent  = confNum;
          document.getElementById('succ-name').textContent  = userData.name;
          document.getElementById('succ-cat').textContent   = userData.category;
          document.getElementById('succ-email').textContent = userData.email;

          spawnConfetti();

        } catch (verifyErr) {
          console.error('Verification error:', verifyErr);
          alert(
            'Your payment was received but we could not confirm it automatically.\n\n' +
            'Payment ID: ' + response.razorpay_payment_id + '\n\n' +
            'Please screenshot this and email us at support@yendadamarathon.in'
          );
          resetBtn();
        }
      },

      modal: {
        ondismiss: function() {
          // User closed the Razorpay popup without paying
          resetBtn();
        },
      },
    };

    const rzp = new Razorpay(rzpOptions);

    rzp.on('payment.failed', function(response) {
      console.error('Payment failed:', response.error);
      alert('Payment failed: ' + (response.error.description || 'Please try again.'));
      resetBtn();
    });

    rzp.open();

  } catch (err) {
    console.error('submitPayment error:', err);
    alert('Something went wrong: ' + err.message + '\nPlease try again.');
    resetBtn();
  }
}

=== END OF REPLACEMENT ===

---

## PHASE 6 — Test Everything

### 6.1  Push to GitHub and let Vercel redeploy
```bash
git add .
git commit -m "feat: add Razorpay payment + Google Sheets integration"
git push
```
Vercel auto-deploys on push if connected to GitHub.

### 6.2  Run a test payment
1. Open your live website.
2. Click "Register Now" on any category.
3. Fill in the form with real-looking test data.
4. On the payment screen, click "Pay Now".
5. The Razorpay checkout popup should appear.
6. Use test card: `4111 1111 1111 1111`  /  any future date  /  any CVV  /  OTP: `1234`
7. After payment, you should see the success screen with a confirmation number.
8. Open your Google Sheet — a new row should have appeared within seconds.

### 6.3  Check Vercel function logs (debugging)
If something goes wrong:
1. Go to Vercel Dashboard → your project → Deployments → click latest deployment
2. Click "Functions" tab → click `create-order` or `verify-payment`
3. Click "View Function Logs" to see any errors

---

## PHASE 7 — Go Live (after KYC approval)

1. In Razorpay Dashboard: Settings → API Keys → Generate Live Mode Key
2. You get a NEW Key ID and Key Secret for live mode.
3. In Vercel Dashboard: update BOTH `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the live values.
4. Redeploy.
5. Test with a real ₹1 payment to confirm everything works.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Failed to create order` | Env vars not set | Check Vercel env vars, redeploy |
| `Payment verification failed` | Wrong Key Secret | Double-check RAZORPAY_KEY_SECRET in Vercel |
| Row not appearing in sheet | Sheet not shared with service account | Re-share the sheet with Editor access |
| `GOOGLE_PRIVATE_KEY` error | Key has wrong newlines | Re-paste the private_key from JSON, let Vercel handle escaping |
| Razorpay popup doesn't open | `checkout.js` not loaded | Confirm the script tag is in `<head>` |
| CORS error | Old deployment cached | Redeploy after any API changes |

---

## Security checklist before going live
- [ ] `RAZORPAY_KEY_SECRET` is only in Vercel env vars — never in index.html
- [ ] Google service account JSON is NOT committed to GitHub
- [ ] `.gitignore` includes `*.json.key` and `service-account*.json`
- [ ] Payment signature is verified server-side in `verify-payment.js`
- [ ] Google Sheet is shared ONLY with the service account email (not public)

---

*Managed and Supported by Apex Group*
