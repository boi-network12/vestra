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

  // === Validation functions ===
  const checkUsername = async (username) => {
    if (!username) {
      return { success: false, available: false, message: 'Username is required' };
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/check-username`, {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      console.error('Username check error:', err.response?.data || err);
      return {
        success: false,
        available: false,
        message: err.response?.data?.message || 'Error checking username',
      };
    }
  };

  const checkEmail = async (email) => {
    if (!email) {
      return { success: false, available: false, message: 'Email is required' };
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/check-email`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      console.error('Email check error:', err.response?.data || err);
      return {
        success: false,
        available: false,
        message: err.response?.data?.message || 'Error checking email',
      };
    }
  };

  const checkPhone = async (phoneNumber) => {
    if (!phoneNumber) {
      return { success: false, available: false, message: 'Phone is required' };
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/check-phone`, {
        params: { phoneNumber },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      console.error('Phone check error:', err.response?.data || err);
      return {
        success: false,
        available: false,
        message: err.response?.data?.message || 'Error checking phone',
      };
    }
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
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Update profile error:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      const errors = err.response?.data?.errors || [];
      setError(errorMessage);
      showAlert(errors.length > 0 ? errors.join(', ') : errorMessage, 'error');
      return { success: false, message: errorMessage, errors };
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
        hideAlert,
        checkUsername,
        checkEmail,
        checkPhone,
        showAlert
      }}
    >
      {children}
    </UserContext.Provider>
  );
};