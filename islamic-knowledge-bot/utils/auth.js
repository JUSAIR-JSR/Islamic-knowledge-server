const isOwner = (msg) => {
  return msg.from.id.toString() === process.env.OWNER_ID;
};

module.exports = isOwner;