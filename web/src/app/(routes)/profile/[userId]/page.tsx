"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/authHooks";
import ShareProfile, { ShareProfileRef } from "@/components/Profile/Modal/ShareProfile";
import { useUser } from "@/hooks/userHooks";
import OtherUserProfileCard from "@/components/Profile/OtherUserProfileCard";

const UserProfile = () => {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();
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

  console.log("current user", currentUser?.profile?.firstName)
  console.log("other user", otherUserProfile?.firstName)
  console.log("userId from searchParams:", userId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* Profile Sidebar */}
        <aside className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl shadow p-6 h-fit">
          <OtherUserProfileCard
            user={otherUserProfile}
            handleShareBtnClick={() => shareProfileRef.current?.open()}
          />
        </aside>

        {/* Main Content */}
        <section className="flex flex-col">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Posts</h3>
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </button>
          </div>

          {/* Posts Section */}
          <div
            className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400 dark:text-gray-400">
              No posts available
            </div>
          </div>
        </section>
      </main>

      {/* Share Profile Modal */}
      <ShareProfile ref={shareProfileRef} user={otherUserProfile} />
    </div>
  );
};

export default UserProfile;
