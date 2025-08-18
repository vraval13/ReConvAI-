"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/file-uploader";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { FileText, Upload, Sparkles, HelpCircle } from "lucide-react";

type InputType = "text" | "pdf";

export default function RAGQAPage() {
  const [inputType, setInputType] = useState<InputType>("text");
  const [inputText, setInputText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle PDF upload and extract text
  const handleFileUpload = async (file: File | null) => {
    setPdfFile(file);
    setInputText(""); // Clear text input if PDF is uploaded
    if (file) {
      const formData = new FormData();
      formData.append("pdf", file);
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/upload-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.content) {
          setInputText(data.content);
        } else {
          setError(data.error || "Failed to extract text from PDF.");
        }
      } catch {
        setError("Failed to upload PDF.");
      }
      setLoading(false);
    }
  };

  // Handle RAG QA
  const handleAsk = async () => {
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await fetch("http://localhost:5000/rag-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: inputText,
          query,
        }),
      });
      const data = await res.json();
      if (data.answer) setAnswer(data.answer);
      else setError(data.error || "No answer found.");
    } catch {
      setError("Server error.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-violet-50 via-blue-50 to-yellow-100 pb-16">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden py-16 md:py-20">
        {/* Decorative Floating Shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/30 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-[40%] right-1/3 w-40 h-40 bg-pink-400/20 blur-2xl rounded-full pointer-events-none -z-10 animate-pulse" />

        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="rounded-full p-5 bg-white/20 shadow-md animate-fade-in">
              <FileText className="h-10 w-10 text-blue-600 drop-shadow" />
            </div>
            <div className="rounded-full p-5 bg-white/20 shadow-md animate-fade-in">
              <Sparkles className="h-10 w-10 text-yellow-500 drop-shadow" />
            </div>
            <div className="rounded-full p-5 bg-white/20 shadow-md animate-fade-in">
              <HelpCircle className="h-10 w-10 text-violet-600 drop-shadow" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-7 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-violet-600 to-yellow-500 drop-shadow-lg leading-tight">
            RAG-Powered Q&A
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-7">
            <span className="font-semibold text-violet-700">
              Ask any question about your research, paper, or notes
            </span>
            <br />
            Our AI dives deep into your uploaded PDF or text to generate clear
            answers fast!
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 mx-auto max-w-3xl mt-8">
        <div className="mb-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-blue-700 font-semibold hover:bg-blue-100 transition"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
        <div className="border-2 border-yellow-300 bg-white/80 rounded-xl shadow-xl backdrop-blur-lg transition-all hover:shadow-2xl mb-10">
          <div className="p-6 space-y-6">
            {/* Input Mode Toggle */}
            <div className="flex gap-4 mb-2">
              <Button
                variant={inputType === "pdf" ? "default" : "outline"}
                onClick={() => setInputType("pdf")}
                className={`font-semibold ${
                  inputType === "pdf"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "text-violet-700 border-violet-600"
                }`}
              >
                <Upload className="mr-2 h-5 w-5" />
                PDF Upload
              </Button>
              <Button
                variant={inputType === "text" ? "default" : "outline"}
                onClick={() => setInputType("text")}
                className={`font-semibold ${
                  inputType === "text"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-blue-700 border-blue-600"
                }`}
              >
                <FileText className="mr-2 h-5 w-5" />
                Text Input
              </Button>
            </div>
            {/* Input Section */}
            <div className="transition-all duration-400 mb-3">
              {inputType === "pdf" ? (
                <FileUploader onFileUpload={handleFileUpload} />
              ) : (
                <div>
                  <label
                    htmlFor="textInput"
                    className="font-medium text-blue-700 block mb-1"
                  >
                    Paste your document text
                  </label>
                  <Textarea
                    id="textInput"
                    className="w-full border border-yellow-300 rounded-lg p-3 focus:ring-2 focus:ring-violet-400 bg-blue-50 text-gray-800 shadow min-h-[140px]"
                    rows={8}
                    placeholder="Paste your research paper or content here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Pro tip: The more content you provide, the richer the
                    answers!
                  </div>
                </div>
              )}
            </div>
            {/* Query Section */}
            <div>
              <label
                htmlFor="queryInput"
                className="font-medium text-violet-700 block mb-1"
              >
                Your Question
              </label>
              <input
                id="queryInput"
                className="w-full border border-yellow-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 bg-yellow-50 shadow"
                placeholder="Type your question about the document..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            {/* Ask Button */}
            <Button
              onClick={handleAsk}
              disabled={loading || !inputText.trim() || !query.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-yellow-400 hover:from-violet-700 hover:to-yellow-500 text-white text-md px-6 py-3 rounded-xl shadow font-semibold mt-2"
            >
              {loading ? (
                <span className="animate-spin">⏳ Asking...</span>
              ) : (
                <>Ask</>
              )}
            </Button>
            {error && (
              <div className="text-red-600 font-semibold mt-2 text-center">
                {error}
              </div>
            )}
            {answer && (
              <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-lg">
                <strong className="text-violet-700 text-lg mb-2 block">
                  Answer:
                </strong>
                <div className="mt-2 whitespace-pre-line text-gray-800 font-medium">
                  {answer}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
