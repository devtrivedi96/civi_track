import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  where,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, Profile, auth } from "../lib/firebase";
import { UserPlus, Save, X, Check } from "lucide-react";
import { DEPARTMENTS } from "../utils/departments";

type ProfileWithoutRole = Omit<Profile, "role">;

interface Official extends ProfileWithoutRole {
  role:
    | "user"
    | "admin"
    | "agent"
    | "official"
    | "Municipal Commissioner"
    | "Public Works Officer"
    | "Sanitation Officer"
    | "Traffic Manager"
    | "Environment Officer";
  department: string;
  jurisdiction: string;
  status: "active" | "inactive";
  dateAdded: Date;
}

interface OfficialFormData {
  email: string;
  role: string;
  department: string;
  jurisdiction: string;
}

export function ManageOfficials() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<OfficialFormData>({
    email: "",
    role: "",
    department: "",
    jurisdiction: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Import departments from utils
  const roles = [
    "Municipal Commissioner",
    "Public Works Officer",
    "Sanitation Officer",
    "Traffic Manager",
    "Environment Officer",
  ];

  // Get unique departments
  const departments = [...new Set(Object.values(DEPARTMENTS))];

  useEffect(() => {
    // Fetch officials from Firestore
    const officialsQuery = query(
      collection(db, "officials"),
      orderBy("dateAdded", "desc")
    );

    const unsubscribe = onSnapshot(officialsQuery, (snapshot) => {
      const officialsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateAdded: doc.data().dateAdded?.toDate() || new Date(),
      })) as Official[];

      setOfficials(officialsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { email, role, department, jurisdiction } = formData;
    const password = Math.random().toString(36).slice(-8); // Generate random password

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create official document in Firestore
      await addDoc(collection(db, "officials"), {
        id: user.uid,
        email,
        role,
        department,
        jurisdiction,
        status: "active",
        dateAdded: new Date(),
      });

      // Create profile document
      await addDoc(collection(db, "profiles"), {
        id: user.uid,
        email,
        fullName: "",
        role: "official",
        department,
        jurisdiction,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess(
        "Official account created successfully. Password: " + password
      );
      setFormData({
        email: "",
        role: "",
        department: "",
        jurisdiction: "",
      });
      setShowAddForm(false);
    } catch (error: any) {
      setError(error.message || "Failed to create official account");
    }

    try {
      // Validate email format
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError("Please enter a valid email address");
        return;
      }

      // Check if email already exists
      const existingQuery = query(
        collection(db, "officials"),
        where("email", "==", formData.email)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        setError("This email is already registered as an official");
        return;
      }

      // Add new official
      await addDoc(collection(db, "officials"), {
        ...formData,
        status: "active",
        dateAdded: new Date(),
      });

      setSuccess("Official added successfully");
      setFormData({ email: "", role: "", department: "", jurisdiction: "" });
      setShowAddForm(false);
    } catch (err) {
      setError("Failed to add official. Please try again.");
      console.error("Error adding official:", err);
    }
  };

  const toggleOfficialStatus = async (
    officialId: string,
    currentStatus: string
  ) => {
    try {
      await updateDoc(doc(db, "officials", officialId), {
        status: currentStatus === "active" ? "inactive" : "active",
      });
      setSuccess("Official status updated successfully");
    } catch (err) {
      setError("Failed to update official status");
      console.error("Error updating official status:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Government Officials
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Official
            </button>
          </div>

          {/* Add Official Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Add New Official</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddOfficial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={formData.jurisdiction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jurisdiction: e.target.value,
                        })
                      }
                      placeholder="e.g., North Zone, South District"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Official
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Officials List */}
          <div className="space-y-4">
            {officials.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No officials added yet</p>
              </div>
            ) : (
              officials.map((official) => (
                <div
                  key={official.id}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {official.email}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                          {official.role}
                        </span>
                        <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2">
                          {official.department}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                          {official.jurisdiction}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          toggleOfficialStatus(official.id, official.status)
                        }
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          official.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {official.status === "active" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
