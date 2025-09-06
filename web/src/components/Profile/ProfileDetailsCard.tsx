"use client";
import { User } from '@/types/user';
import Image from 'next/image';
import Link from 'next/link';
import React, { FC } from 'react';

interface ProfileDetailsCardProps {
  user: User | null;
  handleEditBtnClick: () => void;
  handleShareBtnClick: () => void;
  toUserNetwork: () => void;
}

const ProfileDetailsCard: FC<ProfileDetailsCardProps> = ({ user, handleEditBtnClick, handleShareBtnClick, toUserNetwork }) => {
  if (!user) return null;

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
  const dynamicFontSize = fullName.length > 20 ? 'text-lg' : 'text-xl';

  return (
    <div className="relative flex flex-col text-center sm:text-left bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
      {/* Cover Photo */}
      <div className="relative w-full h-32 sm:h-40">
        <Image
          src={user?.profile?.coverPhoto || 'https://picsum.photos/seed/697/3000/1000'}
          alt="Cover Photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center sm:justify-start -mt-12 sm:-mt-16 px-4 sm:px-6">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
          <Image
            src={user?.profile?.avatar || 'https://picsum.photos/seed/696/3000/2000'}
            alt="User Avatar"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex flex-col items-center sm:items-start px-4 sm:px-6 pb-6 pt-2">
        {/* Name & Username */}
        <h2 className={`font-semibold ${dynamicFontSize} text-gray-900 dark:text-gray-100`}>{fullName || 'No Name'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username || 'No Username'}</p>

        {/* Bio */}
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-center sm:text-left">
          {user?.profile?.bio || <span className="text-gray-400 dark:text-gray-500">No bio available</span>}
        </p>

        {/* Followers & Link */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <button onClick={toUserNetwork} className="hover:underline">
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
        <div className="flex gap-3 mt-4 w-full">
          <button
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            onClick={handleEditBtnClick}
          >
            Edit profile
          </button>
          <button
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            onClick={handleShareBtnClick}
          >
            Share profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsCard;