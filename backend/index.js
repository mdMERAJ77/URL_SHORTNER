import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "https://ulrshort.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  }
}));

// ✅ DB Connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB error:", err));

// ✅ Schema
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model("Url", urlSchema);

// ✅ Create Short URL
app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "URL required" });
    }

    const shortId = nanoid(8);

    const BASE_URL = process.env.BASE_URL;
    const shortLink = `${BASE_URL}/${shortId}`;

    const qr = await QRCode.toDataURL(shortLink);

    const newUrl = new Url({
      originalUrl,
      shortUrl: shortId,
    });

    await newUrl.save();

    res.json({
      shortUrl: shortLink,
      qrcodeImg: qr,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Redirect
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    const url = await Url.findOne({ shortUrl: shortId });

    if (!url) {
      return res.status(404).json({ message: "Not found" });
    }

    url.clicks++;
    await url.save();

    res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ PORT FIX (IMPORTANT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));