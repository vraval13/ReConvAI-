"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileAudio, FileText, Upload } from "lucide-react";
import { Download } from "lucide-react";
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
        // Don't set Content-Type header - let the browser set it automatically
      });

      if (!response.ok) {
        // Try to get error message from response
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
    <div className="w-full">
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FileText className="h-10 w-10" />
            <FileAudio className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            Comic/Story Generation
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Transform your content into comics with the power of AI. Upload a
            PDF or enter text, and let our AI do the rest.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 mx-auto max-w-5xl mt-8">
        <div className="mb-4">
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>

        <Card className="border-2 border-border/50 shadow-md transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Selection
            </CardTitle>
            <CardDescription>
              Choose your input method and provide the content you want to
              convert to a comic
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

            <div className="transition-all duration-300">
              {inputType === "pdf" ? (
                <FileUploader onFileUpload={handleFileUpload} />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="textInput">Enter your text</Label>
                  <Textarea
                    id="textInput"
                    placeholder="Enter the text you want to convert to a comic here. For best results, provide detailed and well-structured content."
                    className="min-h-[200px] resize-y"
                    value={content}
                    onChange={handleTextInputChange}
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full md:w-auto"
              onClick={handleGenerateComic}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Comic...
                </>
              ) : (
                "Generate Comic"
              )}
            </Button>
          </CardContent>
        </Card>

        {comicImage && (
          <Card className="mt-8 border-2 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Generated Comic</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={comicImage}
                alt="Generated Comic"
                className="w-full rounded-lg border"
              />
              <div className="mt-4 flex justify-center">
                <a href={comicImage} download="comic.png">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
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
