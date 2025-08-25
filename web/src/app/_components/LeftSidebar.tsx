"use client";


import { mobileNavItems, sidebarNavItems } from '@/constant/navItems';
import SwitchAccountModal from '@/Modal/SwitchAccountModal';
import { LoginData, User } from '@/types/user';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';
import { BiPlus } from 'react-icons/bi';



interface LeftSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  logout: () => void;
  isLoading: boolean;
  switchAccount?: (accountId: string) => Promise<boolean>;
  linkAccount?: (data: LoginData) => Promise<boolean>;
  linkedAccounts?: User[];
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

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };


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
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } lg:block w-64 bg-white shadow-md fixed h-full z-20 transition-transform duration-300`}
      >
        <div className="p-4 md: pt-10">
          <div className='bg-white cursor-pointe rounded p-3'>
            <div className='flex items-center justify-between  '>
              {user?.profile?.avatar ? (
                <Image
                  src={user.profile.avatar || ""}
                  alt={`${user.profile.firstName || 'User'}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-500 text-white font-bold rounded-full">
                  {firstLetter}
                </div>
              )}
              <BiPlus 
                  className='text-2xl border-gray-600 rounded-full border-2 p-1 cursor-pointer' onClick={() => setSwitchAccountOpen(true)} 
                  title='Switch Account'
               />
            </div>
            {user && (
              <div className='mt-3 text-left'>
                <h2 className='font-bold text-base text-gray-950'>{`${user.profile?.firstName} ${ user.profile?.lastName}`}</h2>
                <span className='text-sm font-medium text-gray-700'>@{user.username}</span>
              </div>
            )}
            {user && (
              <p className="text-sm text-gray-600 mt-2">
                {user.following?.length || 0} following    {user.followers?.length || 0} followers
              </p>
            )}
          </div>
          
          <nav className="mt-6 border-t-gray-200 border-t pt-4">
            <ul>
              {displayedNavItems.map((item) => {
                const Icon = item.icon; // Icon is now a React component
                return (
                  <li key={item.name} className="mb-2">
                    <Link
                      href={item.href}
                      className="flex items-center p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded"
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
                className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* modal matches the rn flow */}
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