
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { useTheme } from '../context/ThemeContext'
import { getThemeColors } from '../utils/theme'




export default function GetStarted() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const HandleRegisterClick = () => {
    router.push("/register")
  }

  const HandleLoginClick = () => {
    router.push("/login")
  }

  return (
    <SafeAreaView 
       className="bg-white min-h-screen items-center w-full"
       style={[styles.container, {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
       }]}
    >
      <StatusBar style='auto' />
      <View style={styles.ImgContainer}>
        <Image
           source={require("../assets/images/GNoti.png")}
           contentFit='contain'
           style={styles.image}
        />
      </View>
      <View style={styles.TextContainer}>
        <Text style={[styles.Text, { color: colors.text}]}>
          Connect, explore and slay safe only, effortlessly
        </Text>
      </View>
      <View style={styles.BtnContainer}>
        <TouchableOpacity style={[styles.Btn, { backgroundColor: colors.primary }]} onPress={HandleRegisterClick}>
          <Text style={[styles.BtnText]}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.Btn, { backgroundColor: "transparent" }]} onPress={HandleLoginClick}>
          <Text style={[styles.BtnText, { color: colors.text }]}>Sign in</Text>
        </TouchableOpacity>
      </View>

      {/* for the footer text */}
      <View style={[styles.TextContainer, { marginTop: hp(5) }]}>
        <Text style={[styles.footerText, { color: colors.text }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  ImgContainer: {
    marginTop: hp(10)
  },
  image: {
    width: hp(45),
    height: hp(45)
  },
  TextContainer: {
    marginTop: hp(3),
    alignItems: "center",
    paddingHorizontal: hp(4)
  },
  Text: {
    fontSize: hp(3),
    textAlign: "center",
    fontWeight: "700",
  },
  footerText: {
    fontSize: hp(1.6),
    textAlign: "center",
    fontWeight: "300",
  },
  BtnContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(3),
  },
  Btn: {
    width: "90%",
    height: hp(5.5),
    borderRadius: hp(3),
    marginTop: hp(2),
    alignItems: "center",
    justifyContent: "center",
  },
  BtnText: {
    fontSize: hp(2),
    color: "#fff",
    fontWeight: "400",
  }
})
