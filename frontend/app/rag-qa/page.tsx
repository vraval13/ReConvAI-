"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/file-uploader";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

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
    <div className="w-full">
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            RAG-powered Q&A
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Ask questions about your research paper using Retrieval-Augmented
            Generation (RAG). Upload a PDF or enter text, then type your
            question below.
          </p>
        </div>
      </div>
      <div className="container px-4 md:px-6 mx-auto max-w-2xl mt-8">
        <div className="mb-4">
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <div className="p-4 border rounded space-y-6">
          <div className="flex gap-4 mb-2">
            <Button
              variant={inputType === "pdf" ? "default" : "outline"}
              onClick={() => setInputType("pdf")}
            >
              PDF Upload
            </Button>
            <Button
              variant={inputType === "text" ? "default" : "outline"}
              onClick={() => setInputType("text")}
            >
              Text Input
            </Button>
          </div>
          {inputType === "pdf" ? (
            <FileUploader onFileUpload={handleFileUpload} />
          ) : (
            <div className="space-y-2">
              <label htmlFor="textInput">Paste your document text</label>
              <Textarea
                id="textInput"
                className="w-full"
                rows={8}
                placeholder="Paste your research paper or content here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="queryInput">Your Question</label>
            <input
              id="queryInput"
              className="w-full border p-2"
              placeholder="Type your question about the document..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleAsk}
            disabled={loading || !inputText.trim() || !query.trim()}
            className="w-full"
          >
            {loading ? "Asking..." : "Ask"}
          </Button>
          {error && <div className="text-red-500">{error}</div>}
          {answer && (
            <div className="mt-6 p-4 bg-gray-50 border rounded">
              <strong>Answer:</strong>
              <div className="mt-2 whitespace-pre-line">{answer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
