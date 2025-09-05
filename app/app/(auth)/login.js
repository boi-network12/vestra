import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { getThemeColors } from '../../utils/theme';
import { useAlert } from '../../context/AlertContext';
import { withOpacity } from '../../utils/colorUtils';
import LogoImage from '../../assets/images/loadIcon.png';

const RenderBg = ({ children }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={[styles.BgContainer, { backgroundColor: withOpacity(colors.background, 90) }]}>
      <View style={[styles.bgSubWrapper, { backgroundColor: colors.subPrimary }]}>
        {children}
      </View>
    </View>
  );
};

export default function Login() {
  const { login, error, isLoading } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { showAlert } = useAlert();
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = await login(form.email, form.password);

    console.log('Login error:', error); // Debug log to check error value

    if (success) {
      showAlert('Login successful!', 'success');
      router.replace('home');
    } else if (error && error.toLowerCase().includes('verify your account')) {
      await AsyncStorage.setItem('pendingVerificationEmail', form.email);
      showAlert('Please verify your email. A code has been sent.', 'info');
      setTimeout(() => {
        console.log('Navigating to verify with email:', form.email); // Debug log
        router.push({ pathname: 'verify', params: { email: form.email } });
      }, 2000);
    } else if (error && error.includes('Too many verification requests')) {
      showAlert(error, 'error');
    } else {
      showAlert(error || 'Login failed', 'error');
    }
  };

  const renderForm = () => {
    return (
      <View style={[styles.FormContainer, { backgroundColor: colors.background, borderColor: withOpacity(colors.border, 60) }]}>
        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.subText }]}>Email</Text>
          <View style={[styles.boxInput, errors.email && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <TextInput
              placeholder='Enter your email'
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              style={[styles.input, { color: colors.text }]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {errors.email && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.subText }]}>Password</Text>
          <View style={[styles.boxInput, errors.password && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <TextInput
              placeholder='******'
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              secureTextEntry={!showPassword}
              style={[styles.input, { color: colors.text }]}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={hp(2.5)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.password}</Text>}
        </View>

        {/* Remember Me and Forgot Password */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setForm({ ...form, rememberMe: !form.rememberMe })}
          >
            <Ionicons
              name={form.rememberMe ? 'checkbox' : 'square-outline'}
              size={hp(2.5)}
              color={colors.primary}
            />
            <Text style={[styles.checkboxText, { color: colors.subText }]}>Remember for 30 days</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('forgot-password')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.subPrimary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size={hp(3)} color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: '#fff' }]}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => router.push('register')}>
          <Text style={[styles.label, { color: colors.subText }]}>
            Don&apos;t have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <RenderBg>
      <SafeAreaView style={[styles.container]}>
        <StatusBar style='auto' />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : hp(2)}
        >
          <View style={[styles.Topper]}>
            <Image
              source={LogoImage}
              style={{ width: hp(8), height: hp(8) }}
              resizeMode='center'
            />
            <Text style={[styles.TopperText, { color: '#fff' }]}>Login</Text>
          </View>
          {renderForm()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RenderBg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: hp(2),
    marginTop: hp(2),
  },
  BgContainer: {
    flex: 1,
  },
  bgSubWrapper: {
    width: '100%',
    height: hp('50%'),
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  Topper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(8),
  },
  TopperText: {
    fontSize: hp(3),
    fontWeight: '500',
    marginBottom: hp(1.5),
  },
  FormContainer: {
    width: '100%',
    padding: hp(2),
    borderWidth: 0.7,
    borderRadius: hp(0.7),
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: hp(1.6),
    marginTop: hp(2),
  },
  boxInput: {
    marginTop: hp(1.5),
    flexDirection: 'row',
    gap: hp(1),
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: hp(1),
    borderRadius: hp(1),
  },
  input: {
    flex: 1,
    height: hp(5),
  },
  errorInput: {
    borderColor: '#ff3333',
  },
  errorText: {
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
    height: hp(5),
    borderRadius: hp(1),
  },
  btnText: {
    fontSize: hp(1.9),
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: hp(1),
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: hp(1.6),
  },
  linkText: {
    fontSize: hp(1.6),
    fontWeight: '500',
  },
});