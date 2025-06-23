"use client";
import { useAuth } from "@/hooks/authHooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadImg from "../assets/img/loadIcon.png";
import { BiLoader } from "react-icons/bi"; 
import { useEffect } from "react";

export default function Splash() {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user && !user.isVerified) {
        router.replace("/verify");
      } else if (user && user.isVerified) {
        router.replace("/home");
      }
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030120]">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image
            src={LoadImg}
            alt="Loading"
            className="h-30 w-30 object-contain"
          />
          <BiLoader className="animate-spin text-white/60 text-3xl" />
        </div>
      </div>
    );
  }

  return null; // or a fallback component
}
