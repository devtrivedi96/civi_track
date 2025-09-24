import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend (only for API routes)
app.use(
  "/api",
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// In-memory cache for geocoding results
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Geocoding endpoint
app.get("/api/geocode", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    const roundedLat = Math.round(parseFloat(lat) * 1000000) / 1000000;
    const roundedLng = Math.round(parseFloat(lng) * 1000000) / 1000000;
    const cacheKey = `${roundedLat},${roundedLng}`;

    // Check cache
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ address: cached.data });
    }

    // Fetch from OpenStreetMap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=16&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SIH_CivicIssueTracker/1.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) throw new Error("Geocoding service error");

    const data = await response.json();
    const address = data.display_name || `${roundedLat}, ${roundedLng}`;

    // Cache the result
    geocodeCache.set(cacheKey, {
      data: address,
      timestamp: Date.now(),
    });

    res.json({ address });
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      error: "Geocoding failed",
      fallback: `${req.query.lat}, ${req.query.lng}`,
    });
  }
});

// Clear expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of geocodeCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      geocodeCache.delete(key);
    }
  }
}, CACHE_DURATION);

// ----------------------
// Serve frontend build
// ----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

// Fallback to index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server + Frontend running on port ${PORT}`);
});
