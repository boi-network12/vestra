"use client";
import { useAuth } from "@/hooks/authHooks";
import { useEffect, useState } from "react";
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
        router.replace("/home");
        }
    };

    useEffect(() => {
        if (
        error &&
        error.toLowerCase().includes("please verify your account")
        ) {
        localStorage.setItem("pendingVerificationEmail", form.email);
        setTimeout(() => {
            router.push(`/verify?email=${encodeURIComponent(form.email)}`);
        }, 1000); // Delay to allow toast to display
        }
    }, [error, form.email, router]);

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