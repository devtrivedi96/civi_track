import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fixOfficialProfile } from "../utils/fixOfficialProfile";

export function DebugOfficial() {
  const { user, profile } = useAuth();
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (user && profile) {
      console.log("Debug - User:", user.email);
      console.log("Debug - Profile:", profile);
      console.log("Debug - Profile Department:", profile.department);
      console.log("Debug - Profile Role:", profile.role);
    }
  }, [user, profile]);

  const handleFixProfile = async () => {
    if (!user?.email) return;

    setIsFixing(true);
    try {
      await fixOfficialProfile(user.email);
      alert("Profile fixed! Please refresh the page.");
    } catch (error) {
      console.error("Error fixing profile:", error);
      alert("Error fixing profile. Check console for details.");
    } finally {
      setIsFixing(false);
    }
  };

  if (!user || profile?.role !== "official") return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded p-4 z-50">
      <h3 className="font-bold text-yellow-800">Debug Official</h3>
      <p className="text-sm text-yellow-700">
        Department: {profile.department || "NOT SET"}
      </p>
      <p className="text-sm text-yellow-700">Role: {profile.role}</p>
      <button
        onClick={handleFixProfile}
        disabled={isFixing}
        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
      >
        {isFixing ? "Fixing..." : "Fix Profile"}
      </button>
    </div>
  );
}
