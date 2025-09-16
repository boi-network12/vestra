import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context"
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';

export default function OTP() {
  const { verifyUser, resendVerificationCode, error, isLoading } = useAuth();
  const { email: emailFromParams } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState(emailFromParams || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  // Fetch email from AsyncStorage if not provided in params
  useEffect(() => {
    const fetchEmail = async () => {
      if (!email) {
        const storedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          showAlert('Email not available. Please try registering again.', 'error');
        }
      }
    };
    fetchEmail();
  }, [email, showAlert]);

  // Timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (text, index) => {
    if (text.length > 1 || !/^[0-9]?$/.test(text)) return; // Restrict to single digit numbers

    const newOtp = [...otp];
    newOtp[index] = text; // Keep input as numeric
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text) => {
    if (text.length <= 6 && /^[0-9]{0,6}$/.test(text)) { // Only allow numbers
      const newOtp = text
        .slice(0, 6)
        .split('')
        .concat(Array(6 - text.length).fill(''));
      setOtp(newOtp);
      inputRefs.current[Math.min(text.length - 1, 5)]?.focus();
    }
  };

  const validateOtp = () => {
    return otp.every((char) => char !== '');
  };

  const handleSubmit = async () => {
    if (!validateOtp()) {
      showAlert('Please enter all 6 digits', 'error');
      return;
    }

    const otpCode = otp.join('');
    const success = await verifyUser(otpCode);

    if (success) {
      await AsyncStorage.removeItem('pendingVerificationEmail'); // Clear stored email
      showAlert('Account verified successfully!', 'success');
      setTimeout(() => router.replace('home'), 1500);
    } else {
      showAlert(error || 'Invalid or expired code', 'error');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    if (!email) {
      showAlert('Email not provided', 'error');
      return;
    }

    const success = await resendVerificationCode({ email });

    if (success) {
      showAlert('New OTP sent to your email', 'success');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimer(30);
    } else {
      showAlert(error || 'Failed to resend OTP', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : hp(2)}
      >
        <View style={styles.headerAction}>
          <Ionicons name="chevron-back-outline" size={hp(3)} onPress={() => router.back()} />
        </View>

        <Text style={styles.headerText}>
          Verify OTP <Ionicons name="shield-checkmark-outline" size={hp(1.8)} color="#1DA1F2" />
        </Text>
        <Text style={styles.subText}>Enter the 6-digit code sent to {email || 'your email'}</Text>

        <View style={styles.otpContainer}>
          {otp.map((char, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, !char && alert.type === 'error' && styles.errorInput]}
              value={char}
              onChangeText={(text) => handleOtpChange(text, index)}
              onPaste={(e) => handlePaste(e.nativeEvent.text)}
              maxLength={1}
              keyboardType="number-pad" // Restrict to numeric input
              textAlign="center"
              autoCapitalize="none"
              selectionColor="#1DA1F2"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.resendLink, timer > 0 && styles.resendLinkDisabled]}
          onPress={handleResend}
          disabled={timer > 0 || isLoading}
        >
          <Text style={[styles.linkText, timer > 0 && styles.linkTextDisabled]}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>{isLoading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  headerAction: {
    paddingVertical: hp(1),
  },
  headerText: {
    fontSize: hp(2.5),
    fontWeight: '600',
    color: '#333',
  },
  subText: {
    color: '#666',
    marginTop: hp(1),
    marginBottom: hp(3),
    fontSize: hp(1.8),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  otpInput: {
    width: wp(14),
    height: hp(7),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: hp(1.5),
    fontSize: hp(2.5),
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  errorInput: {
    borderColor: '#ff3333',
    backgroundColor: '#fff0f0',
  },
  btn: {
    backgroundColor: '#1DA1F2',
    width: wp(90),
    height: hp(6),
    borderRadius: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(2),
  },
  btnDisabled: {
    backgroundColor: '#80C7F2',
  },
  btnText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
  },
  resendLink: {
    alignItems: 'center',
    marginVertical: hp(1),
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
  linkText: {
    color: '#1DA1F2',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  linkTextDisabled: {
    color: '#80C7F2',
  },
});