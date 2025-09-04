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
import { usePathname } from "next/navigation";
import { IoMenuSharp } from "react-icons/io5";

const trends: Trend[] = [
  { topic: "Tech", posts: "1.2M" },
  { topic: "AI", posts: "800K" },
  { topic: "Next.js", posts: "500K" },
];

const noSidebarRoutes = ["/settings"];
const noTabNeeded = ["/settings", "/users"];
const noRightSidebar = ["/profile", "/users"];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, isLoading, switchAccount, linkAccount, linkedAccounts } = useAuth();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const hideSidebar = noSidebarRoutes?.includes(pathname);
  const hideMobileNavbar = noTabNeeded?.includes(pathname);
  const hideRightSidebar = noRightSidebar?.includes(pathname);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Hamburger Menu for Tablet/Mobile */}
        {!hideSidebar && (
          <button
            className="lg:hidden p-4 fixed top-0 left-0 z-30"
            onClick={toggleSidebar}
            aria-label="menu"
          >
            <IoMenuSharp className="text-xl cursor-pointer text-gray-850 dark:text-gray-200" />
          </button>
        )}

        {!hideSidebar && (
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            user={user}
            logout={logout}
            isLoading={isLoading}
            switchAccount={switchAccount}
            linkAccount={linkAccount}
            linkedAccounts={linkedAccounts}
          />
        )}
        <MainContent>{children}</MainContent>

        {!hideRightSidebar && <RightSidebar trends={trends} />}
        
        {!hideMobileNavbar && (
          <MobileNav navItems={mobileNavItems} />
        )}
      </div>
    </ProtectedRoute>
  );
}