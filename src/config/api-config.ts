export const API_CONFIG = {
  GOOGLE_CLOUD_VISION: {
    apiKey: process.env.VITE_GOOGLE_CLOUD_API_KEY || "YOUR_API_KEY",
    endpoint: "https://vision.googleapis.com/v1/images:annotate",
  },
};
