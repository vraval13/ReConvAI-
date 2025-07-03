"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileAudio, FileText, Upload } from "lucide-react";
import { FileUploader } from "@/components/file-uploader";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type InputType = "text" | "pdf";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export default function MCQGenerator() {
  const [inputType, setInputType] = useState<InputType>("text");
  const [inputText, setInputText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleInputTypeChange = (value: InputType) => setInputType(value);
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInputText(e.target.value);
  const handleFileUpload = (file: File | null) => setPdfFile(file);

  const handleOptionSelect = (qIdx: number, option: string) => {
    const updated = [...userAnswers];
    updated[qIdx] = option;
    setUserAnswers(updated);
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setMcqs([]);
    setUserAnswers([]);
    setShowResults(false);
    let content = inputText;

    // If PDF, upload and extract text first
    if (inputType === "pdf" && pdfFile) {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      try {
        const res = await fetch("http://localhost:5000/upload-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.content) {
          content = data.content;
        } else {
          setError(data.error || "Failed to extract text from PDF.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Failed to upload PDF.");
        setLoading(false);
        return;
      }
    }

    // Now generate MCQs from the extracted or input text
    try {
      const res = await fetch("http://localhost:5000/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          num_questions: numQuestions,
        }),
      });
      const data = await res.json();
      if (data.mcqs) {
        setMcqs(data.mcqs);
        setUserAnswers(new Array(data.mcqs.length).fill(null));
        setShowResults(false);
      } else setError(data.error || "Failed to generate MCQs.");
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
            Transform your content into meaningful MCQs with the power of AI.
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
          <RadioGroup
            value={inputType}
            onValueChange={handleInputTypeChange as (value: string) => void}
            className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label
                htmlFor="pdf"
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                PDF Upload
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label
                htmlFor="text"
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Text Input
              </Label>
            </div>
          </RadioGroup>
          <div className="transition-all duration-300 mb-4">
            {inputType === "pdf" ? (
              <FileUploader onFileUpload={handleFileUpload} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="textInput">Enter your text</Label>
                <textarea
                  id="textInput"
                  className="w-full border p-2"
                  rows={6}
                  placeholder="Paste your content here..."
                  value={inputText}
                  onChange={handleTextInputChange}
                />
              </div>
            )}
          </div>
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
              disabled={
                loading ||
                (inputType === "text" && !inputText.trim()) ||
                (inputType === "pdf" && !pdfFile)
              }
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
      {mcqs.length > 0 && (
        <div className="space-y-4">
          {mcqs.map((mcq: MCQ, idx: number) => (
            <div key={idx} className="p-3 border rounded bg-gray-50">
              <div className="font-medium">{`Q${idx + 1}: ${
                mcq.question
              }`}</div>
              <ul className="list-none pl-0">
                {mcq.options.map((opt: string, i: number) => {
                  const optionLetter = String.fromCharCode(65 + i);
                  const selected = userAnswers[idx] === optionLetter;
                  const isCorrect = mcq.answer === optionLetter;
                  let optionStyle = "cursor-pointer px-2 py-1 rounded";
                  if (showResults) {
                    if (selected && isCorrect) optionStyle += " bg-green-200";
                    else if (selected && !isCorrect)
                      optionStyle += " bg-red-200";
                    else if (isCorrect) optionStyle += " bg-green-100";
                  } else if (selected) {
                    optionStyle += " bg-blue-100";
                  }
                  return (
                    <li
                      key={i}
                      className={optionStyle}
                      onClick={() =>
                        !showResults && handleOptionSelect(idx, optionLetter)
                      }
                    >
                      <input
                        type="radio"
                        name={`mcq-${idx}`}
                        value={optionLetter}
                        checked={userAnswers[idx] === optionLetter}
                        onChange={() => handleOptionSelect(idx, optionLetter)}
                        disabled={showResults}
                        className="mr-2"
                      />
                      <span className="font-semibold">{optionLetter})</span>{" "}
                      {opt}
                    </li>
                  );
                })}
              </ul>
              {showResults && (
                <div className="mt-2">
                  {userAnswers[idx] === mcq.answer ? (
                    <span className="text-green-600 font-semibold">
                      Correct!
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Incorrect. Correct answer: {mcq.answer}
                    </span>
                  )}
                  <div className="text-gray-700 text-sm mt-1">
                    Explanation: {mcq.explanation}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!showResults && (
            <Button
              onClick={handleCheckAnswers}
              disabled={userAnswers.some((ans) => ans === null)}
            >
              Check Answers
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
