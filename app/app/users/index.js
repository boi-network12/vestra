// Users.js
import { SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { useRouter } from 'expo-router';
import UsersHeader from '../../components/headers/UsersHeader';
import { useFriends } from '../../hooks/useFriend';
import SuggestedFriends from '../../components/users/SuggestedFriends';

export default function Users() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    getSuggestedUsers,
    suggestedUsers,
    followUser,
    unfollowUser,
    isLoading,
    error,
    getPendingFollowRequests,
    pendingFollowRequests,
    following,
    cancelFollowRequest,
    rejectFollowRequest,
  } = useFriends();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  useEffect(() => {
    getSuggestedUsers();
  }, [getSuggestedUsers]);

  const handleToggleFollow = (userId, isFollowing) => {
    console.log(`User ${userId} ${isFollowing ? 'followed' : 'unfollowed'}`);
  };

  if (!user) return null;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <UsersHeader
        colors={colors}
        onBackPress={() => router.back()}
        title="Discover people"
      />
      <SuggestedFriends
        onToggleHandleAction={handleToggleFollow}
        suggestedUsers={suggestedUsers}
        followUser={followUser}
        unfollowUser={unfollowUser}
        isLoading={isLoading}
        error={error}
        router={router}
        colors={colors}
        getSuggestedUsers={getSuggestedUsers}
        cancelFollowRequest={cancelFollowRequest}
        getPendingFollowRequests={getPendingFollowRequests}
        pendingFollowRequests={pendingFollowRequests}
        following={following}
        rejectFollowRequest={rejectFollowRequest}
      />
    </SafeAreaView>
  );
}