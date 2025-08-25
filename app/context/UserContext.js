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

  const updateProfile = async (profileData, avatarFile, coverPhotoFile) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      // Append text fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "links" || key === 'location') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      // Append avatar file
      if (avatarFile) {
        formData.append('avatar', {
          uri: avatarFile.uri,
          name: avatarFile.fileName || `avatar.${avatarFile.type.split('/')[1]}`,
          type: avatarFile.type,
        });
      }

      // Append cover photo file
      if (coverPhotoFile) {
        formData.append('coverPhoto', {
          uri: coverPhotoFile.uri,
          name: coverPhotoFile.fileName || `coverPhoto.${coverPhotoFile.type.split('/')[1]}`,
          type: coverPhotoFile.type,
        });
      }

      const response = await axios.put(
        `${API_URL}/api/users/me`,
        formData,
        {
          headers: { 
             Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUserProfile(response.data.data);
      fetchUserProfile();
      setError(null);
      showAlert('Profile updated successfully!', 'success');
      return true;
    } catch (err) {
      console.error('Update profile error:', err.response?.data, err);
      setError(err.response?.data?.message || 'Failed to update profile');
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
        hideAlert
      }}
    >
      {children}
    </UserContext.Provider>
  );
};