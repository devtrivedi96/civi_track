import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

// Enable CORS for your frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Your Vite dev server
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

    // Round coordinates for consistent caching
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

    if (!response.ok) {
      throw new Error("Geocoding service error");
    }

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

const startServer = (startPort) => {
  const server = app.listen(startPort, () => {
    console.log(`Server running on port ${startPort}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const nextPort = startPort + 1;
      console.warn(`Port ${startPort} in use, retrying on ${nextPort}...`);
      startServer(nextPort);
    } else {
      throw err;
    }
  });
};

startServer(port);
