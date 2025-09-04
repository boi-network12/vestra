"use client";
import { User } from '@/types/user';
import Image from 'next/image';
import Link from 'next/link';
import React, { FC } from 'react';

interface ProfileDetailsCardProps {
  user: User | null;
  handleEditBtnClick: () => void;
  handleShareBtnClick: () => void;
}

const ProfileDetailsCard: FC<ProfileDetailsCardProps> = ({ user, handleEditBtnClick, handleShareBtnClick }) => {
  if (!user) return null;

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
  const dynamicFontSize = fullName.length > 20 ? 'text-lg' : 'text-xl';

  return (
    <div className="flex flex-col items-center text-center sm:text-left sm:items-start">
      {/* Avatar */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4">
        <Image
          src={user?.profile?.avatar || 'https://picsum.photos/seed/696/3000/2000'}
          alt="User Avatar"
          fill
          className="rounded-full object-cover"
        />
      </div>

      {/* Name & Username */}
      <h2 className={`font-semibold ${dynamicFontSize} text-gray-900 dark:text-gray-100`}>
        {fullName || 'No Name'}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username || 'No Username'}</p>

      {/* Bio */}
      <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
        {user?.profile?.bio || <span className="text-gray-400 dark:text-gray-500">No bio available</span>}
      </p>

      {/* Followers & Link */}
      <div className="flex flex-wrap items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
        <button className="hover:underline">
          {user?.followers?.length || 0} followers
        </button>
        <span className="text-gray-300 dark:text-gray-600">&bull;</span>
        {user?.profile?.links?.[0]?.title && user?.profile?.links?.[0]?.url ? (
          <Link
            href={user.profile.links[0].url}
            target="_blank"
            className="hover:underline text-gray-500 dark:text-gray-400"
          >
            {user.profile.links[0].title}
          </Link>
        ) : (
          <span>No link</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 w-full">
        <button
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
          onClick={handleEditBtnClick}
        >
          Edit profile
        </button>
        <button
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
          onClick={handleShareBtnClick}
        >
          Share profile
        </button>
      </div>
    </div>
  );
};

export default ProfileDetailsCard;