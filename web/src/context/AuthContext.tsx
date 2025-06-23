"use client";

import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
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
  alert: { visible: boolean; message: string; type: "info" | "success" | "error" };
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  verifyUser: (code: string) => Promise<boolean>;
  resendVerificationCode: (data: { email: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hideAlert: () => void;
  linkAccount: (data: LoginData) => Promise<boolean>;
  switchAccount: (accountId: string) => Promise<boolean>;
}


interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
//   middleName?: string;
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

// AuthProvider components
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{
        visible: boolean;
        message: string;
        type: "info" | "success" | "error";
    }>({ visible: false, message: "", type: "info" });
    const router = useRouter();

    const showAlert = (message: string, type: "info" | "success" | "error" = "info") => {
        setAlert({ visible: true, message, type });
        toast[type](message, { position: "top-right" });
    };

    const hideAlert = () => {
        setAlert({ ...alert, visible: false });
    };

    const getUserLocation = async (): Promise<{
        latitude: number | null;
        longitude: number | null;
        city: string;
        country: string
    }> => {
        try {
            if (!navigator.geolocation) {
                console.log("Geolocation not support");
                return { latitude: null, longitude: null, city: "unknown", country: "unknown"}
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            // Optional: Reverse geocoding (e.g., using a third-party API like Google Maps or OpenStreetMap)
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
    }

    const fetchLinkedAccounts = useCallback(async (token: string) => {
        try {
        const response = await axios.get(`${API_URL}/api/auth/linked-accounts`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
            setLinkedAccounts(response.data.data);
        } else {
            showAlert("Failed to fetch linked accounts", "error");
        }
        } catch (err) {
        console.error("Error fetching linked accounts:", err);
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            return;
        }

        const response = await axios.get(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
            setUser(response.data.data);
            await fetchLinkedAccounts(token);
        } else {
            setUser(null);
            localStorage.removeItem("token");
        }
        } catch (err) {
            const error = err as AxiosError;
            console.error("Error checking auth:", error);
            setUser(null);
            localStorage.removeItem("token");
            if (error.response?.status === 401) {
                showAlert(
                "Your account no longer exists or the session is invalid. Please register or log in.",
                "error"
                );
            } else {
                showAlert("An error occurred while checking authentication.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    }, [fetchLinkedAccounts]);


    const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const location = await getUserLocation();
      console.log("Location sent to backend for login:", location);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        ...data,
        location,
      });

      const { success, data: responseData } = response.data;

      if (success) {
        localStorage.setItem("token", responseData.token);
        setUser({
          _id: responseData._id,
          email: responseData.email,
          username: responseData.username,
          isVerified: responseData.isVerified,
        });
        setLinkedAccounts(responseData.activeSessions || []);
        setError(null);
        showAlert("Login successful!", "success");
        await fetchLinkedAccounts(responseData.token);
        router.replace("/home"); // Redirect to home
        return true;
      } else {
        throw new Error("Login failed");
      }
    } catch (err: unknown) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMsg = error.response?.data?.message || error.message || "Login failed";
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
      console.log("Location sent to backend:", location);

      const response = await axios.post(`${API_URL}/api/auth/register`, {
        ...data,
        location,
      });

      const { success, data: responseData } = response.data;

      if (success) {
        console.log("Registration successful, token:", responseData.token);
        localStorage.setItem("token", responseData.token);
        setUser({
          _id: responseData._id,
          email: responseData.email,
          username: responseData.username,
          isVerified: false,
        });
        setError(null);
        showAlert("Registration successful! Please verify your email.", "success");
        router.push("/verify"); // Redirect to verification page
        return true;
      } else {
        throw new Error("Registration failed");
      }
    } catch (err: unknown) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMsg = error.response?.data?.message || error.message || "Login failed";
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
      console.log("Verifying OTP:", code);
      const response = await axios.post(`${API_URL}/api/auth/verify`, { code });
      console.log("Verification response:", response.data);

      if (response.data.success) {
            // Ensure user exists and email is defined
            if (user && user.email) {
                setUser({ ...user, isVerified: true });
                showAlert("Account verified successfully!", "success");
                router.replace("/home");
                return true;
            }
            throw new Error("User not found");
        }
        return false;

    } catch (err: unknown) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMsg = error.response?.data?.message || "Verification failed";
        console.error("Verification error:", error);
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
        console.log("Resending OTP for email:", data.email);
        const response = await axios.post(`${API_URL}/api/auth/resend-verification`, data);
        console.log("Resend response:", response.data);

        if (response.data.success) {
            setError(null);
            showAlert("New OTP sent to your email", "success");
            return true;
        }
        return false;
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>;
            const errorMsg = error.response?.data?.message || "Failed to resend OTP";
            console.error("Resend error:", error);
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

            const response = await axios.post(
                `${API_URL}/api/auth/link-account`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { success } = response.data;

            if (success) {
                await fetchLinkedAccounts(token);
                showAlert("Account linked successfully!", "success");
                return true;
            }
            throw new Error("Failed to link account");
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

            const { success, data } = response.data;

            if (success) {
                localStorage.setItem("token", data.token);
                setUser({
                    _id: data._id,
                    email: data.email,
                    username: data.username,
                });
                await fetchLinkedAccounts(data.token);
                showAlert("Switched account successfully!", "success");
                router.replace("/home");
                return true;
            }
            throw new Error("Failed to switch account");
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

    const logout = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/api/auth/logout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            localStorage.removeItem("token");
            setUser(null);
            setLinkedAccounts([]);
            setError(null);
            showAlert("Logged out successfully!", "success");
            router.replace("/login");
        } catch (err: unknown) {
            const error = err as AxiosError;
            setError("Logout failed");
            console.error("Error logging out:", error);
            showAlert("Logout failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

  useEffect(() => {
    checkAuth();
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        linkedAccounts,
        isLoading,
        error,
        alert,
        register,
        login,
        verifyUser,
        resendVerificationCode,
        logout,
        checkAuth,
        hideAlert,
        linkAccount,
        switchAccount,
      }}
    >
        {children}
    </AuthContext.Provider>
  )
}