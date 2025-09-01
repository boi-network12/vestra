"use client";

import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User } from "@/types/user";
import { API_URL } from "@/config/apiConfig";

interface LinkedAccount {
  _id: string;
  username: string;
  email: string;
  profile?: {
    avatar?: string;
  };
}

interface ApiErrorResponse {
  message?: string;
}

interface AuthContextType {
  user: User | null;
  linkedAccounts: LinkedAccount[];
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  verifyUser: (code: string) => Promise<boolean>;
  resendVerificationCode: (data: { email: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  linkAccount: (data: LoginData) => Promise<boolean>;
  switchAccount: (accountId: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyResetOtp: (email: string, code: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

interface LoginData {
  email: string;
  password: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const showAlert = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    toast[type](message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const getUserLocation = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
    city: string;
    country: string;
  }> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return { latitude: null, longitude: null, city: "unknown", country: "unknown" };
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const { address } = response.data;

      return {
        latitude,
        longitude,
        city: address.city || "unknown",
        country: address.country || "unknown",
      };
    } catch (err) {
      console.error("Error getting location:", err);
      return { latitude: null, longitude: null, city: "unknown", country: "unknown" };
    }
  };

  const fetchLinkedAccounts = useCallback(async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/linked-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setLinkedAccounts(response.data.data);
      } else {
        showAlert(response.data.message || "Failed to fetch linked accounts", "error");
      }
    } catch (err) {
      console.error("Error fetching linked accounts:", err);
      showAlert("Failed to fetch linked accounts", "error");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLinkedAccounts([]);
        return;
      }
      const response = await axios.get<{ success: boolean; data: User; message?: string }> (
        `${API_URL}/api/users/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success){
        setUser(response.data.data);
      } else {
        setUser(null);
        showAlert(response.data.message || "Failed to fetch user data", "error");
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      setUser(null);
      showAlert(
        error.response?.data?.message || "An error occurred while fetching user",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  },[])

  const checkAuth = useCallback(
  async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // Skip if user is already set
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUser(response.data.data);
        await fetchLinkedAccounts(token);
      } else {
        setUser(null);
        setLinkedAccounts([]);
        localStorage.removeItem("token");
        showAlert(response.data.message || "Session invalid", "error");
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      setUser(null);
      localStorage.removeItem("token");
      showAlert(
        error.response?.data?.message || "An error occurred while checking authentication",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  },
  [fetchLinkedAccounts]
);

  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const location = await getUserLocation();
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        ...data,
        location,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        setUser({
          _id: response.data.data._id,
          email: response.data.data.email,
          username: response.data.data.username,
          isVerified: response.data.data.isVerified,
        });
        setLinkedAccounts([]);
        setError(null);
        showAlert(response.data.message || "Login successful!", "success");
        await checkAuth(); 
        return true;
      } else {
        showAlert(response.data.message || "Login failed", "error");
        throw new Error(response.data.message || "Login failed");
      }
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "An error occurred during login";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const location = await getUserLocation();
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        ...data,
        location,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        setUser({
          _id: response.data.data._id,
          email: response.data.data.email,
          username: response.data.data.username,
          isVerified: false,
        });
        setLinkedAccounts([]);
        setError(null);
        // await checkAuth();
        return true;
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "An error occurred during registration";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUser = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify`, { code });

      if (response.data.success) {
        if (user && user.email) {
          setUser({ ...user, isVerified: true });
          showAlert(response.data.message || "Account verified successfully!", "success");
          localStorage.removeItem("pendingVerificationEmail");
          fetchUser();
          return true;
        }
        throw new Error("User not found");
      }
      throw new Error(response.data.message || "Verification failed");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Verification failed";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (data: { email: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/resend-verification`, data);

      if (response.data.success) {
        setError(null);
        showAlert(response.data.message || "New verification code sent to your email", "success");
        return true;
      }
      throw new Error(response.data.message || "Failed to resend verification code");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Failed to resend verification code";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const linkAccount = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(`${API_URL}/api/auth/link-account`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        await fetchLinkedAccounts(token);
        showAlert(response.data.message || "Account linked successfully!", "success");
        return true;
      }
      throw new Error(response.data.message || "Failed to link account");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Failed to link account";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (accountId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        `${API_URL}/api/auth/switch-account`,
        { accountId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        setUser({
          _id: response.data.data._id,
          email: response.data.data.email,
          username: response.data.data.username,
        });
        await fetchLinkedAccounts(response.data.data.token);
        await fetchUser();
        showAlert(response.data.message || "Switched account successfully!", "success");
        return true;
      }
      throw new Error(response.data.message || "Failed to switch account");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Failed to switch account";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });

      if (response.data.success) {
        setError(null);
        showAlert(response.data.message || "Password reset OTP sent to your email", "success");
        return true;
      }
      throw new Error(response.data.message || "Failed to send reset OTP");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Failed to send reset OTP";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyResetOtp = async (email: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-reset-otp`, { email, code });

      if (response.data.success) {
        setError(null);
        showAlert(response.data.message || "OTP verified successfully!", "success");
        return true;
      }
      throw new Error(response.data.message || "Invalid or expired OTP");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Invalid or expired OTP";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem("token");
      localStorage.removeItem("hasRedirected")
      setUser(null);
      setLinkedAccounts([]);
      setError(null);
      showAlert(response.data.message || "Logged out successfully!", "success");
      router.replace("/login");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Logout failed";
      setError(errorMsg);
      showAlert(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/auth/reset-password/${token}`, { password });

      if (response.data.success) {
        setError(null);
        showAlert(response.data.message || "Password reset successfully!", "success");
        return true;
      }
      throw new Error(response.data.message || "Failed to reset password");
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMsg = error.response?.data?.message || "Failed to reset password";
      setError(errorMsg);
      showAlert(errorMsg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Remove `user` from dependencies

  return (
    <AuthContext.Provider
      value={{
        user,
        linkedAccounts,
        isLoading,
        error,
        register,
        login,
        verifyUser,
        resendVerificationCode,
        logout,
        checkAuth,
        linkAccount,
        switchAccount,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        fetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};