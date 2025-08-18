"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-200 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
          ResearchHive
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          <span className="font-semibold">ResearchHive</span> is your all-in-one
          AI-powered platform for transforming research papers into engaging
          multimedia:
        </p>
        <ul className="text-left text-gray-800 mb-6 space-y-2">
          <li>
            • 📄 <b>Summaries</b> at multiple expertise levels
          </li>
          <li>
            • 🎙️ <b>Podcast</b> scripts and audio
          </li>
          <li>
            • 📊 <b>PowerPoint</b> presentations
          </li>
          <li>
            • 🎬 <b>Video</b> presentations
          </li>
          <li>
            • 🦸 <b>Comic</b> image generation
          </li>
          <li>
            • ❓ <b>MCQ/Quiz</b> generator
          </li>
          <li>
            • 🤖 <b>RAG-powered Q&A</b> on your documents
          </li>
        </ul>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button className="px-8 py-3 text-lg bg-blue-700 hover:bg-blue-800 text-white">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button
              variant="outline"
              className="px-8 py-3 text-lg border-blue-700 text-blue-700 hover:bg-blue-50"
            >
              Register
            </Button>
          </Link>
        </div>
      </div>
      <footer className="mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ResearchHive. All rights reserved.
      </footer>
    </main>
  );
}
