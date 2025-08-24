import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { widthPercentageToDP as wp } from "react-native-responsive-screen"

export default function PostItem({ item, viewMode, colors, user }) {
    if (!user) return null;


  return (
    <View style={[styles.StubPostDisplay]}>
        {/* for new user display only */}

        <View style={[styles.postItem, { backgroundColor: colors.card, width: viewMode === 'grid' ? wp(45) : wp(90) }]}>
        {/* post will display here */}
            <Text style={{color: colors.text}}>{item ? "hi" : "no post"}</Text>
        </View>
    </View>
  )
}


const styles = StyleSheet.create({
  
});