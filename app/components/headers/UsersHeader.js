import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { usePathname } from 'expo-router';

export default function UsersHeader({ colors, onBackPress, title }) {
  const pathname = usePathname(); // Get the current route
  const isUserNetworkRoute = pathname.includes('user-network') || pathname.startsWith('/users/');
  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isUserNetworkRoute ? 0 : 1, // Set borderBottomWidth to 0 for user-network
        },
      ]}
    >
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text></Text> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(1.7),
    paddingVertical: hp(2.2),
  },
  title: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    lineHeight: hp(2.4),
    textAlign: 'center',
  },
});