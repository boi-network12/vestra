import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  TextInput,
  SectionList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import React, { useState, useMemo } from 'react';
import SettingsHeader from '../../../components/headers/SettingsHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SETTINGS_SECTIONS } from '../../../constant/SeatingsSection'

// ✅ Separate search bar so it won't re-mount and close the keyboard
const SearchHeaderComponent = ({ searchText, setSearchText, colors }) => (
  <View style={[styles.inputContainer, { borderBottomColor: colors.border }]}>
    <TextInput
      style={[
        styles.searchInput,
        {
          color: colors.text,
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
        },
      ]}
      placeholder="Search"
      placeholderTextColor={colors.subText}
      selectionColor={colors.subText}
      value={searchText}
      onChangeText={setSearchText}
    />
  </View>
);

SearchHeaderComponent.displayName = 'SearchHeader';

const SearchHeader = React.memo(SearchHeaderComponent);

export default function Settings() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);


  // ✅ Stable SECTIONS array with useMemo
  const SECTIONS = useMemo(() => SETTINGS_SECTIONS, []);

  // Filter sections based on search text
  const filteredSections = useMemo(() => {
    if (!searchText.trim()) return SECTIONS;
    const query = searchText.toLowerCase();
    return SECTIONS.map(section => ({
      ...section,
      data: section.data.filter(item =>
        item.title.toLowerCase().includes(query)
      ),
    })).filter(section => section.data.length > 0);
  }, [searchText, SECTIONS]);


  const renderItem = ({ item }) => (
    <TouchableOpacity 
         style={[styles.itemContainer, { borderBottomColor: colors.border }]}
         onPress={() => {
           if(item.component) {
              setSelectedItem(item);
              setModalVisible(true);
           }
         }}
     >
      <Text style={[styles.itemText, { color: colors.text }]}>{item.title}</Text>
      <Ionicons name="chevron-forward" color={colors.text} size={hp(2)} />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.subText }]}>
        {section.title}
      </Text>
    </View>
  );


  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop:
          Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <SettingsHeader 
         onBackPress={() => router.back()} 
         colors={colors} 
         title="Settings"
      />

      <SectionList
        keyboardShouldPersistTaps="handled" // ✅ Keep keyboard up
        sections={filteredSections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <SearchHeader
            searchText={searchText}
            setSearchText={setSearchText}
            colors={colors}
          />
        }
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.subText }}>No results found</Text>
          </View>
        }
      />

      <Modal
         animationType='slide'
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
            style={{
              flex: 1,
              // paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
              backgroundColor: colors.background
            }}
        >
          <SettingsHeader
              onBackPress={() => setModalVisible(false)}
              colors={colors}
              title={selectedItem?.title}
          />
          <View style={styles.modalContainer}>
            {selectedItem && selectedItem.component ? (
              <selectedItem.component colors={colors} />
            ) : (
              <Text style={{ color: colors.text }}>No content available</Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
  },
  inputContainer: {
    padding: hp(2),
    borderBottomWidth: 1,
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
