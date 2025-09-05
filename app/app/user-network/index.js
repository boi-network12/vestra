import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { useFriends } from '../../hooks/useFriend';
import UsersHeader from '../../components/headers/UsersHeader';
import { router } from 'expo-router';
import { withOpacity } from '../../utils/colorUtils';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import SuggestedFriends from '../../components/users/SuggestedFriends';
import Followers from './_components/Followers';
import Following from './_components/Following';



export default function UserNetwork() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { 
        getFollowingWithDetails, 
        getFollowersWithDetails, 
        suggestedUsers, 
        following, 
        followers, 
        isLoading, 
        error,
        getSuggestedUsers,
        followUser,
        unfollowUser,
        getPendingFollowRequests,
        pendingFollowRequests,
        cancelFollowRequest,
        rejectFollowRequest,
        setFollowers,
        setFollowing
} = useFriends();
  const [selectedTab, setSelectedTab] = useState('Followers');
  const [searchQuery] = useState('');



  useEffect(() => {
    if (user) {
      setFollowers([]);
      setFollowing([]);
      getFollowersWithDetails();
      getFollowingWithDetails();
    }
  }, [user, getFollowersWithDetails, getFollowingWithDetails, setFollowers, setFollowing]);

  const handleToggleFollow = (userId, isFollowing) => {
    console.log(`User ${userId} ${isFollowing ? 'followed' : 'unfollowed'}`);
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    if (tab === 'Users') {
      getSuggestedUsers(); 
    } else if (tab === "Followers") {
        getFollowersWithDetails()
    } else {
        getFollowingWithDetails()
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Followers':
        return <Followers
                    followers={followers}
                    followUser={followUser}
                    unfollowUser={unfollowUser}
                    isLoading={isLoading}
                    error={error}
                    router={router}
                    colors={colors}
                    getFollowersWithDetails={getFollowersWithDetails}
                    following={following}
                />;
      case 'Following':
        return <Following
                    following={following}
                    unfollowUser={unfollowUser}
                    isLoading={isLoading}
                    error={error}
                    router={router}
                    colors={colors}
                    getFollowingWithDetails={getFollowingWithDetails}
                />;
      case 'Users':
        return <SuggestedFriends
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
              />;
      default:
        return null;
    }
  };

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
        title={selectedTab} // Dynamically update header title
      />
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Followers' && styles.activeTab]}
          onPress={() => handleTabPress('Followers')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Followers' ? colors.primary : withOpacity(colors.text, 80) }]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Following' && styles.activeTab]}
          onPress={() => handleTabPress('Following')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Following' ? colors.primary : withOpacity(colors.text, 80) }]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Users' && styles.activeTab]}
          onPress={() => handleTabPress('Users')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Users' ? colors.primary : withOpacity(colors.text, 80) }]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>}

      {/*  */}
      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "flex-end",
    paddingTop: hp(2),
    paddingHorizontal: hp(2),
    borderBottomWidth: 1,
  },
  tab: {
    padding: hp(1),
    width: hp("13%"),
    alignItems: 'center',
    justifyContent: "center"
  },
  activeTab: {
    borderBottomWidth: hp(0.2),
    borderBottomColor: '#007AFF',
    borderRadius: hp(0.02)
  },
  tabText: {
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  listItem: {
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    margin: 10,
    fontSize: 14,
  },
});