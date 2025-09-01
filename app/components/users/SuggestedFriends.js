import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  Animated,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

// Stable debounce utility
const useDebounce = () => {
  return useCallback((fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }, []);
};

export default function SuggestedFriends({
  onToggleHandleAction,
  suggestedUsers,
  followUser,
  unfollowUser,
  isLoading,
  error,
  router,
  colors,
  showAlert,
  cancelFollowRequest,
  getPendingFollowRequests,
  pendingFollowRequests,
  following,
}) {
  const [userStatuses, setUserStatuses] = useState({});
  const [hasFetchedPendingRequests, setHasFetchedPendingRequests] = useState(false);
  const [buttonAnimations, setButtonAnimations] = useState({});
  const debounce = useDebounce();

  // Initialize user statuses
  const initializeStatuses = useCallback(() => {
    const newStatuses = {};
    suggestedUsers.forEach((user) => {
      newStatuses[user._id] = {
        isFollowing: following.some((f) => f._id.toString() === user._id),
        isPending: pendingFollowRequests.some((request) => request.user._id.toString() === user._id),
        isLoading: false,
        animation: new Animated.Value(1),
      };
    });
    setUserStatuses(newStatuses);
    setButtonAnimations(
      Object.fromEntries(Object.keys(newStatuses).map((id) => [id, new Animated.Value(1)]))
    );
  }, [suggestedUsers, following, pendingFollowRequests]); // Removed buttonAnimations

  // Fetch pending follow requests on mount
  useEffect(() => {
    if (!hasFetchedPendingRequests && pendingFollowRequests.length === 0) {
      getPendingFollowRequests().then(() => {
        setHasFetchedPendingRequests(true);
      });
    }
  }, [getPendingFollowRequests, pendingFollowRequests.length, hasFetchedPendingRequests]);

  // Reinitialize statuses when dependencies change
  useEffect(() => {
    initializeStatuses();
  }, [initializeStatuses]);

  // Animate button transition
  const animateButton = useCallback((userId) => {
    const animation = buttonAnimations[userId];
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [buttonAnimations]);

  // Handlers
  const handleFollow = useMemo(
    () =>
      debounce((userId) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isFollowing: true, isPending: true, isLoading: true },
        }));
        animateButton(userId);

        followUser(userId).then((result) => {
          setUserStatuses((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], isLoading: false },
          }));
          if (!result.success) {
            setUserStatuses((prev) => ({
              ...prev,
              [userId]: { ...prev[userId], isFollowing: false, isPending: false },
            }));
          } else {
            initializeStatuses();
          }
          if (onToggleHandleAction) {
            onToggleHandleAction(userId, result.success);
          }
        });
      }, 300),
    [debounce, followUser, onToggleHandleAction, initializeStatuses, animateButton]
  );

  const handleUnfollow = useMemo(
    () =>
      debounce((userId) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isFollowing: false, isLoading: true },
        }));
        animateButton(userId);

        unfollowUser(userId).then((result) => {
          setUserStatuses((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], isLoading: false },
          }));
          if (!result.success) {
            setUserStatuses((prev) => ({
              ...prev,
              [userId]: { ...prev[userId], isFollowing: true },
            }));
          } else {
            initializeStatuses();
          }
          if (onToggleHandleAction) {
            onToggleHandleAction(userId, !result.success);
          }
        });
      }, 300),
    [debounce, unfollowUser, onToggleHandleAction, initializeStatuses, animateButton]
  );

  const handleCancelRequest = useMemo(
    () =>
      debounce((userId) => {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isPending: false, isFollowing: false, isLoading: true },
        }));
        animateButton(userId);

        cancelFollowRequest(userId).then((result) => {
          setUserStatuses((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], isLoading: false },
          }));
          if (result.success) {
            showAlert("Follow request canceled", "success");
            initializeStatuses();
          } else {
            setUserStatuses((prev) => ({
              ...prev,
              [userId]: { ...prev[userId], isPending: true },
            }));
          }
        });
      }, 300),
    [debounce, cancelFollowRequest, showAlert, initializeStatuses, animateButton]
  );

  const navigateToProfile = useCallback(
    (userId) => {
      router.push(`/profile/${userId}`);
    },
    [router]
  );

  const handleMessage = useCallback(
    (userId) => {
      router.push(`/messages/${userId}`);
    },
    [router]
  );

  const renderUserItem = useCallback(
    ({ item }) => {
      const status = userStatuses[item._id] || {
        isFollowing: false,
        isPending: false,
        isLoading: false,
        animation: new Animated.Value(1),
      };
      const isPrivate = item.privacySettings?.profileVisibility === "private";
      const isFollowingCurrentUser = item.isFollowingCurrentUser || false;
      const isMutual = status.isFollowing && isFollowingCurrentUser;

      let primaryButton = null;
      let showMessageButton = false;

      if (!status.isFollowing && !isFollowingCurrentUser && !status.isPending) {
        // Case 1: Neither follows each other
        primaryButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleFollow(item._id)}
            disabled={status.isLoading}
          >
            {status.isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="person-add" size={hp(2)} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                  Follow
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (!status.isFollowing && isFollowingCurrentUser && !status.isPending) {
        // Case 2: User is following me
        primaryButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleFollow(item._id)}
            disabled={status.isLoading}
          >
            {status.isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="person-add" size={hp(2)} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                  Follow Back
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (status.isPending && isPrivate) {
        // Case 3: Pending follow request to private profile
        primaryButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary, opacity: 0.7 }]}
            onPress={() => handleCancelRequest(item._id)}
            disabled={status.isLoading}
          >
            {status.isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="time-outline" size={hp(2)} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                  Requested
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      } else if (status.isFollowing && isPrivate) {
        // Case 4: Following private profile (accepted)
        showMessageButton = true;
      } else if (status.isFollowing) {
        // Case 5: Following non-private or accepted private profile
        primaryButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleUnfollow(item._id)}
            disabled={status.isLoading}
          >
            {status.isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Ionicons name="person-remove" size={hp(2)} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                  Unfollow
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
        showMessageButton = true;
      }

      return (
        <Animated.View
          style={[
            styles.userContainer,
            { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: status.animation }] },
          ]}
        >
          <TouchableOpacity style={styles.userInfo} onPress={() => navigateToProfile(item._id)}>
            <Image
              source={{
                uri: item.profile.avatar || "https://picsum.photos/seed/696/3000/2000",
              }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.usernameContainer}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {item.profile.firstName} {item.profile.lastName}
                </Text>
                {isMutual && (
                  <Ionicons
                    name="people"
                    size={hp(2)}
                    color={colors.primary}
                    style={styles.mutualIcon}
                  />
                )}
              </View>
              <Text style={[styles.name, { color: colors.subText }]}>@{item.username}</Text>
              {item.profile.bio && (
                <Text style={[styles.bio, { color: colors.subText }]}>
                  {item.profile.bio.length > 20
                    ? `${item.profile.bio.substring(0, 20)}...`
                    : item.profile.bio}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.actionContainer}>
            {primaryButton}
            {showMessageButton && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary, paddingHorizontal: hp(1.2) }]}
                onPress={() => handleMessage(item._id)}
                disabled={status.isLoading}
              >
                {status.isLoading ? (
                  <ActivityIndicator size="small" color={colors.buttonText} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={hp(2)} color={colors.buttonText} />
                    <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                      Message
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      );
    },
    [
      colors,
      userStatuses,
      handleFollow,
      handleUnfollow,
      handleCancelRequest,
      handleMessage,
      navigateToProfile,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
      {error && <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>}
      {suggestedUsers.length === 0 && !isLoading && !error && (
        <Text style={[styles.emptyText, { color: colors.subText }]}>
          No suggested users available.
        </Text>
      )}
      <FlatList
        data={suggestedUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

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
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
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
    paddingVertical: hp(0.7),
    paddingHorizontal: hp(1.6),
    borderRadius: hp(2.5),
    marginLeft: hp(0.8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: hp(1.6),
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