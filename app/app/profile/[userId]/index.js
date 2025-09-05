import { StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Platform, Dimensions, Animated, StatusBar, View, Text, RefreshControl, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { useUser } from '../../../hooks/useUser';
import * as ScreenCapture from 'expo-screen-capture';
import PostItem from '../../../components/Profile/PostItem';
import OtherUserProfile from '../../../components/headers/OtherUserProfile';
import CustomRefreshControl from '../../../components/custom/CustomeRefreshCOntrol';
import ShareProfile from '../../../components/Profile/Modal/ShareProfile';
import InAppBrowser from '../../../browser/InAppBrowser';
import OtherProfileDetail from '../../../components/users/OtherProfileDetail';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = hp(25);
const AVATAR_SIZE = hp(10);

export default function UserProfile() {
    const { userId } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    const { getOtherUserDetails, otherUserProfile } = useUser();
    const router = useRouter();
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [isBrowserVisible, setIsBrowserVisible] = useState(false);
    const [browserUrl, setBrowserUrl] = useState(''); 


    const shareProfileRef = useRef(null);
    

    useEffect(() => {
        // prevent screen shot
       ScreenCapture.preventScreenCaptureAsync();
    
        // or listen for screenshot attempts
        const subscription = ScreenCapture.addScreenshotListener(() => {
          console.log('📸 Screenshot detected!');
          shareProfileRef.current?.open();
        });
    
        return () => {
          subscription.remove();
          ScreenCapture.allowScreenCaptureAsync();
        }
      }, []);

    useEffect(() => {
      if (userId && currentUser) {
        getOtherUserDetails(userId);
      }
    },[userId, currentUser, getOtherUserDetails]);

    const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getOtherUserDetails(userId); 
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setRefreshing(false); 
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  // to open share modal
  const handleShareProfileClick = () => {
    if (!currentUser && !getOtherUserDetails) return null;
    shareProfileRef.current?.open();
  }

  // Function to open the in-app browser
  const openInAppBrowser = (url) => {
    setBrowserUrl(url);
    setIsBrowserVisible(true);
  };


  const renderPostItem = ({ item }) => (
      <PostItem
          item={item}
          colors={colors}
          viewMode={viewMode}
          user={otherUserProfile}
      />
    );

  return (
     <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
     >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <OtherUserProfile
         router={router}
         colors={colors}
         onClickShareBtn={handleShareProfileClick}
      />

      {/* for Profile Details */}
      <Animated.FlatList
        data={Array.isArray(otherUserProfile?.posts) ? otherUserProfile.posts : []}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            {refreshing && (
                <CustomRefreshControl 
                  colors={colors} 
                  refreshing={refreshing} 
                />
            )}

            <OtherProfileDetail 
               user={otherUserProfile} 
               colors={colors} 
               browserUrl={browserUrl}
               isBrowserVisible={isBrowserVisible}
               openInAppBrowser={openInAppBrowser}
               router={router}
               userId={userId}
            />
            
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

      <ShareProfile
            ref={shareProfileRef}
            colors={colors}
            user={otherUserProfile}
        />

        <InAppBrowser
          isVisible={isBrowserVisible}
          url={browserUrl}
          colors={colors}
          onClose={() => setIsBrowserVisible(false)}
        />

     </SafeAreaView>
  )
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