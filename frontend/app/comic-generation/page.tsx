"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileAudio,
  FileText,
  Download,
  Upload,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/file-uploader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type InputType = "text" | "pdf";

export default function ComicGeneration() {
  const { toast } = useToast();
  const [inputType, setInputType] = useState<InputType>("text");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comicImage, setComicImage] = useState<string | null>(null);

  const handleInputTypeChange = (value: InputType) => {
    setInputType(value);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleFileUpload = (file: File | null) => {
    setPdfFile(file);
  };

  const handleGenerateComic = async () => {
    if (inputType === "text" && !content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content to generate a comic.",
        variant: "destructive",
      });
      return;
    }

    if (inputType === "pdf" && !pdfFile) {
      toast({
        title: "Error",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      if (inputType === "pdf" && pdfFile) {
        formData.append("pdf", pdfFile);
      } else {
        formData.append("content", content);
      }

      const response = await fetch("http://127.0.0.1:5000/generate-comic", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate comic";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = (await response.text()) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setComicImage(url);

      toast({
        title: "Comic Generated Successfully!",
        description: "Scroll down to view your comic.",
      });
    } catch (error) {
      console.error("Error generating comic:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-blue-100 pb-16">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300/30 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/30 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="rounded-full p-4 bg-white/10 shadow-lg animate-fade-in">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <div className="rounded-full p-4 bg-white/10 shadow-lg animate-fade-in">
              <FileAudio className="h-10 w-10 text-purple-500" />
            </div>
            <div className="rounded-full p-4 bg-white/10 shadow-lg animate-fade-in">
              <Sparkles className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-700 to-pink-500 drop-shadow-lg leading-tight">
            Comic & Story Generation
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Use <span className="font-semibold text-purple-600">AI</span> to
            transform your notes, papers, or imagination into delightful comics!{" "}
            <br />
            <span className="block mt-2 text-blue-700">
              Upload a PDF or enter text. Let ResearchHive do the rest.
            </span>
          </p>
        </div>
      </div>

      {/* MAIN CARD SECTION */}
      <div className="container px-4 md:px-6 mx-auto max-w-3xl mt-8">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" className="text-blue-700 hover:bg-blue-100">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <Card className="border-2 border-blue-200 bg-white/80 shadow-xl backdrop-blur-lg transition-all hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              Get Started
            </CardTitle>
            <CardDescription>
              Choose your input and provide content for comic conversion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={inputType}
              onValueChange={handleInputTypeChange as (value: string) => void}
              className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label
                  htmlFor="pdf"
                  className="flex items-center gap-1.5 cursor-pointer text-blue-600"
                >
                  <Upload className="h-4 w-4" />
                  PDF Upload
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label
                  htmlFor="text"
                  className="flex items-center gap-1.5 cursor-pointer text-purple-600"
                >
                  <FileText className="h-4 w-4" />
                  Text Input
                </Label>
              </div>
            </RadioGroup>

            <div className="transition-all duration-300">
              {inputType === "pdf" ? (
                <FileUploader onFileUpload={handleFileUpload} />
              ) : (
                <div className="space-y-2">
                  <Label
                    htmlFor="textInput"
                    className="font-medium text-blue-600"
                  >
                    Enter your text
                  </Label>
                  <Textarea
                    id="textInput"
                    placeholder="Describe your story, concept, or research to inspire a comic."
                    className="min-h-[200px] resize-y bg-blue-50 border-blue-200 rounded-xl text-gray-800"
                    value={content}
                    onChange={handleTextInputChange}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Pro tip: Provide rich detail for best comic results!
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white text-lg py-3 mt-2 transition-all rounded-xl shadow-lg flex items-center justify-center"
              onClick={handleGenerateComic}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Comic...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Comic
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {comicImage && (
          <Card className="mt-10 border-2 border-purple-200 bg-white/90 shadow-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-purple-700 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Your Generated Comic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={comicImage}
                alt="Generated Comic"
                className="w-full rounded-xl border-2 border-purple-200 shadow-lg"
              />
              <div className="mt-6 flex justify-center">
                <a href={comicImage} download="comic.png">
                  <Button
                    variant="outline"
                    className="text-purple-600 border-purple-400 hover:bg-purple-50 flex items-center gap-2"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Download Comic
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
