import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomAlert from '../../components/custom/CustomAlert';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { getThemeColors } from '../../utils/theme';

export default function Register() {
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { register, error, isLoading } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'info' });
  

  const validateForm = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    });

    if (success) {
      await AsyncStorage.setItem('pendingVerificationEmail', form.email);
      setAlert({ visible: true, message: 'Verify your email. A verification link has been sent.', type: 'success' });
      setTimeout(() => {
        router.push({
          pathname: 'verify',
          params: { email: form.email },
        });
      }, 2000);
    } else {
      setAlert({ visible: true, message: error || 'Registration failed', type: 'error' });
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
          Create an account <Ionicons name='sparkles-outline' size={hp(1.8)} color={colors.primary} />
        </Text>
        <Text style={[styles.subText, { color: colors.subText }]}>Welcome! Please enter your details.</Text>

        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <View style={[styles.boxInput, errors.firstName && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Ionicons name='person-outline' size={hp(2.5)} color={colors.icon} />
            <TextInput
              placeholder='Enter your First Name'
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              style={[styles.input, { color: colors.text }]}
              value={form.firstName}
              onChangeText={(text) => setForm({ ...form, firstName: text })}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />
          </View>
          {errors.firstName && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.firstName}</Text>}
        </View>

        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <View style={[styles.boxInput, errors.lastName && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Ionicons name='person-outline' size={hp(2.5)} color={colors.icon} />
            <TextInput
              placeholder='Enter your Last Name'
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              style={[styles.input, { color: colors.text }]}
              value={form.lastName}
              onChangeText={(text) => setForm({ ...form, lastName: text })}
              ref={lastNameRef}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />
          </View>
          {errors.lastName && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.lastName}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <View style={[styles.boxInput, errors.email && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Ionicons name='mail-outline' size={hp(2.5)} color={colors.icon} />
            <TextInput
              placeholder='Enter your email'
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              style={[styles.input, { color: colors.text }]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              ref={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
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
              ref={passwordRef}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size={hp(2)} color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: '#fff' }]}>Sign up</Text>
          )}
        </TouchableOpacity>


        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('login')}>
          <Text style={[styles.subText, { color: colors.subText }]}>
            Already have an account? <Text style={[styles.linkText, { color: colors.primary }]}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
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
  footerLink: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  linkText: {
    fontWeight: '500',
  },
});