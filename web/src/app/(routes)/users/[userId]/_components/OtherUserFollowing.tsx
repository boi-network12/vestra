"use client";

import { FC, useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/types/user";
import { motion, AnimatePresence } from "framer-motion";
import { useFriends } from "@/hooks/FriendHooks";

interface FollowingProps {
  following: User[];
  unfollowUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  error: string | null;
  getFollowingWithDetails: (
    userId: string,
    page?: number | undefined,
    limit?: number | undefined
  ) => Promise<{
    success: boolean;
    data?: User[] | undefined;
    meta?: { total: number; page: number; limit: number } | undefined;
    message?: string | undefined;
  }>;
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

const OtherUserFollowing: FC<FollowingProps> = ({
  following,
  unfollowUser,
  isLoading,
  error,
  getFollowingWithDetails,
  currentUser,
}) => {
  const router = useRouter();
  const { showAlert } = useFriends();
  const params = useParams<{ userId?: string }>();
  const userId = params?.userId || "";
  const debounce = useDebounce();
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: { isLoading: boolean } }>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [confirmUsername, setConfirmUsername] = useState<string>("");

  
  // Reset userStatuses when following changes
  useEffect(() => {
    setUserStatuses({});
    if (userId) {
      getFollowingWithDetails(userId); // Fetch following list for the specific user
    }
  }, [following, userId, getFollowingWithDetails]);

  // Handlers with debounce
  const handleUnfollow = useMemo(
    () =>
      debounce(async (userIdToUnfollow: string, isMutual: boolean) => {
        if (isMutual) {
          const user = following.find((u) => u._id === userIdToUnfollow);
          setConfirmUserId(userIdToUnfollow);
          setConfirmUsername(user?.username || "this user");
          setIsConfirmOpen(true);
        } else {
          setUserStatuses((prev) => ({
            ...prev,
            [userIdToUnfollow]: { ...prev[userIdToUnfollow], isLoading: true },
          }));
          const result = await unfollowUser(userIdToUnfollow);
          setUserStatuses((prev) => ({
            ...prev,
            [userIdToUnfollow]: { ...prev[userIdToUnfollow], isLoading: false },
          }));
          if (result.success) {
            showAlert(result.message, "success");
            if (userId) {
              await getFollowingWithDetails(userId); // Pass userId
            }
          } else {
            showAlert(result.message, "error");
          }
        }
      }, 300),
    [debounce, unfollowUser, getFollowingWithDetails, showAlert, following, userId]
  );

  const confirmUnfollow = useMemo(
    () =>
      debounce(async (userIdToUnfollow: string) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userIdToUnfollow]: { ...prev[userIdToUnfollow], isLoading: true },
        }));
        const result = await unfollowUser(userIdToUnfollow);
        setUserStatuses((prev) => ({
          ...prev,
          [userIdToUnfollow]: { ...prev[userIdToUnfollow], isLoading: false },
        }));
        if (result.success) {
          showAlert(result.message, "success");
          if (userId) {
            await getFollowingWithDetails(userId); // Pass userId
          }
        } else {
          showAlert(result.message, "error");
        }
        setIsConfirmOpen(false);
        setConfirmUserId(null);
        setConfirmUsername("");
      }, 300),
    [debounce, unfollowUser, getFollowingWithDetails, showAlert, userId]
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
      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-glass backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Unfollow User
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Are you sure you want to unfollow @{confirmUsername}?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setConfirmUserId(null);
                    setConfirmUsername("");
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmUserId && confirmUnfollow(confirmUserId)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  Unfollow
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {isLoading && (
        <div className="text-center py-4">
          <span className="loading loading-spinner loading-md text-blue-500 dark:text-blue-400"></span>
        </div>
      )}

      {!isLoading && following.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          You are not following anyone.
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 dark:text-red-400 py-4">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {following.map((user) => {
            const status = userStatuses[user._id!] || { isLoading: false };
            const isMutual = user.isMutual;
            const isCurrentUser = user._id === currentUser?._id;

            const buttonConfig = {
              UNFOLLOW: {
                icon: "person-remove",
                text: "Unfollow",
                class: "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white",
                action: () => handleUnfollow(user._id!, false),
              },
              MUTUAL: {
                icon: "people",
                text: "Friends",
                class: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
                action: () => handleUnfollow(user._id!, true),
              },
            };

            const config = isMutual ? buttonConfig.MUTUAL : buttonConfig.UNFOLLOW;

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
                                config.icon === "person-remove"
                                  ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM8 8h8"
                                  : "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                              }
                            />
                          </svg>
                          {config.text}
                        </>
                      )}
                    </motion.button>
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

export default OtherUserFollowing;