"use client";

import { FC, useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

type ButtonState = "FOLLOW" | "FOLLOW_BACK" | "REQUESTED" | "FOLLOWING" | "MUTUAL";

interface ButtonConfig {
  icon: string;
  text: string;
  class: string;
  action: () => void;
}

interface SuggestedFriendsProps {
  onToggleHandleAction?: (userId: string, isFollowing: boolean) => void;
  suggestedUsers: User[];
  followUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
    followStatus?: "FOLLOWING" | "REQUESTED" | "FOLLOW" | "FOLLOW_BACK" | "MUTUAL";
  }>;
  unfollowUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  error: string | null;
  getSuggestedUsers: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: User[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  cancelFollowRequest: (userId: string) => Promise<{ success: boolean; message: string }>;
  getPendingFollowRequests: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: { user: User }[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  pendingFollowRequests: { user: User }[];
  following: User[];
  searchQuery: string;
}

const useDebounce = () => {
  return useCallback(
    function <Args extends unknown[], R>(
      fn: (...args: Args) => R,
      delay: number
    ) {
      let timeout: NodeJS.Timeout;

      const debouncedFn = (...args: Args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fn(...args);
        }, delay);
      };

      (debouncedFn as typeof debouncedFn & { cancel: () => void }).cancel = () => {
        clearTimeout(timeout);
      };

      return debouncedFn as typeof debouncedFn & { cancel: () => void };
    },
    []
  );
};

const SuggestedFriends: FC<SuggestedFriendsProps> = ({
  onToggleHandleAction,
  suggestedUsers,
  followUser,
  unfollowUser,
  isLoading,
  error,
  getSuggestedUsers,
  cancelFollowRequest,
  getPendingFollowRequests,
  pendingFollowRequests,
  searchQuery,
}) => {
  const router = useRouter();
  const debounce = useDebounce();
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: { isLoading: boolean } }>({});
  const [hasFetchedPendingRequests, setHasFetchedPendingRequests] = useState(false);

  // Filter users by searchQuery
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return suggestedUsers;
    const query = searchQuery.toLowerCase();
    return suggestedUsers.filter(
      (user) =>
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(query) ||
        (user.username || "").toLowerCase().includes(query)
    );
  }, [suggestedUsers, searchQuery]);

  // Fetch pending follow requests on mount
  useEffect(() => {
    if (!hasFetchedPendingRequests && pendingFollowRequests.length === 0) {
      getPendingFollowRequests().then(() => {
        setHasFetchedPendingRequests(true);
      });
    }
  }, [getPendingFollowRequests, pendingFollowRequests.length, hasFetchedPendingRequests]);

  // Reset userStatuses when suggestedUsers changes
  useEffect(() => {
    setUserStatuses({});
  }, [suggestedUsers]);

  // Handlers with debounce
  const handleFollow = useMemo(
    () =>
      debounce(async (userId: string) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: true },
        }));
        const result = await followUser(userId);
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: false },
        }));
        if (result.success) {
          console.log(`Follow action: ${result.message}`);
          onToggleHandleAction?.(userId, result.followStatus === "FOLLOWING");
        }
      }, 300),
    [debounce, followUser, onToggleHandleAction]
  );

  const handleUnfollow = useMemo(
    () =>
      debounce(async (userId: string) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: true },
        }));
        const result = await unfollowUser(userId);
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: false },
        }));
        if (result.success) {
          console.log(`Unfollow action: ${result.message}`);
          onToggleHandleAction?.(userId, false);
        }
      }, 300),
    [debounce, unfollowUser, onToggleHandleAction]
  );

  const handleCancelRequest = useMemo(
    () =>
      debounce(async (userId: string) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: true },
        }));
        const result = await cancelFollowRequest(userId);
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isLoading: false },
        }));
        if (result.success) {
          console.log(`Cancel request action: ${result.message}`);
          await Promise.all([getPendingFollowRequests(), getSuggestedUsers()]);
        }
      }, 300),
    [debounce, cancelFollowRequest, getPendingFollowRequests, getSuggestedUsers]
  );

  const navigateToProfile = useCallback((userId: string) => router.push(`/profile/${userId}`), [router]);
  const handleMessage = useCallback((userId: string) => router.push(`/messages/${userId}`), [router]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      {isLoading && (
        <div className="text-center py-4">
          <span className="loading loading-spinner loading-md text-blue-500 dark:text-blue-400"></span>
        </div>
      )}

      {!isLoading && filteredUsers.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400">No suggested users available.</p>
      )}

      {error && <p className="text-center text-red-500 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const status = userStatuses[user._id!] || { isLoading: false };
          const buttonState = user.followStatus || "FOLLOW";
          const isMutual = user.isMutual;

          const buttonConfig: Record<ButtonState, ButtonConfig> = {
            FOLLOW: {
              icon: "person-add",
              text: "Follow",
              class: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
              action: () => handleFollow(user._id!),
            },
            FOLLOW_BACK: {
              icon: "person-add",
              text: "Follow Back",
              class: "bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white",
              action: () => handleFollow(user._id!),
            },
            REQUESTED: {
              icon: "time-outline",
              text: "Requested",
              class: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white opacity-70",
              action: () => handleCancelRequest(user._id!),
            },
            FOLLOWING: {
              icon: "person-remove",
              text: "Unfollow",
              class: "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white",
              action: () => handleUnfollow(user._id!),
            },
            MUTUAL: {
              icon: "chatbubbles-outline",
              text: "Message",
              class: "bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white",
              action: () => handleMessage(user._id!),
            },
          };

          const config = buttonConfig[buttonState as ButtonState] || buttonConfig.FOLLOW;
          const showMessageButton = buttonState === "FOLLOWING";

          return (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4 flex items-center justify-between"
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigateToProfile(user._id!)}
              >
                <Image
                  src={user.avatar || "https://picsum.photos/seed/default/100"}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.bio.length > 20 ? `${user.bio.substring(0, 20)}...` : user.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={status.isLoading}
                  onClick={config.action}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition transform hover:scale-95 ${config.class}`}
                >
                  {status.isLoading ? (
                    "..."
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 inline-block mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d={config.icon === "person-add" ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" : 
                                 config.icon === "person-remove" ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM8 8h8" : 
                                 config.icon === "time-outline" ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h3v2h-5V7z" : 
                                 "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1zm-3-7H8c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z"} />
                      </svg>
                      {config.text}
                    </>
                  )}
                </button>
                {showMessageButton && (
                  <button
                    disabled={status.isLoading}
                    onClick={() => handleMessage(user._id!)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition transform hover:scale-95 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                    aria-label="btn"
                  >
                    <svg
                      className="w-4 h-4 inline-block"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1zm-3-7H8c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedFriends;