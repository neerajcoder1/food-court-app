const firebaseConfig = {
  apiKey: "AIzaSyBUpMBnUXZIRD-fjg7RT8CIJ1wMylxwS80",
  authDomain: "food-court-app-ae48f.firebaseapp.com",
  projectId: "food-court-app-ae48f",
  storageBucket: "food-court-app-ae48f.firebasestorage.app",
  messagingSenderId: "575018100354",
  appId: "1:575018100354:web:e2bbbfd644748e7077769b",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const NEW_MENU = {
  breakfast: [
    {
      id: "bf1",
      name: "Aloo Paratha",
      emoji: "🫓",
      desc: "Stuffed flatbread",
      price: 50,
      available: true,
      type: "veg",
    },
    {
      id: "bf2",
      name: "Chole Bhature",
      emoji: "🍛",
      desc: "Spicy chickpeas",
      price: 50,
      available: true,
      type: "veg",
    },
    {
      id: "bf3",
      name: "Pulao",
      emoji: "🍚",
      desc: "Flavored rice",
      price: 50,
      available: true,
      type: "veg",
    },
    {
      id: "bf6",
      name: "Idli (3) + Vada (1)",
      emoji: "🍘",
      desc: "Combo",
      price: 45,
      available: true,
      type: "veg",
    },
    {
      id: "bf9",
      name: "Single Idli",
      emoji: "🍘",
      desc: "",
      price: 15,
      available: true,
      type: "veg",
    },
    {
      id: "bf14",
      name: "Bread Omelette",
      emoji: "🥪",
      desc: "",
      price: 50,
      available: true,
      type: "non-veg",
    },
  ],
  morningSnacks: [
    {
      id: "ms1",
      name: "Samosa (2 pcs)",
      emoji: "🥟",
      desc: "",
      price: 30,
      available: true,
      type: "veg",
    },
    {
      id: "ms2",
      name: "Veg Puff",
      emoji: "🥐",
      desc: "",
      price: 25,
      available: true,
      type: "veg",
    },
    {
      id: "ms3",
      name: "Egg Puff",
      emoji: "🥐",
      desc: "",
      price: 30,
      available: true,
      type: "non-veg",
    },
    {
      id: "ms4",
      name: "Vada Pav",
      emoji: "🍔",
      desc: "",
      price: 20,
      available: true,
      type: "veg",
    },
  ],
  lunch: [
    {
      id: "l1",
      name: "Veg Meals thali",
      emoji: "🍱",
      desc: "Rice, Dal, 2 Sabzi",
      price: 70,
      available: true,
      type: "veg",
    },
    {
      id: "l2",
      name: "Chicken Meals thali",
      emoji: "🍱",
      desc: "Rice, Chicken Gravy",
      price: 120,
      available: true,
      type: "non-veg",
    },
    {
      id: "l3",
      name: "Veg Fried Rice",
      emoji: "🍚",
      desc: "",
      price: 50,
      available: true,
      type: "veg",
    },
    {
      id: "l4",
      name: "Chicken Fried Rice",
      emoji: "🍚",
      desc: "",
      price: 80,
      available: true,
      type: "non-veg",
    },
    {
      id: "l5",
      name: "Veg Noodles",
      emoji: "🍜",
      desc: "",
      price: 50,
      available: true,
      type: "veg",
    },
  ],
  snacksSides: [
    {
      id: "ss1",
      name: "Gobi Manchurian",
      emoji: "🍲",
      desc: "",
      price: 60,
      available: true,
      type: "veg",
    },
    {
      id: "ss2",
      name: "Chilli Chicken",
      emoji: "🍗",
      desc: "",
      price: 100,
      available: true,
      type: "non-veg",
    },
    {
      id: "ss3",
      name: "French Fries",
      emoji: "🍟",
      desc: "",
      price: 50,
      available: true,
      type: "veg",
    },
    {
      id: "ss4",
      name: "Chicken 65",
      emoji: "🍗",
      desc: "",
      price: 120,
      available: true,
      type: "non-veg",
    },
  ],
  eveningSnacks: [
    {
      id: "es1",
      name: "Mirchi Bajji",
      emoji: "🌶",
      desc: "",
      price: 30,
      available: true,
      type: "veg",
    },
    {
      id: "es2",
      name: "Onion Pakoda",
      emoji: "🧅",
      desc: "",
      price: 40,
      available: true,
      type: "veg",
    },
    {
      id: "es3",
      name: "Aloo Bonda",
      emoji: "🥔",
      desc: "",
      price: 25,
      available: true,
      type: "veg",
    },
  ],
  dinner: [
    {
      id: "d1",
      name: "Phulka (3) with Dal",
      emoji: "🫓",
      desc: "",
      price: 60,
      available: true,
      type: "veg",
    },
    {
      id: "d2",
      name: "Paneer Butter Masala",
      emoji: "🍛",
      desc: "",
      price: 120,
      available: true,
      type: "veg",
    },
    {
      id: "d3",
      name: "Egg Bhurji",
      emoji: "🍳",
      desc: "",
      price: 60,
      available: true,
      type: "non-veg",
    },
  ],
  beverages: [
    {
      id: "b1",
      name: "Hot Tea",
      emoji: "🍵",
      desc: "",
      price: 15,
      available: true,
      type: "veg",
    },
    {
      id: "b2",
      name: "Filter Coffee",
      emoji: "☕",
      desc: "",
      price: 20,
      available: true,
      type: "veg",
    },
    {
      id: "b3",
      name: "Cold Drink",
      emoji: "🥤",
      desc: "",
      price: 25,
      available: true,
      type: "veg",
    },
  ],
};

const allItems = [];

Object.keys(NEW_MENU).forEach((category) => {
  NEW_MENU[category].forEach((item) => {
    allItems.push({
      ...item,
      category,
    });
  });
});

async function uploadMenu() {
  for (const item of allItems) {
    await db.collection("menu").doc(item.id).set(item);
  }
  console.log("Done");
}

uploadMenu();
