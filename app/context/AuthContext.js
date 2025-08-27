// context/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { createContext, useCallback, useEffect, useState } from 'react';
import { API_URL } from '../config/apiConfig';
import { router } from "expo-router";


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'info' });

  const getUserLocation = async () => {
  try {
    // Check if location services are enabled
    const isLocationAvailable = await Location.hasServicesEnabledAsync();
    if (!isLocationAvailable) {
      console.warn('Location services are disabled on the device');
      return {
        latitude: null,
        longitude: null,
        city: 'unknown',
        country: 'unknown',
      };
    }

    // Request foreground location permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied by user');
      return {
        latitude: null,
        longitude: null,
        city: 'unknown',
        country: 'unknown',
      };
    }

    // Get current position with timeout and accuracy settings
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Use balanced accuracy for better performance
      timeout: 10000, // 10-second timeout
    });
    const { latitude, longitude } = location.coords;

    // Perform reverse geocoding
    let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = geocode[0] || {};

    return {
      latitude,
      longitude,
      city: address.city || 'unknown',
      country: address.country || 'unknown',
    };
  } catch (error) {
    console.error('Error getting location:', error.message);
    return {
      latitude: null,
      longitude: null,
      city: 'unknown',
      country: 'unknown',
    };
  }
};

  const showAlert = (message, type = 'info') => {
    setAlert({ visible: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUser(response.data.data);
        await fetchLinkedAccounts(token);
      } else {
        setUser(null);
        await AsyncStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error checking Auth:', err);
      setUser(null);
      await AsyncStorage.removeItem('token');
      if (err.response?.status === 401) {
      showAlert('Your account no longer exists or the session is invalid. Please register or log in with a valid account.', 'error');
    } else {
      showAlert('An error occurred while checking authentication. Please try again.', 'error');
    }
    } finally {
      setIsLoading(false);
    }
  }, [fetchLinkedAccounts]);

  const fetchLinkedAccounts = useCallback(async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/linked-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setLinkedAccounts(response.data.data);
      } else {
      showAlert('Failed to fetch linked accounts', 'error');
    }
    } catch (err) {
      console.error('Error fetching linked accounts:', err);
    }
  }, []); 

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const location = await getUserLocation();
     console.log('Location sent to backend for login:', location);

      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password, location });
      const { success, data } = response.data;

      if (success) {
        await AsyncStorage.setItem('token', data.token);
        setUser({
          _id: data._id,
          email: data.email,
          username: data.username,
        });
        setLinkedAccounts(data.activeSessions || []);
        setError(null);
        showAlert('Login successful!', 'success');
        await fetchLinkedAccounts(data.token);
        await fetchUserProfile();
        return true;
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      showAlert(errorMsg, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const linkAccount = async (email, password) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
      throw new Error('No token found in AsyncStorage');
    }

      const response = await axios.post(
        `${API_URL}/api/auth/link-account`,
        { email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { success } = response.data;

      if (success) {
        await fetchLinkedAccounts(token);
        showAlert('Account linked successfully!', 'success');
        return true;
      } else {
        throw new Error('Failed to link account');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to link account';
      setError(errorMsg);
      showAlert(errorMsg, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
      if (!user) return;
      setIsLoading(false);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

  const switchAccount = async (accountId) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/auth/switch-account`,
        { accountId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { success, data } = response.data;

      if (success) {
        await AsyncStorage.setItem('token', data.token);
        setUser({
          _id: data._id,
          email: data.email,
          username: data.username,
        });
        await fetchLinkedAccounts(data.token);
        await fetchUserProfile();
        showAlert('Switched account successfully!', 'success');
        return true;
      } else {
        throw new Error('Failed to switch account');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to switch account';
      setError(errorMsg);
      showAlert(errorMsg, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
  setIsLoading(true);
  try {
    const location = await getUserLocation();
    console.log('Location sent to backend:', location);
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      ...userData,
      location
    });
    
    // Properly handle nested response data
    const { success, data } = response.data;
    
    if (success) {
      console.log('Registration successful, token:', data.token);
      await AsyncStorage.setItem('token', data.token);
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Stored token:', storedToken);
      setUser({
        _id: data._id,
        email: data.email,
        username: data.username,
        isVerified: false
      });
      setError(null);
      showAlert('Registration successful! Please verify your email.', 'success');
      return true;
    } else {
      throw new Error('Registration failed');
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
    setError(errorMsg);
    showAlert(errorMsg, 'error');
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const verifyUser = async (code) => {
    setIsLoading(true);
    try {
      console.log('Verifying OTP:', code); // Debug log
      const response = await axios.post(`${API_URL}/api/auth/verify`, { code });
      console.log('Verification response:', response.data); // Debug log
      if (response.data.success) {
        setUser({ ...user, isVerified: true });
        fetchLinkedAccounts(await AsyncStorage.getItem('token'));
        showAlert('Account verified successfully!', 'success');
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      console.error('Verification error:', err); // Debug log
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async ({ email }) => {
    setIsLoading(true);
    try {
      console.log('Resending OTP for email:', email); // Debug log
      const response = await axios.post(`${API_URL}/api/auth/resend-verification`, { email });
      console.log('Resend response:', response.data); // Debug log
      if (response.data.success) {
        setError(null);
        showAlert('New OTP sent to your email', 'success');
        return true;
      }
      return false;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to resend OTP';
      console.error('Resend error:', err); // Debug log
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await AsyncStorage.removeItem('token');
      router.replace('/login');
      setUser(null);
      setLinkedAccounts([]);
      setError(null);
      showAlert('Logged out successfully!', 'success');
    } catch (err) {
      setError('Logout failed');
      console.error('Error logging out:', err);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        linkedAccounts,
        isLoading,
        error,
        login,
        register,
        verifyUser,
        resendVerificationCode,
        logout,
        checkAuth,
        hideAlert,
        linkAccount,
        switchAccount,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};