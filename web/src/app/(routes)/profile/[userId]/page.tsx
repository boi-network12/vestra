"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/authHooks";
import ShareProfile, { ShareProfileRef } from "@/components/Profile/Modal/ShareProfile";
import { useUser } from "@/hooks/userHooks";
import OtherUserProfileCard from "@/components/Profile/OtherUserProfileCard";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useFriends } from "@/hooks/FriendHooks";

const UserProfile = () => {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();
  const {
    followUser,
    unfollowUser,
    cancelFollowRequest,
    following,
    pendingFollowRequests,
    getPendingFollowRequests
  } = useFriends();
  const { getOtherUserDetails, otherUserProfile, isLoading } = useUser();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const shareProfileRef = useRef<ShareProfileRef>(null);

    useEffect(() => {
        if (userId && currentUser) {
            getOtherUserDetails(userId);
        }
    },[userId, currentUser, getOtherUserDetails]);

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'list' ? 'grid' : 'list'));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-4 border-t-transparent border-blue-500 dark:border-blue-400 rounded-full"></div>
      </div>
    );
  }

  const renderPrivateDesignUi = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-blue-100 dark:bg-blue-900/40 p-6 rounded-full shadow-lg mb-4">
        <LockClosedIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        This Profile is Private
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
        You can&apos;t see {otherUserProfile?.profile?.firstName || "this user's"} {otherUserProfile?.profile?.lastName || "this user's"} posts right now.
        Send a follow request to gain access.
      </p>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* Profile Sidebar */}
        <aside className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl shadow h-fit">
          <OtherUserProfileCard
            user={otherUserProfile}
            userId={userId}
            currentUser={currentUser}
            handleShareBtnClick={() => shareProfileRef.current?.open()}
            followUser={followUser}
            unfollowUser={unfollowUser}
            cancelFollowRequest={cancelFollowRequest}
            following={following}
            pendingFollowRequests={pendingFollowRequests}
            getPendingFollowRequests={getPendingFollowRequests}
            getOtherUserDetails={getOtherUserDetails}
          />
        </aside>

        {/* Main Content */}
        <section className="flex flex-col">

          {otherUserProfile && otherUserProfile?.privacySettings?.profileVisibility === "public" && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Posts</h3>
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </button>
            </div>
          )}

          {/* Posts Section */}
          {otherUserProfile && otherUserProfile?.privacySettings?.profileVisibility === "private" ? 
             renderPrivateDesignUi() :
             (
              <div
                  className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400 dark:text-gray-400">
                    No posts available
                  </div>
                </div>
             )
          }
        </section>
      </main>

      {/* Share Profile Modal */}
      <ShareProfile ref={shareProfileRef} user={otherUserProfile} />
    </div>
  );
};

export default UserProfile;
