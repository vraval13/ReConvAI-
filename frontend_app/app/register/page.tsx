"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, User, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await register(username, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setError("Registration failed. Username may already exist.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">
          Join ResearchHive 🐝
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Create your account and start transforming research.
        </p>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-2 rounded mb-4 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> Registration successful!
            Redirecting...
          </div>
        )}

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="flex items-center border rounded-lg p-2">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="flex items-center border rounded-lg p-2">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="w-full focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-gray-500 hover:text-blue-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
          Register
        </Button>

        {/* Links */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-700 font-semibold hover:underline"
          >
            Login here
          </Link>
        </div>
      </form>
    </main>
  );
}
