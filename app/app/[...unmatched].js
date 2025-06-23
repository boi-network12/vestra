// app/[...unmatched].js
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style='auto' />
      
      {/* Animated 404 illustration */}
      <LottieView
        source={require('../assets/animations/404.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={wp(15)} color="#ff3b30" />
        </View>
        
        <Text style={styles.title}>Oops! Page Not Found</Text>
        <Text style={styles.subtitle}>Error 404</Text>
        
        <Text style={styles.message}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        
        <Pressable onPress={() => router.replace('/')} style={styles.link}>
          <View style={styles.linkContainer}>
            <Ionicons name="home" size={wp(5)} color="#3A86FF" />
            <Text style={styles.linkText}>Return to Home</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp(5),
  },
  animation: {
    width: wp(100),
    height: hp(30),
    marginBottom: hp(2),
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: hp(2),
  },
  message: {
    fontSize: wp(4),
    color: '#495057',
    textAlign: 'center',
    marginBottom: hp(4),
    lineHeight: hp(3),
    paddingHorizontal: wp(5),
  },
  link: {
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: wp(2),
    width: '100%',
  },
  linkText: {
    fontSize: wp(4),
    color: '#3A86FF',
    fontWeight: '600',
    marginLeft: wp(2),
  },
});