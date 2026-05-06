# 🚀 Enable Mobile Money Payments - Simple Setup

## Current Status
✅ Payment integration code is ready  
⚠️ Flutterwave API keys needed to activate

## Quick Setup (5 minutes)

### Option 1: Get Real Flutterwave Keys (Recommended)

1. **Sign up at Flutterwave:**
   - Go to: https://flutterwave.com/ug
   - Click "Get Started"
   - Complete registration

2. **Get your API keys:**
   - Login to dashboard
   - Go to: Settings → API Keys
   - Copy these 3 keys:
     - Public Key (starts with `FLWPUBK_TEST-`)
     - Secret Key (starts with `FLWSECK_TEST-`)
     - Encryption Key (starts with `FLWSECK_TEST-`)

3. **Update `.env` file:**
   ```env
   FLW_PUBLIC_KEY=FLWPUBK_TEST-paste-your-key-here
   FLW_SECRET_KEY=FLWSECK_TEST-paste-your-key-here
   FLW_ENCRYPTION_KEY=FLWSECK_TEST-paste-your-key-here
   ```

4. **Restart server:**
   ```bash
   npm start
   ```

5. **Test it:**
   - Register as farmer
   - Payment prompt will be sent to phone!

---

### Option 2: Use Test Keys (For Development)

If you just want to test the system without real payments:

1. **Update `.env` with these test keys:**
   ```env
   FLW_PUBLIC_KEY=FLWPUBK_TEST-SANDBOXDEMOKEY12345
   FLW_SECRET_KEY=FLWSECK_TEST-SANDBOXDEMOKEY12345
   FLW_ENCRYPTION_KEY=FLWSECK_TEST-SANDBOXDEMOKEY12345
   ```

2. **Restart server:**
   ```bash
   npm start
   ```

**Note:** Test keys won't send real payment prompts, but the system will work.

---

### Option 3: Skip Payment Integration (Manual Verification)

If you want to launch without mobile money:

1. **Leave `.env` as is** (with XXXXX placeholders)

2. **System will automatically:**
   - Show "manual verification required" message
   - Admin verifies payments manually
   - No mobile money prompts sent

3. **You can add Flutterwave later** without code changes

---

## How to Check Status

Visit: `http://localhost:3000/api/subscription-payment/status`

**Response:**
```json
{
  "configured": true,
  "message": "Payment gateway is ready"
}
```

Or:
```json
{
  "configured": false,
  "message": "Payment gateway not configured..."
}
```

---

## What Works Without Flutterwave?

✅ Farmer registration  
✅ Subscription plan selection  
✅ Admin can manually verify payments  
✅ All other platform features  

❌ Automatic mobile money payment prompts  
❌ Real-time payment verification  

---

## Production Checklist

When ready to go live:

1. ✅ Complete Flutterwave KYC verification
2. ✅ Switch from TEST keys to LIVE keys
3. ✅ Test with real phone number
4. ✅ Monitor first few transactions
5. ✅ Set up webhook (see FLUTTERWAVE_SETUP.md)

---

## Need Help?

**Flutterwave Support:**
- Email: support@flutterwavego.com
- Phone: +234 1 888 9890

**Documentation:**
- Quick Start: `PAYMENT_INTEGRATION_SUMMARY.md`
- Detailed Guide: `FLUTTERWAVE_SETUP.md`

---

## TL;DR

**To enable mobile money payments:**
1. Get Flutterwave API keys
2. Update `.env` file
3. Restart server
4. Done! 🎉

**To skip for now:**
- Just leave `.env` as is
- System works with manual verification
- Add Flutterwave later when ready
