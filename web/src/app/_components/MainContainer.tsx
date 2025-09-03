"use client";
import { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 lg:ml-64 lg:mr-80 bg-gray-100">
      {children}
    </main>
  );
}