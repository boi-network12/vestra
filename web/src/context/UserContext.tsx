"use client";

import { createContext, ReactNode, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/authHooks";
import { User } from "@/types/user";
import { API_URL } from "@/config/apiConfig";
import { ToastType } from "@/types/toast";
import axios, { AxiosError } from "axios";

interface UserContextType {
  userProfile: User | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (
    profileData: Partial<User["profile"]>,
    avatarFile?: File,
    coverPhotoFile?: File
  ) => Promise<boolean>;
  hideAlert: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { fetchUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
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

  const updateProfile = async (
    profileData: Partial<User["profile"]>,
    avatarFile?: File,
    coverPhotoFile?: File
  ): Promise<boolean> => {
    const token = localStorage.getItem("token");

    if (!token) return false;

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

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isLoading,
        error,
        updateProfile,
        hideAlert,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};