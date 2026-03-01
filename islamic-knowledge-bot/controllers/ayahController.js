const axios = require("axios");

const lastAyah = {};

exports.getLastAyah = (chatId) => {
  return lastAyah[chatId];
};

exports.setLastAyah = (chatId, ayah) => {
  lastAyah[chatId] = ayah;
};

exports.getRandomAyah = async () => {

  const randomAyah = Math.floor(Math.random() * 6236) + 1;

  const response = await axios.get(
    `https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.sahih`
  );

  const arabicData = response.data.data[0];
  const englishData = response.data.data[1];

  const surah = arabicData.surah.englishName;
  const number = arabicData.numberInSurah;
  const arabic = arabicData.text;
  const meaning = englishData.text;

  return `
📖 *Surah ${surah} (${number})*

${arabic}

🌍 *Meaning:*
${meaning}
`;
};

exports.sendRandomAyah = async (bot, msg) => {
  try {

    const formatted = await exports.getRandomAyah();

    lastAyah[msg.chat.id] = formatted;

    await bot.sendMessage(msg.chat.id, formatted, {
      parse_mode: "Markdown"
    });

  } catch (error) {
    console.log(error.message);
    bot.sendMessage(msg.chat.id, "Error fetching ayah. Try again.");
  }
};