import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import QRCode from 'qrcode'; // You need to import this

dotenv.config()

const app = express();
app.use(cors())
app.use(express.json())

// Connection to database
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("db connected"))
  .catch((err) => console.log("failed to connect", err))

// Model
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
})

const Url = mongoose.model("Url", urlSchema);

// Create API
app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ message: "URL required" });
    }
    
    const shortUrl = nanoid(8);
    const url = new Url({ originalUrl, shortUrl });
    const myUrl = `http://localhost:3000/${shortUrl}`; // Fixed: was 300 instead of 3000
    const qrcodeImg = await QRCode.toDataURL(myUrl);
    await url.save();
    
    res.status(200).json({ 
      message: "url generated", 
      shortUrl: myUrl,  // Changed from myUrl to match frontend expectation
      qrcodeImg 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "server error": error.message });
  }
})

app.get('/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (url) {
      url.clicks++;
      await url.save();
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ error: "url not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ "server error": error.message });
  }
})

app.listen(3000, () => console.log("server is running on 3000"))

