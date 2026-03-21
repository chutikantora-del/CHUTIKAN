require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const OpenAI = require("openai");

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use("/callback", line.middleware(config));

// ==========================
// keyword ตรงตัว
// ==========================
const KEYWORDS = [
  "แนะนำอาหาร",
  "กินอะไรดี",
  "หิวข้าว",
  "หิว",
  "กินไรดี",
  "มีอะไรแนะนำไหม",
  "ขอเมนู",
];

// ==========================
// ประวัติผู้ใช้แบบง่าย
// ==========================
const userHistory = {};
const MAX_HISTORY = 6;

// ==========================
// เมนูอาหาร
// ==========================
const foods = [
  {
    name: "ข้าวกะเพราหมูสับ",
    price: 60,
    calories: 650,
    description: "รสจัด จานเดียว กินง่าย อิ่มไว",
    image: "https://i.imgur.com/4rRZC6G.jpg",
  },
  {
    name: "ข้าวผัดกุ้ง",
    price: 70,
    calories: 590,
    description: "หอมกระทะ กุ้งเด้ง กินง่ายได้ทุกมื้อ",
    image: "https://i.imgur.com/nJv3F3P.jpg",
  },
  {
    name: "ผัดไทยกุ้งสด",
    price: 80,
    calories: 620,
    description: "ครบรส เปรี้ยวหวานเค็ม เส้นนุ่ม",
    image: "https://i.imgur.com/0umadnY.jpg",
  },
  {
    name: "ข้าวมันไก่",
    price: 55,
    calories: 600,
    description: "ไก่นุ่ม น้ำจิ้มเด็ด อิ่มท้อง",
    image: "https://i.imgur.com/8fG8QwM.jpg",
  },
  {
    name: "ส้มตำปูปลาร้า",
    price: 50,
    calories: 180,
    description: "แซ่บนัว จัดจ้าน ถูกใจสายอีสาน",
    image: "https://i.imgur.com/hVtY1Gk.jpg",
  },
  {
    name: "ก๋วยเตี๋ยวเรือ",
    price: 50,
    calories: 380,
    description: "น้ำซุปเข้มข้น หอมเครื่องเทศ",
    image: "https://i.imgur.com/eP7VY6K.jpg",
  },
  {
    name: "ข้าวหมูทอดกระเทียม",
    price: 65,
    calories: 610,
    description: "หมูทอดหอมกระเทียม กินกับข้าวร้อนๆ อร่อยมาก",
    image: "https://i.imgur.com/2l7JkKp.jpg",
  },
  {
    name: "ราดหน้าหมู",
    price: 65,
    calories: 450,
    description: "เส้นนุ่ม น้ำราดเข้มข้น ผักกรอบ",
    image: "https://i.imgur.com/7l8xU8A.jpg",
  },
];

// ==========================
// utility
// ==========================
function normalizeText(text = "") {
  return text.trim().toLowerCase();
}

function getUserId(event) {
  return event.source?.userId || "default-user";
}

function addHistory(userId, role, text) {
  if (!userHistory[userId]) {
    userHistory[userId] = [];
  }

  userHistory[userId].push({ role, text });

  if (userHistory[userId].length > MAX_HISTORY) {
    userHistory[userId] = userHistory[userId].slice(-MAX_HISTORY);
  }
}

function getHistoryText(userId) {
  const history = userHistory[userId] || [];
  if (!history.length) return "ไม่มีข้อความก่อนหน้า";
  return history.map((m) => `${m.role}: ${m.text}`).join("\n");
}

function randomFood() {
  return foods[Math.floor(Math.random() * foods.length)];
}

// ==========================
// Flex message
// ==========================
function createFoodFlex(food) {
  return {
    type: "flex",
    altText: `เมนูแนะนำ: ${food.name}`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: food.image,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เมนูแนะนำวันนี้",
            weight: "bold",
            size: "sm",
            color: "#888888",
          },
          {
            type: "text",
            text: food.name,
            weight: "bold",
            size: "xl",
            wrap: true,
            margin: "md",
          },
          {
            type: "text",
            text: food.description,
            size: "sm",
            wrap: true,
            color: "#666666",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `ราคา: ${food.price} บาท`,
                size: "sm",
              },
              {
                type: "text",
                text: `พลังงาน: ${food.calories} แคลอรี่`,
                size: "sm",
                color: "#dc2626",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "สุ่มใหม่",
              text: "กินอะไรดี",
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "คุยกับ AI",
              text: "ช่วยคุยกับฉันหน่อย",
            },
          },
        ],
      },
    },
  };
}

// ==========================
// AI classify ว่าเกี่ยวกับอาหารไหม
// ==========================
async function classifyIntent(userText, userId) {
  const historyText = getHistoryText(userId);

  const prompt = `
คุณคือระบบจำแนก intent สำหรับ LINE chatbot

หน้าที่:
- อ่านข้อความล่าสุดของผู้ใช้และบริบทก่อนหน้า
- ตอบกลับเพียงคำเดียวเท่านั้น
- ถ้าผู้ใช้กำลังถามหาอาหาร / ขอคำแนะนำว่าจะกินอะไร / บอกว่าหิว / อยากให้ช่วยเลือกเมนู
  ให้ตอบ: food_recommendation
- ถ้าไม่ใช่ ให้ตอบ: unknown

บริบทก่อนหน้า:
${historyText}

ข้อความล่าสุด:
${userText}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "developer",
          content:
            "คุณเป็นตัวจำแนก intent สำหรับระบบแชต ตอบได้แค่ food_recommendation หรือ unknown เท่านั้น",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result = (response.output_text || "").trim().toLowerCase();

    if (result.includes("food_recommendation")) {
      return "food_recommendation";
    }

    return "unknown";
  } catch (error) {
    console.error("classifyIntent error:", error);
    return "unknown";
  }
}

// ==========================
// AI ตอบคำถามทั่วไป
// ==========================
async function askAI(userText, userId) {
  const historyText = getHistoryText(userId);

  const prompt = `
คุณคือผู้ช่วย AI ภาษาไทยใน LINE chatbot
ตอบสั้น กระชับ สุภาพ เป็นธรรมชาติ และเข้าใจง่าย
ถ้าผู้ใช้ถามทั่วไปให้ตอบได้ตามปกติ
ถ้าผู้ใช้ถามเรื่องอาหาร ก็สามารถคุยต่อหรือแนะนำแบบสั้นๆ ได้
อย่าตอบยาวเกินไป
ถ้าไม่แน่ใจ ให้ตอบอย่างสุภาพและไม่มั่ว

บริบทก่อนหน้า:
${historyText}

ข้อความล่าสุดของผู้ใช้:
${userText}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "developer",
          content:
            "คุณคือผู้ช่วย AI ภาษาไทยใน LINE chatbot ตอบสั้น สุภาพ ชัดเจน และเป็นธรรมชาติ",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = (response.output_text || "").trim();

    if (!answer) {
      return "ขอโทษนะ ตอนนี้ฉันยังตอบไม่ได้ ลองส่งใหม่อีกครั้งได้เลย";
    }

    return answer;
  } catch (error) {
    console.error("askAI error:", error);
    return "ขอโทษนะ ตอนนี้ระบบ AI มีปัญหาชั่วคราว";
  }
}

// ==========================
// main event handler
// ==========================
async function handleEvent(event) {
  if (event.type !== "message") {
    return null;
  }

  const userId = getUserId(event);

  // รองรับเฉพาะข้อความ
  if (event.message.type !== "text") {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text:
            "ตอนนี้ฉันอ่านข้อความได้เป็นหลักนะ\nลองพิมพ์เช่น\n- กินอะไรดี\n- หิวข้าว\n- หรือถามคำถามทั่วไปกับ AI ได้เลย",
        },
      ],
    });
  }

  const rawText = event.message.text;
  const userText = normalizeText(rawText);

  addHistory(userId, "user", rawText);

  let shouldRecommendFood = false;

  if (KEYWORDS.includes(userText)) {
    shouldRecommendFood = true;
  } else {
    const intent = await classifyIntent(userText, userId);
    if (intent === "food_recommendation") {
      shouldRecommendFood = true;
    }
  }

  if (shouldRecommendFood) {
    const selectedFood = randomFood();
    addHistory(userId, "assistant", `แนะนำเมนู: ${selectedFood.name}`);

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [createFoodFlex(selectedFood)],
    });
  }

  const aiReply = await askAI(rawText, userId);
  addHistory(userId, "assistant", aiReply);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: aiReply,
      },
    ],
  });
}

// ==========================
// webhook
// ==========================
app.post("/callback", async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).end();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});