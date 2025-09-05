"use client"
import { useAuth } from '@/hooks/authHooks';
import { useFriends } from '@/hooks/FriendHooks';
import { useUser } from '@/hooks/userHooks';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import Followers from '../../profile/user-network/_components/Followers';
import Following from '../../profile/user-network/_components/Following';
import { cn } from '@/lib/utils';

const ProfileScreen = () => {
    const params = useParams();
    const userId = params.userId as string;
    const { 
        following, 
        followers, 
        isLoading, 
        error,
        followUser,
        unfollowUser,
        getOtherUserFollowersWithDetails,
        getOtherUserFollowingWithDetails,
        setFollowing,
        setFollowers,
        } = useFriends();
        const { user: currentUser } = useAuth();
        const { getOtherUserDetails } = useUser();
        const [selectedTab, setSelectedTab] = useState('Followers');

        useEffect(() => {
            if (userId && currentUser) {
                setFollowers([]);
                setFollowing([]);
                getOtherUserDetails(userId);
                getOtherUserFollowersWithDetails(userId)
                getOtherUserFollowingWithDetails(userId)
            }
        },[userId, currentUser, getOtherUserDetails, getOtherUserFollowersWithDetails, getOtherUserFollowingWithDetails, setFollowers, setFollowing]);

        const handleTabPress = (tab: typeof selectedTab) => {
            setSelectedTab(tab);
        if (tab === "Followers") {
                getOtherUserFollowersWithDetails(userId)
            } else {
                getOtherUserFollowingWithDetails(userId)
            }
        };

        const renderTabContent = () => {
            switch (selectedTab) {
                case 'Followers':
                return <Followers
                            followers={followers}
                            followUser={followUser}
                            unfollowUser={unfollowUser}
                            isLoading={isLoading}
                            error={error}
                            getFollowersWithDetails={(page, limit) =>
                              getOtherUserFollowersWithDetails(userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined)
                            }
                            following={following}
                            currentUser={currentUser}
                        />;
                case 'Following':
                return <Following
                            following={following}
                            unfollowUser={unfollowUser}
                            isLoading={isLoading}
                            error={error}
                            getFollowingWithDetails={(page, limit) =>
                               getOtherUserFollowingWithDetails(userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined)
                            }
                            currentUser={currentUser}
                        />;
                default:
                return null;
            }
        };
        

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedTab}</h1>
          <div className="w-12" /> {/* spacer */}
        </div>
  
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {["Followers", "Following"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabPress(tab as typeof selectedTab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium text-center transition-colors",
                selectedTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
  
        {/* Error message */}
        {error && (
          <div className="text-red-500 text-center text-sm">
            {error}
          </div>
        )}
  
        {/* Content */}
        <div className="">{renderTabContent()}</div>
      </div>
    );
}

export default ProfileScreen