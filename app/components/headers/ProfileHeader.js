import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function ProfileHeader({ colors, user, openSwitchAccountModal, openMenuModal }) {
  return (
    <View style={[styles.container]}>
      <TouchableOpacity style={[styles.profilesDisplay]} onPress={openSwitchAccountModal}>
        <Text style={[styles.username, { color: colors.text }]}>{user && user.username}</Text>
        <Ionicons name="chevron-down-outline" size={hp(3)} color={colors.text} />
      </TouchableOpacity>

      <View style={[styles.btns]}>
        {/* <TouchableOpacity style={[styles.click, { backgroundColor: colors.card }]}>
          <Ionicons name="cloud-upload-outline" size={hp(2.3)} color={colors.text} />
        </TouchableOpacity> */}
        <TouchableOpacity style={[styles.click, { backgroundColor: colors.card }]} onPress={openMenuModal}>
          <Ionicons name="reorder-three-outline" size={hp(2.3)} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: hp(2),
    marginVertical: hp(2),
  },
  profilesDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: hp(0.5),
  },
  username: {
    fontSize: hp(2.5),
    fontWeight: '500',
  },
  btns: {
    flexDirection: 'row',
    gap: hp(2),
  },
  click: {
    height: hp(4),
    width: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: hp(0.8),
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android shadow
    elevation: 5,
  },
});