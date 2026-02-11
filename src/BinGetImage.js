import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extFromContentType(ct = "") {
  const t = ct.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "jpg";
}

async function fetchBingHtml(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  const res = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  return res.data;
}

function extractThumbUrlsFromHtml(html) {
  const $ = cheerio.load(html);

  const thumbs = [];

  // Bing commonly uses <a class="iusc" m="{...json...}">
  $("a.iusc").each((_, el) => {
    const m = $(el).attr("m");
    if (!m) return;

    try {
      const data = JSON.parse(m);
      // turl = thumbnail url
      if (data?.turl && typeof data.turl === "string" && data.turl.startsWith("http")) {
        thumbs.push(data.turl);
      }
    } catch {
      // ignore bad JSON
    }
  });

  // Fallback: sometimes the data is in other attrs; keep it minimal
  return thumbs;
}

async function getThumbUrlWithRetry({ query, index0Based, retries = 3, delayMs = 10_000 }) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // ✅ delay 10 seconds before each attempt
      await sleep(delayMs);

      const html = await fetchBingHtml(query);
      const thumbs = extractThumbUrlsFromHtml(html);

      if (thumbs.length <= index0Based) {
        throw new Error(`Not enough thumbnails found (found ${thumbs.length}, need ${index0Based + 1})`);
      }

      return thumbs[index0Based];
    } catch (err) {
      lastErr = err;
      // retry loop continues
    }
  }

  throw lastErr;
}

async function downloadToFile(url, outDir, filenameBase) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const ext = extFromContentType(res.headers["content-type"]);
  const filePath = path.join(outDir, `${filenameBase}.${ext}`);
  fs.writeFileSync(filePath, res.data);

  return filePath;
}

async function saveSecondBingThumbnail(query, sku) {
  const thumbUrl = await getThumbUrlWithRetry({
    query,
    index0Based: 1, // second thumbnail
  });

  const outDir = path.resolve("./images");
  const filePath = await downloadToFile(thumbUrl, outDir, sku);

  return filePath;
}

/**
 * GET /api/bing-thumb?q=ramen&index=2
 * - index is 1-based: index=2 => second thumbnail
 */
app.get("/api/bing-thumb", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const index1Based = Number(req.query.index || 2);
    const retries = Number(req.query.retries || 3);
    const delayMs = Number(req.query.delayMs || 10_000);

    if (!q) return res.status(400).json({ error: "Missing required query param: q" });
    if (!Number.isFinite(index1Based) || index1Based < 1) {
      return res.status(400).json({ error: "index must be a positive integer (1-based)" });
    }

    const index0Based = index1Based - 1;

    const thumbUrl = await getThumbUrlWithRetry({
      query: q,
      index0Based,
      retries,
      delayMs
    });

    const outDir = path.resolve("./images");
    const filePath = await downloadToFile(thumbUrl, outDir, `bing-thumb-${index1Based}`);

    res.json({
      query: q,
      index: index1Based,
      retries,
      delayMs,
      thumbUrl,
      savedTo: filePath
    });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Scrape failed" });
  }
});

// app.listen(PORT, () => {
//   console.log(`✅ Server: http://localhost:${PORT}`);
//   console.log(`Try: http://localhost:${PORT}/api/bing-thumb?q=Arawana%20sliced%20noodles&index=2`);
// });

export { saveSecondBingThumbnail };

// Example
//saveSecondBingThumbnail("白象 | White Elephant – 蟹黄面 | Crab Roe Noodles")
//  .then(console.log)
//  .catch(console.error);