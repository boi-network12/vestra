// SuggestedFriends.js
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, FlatList, Animated } from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

const useDebounce = () => {
  return useCallback((fn, delay) => {
    let timeout;
    const debouncedFn = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
    debouncedFn.cancel = () => clearTimeout(timeout); // Allow canceling the debounce
    return debouncedFn;
  }, []);
};

export default function SuggestedFriends({
  onToggleHandleAction,
  suggestedUsers = [],
  followUser,
  unfollowUser,
  isLoading,
  error,
  router,
  colors,
  getSuggestedUsers,
  cancelFollowRequest,
  getPendingFollowRequests,
  pendingFollowRequests,
  searchQuery
}) {
  const [userStatuses, setUserStatuses] = useState({}); 
  const [hasFetchedPendingRequests, setHasFetchedPendingRequests] = useState(false);
  const [buttonAnimations, setButtonAnimations] = useState({});
  const debounce = useDebounce();

  // Filter users by searchQuery
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return suggestedUsers;
    const query = searchQuery.toLowerCase();
    return suggestedUsers.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) 
    );
  }, [suggestedUsers, searchQuery]);

  useEffect(() => {
  return () => {
    handleFollow.cancel();
    handleUnfollow.cancel();
    handleCancelRequest.cancel();
  };
}, [handleFollow, handleUnfollow, handleCancelRequest]);

  // Initialize animations
  useEffect(() => {
    setButtonAnimations(
      Object.fromEntries(suggestedUsers.map(user => [user._id, new Animated.Value(1)]))
    );
  }, [suggestedUsers]);

  useEffect(() => {
  // Reset userStatuses when suggestedUsers changes
  setUserStatuses({});
  // Reinitialize button animations
  setButtonAnimations(
    Object.fromEntries(suggestedUsers.map((user) => [user._id, new Animated.Value(1)]))
  );
}, [suggestedUsers]);

  // Fetch pending follow requests on mount
  useEffect(() => {
    if (!hasFetchedPendingRequests && pendingFollowRequests.length === 0) {
      getPendingFollowRequests().then(() => {
        setHasFetchedPendingRequests(true);
      });
    }
  }, [getPendingFollowRequests, pendingFollowRequests.length, hasFetchedPendingRequests]);

  // Animate button
  const animateButton = useCallback((userId) => {
    const animation = buttonAnimations[userId];
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [buttonAnimations]);

  // Handlers
  const handleFollow = useMemo(
  () => debounce(async (userId) => {
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: true },
    }));
    animateButton(userId);
    const result = await followUser(userId);
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: false },
    }));
    if (result.success) {
      console.log(`Follow action: ${result.message}`);
      onToggleHandleAction?.(userId, result.followStatus === "FOLLOWING");
    }
  }, 300),
  [debounce, followUser, onToggleHandleAction, animateButton]
);

const handleUnfollow = useMemo(
  () => debounce(async (userId) => {
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: true },
    }));
    animateButton(userId);
    const result = await unfollowUser(userId);
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: false },
    }));
    if (result.success) {
      console.log(`Unfollow action: ${result.message}`);
      onToggleHandleAction?.(userId, false);
    }
  }, 300),
  [debounce, unfollowUser, onToggleHandleAction, animateButton]
);

const handleCancelRequest = useMemo(
  () => debounce(async (userId) => {
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: true },
    }));
    animateButton(userId);
    const result = await cancelFollowRequest(userId);
    setUserStatuses((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], isLoading: false },
    }));
    if (result.success) {
      console.log(`Cancel request action: ${result.message}`);
      await Promise.all([getPendingFollowRequests(), getSuggestedUsers()]);
    }
  }, 300),
  [debounce, cancelFollowRequest, animateButton, getPendingFollowRequests, getSuggestedUsers]
);

  const navigateToProfile = useCallback(userId => router.push(`/profile/${userId}`), [router]);
  const handleMessage = useCallback(userId => router.push(`/messages/${userId}`), [router]);

  const renderUserItem = useCallback(
    ({ item }) => {
      const status = userStatuses[item._id] || { isLoading: false };
      const buttonState = item.followStatus || 'FOLLOW'; 
      const isMutual = item.isMutual;

      const buttonConfig = {
        FOLLOW: {
          icon: 'person-add',
          text: 'Follow',
          color: colors.text,
          textColor: colors.background,
          action: () => handleFollow(item._id),
        },
        FOLLOW_BACK: {
          icon: 'person-add',
          text: 'Follow Back',
          color: colors.primary,
          textColor: colors.text,
          action: () => handleFollow(item._id),
        },
        REQUESTED: {
          icon: 'time-outline',
          text: 'Requested',
          color: colors.skeleton,
          textColor: colors.text, 
          opacity: 0.7,
          action: () => handleCancelRequest(item._id),
        },
        FOLLOWING: {
          icon: 'person-remove',
          text: 'Unfollow',
          color: colors.skeleton,
          textColor: colors.text,
          action: () => handleUnfollow(item._id),
        },
          MUTUAL: {
          icon: 'chatbubbles-outline',
          text: 'Message',
          color: colors.primary,
          textColor: colors.text,
          action: () => handleMessage(item._id),
        },
      };


      const config = buttonConfig[buttonState] || buttonConfig.FOLLOW;
      const showMessageButton = buttonState === 'FOLLOWING';

      return (
        <Animated.View
          style={[
            styles.userContainer,
            {  transform: [{ scale: buttonAnimations[item._id] || 1 }] },
          ]}
        >
          <TouchableOpacity style={styles.userInfo} onPress={() => navigateToProfile(item._id)}>
            <Image
              source={{ uri: item.avatar || 'https://picsum.photos/seed/696/3000/2000' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.usernameContainer}>
                <Text 
                   style={[styles.username, { color: colors.text }]}
                   minimumFontScale={0.8}
                  >
                  {item.firstName} {item.lastName}
                </Text>
                {isMutual && (
                  <Ionicons name="people" size={hp(2)} color={colors.primary} style={styles.mutualIcon} />
                )}
              </View>
              <Text style={[styles.name, { color: colors.subText }]}>@{item.username}</Text>
              {item.bio && (
                <Text style={[styles.bio, { color: colors.subText }]}>
                  {item.bio.length > 20 ? `${item.bio.substring(0, 20)}...` : item.bio}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: config.color, opacity: config.opacity || 1 }]}
              onPress={config.action}
              disabled={status.isLoading}
            >
              {status.isLoading ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <>
                  <Ionicons name={config.icon} size={hp(2)} color={colors.background} />
                  <Text style={[styles.actionButtonText, { color: config.textColor }]}>{config.text}</Text>
                </>
              )}
            </TouchableOpacity>
            {showMessageButton && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary, paddingHorizontal: hp(1.2) }]}
                onPress={() => handleMessage(item._id)}
                disabled={status.isLoading}
              >
                <Ionicons name="chatbubbles-outline" size={hp(2)} color={colors.buttonText} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      );
    },
    [colors, userStatuses, buttonAnimations, handleFollow, handleUnfollow, handleCancelRequest, handleMessage, navigateToProfile]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}

      {filteredUsers.length === 0 && !isLoading && !error && (
        <Text style={[styles.emptyText, { color: colors.subText }]}>No suggested users available.</Text>
      )}
      <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => (item._id ? item._id.toString() : `fallback-${index}`)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          extraData={{ userStatuses, suggestedUsers }}
        />
    </View>
  );
}

// Styles remain the same as provided
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: hp(1),
    paddingTop: hp(1),
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hp(1.5),
    borderRadius: hp(1.5),
    marginTop: hp(0.5),
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: hp(1.5),
    height: hp(5.5),
    marginTop: hp(1),
    borderRadius: hp(1.7),
    overflow: "hidden"
  },
  searchInput: {
    width: "100%",
    height: "100%"
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginRight: hp(1.5),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  userDetails: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.5),
  },
  username: {
    fontSize: hp(2),
    fontWeight: "600",
    color: "inherit",
  },
  mutualIcon: {
    marginLeft: hp(0.5),
  },
  name: {
    fontSize: hp(1.7),
    marginTop: hp(0.3),
    opacity: 0.7,
  },
  bio: {
    fontSize: hp(1.5),
    marginTop: hp(0.3),
    opacity: 0.65,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.8),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1),
    paddingHorizontal: hp(2),
    borderRadius: hp(1),
    marginLeft: hp(0.8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: hp(1.5),
    fontWeight: "500",
    marginLeft: hp(0.5),
  },
  loader: {
    marginVertical: hp(2),
  },
  errorText: {
    fontSize: hp(1.7),
    textAlign: "center",
    marginVertical: hp(1.2),
  },
  emptyText: {
    fontSize: hp(1.7),
    textAlign: "center",
    marginVertical: hp(2),
    opacity: 0.6,
  },
  listContainer: {
    paddingBottom: hp(2),
  },
});