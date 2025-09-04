"use client";

import { createContext, ReactNode, useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/authHooks";
import { User } from "@/types/user";
import { API_URL } from "@/config/apiConfig";
import { ToastType } from "@/types/toast";
import axios, { AxiosError } from "axios";

interface UserContextType {
  userProfile: User | null;
  otherUserProfile: User | null;
  isLoading: boolean;
  error: string | null;
  alert: { visible: boolean; message: string; type: ToastType };
  checkUsername: (username: string) => Promise<{
    success: boolean;
    available: boolean;
    message: string;
  }>;
  checkEmail: (email: string) => Promise<{
    success: boolean;
    available: boolean;
    message: string;
  }>;
  checkPhone: (phoneNumber: string) => Promise<{
    success: boolean;
    available: boolean;
    message: string;
  }>;
  updateProfile: (
    profileData: Partial<User["profile"]>,
    avatarFile?: File,
    coverPhotoFile?: File
  ) => Promise<boolean>;
  updateUser: (
    userData: Partial<Pick<User, "username" | "email" | "phoneNumber">>
  ) => Promise<boolean>;
  getOtherUserDetails: (profileId: string) => Promise<{
    success: boolean;
    message: string;
    data?: User| undefined;
  }>;
  showAlert: (message: string, type?: ToastType) => void;
  hideAlert: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { fetchUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "info",
  });

  const showAlert = (message: string, type: ToastType = "info") => {
    setAlert({ visible: true, message, type });
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const hideAlert = () =>
    setAlert({ ...alert, visible: false, message: "", type: "info" });

  // === Validation functions ===
  const checkUsername = async (username: string) => {
    if (!username) {
      return { success: false, available: false, message: "Username is required" };
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/users/check-username`, {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as { success: boolean; available: boolean; message: string };
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Username check error:", error.response?.data || error);
      return {
        success: false,
        available: false,
        message: error.response?.data?.message || "Error checking username",
      };
    }
  };

  const checkEmail = async (email: string) => {
    if (!email) {
      return { success: false, available: false, message: "Email is required" };
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/users/check-email`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as { success: boolean; available: boolean; message: string };
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Email check error:", error.response?.data || error);
      return {
        success: false,
        available: false,
        message: error.response?.data?.message || "Error checking email",
      };
    }
  };

  const checkPhone = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return { success: false, available: false, message: "Phone is required" };
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/users/check-phone`, {
        params: { phoneNumber },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as { success: boolean; available: boolean; message: string };
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Phone check error:", error.response?.data || error);
      return {
        success: false,
        available: false,
        message: error.response?.data?.message || "Error checking phone",
      };
    }
  };


  const updateProfile = async (
    profileData: Partial<User["profile"]>,
    avatarFile?: File,
    coverPhotoFile?: File
  ): Promise<boolean> => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No authentication token found");
      showAlert("Please log in to update your profile", "error");
      return false;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Append text fields
      Object.entries(profileData as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "links" || key === "location") {
            formData.append(key, JSON.stringify(value));
          } else if (key === "dateOfBirth" && value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (key === "interests" && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "string") {
            formData.append(key, value);
          }
        }
      });


      // Append avatar file
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Append cover photo file
      if (coverPhotoFile) {
        formData.append("coverPhoto", coverPhotoFile);
      }

      const response = await axios.put(`${API_URL}/api/users/me`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setUserProfile(response.data.data);
      await fetchUser();
      setError(null);
      showAlert("Profile updated successfully!", "success");
      return true;
    } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error("Update profile error:", error.response?.data || error);

        setError(error.response?.data?.message || "Failed to update profile");
        showAlert(error.response?.data?.message || "Failed to update profile", "error");
        return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (
  userData: Partial<Pick<User, "username" | "email" | "phoneNumber">>
): Promise<boolean> => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("No authentication token found");
    showAlert("Please log in to update your account", "error");
    return false;
  }

  setIsLoading(true);
  try {
    const response = await axios.put(
      `${API_URL}/api/users/me`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setUserProfile(response.data.data);
    await fetchUser();
    setError(null);
    showAlert("Account updated successfully!", "success");
    return true;
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Update user error:", error.response?.data || error);
    setError(error.response?.data?.message || "Failed to update account");
    showAlert(error.response?.data?.message || "Failed to update account", "error");
    return false;
  } finally {
    setIsLoading(false);
  }
};

const getOtherUserDetails = useCallback(async (profileId: string): Promise<{
  success: boolean;
  message: string;
  data?: User | undefined;
}> => {
  if (!profileId) {
    setError("Profile ID is required");
    showAlert("Profile ID is required", "error");
    return { success: false, message: "Profile ID is required" };
  }
  setIsLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      showAlert("Please log in to fetch user details", "error");
      return { success: false, message: "No authentication token found" };
    }
    const response = await axios.get(`${API_URL}/api/users/user-detail/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData: User = response.data.data;
    setOtherUserProfile(userData);
    setError(null);
    return { success: true, message: "User details fetched successfully", data: userData };
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Get other user details error:", error.response?.data || error);
    const errorMessage = error.response?.data?.message || "Failed to fetch user details";
    setError(errorMessage);
    showAlert(errorMessage, "error");
    return { success: false, message: errorMessage };
  } finally {
    setIsLoading(false);
  }
}, [setError, setOtherUserProfile]); 


  return (
    <UserContext.Provider
      value={{
        userProfile,
        otherUserProfile,
        isLoading,
        error,
        alert,
        checkUsername,
        checkEmail,
        checkPhone,
        updateProfile,
        updateUser,
        getOtherUserDetails,
        showAlert,
        hideAlert,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};