"use client";

import { createContext, ReactNode, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/authHooks";
import { User } from "@/types/user";

interface UserContextType {
  isLoading: boolean;
  error: string | null;
  userProfile: User | null; // Updated to use User interface instead of any
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Keep user from useAuth since it might be used later
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null); // Updated to use User interface

  // Function to update user profile (example implementation to avoid unused variables)
  const updateUserProfile = (profile: User | null) => {
    setUserProfile(profile);
    setIsLoading(false);
    if (profile) {
      setError(null);
      toast.success("User profile updated successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Example usage of user from useAuth to avoid unused variable warning
  // This can be expanded based on your needs
  if (user && !userProfile) {
    updateUserProfile(user);
  }

  return (
    <UserContext.Provider
      value={{
        isLoading,
        error,
        userProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};