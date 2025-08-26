import { Redirect, router } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SplashLoading from '../Loading/SplashLoading';
import SplashScreen from './splash';

export default function Index() {
    const [showSplash, setShowSplash] = useState(true);
    const { user, isLoading } = useAuth()

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000)
        return () => clearTimeout(timer);
    },[])

    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/home')
        }
    }, [isLoading, user])

    useEffect(() => {
        SystemUI.setBackgroundColorAsync('transparent');
    }, [])

    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    if (isLoading) {
        return (
            <SplashLoading />
        )
    }

    if (!user) {
        return <Redirect href="/get-started" />
    }

  return null;
}
// This file is the entry point for the app, it handles the splash screen and redirects based on authentication status.