import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Portal } from 'react-native-portalize';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';

const MENU_ITEMS = [
  { label: 'Settings and Privacy', icon: 'settings-outline', path: '/settings' },
  { label: 'Job', icon: 'briefcase-outline', path: '/jobs' },
  { label: 'Help', icon: 'help-circle-outline', path: '/help' },
  { label: 'Feedback', icon: 'chatbubble-ellipses-outline', path: '/feedback' },
];

export default function MenuModal({ modalizeRef, colors, onPositionChange, closeModal }) {
  const router = useRouter();

  const handlePress = (path) => {
    closeModal();
    router.push(path);
  };

  return (
    <Portal>
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        handleStyle={{
          backgroundColor: colors.subText,
          width: hp(5),
          height: hp(0.5),
          position: 'absolute',
          top: hp(4),
        }}
        modalStyle={{ backgroundColor: colors.background }}
        onPositionChange={onPositionChange}
        withOverlay
        overlayStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        panGestureEnabled
      >
        <View style={[styles.bottomSheetContent, { backgroundColor: colors.background }]}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Menu</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={hp(2.5)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuContainer}>
          {MENU_ITEMS.map(({ label, icon, path }) => (
            <TouchableOpacity key={path} style={styles.menuItem} onPress={() => handlePress(path)}>
              <Ionicons name={icon} size={hp(2.5)} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>
      </Modalize>
    </Portal>
  );
}

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: hp(2),
    borderTopLeftRadius: hp(5),
    borderTopRightRadius: hp(5),
    paddingTop: hp(3),
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: hp(2),
    borderTopLeftRadius: hp(5),
    borderTopRightRadius: hp(5),
  },
  bottomSheetTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(2),
  },
  menuText: {
    fontSize: hp(1.7),
    fontWeight: '500',
    marginLeft: hp(1.5),
  },
});
