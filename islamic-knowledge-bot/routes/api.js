const express = require("express");
const router = express.Router();

const {
  getRandomAyah
} = require("../controllers/ayahController");

const {
  saveFavorite,
  removeFavorite
} = require("../controllers/favoriteController");

const Favorite = require("../models/Favorite");

/* ===============================
   GET RANDOM AYAH
================================ */

router.get("/ayah", async (req, res) => {
  try {
    const ayah = await getRandomAyah();
    res.json({ ayah });
  } catch {
    res.status(500).json({ error: "Failed to fetch ayah" });
  }
});

/* ===============================
   SAVE FAVORITE
================================ */

router.post("/favorite", async (req, res) => {

  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing data" });
  }

  const result = await saveFavorite(userId, content);

  res.json(result);
});

/* ===============================
   GET FAVORITES
================================ */

router.get("/favorite/:userId", async (req, res) => {

  const favorites = await Favorite.find({
    userId: req.params.userId
  });

  res.json({ favorites });
});

/* ===============================
   DELETE FAVORITE
================================ */

router.delete("/favorite/:id", async (req, res) => {

  await removeFavorite(req.params.id);

  res.json({ success: true });
});

module.exports = router;