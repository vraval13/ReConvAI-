"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainConverter } from "@/components/main-converter";
import { Header } from "@/components/header";
import { FileUploader } from "@/components/file-uploader";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/landing");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <div className="container px-4 md:px-6 py-8 max-w-5xl mx-auto">
        {/* <FileUploader /> */}
        <MainConverter />
      </div>
    </main>
  );
}
