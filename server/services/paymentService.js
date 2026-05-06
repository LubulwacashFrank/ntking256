const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

/**
 * Initiate Mobile Money Payment
 * @param {Object} payload - Payment details
 * @param {string} payload.amount - Amount to charge
 * @param {string} payload.phone - Customer phone number (256XXXXXXXXX format)
 * @param {string} payload.email - Customer email
 * @param {string} payload.network - Mobile network (MTN, AIRTEL, VODAFONE)
 * @param {string} payload.txRef - Unique transaction reference
 * @param {string} payload.fullname - Customer full name
 * @returns {Promise<Object>} Payment response
 */
async function initiateMobileMoneyPayment(payload) {
  try {
    const paymentPayload = {
      tx_ref: payload.txRef,
      amount: payload.amount,
      currency: "UGX",
      network: payload.network.toUpperCase(), // MTN, AIRTEL, VODAFONE
      email: payload.email,
      phone_number: payload.phone,
      fullname: payload.fullname,
      redirect_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment/callback`,
      meta: {
        consumer_id: payload.userId || '',
        consumer_mac: "92a3-912ba-1192a"
      }
    };

    const response = await flw.MobileMoney.uganda(paymentPayload);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Flutterwave Mobile Money Error:', error);
    return {
      success: false,
      error: error.message || 'Payment initiation failed'
    };
  }
}

/**
 * Verify Payment Transaction
 * @param {string} transactionId - Flutterwave transaction ID
 * @returns {Promise<Object>} Verification response
 */
async function verifyPayment(transactionId) {
  try {
    const response = await flw.Transaction.verify({ id: transactionId });
    
    if (response.data.status === "successful" && 
        response.data.amount >= response.data.charged_amount &&
        response.data.currency === "UGX") {
      return {
        success: true,
        verified: true,
        data: response.data
      };
    }
    
    return {
      success: true,
      verified: false,
      data: response.data
    };
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'Verification failed'
    };
  }
}

/**
 * Get supported mobile networks in Uganda
 */
function getSupportedNetworks() {
  return [
    { code: 'MTN', name: 'MTN Mobile Money', prefixes: ['077', '078', '076'] },
    { code: 'AIRTEL', name: 'Airtel Money', prefixes: ['075', '070'] },
    { code: 'VODAFONE', name: 'Vodafone', prefixes: ['074'] }
  ];
}

/**
 * Detect network from phone number
 * @param {string} phone - Phone number
 * @returns {string} Network code (MTN, AIRTEL, VODAFONE)
 */
function detectNetwork(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  const prefix = cleanPhone.substring(cleanPhone.length - 9, cleanPhone.length - 7);
  
  const networks = getSupportedNetworks();
  for (const network of networks) {
    if (network.prefixes.includes(prefix)) {
      return network.code;
    }
  }
  
  return 'MTN'; // Default to MTN
}

/**
 * Format phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone (256XXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleanPhone = cleanPhone.replace(/^0+/, '');
  
  // Add country code if not present
  if (!cleanPhone.startsWith('256')) {
    cleanPhone = '256' + cleanPhone;
  }
  
  return cleanPhone;
}

module.exports = {
  initiateMobileMoneyPayment,
  verifyPayment,
  getSupportedNetworks,
  detectNetwork,
  formatPhoneNumber
};
