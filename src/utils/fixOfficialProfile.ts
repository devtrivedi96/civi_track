import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DEPARTMENT_OFFICIALS } from "./officialConfig";

// Map lowercase departments to proper case
const DEPARTMENT_CASE_MAP: Record<string, string> = {
  publicworks: "Public Works",
  waterdepartment: "Water Department",
  electricityboard: "Electricity Board",
  sanitation: "Sanitation",
  lawenforcement: "Law Enforcement",
  healthdepartment: "Health Department",
  educationdepartment: "Education Department",
  environmentalprotection: "Environmental Protection",
  transportdepartment: "Transport Department",
  parksdepartment: "Parks Department",
};

// Function to fix official profile if department is missing or has wrong casing
export async function fixOfficialProfile(userEmail: string) {
  try {
    // Find the official by email
    const officialsQuery = await import("firebase/firestore").then(
      ({ collection, query, where, getDocs }) =>
        getDocs(
          query(collection(db, "officials"), where("email", "==", userEmail))
        )
    );

    if (officialsQuery.empty) {
      console.log("Official not found in officials collection");
      return;
    }

    const officialDoc = officialsQuery.docs[0];
    const officialData = officialDoc.data();
    const department = officialData.department;

    if (!department) {
      console.log("Official department not found");
      return;
    }

    // Check if profile exists
    const profileRef = doc(db, "profiles", officialDoc.id);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      const currentDept = profileData.department;
      const correctDept =
        DEPARTMENT_CASE_MAP[currentDept?.toLowerCase()] || department;

      if (currentDept !== correctDept) {
        // Update profile with correct department casing
        await setDoc(profileRef, {
          ...profileData,
          department: correctDept,
          updatedAt: new Date(),
        });
        console.log(
          `Updated profile for ${userEmail} with correct department: ${correctDept} (was: ${currentDept})`
        );
      } else {
        console.log(
          `Profile for ${userEmail} already has correct department: ${profileData.department}`
        );
      }
    } else {
      // Create profile if it doesn't exist
      const correctDept =
        DEPARTMENT_CASE_MAP[department.toLowerCase()] || department;
      await setDoc(profileRef, {
        id: officialDoc.id,
        email: userEmail,
        fullName: officialData.fullName || "Official",
        role: "official",
        department: correctDept,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      });
      console.log(
        `Created profile for ${userEmail} with department: ${correctDept}`
      );
    }
  } catch (error) {
    console.error("Error fixing official profile:", error);
  }
}

// Function to fix all official profiles
export async function fixAllOfficialProfiles() {
  for (const [department, config] of Object.entries(DEPARTMENT_OFFICIALS)) {
    await fixOfficialProfile(config.email);
  }
}
