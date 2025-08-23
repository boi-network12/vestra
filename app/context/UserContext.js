// context/UserContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createContext, useContext, useState } from 'react';
import { API_URL } from '../config/apiConfig';
import { AuthContext } from './AuthContext';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { fetchUserProfile } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'info' });

  const showAlert = (message, type = 'info') => {
    setAlert({ visible: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/users/me`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserProfile(response.data.data);
      setError(null);
      showAlert('Profile updated successfully!', 'success');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePicture = async (image) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      const response = await axios.put(
        `${API_URL}/api/users/me/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUserProfile({ ...userProfile, profile: { ...userProfile.profile, avatar: response.data.data.avatar } });
      setError(null);
      showAlert('Profile picture updated successfully!', 'success');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile picture');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isLoading,
        error,
        fetchUserProfile,
        updateProfile,
        updateProfilePicture,
        hideAlert
      }}
    >
      {children}
    </UserContext.Provider>
  );
};