// components/CustomAlert.js
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { getThemeColors } from '../../utils/theme';

const { width } = Dimensions.get('window');

const CustomAlert = () => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { alert, hideAlert } = useAlert();
  const { visible, message, type = 'info', duration = 3000, action } = alert;
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, handleClose, translateY, opacity, scale]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideAlert();
    });
  }, [hideAlert, translateY, opacity, scale]);


  if (!visible) return null;

  const alertStyles = {
    info: {
      backgroundColor: isDark ? '#1E3A8A' : '#BFDBFE',
      icon: 'ℹ️',
      borderColor: isDark ? '#3B82F6' : '#60A5FA',
    },
    success: {
      backgroundColor: isDark ? '#14532D' : '#BBF7D0',
      icon: '✅',
      borderColor: isDark ? '#22C55E' : '#4ADE80',
    },
    error: {
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
      icon: '❌',
      borderColor: isDark ? '#EF4444' : '#F87171',
    },
    warning: {
      backgroundColor: isDark ? '#713F12' : '#FEF9C3',
      icon: '⚠️',
      borderColor: isDark ? '#F59E0B' : '#FBBF24',
    },
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: alertStyles[type].backgroundColor,
          borderColor: alertStyles[type].borderColor,
          transform: [{ translateY }, { scale }],
          opacity,
          shadowColor: isDark ? '#000' : '#333',
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { color: colors.text }]}>
          {alertStyles[type].icon}
        </Text>
        <Text
          style={[styles.message, { color: isDark ? colors.text : '#111827' }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {message}
        </Text>
        <View style={styles.buttonContainer}>
          {action && (
            <TouchableOpacity
              onPress={action}
              style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: colors.primary }]}>Open Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeText, { color: colors.text }]}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    maxWidth: width - 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default CustomAlert;