"use client";

import { useState } from "react";
import { GeneratedContent } from "./main-converter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  BookOpen,
  Download,
  FileAudio,
  Presentation as FilePresentation,
  Pause,
  Play,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";
import { SpeakerAvatar } from "./speaker-avatar";
import { cn } from "@/lib/utils";

interface ResultsSectionProps {
  generatedContent: GeneratedContent;
  onDownloadAudio: () => void;
  onDownloadPowerPoint: () => void;
  onDownloadVideo: () => void;
}
export function ResultsSection({
  generatedContent,
  onDownloadAudio,
  onDownloadPowerPoint,
  onDownloadVideo,
}: ResultsSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real application, this would control the audio playback
  };

  // Transform podcast script to identify speakers
  const podcastLines = generatedContent.podcastScript
    .split("\n\n")
    .map((line) => {
      const speakerMatch = line.match(/^(.*?)\s*\((.*?)\):/);
      if (speakerMatch) {
        return {
          speaker: speakerMatch[2],
          text: line.substring(line.indexOf(":") + 1).trim(),
        };
      }
      return { speaker: "", text: line };
    });

  return (
    <div className="mt-12 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center">Generated Content</h2>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="podcast" className="flex items-center gap-1.5">
            <FileAudio className="h-4 w-4" />
            Podcast
          </TabsTrigger>
          <TabsTrigger value="powerpoint" className="flex items-center gap-1.5">
            <FilePresentation className="h-4 w-4" />
            PowerPoint
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-1.5">
            <Play className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Section-wise Summary
              </CardTitle>
              <CardDescription>
                A comprehensive summary of your content divided into sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedContent.summary.map((section, index) => {
                // Extract the section name (text after "## ") or use "Section" as default
                const sectionName = section.startsWith("## ")
                  ? section.split("\n")[0].replace("## ", "")
                  : " ";

                // Extract bullet points (lines starting with "- ")
                const bulletPoints = section
                  .split("\n")
                  .filter((line) => line.startsWith("- "))
                  .map((bullet) => bullet.replace("- ", ""));

                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-lg text-muted-foreground mb-1">
                      {sectionName}
                    </p>
                    {bulletPoints.length > 0 && (
                      <ul className="list-disc pl-6">
                        {bulletPoints.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="text-sm">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="podcast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                Generated Podcast
              </CardTitle>
              <CardDescription>
                Listen to your content as a professionally narrated podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                      "h-12 w-12 rounded-full",
                      isPlaying &&
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  <div className="space-y-1">
                    <h3 className="font-medium">
                      AI-Driven Content Generation
                    </h3>
                    {/* <p className="text-xs text-muted-foreground">
                      05:23 • Medium length • Balanced tone
                    </p> */}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="flex gap-1 items-center md:self-center"
                  onClick={onDownloadAudio}
                >
                  <Download className="h-4 w-4" />
                  Download Audio
                </Button>
              </div>

              <div className="space-y-4 mt-4">
                {podcastLines.map((line, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg transition-all",
                      activeSection === index && isPlaying
                        ? "bg-secondary"
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => setActiveSection(index)}
                  >
                    {line.speaker && (
                      <div className="flex items-center gap-3 mb-2">
                        <SpeakerAvatar
                          name={line.speaker}
                          isActive={activeSection === index && isPlaying}
                        />
                        <span className="font-medium">{line.speaker}</span>
                      </div>
                    )}
                    <p className="pl-2 border-l-2 border-muted">{line.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="powerpoint">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePresentation className="h-5 w-5" />
                PowerPoint Presentation
              </CardTitle>
              <CardDescription>
                Download your content as a ready-to-use PowerPoint presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="aspect-video rounded-lg overflow-hidden border border-border">
                  <div className="bg-primary h-1/5 flex items-center justify-center">
                    <h3 className="text-primary-foreground font-semibold text-xl">
                      AI-Driven Powerpoint Presentation
                    </h3>
                  </div>
                  <div className="p-6 bg-card h-4/5 flex flex-col justify-center">
                    <p className="text-center text-sm text-muted-foreground">
                      Download a professionally designed PowerPoint presentation
                      summarizing your content.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button className="gap-2" onClick={onDownloadPowerPoint}>
                    <Download className="h-4 w-4" />
                    Download PowerPoint
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Video Presentation
              </CardTitle>
              <CardDescription>
                Watch your content as an animated video presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video rounded-lg overflow-hidden border border-border">
                {generatedContent.videoUrl ? (
                  <video
                    src={generatedContent.videoUrl}
                    controls
                    className="w-full h-full bg-black"
                    poster="/video-placeholder.png"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Video preview unavailable.
                      <br />
                      Please download to view.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button className="gap-2" onClick={onDownloadVideo}>
                  <Download className="h-4 w-4" />
                  Download Video
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
