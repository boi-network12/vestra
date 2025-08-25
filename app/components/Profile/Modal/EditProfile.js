// EditProfile.js
import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAlert } from '../../../context/AlertContext';
import * as ImagePicker from "expo-image-picker";


const EditProfile = forwardRef(({ colors, user, updateProfile }, ref) => {
  const { showAlert } = useAlert();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(hp(100))).current; 
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    linkTitle: user?.profile?.links?.[0]?.title || '',
    linkUrl: user?.profile?.links?.[0]?.url || '',
    birthDate: user?.profile?.dateOfBirth
      ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0]
      : '',
  })
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for "Next" button navigation
  const bioRef = useRef();
  const linkTitleRef = useRef();
  const linkRef = useRef();
  const birthDateRef = useRef();

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
    },
    close: () => {
      closeModal();
    },
  }));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: hp(100),
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkPhotoPermission = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        return true;
      }

      const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (newStatus === 'granted') {
        return true;
      } else {
        showAlert('Photo library permission is required to select images. Please enable it in settings.', 'error');
        return false;
      }
    } catch (error) {
      showAlert('Error checking permissions: ' + error.message, 'error');
      console.error('Permission check error:', error);
      return false;
    }
  };

  const selectImage = async (type) => {
    const hasPermission = await checkPhotoPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: true
      });

      if (!result.canceled && result.assets) {
        const file = result.assets[0];
        console.log('Selected Image:', file);

        const formattedFile = {
          uri: file.uri,
          type: file.mimeType || `image/${file.uri.split('.').pop()}`,
          fileName: file.fileName || `image-${Date.now()}.${file.uri.split('.').pop()}`
        };
        if (type === 'avatar') {
          setAvatarFile(formattedFile);
        } else {
          setCoverPhotoFile(formattedFile);
        }
      }
    } catch (error) {
      showAlert('Error selecting image: ' + error.message, 'error');
      console.error('Image selection error:', error);
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        links: formData.linkTitle && formData.linkUrl ? [{ title: formData.linkTitle, url: formData.linkUrl }] : [],
        birthDate: formData.birthDate,
      };

      const success = await updateProfile(profileData, avatarFile, coverPhotoFile);
      if (success) {
        showAlert('Profile updated successfully', 'success');
        closeModal();
      } else {
        showAlert('Failed to update profile', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerNav = () => (
    <View style={styles.NavContainer}>
      <View style={styles.NavTitleArrow}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <AntDesign name="arrowleft" size={hp(3)} color={colors.text} />
        </TouchableWithoutFeedback>

        <Text style={[styles.NavTitle, { color: colors.text }]}>Edit profile</Text>
      </View>

      <TouchableWithoutFeedback onPress={handleSave} disabled={isSubmitting}>
        <Text style={[styles.NavSave, { color: colors.primary }]}>
          {isSubmitting ? (<ActivityIndicator color={colors.primary}  size={hp(2.5)} />) : 'Save'}
        </Text>
      </TouchableWithoutFeedback>
    </View>
  );

  const renderPhotos = () => (
    <View style={styles.photosDisplay}>
      <TouchableOpacity 
        style={styles.coverPictureContainer}
        onPress={() => selectImage('coverPhoto')}
      >
        <Image
          source={{
            uri: coverPhotoFile?.uri || user?.profile?.coverPhoto || 'https://picsum.photos/seed/696/3000/2000',
          }}
          style={styles.coverPicture}
        />
        <SimpleLineIcons
            name="camera"
            size={hp(4)}
            color={colors.text}
            style={styles.cameraIcon}
          />
      </TouchableOpacity>
      
      <TouchableOpacity  
         style={[styles.avatarContainer, { borderColor: colors.background }]}
         onPress={() => selectImage('avatar')}
        >
        <Image
          source={{
            uri: avatarFile?.uri || user?.profile?.avatar || 'https://picsum.photos/seed/696/3000/2000',
          }}
          style={styles.coverPicture}
        />
          <SimpleLineIcons
            name="camera"
            size={hp(4)}
            color={colors.text}
            style={styles.cameraIcon}
          />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={closeModal}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalBackground, { backgroundColor: colors.background }]}>
            <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
              {headerNav()}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.EditProfileContent}
              >
                {renderPhotos()}

                {/* form for name bio and links */}
                <View style={styles.formContainer}>
                  {/* Name */}
                  <View style={styles.InputContainer}>
                    <Text style={[{ color: colors.text }]}>First Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, height: hp(5) },
                      ]}
                      placeholder="Your first name"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      returnKeyType="next"
                      onSubmitEditing={() => bioRef.current.focus()}
                    />
                  </View>
                  <View style={styles.InputContainer}>
                    <Text style={[{ color: colors.text }]}>Last Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, height: hp(5) },
                      ]}
                      placeholder="Your last name"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      returnKeyType="next"
                      onSubmitEditing={() => bioRef.current.focus()}
                    />
                  </View>
                  {/* bio */}
                  <View style={styles.InputContainer}>
                    <Text style={[{ color: colors.text }]}>Bio</Text>
                    <TextInput
                      ref={bioRef}
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, maxHeight: hp(12) },
                      ]}
                      multiline
                      placeholder="Add bio"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      maxLength={150}
                      value={formData.bio}
                      onChangeText={(text) => handleInputChange('bio', text)}
                      returnKeyType="next"
                      onSubmitEditing={() => linkTitleRef.current.focus()}
                    />
                  </View>

                  {/* Link */}
                  <View style={styles.InputContainer}>
                    <Text style={[{ color: colors.text }]}>Link title</Text>
                    <TextInput
                      ref={linkTitleRef}
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, height: hp(5) },
                      ]}
                      placeholder="Add link title"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      value={formData.linkTitle}
                      onChangeText={(text) => handleInputChange('linkTitle', text)}
                      returnKeyType="next"
                      onSubmitEditing={() => linkRef.current.focus()}
                    />
                    <Text style={[{ color: colors.text }]}>Link</Text>
                    <TextInput
                      ref={linkRef}
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, height: hp(5) },
                      ]}
                      placeholder="Add the link"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      value={formData.linkUrl}
                      onChangeText={(text) => handleInputChange('linkUrl', text)}
                      returnKeyType="next"
                      onSubmitEditing={() => birthDateRef.current.focus()}
                    />
                  </View>

                  {/* Birth date */}
                  <View style={styles.InputContainer}>
                    <Text style={[{ color: colors.text }]}>Birth date (YYYY-MM-DD)</Text>
                    <TextInput
                      ref={birthDateRef}
                      style={[
                        styles.input,
                        { color: colors.text, borderBottomColor: colors.border, height: hp(5) },
                      ]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.subText}
                      selectionColor={colors.border}
                      value={formData.birthDate}
                      onChangeText={(text) => handleInputChange('birthDate', text)}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
});

EditProfile.displayName = 'EditProfile';
export default EditProfile;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
  },
  NavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: hp(2),
  },
  NavTitleArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(3),
  },
  NavSave: {
    fontSize: hp(2),
    fontWeight: '500',
  },
  photosDisplay: {
    width: '100%',
    position: 'relative',
  },
  coverPictureContainer: {
    width: '100%',
    height: hp(20),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPicture: {
    width: '100%',
    height: hp(20),
    objectFit: 'cover',
  },
  avatarContainer: {
    width: hp(13),
    height: hp(13),
    overflow: 'hidden',
    objectFit: 'cover',
    position: 'absolute',
    left: hp(3),
    top: hp(13),
    borderWidth: hp(0.5),
    borderRadius: hp(6.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
  },
  formContainer: {
    paddingHorizontal: hp(2),
    marginTop: hp(10),
  },
  InputContainer: {
    width: '100%',
    marginBottom: hp(2),
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: hp(1),
    fontSize: hp(2),
  },
});
