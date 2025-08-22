"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileAudio,
  FileText,
  Upload,
  Sparkles,
  HelpCircle,
} from "lucide-react";
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
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleInputTypeChange = (value: InputType) => setInputType(value);
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInputText(e.target.value);
  const handleFileUpload = (file: File | null) => setPdfFile(file);

  const handleOptionSelect = (qIdx: number, option: string) => {
    if (showResults) return;
    const updated = [...userAnswers];
    updated[qIdx] = option;
    setUserAnswers(updated);
  };

  const handleCheckAnswers = () => setShowResults(true);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setMcqs([]);
    setUserAnswers([]);
    setShowResults(false);
    let content = inputText;

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

    try {
      const res = await fetch("http://localhost:5000/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, num_questions: numQuestions }),
      });
      const data = await res.json();
      if (data.mcqs) {
        setMcqs(data.mcqs);
        setUserAnswers(new Array(data.mcqs.length).fill(null));
        setShowResults(false);
      } else {
        setError(data.error || "Failed to generate MCQs.");
      }
    } catch {
      setError("Server error.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-violet-50 via-blue-50 to-yellow-100 pb-16">
      {/* Header Section */}
      <div className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/30 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-[40%] right-1/3 w-40 h-40 bg-pink-400/20 blur-2xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="container max-w-4xl mx-auto px-4 md:px-6 text-center">
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
            MCQ Generation
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-7">
            <span className="font-semibold text-violet-700">
              Create custom quizzes
            </span>{" "}
            from your notes, articles, or learning material! <br />
            <span className="block mt-2 text-blue-700">
              Upload a PDF or enter text. ResearchHive AI makes learning
              engaging.
            </span>
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

        {/* Input Card Section */}
        <div className="border-2 border-yellow-300 bg-white/80 rounded-xl shadow-xl backdrop-blur-lg transition-all hover:shadow-2xl mb-10">
          <div className="p-6">
            <div className="flex items-center gap-2 text-violet-700 text-2xl font-semibold mb-2">
              <Sparkles className="h-5 w-5" />
              Get Started
            </div>
            <div className="text-gray-600 mb-3">
              Choose your input and set your quiz preferences.
            </div>
            <RadioGroup
              value={inputType}
              onValueChange={handleInputTypeChange as (value: string) => void}
              className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-7 mb-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label
                  htmlFor="pdf"
                  className="flex items-center gap-2 cursor-pointer text-blue-700 font-semibold"
                >
                  <Upload className="h-4 w-4" />
                  PDF Upload
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label
                  htmlFor="text"
                  className="flex items-center gap-2 cursor-pointer text-violet-700 font-semibold"
                >
                  <FileText className="h-4 w-4" />
                  Text Input
                </Label>
              </div>
            </RadioGroup>
            <div className="transition-all duration-400 mb-6">
              {inputType === "pdf" ? (
                <FileUploader onFileUpload={handleFileUpload} />
              ) : (
                <div>
                  <Label
                    htmlFor="textInput"
                    className="font-medium text-blue-700"
                  >
                    Enter your text
                  </Label>
                  <textarea
                    id="textInput"
                    className="w-full border border-yellow-300 rounded-lg p-3 focus:ring-2 focus:ring-violet-400 bg-blue-50 text-gray-800 shadow min-h-[140px] mt-1"
                    placeholder="Paste or write your study notes, article, or material."
                    value={inputText}
                    onChange={handleTextInputChange}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    More content = more quiz possibilities!
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 mb-2">
              <Label
                htmlFor="numQuestions"
                className="font-medium text-blue-700"
              >
                Number of Questions:
              </Label>
              <input
                type="number"
                id="numQuestions"
                min={1}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-20 text-center border border-yellow-300 rounded-md p-2 focus:ring-2 focus:ring-violet-400"
              />
              <Button
                onClick={handleGenerate}
                disabled={
                  loading ||
                  (inputType === "text" && !inputText.trim()) ||
                  (inputType === "pdf" && !pdfFile)
                }
                className="bg-gradient-to-r from-violet-600 to-yellow-400 hover:from-violet-700 hover:to-yellow-500 text-white text-md px-6 py-2 rounded-xl shadow font-semibold"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>Generate MCQs</>
                )}
              </Button>
            </div>
            {error && (
              <div className="text-red-600 font-semibold mb-2 text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* MCQ Results Section */}
        {mcqs.length > 0 && (
          <div className="space-y-8">
            {mcqs.map((mcq: MCQ, idx: number) => {
              const userAnswer = userAnswers[idx];
              const isCorrect = userAnswer === mcq.answer;
              return (
                <div
                  key={idx}
                  className="bg-yellow-50 p-5 rounded-xl shadow-lg border-2 border-yellow-200"
                >
                  <div className="font-bold text-lg mb-3 text-violet-700">
                    {`Q${idx + 1}: ${mcq.question}`}
                  </div>
                  <div className="space-y-3">
                    {mcq.options.map((option: string, i: number) => {
                      const optionLetter = String.fromCharCode(65 + i);
                      const selected = userAnswer === optionLetter;
                      let optionStyles =
                        "cursor-pointer flex items-center gap-4 rounded-lg border px-4 py-2 select-none transition";
                      if (showResults) {
                        if (selected && isCorrect) {
                          optionStyles +=
                            " bg-green-200 border-green-500 text-green-900";
                        } else if (selected && !isCorrect) {
                          optionStyles +=
                            " bg-red-200 border-red-500 text-red-900";
                        } else if (optionLetter === mcq.answer) {
                          optionStyles +=
                            " bg-green-100 border-green-300 text-green-800";
                        } else {
                          optionStyles += " bg-white border-gray-300";
                        }
                      } else if (selected) {
                        optionStyles += " bg-violet-100 border-violet-400";
                      } else {
                        optionStyles +=
                          " bg-white border-gray-300 hover:bg-yellow-50";
                      }
                      return (
                        <label
                          htmlFor={`mcq-${idx}-${optionLetter}`}
                          key={i}
                          className={optionStyles}
                          onClick={() =>
                            !showResults &&
                            handleOptionSelect(idx, optionLetter)
                          }
                        >
                          <input
                            type="radio"
                            name={`mcq-${idx}`}
                            id={`mcq-${idx}-${optionLetter}`}
                            value={optionLetter}
                            checked={selected}
                            onChange={() =>
                              handleOptionSelect(idx, optionLetter)
                            }
                            disabled={showResults}
                            className="pointer-events-none"
                          />
                          <span className="font-semibold">{optionLetter})</span>
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  {showResults && (
                    <div className="mt-4 p-4 bg-white rounded-md border border-yellow-300 text-violet-900 shadow select-text">
                      {isCorrect ? (
                        <div className="font-semibold text-green-700 flex items-center gap-2">
                          ✓ Correct!
                        </div>
                      ) : (
                        <div className="font-semibold text-red-700 flex items-center gap-2">
                          ✗ Incorrect. Correct Answer: {mcq.answer}
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Explanation:</strong> {mcq.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!showResults && (
              <div className="text-center">
                <Button
                  onClick={handleCheckAnswers}
                  disabled={userAnswers.some((ans) => ans === null)}
                  className="px-8 py-3 bg-gradient-to-r from-violet-600 to-yellow-400 hover:from-violet-700 hover:to-yellow-500 text-white text-md rounded-xl shadow font-semibold mt-6"
                >
                  Check Answers
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
