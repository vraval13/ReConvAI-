"use client";
import {
  FormData,
  InputType,
  SummaryLevel,
  PodcastTone,
  PodcastLength,
  PowerPointTemplate,
  VideoStyle,
  VideoResolution,
} from "./main-converter";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface OptionsSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function OptionsSection({ formData, setFormData }: OptionsSectionProps) {
  const handlePowerpointTemplateChange = (value: PowerPointTemplate) => {
    setFormData({
      ...formData,
      powerpointTemplate: value,
      // Reset custom template path if switching away from custom
      // customTemplatePath: value === "custom" ? formData.customTemplatePath : "",
    });
  };

  // const handleCustomTemplateChange = (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   setFormData({
  //     ...formData,
  //     customTemplatePath: e.target.value,
  //   });
  // };

  const handleFileSelect = () => {
    // Implement file selection logic here
    console.log("File selection would happen here");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Content Generation Options</h2>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="podcast">Podcast</TabsTrigger>
          <TabsTrigger value="powerpoint">PowerPoint</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Summary Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summaryLevel">Complexity Level</Label>
                <Select
                  value={formData.summaryLevel}
                  onValueChange={(value: SummaryLevel) =>
                    setFormData({ ...formData, summaryLevel: value })
                  }
                >
                  <SelectTrigger id="summaryLevel">
                    <SelectValue placeholder="Select Complexity Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      Beginner (Simple Explanations)
                    </SelectItem>
                    <SelectItem value="student">
                      Student (Moderate Detail)
                    </SelectItem>
                    <SelectItem value="expert">
                      Expert (Technical Detail)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="podcast">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="podcastTone">Podcast Tone</Label>
                <Select
                  value={formData.podcastTone}
                  onValueChange={(value: PodcastTone) =>
                    setFormData({ ...formData, podcastTone: value })
                  }
                >
                  <SelectTrigger id="podcastTone">
                    <SelectValue placeholder="Select Podcast Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="podcastLength">Podcast Length</Label>
                <Select
                  value={formData.podcastLength}
                  onValueChange={(value: PodcastLength) =>
                    setFormData({ ...formData, podcastLength: value })
                  }
                >
                  <SelectTrigger id="podcastLength">
                    <SelectValue placeholder="Select Podcast Length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (2-3 minutes)</SelectItem>
                    <SelectItem value="medium">Medium (5-7 minutes)</SelectItem>
                    <SelectItem value="long">Long (10+ minutes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="powerpoint">
          <Card>
            <CardHeader>
              <CardTitle>PowerPoint Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="powerpointTemplate">PowerPoint Template</Label>
                <RadioGroup
                  id="powerpointTemplate"
                  value={formData.powerpointTemplate}
                  onValueChange={handlePowerpointTemplateChange}
                >
                  {/* <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="template-default" />
                    <Label htmlFor="template-default">Default Template</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="template-custom" />
                    <Label htmlFor="template-custom">Custom Template</Label>
                  </div> */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template1" id="template1" />
                    <Label htmlFor="template1">Professional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template2" id="template2" />
                    <Label htmlFor="template2">Creative</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template3" id="template3" />
                    <Label htmlFor="template3">Academic</Label>
                  </div>
                </RadioGroup>

                {/* {formData.powerpointTemplate === "custom" && ( */}
                {/* <div className="flex items-center space-x-2 mt-2">
                    <Input
                      value={formData.customTemplatePath}
                      onChange={handleCustomTemplateChange}
                      placeholder="Path to template file"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleFileSelect}>
                      Browse
                    </Button> */}
                {/* </div> */}
                {/* // )} */}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div
                  className={`aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    formData.powerpointTemplate === "template1"
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => handlePowerpointTemplateChange("template1")}
                >
                  <div className="bg-blue-600 h-1/4"></div>
                  <div className="p-2 bg-white h-3/4">
                    <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-1/2 h-2 bg-gray-200 rounded mb-3"></div>
                    <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                    <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                    <div className="w-3/4 h-1 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div
                  className={`aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    formData.powerpointTemplate === "template2"
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => handlePowerpointTemplateChange("template2")}
                >
                  <div className="bg-purple-600 h-1/6"></div>
                  <div className="p-2 bg-white h-5/6">
                    <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-1/2 h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="flex space-x-1 mb-2">
                      <div className="w-1/3 h-8 bg-purple-100 rounded"></div>
                      <div className="w-1/3 h-8 bg-purple-100 rounded"></div>
                      <div className="w-1/3 h-8 bg-purple-100 rounded"></div>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                    <div className="w-4/5 h-1 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div
                  className={`aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    formData.powerpointTemplate === "template3"
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => handlePowerpointTemplateChange("template3")}
                >
                  <div className="bg-green-700 h-1/5 flex items-center justify-center">
                    <div className="w-4/5 h-2 bg-white/60 rounded"></div>
                  </div>
                  <div className="p-2 bg-white h-4/5">
                    <div className="w-1/2 h-2 bg-green-200 rounded mb-2"></div>
                    <div className="flex mb-2">
                      <div className="w-1/4 h-12 bg-green-50 mr-2 rounded"></div>
                      <div className="w-3/4">
                        <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                        <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                        <div className="w-full h-1 bg-gray-100 rounded mb-1"></div>
                        <div className="w-3/4 h-1 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Video Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoStyle">Video Style</Label>
                <Select
                  value={formData.videoStyle}
                  onValueChange={(value: VideoStyle) =>
                    setFormData({ ...formData, videoStyle: value })
                  }
                >
                  <SelectTrigger id="videoStyle">
                    <SelectValue placeholder="Select Video Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoResolution">Video Resolution</Label>
                <Select
                  value={formData.videoResolution}
                  onValueChange={(value: VideoResolution) =>
                    setFormData({ ...formData, videoResolution: value })
                  }
                >
                  <SelectTrigger id="videoResolution">
                    <SelectValue placeholder="Select Video Resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">SD (480p)</SelectItem>
                    <SelectItem value="720p">HD (720p)</SelectItem>
                    <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
