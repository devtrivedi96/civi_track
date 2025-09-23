import { auth, db } from "../lib/firebase";
import { initializeDepartmentOfficials } from "./officialConfig";

// Function to set up all department officials
export async function setupAllOfficials() {
  try {
    console.log("Starting to initialize department officials...");
    await initializeDepartmentOfficials(auth, db);
    console.log("Successfully initialized all department officials!");
  } catch (error) {
    console.error("Error initializing department officials:", error);
  }
}

// Only run this once to set up all officials
setupAllOfficials();
