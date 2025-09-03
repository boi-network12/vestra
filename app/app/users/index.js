// Users.js
import { SafeAreaView, Platform, StatusBar as RNStatusBar, View, TextInput, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from "expo-status-bar";
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { useRouter } from 'expo-router';
import UsersHeader from '../../components/headers/UsersHeader';
import { useFriends } from '../../hooks/useFriend';
import SuggestedFriends from '../../components/users/SuggestedFriends';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

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
  const [searchQuery, setSearchQuery] = useState('');

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
      <StatusBar style='auto' />
      <UsersHeader
        colors={colors}
        onBackPress={() => router.back()}
        title="Discover people"
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={hp(2.2)} color={colors.subText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search friends..."
          placeholderTextColor={colors.subText}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          selectionColor={colors.subText}
          onChangeText={setSearchQuery}
        />
      </View>

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
        searchQuery={searchQuery}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: hp(1.5),
    height: hp(5.5),
    marginHorizontal: hp(1),
    marginTop: hp(1),
    borderRadius: hp(1.7),
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  searchIcon: {
    marginRight: hp(1),
  },
});