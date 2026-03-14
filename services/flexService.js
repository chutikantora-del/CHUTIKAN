function getBaseUrl() {
  const url = (
    process.env.BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    // use PORT env var if defined, otherwise match the default used by app.js
    `http://localhost:${process.env.PORT || 3000}`
  ).replace(/\/$/, "");

  // if we're still pointing at localhost the LINE servers won't be able to
  // access the images.  This often means ngrok didn't start or the developer
  // forgot to set BASE_URL.  Log a visible warning so the problem is obvious.
  if (
    url.startsWith("http://localhost") &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn(
      "WARNING: BASE_URL is localhost; LINE cannot fetch images."
    );
    console.warn(
      "          run with ngrok (npm start handles this) or set BASE_URL"
    );
  }

  return url;
}

const fs = require("fs");
const path = require("path");

function cacheBustedUrl(relPath) {
  // relPath begins with '/'
  const base = getBaseUrl();
  let url = base + relPath;
  try {
    // strip leading slash so path.join doesn't treat it as absolute
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    relPath.replace(/^\//, "")
  );
  const stats = fs.statSync(filePath);
  const mtime = stats.mtime.getTime(); // เวลาแก้ไขไฟล์ล่าสุด
  url += (url.includes("?") ? "&" : "?") + "t=" + mtime;
} catch (e) {
  // if file read fails just return plain url
  console.warn("cacheBustedUrl failed for", relPath, e.message);
}
  return url;
}

function createFlexMessage(food) {
  const contents = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: food.name,
          weight: "bold",
          size: "xl"
        },
        {
          type: "text",
          text: `พลังงาน: ${food.nutrition.calories} kcal`
        },
        {
          type: "text",
          text: `โปรตีน: ${food.nutrition.protein}`
        },
        {
          type: "text",
          text: `คาร์โบไฮเดรต: ${food.nutrition.carbs}`
        },
        {
          type: "text",
          text: `ไขมัน: ${food.nutrition.fat}`
        }
      ]
    }
  };

  // Add hero only if image exists
  if (food.image && food.image.trim() !== "") {
    let imageUrl = food.image;
    if (imageUrl.startsWith("/")) {
      imageUrl = cacheBustedUrl(imageUrl);
    }
    contents.hero = {
      type: "image",
      url: imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover"
    };
  }

  return {
    type: "flex",
    altText: "เมนูอาหารแนะนำ",
    contents
  };
}

module.exports = {
  createFlexMessage,
  // helpers exported for tests / manual inspection
  getBaseUrl
};