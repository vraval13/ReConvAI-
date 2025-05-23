"use client";

import { useState } from "react";
import { FormData, InputType } from "./main-converter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { FileUploader } from "./file-uploader";
import { CheckCircle, FileText, Upload } from "lucide-react";

interface InputSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function InputSection({ formData, setFormData }: InputSectionProps) {
  const handleInputTypeChange = (value: InputType) => {
    setFormData({ ...formData, inputType: value });
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, textInput: e.target.value });
  };

  const handleFileUpload = (file: File | null) => {
    setFormData({ ...formData, pdfFile: file });
  };

  return (
    <Card className="border-2 border-border/50 shadow-md transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Input Selection
        </CardTitle>
        <CardDescription>
          Choose your input method and provide the content you want to convert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={formData.inputType}
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
          {formData.inputType === "pdf" ? (
            <FileUploader onFileUpload={handleFileUpload} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="textInput">Enter your text</Label>
              <Textarea
                id="textInput"
                placeholder="Enter the text you want to convert here. For best results, provide detailed and well-structured content."
                className="min-h-[200px] resize-y"
                value={formData.textInput}
                onChange={handleTextInputChange}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}