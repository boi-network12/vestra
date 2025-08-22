
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Host } from 'react-native-portalize'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import "../global.css"
import { AlertProvider } from '../context/AlertContext'
import CustomAlert from '../components/custom/CustomAlert'

const AppContent = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AlertProvider>
                    <UserProvider>
                        <Host>
                            <Stack screenOptions={{ 
                                headerShown: false,
                                animation: 'fade',
                                contentStyle: {
                                    backgroundColor: "transparent"
                                }
                            }} />
                            <CustomAlert />
                        </Host>
                    </UserProvider>
                </AlertProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppContent />
        </GestureHandlerRootView>
    )
}