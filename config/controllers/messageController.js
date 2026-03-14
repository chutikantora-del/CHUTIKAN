const { client } = require("../config/lineConfig");
const { getRandomFood } = require("../services/foodService");
const { createFlexMessage } = require("../services/flexService");

const keywords = ["แนะนำร้านอาหาร", "กินอะไรดี", "หิวข้าว"];

async function handleMessage(event) {
  const text = event.message.text;

  if (keywords.includes(text)) {

    const food = getRandomFood();

    const flex = createFlexMessage(food);

    return client.replyMessage(event.replyToken, flex);

  } else {

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "ฉันไม่เข้าใจ"
    });

  }
}

module.exports = {
  handleMessage
};