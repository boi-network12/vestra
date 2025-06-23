"use client";
import { useAuth } from "@/hooks/authHooks";
import { useState } from "react";
import {
  isMobile,
  isTablet,
  isBrowser,
} from "react-device-detect";
import MobileLogin from "../components/MobileLogin";
import TabletLogin from "../components/TabletLogin";
import BrowserLogin from "../components/BrowserLogin";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


interface FormErrors {
    email?: string;
    password?: string;
}


export default function Login() {
    const { isLoading, error, login } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [form, setForm] = useState({
        email: '',
        password: '',
        rememberMe: false
    })

    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            newErrors.email = 'Invalid email address';
        }
        if (form.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const loginData = {
            email: form.email,
            password: form.password,
        };

        const success = await login(loginData);

        if (success) {
            router.replace("/home")
        } else if (error && error.toLowerCase().includes('verify your account')) {
            await localStorage.setItem('pending verification', form.email);
            toast.info("please verify your email");
            setTimeout(() => {
                console.log('Navigating to verify with email:', form.email); // Debug log
                router.push(`/verify?email=${encodeURIComponent(form.email)}`);
            }, 1000)
        } else if (error && error.includes('Too many verification requests')) {
            toast.warning("")
        } else {
            toast.error("Login failed ")
        }
    };

    const shareProps = {
        form,
        setForm,
        showPassword,
        setShowPassword,
        errors,
        handleSubmit,
        isLoading,
        error,
    }
    
    return (
        <div>
            {isMobile && !isTablet && (
                <MobileLogin {...shareProps}/>
            )}

            {isTablet && (
                <TabletLogin {...shareProps}/>
            )}

            {isBrowser && !isMobile && !isTablet && (
                <BrowserLogin {...shareProps}/>
            )}
        </div>
    )
}