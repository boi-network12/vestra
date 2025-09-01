import { createContext, useCallback, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../config/apiConfig";

export const FriendContext = createContext();

export const FriendProvider = ({ children }) => {
  const { showAlert, hideAlert } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingFollowRequests, setPendingFollowRequests] = useState([]);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showLocation: false,
    showEmail: false,
  });

  // Get suggested users
  const getSuggestedUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/suggested`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log('Suggested Users:', response.data.data);
        setSuggestedUsers(response.data.data);
        setError(null);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error("Failed to fetch suggested users");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch suggested users";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const validateUserId = (userId) => {
    return typeof userId === 'string' && userId.length === 24; // MongoDB ObjectId length
  };

  // Follow a user
const followUser = async (userId) => {
  console.log('Following user:', userId);
  if (!validateUserId(userId)) {
    const errorMsg = 'Invalid user ID';
    setError(errorMsg);
    if (showAlert) {
      showAlert(errorMsg, 'error');
    } else {
      console.warn('showAlert is undefined, unable to display error alert');
    }
    return { success: false, message: errorMsg };
  }
  setIsLoading(true);
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Token:', token);
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Optimistic update
    setFollowing((prev) => {
      console.log('Optimistic update: Adding userId', userId, 'to following');
      return [...prev, { _id: userId }];
    });
    setError(null);

    const response = await axios.post(
      `${API_URL}/api/friends/follow`,
      { userId },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // Set a 10-second timeout to handle slow responses
      }
    );

    console.log('Follow response:', response.data);

    if (response.data.success) {
      console.log('Follow successful, refreshing following and suggested users');
      try {
        await Promise.all([getFollowing(), getSuggestedUsers()]); // Refresh lists
      } catch (refreshErr) {
        console.error('Error refreshing lists:', refreshErr);
        // Don't throw here to avoid marking the follow as failed
      }
      if (showAlert) {
        showAlert(response.data.message, 'success');
      } else {
        console.warn('showAlert is undefined, unable to display success alert');
      }
      return { success: true, message: response.data.message };
    } else {
      throw new Error(response.data.message || 'Failed to follow user');
    }
  } catch (err) {
    console.error('Follow user error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    setFollowing((prev) => {
      console.log('Reverting optimistic update for userId', userId);
      return prev.filter((user) => user._id !== userId);
    });
    const errorMsg = err.response?.data?.message || 'Failed to follow user';
    setError(errorMsg);
    if (showAlert) {
      showAlert(errorMsg, 'error');
    } else {
      console.warn('showAlert is undefined, unable to display error alert:', errorMsg);
    }
    return { success: false, message: errorMsg };
  } finally {
    setIsLoading(false);
  }
};

  // Accept follow request
  const acceptFollowRequest = async (userId) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPendingFollowRequests((prev) => prev.filter((req) => req.user._id !== userId));
      setFollowers((prev) => [...prev, { _id: userId }]);
       setError(null);
      const response = await axios.post(
        `${API_URL}/api/friends/accept-follow-request`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        // Refresh followers and pending follow requests
        await Promise.all([getFollowers(), getPendingFollowRequests(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error("Failed to accept follow request");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to accept follow request";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Reject follow request
  const rejectFollowRequest = async (userId) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPendingFollowRequests((prev) => prev.filter((req) => req.user._id !== userId));
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/friends/reject-follow-request`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        
        showAlert(response.data.message, "success");
        // Refresh pending follow requests
        await getPendingFollowRequests();
        return { success: true, message: response.data.message };
      } else {
        throw new Error("Failed to reject follow request");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to reject follow request";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending follow requests
  const getPendingFollowRequests = async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `${API_URL}/api/friends/pending-follow-requests`,
        {
          params: { page, limit },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPendingFollowRequests(response.data.data);
        setError(null);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error("Failed to fetch pending follow requests");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch pending follow requests";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // In FriendProvider.js
const cancelFollowRequest = async (userId) => {
  setIsLoading(true);
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${API_URL}/api/friends/cancel-follow-request`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      setError(null);
      showAlert(response.data.message, "success");
      // Refresh pending follow requests
      await getPendingFollowRequests();
      return { success: true, message: response.data.message };
    } else {
      throw new Error("Failed to cancel follow request");
    }
  } catch (err) {
    const errorMsg =
      err.response?.data?.message || "Failed to cancel follow request";
    setError(errorMsg);
    showAlert(errorMsg, "error");
    return { success: false, message: errorMsg };
  } finally {
    setIsLoading(false);
  }
};

  // Unfollow a user
  const unfollowUser = async (userId) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${API_URL}/api/friends/unfollow`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setError(null);
        showAlert(response.data.message, "success");
        // Refresh following list
        await Promise.all([getFollowing(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error("Failed to unfollow user");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to unfollow user";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Get following list
  const getFollowing = async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/following`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log('Following:', response.data.data);
        setFollowing(response.data.data);
        setError(null);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error("Failed to fetch following list");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch following list";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Get followers list
  const getFollowers = async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/followers`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFollowers(response.data.data);
        setError(null);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error("Failed to fetch followers list");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch followers list";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Block a user
  const blockUser = async (userId) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setBlockedUsers((prev) => [...prev, { _id: userId }]);
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/friends/block`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // setError(null);
        showAlert(response.data.message, "success");
        // Refresh blocked users and following lists
        await Promise.all([getBlockedUsers(), getFollowing(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error("Failed to block user");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to block user";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Unblock a user
  const unblockUser = async (userId) => {
    if (!validateUserId(userId)) {
      setError("Invalid user ID");
      showAlert("Invalid user ID", "error");
      return { success: false, message: "Invalid user ID" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/friends/unblock`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert(response.data.message, "success");
        // Refresh blocked users list
        await Promise.all([getBlockedUsers(), getSuggestedUsers()]);
        return { success: true, message: response.data.message };
      } else {
        throw new Error("Failed to unblock user");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to unblock user";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Get blocked users
  const getBlockedUsers = async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/api/friends/blocked`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBlockedUsers(response.data.data);
        setError(null);
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        throw new Error("Failed to fetch blocked users");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch blocked users";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const validatePrivacySettings = (settings) => {
    const validVisibilities = ['public', 'followers', 'private'];
    if (settings.profileVisibility && !validVisibilities.includes(settings.profileVisibility)) {
      return false;
    }
    if (settings.showLocation !== undefined && typeof settings.showLocation !== 'boolean') {
      return false;
    }
    if (settings.showEmail !== undefined && typeof settings.showEmail !== 'boolean') {
      return false;
    }
    return true;
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings) => {
    if (!validatePrivacySettings(settings)) {
      setError("Invalid privacy settings");
      showAlert("Invalid privacy settings", "error");
      return { success: false, message: "Invalid privacy settings" };
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      setPrivacySettings((prev) => ({ ...prev, ...settings }));
      setError(null);
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
        throw new Error("Failed to update privacy settings");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update privacy settings";
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
        cancelFollowRequest,
        isLoading,
        error,
        getSuggestedUsers,
        followUser,
        unfollowUser,
        getFollowing,
        getFollowers,
        blockUser,
        unblockUser,
        getBlockedUsers,
        updatePrivacySettings,
        acceptFollowRequest,
        rejectFollowRequest,
        getPendingFollowRequests,
        showAlert,
        hideAlert,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};