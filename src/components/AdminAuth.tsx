import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/useAuth";

interface AdminSignInForm {
  email: string;
  password: string;
}

const ADMIN_EMAILS = [
  "admin@civitrack.gov.in",
  // Add more admin emails as needed
];

export function AdminAuth() {
  const { user, loading, signIn, profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminSignInForm>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Redirect if user is already logged in and is an admin or official
  if (user && profile) {
    console.log(
      "Checking access rights for:",
      user.email,
      "Role:",
      profile.role
    );
    if (
      ADMIN_EMAILS.includes(user.email || "") ||
      profile.role === "official"
    ) {
      console.log("Access granted, redirecting to admin dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  const onSubmit = async (data: AdminSignInForm) => {
    try {
      setAuthLoading(true);
      setError(null);
      console.log("Login attempt:", {
        email: data.email,
        isOfficial: data.email.endsWith("@civicreport.com"),
      });

      const result = await signIn(data.email, data.password);
      console.log("Sign in result:", result);

      if (result.error) {
        console.error("Login error:", result.error);
        setError(
          result.error.message || "Invalid credentials. Please try again."
        );
      } else {
        console.log("Login successful, checking profile...");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Administrator Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Authorized access only
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">Email is required</p>
            )}
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">Password is required</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-gray-600">
            Note: Officials can log in with their department email and password
          </p>{" "}
          <div>
            <button
              type="submit"
              disabled={authLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {authLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
