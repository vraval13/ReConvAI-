"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await register(username, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setError("Registration failed. Username may already exist.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-200">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          Register for ResearchHive
        </h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && (
          <div className="text-green-600 mb-4">
            Registration successful! Redirecting...
          </div>
        )}
        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 mb-4 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-6 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white"
        >
          Register
        </Button>
        <div className="mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-700 underline">
            Login
          </Link>
        </div>
      </form>
    </main>
  );
}
