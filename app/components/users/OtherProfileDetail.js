import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import React, { useCallback, useMemo, useState } from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../context/AlertContext';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const withOpacity = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

export default function OtherProfileDetail({ 
   user, 
   colors, 
   openInAppBrowser, 
   router, 
   following,
   unfollowUser, cancelFollowRequest, pendingFollowRequests, followUser,
   userId
   }) {
  const { showAlert } = useAlert();
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [buttonAnimation] = useState(new Animated.Value(1))

    const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
    const dynamicFontSize = fullName.length > 20 ? hp(2) : hp(2.5);

    const isFollowing = useMemo(
    () => Array.isArray(following) && following.some((u) => u._id === userId),
    [following, userId]
  );
  const isRequested = useMemo(
    () =>
        Array.isArray(pendingFollowRequests) &&
        pendingFollowRequests.some((req) => req.user._id === userId),
      [pendingFollowRequests, userId]
    );
    const isMutual = useMemo(
      () => user?.isMutual || (isFollowing && user?.followers?.some((f) => f._id === userId)),
      [isFollowing, user, userId]
    );
    const isPrivate = user?.privacySettings?.profileVisibility === "private";

    // Handle profile click
    const handleProfileClick = useCallback(() => {
      const privacy = user?.privacySettings?.profileVisibility || "public";
      if (privacy === "public" || (isFollowing && (privacy === "private" || privacy === "followers"))) {
        router.push(`/users/${userId}`);
      } else {
        showAlert("This profile is private. Follow the user to view their profile.", "info");
      }
    }, [user, userId, isFollowing, router, showAlert]);

    // Animate button
  const animateButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonAnimation]);

  // Handle follow action
  const handleFollow = useCallback(async () => {
    animateButton();
    await followUser(userId);
  }, [followUser, userId, animateButton]);

  // Handle unfollow action
  const handleUnfollow = useCallback(async () => {
    animateButton();
    await unfollowUser(userId);
  }, [unfollowUser, userId, animateButton]);

  // Handle cancel follow request
  const handleCancelRequest = useCallback(async () => {
    animateButton();
    await cancelFollowRequest(userId);
  }, [cancelFollowRequest, userId, animateButton]);

  // Button configuration
  const buttonConfig = useMemo(() => {
    if (isMutual) {
      return {
        icon: "people",
        text: "Friends",
        color: colors.primary,
        textColor: colors.text,
        action: () => setIsModalVisible(true),
      };
    }
    if (isPrivate && !isFollowing && !isRequested) {
      return {
        icon: "person-add",
        text: "Follow",
        color: colors.primary,
        textColor: colors.text,
        action: handleFollow,
      };
    }
    if (isRequested) {
      return {
        icon: "time-outline",
        text: "Requested",
        color: colors.skeleton,
        textColor: colors.text,
        action: handleCancelRequest,
      };
    }
    if (isFollowing) {
      return {
        icon: "person-remove",
        text: "Unfollow",
        color: colors.skeleton,
        textColor: colors.text,
        action: handleUnfollow,
      };
    }
    return {
      icon: "person-add",
      text: "Follow",
      color: colors.primary,
      textColor: colors.text,
      action: handleFollow,
    };
  }, [isMutual, isPrivate, isFollowing, isRequested, colors, handleFollow, handleUnfollow, handleCancelRequest]);


  return (
    user && (
      <View style={ [styles.container, { }]}>
        <View style={[styles.ProfileDetails, {}]}>
          <View style={styles.namesContainer}>
            <Text style={[styles.nameText, { color: colors.text, fontSize: dynamicFontSize }]}>
              {fullName}
            </Text>
            <Text style={[styles.usernameText, { color: colors.subText }]}>
              @{user?.username}
            </Text>
          </View>
          <Image
             style={styles.avatar}
             source={{ uri: user?.profile?.avatar || 'https://picsum.photos/seed/696/3000/2000' }}
             placeholder={{ blurhash }}
             contentFit='cover'
             transition={1000}
          />
        </View>
        {/* bio and links */}
        <View style={styles.bioContainer}>
          <Text style={[ styles.bioText, { color: colors.text }]}>
            {user?.profile?.bio || (<Text style={[styles.bioText, { color: colors.subText }]}>No bio available</Text>)}
          </Text>

          {/* follow link */}
          <View style={styles.followLink}>
            <TouchableOpacity
               onPress={handleProfileClick}
            >
              <Text style={[ { color: colors.subText, fontSize: hp(1.6) }]}>
                 {user?.followers?.length || 0} followers
              </Text>
            </TouchableOpacity>
            <Ionicons name="ellipse" size={hp(0.2)} color={colors.subText} />  
            
            {user?.profile?.links?.[0]?.title && user?.profile?.links?.[0]?.url ? (
                <TouchableOpacity
                  onPress={() => {
                    if (openInAppBrowser) {
                      openInAppBrowser(user.profile.links[0].url);
                    } else {
                      console.warn('InAppBrowser is not available');
                    }
                  }}
                >
                  <Text style={{ color: colors.subText, fontSize: hp(1.6) }}>
                    {user.profile.links[0].title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: colors.subText }}>No link</Text>
              )}

          </View>

          <View style={styles.btnContainer}>
            <Animated.View style={{ transform: [{ scale: buttonAnimation }] }}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  isPrivate && !isFollowing && !isRequested
                    ? { width: wp(90), backgroundColor: buttonConfig.color }
                    : { width: wp(44), backgroundColor: buttonConfig.color },
                ]}
                onPress={buttonConfig.action}
              >
                <Ionicons
                  name={buttonConfig.icon}
                  size={hp(2)}
                  color={buttonConfig.textColor}
                  style={styles.btnIcon}
                />
                <Text style={[styles.profileBtnText, { color: buttonConfig.textColor }]}>
                  {buttonConfig.text}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            {!isPrivate && (
              <TouchableOpacity
                style={[styles.btn, { width: wp(44), backgroundColor: colors.primary }]}
                onPress={() => router.push(`/messages/${userId}`)}
              >
                <Ionicons name="chatbubbles-outline" size={hp(2)} color={colors.text} />
                <Text style={[styles.profileBtnText, { color: colors.text }]}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  ProfileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  namesContainer: {},
  avatar: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    overflow: 'hidden',
  },
  nameText: {
    fontWeight: "600"
  },
  usernameText: {
    fontSize: hp(1.8),
    fontWeight: "400"
  },
  bioContainer: {
    flexDirection: 'column',
  },
  followLink: {
    flexDirection: "row",
    alignItems: "center",
     justifyContent: "flex-start",
     gap: wp(2),
     marginTop: wp(2),
  },
  btnContainer: {
    flexDirection: "row",
    marginTop: hp(3),
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    borderWidth: 1,
    borderRadius: wp(2),
    alignItems: 'center',
    width: wp(44),
    height: hp(5),
    flexDirection:"row",
    justifyContent: "center",
    gap: hp(1.5)
  }
});