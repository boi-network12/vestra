
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Host } from 'react-native-portalize'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import "../global.css"
import { AlertProvider } from '../context/AlertContext'
import CustomAlert from '../components/custom/CustomAlert'
import { FriendProvider } from '../context/FriendContext'

const AppContent = () => {
  return (
    <ThemeProvider>
      <AlertProvider>
        <FriendProvider>
          <AuthProvider>
            <UserProvider>
              <Host>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: {
                      backgroundColor: 'transparent',
                    },
                  }}
                />
                <CustomAlert />
              </Host>
            </UserProvider>
          </AuthProvider>
        </FriendProvider>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}
