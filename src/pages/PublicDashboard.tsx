import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MapView } from "../components/MapView";

export function PublicDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sanitize reports for guest browsing: remove sensitive fields
        // and convert Firestore Timestamps to Date objects for the UI.
        const sanitized = fetchedReports.map((r: any) => {
          const createdAt =
            r.createdAt && typeof r.createdAt.toDate === "function"
              ? r.createdAt.toDate()
              : r.createdAt
              ? new Date(r.createdAt)
              : new Date();

          return {
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            severity: r.severity || "low",
            status: r.status || "submitted",
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
            thumbnail: r.thumbnail || null,
            createdAt,
          };
        });

        setReports(sanitized);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to CiviTrack
        </h1>
        <p className="text-gray-600 mb-4">
          Help improve your community by reporting civic issues. Sign in to
          submit new reports.
        </p>
        <Link
          to="/auth"
          className="inline-block px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Sign In to Report Issues
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Reports
            </h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Show resolved</label>
              <button
                onClick={() => setShowResolved((s) => !s)}
                className="inline-flex items-center px-3 py-1.5 bg-white border rounded-md text-sm shadow-sm"
              >
                {showResolved ? "Yes" : "No"}
              </button>
            </div>
          </div>
          <div className="h-96 mb-6">
            <MapView
              reports={reports}
              hideResolved={!showResolved}
              onReportClick={(r) => navigate(`/public/report/${r.id}`)}
            />
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report: any) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link
                          to={`/public/report/${report.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {report.title}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.description?.substring(0, 100)}
                        {report.description?.length > 100 ? "..." : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : report.status === "in-progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.createdAt instanceof Date
                        ? report.createdAt.toLocaleDateString()
                        : new Date(report.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
