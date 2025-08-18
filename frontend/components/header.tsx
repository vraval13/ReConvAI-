"use client";
import {
  FileAudio,
  Presentation as FilePresentation,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 text-white py-16 md:py-20">
      {/* Decorative background blur circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />

      <div className="container relative z-10 px-6 md:px-8 mx-auto max-w-5xl text-center">
        {/* Icons */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="p-4 rounded-full bg-white/10 backdrop-blur-lg shadow-md hover:scale-110 transition">
            <FileText className="h-10 w-10 text-yellow-300 drop-shadow" />
          </div>
          <div className="p-4 rounded-full bg-white/10 backdrop-blur-lg shadow-md hover:scale-110 transition">
            <FileAudio className="h-10 w-10 text-green-300 drop-shadow" />
          </div>
          <div className="p-4 rounded-full bg-white/10 backdrop-blur-lg shadow-md hover:scale-110 transition">
            <FilePresentation className="h-10 w-10 text-pink-300 drop-shadow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          AI‑Driven{" "}
          <span className="text-yellow-300">Multimedia Conversion</span> <br />{" "}
          <span className="text-green-300">Generator</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-8 leading-relaxed">
          Transform research papers and text into{" "}
          <span className="font-semibold text-white">
            summaries, podcasts, and presentations
          </span>{" "}
          — effortlessly powered by AI. Upload a PDF or type in your content,
          and let the Hive work its magic.
        </p>

        {/* Call To Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button className="px-8 py-4 text-lg bg-yellow-400 hover:bg-yellow-500 text-black font-semibold shadow-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Try it Now
          </Button>
          <Button
            // variant="outline"
            className="px-8 py-4 text-lg border-white text-white bg-blue-300 hover:bg-blue-400 shadow-lg"
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
