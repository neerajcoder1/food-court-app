const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// optional static (safe fallback)
app.use(express.static(path.join(__dirname, "public")));

// validate env
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay keys in .env");
  process.exit(1);
}

// razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// create order
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// verify payment
app.post("/api/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_id,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const transaction = {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount,
      status: "success",
      user_id,
      timestamp: new Date().toISOString(),
    };

    const dbPath = path.join(__dirname, "database.json");

    let database = [];
    if (fs.existsSync(dbPath)) {
      database = JSON.parse(fs.readFileSync(dbPath));
    }

    database.push(transaction);
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

    const generated_token = (Math.floor(Math.random() * 900) + 100).toString();

    res.json({
      success: true,
      transactionId: razorpay_payment_id,
      token: generated_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// expose key
app.get("/api/get-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// use env port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
