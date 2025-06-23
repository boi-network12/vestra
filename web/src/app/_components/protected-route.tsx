// app/_components/protected-route.tsx
"use client";

import { useAuth } from "@/hooks/authHooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="w-full bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}