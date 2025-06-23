// app/_components/public-route.tsx
"use client";


import { useAuth } from "@/hooks/authHooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);


  return <>{children}</>;
}