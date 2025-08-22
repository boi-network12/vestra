import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { getThemeColors } from '../../utils/theme';
import { useAlert } from '../../context/AlertContext';

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
      // Store email for verification page
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : hp(2)}
      >
        <View style={styles.headerAction}>
          <Ionicons name='chevron-back-outline' size={hp(3)} color={colors.icon} onPress={() => router.back()} />
        </View>

        <Text style={[styles.HeaderText, { color: colors.text }]}>
          Login <Ionicons name='sparkles-outline' size={hp(1.8)} color={colors.primary} />
        </Text>
        <Text style={[styles.subText, { color: colors.subText }]}>welcome back! please enter your details.</Text>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <View style={[styles.boxInput, errors.email && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Ionicons name='mail-open-outline' size={hp(2.5)} color={colors.icon} />
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
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <View style={[styles.boxInput, errors.password && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Ionicons name='lock-closed-outline' size={hp(2.5)} color={colors.icon} />
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
          <TouchableOpacity onPress={() => console.log('Forgot password')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, isLoading && styles.btnDisabled]} onPress={handleSubmit}>
          <Text style={[styles.btnText, { color: '#fff' }]}>{isLoading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('register')}>
          <Text style={[styles.subText, { color: colors.subText }]}>
            Don&apos;t have an account? <Text style={[styles.linkText, { color: colors.primary }]}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView> 

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: hp(2),
    marginTop: hp(2),
  },
  headerAction: {
    paddingVertical: hp(1),
  },
  HeaderText: {
    fontSize: hp(2),
    fontWeight: '600',
  },
  subText: {
    marginTop: hp(0.5),
    marginBottom: hp(2),
  },
  inputContainer: {
    marginTop: hp(2),
  },
  label: {
    fontSize: hp(1.6),
    fontWeight: '600',
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
    width: wp(93),
    height: hp(5.8),
    borderRadius: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(2),
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
    fontWeight: '500',
  },
  footerLink: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  btnDisabled: {
    opacity: 0.6,
  },
});