import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS - Localhost ke liye
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// ✅ BASE_URL - Localhost ke liye fix
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
console.log("✅ Server running on:", BASE_URL);

// ✅ DB Connection
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("✅ DB connected"))
  .catch((err) => console.log("❌ DB error:", err));

// ✅ Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model("Url", urlSchema);

// ✅ Create Short URL
app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Validate URL
    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const shortId = nanoid(8);
    const shortLink = `${BASE_URL}/${shortId}`;
    
    console.log("Generated:", shortLink); // Debug

    // Generate QR Code
    const qr = await QRCode.toDataURL(shortLink);

    // Save to DB
    await new Url({ originalUrl, shortUrl: shortId }).save();

    res.json({
      shortUrl: shortLink,
      qrcodeImg: qr,
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Redirect
app.get("/:shortId", async (req, res) => {
  try {
    const url = await Url.findOne({ shortUrl: req.params.shortId });

    if (!url) {
      return res.status(404).json({ message: "Not found" });
    }

    url.clicks++;
    await url.save();

    res.redirect(url.originalUrl);

  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 BASE_URL: ${BASE_URL}`);
});