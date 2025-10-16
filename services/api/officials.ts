import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { Official, OfficialVerification } from "@/types/official";

class OfficialService {
  async requestOfficialVerification(officialData: {
    email: string;
    name: string;
    department: string;
    designation: string;
    badgeNumber: string;
    documentFiles: string[]; // Local URIs of documents
  }): Promise<string> {
    try {
      // Upload verification documents
      const documentUrls = await Promise.all(
        officialData.documentFiles.map(async (uri) => {
          const filename = `officials/${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`;
          const reference = storage().ref(filename);
          await reference.putFile(uri);
          return reference.getDownloadURL();
        })
      );

      // Create official document
      const officialRef = await firestore().collection("officials").add({
        email: officialData.email,
        name: officialData.name,
        department: officialData.department,
        designation: officialData.designation,
        badgeNumber: officialData.badgeNumber,
        isVerified: false,
        createdAt: new Date(),
      });

      // Create verification request
      const verificationRef = await firestore()
        .collection("officialVerifications")
        .add({
          officialId: officialRef.id,
          documentUrls,
          status: "pending",
          submittedAt: new Date(),
        });

      return officialRef.id;
    } catch (error) {
      console.error("Error requesting official verification:", error);
      throw new Error("Failed to submit verification request");
    }
  }

  async getOfficialDetails(officialId: string): Promise<Official | null> {
    try {
      const doc = await firestore()
        .collection("officials")
        .doc(officialId)
        .get();
      return doc.exists() ? (doc.data() as Official) : null;
    } catch (error) {
      console.error("Error getting official details:", error);
      return null;
    }
  }

  async getVerificationStatus(
    officialId: string
  ): Promise<OfficialVerification | null> {
    try {
      const snapshot = await firestore()
        .collection("officialVerifications")
        .where("officialId", "==", officialId)
        .orderBy("submittedAt", "desc")
        .limit(1)
        .get();

      return !snapshot.empty
        ? (snapshot.docs[0].data() as OfficialVerification)
        : null;
    } catch (error) {
      console.error("Error getting verification status:", error);
      return null;
    }
  }

  async updateAssignedArea(
    officialId: string,
    area: {
      name: string;
      coordinates: { latitude: number; longitude: number }[];
    }
  ): Promise<void> {
    try {
      await firestore().collection("officials").doc(officialId).update({
        assignedArea: area,
      });
    } catch (error) {
      console.error("Error updating assigned area:", error);
      throw new Error("Failed to update assigned area");
    }
  }

  async getAssignedReports(officialId: string) {
    try {
      const snapshot = await firestore()
        .collection("reports")
        .where("assignedOfficialId", "==", officialId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting assigned reports:", error);
      throw new Error("Failed to fetch assigned reports");
    }
  }

  async getDepartmentOfficials(department: string): Promise<Official[]> {
    try {
      const snapshot = await firestore()
        .collection("officials")
        .where("department", "==", department)
        .where("isVerified", "==", true)
        .get();

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Official)
      );
    } catch (error) {
      console.error("Error getting department officials:", error);
      throw new Error("Failed to fetch department officials");
    }
  }

  // For admin operations
  async verifyOfficial(
    verificationId: string,
    approved: boolean,
    notes?: string
  ): Promise<void> {
    try {
      const verificationRef = firestore()
        .collection("officialVerifications")
        .doc(verificationId);
      const verification = await verificationRef.get();

      if (!verification.exists) {
        throw new Error("Verification request not found");
      }

      const verificationData = verification.data() as OfficialVerification;
      const officialRef = firestore()
        .collection("officials")
        .doc(verificationData.officialId);

      await firestore().runTransaction(async (transaction) => {
        // Update verification status
        transaction.update(verificationRef, {
          status: approved ? "approved" : "rejected",
          notes,
          reviewedAt: new Date(),
        });

        // Update official status if approved
        if (approved) {
          transaction.update(officialRef, {
            isVerified: true,
            verifiedAt: new Date(),
          });
        }
      });
    } catch (error) {
      console.error("Error verifying official:", error);
      throw new Error("Failed to process verification");
    }
  }
}

export const officialService = new OfficialService();
