const foodMenu = require("../data/foodMenu");
const randomItem = require("../utils/random");

function getRandomFood() {
  return randomItem(foodMenu);
}

module.exports = {
  getRandomFood
};