// import { useUser } from "@/hooks/userHooks";
import { User } from "./user";

export interface SettingsComponentProps {
  user: User | null;
  logout: () => Promise<void>;
  updateProfile: (
    userData: Partial<User["profile"]>,
    avatarFile?: File,
    coverPhotoFile?: File
  ) => Promise<boolean>;
  updateUser: (
    userData: Partial<Pick<User, "username" | "email" | "phoneNumber">>
  ) => Promise<boolean>;
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
}