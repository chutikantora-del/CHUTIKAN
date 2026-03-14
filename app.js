require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");

const { config } = require("./config/lineConfig");
const { handleMessage } = require("./controllers/messageController");

const app = express();

// serve static files from public directory (eg. images)
app.use(express.static("public"));

// webhook route needs raw body for signature validation so we apply
// the LINE middleware before parsing JSON. Other routes can still use
// express.json() if needed.

// webhook
app.post(
  "/webhook",
  line.middleware(config),
  express.json(),
  async (req, res) => {

  const events = req.body.events;

  await Promise.all(
    events.map(async (event) => {
      try {
        if (event.type === "message" && event.message.type === "text") {
          return await handleMessage(event);
        }
      } catch (err) {
        console.error("Error handling message:", err);
        // Optionally send error reply
        try {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "เกิดข้อผิดพลาด กรุณาลองใหม่"
          });
        } catch (replyErr) {
          console.error("Error sending error reply:", replyErr);
        }
      }
    })
  );

  res.status(200).end();
});

// มีหน้ารากให้ดูง่ายๆ เวลาทดสอบ
app.get("/", (req, res) => {
  res.send("Line bot is running");
});

// ใช้ port ของ Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("Server running on port " + PORT);

  // for local development we automatically open an ngrok tunnel so that
  // LINE's servers (and the flex image URLs) can reach the bot without
  // requiring the user to manually set BASE_URL.  The tunnel URL is stored
  // in process.env.BASE_URL so the flex service will use it.
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.BASE_URL &&
    !process.env.RENDER_EXTERNAL_URL
  ) {
    try {
      const ngrok = require("ngrok");
      const url = await ngrok.connect(PORT);
      process.env.BASE_URL = url;
      console.log("ngrok tunnel opened at", url);
      console.log(
        "(you can set BASE_URL manually in .env if you want to lock the URL)"
      );
    } catch (err) {
      console.error("failed to start ngrok tunnel:", err);
    }
  }
});

