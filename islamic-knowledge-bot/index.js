const express = require("express");
const cors = require("cors");




require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const connectDB = require("./config/db");



const {
  sendRandomAyah,
  getLastAyah,
  getRandomAyah,
  setLastAyah
} = require("./controllers/ayahController");

const {
  saveFavorite,
  getFavorites,
  removeFavorite
} = require("./controllers/favoriteController");



const app = express();
app.use(cors());
app.use(express.json());


connectDB();

const bot = new TelegramBot(process.env.TOKEN);

const WEBHOOK_URL =
  process.env.RENDER_EXTERNAL_URL ||
  `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;

if (WEBHOOK_URL) {
  bot.setWebHook(`${WEBHOOK_URL}/bot${process.env.TOKEN}`);
  app.use(bot.webhookCallback(`/bot${process.env.TOKEN}`));
}

const OWNER_ID = process.env.OWNER_ID;

const isOwner = (id) => id.toString() === OWNER_ID;

/* =============================
   CRASH PROTECTION
============================= */

process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection:", err.message);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught exception:", err.message);
});

/* =============================
   START
============================= */

bot.onText(/\/start/, async (msg) => {

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "⛔ This is a private bot.");
  }

  await bot.sendMessage(
    msg.chat.id,
`🕌 *Welcome to DeenCompanionBot*

Your personal Islamic companion 🤍

Choose an option below:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 Get Ayah", callback_data: "get_ayah" }],
          [{ text: "📚 My Favorites", callback_data: "view_favorites" }],
          [{ text: "🆘 Help", callback_data: "help" }]
        ]
      }
    }
  );
});

/* =============================
   BUTTON HANDLER
============================= */

bot.on("callback_query", async (query) => {

  if (!isOwner(query.from.id)) {
    try {
      await bot.answerCallbackQuery(query.id, {
        text: "Private bot access only.",
        show_alert: true
      });
    } catch (e) {}
    return;
  }

  const msg = query.message;

  /* GET AYAH */
  if (query.data === "get_ayah") {
    await sendAyahWithButtons(msg);
    return;
  }

  /* SAVE FAVORITE */
  if (query.data === "save_favorite") {

    const last = getLastAyah(msg.chat.id);

    if (!last) {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: "Send an ayah first.",
          show_alert: true
        });
      } catch (e) {}
      return;
    }

    const result = await saveFavorite(query.from.id, last);

    try {
      await bot.answerCallbackQuery(query.id, {
        text: result.status === "saved"
          ? "✅ Saved to favorites"
          : "Already in favorites"
      });
    } catch (e) {}

    return;
  }

  /* VIEW FAVORITES */
if (query.data === "view_favorites") {
    await getFavorites(bot, msg.chat.id, query.from.id);
    return;
}

  /* REMOVE FAVORITE */
  if (query.data.startsWith("remove_")) {

    const id = query.data.split("_")[1];
    await removeFavorite(id);

    try {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ Removed from favorites"
      });
    } catch (e) {}

    bot.deleteMessage(msg.chat.id, msg.message_id);
    return;
  }

  /* HELP */
  if (query.data === "help") {
    await sendHelp(msg);
  }
});

/* =============================
   AYAH WITH BUTTONS
============================= */

async function sendAyahWithButtons(msg) {

  await sendRandomAyah(bot, msg);

  await bot.sendMessage(msg.chat.id, "Choose an option:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⭐ Save", callback_data: "save_favorite" },
          { text: "🔄 Next", callback_data: "get_ayah" }
        ],
        [
          { text: "📚 Favorites", callback_data: "view_favorites" }
        ]
      ]
    }
  });
}

/* =============================
   HELP
============================= */

async function sendHelp(msg) {
  await bot.sendMessage(
    msg.chat.id,
`🆘 *How to Use DeenCompanionBot*

📖 Get Ayah → Random Quran verse  
⭐ Save → Save last ayah  
📚 Favorites → View saved ayahs  
🔄 Next → New ayah  

This bot is private and only for you 🤍`,
    { parse_mode: "Markdown" }
  );
}





app.get("/", (req, res) => {
  res.send("DeenCompanionBot is running 🚀");
});


//REST API 
app.get("/api/ayah", async (req, res) => {
  try {
    const ayah = await getRandomAyah();
    res.json({ success: true, ayah });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post("/api/favorite", async (req, res) => {
  try {
    const { userId, content } = req.body;
    const result = await saveFavorite(userId, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const favorites = await require("./models/Favorite").find({
      userId: req.params.userId
    });

    res.json({ success: true, favorites });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/favorite/:id", async (req, res) => {
  try {
    await removeFavorite(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});










/* ==================================================
   🔥 SINGLE STABLE PREMIUM REMINDER
================================================== */

let countdownMessage = null;
let totalSeconds = 60; // change to 3600 for hourly
let currentSeconds = totalSeconds;
let lastText = "";

async function startPremiumReminder() {

  const chatId = OWNER_ID;

  countdownMessage = await bot.sendMessage(
    chatId,
    formatCountdown(currentSeconds),
    { parse_mode: "Markdown" }
  );

  try {
    await bot.pinChatMessage(chatId, countdownMessage.message_id);
  } catch (e) {}

  setInterval(async () => {

    currentSeconds--;

    if (currentSeconds < 0) {
      currentSeconds = totalSeconds;
    }

    const newText = formatCountdown(currentSeconds);

    if (newText !== lastText) {
      try {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: countdownMessage.message_id,
          parse_mode: "Markdown"
        });
        lastText = newText;
      } catch (e) {}
    }

    if (currentSeconds === 0) {

      const ayah = await getRandomAyah();

      setLastAyah(chatId, ayah);

      await bot.sendMessage(
        chatId,
        `📖 *Quran Reminder*\n\n${ayah}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⭐ Save", callback_data: "save_favorite" }]
            ]
          }
        }
      );
    }

  }, 1000);
}

function formatCountdown(seconds) {

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `⏳ *Next Quran Reminder in:* \`${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}\``;
}

startPremiumReminder();





app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Server running...");
});