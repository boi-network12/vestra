"use client";

import { createContext, ReactNode, useCallback, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { API_URL } from "@/config/apiConfig";
import { User } from "@/types/user";

interface FriendContextType {
  suggestedUsers: User[];
  following: User[];
  followers: User[];
  blockedUsers: User[];
  pendingFollowRequests: { user: User }[];
  privacySettings: {
    profileVisibility: "public" | "followers" | "private";
    showLocation: boolean;
    showEmail: boolean;
  };
  isLoading: boolean;
  error: string | null;
  getSuggestedUsers: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: User[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  followUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
    followStatus?: "FOLLOWING" | "REQUESTED" | "FOLLOW";
  }>;
  unfollowUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  acceptFollowRequest: (userId: string) => Promise<{ success: boolean; message: string }>;
  rejectFollowRequest: (userId: string) => Promise<{ success: boolean; message: string }>;
  cancelFollowRequest: (userId: string) => Promise<{ success: boolean; message: string }>;
  getFollowing: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: User[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  getFollowers: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: User[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  blockUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  unblockUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  getBlockedUsers: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: User[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  getPendingFollowRequests: (page?: number, limit?: number) => Promise<{
    success: boolean;
    data?: { user: User }[];
    meta?: { total: number; page: number; limit: number };
    message?: string;
  }>;
  updatePrivacySettings: (settings: Partial<{
    profileVisibility: "public" | "followers" | "private";
    showLocation: boolean;
    showEmail: boolean;
  }>) => Promise<{
    success: boolean;
    data?: {
      profileVisibility: "public" | "followers" | "private";
      showLocation: boolean;
      showEmail: boolean;
    };
    message?: string;
  }>;
  showAlert: (message: string, type?: "info" | "success" | "error") => void;
}

export const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [pendingFollowRequests, setPendingFollowRequests] = useState<{ user: User }[]>([]);
  const [privacySettings, setPrivacySettings] = useState<{
    profileVisibility: "public" | "followers" | "private";
    showLocation: boolean;
    showEmail: boolean;
  }>({
    profileVisibility: "public",
    showLocation: false,
    showEmail: false,
  });

  const showAlert = (message: string, type: "info" | "success" | "error" = "info") => {
    toast[type](message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const validateUserId = (userId: string): boolean => {
    return typeof userId === "string" && userId.length === 24; // MongoDB ObjectId length
  };

  const getSuggestedUsers = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    setSuggestedUsers([]);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/suggested`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSuggestedUsers(response.data.data);
        console.log("Suggested users fetched successfully");
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch suggested users");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to fetch suggested users";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const followUser = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${API_URL}/api/friends/follow`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuggestedUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, followStatus: response.data.followStatus } : user
          )
        );
        if (response.data.followStatus === "FOLLOWING") {
          setFollowing((prev) => [...prev, { _id: userId } as User]);
        } else if (response.data.followStatus === "REQUESTED") {
          setPendingFollowRequests((prev) => [...prev, { user: { _id: userId } as User }]);
        }
        await Promise.all([getSuggestedUsers(), getFollowing(), getPendingFollowRequests()]);
        showAlert(response.data.message, "success");
        return {
          success: true,
          message: response.data.message,
          followStatus: response.data.followStatus,
        };
      } else {
        throw new Error(response.data.message || "Failed to follow user");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to follow users";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setFollowing((prev) => prev.filter((user) => user._id !== userId));
      setSuggestedUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, followStatus: "FOLLOW" } : user
        )
      );

      const response = await axios.post(
        `${API_URL}/api/friends/unfollow`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await getSuggestedUsers();
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to unfollow user");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to unfollow user";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await Promise.all([getFollowing(), getSuggestedUsers()]);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFollowRequest = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPendingFollowRequests((prev) => prev.filter((req) => req.user._id !== userId));
      setFollowers((prev) => [...prev, { _id: userId } as User]);

      const response = await axios.post(
        `${API_URL}/api/friends/accept-follow-request`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await Promise.all([getFollowers(), getPendingFollowRequests(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to accept follow request");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to accept follow request";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await Promise.all([getFollowers(), getPendingFollowRequests(), getSuggestedUsers()]);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const rejectFollowRequest = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPendingFollowRequests((prev) => prev.filter((req) => req.user._id !== userId));

      const response = await axios.post(
        `${API_URL}/api/friends/reject-follow-request`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await getPendingFollowRequests();
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to reject follow request");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to reject follow request";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await getPendingFollowRequests();
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelFollowRequest = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPendingFollowRequests((prev) => prev.filter((req) => req.user._id !== userId));
      setSuggestedUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, followStatus: "FOLLOW" } : user
        )
      );

      const response = await axios.post(
        `${API_URL}/api/friends/cancel-follow-request`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await getSuggestedUsers();
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to cancel follow request");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to cancel follow request";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await Promise.all([getPendingFollowRequests(), getSuggestedUsers()]);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const getFollowing = async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/following`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFollowing(response.data.data);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch following list");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to fetch following list";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const getFollowers = async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/followers`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFollowers(response.data.data);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch followers list");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to fetch followers list";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const blockUser = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setBlockedUsers((prev) => [...prev, { _id: userId } as User]);

      const response = await axios.post(
        `${API_URL}/api/friends/block`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await Promise.all([getBlockedUsers(), getFollowing(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to block user");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to block user";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await Promise.all([getBlockedUsers(), getFollowing(), getSuggestedUsers()]);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));

      const response = await axios.post(
        `${API_URL}/api/friends/unblock`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        await Promise.all([getBlockedUsers(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to unblock user");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to unblock user";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      await Promise.all([getBlockedUsers(), getSuggestedUsers()]);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const getBlockedUsers = async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/blocked`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBlockedUsers(response.data.data);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch blocked users");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to fetch blocked users";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const getPendingFollowRequests = async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/pending-follow-requests`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPendingFollowRequests(response.data.data);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch pending follow requests");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to fetch pending follow requests";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const validatePrivacySettings = (settings: Partial<{
    profileVisibility: "public" | "followers" | "private";
    showLocation: boolean;
    showEmail: boolean;
  }>): boolean => {
    const validVisibilities = ["public", "followers", "private"];
    if (settings.profileVisibility && !validVisibilities.includes(settings.profileVisibility)) {
      return false;
    }
    if (settings.showLocation !== undefined && typeof settings.showLocation !== "boolean") {
      return false;
    }
    if (settings.showEmail !== undefined && typeof settings.showEmail !== "boolean") {
      return false;
    }
    return true;
  };

  const updatePrivacySettings = async (settings: Partial<{
    profileVisibility: "public" | "followers" | "private";
    showLocation: boolean;
    showEmail: boolean;
  }>) => {
    if (!validatePrivacySettings(settings)) {
      setError("Invalid privacy settings");
      showAlert("Invalid privacy settings", "error");
      return { success: false, message: "Invalid privacy settings" };
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPrivacySettings((prev) => ({ ...prev, ...settings }));

      const response = await axios.patch(
        `${API_URL}/api/friends/privacy-settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPrivacySettings(response.data.data);
        showAlert("Privacy settings updated successfully!", "success");
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || "Failed to update privacy settings");
      }
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = "Failed to update privacy settings";
      }
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FriendContext.Provider
      value={{
        suggestedUsers,
        following,
        followers,
        blockedUsers,
        pendingFollowRequests,
        privacySettings,
        isLoading,
        error,
        getSuggestedUsers,
        followUser,
        unfollowUser,
        acceptFollowRequest,
        rejectFollowRequest,
        cancelFollowRequest,
        getFollowing,
        getFollowers,
        blockUser,
        unblockUser,
        getBlockedUsers,
        getPendingFollowRequests,
        updatePrivacySettings,
        showAlert,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};