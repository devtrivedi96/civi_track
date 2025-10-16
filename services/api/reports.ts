import { db, storage } from '@/services/auth/firebaseConfig';
import { collection, query, orderBy, where, getDocs } from '@react-native-firebase/firestore';
import { Report, ReportStatus, ReportCategory } from "@/types/report";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

interface ReportFilters {
  category?: string;
  status?: ReportStatus;
  search?: string;
  userId?: string;
  departmentId?: string;
  limit?: number;
}

type FirestoreTimestamp = ReturnType<typeof firestore.Timestamp.fromDate>;

type FirebaseTimestamp = ReturnType<typeof firestore.Timestamp.fromDate>;

interface FirestoreReport
  extends Omit<Report, "id" | "createdAt" | "updatedAt" | "resolvedAt"> {
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  resolvedAt?: FirebaseTimestamp;
}

class ReportsService {
  private reportsCollection = firestore().collection("reports");

  async createReport(reportData: Partial<Report>): Promise<string> {
    try {
      const imageUrls = reportData.images
        ? await this.uploadImages(reportData.images)
        : [];

      const report: FirestoreReport = {
        ...(reportData as Omit<
          Report,
          "id" | "createdAt" | "updatedAt" | "resolvedAt"
        >),
        images: imageUrls,
        status: ReportStatus.SUBMITTED,
        createdAt: firestore.Timestamp.fromDate(new Date()),
        updatedAt: firestore.Timestamp.fromDate(new Date()),
        upvotes: 0,
        downvotes: 0,
        commentsCount: 0,
        departmentId: this.getDepartmentForCategory(
          reportData.category as ReportCategory
        ),
      };

      const docRef = await this.reportsCollection.add(report);
      return docRef.id;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  async getReports(filters: ReportFilters = {}): Promise<Report[]> {
    try {
      const reportsCollection = firestore().collection("reports");
      let query: FirebaseFirestoreTypes.Query = reportsCollection;

      // Build query with filters
      if (filters.category) {
        query = query.where("category", "==", filters.category);
      }

      if (filters.status) {
        query = query.where("status", "==", filters.status);
      }

      if (filters.userId) {
        query = query.where("userId", "==", filters.userId);
      }

      if (filters.departmentId) {
        query = query.where("departmentId", "==", filters.departmentId);
      }

      query = query.orderBy("createdAt", "desc");

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const querySnapshot = await query.get();

      let reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        resolvedAt: doc.data()?.resolvedAt?.toDate(),
      })) as Report[];

      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        reports = reports.filter(
          (report) =>
            report.title.toLowerCase().includes(searchTerm) ||
            report.description.toLowerCase().includes(searchTerm) ||
            report.location.address.toLowerCase().includes(searchTerm)
        );
      }

      return reports;
    } catch (error) {
      console.error("Error getting reports:", error);
      throw error;
    }
  }

  async getReport(id: string): Promise<Report | null> {
    try {
      const docSnapshot = await firestore().collection("reports").doc(id).get();

      if (!docSnapshot.exists) {
        return null;
      }

      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        resolvedAt: data?.resolvedAt?.toDate(),
      } as Report;
    } catch (error) {
      console.error("Error getting report:", error);
      throw error;
    }
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    comment?: string,
    officialId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: firestore.Timestamp.fromDate(new Date()),
      };

      if (status === ReportStatus.RESOLVED) {
        updateData.resolvedAt = firestore.Timestamp.fromDate(new Date());
      }

      if (officialId) {
        updateData.assignedOfficialId = officialId;
      }

      await firestore().collection("reports").doc(reportId).update(updateData);

      // Add status update to history
      await firestore()
        .collection("statusUpdates")
        .add({
          reportId,
          status,
          comment: comment || "",
          updatedBy: officialId || "system",
          updatedAt: firestore.Timestamp.fromDate(new Date()),
        });
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  }

  async voteReport(reportId: string, isUpvote: boolean): Promise<void> {
    try {
      const reportRef = firestore().collection("reports").doc(reportId);
      const reportDoc = await reportRef.get();

      if (reportDoc.exists()) {
        const data = reportDoc.data();
        const updateData = isUpvote
          ? { upvotes: (data?.upvotes || 0) + 1 }
          : { downvotes: (data?.downvotes || 0) + 1 };

        await reportRef.update(updateData);
      }
    } catch (error) {
      console.error("Error voting on report:", error);
      throw error;
    }
  }

  subscribeToReports(
    filters: ReportFilters,
    callback: (reports: Report[]) => void
  ): () => void {
    const reportsCollection = firestore().collection("reports");
    let query: FirebaseFirestoreTypes.Query = reportsCollection;

    if (filters.category) {
      query = query.where("category", "==", filters.category);
    }

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }

    query = query.orderBy("createdAt", "desc");

    return query.onSnapshot((querySnapshot) => {
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        resolvedAt: doc.data()?.resolvedAt?.toDate(),
      })) as Report[];

      callback(reports);
    });
  }

  private async uploadImages(imageUris: string[]): Promise<string[]> {
    const uploadPromises = imageUris.map(async (uri, index) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `report_${Date.now()}_${index}.jpg`;
      const storageRef = storage().ref(`reports/${fileName}`);

      await storageRef.put(blob);
      return storageRef.getDownloadURL();
    });

    return Promise.all(uploadPromises);
  }

  private getDepartmentForCategory(category: ReportCategory): string {
    const categoryDepartmentMap = {
      [ReportCategory.ROAD_INFRASTRUCTURE]: "PWD",
      [ReportCategory.WATER_SANITATION]: "WATER",
      [ReportCategory.ELECTRICITY]: "POWER",
      [ReportCategory.WASTE_MANAGEMENT]: "SANITATION",
      [ReportCategory.PUBLIC_SAFETY]: "POLICE",
      [ReportCategory.HEALTHCARE]: "HEALTH",
      [ReportCategory.EDUCATION]: "EDUCATION",
      [ReportCategory.ENVIRONMENT]: "ENVIRONMENT",
      [ReportCategory.TRAFFIC]: "TRAFFIC",
      [ReportCategory.OTHER]: "GENERAL",
    };

    return categoryDepartmentMap[category] || "GENERAL";
  }
}

export const reportsService = new ReportsService();
