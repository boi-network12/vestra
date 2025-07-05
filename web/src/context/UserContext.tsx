"use client";
import { useAuth } from "@/hooks/authHooks";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useState } from "react";
import { toast } from "react-toastify";


interface ApiErrorResponse {
    message?: string;
}

interface UserContextType {
    isLoading: boolean;
    error: string | null;
    userProfile: any;
}

export const UserContext = createContext<UserContextType | undefined> (undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();


    const showAlert = (
        message: string,
        type: "info" | "success" | "error" = "info"
    ) => {
        toast[type](message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    return (
        <UserContext.Provider
           value={{
              isLoading,
              error,
           }}
        >
            {children}
        </UserContext.Provider>
    )
}