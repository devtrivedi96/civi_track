import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { getDepartmentFromCategory } from "./departments";

interface DepartmentConfig {
  email: string;
  password: string; // This would be the initial password
  fullName: string;
}

export const DEPARTMENT_OFFICIALS: Record<string, DepartmentConfig> = {
  "Public Works": {
    email: "publicworks.official@civicreport.com",
    password: "PW@2025",
    fullName: "Public Works Officer",
  },
  "Water Department": {
    email: "water.official@civicreport.com",
    password: "WD@2025",
    fullName: "Water Department Officer",
  },
  "Electricity Board": {
    email: "electricity.official@civicreport.com",
    password: "EB@2025",
    fullName: "Electricity Board Officer",
  },
  Sanitation: {
    email: "sanitation.official@civicreport.com",
    password: "SN@2025",
    fullName: "Sanitation Officer",
  },
  "Law Enforcement": {
    email: "safety.official@civicreport.com",
    password: "LE@2025",
    fullName: "Public Safety Officer",
  },
  "Health Department": {
    email: "health.official@civicreport.com",
    password: "HD@2025",
    fullName: "Healthcare Officer",
  },
  "Education Department": {
    email: "education.official@civicreport.com",
    password: "ED@2025",
    fullName: "Education Officer",
  },
  "Environmental Protection": {
    email: "environment.official@civicreport.com",
    password: "EP@2025",
    fullName: "Environmental Officer",
  },
  "Transport Department": {
    email: "transport.official@civicreport.com",
    password: "TD@2025",
    fullName: "Transport Officer",
  },
  "Parks Department": {
    email: "parks.official@civicreport.com",
    password: "PD@2025",
    fullName: "Parks & Recreation Officer",
  },
};

// Helper function to get official config from department
export function getOfficialConfigFromDepartment(
  department: string
): DepartmentConfig | undefined {
  return DEPARTMENT_OFFICIALS[department];
}

// Helper function to get official config from category
export function getOfficialConfigFromCategory(
  category: string
): DepartmentConfig | undefined {
  const department = getDepartmentFromCategory(category as any);
  return department ? DEPARTMENT_OFFICIALS[department] : undefined;
}

// Helper function to initialize all department officials in Firebase
export async function initializeDepartmentOfficials(
  auth: any,
  db: any
): Promise<void> {
  for (const [department, config] of Object.entries(DEPARTMENT_OFFICIALS)) {
    try {
      // Create user in Firebase Auth if doesn't exist
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        config.email,
        config.password
      ).catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          console.log(`Official for ${department} already exists`);
          return null;
        }
        throw error;
      });

      if (userCredential) {
        const user = userCredential.user;

        // Create or update the user's profile in Firestore
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          email: config.email,
          fullName: config.fullName,
          role: "official",
          department: department,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
        });

        console.log(`Created official for ${department}`);
      }
    } catch (error) {
      console.error(`Error creating official for ${department}:`, error);
    }
  }
}
