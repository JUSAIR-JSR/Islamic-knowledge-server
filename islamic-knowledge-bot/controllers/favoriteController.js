const Favorite = require("../models/Favorite");

// SAVE FAVORITE
exports.saveFavorite = async (userId, content) => {
  try {
    const userIdStr = userId.toString();

    const exists = await Favorite.findOne({
      userId: userIdStr,
      content
    });

    if (exists) {
      return { status: "exists" };
    }

    await Favorite.create({
      userId: userIdStr,
      type: "ayah",
      content
    });

    return { status: "saved" };

  } catch (error) {
    console.log(error);
    return { status: "error" };
  }
};


// GET FAVORITES
exports.getFavorites = async (bot, chatId, userId) => {

  if (!userId) {
    return bot.sendMessage(chatId, "Error loading favorites.");
  }

  const userIdStr = userId.toString();

  const favorites = await Favorite.find({
    userId: userIdStr
  });

  if (favorites.length === 0) {
    return bot.sendMessage(chatId, "No favorites yet.");
  }

  for (const fav of favorites) {
    await bot.sendMessage(
      chatId,
      fav.content,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "❌ Remove",
                callback_data: `remove_${fav._id}`
              }
            ]
          ]
        }
      }
    );
  }
};

// REMOVE FAVORITE
exports.removeFavorite = async (favoriteId) => {
  try {
    await Favorite.findByIdAndDelete(favoriteId);
    return true;
  } catch {
    return false;
  }
};