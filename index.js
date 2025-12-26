const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function saveSecondBingThumbnail(query, outDir = "./images") {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const $ = cheerio.load(html);

  const thumbUrls = $("a.iusc")
    .map((i, el) => {
      const m = $(el).attr("m");
      if (m) {
        try {
          const mJson = JSON.parse(m);
          return mJson.turl;
        } catch (e) {
          return null;
        }
      }
      return null;
    })
    .get()
    .filter(Boolean); // Filter out any nulls

  console.log('Found thumbnail URLs:', thumbUrls);

  let thumbUrl = thumbUrls[1]; // Try to get the second thumbnail

  if (!thumbUrl) {
    console.log("Second thumbnail not found, falling back to the first one.");
    thumbUrl = thumbUrls[0]; // Fallback to the first thumbnail
  }

  if (!thumbUrl) throw new Error("No thumbnails found");

  // Download thumbnail
  const imgRes = await axios.get(thumbUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const ext = imgRes.headers["content-type"]?.includes("png") ? "png" : "jpg";
  const filePath = path.join(outDir, `${query}.${ext}`);

  fs.writeFileSync(filePath, imgRes.data);

  console.log(`✅ Saved thumbnail: ${filePath}`);
  return filePath;
}

// Example
saveSecondBingThumbnail("白象 | White Elephant – 蟹黄面 | Crab Roe Noodles")
  .then(console.log)
  .catch(console.error);