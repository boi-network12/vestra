"use client";

import { User } from "@/types/user";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FC, useEffect, useState } from "react";
import { BiChat, BiShareAlt } from "react-icons/bi";
import { toast } from "react-toastify";

interface OtherUserProfileCardProps {
  user: User | null;
  userId?: string;
  currentUser?: User | null;
  handleShareBtnClick: () => void;
  followUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
    followStatus?: "FOLLOWING" | "REQUESTED" | "FOLLOW" | "FOLLOW_BACK" | "MUTUAL";
  }>;
  unfollowUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  cancelFollowRequest: (userId: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  getPendingFollowRequests: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: { user: User }[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  following: User[];
  pendingFollowRequests: { user: User }[];
  getOtherUserDetails: (profileId: string) => Promise<{ 
    success: boolean; 
    message: string; 
    data?: User | undefined; 
  }>;
}

type ButtonState = "FOLLOW" | "FOLLOW_BACK" | "REQUESTED" | "FOLLOWING" | "MUTUAL";

interface ButtonConfig {
  icon: string;
  text: string;
  class: string;
  action: () => void;
}

const OtherUserProfileCard: FC<OtherUserProfileCardProps> = ({
  user,
  userId,
  handleShareBtnClick,
  followUser,
  unfollowUser,
  cancelFollowRequest,
  getPendingFollowRequests,
  following,
  pendingFollowRequests,
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [hasFetchedPendingRequests, setHasFetchedPendingRequests] = useState(false);
  const [localButtonState, setLocalButtonState] = useState<ButtonState | null>(null);
  const router = useRouter();


  // Fetch pending follow requests on mount
  useEffect(() => {
    if (!hasFetchedPendingRequests && pendingFollowRequests.length === 0) {
      getPendingFollowRequests().then(() => {
        setHasFetchedPendingRequests(true);
      });
    }
  }, [getPendingFollowRequests, pendingFollowRequests.length, hasFetchedPendingRequests]);

  if (!user || !userId) return null;


  const isFollowing = following.some((u) => u._id === userId);
  const isPending = pendingFollowRequests.some((req) => req.user._id === userId);
  const isMutual = user.isMutual;
  const followStatus = user.followStatus;


  const buttonState: ButtonState =
    localButtonState ||
    (followStatus === "REQUESTED" || isPending
      ? "REQUESTED"
      : isMutual
      ? "MUTUAL"
      : isFollowing
      ? "FOLLOWING"
      : followStatus === "FOLLOW_BACK"
      ? "FOLLOW_BACK"
      : "FOLLOW");

  // Handle profile navigation with privacy rules
  const handleProfileClick = () => {
    const privacy = user?.privacySettings?.profileVisibility || "public";
    if (privacy === "public") {
      router.push(`/users/${userId}`);
    } else if ((privacy === "private" || privacy === "followers") && isFollowing) {
      router.push(`/users/${userId}`);
    } else {
      toast.warn("This profile is private. Follow the user to view their profile.");
    }
  };

  // Button handlers
  const handleFollow = async () => {
    setIsButtonLoading(true);
    const result = await followUser(userId);
    setIsButtonLoading(false);
    if (result.success) {
      setLocalButtonState("REQUESTED"); // instantly update UI
      await getPendingFollowRequests();
      setHasFetchedPendingRequests(true);
    } else {
      console.error("Follow error:", result.message);
    }
  };

  const handleUnfollow = async () => {
    setIsButtonLoading(true);
    const result = await unfollowUser(userId);
    setIsButtonLoading(false);
    if (result.success) {
      setLocalButtonState("FOLLOW");
    } else {
      console.error("Unfollow error:", result.message);
    }
  };

  const handleCancelRequest = async () => {
    setIsButtonLoading(true);
    const result = await cancelFollowRequest(userId);
    setIsButtonLoading(false);
    if (result.success) {
      setLocalButtonState("FOLLOW");
      await getPendingFollowRequests();
    } else {
      console.error("Cancel request error:", result.message);
      // toast.error(result.message);
    }
  };

  const handleMessage = () => {
    router.push(`/messages/${userId}`);
  };

  // Button configuration
  const buttonConfig: Record<ButtonState, ButtonConfig> = {
    FOLLOW: {
      icon: "person-add",
      text: "Follow",
      class:
        "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
      action: handleFollow,
    },
    FOLLOW_BACK: {
      icon: "person-add",
      text: "Follow Back",
      class:
        "bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white",
      action: handleFollow,
    },
    REQUESTED: {
      icon: "time-outline",
      text: "Requested",
      class:
        "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white opacity-70",
      action: handleCancelRequest,
    },
    FOLLOWING: {
      icon: "person-remove",
      text: "Unfollow",
      class:
        "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white",
      action: handleUnfollow,
    },
    MUTUAL: {
      icon: "chatbubbles-outline",
      text: "Message",
      class:
        "bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white",
      action: handleMessage,
    },
  };

  const config = buttonConfig[buttonState] || buttonConfig.FOLLOW;
  const showMessageButton = buttonState === "FOLLOWING" || buttonState === "MUTUAL";

  const fullName = `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`;
  const dynamicFontSize = fullName.length > 20 ? "text-lg" : "text-xl";

  return (
    <div className="relative flex flex-col text-center sm:text-left bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
      {/* Cover Photo */}
      <div className="relative w-full h-32 sm:h-40">
        <Image
          src={user?.profile?.coverPhoto || "https://picsum.photos/seed/697/3000/1000"}
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
            src={user?.profile?.avatar || "https://picsum.photos/seed/696/3000/2000"}
            alt="User Avatar"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex flex-col items-center sm:items-start px-4 sm:px-6 pb-6 pt-2">
        {/* Name & Username */}
        <div className="flex items-center gap-1">
          <h2
            className={`font-semibold ${dynamicFontSize} text-gray-900 dark:text-gray-100 cursor-pointer`}
            onClick={handleProfileClick}
          >
            {fullName || "No Name"}
          </h2>
          {isMutual && (
            <svg
              className="w-4 h-4 text-blue-500 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13 7H7v6h6V7z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          @{user?.username || "No Username"}
        </p>

        {/* Bio */}
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-center sm:text-left">
          {user?.profile?.bio || (
            <span className="text-gray-400 dark:text-gray-500">No bio available</span>
          )}
        </p>

        {/* Followers & Link */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <button onClick={handleProfileClick} className="hover:underline">
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
            disabled={isButtonLoading}
            onClick={config.action}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition transform hover:scale-95 ${config.class}`}
          >
            {isButtonLoading ? (
              "..."
            ) : (
              <>
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d={
                      config.icon === "person-add"
                        ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        : config.icon === "person-remove"
                        ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM8 8h8"
                        : config.icon === "time-outline"
                        ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h3v2h-5V7z"
                        : "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1zm-3-7H8c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z"
                    }
                  />
                </svg>
                {config.text}
              </>
            )}
          </button>
          {showMessageButton && (
            <button
              disabled={isButtonLoading}
              onClick={handleMessage}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition transform hover:scale-95 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              aria-label="message"
            >
              <BiChat className="inline-block w-4 h-4" />
            </button>
          )}
          <button
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition transform hover:scale-95"
            onClick={handleShareBtnClick}
            aria-label="share"
          >
            <BiShareAlt className="inline-block w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfileCard;