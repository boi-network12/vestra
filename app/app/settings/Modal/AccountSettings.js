import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../../context/AlertContext';

export default function AccountSettings({ colors, user, updateProfile, checkUsername, checkEmail, checkPhone, logout }) {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [isEditing, setIsEditing] = useState({
    username: false,
    email: false,
    phoneNumber: false,
  });
  const [status, setStatus] = useState({
    username: null, // null, 'valid', 'invalid', 'checking'
    email: null,
    phoneNumber: null,
  });
  const [errorMessages, setErrorMessages] = useState({
    username: '',
    email: '',
    phoneNumber: '',
  });


  // Debounced profile update
  const debouncedUpdateProfile = useMemo(
    () =>
      debounce(async (updatedFields) => {
        try {
          if (Object.keys(updatedFields).length === 0) {
            showAlert('No changes to update', 'info');
            return;
          }

          // Ensure all fields being updated are valid
          const invalidFields = Object.keys(updatedFields).filter(field => status[field] === 'invalid');
           if (invalidFields.length > 0) {
            const errorMessage = invalidFields
              .map(field => errorMessages[field] || `Invalid ${field}`)
              .join(', ');
            showAlert(`Cannot update profile: ${errorMessage}`, 'error');
            return;
          }

          const result = await updateProfile(updatedFields);
          if (result.success) {
            showAlert('Profile updated successfully!', 'success');
            setIsEditing({ username: false, email: false, phoneNumber: false });
            setErrorMessages({ username: '', email: '', phoneNumber: '' });
          } else {
            showAlert(result.errors?.join(', ') || result.message || 'Failed to update profile', 'error');
          }
        } catch (error) {
          console.error('Update profile error:', error);
          showAlert(error.message || 'An error occurred while updating your profile', 'error');
        }
      }, 300),
    [updateProfile, showAlert, status, errorMessages]
  );

  // Handle input changes with validation
  const handleInputChange = useCallback(
    async (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setStatus(prev => ({ ...prev, [field]: value.trim() ? 'checking' : null }));
      setErrorMessages(prev => ({ ...prev, [field]: '' }));

      if (!value.trim()) {
        setStatus(prev => ({ ...prev, [field]: null }));
        return;
      }

      const updatedFields = {};
      try {
        if (field === 'username' && value !== user?.username) {
          updatedFields.username = value;
          if (value.length < 3) {
            setStatus(prev => ({ ...prev, username: 'invalid' }));
            setErrorMessages(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
            showAlert('Username must be at least 3 characters', 'error');
            return;
          }
          if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setStatus(prev => ({ ...prev, username: 'invalid' }));
             setErrorMessages(prev => ({
              ...prev,
              username: 'Username can only contain letters, numbers, and underscores',
            }));
            showAlert('Username can only contain letters, numbers, and underscores', 'error');
            return;
          }
          const result = await checkUsername(value);
          setStatus(prev => ({ ...prev, username: result.available ? 'valid' : 'invalid' }));
          setErrorMessages(prev => ({ ...prev, username: result.message }));
          if (!result.available) {
            showAlert(result.message || 'Username already taken', 'error');
            return;
          }
        } else if (field === 'email' && value !== user.email) {
          updatedFields.email = value;
          if (!/^\S+@\S+\.\S+$/.test(value)) {
            setStatus(prev => ({ ...prev, email: 'invalid' }));
            setErrorMessages(prev => ({ ...prev, email: 'Invalid email format' }));
            showAlert('Invalid email format', 'error');
            return;
          }
          const result = await checkEmail(value);
          setStatus(prev => ({ ...prev, email: result.available ? 'valid' : 'invalid' }));
          setErrorMessages(prev => ({ ...prev, email: result.message }));
          if (!result.available) {
            showAlert(result.message || 'Email already taken', 'error');
            return;
          }
        } else if (field === 'phoneNumber' && value !== user?.phoneNumber) {
          updatedFields.phoneNumber = value;
          if (!/^\+?[\d\s\-()]{7,15}$/.test(value)) {
            setStatus(prev => ({ ...prev, phoneNumber: 'invalid' }));
            setErrorMessages(prev => ({ ...prev, phoneNumber: 'Invalid phone number format' }));
            showAlert('Invalid phone number format', 'error');
            return;
          }
          const result = await checkPhone(value);
          setStatus(prev => ({ ...prev, phoneNumber: result.available ? 'valid' : 'invalid' }));
          setErrorMessages(prev => ({ ...prev, phoneNumber: result.message }));
          if (!result.available) {
            showAlert(result.message || 'Phone number already taken', 'error');
            return;
          }
        } else {
          setStatus(prev => ({ ...prev, [field]: null }));
          return;
        }

        // Trigger update if valid
        debouncedUpdateProfile(updatedFields);
      } catch (error) {
        setStatus(prev => ({ ...prev, [field]: 'invalid' }));
        setErrorMessages(prev => ({ ...prev, [field]: error.message || `Error validating ${field}` }));
        showAlert(error.message || `Error validating ${field}`, 'error');
      }
    },
    [user, checkUsername, checkEmail, checkPhone, showAlert, debouncedUpdateProfile]
  );

  // Get icon based on status
  const getIcon = (field) => {
    if (!isEditing[field]) return 'pencil';
    if (status[field] === 'checking') return 'refresh';
    if (status[field] === 'valid') return 'checkmark-circle';
    if (status[field] === 'invalid') return 'warning';
    return 'pencil';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Username */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.subText }]}>Username</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsEditing(prev => ({ ...prev, username: true }))}
        >
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.inputBg,
                borderColor: status.username === 'invalid' ? colors.errorText : colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.username}
              editable={isEditing.username}
              placeholder={`@${user?.username || ""}`}
              placeholderTextColor={colors.placeholder}
              onChangeText={text => handleInputChange('username', text.replace(/[^a-zA-Z0-9_]/g, ''))}
            />
            <Ionicons
              name={getIcon('username')}
              size={hp(2.8)}
              color={
                status.username === 'valid' ? colors.primary :
                status.username === 'invalid' ? colors.errorText :
                colors.primary
              }
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.subText }]}>Email</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsEditing(prev => ({ ...prev, email: true }))}
        >
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.inputBg,
                borderColor: status.email === 'invalid' ? colors.errorText : colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.email}
              editable={isEditing.email}
              placeholder={user?.email || 'Add'}
              placeholderTextColor={colors.placeholder}
              onChangeText={text => handleInputChange('email', text)}
            />
            <Ionicons
              name={getIcon('email')}
              size={hp(2.8)}
              color={
                status.email === 'valid' ? colors.primary :
                status.email === 'invalid' ? colors.errorText :
                colors.primary
              }
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Phone Number */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.subText }]}>Phone</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsEditing(prev => ({ ...prev, phoneNumber: true }))}
        >
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.inputBg,
                borderColor: status.phoneNumber === 'invalid' ? colors.errorText : colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.phoneNumber}
              editable={isEditing.phoneNumber}
              placeholder={user?.phoneNumber || 'Add'}
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              onChangeText={text => handleInputChange('phoneNumber', text)}
            />
            <Ionicons
              name={getIcon('phoneNumber')}
              size={hp(2.8)}
              color={
                status.phoneNumber === 'valid' ? colors.primary :
                status.phoneNumber === 'invalid' ? colors.errorText :
                colors.primary
              }
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Country (Not Editable) */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.subText }]}>Country</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.staticText, { color: colors.text }]}>
            {user?.profile?.location?.country || 'Add'}
          </Text>
        </View>
      </View>

        <TouchableOpacity onPress={logout}>
          <Text style={[{ color: colors.errorText }]}>Logout</Text>
        </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: hp(1.5),
  },
  inputContainer: {
    marginBottom: hp(2.2),
  },
  label: {
    fontSize: hp(1.6),
    marginBottom: hp(0.7),
    fontWeight: '500',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: hp(1.2),
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.8),
  },
  input: {
    flex: 1,
    fontSize: hp(1.8),
  },
  staticText: {
    flex: 1,
    fontSize: hp(1.8),
    opacity: 0.8,
  },
});