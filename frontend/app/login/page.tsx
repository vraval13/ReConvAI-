"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      router.push("/");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          Login to ResearchHive
        </h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
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
          Login
        </Button>
        <div className="mt-4 text-center">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-700 underline">
            Register
          </Link>
        </div>
      </form>
    </main>
  );
}
