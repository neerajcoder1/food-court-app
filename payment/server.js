const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    });
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/api/verify-payment', (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    user_id,
  } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    const transaction = {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: amount,
      status: 'success',
      user_id: user_id,
      timestamp: new Date().toISOString(),
    };

    let database = [];
    try {
      const data = fs.readFileSync('database.json');
      database = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, will be created
    }

    database.push(transaction);
    fs.writeFileSync('database.json', JSON.stringify(database, null, 2));

    const generated_token = (Math.floor(Math.random() * 900) + 100).toString();

    res.json({
      success: true,
      transactionId: razorpay_payment_id,
      token: generated_token,
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
});

app.get('/api/get-key', (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
