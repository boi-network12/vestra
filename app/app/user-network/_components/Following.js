import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
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
    debouncedFn.cancel = () => clearTimeout(timeout);
    return debouncedFn;
  }, []);
};

export default function Following({
  following = [],
  unfollowUser,
  isLoading,
  error,
  router,
  colors,
  getFollowingWithDetails,
  currentUser
}) {
  const [userStatuses, setUserStatuses] = useState({});
  const [buttonAnimations, setButtonAnimations] = useState({});
  const debounce = useDebounce();

  // Initialize animations
  useEffect(() => {
    setButtonAnimations(
      Object.fromEntries(following.map((user) => [user._id, new Animated.Value(1)]))
    );
  }, [following]);

  // Reset userStatuses when following changes
  useEffect(() => {
    setUserStatuses({});
    setButtonAnimations(
      Object.fromEntries(following.map((user) => [user._id, new Animated.Value(1)]))
    );
  }, [following]);

  // Animate button
  const animateButton = useCallback(
    (userId) => {
      const animation = buttonAnimations[userId];
      if (animation) {
        Animated.sequence([
          Animated.timing(animation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
          Animated.timing(animation, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }
    },
    [buttonAnimations]
  );

  // Handlers
  const handleUnfollow = useMemo(
    () =>
      debounce(async (userId, isMutual) => {
        if (isMutual) {
          // Show confirmation prompt for mutual followers
          Alert.alert(
            'Unfollow User',
            `Are you sure you want to unfollow ${following.find((u) => u._id === userId)?.username || 'this user'}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Unfollow',
                style: 'destructive',
                onPress: async () => {
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
                    await getFollowingWithDetails(); // Refresh following list
                  }
                },
              },
            ]
          );
        } else {
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
            await getFollowingWithDetails(); // Refresh following list
          }
        }
      }, 300),
    [debounce, unfollowUser, animateButton, getFollowingWithDetails, following]
  );

  const navigateToProfile = useCallback((userId) => router.push(`/profile/${userId}`), [router]);
  const handleMessage = useCallback((userId) => router.push(`/messages/${userId}`), [router]);

  const truncateName = (firstName, lastName, maxLength = 20) => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName.length > maxLength) {
      return `${fullName.substring(0, maxLength - 3)}...`;
    }
    return fullName;
  };

  const renderUserItem = useCallback(
    ({ item }) => {
      if (item._id === currentUser?._id) {
        return (
          <Animated.View
            style={[styles.userContainer, { transform: [{ scale: buttonAnimations[item._id] || 1 }] }]}
          >
            <TouchableOpacity style={styles.userInfo} onPress={() => navigateToProfile(item._id)}>
              <Image
                source={{ uri: item.avatar || 'https://picsum.photos/seed/696/3000/2000' }}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <View style={styles.usernameContainer}>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {truncateName(item.firstName, item.lastName, 20)}
                  </Text>
                  {item.isMutual && (
                    <Ionicons
                      name="people"
                      size={hp(2)}
                      color={colors.primary}
                      style={styles.mutualIcon}
                    />
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
            {/* No action buttons for current user */}
          </Animated.View>
        );
      }

      const status = userStatuses[item._id] || { isLoading: false };
      const isMutual = item.isMutual;

      const buttonConfig = {
        UNFOLLOW: {
          icon: 'person-remove',
          text: 'Unfollow',
          color: colors.skeleton,
          textColor: colors.text,
          action: () => handleUnfollow(item._id, false),
        },
        MUTUAL: {
          icon: 'people',
          text: 'Friends',
          color: colors.primary,
          textColor: colors.text,
          action: () => handleUnfollow(item._id, true),
        },
      };

      const config = isMutual ? buttonConfig.MUTUAL : buttonConfig.UNFOLLOW;

      return (
        <Animated.View
          style={[styles.userContainer, { transform: [{ scale: buttonAnimations[item._id] || 1 }] }]}
        >
          <TouchableOpacity style={styles.userInfo} onPress={() => navigateToProfile(item._id)}>
            <Image
              source={{ uri: item.avatar || 'https://picsum.photos/seed/696/3000/2000' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.usernameContainer}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {truncateName(item.firstName, item.lastName, 20)}
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
              {item.bio && (
                <Text style={[styles.bio, { color: colors.subText }]}>
                  {item.bio.length > 20 ? `${item.bio.substring(0, 20)}...` : item.bio}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: config.color }]}
              onPress={config.action}
              disabled={status.isLoading}
            >
              {status.isLoading ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <>
                  <Ionicons name={config.icon} size={hp(2)} color={colors.background} />
                  <Text style={[styles.actionButtonText, { color: config.textColor }]}>
                    {config.text}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary, paddingHorizontal: hp(1.2) }]}
              onPress={() => handleMessage(item._id)}
              disabled={status.isLoading}
            >
              <Ionicons name="chatbubbles-outline" size={hp(2)} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [colors, userStatuses, buttonAnimations, handleUnfollow, handleMessage, navigateToProfile, currentUser]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
      {following.length === 0 && !isLoading && !error && (
        <Text style={[styles.emptyText, { color: colors.subText }]}>Not following anyone yet.</Text>
      )}
      {error && <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>}
      <FlatList
        data={following}
        renderItem={renderUserItem}
        keyExtractor={(item, index) => (item._id ? item._id.toString() : `fallback-${index}`)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        extraData={{ userStatuses, following }}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: hp(1.5),
    borderRadius: hp(1.5),
    marginTop: hp(0.5),
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginRight: hp(1.5),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userDetails: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.5),
  },
  username: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: 'inherit',
  },
  mutualIcon: {
    marginLeft: hp(0.5),
  },
  name: {
    fontSize: hp(1.5),
    marginTop: hp(0.3),
    opacity: 0.7,
  },
  bio: {
    fontSize: hp(1.5),
    marginTop: hp(0.3),
    opacity: 0.65,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.8),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: hp(2),
    borderRadius: hp(1),
    marginLeft: hp(0.8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: hp(1.5),
    fontWeight: '500',
    marginLeft: hp(0.5),
  },
  loader: {
    marginVertical: hp(2),
  },
  errorText: {
    fontSize: hp(1.7),
    textAlign: 'center',
    marginVertical: hp(1.2),
  },
  emptyText: {
    fontSize: hp(1.7),
    textAlign: 'center',
    marginVertical: hp(2),
    opacity: 0.6,
  },
  listContainer: {
    paddingBottom: hp(2),
  },
});