# Flutterwave Mobile Money Payment Integration Setup Guide

## Overview
This system integrates Flutterwave payment gateway to enable farmers to pay subscription fees via:
- **MTN Mobile Money**
- **Airtel Money**
- **Vodafone Mobile Money**

## Setup Steps

### 1. Create Flutterwave Account
1. Go to https://flutterwave.com/ug
2. Click "Get Started" and create a business account
3. Complete KYC verification (required for live payments)
4. Navigate to Settings > API Keys

### 2. Get API Credentials
You'll need three keys:
- **Public Key** (starts with `FLWPUBK_`)
- **Secret Key** (starts with `FLWSECK_`)
- **Encryption Key** (also starts with `FLWSECK_`)

**Test Mode Keys:**
- Use test keys for development (they start with `FLWPUBK_TEST-` and `FLWSECK_TEST-`)
- Test keys won't charge real money

**Live Mode Keys:**
- Use live keys for production after KYC approval
- These will process real payments

### 3. Update Environment Variables
Edit your `.env` file and replace the placeholder values:

```env
# Flutterwave Payment Gateway
FLW_PUBLIC_KEY=FLWPUBK_TEST-your-actual-public-key-here
FLW_SECRET_KEY=FLWSECK_TEST-your-actual-secret-key-here
FLW_ENCRYPTION_KEY=FLWSECK_TEST-your-actual-encryption-key-here
```

For production:
```env
FLW_PUBLIC_KEY=FLWPUBK-your-live-public-key-here
FLW_SECRET_KEY=FLWSECK-your-live-secret-key-here
FLW_ENCRYPTION_KEY=FLWSECK-your-live-encryption-key-here
```

### 4. Install Dependencies
Run this command to install the required packages:
```bash
npm install
```

This will install:
- `flutterwave-node-v3` - Flutterwave SDK
- `axios` - HTTP client for API calls

### 5. Test the Integration

#### Test Mode (Development)
1. Use test API keys
2. Use test phone numbers provided by Flutterwave:
   - MTN: `+256772123456`
   - Airtel: `+256700123456`
3. Test payments won't charge real money

#### Live Mode (Production)
1. Complete Flutterwave KYC verification
2. Switch to live API keys
3. Real payments will be processed
4. Funds will be deposited to your Flutterwave account

## How It Works

### Farmer Registration Flow
1. Farmer fills registration form
2. Selects subscription plan (Monthly: 50,000 UGX or Yearly: 200,000 UGX)
3. Enters phone number for payment
4. System detects mobile network (MTN/Airtel/Vodafone) from phone prefix
5. Payment request sent to farmer's phone
6. Farmer enters PIN on phone to approve payment
7. System verifies payment with Flutterwave
8. Account activated automatically upon successful payment

### Supported Phone Prefixes
- **MTN**: 077, 078, 076
- **Airtel**: 075, 070
- **Vodafone**: 074

### Payment Verification
- Payments are verified automatically via Flutterwave webhook
- Admin can also manually verify payments in admin panel
- Subscription status updates from "pending" to "active" after verification

## API Endpoints

### Initiate Payment
```
POST /api/subscription-payment/subscription/initiate
Body: {
  userId: "user_id",
  phone: "0772123456",
  email: "farmer@example.com",
  fullname: "John Doe",
  subscriptionPlan: "monthly" | "yearly"
}
```

### Verify Payment
```
POST /api/subscription-payment/subscription/verify
Body: {
  txRef: "SUB-userId-timestamp",
  transactionId: "flutterwave_transaction_id"
}
```

### Check Subscription Status
```
GET /api/subscription-payment/subscription/status/:userId
```

### Get Supported Networks
```
GET /api/subscription-payment/networks
```

## Webhook Configuration

### Setup Webhook in Flutterwave Dashboard
1. Go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/subscription-payment/callback`
3. Select events: `charge.completed`
4. Save webhook

### Webhook Security
- Flutterwave sends a secret hash with each webhook
- Verify the hash to ensure webhook authenticity
- Reject webhooks with invalid hashes

## Testing Checklist

- [ ] Flutterwave account created
- [ ] Test API keys obtained
- [ ] Environment variables updated
- [ ] Dependencies installed (`npm install`)
- [ ] Server restarted
- [ ] Test registration with MTN number
- [ ] Test registration with Airtel number
- [ ] Payment prompt received on phone
- [ ] Payment completed successfully
- [ ] Account activated automatically
- [ ] Subscription visible in admin panel

## Troubleshooting

### Payment Not Initiated
- Check API keys are correct in `.env`
- Verify phone number format (256XXXXXXXXX)
- Check Flutterwave account status
- Review server logs for errors

### Payment Not Verified
- Check webhook URL is configured
- Verify webhook is receiving events
- Check transaction ID is correct
- Review Flutterwave dashboard for transaction status

### Phone Not Receiving Prompt
- Verify phone number is correct
- Check mobile network is supported
- Ensure phone has sufficient balance
- Try with different phone number

## Production Checklist

- [ ] Complete Flutterwave KYC verification
- [ ] Switch to live API keys
- [ ] Update webhook URL to production domain
- [ ] Test with real phone numbers
- [ ] Monitor first few transactions
- [ ] Set up email notifications for failed payments
- [ ] Configure automatic refunds for failed subscriptions

## Support

### Flutterwave Support
- Email: support@flutterwavego.com
- Phone: +234 1 888 9890
- Documentation: https://developer.flutterwave.com

### Common Issues
1. **"Invalid API Key"** - Check your API keys in `.env`
2. **"Network not supported"** - Verify phone number prefix
3. **"Payment timeout"** - User didn't complete payment on phone
4. **"Insufficient funds"** - User's mobile money balance is low

## Security Best Practices

1. **Never commit API keys to Git**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Validate webhook signatures**
   - Verify Flutterwave webhook hash
   - Reject unauthorized webhooks

3. **Use HTTPS in production**
   - Flutterwave requires HTTPS for webhooks
   - Get SSL certificate for your domain

4. **Log all transactions**
   - Keep audit trail of payments
   - Monitor for suspicious activity

5. **Handle errors gracefully**
   - Show user-friendly error messages
   - Retry failed payments automatically
   - Notify admin of payment issues

## Next Steps

1. Get your Flutterwave API keys
2. Update `.env` file with your keys
3. Run `npm install`
4. Restart server: `npm start`
5. Test registration with your phone number
6. Monitor payments in Flutterwave dashboard

---

**Note:** This integration is production-ready but requires valid Flutterwave API keys to function. Test thoroughly before going live!
