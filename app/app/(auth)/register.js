import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { getThemeColors } from '../../utils/theme';
import { useAlert } from '../../context/AlertContext';
import { withOpacity } from '../../utils/colorUtils';
import LogoImage from "../../assets/images/loadIcon.png"

const RenderBg = ({ children }) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

    return (
      <View style={[ styles.BgContainer, { backgroundColor: withOpacity(colors.background, 90) }]}>
        <View style={[styles.bgSubWrapper, { backgroundColor: colors.subPrimary }]}>
          {children}
        </View>
      </View>
    )
  }

export default function Register() {
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { register, error, isLoading } = useAuth();
  const { isDark } = useTheme();
  const { showAlert } = useAlert();
  const colors = getThemeColors(isDark);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  

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
      showAlert('Verify your email. A verification link has been sent.', 'success');
      setTimeout(() => {
        router.push({
          pathname: 'verify',
          params: { email: form.email },
        });
      }, 2000);
    } else {
      showAlert(error || 'Registration failed', 'error');
    }
  };

  const renderForm = () => {
    return (
      <View style={[ styles.FormContainer,{ backgroundColor: colors.background, borderColor: withOpacity(colors.border, 60) }]}>
        {/* first Name  */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.subText, marginTop: 0 }]}>First Name</Text>
          <View style={[styles.boxInput, errors.firstName && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
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

        {/* last Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.subText }]}>Last Name</Text>
          <View style={[styles.boxInput, errors.lastName && styles.errorInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
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
              ref={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />
          </View>
          {errors.email && <Text style={[styles.errorText, { color: colors.errorText }]}>{errors.email}</Text>}
        </View>

        {/* password */}
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

        <TouchableOpacity style={styles.inputContainer}>
         <Text style={[styles.label, { color: colors.subText }]}>I agree to the terms & condition</Text>
        </TouchableOpacity>

        {/* submit btn */}
        
        <TouchableOpacity
            style={[ styles.btn,{ backgroundColor: colors.subPrimary }]}
            onPress={handleSubmit}
            disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
               size={hp(3)}
               color="#fff"
            />
          ) : <Text style={[styles.btnText, { color: '#fff' }]}>Create Account</Text>}
        </TouchableOpacity>

        {/* this is a place to add others like google and apple auth */}

        <TouchableOpacity style={styles.inputContainer} onPress={() => router.push("/login")}>
         <Text style={[styles.label, { color: colors.subText }]}>I Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <RenderBg>
      <SafeAreaView style={[styles.container, ]}>
        <StatusBar style='auto'/>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : hp(2)}
        >
          <View style={[ styles.Topper,{}]}>
            <Image
              source={LogoImage}
              style={{ width: hp(8), height: hp(8) }}
              resizeMode='center'
            />
            <Text style={[ styles.TopperText,{ color: "#fff" }]}>Create an Account</Text>
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
    width: "100%",
    height: hp("50%"),
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  Topper: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(8)
  },
  TopperText: {
    fontSize: hp(3),
    fontWeight: "500",
    marginBottom: hp(1.5)
  },
  FormContainer: {
    width: "100%",
    padding: hp(2),
    borderWidth: 0.7,
    borderRadius: hp(0.7)
  },
  inputContainer:{
    width: "100%",
  },
  label: {
    fontSize: hp(1.6),
    marginTop: hp(2)
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
  btn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
    height: hp(5),
    borderRadius: hp(1)
  }
})

