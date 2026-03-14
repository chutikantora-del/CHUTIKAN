const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET
};

const client = new line.Client(config);

module.exports = {
  config,
  client
};