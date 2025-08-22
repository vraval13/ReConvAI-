"use client";
import Link from "next/link";
import { useState } from "react";
import { InputSection } from "./input-section";
import { OptionsSection } from "./options-section";
import { ResultsSection } from "./results-section";
import { Button } from "./ui/button";
import {
  Loader2,
  LogOut,
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Types
export type InputType = "pdf" | "text";
export type SummaryLevel = "beginner" | "student" | "expert";
export type PodcastTone = "formal" | "balanced" | "creative";
export type PodcastLength = "short" | "medium" | "long";
export type PowerPointTemplate = "template1" | "template2" | "template3";
export type VideoStyle = "modern" | "classic" | "dramatic";
export type VideoResolution = "480p" | "720p" | "1080p";

export interface FormData {
  inputType: InputType;
  pdfFile: File | null;
  textInput: string;
  summaryLevel: SummaryLevel;
  podcastTone: PodcastTone;
  podcastLength: PodcastLength;
  powerpointTemplate: PowerPointTemplate;
  videoStyle: VideoStyle;
  videoResolution: VideoResolution;
}

export interface GeneratedContent {
  summary: string[];
  podcastScript: string;
  podcastAudioUrl: string;
  powerpointUrl: string;
  videoUrl?: string;
}

export function MainConverter() {
  const { logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    router.push("/landing");
  };

  // State
  const [formData, setFormData] = useState<FormData>({
    inputType: "text",
    pdfFile: null,
    textInput: "",
    summaryLevel: "student",
    podcastTone: "balanced",
    podcastLength: "medium",
    powerpointTemplate: "template1",
    videoStyle: "modern",
    videoResolution: "720p",
  });

  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------
  // 🚀 Download Handlers
  // ---------------------------
  const handleDownloadVideo = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_text: generatedContent?.summary.join("\n"),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "summary_video.mp4";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading video:", error);
      toast({
        title: "Error downloading video",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAudio = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcast_script: generatedContent?.podcastScript,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "podcast-audio.wav";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        title: "Error downloading audio",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPowerPoint = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_text: generatedContent?.summary.join("\n"),
          template_name:
            formData.powerpointTemplate === "template1"
              ? "Template 1"
              : formData.powerpointTemplate === "template2"
              ? "Template 2"
              : "Template 3",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate PowerPoint");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "presentation.pptx";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PowerPoint:", error);
      toast({
        title: "Error downloading PowerPoint",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------
  // 🚀 Handle Submit
  // ---------------------------
  const handleSubmit = async () => {
    if (formData.inputType === "pdf" && !formData.pdfFile) {
      toast({
        title: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (formData.inputType === "text" && !formData.textInput.trim()) {
      toast({
        title: "Please enter some text",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const summaryLevelMap = {
        beginner: "Beginner",
        student: "Student",
        expert: "Expert",
      };

      let inputText = formData.textInput;

      if (formData.inputType === "pdf" && formData.pdfFile) {
        const formDataObj = new FormData();
        formDataObj.append("pdf", formData.pdfFile);

        const uploadResponse = await fetch("http://127.0.0.1:5000/upload-pdf", {
          method: "POST",
          body: formDataObj,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload PDF");
        }

        const uploadData = await uploadResponse.json();
        inputText = uploadData.content;
      }

      // Generate summary
      const summaryResponse = await fetch(
        "http://127.0.0.1:5000/generate-summary",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            summary_level: summaryLevelMap[formData.summaryLevel],
          }),
          mode: "cors",
        }
      );

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const { summary, summary_text } = await summaryResponse.json();

      // Generate podcast script
      const podcastResponse = await fetch(
        "http://127.0.0.1:5000/generate-podcast",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary_text: summary_text,
            creativity_level: formData.podcastTone,
            podcast_length: formData.podcastLength,
          }),
          mode: "cors",
        }
      );

      if (!podcastResponse.ok) {
        const errorData = await podcastResponse.json();
        throw new Error(errorData.error || "Failed to generate podcast");
      }

      const { podcast_script: podcastScript } = await podcastResponse.json();

      const templateNameMap = {
        template1: "Template 1",
        template2: "Template 2",
        template3: "Template 3",
      };

      // Generate ppt
      const pptResponse = await fetch("http://127.0.0.1:5000/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_text: summary_text,
          template_name: templateNameMap[formData.powerpointTemplate],
        }),
        mode: "cors",
      });

      if (!pptResponse.ok) {
        const errorData = await pptResponse.json();
        throw new Error(errorData.error || "Failed to generate PowerPoint");
      }

      const blob = await pptResponse.blob();
      const powerpointUrl = URL.createObjectURL(blob);

      // Generate audio
      const audioResponse = await fetch(
        "http://127.0.0.1:5000/generate-audio",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            podcast_script: podcastScript,
          }),
          mode: "cors",
        }
      );

      if (!audioResponse.ok) {
        const errorData = await audioResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const audioBlob = await audioResponse.blob();
      const podcastAudioUrl = URL.createObjectURL(audioBlob);

      // Generate video (optional)
      let videoUrl: string | undefined = undefined;
      try {
        const videoResponse = await fetch(
          "http://127.0.0.1:5000/generate-video",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              summary_text: summary_text,
              video_style: formData.videoStyle,
              resolution: formData.videoResolution,
            }),
          }
        );
        if (videoResponse.ok) {
          const videoBlob = await videoResponse.blob();
          videoUrl = URL.createObjectURL(videoBlob);
        } else {
          console.warn("Video generation failed");
        }
      } catch (e) {
        console.warn("Video generation failed", e);
      }

      setGeneratedContent({
        summary,
        podcastScript,
        podcastAudioUrl,
        powerpointUrl,
        videoUrl,
      });

      toast({
        title: "Content generated successfully!",
        description: "Scroll down to view your generated content.",
      });
    } catch (error) {
      toast({
        title: "Error generating content",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error("Error generating content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------
  // 🚀 UI Rendering
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 px-6 py-10 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 tracking-tight">
          ResearchHive Converter 🐝
        </h1>
        <Button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </header>

      {/* Quick Links */}
      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link href={"/comic-generation"} passHref>
          <Button className="w-full h-20 flex items-center justify-center gap-2 text-lg shadow hover:shadow-lg">
            <Sparkles className="h-5 w-5" /> Comic Generation
          </Button>
        </Link>
        <Link href="/mcq-generation" passHref>
          <Button className="w-full h-20 flex items-center justify-center gap-2 text-lg shadow hover:shadow-lg">
            <HelpCircle className="h-5 w-5" /> MCQ Generator
          </Button>
        </Link>
        <Link href="/rag-qa" passHref>
          <Button className="w-full h-20 flex items-center justify-center gap-2 text-lg shadow hover:shadow-lg">
            <BookOpen className="h-5 w-5" /> RAG Q&A
          </Button>
        </Link>
      </section>

      {/* Input Section */}
      <section className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-500" /> Input Your Research
        </h2>
        <InputSection formData={formData} setFormData={setFormData} />
      </section>

      {/* Options Section */}
      <section className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" /> Customize Your Output
        </h2>
        <OptionsSection formData={formData} setFormData={setFormData} />
      </section>

      {/* Generate Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={handleSubmit}
          className="px-10 py-6 text-lg rounded-xl bg-blue-700 hover:bg-blue-800 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Content...
            </>
          ) : (
            "Generate Content"
          )}
        </Button>
      </div>

      {/* Results */}
      {generatedContent && (
        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">
            Your Results 🎉
          </h2>
          <ResultsSection
            generatedContent={generatedContent}
            onDownloadAudio={handleDownloadAudio}
            onDownloadPowerPoint={handleDownloadPowerPoint}
            onDownloadVideo={handleDownloadVideo}
          />
        </section>
      )}
    </div>
  );
}
