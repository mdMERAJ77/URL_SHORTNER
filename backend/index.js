import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration (Fixed)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ulrshort.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in production
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// ✅ BASE_URL (Dynamic for production)
const getBaseUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

// ✅ DB Connection
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  process.exit(1);
}

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("✅ DB connected"))
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });

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

    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const shortId = nanoid(8);
    const shortLink = `${getBaseUrl(req)}/${shortId}`;
    
    console.log("Generated:", shortLink);

    const qr = await QRCode.toDataURL(shortLink);
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Dynamic BASE_URL will be determined from requests`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});// ✅ Added DATABASE_URL validation
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  process.exit(1);
}

// ✅ Added server error handling
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});