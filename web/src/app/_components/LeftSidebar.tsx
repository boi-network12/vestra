"use client";

import { mobileNavItems, sidebarNavItems } from '@/constant/navItems';
import SwitchAccountModal from '@/Modal/SwitchAccountModal';
import { LoginData, User } from '@/types/user';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState, useEffect, useRef } from 'react';
import { BiPlus } from 'react-icons/bi';

interface LinkedAccount {
  _id: string;
  username: string;
  email: string;
  profile?: {
    avatar?: string;
  };
}

interface LeftSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  logout: () => void;
  isLoading: boolean;
  switchAccount?: (accountId: string) => Promise<boolean>;
  linkAccount?: (data: LoginData) => Promise<boolean>;
  linkedAccounts?: LinkedAccount[] | undefined;
}

export default function LeftSidebar({ 
  isSidebarOpen, 
  toggleSidebar, 
  user, 
  logout,
  isLoading,
  switchAccount,
  linkAccount,
  linkedAccounts
}: LeftSidebarProps) {
  const router = useRouter();
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, toggleSidebar]);

  const displayedNavItems = useMemo(
    () =>
      isSidebarOpen
        ? sidebarNavItems.filter(
            (item) =>
              !mobileNavItems.some((mobileItem) => mobileItem.name === item.name)
          )
        : sidebarNavItems,
    [isSidebarOpen]
  );

  const firstLetter =
    user?.profile?.firstName?.charAt(0)?.toUpperCase() || "U";

  return (
    <Fragment>
      <aside
        ref={sidebarRef}
        className={`lg:block w-64 h-full fixed z-20 transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarOpen ? 'bg-glass backdrop-blur-lg lg:bg-white dark:lg:bg-gray-800 lg:backdrop-blur-none' : 'bg-white dark:bg-gray-800'} shadow-md`}
      >
        <div className="p-4 md:pt-10">
          <div className="bg-transparent cursor-pointer rounded p-3">
            <div className="flex items-center justify-between">
              {user?.profile?.avatar ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={user.profile.avatar || ""}
                    alt={`${user.profile.firstName || 'User'}'s avatar`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-500 dark:bg-gray-600 text-white font-bold rounded-full">
                  {firstLetter}
                </div>
              )}
              <BiPlus 
                className="text-2xl border-gray-600 dark:border-gray-300 rounded-full border-2 p-1 cursor-pointer dark:text-white"
                onClick={() => setSwitchAccountOpen(true)} 
                title="Switch Account"
              />
            </div>
            {user && (
              <div className="mt-3 text-left">
                <h2 className="font-bold text-base text-gray-950 dark:text-gray-100">{`${user.profile?.firstName} ${user.profile?.lastName}`}</h2>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">@{user.username}</span>
              </div>
            )}
            {user && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {user.following?.length || 0} following    {user.followers?.length || 0} followers
              </p>
            )}
          </div>
          
          <nav className="mt-6 border-t-gray-200 dark:border-t-gray-700 border-t pt-4">
            <ul>
              {displayedNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name} className="mb-2">
                    <Link
                      href={item.href}
                      className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-500 dark:hover:text-blue-400 rounded"
                      onClick={() => isSidebarOpen && toggleSidebar()}
                    >
                      <Icon className="mr-3 h-6 w-6" />
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
                className="w-full p-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <SwitchAccountModal
        open={switchAccountOpen}
        onClose={() => setSwitchAccountOpen(false)}
        user={user}
        isLoading={isLoading}
        linkedAccounts={linkedAccounts}
        switchAccount={switchAccount}
        linkAccount={linkAccount}
      />
    </Fragment>
  );
}