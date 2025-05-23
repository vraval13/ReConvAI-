"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { CheckCircle, FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileUpload: (file: File | null) => void;
  onUploadSuccess?: (responseData: any) => void;
  onUploadError?: (error: Error) => void;
}

export function FileUploader({
  onFileUpload,
  onUploadSuccess,
  onUploadError,
}: FileUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.type === "application/pdf") {
      await processFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      await processFile(droppedFile);
    } else if (droppedFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const processFile = async (file: File) => {
    setFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("http://127.0.0.1:5000/upload-pdf", {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error details
        throw new Error(errorData.error || "Failed to upload PDF");
      }

      const data = await response.json();
      onFileUpload(file);
      onUploadSuccess?.(data);

      toast({
        title: "File uploaded successfully",
        description: "Your PDF has been processed",
      });
    } catch (error) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          file ? "bg-secondary/20" : "hover:bg-muted/50",
          isUploading && "opacity-70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="mx-auto flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload your PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your file here or click to browse
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Browse Files"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isUploading ? (
                <span className="text-sm text-muted-foreground">
                  Processing...
                </span>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
