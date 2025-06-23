
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function Splash({ onFinish }) {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(onFinish, 3000); // Finish after 3 seconds
        });
      });
    }, [logoOpacity, onFinish, textOpacity]);


  return (
    <View style={styles.container}>
        <StatusBar style='auto'/>
        <Animated.Image
            source={require('../assets/images/loadIcon.png')} 
            style={[styles.logo, { opacity: logoOpacity }]}
            resizeMode="contain"
        />
        <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
            vestra
        </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02001C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: hp(20),
    height: hp(20),
  },
  text: {
    marginTop: hp(10),
    fontSize: hp(1.8),
    color: '#FFFFFF',
    fontWeight: 'semibold',
  },
});