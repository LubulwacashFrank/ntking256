const axios = require('axios');

const BASE_URL = 'https://api.flutterwave.com/v3';

function getSecretKey() {
  return process.env.FLW_SECRET_KEY || '';
}

function isConfigured() {
  const key = getSecretKey();
  return !!(key && key.length > 10);
}

function getHeaders() {
  return { Authorization: `Bearer ${getSecretKey()}`, 'Content-Type': 'application/json' };
}

async function initiateMobileMoneyPayment(payload) {
  if (!isConfigured()) {
    return { success: false, error: 'Payment gateway not configured.' };
  }
  try {
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const body = {
      tx_ref: payload.txRef,
      amount: payload.amount,
      currency: 'UGX',
      network: payload.network.toUpperCase(),
      email: payload.email,
      phone_number: payload.phone,
      fullname: payload.fullname,
      redirect_url: `${appUrl}/api/subscription-payment/callback`,
      authorization: { mode: 'ussd' },
      meta: { userId: payload.userId || '' }
    };
    const { data } = await axios.post(
      `${BASE_URL}/charges?type=mobile_money_uganda`,
      body,
      { headers: getHeaders() }
    );
    if (data.status === 'error') {
      return { success: false, error: data.message };
    }
    return { success: true, data };
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('FLW initiate error:', msg);
    return { success: false, error: msg };
  }
}

async function verifyPayment(transactionId) {
  if (!isConfigured()) {
    return { success: false, verified: false, error: 'Payment gateway not configured.' };
  }
  try {
    const { data } = await axios.get(`${BASE_URL}/transactions/${transactionId}/verify`, { headers: getHeaders() });
    const tx = data.data;
    const verified = tx.status === 'successful' && tx.currency === 'UGX';
    return { success: true, verified, data: tx };
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('FLW verify error:', msg);
    return { success: false, verified: false, error: msg };
  }
}

function getSupportedNetworks() {
  return [
    { code: 'MTN', name: 'MTN Mobile Money', prefixes: ['077', '078', '076'] },
    { code: 'AIRTEL', name: 'Airtel Money', prefixes: ['075', '070'] },
    { code: 'VODAFONE', name: 'Vodafone Cash', prefixes: ['074'] }
  ];
}

function detectNetwork(phone) {
  const clean = phone.replace(/\D/g, '');
  const prefix = '0' + clean.slice(-9, -7);
  for (const n of getSupportedNetworks()) {
    if (n.prefixes.includes(prefix)) return n.code;
  }
  return 'MTN';
}

function formatPhoneNumber(phone) {
  let clean = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (!clean.startsWith('256')) clean = '256' + clean;
  return clean;
}

module.exports = {
  initiateMobileMoneyPayment,
  verifyPayment,
  getSupportedNetworks,
  detectNetwork,
  formatPhoneNumber,
  isPaymentConfigured: isConfigured
};
