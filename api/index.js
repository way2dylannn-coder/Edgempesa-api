const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { amount, phone } = req.body;
  
  // APPLY 5% DISCOUNT AUTOMATICALLY
  const discountedAmount = Math.round(amount * 0.95);

  const shortCode = "3240539"; 
  const storeNumber = "5711426";
  const passkey = process.env.MPESA_PASSKEY;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    const token = tokenResponse.data.access_token;

    const stkPush = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      "BusinessShortCode": shortCode,
      "Password": password,
      "Timestamp": timestamp,
      "TransactionType": "CustomerBuyGoodsOnline",
      "Amount": discountedAmount,
      "PartyA": phone,
      "PartyB": storeNumber,
      "PhoneNumber": phone,
      "CallBackURL": "https://edgevision.store/api/callback",
      "AccountReference": "EdgeVisionStore",
      "TransactionDesc": "Vape Purchase Discounted"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.status(200).json({ ...stkPush.data, discountedPrice: discountedAmount });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
}
