"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface SpeakerAvatarProps {
  name: string;
  isActive: boolean;
}

export function SpeakerAvatar({ name, isActive }: SpeakerAvatarProps) {
  const avatarUrl =
    name === "Alex"
      ? "https://img.icons8.com/color/144/000000/circled-user-female-skin-type-5.png"
      : "https://img.icons8.com/color/144/000000/circled-user-male-skin-type-7.png";
  console.log("SpeakerAvatar props:", { name, isActive }); // Debugging

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full border-2",
        isActive ? "border-green-500" : "border-gray-300"
      )}
    >
      <img src={avatarUrl} alt={name} className="w-full h-full rounded-full" />
    </div>
  );
}
