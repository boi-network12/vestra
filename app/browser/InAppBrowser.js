import React from 'react'
import { View, StyleSheet, Linking, TouchableOpacity, Platform, Modal } from 'react-native'
import WebView, {} from "react-native-webview"
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"

export default function InAppBrowser({ isVisible, url, colors, onClose }) {

    const openExternalBrowser = () => {
        Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err))
    }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with back button and menu */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openExternalBrowser}>
            <Ionicons name="link-outline" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* WebView for in-app browsing */}
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState={true}
          scalesPageToFit={Platform.OS === 'ios'}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
     container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    webview: {
        flex: 1,
    },
})