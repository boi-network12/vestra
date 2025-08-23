export interface User {
  _id?: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  password?: string; 
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    links?: {
      title?: string;
      url?: string;
    }[];
    avatar?: string;
    coverPhoto?: string;
    location?: {
      city?: string;
      country?: string;
      coordinates?: [number, number];
    };
    culturalBackground?: 'African' | 'African-American' | 'Caribbean' | 'Other' | 'Prefer not to say';
    interests?: string[];
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say'; 
  };
  subscription?: {
    plan: 'Basic' | 'Premium' | 'Elite';
    status: 'active' | 'inactive' | 'expired';
    expiryDate?: Date;
    features?: {
      blueTick: boolean;
      dailyPostLimit: number;
      analyticsAccess: boolean;
      prioritySupport: boolean;
    };
  };
  role?: 'user' | 'moderator' | 'admin';
  isVerified?: boolean;
  verificationMethod?: 'email' | 'manual';
  verificationToken?: string;
  verificationTokenExpires?: Date;
  sessions?: {
    token: string;
    device?: string;
    ipAddress?: string;
    lastActive?: Date;
    active?: boolean;
  }[];
  followers?: string[]; 
  following?: string[];
  blockedUsers?: string[];
  linkedAccounts?: string[];
  verificationAttempts?: {
    count: number;
    lastAttempt?: Date;
  };
  privacySettings?: {
    profileVisibility: 'public' | 'followers' | 'private';
    showLocation: boolean;
    showEmail: boolean;
  };
  notificationSettings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    mentions: boolean;
    follows: boolean;
  };
  isDelete?: boolean;
  deleteAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginData {
  email: string;
  password: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

// types/user.ts