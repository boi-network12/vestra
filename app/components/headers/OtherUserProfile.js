import { View, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Entypo, Octicons } from '@expo/vector-icons';

export default function OtherUserProfile({ router, colors, onClickShareBtn }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
         onPress={() => router.back()}
      >
        <Entypo name='chevron-left' size={hp(3)} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
         onPress={onClickShareBtn}
      >
        <Octicons name='share-android' size={hp(3)} color={colors.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "space-between",
        paddingHorizontal: hp(1.5),
        marginTop: hp(1.5),
        marginBottom: hp(3)
    }
})