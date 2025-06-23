import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MenuModal from '../../../BottomSheet/MenuModal';
import SwitchAccountModal from '../../../BottomSheet/SwitchAccountModal';
import ProfileHeader from '../../../components/headers/ProfileHeader';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { getThemeColors } from '../../../utils/theme';

export default function Profile() {
  const { user, isLoading, linkedAccounts, switchAccount, linkAccount } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  // Switch Account Modalize ref
  const switchAccountModalRef = useRef(null);

  // Menu Modalize ref
  const menuModalRef = useRef(null);

  // Open Switch Account modal
  const openSwitchAccountModal = useCallback(() => {
    switchAccountModalRef.current?.open();
  }, []);

  // Close Switch Account modal
  const closeSwitchAccountModal = useCallback(() => {
    switchAccountModalRef.current?.close();
  }, []);

  // Open Menu modal
  const openMenuModal = useCallback(() => {
    menuModalRef.current?.open();
  }, []);

  // Close Menu modal
  const closeMenuModal = useCallback(() => {
    menuModalRef.current?.close();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={hp(5)} color={colors.primary} />
      </View>
    );
  }

  const navigateToLogin = () => {
    closeSwitchAccountModal();
    router.push('/login');
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar style="auto" />

      <ProfileHeader
        colors={colors}
        user={user}
        openSwitchAccountModal={openSwitchAccountModal}
        openMenuModal={openMenuModal}
      />

      {/* Modal for account management */}
      <SwitchAccountModal
        modalizeRef={switchAccountModalRef}
        colors={colors}
        user={user}
        navigateToLogin={navigateToLogin}
        linkedAccounts={linkedAccounts}
        switchAccount={switchAccount}
        linkAccount={linkAccount}
      />

      {/* Modal for menu options */}
      <MenuModal
        modalizeRef={menuModalRef}
        colors={colors}
        closeModal={closeMenuModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});