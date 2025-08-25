import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Platform, RefreshControl, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, View, TouchableOpacity, Text,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import MenuModal from '../../../BottomSheet/MenuModal';
import SwitchAccountModal from '../../../BottomSheet/SwitchAccountModal';
import ProfileHeader from '../../../components/headers/ProfileHeader';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { getThemeColors } from '../../../utils/theme';
import ProfileDetails from '../../../components/Profile/ProfileDetails';
import CustomRefreshControl from '../../../components/custom/CustomeRefreshCOntrol';
import { useUser } from '../../../hooks/useUser';
import PostItem from '../../../components/Profile/PostItem';
import ProfileReminder from '../../../components/Profile/ProfileReminder';
import EditProfile from '../../../components/Profile/Modal/EditProfile';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = hp(25);
const AVATAR_SIZE = hp(10);

export default function Profile() {
  const { user, isLoading, linkedAccounts, switchAccount, linkAccount } = useAuth();
  const { fetchUserProfile, updateProfile } = useUser();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const switchAccountModalRef = useRef(null);
  const menuModalRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const editProfileRef = useRef(null);

  const openSwitchAccountModal = useCallback(() => {
    switchAccountModalRef.current?.open();
  }, []);

  const closeSwitchAccountModal = useCallback(() => {
    switchAccountModalRef.current?.close();
  }, []);

  const openMenuModal = useCallback(() => {
    menuModalRef.current?.open();
  }, []);

  const closeMenuModal = useCallback(() => {
    menuModalRef.current?.close();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={hp(5)} color={colors.primary} />
      </View>
    );
  }

  const navigateToLogin = () => {
    closeSwitchAccountModal();
    router.push('/login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserProfile(); 
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setRefreshing(false); 
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };


  const renderPostItem = ({ item }) => (
    <PostItem
        item={item}
        colors={colors}
        viewMode={viewMode}
        user={user}
    />
  );

  // to open user edit profile Modal
  const handleEditProfileClick = () => {
    if (!user) return null;
    // Open edit profile modal
    editProfileRef.current?.open();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* profileHeader */}
      <ProfileHeader
        colors={colors}
        user={user}
        openSwitchAccountModal={openSwitchAccountModal}
        openMenuModal={openMenuModal}
      />

      {/* for Profile Details */}
      <Animated.FlatList
        data={Array.isArray(user?.posts) ? user.posts : []}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            {refreshing && (
              <CustomRefreshControl colors={colors} refreshing={refreshing} />
            )}

            <ProfileDetails 
               user={user} 
               colors={colors} 
               onClickEditBtn={handleEditProfileClick}
            />

            {/* finish up */}
            <ProfileReminder user={user} colors={colors} />
            
            <View style={styles.viewToggleContainer}>
              <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggleButton}>
                <Text style={[styles.viewToggleText, { color: colors.primary }]}>
                  {viewMode === 'list' ? 'Grid View' : 'List View'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        // for post
        renderItem={renderPostItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Forces re-render when viewMode changes
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressViewOffset={hp(5)}
            progressBackgroundColor="transparent"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingBottom: hp(10) }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.noPostsText, { color: colors.subText }]}>
              No posts yet
            </Text>
          </View>
        }
      />

      
      <SwitchAccountModal
        modalizeRef={switchAccountModalRef}
        colors={colors}
        user={user}
        navigateToLogin={navigateToLogin}
        linkedAccounts={linkedAccounts}
        switchAccount={switchAccount}
        linkAccount={linkAccount}
      />
      <MenuModal 
          modalizeRef={menuModalRef} 
          colors={colors} 
          closeModal={closeMenuModal} 
      />
      {/* modal for edit profile  */}
      <EditProfile
         ref={editProfileRef}
         colors={colors}
         user={user}
         updateProfile={updateProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    width,
    height: HEADER_HEIGHT,
    alignItems: 'center',
    zIndex: 1,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#fff',
    position: 'absolute',
    bottom: -AVATAR_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: wp(5),
    marginVertical: hp(1),
  },
  viewToggleButton: {
    padding: wp(2),
    backgroundColor: 'transparent',
  },
  viewToggleText: {
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  postItem: {
    margin: wp(2),
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  postThumbnail: {
    width: '100%',
    height: hp(20),
  },
  postTitle: {
    fontSize: hp(1.8),
    padding: wp(2),
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});