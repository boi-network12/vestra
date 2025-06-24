"use client";
import { mobileNavItems, sidebarNavItems } from '@/constant/navItems';
import { useAuth } from '@/hooks/authHooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LeftSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function LeftSidebar({ isSidebarOpen, toggleSidebar }: LeftSidebarProps) {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const displayedNavItems = isSidebarOpen
    ? sidebarNavItems.filter(
        (item) => !mobileNavItems.some((mobileItem) => mobileItem.name === item.name)
      )
    : sidebarNavItems;

  return (
    <aside
      className={`${
        isSidebarOpen ? "block" : "hidden"
      } lg:block w-64 bg-white shadow-md fixed h-full z-20 transition-transform duration-300`}
    >
      <div className="p-4">
        <h1 className="text-2xl font-bold text-blue-500">X-Clone</h1>
        <nav className="mt-6">
          <ul>
            {displayedNavItems.map((item) => {
              const Icon = item.icon; // Icon is now a React component
              return (
                <li key={item.name} className="mb-2">
                  <Link
                    href={item.href}
                    className="flex items-center p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded"
                    onClick={() => isSidebarOpen && toggleSidebar()} // Close sidebar on mobile/tablet click
                  >
                    <Icon className="mr-3 h-6 w-6" /> {/* Render icon as component */}
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {user && (
          <div className="mt-6 p-2">
            <button
              onClick={handleLogout}
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}