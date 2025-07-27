import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  TextInput,
  SectionList,
} from 'react-native';
import React from 'react';
import SettingsHeader from '../../../components/headers/SettingsHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function Settings() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  const SECTIONS = [
    {
      title: 'Account & Privacy',
      data: [
        { id: '2', title: 'Account Settings' },
        { id: '3', title: 'Account' },
        { id: '4', title: 'Notification and Discovery' },
        { id: '5', title: 'Connection and Discovery' },
        { id: '6', title: 'Content Filters' },
        { id: '7', title: 'Privacy Settings' },
        { id: '8', title: 'Privacy' },
        { id: '9', title: 'Data' },
      ],
    },
    {
      title: 'App Preferences',
      data: [
        { id: '10', title: 'App Settings' },
        { id: '11', title: 'Accessibility' },
        { id: '12', title: 'Language' },
      ],
    },
    {
      title: 'Support & Feedback',
      data: [
        { id: '13', title: 'Support' },
        { id: '14', title: 'Feedback' },
        { id: '15', title: 'Help Center' },
      ],
    },
    {
      title: 'Account Management',
      data: [
        { id: '16', title: 'Logins' },
        { id: '17', title: 'Add account' },
      ],
    },
  ];

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
      <Text style={[styles.itemText, { color: colors.text }]}>{item.title}</Text>
      <Ionicons name="chevron-forward" color={colors.text} size={hp(2)} />
    </View>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.subText }]}>{section.title}</Text>
    </View>
  );

  const ListHeader = () => (
    <View style={[styles.inputContainer, { borderBottomColor: colors.border }]}>
      <TextInput
        style={[styles.searchInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
        placeholder="Search"
        placeholderTextColor={colors.subText}
        selectionColor={colors.subText}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <SettingsHeader onBackPress={() => router.back()} colors={colors} />

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
  },
  inputContainer: {
    padding: hp(2),
    borderBottomWidth: 1
  },
  searchInput: {
    height: hp(5),
    borderRadius: hp(2),
    paddingHorizontal: hp(3),
    borderWidth: 1,
  },
  sectionHeader: {
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
  },
  sectionTitle: {
    fontSize: hp(1.4),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: hp(1.75),
  },
});
