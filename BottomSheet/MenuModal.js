import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Portal } from 'react-native-portalize';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function MenuModal({ modalizeRef, colors, onPositionChange, closeModal }) {
  const handleOptionPress = (option) => {
    console.log(`${option} pressed`);
    closeModal();
    // Add navigation or action logic here as needed
  };

  return (
    <Portal>
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true}
        handleStyle={{ backgroundColor: colors.subText, width: hp(5), height: hp(0.5), position: 'absolute', top: hp(4) }}
        modalStyle={{ backgroundColor: colors.background }}
        onPositionChange={onPositionChange}
        withOverlay={true}
        overlayStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        panGestureEnabled={true}
      >
        <View style={[styles.bottomSheetContent, { backgroundColor: colors.background }]}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Menu</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={hp(2.5)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuContainer}>
            {/* Settings and Privacy */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleOptionPress('Settings and Privacy')}>
              <Ionicons name="settings-outline" size={hp(2.5)} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Settings and Privacy</Text>
            </TouchableOpacity>

            {/* Job */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleOptionPress('Job')}>
              <Ionicons name="briefcase-outline" size={hp(2.5)} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Job</Text>
            </TouchableOpacity>

            {/* Other Cool Option 1 */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleOptionPress('Help')}>
              <Ionicons name="help-circle-outline" size={hp(2.5)} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Help</Text>
            </TouchableOpacity>

            {/* Other Cool Option 2 */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleOptionPress('Feedback')}>
              <Ionicons name="chatbubble-ellipses-outline" size={hp(2.5)} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Feedback</Text>
            </TouchableOpacity>
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