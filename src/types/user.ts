export interface User {
  _id?: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  password?: string; // Only used when sending to backend
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    coverPhoto?: string;
    location?: {
      city?: string;
      country?: string;
      coordinates?: [number, number]; // [longitude, latitude]
    };
    culturalBackground?: 'African' | 'African-American' | 'Caribbean' | 'Other' | 'Prefer not to say';
    interests?: string[];
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
  followers?: string[]; // User IDs
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
  createdAt?: Date;
  updatedAt?: Date;
}
