import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useTheme } from '../../../context/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { useFriends } from '../../../hooks/useFriend';
import { useAuth } from '../../../hooks/useAuth';
import { useUser } from '../../../hooks/useUser';
import UsersHeader from '../../../components/headers/UsersHeader';
import { withOpacity } from '../../../utils/colorUtils';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import Following from '../../user-network/_components/Following';
import Followers from '../../user-network/_components/Followers';

export default function ProfileScreen() {
        const { userId } = useLocalSearchParams()
      const { isDark } = useTheme();
      const colors = getThemeColors(isDark);
      const { 
            following, 
            followers, 
            isLoading, 
            error,
            followUser,
            unfollowUser,
            getOtherUserFollowersWithDetails,
            getOtherUserFollowingWithDetails,
            setFollowing,
            setFollowers,
    } = useFriends();
      const { user: currentUser } = useAuth();
      const { getOtherUserDetails } = useUser();
      const [selectedTab, setSelectedTab] = useState('Followers');

      

       useEffect(() => {
            if (userId && currentUser) {
                setFollowers([]);
                setFollowing([]);
                getOtherUserDetails(userId);
                getOtherUserFollowersWithDetails(userId)
                getOtherUserFollowingWithDetails(userId)
            }
        },[userId, currentUser, getOtherUserDetails, getOtherUserFollowersWithDetails, getOtherUserFollowingWithDetails, setFollowers, setFollowing]);
    

    const handleTabPress = (tab) => {
        setSelectedTab(tab);
       if (tab === "Followers") {
            getOtherUserFollowersWithDetails(userId)
        } else {
            getOtherUserFollowingWithDetails(userId)
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
                        getFollowersWithDetails={getOtherUserFollowersWithDetails}
                        following={following}
                        currentUser={currentUser}
                    />;
          case 'Following':
            return <Following
                        following={following}
                        unfollowUser={unfollowUser}
                        isLoading={isLoading}
                        error={error}
                        router={router}
                        colors={colors}
                        getFollowingWithDetails={getOtherUserFollowingWithDetails}
                        currentUser={currentUser}
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
          {/*  */}
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
                </View>

                {renderTabContent()}
        </SafeAreaView>
  )
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