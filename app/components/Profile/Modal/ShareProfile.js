import { 
  Text, Modal, TouchableOpacity, StyleSheet, View, Share 
} from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import QRCode from 'react-native-qrcode-svg';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
// import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { useAlert } from '../../../context/AlertContext';

const ShareProfile = forwardRef(({ colors, user }, ref) => {
  const [visible, setVisible] = useState(false);
  const { showAlert } = useAlert();
  const qrRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const profileLink = `myapp://profile/${user?._id}`;
  const fallbackLink = `https://yourapp.com/profile/${user?._id}`;
  const shareLink = profileLink || fallbackLink;

  // Share profile link
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my profile: ${fallbackLink}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareLink);
    showAlert("Profile link copied to clipboard!", "success");
  };

  // Download QR Code
  const handleDownload = async () => {
    // try {
    //   const { status } = await MediaLibrary.requestPermissionsAsync();
    //   if (status !== 'granted') {
    //     showAlert('Permission Denied', 'We need storage permission to save QR code.', 'error');
    //     return;
    //   }

    //   const uri = await qrRef.current.capture();
    //   await MediaLibrary.saveToLibraryAsync(uri);
    //   showAlert('Saved', 'QR code saved to gallery!', 'success');
    // } catch (err) {
    //   console.error(err);
    //   showAlert('Error', 'Could not save QR code.', 'error');
    // }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      {/* Dimmed background */}
      <View style={styles.overlay}>
        {/* Center card */}
        <View style={[styles.card, { backgroundColor: colors.background }]}>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
            <AntDesign name="close" size={hp(2.5)} color={colors.text} />
          </TouchableOpacity>

          {/* Profile avatar */}
          <Image
            source={{ uri: user?.profile?.avatar || "https://via.placeholder.com/150" }}
            style={styles.avatar}
          />

          {/* Username */}
          <Text style={[styles.username, { color: colors.text }]}>
            @{user?.username || "user"}
          </Text>

          {/* QR Code */}
          <ViewShot
            ref={qrRef}
            options={{ format: 'png', quality: 1.0 }}
            style={{ backgroundColor: colors.background || '#fff' }}
          >
            <View style={styles.qrContainer}>
              <QRCode
                value={shareLink}
                size={hp(20)}
                backgroundColor="transparent"
                color={colors.primary}
              />
            </View>
          </ViewShot>


          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]} onPress={handleShare}>
              <MaterialIcons name="share" size={hp(2.5)} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]} onPress={handleCopyLink}>
              <MaterialIcons name="link" size={hp(2.5)} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Copy link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]} onPress={handleDownload}>
              <MaterialIcons name="download" size={hp(2.5)} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

ShareProfile.displayName = 'ShareProfile';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(2),
  },
  card: {
    width: '90%',
    borderRadius: hp(2),
    padding: hp(3),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  closeBtn: {
    position: 'absolute',
    top: hp(1.5),
    right: hp(1.5),
    padding: hp(0.8),
    borderRadius: hp(5),
  },
  avatar: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    marginBottom: hp(1.5),
  },
  username: {
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  qrContainer: {
    marginVertical: hp(2),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1.5),
    marginHorizontal: hp(0.5),
    borderRadius: hp(1.5),
  },
  actionText: {
    marginTop: hp(0.5),
    fontSize: hp(1.5),
  },
});

export default ShareProfile;
