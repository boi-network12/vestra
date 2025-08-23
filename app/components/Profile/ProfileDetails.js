import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using expo-vector-icons

export default function ProfileDetails({ user, colors }) {
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.name, { color: colors.text }]}>
        {user?.profile?.firstName} {user?.profile?.lastName}
      </Text>
      <Text style={[styles.bio, { color: colors.textSecondary }]}>
        {user?.profile?.bio || 'No bio yet'}
      </Text>
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statItem} onPress={() => console.log('Navigate to posts')}>
          <Ionicons name="grid-outline" size={hp(2.5)} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => console.log('Navigate to followers')}>
          <Ionicons name="people-outline" size={hp(2.5)} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {user?.followers?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => console.log('Navigate to following')}>
          <Ionicons name="person-add-outline" size={hp(2.5)} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {user?.following?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginHorizontal: wp(4),
    padding: wp(4),
    borderRadius: 16,
    alignItems: 'center',
    marginTop: hp(6), // Space for avatar overlap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: hp(2.6),
    fontWeight: '700',
    marginBottom: hp(0.5),
  },
  bio: {
    fontSize: hp(1.8),
    textAlign: 'center',
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    padding: wp(2),
  },
  statNumber: {
    fontSize: hp(2.2),
    fontWeight: '600',
    marginTop: hp(0.5),
  },
  statLabel: {
    fontSize: hp(1.6),
    marginTop: hp(0.3),
  },
});