import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Modalize } from 'react-native-modalize';
import { Portal } from 'react-native-portalize';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function SwitchAccountModal({ modalizeRef, colors, user, onPositionChange, navigateToLogin, linkedAccounts, switchAccount, linkAccount }) {
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLinkAccount = async () => {
    const success = await linkAccount(email, password);
    if (success) {
      setShowAddAccountForm(false);
      setEmail('');
      setPassword('');
    }
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(5) : 0}
          style={{ flex: 1 }}
        >
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.background }]}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Switch account</Text>
            <TouchableOpacity onPress={() => modalizeRef.current?.close()}>
              <Ionicons name="close" size={hp(3)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.accountContainer}>
            {/* Active account */}
            <TouchableOpacity style={styles.accountItem}>
              {user && user.profile && user.profile.avatar ? (
                <Image
                  source={{ uri: user.profile.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarLetter, { color: colors.border }]}>
                    {user && user.profile && user.profile.firstName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.accountInfo}>
                <Text style={[styles.accountText, { color: colors.text }]}>{user && user.username ? user.username : 'Guest'}</Text>
                <Text style={[styles.accountSubText, { color: colors.subText }]}>
                  Active Account
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={hp(3)} color={colors.primary} />
            </TouchableOpacity>

            {linkedAccounts.map((account) => (
              <TouchableOpacity
                key={account._id}
                style={styles.accountItem}
                onPress={() => switchAccount(account._id)}
              >
                {account.profile?.avatar ? (
                  <Image
                    source={{ uri: account.profile.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarLetter, { color: colors.text }]}>
                      {account.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountText, { color: colors.text }]}>{account.username}</Text>
                  <Text style={[styles.accountSubText, {color: colors.subText}]}>
                    {account.email}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add account option */}
            {!showAddAccountForm ? (
              <TouchableOpacity
                style={styles.accountItem}
                onPress={() => setShowAddAccountForm(true)}
              >
                <Ionicons name="add-circle-outline" size={hp(4)} color={colors.subText} />
                <Text style={[styles.accountText, { color: colors.subText }]}>Add Account</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.addAccountForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.formTitle, { color: colors.text }]}>Add New Account</Text>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholderTextColor={colors.placeholder}
                />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleLinkAccount}
                >
                  <Text style={[styles.buttonText, { color: colors.background }]}>Link Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowAddAccountForm(false)}
                >
                  <Text style={[styles.linkText, { color: colors.subText }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
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
  accountContainer: {
    flex: 1,
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(2),
  },
  accountInfo: {
    flex: 1,
    marginLeft: hp(1.5),
  },
  accountText: {
    fontSize: hp(2),
    fontWeight: '600',
  },
  accountSubText: {
    fontSize: hp(1.5),
    fontWeight: '400',
  },
  avatarImage: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    marginRight: hp(1.5),
  },
  avatarPlaceholder: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hp(1.5),
  },
  avatarLetter: {
    fontSize: hp(2),
    fontWeight: '700',
  },
  addAccountForm: {
    padding: hp(2),
    borderRadius: hp(1.5),
    marginVertical: hp(1),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: hp(1),
    elevation: 3,
  },
  formTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: hp(1),
    padding: hp(1.5),
    marginBottom: hp(1.5),
    fontSize: hp(1.8),
  },
  button: {
    borderRadius: hp(1),
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(2),
    alignItems: 'center',
    marginBottom: hp(1),
  },
  buttonText: {
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: hp(1),
    borderWidth: 1,
    borderRadius: hp(1),
  },
  linkText: {
    fontSize: hp(1.6),
    fontWeight: '500',
  }
});