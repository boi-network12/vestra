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

const noSidebarRoutes = ["/settings", "/profile/user-network"];
const noTabNeeded = ["/settings", "/users", "/profile/user-network"];
const noRightSidebar = ["/profile", "/users", "/profile/user-network"];

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
            className="lg:hidden p-2 fixed top-3 left-3 z-30 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            onClick={toggleSidebar}
            aria-label="Toggle Menu"
          >
            <IoMenuSharp className="text-2xl text-gray-800 dark:text-gray-100 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-150" />
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