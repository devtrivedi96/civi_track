import { setupAllOfficials } from "../utils/setupOfficials";
import dotenv from "dotenv";
import { resolve } from "path";

console.log("Starting the setup process...");

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), ".env") });

console.log("Starting the setup process...");
console.log("Environment loaded:", {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? "✓" : "✗",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? "✓" : "✗",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "✓" : "✗",
});

// Run the setup
setupAllOfficials()
  .then(() => {
    console.log("Setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
