"use client";
import { useAuth } from '@/hooks/authHooks';
import { useFriends } from '@/hooks/FriendHooks'
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import LogoImage from "../../../assets/img/icon.png"
import SuggestedFriends from '@/components/users/SuggestedFriends';
import { Search } from "lucide-react";

const Users = () => {
  const { user } = useAuth();
  const { 
    getSuggestedUsers,
    suggestedUsers,
    followUser,
    unfollowUser,
    isLoading,
    error,
    getPendingFollowRequests,
    pendingFollowRequests,
    following,
    cancelFollowRequest,
  } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getSuggestedUsers();
  },[getSuggestedUsers]);

  const handleToggleFollow = (userId: string, isFollowing: boolean) => {
    console.log(`User ${userId} ${isFollowing ? 'followed' : 'unfollowed'}`);
  };

  if (!user) return null;

  const renderHeader = () => {

    return (
      <div className="w-full fixed top-0 z-10 bg-white shadow-sm flex items-center justify-between px-5 py-3 ">
        <Link href="/home">
           <Image
              src={LogoImage}
              alt='vestra image'
              className='w-12 h-12 rounded-xl'
           />
        </Link>
        <div className="relative w-full max-w-md ml-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className='w-full '>
      {renderHeader()}

      {/*  */}
      <div className='w-full pt-20'>
        <SuggestedFriends
            onToggleHandleAction={handleToggleFollow}
            suggestedUsers={suggestedUsers}
            followUser={followUser}
            unfollowUser={unfollowUser}
            isLoading={isLoading}
            error={error}
            getSuggestedUsers={getSuggestedUsers}
            cancelFollowRequest={cancelFollowRequest}
            getPendingFollowRequests={getPendingFollowRequests}
            pendingFollowRequests={pendingFollowRequests}
            following={following}
            searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}

export default Users