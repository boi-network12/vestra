// app/(routes)/layout.tsx
"use client";
import ProtectedRoute from "../_components/protected-route";
import { Trend } from "@/types/trend";
import { ReactNode, useState } from "react";
import LeftSidebar from "../_components/LeftSidebar";
import MainContent from "../_components/MainContainer";
import RightSidebar from "../_components/RightSidebar";
import MobileNav from "../_components/MobileNav";
import { mobileNavItems } from "@/constant/navItems";
import { useAuth } from "@/hooks/authHooks";

const trends: Trend[] = [
  { topic: "Tech", posts: "1.2M" },
  { topic: "AI", posts: "800K" },
  { topic: "Next.js", posts: "500K" },
];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        {/* Hamburger Menu for Tablet/Mobile */}
        <button
          className="lg:hidden p-4 fixed top-0 left-0 z-30"
          onClick={toggleSidebar}
        >
          ☰
        </button>

        <LeftSidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          user={user}
          logout={logout}
        />
        <MainContent>{children}</MainContent>
        <RightSidebar trends={trends} />
        <MobileNav navItems={mobileNavItems} />
      </div>
    </ProtectedRoute>
  );
}
