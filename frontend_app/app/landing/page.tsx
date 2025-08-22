"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  FileText,
  Mic,
  BarChart3,
  Video,
  Image,
  HelpCircle,
  Bot,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-200 flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <h1 className="text-6xl font-extrabold text-blue-700 mb-4">
          ResearchHive 🚀
        </h1>
        <p className="max-w-2xl text-lg text-gray-700 mb-8">
          Transform{" "}
          <span className="font-semibold text-blue-700">research papers</span>{" "}
          into engaging summaries, podcasts, presentations, and more — powered
          by AI.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button className="px-8 py-3 text-lg bg-blue-700 hover:bg-blue-800 text-white shadow-lg">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="px-8 py-3 text-lg border-blue-700 text-blue-700 hover:bg-blue-50"
            >
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white rounded-t-3xl shadow-lg px-6">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">
          Why Choose ResearchHive?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              icon: FileText,
              title: "Summaries",
              desc: "Generate summaries at multiple expertise levels.",
            },
            {
              icon: Mic,
              title: "Podcasts",
              desc: "Turn research into natural AI-narrated podcasts.",
            },
            {
              icon: BarChart3,
              title: "Presentations",
              desc: "Auto-generate PowerPoint slides with visuals.",
            },
            {
              icon: Video,
              title: "Video Presentations",
              desc: "Create explainer videos with AI scripts.",
            },
            {
              icon: Image,
              title: "Comics",
              desc: "Transform papers into fun comic-style visuals.",
            },
            {
              icon: HelpCircle,
              title: "Quizzes & MCQs",
              desc: "Instantly generate quizzes for learning.",
            },
            {
              icon: Bot,
              title: "RAG Q&A",
              desc: "Ask questions directly on your documents and get accurate answers.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <feature.icon className="h-10 w-10 text-blue-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 flex flex-col items-center justify-center text-center bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6">
        <h2 className="text-4xl font-bold mb-4">
          Ready to Supercharge Your Research?
        </h2>
        <p className="max-w-2xl text-lg mb-8">
          Join researchers, students, and professionals who use ResearchHive to
          save hours and present ideas creatively.
        </p>
        <Link href="/register">
          <Button className="px-8 py-3 text-lg bg-white text-blue-700 hover:bg-gray-100 shadow-lg">
            Start Free Today
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white mt-auto border-t text-gray-600 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-4">
          <p>
            &copy; {new Date().getFullYear()} ResearchHive. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-blue-700">
              About
            </Link>
            <Link href="/features" className="hover:text-blue-700">
              Features
            </Link>
            <Link href="/contact" className="hover:text-blue-700">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-blue-700">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
