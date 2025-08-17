"use client";
import Link from "next/link";
import { useState } from "react";
import { InputSection } from "./input-section";
import { OptionsSection } from "./options-section";
import { ResultsSection } from "./results-section";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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
  videoUrl?: string; // Optional field for video URL
}

export function MainConverter() {
  const { toast } = useToast();
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

  const router = useRouter();
  // Add these functions inside the MainConverter component

  // ...existing code...
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

      // Create a link element to trigger the download
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
  // ...existing code...
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
        const errorText = await response.text(); // Use text() to read error messages
        throw new Error(errorText || "Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create a link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = "podcast-audio.wav";
      link.click();

      // Clean up the URL object
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
        const errorText = await response.text(); // Use text() to read error messages
        throw new Error(errorText || "Failed to generate PowerPoint");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create a link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = "presentation.pptx";
      link.click();

      // Clean up the URL object
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

  const handleSubmit = async () => {
    // Validate form data
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
      // Map summaryLevel to match backend expectations
      const summaryLevelMap = {
        beginner: "Beginner",
        student: "Student",
        expert: "Expert",
      };

      // Step 1: Get the input text (either from PDF or text input)
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
        inputText = uploadData.content; // Use 'content' as returned by the backend
      }

      // Step 2: Generate summary
      const summaryResponse = await fetch(
        "http://127.0.0.1:5000/generate-summary",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText, // Match the backend's expected key
            summary_level: summaryLevelMap[formData.summaryLevel], // Map to correct case
          }),
          mode: "cors",
        }
      );

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const { summary, summary_text } = await summaryResponse.json();

      const creativityLevelMap = {
        formal: "Formal",
        balanced: "Balanced",
        creative: "Creative",
      };

      const podcastLengthMap = {
        short: "Short (2-3 mins)",
        medium: "Medium (5-7 mins)",
        long: "Long (10+ mins)",
      };
      // Step 3: Generate podcast script
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
        console.error("Backend error details:", errorData);
        throw new Error(errorData.error || "Failed to generate podcast");
      }

      const { podcast_script: podcastScript } = await podcastResponse.json();

      const templateNameMap = {
        template1: "Template 1",
        template2: "Template 2",
        template3: "Template 3",
      };

      // Step 4: Generate PowerPoint
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
        console.error("Backend error details:", errorData);
        throw new Error(errorData.error || "Failed to generate PowerPoint");
      }

      // const { pptx_file: powerpointUrl } = await pptResponse.json();
      const blob = await pptResponse.blob();
      const powerpointUrl = URL.createObjectURL(blob);
      // Step 5: Generate podcast audio
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
        console.error("Audio generation error:", errorData);
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const audioBlob = await audioResponse.blob();
      const podcastAudioUrl = URL.createObjectURL(audioBlob);

      // const { audio_url: podcastAudioUrl } = await audioResponse.json();
      // Step 6: Generate video (optional)
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
          console.warn("Video generation failed: Server returned an error");
          const errorData = await videoResponse.json().catch(() => ({}));
          console.error("Video error details:", errorData);
        }
      } catch (e) {
        console.warn("Video generation failed", e);
      }
      // Update state with all generated content
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
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href={"/comic-generation"}
          className="text-blue-500 hover:underline"
          passHref
        >
          <Button className="w-full md:w-auto px-8 py-6 text-lg transition-all">
            Try Comic Generation!
          </Button>
        </Link>
      </div>
      <div>
        <Link
          href="mcq-generation"
          className="text-blue-500 hover:underline"
          passHref
        >
          <Button className="w-full md:w-auto px-8 py-6 text-lg transition-all">
            Try MCQ Generation!
          </Button>
        </Link>
      </div>
      <div>
        <Link
          href="rag-qa"
          className="text-blue-500 hover:underline"
          passHref
        >
          <Button className="w-full md:w-auto px-8 py-6 text-lg transition-all">
            Try RAG Q&A!
          </Button>
        </Link>
      </div>
      <InputSection formData={formData} setFormData={setFormData} />
      <OptionsSection formData={formData} setFormData={setFormData} />

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          className="w-full md:w-auto px-8 py-6 text-lg transition-all"
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

      {generatedContent && (
        <ResultsSection
          generatedContent={generatedContent}
          onDownloadAudio={handleDownloadAudio}
          onDownloadPowerPoint={handleDownloadPowerPoint}
          onDownloadVideo={handleDownloadVideo}
        />
      )}
    </div>
  );
}
