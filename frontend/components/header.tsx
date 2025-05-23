import { FileAudio, Presentation as FilePresentation, FileText } from "lucide-react";

export function Header() {
  return (
    <div className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-4 mb-4">
          <FileText className="h-10 w-10" />
          <FileAudio className="h-10 w-10" />
          <FilePresentation className="h-10 w-10" />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
          AI Driven Multimedia Conversion Generator
        </h1>
        <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
          Transform your content into summaries, podcasts, and presentations with the power of AI.
          Upload a PDF or enter text, and let our AI do the rest.
        </p>
      </div>
    </div>
  );
}