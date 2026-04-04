const QRCode = require("qrcode");

const qrTargets = [
  {
    file: "public/student-qr.png",
    url: "https://food-court-app-chi.vercel.app/",
  },
  {
    file: "public/vendor-qr.png",
    url: "https://food-court-app-chi.vercel.app/vendor-login.html",
  },
];

Promise.all(
  qrTargets.map((target) =>
    QRCode.toFile(target.file, target.url, { width: 300 }),
  ),
)
  .then(() => {
    console.log("QR codes saved");
  })
  .catch((err) => {
    throw err;
  });
