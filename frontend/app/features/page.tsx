"use client";

import {
  FileText,
  Mic,
  BarChart3,
  Video,
  Image,
  Bot,
  HelpCircle,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: FileText,
      title: "Smart Summaries",
      desc: "Summaries tailored for beginners, intermediates, or experts.",
    },
    {
      icon: Mic,
      title: "AI-Powered Podcasts",
      desc: "Turn your papers into engaging, narrated podcast episodes.",
    },
    {
      icon: BarChart3,
      title: "Interactive Presentations",
      desc: "Get ready-to-present slides for teaching & sharing.",
    },
    {
      icon: Video,
      title: "Explainer Videos",
      desc: "AI-scripted video presentations with visuals that stand out.",
    },
    {
      icon: Image,
      title: "Comic Creation",
      desc: "Turn research into fun, digestible comic-style visuals.",
    },
    {
      icon: HelpCircle,
      title: "Quiz Generator",
      desc: "Test comprehension with AI-generated MCQs & quizzes.",
    },
    {
      icon: Bot,
      title: "RAG Q&A Engine",
      desc: "Upload papers & ask natural questions for instant insights.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
          Features of ResearchHive 🌟
        </h1>
        <p className="text-lg text-gray-700">
          Explore the buzzing hive of tools designed to make research{" "}
          <span className="font-semibold text-blue-700">
            smarter, faster, and engaging
          </span>
          .
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <f.icon className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-blue-700 mb-2">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
