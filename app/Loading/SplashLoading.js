import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function SplashLoading() {

  return (
    <View style={styles.loadingContainer}>
        <StatusBar style='auto' />
        <View style={styles.wrapper}>
            <Image
                source={require('../assets/images/loadIcon.png')}
                contentFit='contain'
                style={styles.img}
            />
            <ActivityIndicator
                color='#FFFFFF'
                size={hp(3)}
                style={{ marginTop: hp(2) }}
            />
        </View>
     </View>
  );
}


const styles = StyleSheet.create({
    loadingContainer: {
        backgroundColor: '#02001C',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    img: {
        height: hp(20),
        width: hp(20),
    },
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})