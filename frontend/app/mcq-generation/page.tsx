"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileAudio, FileText } from "lucide-react";
import { FileUploader } from "@/components/file-uploader";
import Link from "next/link";
export default function MCQGenerator() {
  const [inputText, setInputText] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setMcqs([]);
    try {
      const res = await fetch("http://localhost:5000/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          num_questions: numQuestions,
        }),
      });
      const data = await res.json();
      if (data.mcqs) setMcqs(data.mcqs);
      else setError(data.error || "Failed to generate MCQs.");
    } catch (e) {
      setError("Server error.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FileText className="h-10 w-10" />
            <FileAudio className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            MCQ Generation
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Transform your content into meaninful MCQs with the power of AI.
            Upload a PDF or enter text, and let our AI do the rest.
          </p>
        </div>
      </div>
      <div className="container px-4 md:px-6 mx-auto max-w-5xl mt-8">
        <div className="mb-4">
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <div className="max-w-2xl mx-auto my-8 p-4 border rounded">
          <h2 className="text-xl font-bold mb-4">MCQ Generator</h2>
          <textarea
            className="w-full border p-2 mb-2"
            rows={6}
            placeholder="Paste your content here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex items-center gap-2 mb-4">
            <label>Number of Questions:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-16 border p-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? "Generating..." : "Generate MCQs"}
            </Button>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {mcqs.length > 0 && (
            <div className="space-y-4">
              {mcqs.map((mcq, idx) => (
                <div key={idx} className="p-3 border rounded bg-gray-50">
                  <div className="font-medium">{`Q${idx + 1}: ${
                    mcq.question
                  }`}</div>
                  <ul className="list-disc pl-6">
                    {mcq.options.map((opt: string, i: number) => (
                      <li key={i}>
                        <span className="font-semibold">
                          {String.fromCharCode(65 + i)})
                        </span>{" "}
                        {opt}
                      </li>
                    ))}
                  </ul>
                  <div className="text-green-600 mt-1">
                    Answer: {mcq.answer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
