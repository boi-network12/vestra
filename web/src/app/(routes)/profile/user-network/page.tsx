"use client"
import SuggestedFriends from '@/components/users/SuggestedFriends';
import { useFriends } from '@/hooks/FriendHooks';
import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useState } from 'react'
import Followers from './_components/Followers';
import Following from './_components/Following';

const UserNetwork = () => {
  const { 
    getFollowingWithDetails, 
    getFollowersWithDetails, 
    suggestedUsers, 
    following, 
    followers, 
    isLoading, 
    error,
    getSuggestedUsers,
    followUser,
    unfollowUser,
    getPendingFollowRequests,
    pendingFollowRequests,
    cancelFollowRequest,
    setFollowers,
    setFollowing
  } = useFriends();
  const [selectedTab, setSelectedTab] = useState<"Followers" | "Following" | "Users">("Followers");
  const [searchQuery] = useState("");

  // Wrapper function for getFollowersWithDetails
  const adaptedGetFollowersWithDetails = useCallback(
    (userId?: string | number, page?: number, limit?: number) => {
      return getFollowersWithDetails(page, limit);
    },
    [getFollowersWithDetails]
  );

  // Wrapper function for getFollowingWithDetails
  const adaptedGetFollowingWithDetails = useCallback(
    (userId?: string | number, page?: number, limit?: number) => {
      return getFollowingWithDetails(page, limit);
    },
    [getFollowingWithDetails]
  );

  useEffect(() => {
    setFollowers([]);
    setFollowing([]);
    adaptedGetFollowersWithDetails();
    adaptedGetFollowingWithDetails(); // Use the adapted function
    getSuggestedUsers();
  }, [
    adaptedGetFollowersWithDetails,
    adaptedGetFollowingWithDetails,
    setFollowers,
    setFollowing,
    getSuggestedUsers,
  ]);



  // Handle tab change
  const handleTabPress = (tab: typeof selectedTab) => {
    setSelectedTab(tab);
    if (tab === "Users") {
      getSuggestedUsers();
    } else if (tab === "Followers") {
      adaptedGetFollowersWithDetails();
    } else {
      getFollowingWithDetails();
    }
  };

   const renderTabContent = () => {
    switch (selectedTab) {
      case "Followers":
        return (
          <Followers
            followers={followers}
            followUser={followUser}
            unfollowUser={unfollowUser}
            isLoading={isLoading}
            error={error}
            getFollowersWithDetails={adaptedGetFollowersWithDetails}
            following={following}
          />
        );
      case "Following":
        return (
          <Following
            following={following}
            unfollowUser={unfollowUser}
            isLoading={isLoading}
            error={error}
            getFollowingWithDetails={adaptedGetFollowingWithDetails}
          />
        );
      case "Users":
        return (
          <SuggestedFriends
            onToggleHandleAction={(userId, isFollowing) =>
              console.log(`User ${userId} ${isFollowing ? "followed" : "unfollowed"}`)
            }
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
        );
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
        {["Followers", "Following", "Users"].map((tab) => (
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

export default UserNetwork