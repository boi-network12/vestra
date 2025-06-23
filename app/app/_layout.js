
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Host } from 'react-native-portalize'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import "../global.css"

const AppContent = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <UserProvider>
                    <Host>
                        <Stack screenOptions={{ 
                            headerShown: false,
                            animation: 'fade',
                            contentStyle: {
                                backgroundColor: "transparent"
                            }
                        }} />
                    </Host>
                </UserProvider>
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