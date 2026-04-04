const QRCode = require("qrcode");

QRCode.toFile(
  "public/student-qr.png",
  "https://food-court-app-chi.vercel.app/",
  { width: 300 },
  function (err) {
    if (err) throw err;
    console.log("QR saved");
  },
);
