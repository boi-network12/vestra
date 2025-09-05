"use client";

import { FC, useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { motion, AnimatePresence } from "framer-motion"; // For animations

interface FollowersProps {
  followers: User[];
  followUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
    followStatus?: "FOLLOWING" | "REQUESTED" | "FOLLOW" | "FOLLOW_BACK" | "MUTUAL";
  }>;
  unfollowUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  error: string | null;
  getFollowersWithDetails: (
    userId: string, // Change to required string
    page?: number | undefined,
    limit?: number | undefined
  ) => Promise<{
    success: boolean;
    data?: User[] | undefined;
    meta?: { total: number; page: number; limit: number } | undefined;
    message?: string | undefined;
  }>;
  following: User[];
  currentUser?: User | null;
}

const useDebounce = () => {
  return useCallback(
    function <Args extends unknown[], R>(fn: (...args: Args) => R, delay: number) {
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

const OtherFollowers: FC<FollowersProps> = ({
  followers,
  followUser,
  unfollowUser,
  isLoading,
  error,
  getFollowersWithDetails,
  following,
  currentUser,
}) => {
  const router = useRouter();
  const debounce = useDebounce();
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: { isLoading: boolean } }>({});

  // Reset userStatuses when followers change
  useEffect(() => {
    setUserStatuses({});
  }, [followers]);

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
          await getFollowersWithDetails(userId);
        }
      }, 300),
    [debounce, followUser, getFollowersWithDetails]
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
          await getFollowersWithDetails(userId);
        }
      }, 300),
    [debounce, unfollowUser, getFollowersWithDetails]
  );

  const navigateToProfile = useCallback(
    (userId: string) => router.push(`/profile/${userId}`),
    [router]
  );
  const handleMessage = useCallback(
    (userId: string) => router.push(`/messages/${userId}`),
    [router]
  );

  const truncateName = (firstName: string, lastName: string, maxLength = 20) => {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.length > maxLength ? `${fullName.substring(0, maxLength - 3)}...` : fullName;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      {isLoading && (
        <div className="text-center py-4">
          <span className="loading loading-spinner loading-md text-blue-500 dark:text-blue-400"></span>
        </div>
      )}

      {!isLoading && followers.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No followers available.
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 dark:text-red-400 py-4">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {followers.map((user) => {
            const status = userStatuses[user._id!] || { isLoading: false };
            const isFollowing = following.some((f) => f._id === user._id);
            const isMutual = user.isMutual;
            const isCurrentUser = user._id === currentUser?._id;

            const buttonConfig = {
              UNFOLLOW: {
                icon: "person-remove",
                text: "Unfollow",
                class: "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white",
                action: () => handleUnfollow(user._id!),
              },
              FOLLOW_BACK: {
                icon: "person-add",
                text: "Follow Back",
                class: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
                action: () => handleFollow(user._id!),
              },
            };

            const config = isFollowing ? buttonConfig.UNFOLLOW : buttonConfig.FOLLOW_BACK;

            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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
                        {truncateName(user.firstName || "", user.lastName || "")}
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

                {!isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      disabled={status.isLoading}
                      onClick={config.action}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition transform ${config.class}`}
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
                            <path
                              d={
                                config.icon === "person-add"
                                  ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                  : "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM8 8h8"
                              }
                            />
                          </svg>
                          {config.text}
                        </>
                      )}
                    </motion.button>
                    {isFollowing && (
                      <motion.button
                        disabled={status.isLoading}
                        onClick={() => handleMessage(user._id!)}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition transform bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                        aria-label="Message"
                      >
                        <svg
                          className="w-4 h-4 inline-block"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1zm-3-7H8c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z" />
                        </svg>
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OtherFollowers;