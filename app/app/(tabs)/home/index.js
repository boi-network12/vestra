import { StatusBar } from 'expo-status-bar'
import { SafeAreaView, StyleSheet, Text } from 'react-native'

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style='auto'  />
      <Text>Home</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})