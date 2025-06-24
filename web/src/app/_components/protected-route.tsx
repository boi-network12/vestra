// app/_components/protected-route.tsx
"use client";

import { useAuth } from "@/hooks/authHooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadImg from "../../assets/img/loadIcon.png";
import { BiLoader } from "react-icons/bi";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
  if (!isLoading && !user) {
    const timeout = setTimeout(() => {
      router.push("/login");
    }, 2000); // delay by 1 second

    return () => clearTimeout(timeout); // cleanup if the component unmounts
  }
}, [user, isLoading, router]);


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030120]">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image
            src={LoadImg}
            alt="Loading"
            className="h-30 w-30 object-contain"
            priority
          />
          <BiLoader className="animate-spin text-white/60 text-3xl" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// src/app/_components/protected-route.tsx